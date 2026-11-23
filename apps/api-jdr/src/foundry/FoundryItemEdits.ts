import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { randomUUID } from 'node:crypto'
import type { DataSource, EntityManager } from 'typeorm'

const WORLD = 'test-pf2'
const ITEM = /^Actor\.([A-Za-z0-9]{16})\.Item\.([A-Za-z0-9]{16})$/
const ID = /^[0-9a-f-]{36}$/i
const MAX_TEXT = 12000
const validateWorld = (world: unknown) => { if (world !== WORLD) throw new BadRequestException('Monde Foundry invalide.') }

type EditRow = { id:string; item_uuid:string; expected_name:string; expected_description:string; name:string|null; description:string|null; status:string; claim_token:string|null }
const toJob = (r:EditRow) => ({ id:r.id,itemUuid:r.item_uuid,expectedName:r.expected_name,expectedDescription:r.expected_description,name:r.name,description:r.description,status:r.status,token:r.status==='applying'?r.claim_token:null })

export async function migrateFoundryItemEdits(manager: EntityManager) {
  await manager.query(`CREATE TABLE IF NOT EXISTS pf2_foundry_item_edit (
    id TEXT PRIMARY KEY, item_uuid TEXT NOT NULL,
    expected_name TEXT NOT NULL, expected_description TEXT NOT NULL,
    name TEXT, description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','applying','applied','review')),
    claim_token TEXT UNIQUE, error TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
  await manager.query('CREATE INDEX IF NOT EXISTS idx_pf2_foundry_item_edit_pending ON pf2_foundry_item_edit(status,created_at)')
}

@Injectable()
export class FoundryItemEdits {
  constructor(@InjectDataSource('pf2-sqlite') private readonly db: DataSource) {}

  async enqueue(raw: unknown) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new BadRequestException('Modification invalide.')
    const v = raw as Record<string,unknown>
    const uuid = v['itemUuid'], expectedName = v['expectedName'], expectedDescription = v['expectedDescription']
    if (typeof uuid !== 'string' || !ITEM.test(uuid) || typeof expectedName !== 'string' || typeof expectedDescription !== 'string'
      || expectedName.length > 300 || expectedDescription.length > MAX_TEXT) throw new BadRequestException('Item ou valeurs attendues invalides.')
    const name = v['name'], description = v['description']
    if ((name === undefined && description === undefined) || (name !== undefined && (typeof name !== 'string' || !name.trim() || name.length > 300))
      || (description !== undefined && (typeof description !== 'string' || description.length > MAX_TEXT))) throw new BadRequestException('Nouveau nom ou description invalide.')
    if (Object.keys(v).some(k=>!['itemUuid','expectedName','expectedDescription','name','description'].includes(k))) throw new BadRequestException('Champ inconnu.')
    const existing = await this.db.query("SELECT id FROM pf2_foundry_item_edit WHERE item_uuid=? AND status IN ('pending','applying','review') LIMIT 1",[uuid]) as Array<{id:string}>
    if (existing.length) throw new ConflictException('Une correction est déjà en cours ou à vérifier pour cet objet.')
    const id = randomUUID()
    await this.db.query('INSERT INTO pf2_foundry_item_edit(id,item_uuid,expected_name,expected_description,name,description) VALUES (?,?,?,?,?,?)',
      [id,uuid,expectedName,expectedDescription,name ?? null,description ?? null])
    return { id, status:'pending' }
  }

  async list(world: unknown) {
    validateWorld(world)
    const rows = await this.db.query("SELECT * FROM pf2_foundry_item_edit WHERE status IN ('pending','applying','review') ORDER BY created_at LIMIT 30") as EditRow[]
    return rows.map(toJob)
  }

  async claim(world: unknown,id:unknown) {
    validateWorld(world)
    if(typeof id!=='string' || !ID.test(id)) throw new BadRequestException('ID de correction invalide.')
    const token=randomUUID()
    await this.db.query("UPDATE pf2_foundry_item_edit SET status='applying',claim_token=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'",[token,id])
    const rows=await this.db.query('SELECT * FROM pf2_foundry_item_edit WHERE claim_token=?',[token]) as EditRow[]
    return rows[0] ? {...toJob(rows[0]),token} : null
  }

  async finish(world: unknown,token:unknown,status:unknown,error:unknown) {
    validateWorld(world)
    if(typeof token!=='string'||!ID.test(token)||!['applied','review'].includes(String(status)) || (error!==undefined && (typeof error!=='string'||error.length>500))) throw new BadRequestException('Résultat invalide.')
    await this.db.query("UPDATE pf2_foundry_item_edit SET status=?,error=?,updated_at=CURRENT_TIMESTAMP WHERE claim_token=? AND status='applying'",[status,error??'',token])
    const rows=await this.db.query('SELECT status FROM pf2_foundry_item_edit WHERE claim_token=?',[token]) as Array<{status:string}>
    if(rows[0]?.status!==status) throw new ConflictException('Correction inconnue ou déjà traitée.')
    return {saved:true}
  }

  async status(id:string) {
    if(!ID.test(id)) throw new BadRequestException('ID invalide.')
    const rows=await this.db.query('SELECT id,item_uuid,status,error,updated_at FROM pf2_foundry_item_edit WHERE id=?',[id]) as Array<Record<string,unknown>>
    if(!rows[0]) throw new BadRequestException('Correction inconnue.')
    return rows[0]
  }
}
