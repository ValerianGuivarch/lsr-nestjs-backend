import { Injectable, OnModuleInit, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import seed from './reputation-seed'

@Injectable()
export class Pf2ReputationService implements OnModuleInit {
  constructor(@InjectDataSource('pf2-sqlite') private readonly db: DataSource) {}
  async onModuleInit() {
    await this.db.query(`CREATE TABLE IF NOT EXISTS pf2_reputation_group (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE COLLATE NOCASE, sort_order INTEGER NOT NULL DEFAULT 0)`)
    await this.db.query(`CREATE TABLE IF NOT EXISTS pf2_reputation (id INTEGER PRIMARY KEY AUTOINCREMENT, group_id INTEGER NOT NULL REFERENCES pf2_reputation_group(id), name TEXT NOT NULL UNIQUE COLLATE NOCASE, score INTEGER NOT NULL DEFAULT 0 CHECK(score BETWEEN -50 AND 50), sort_order INTEGER NOT NULL DEFAULT 0)`)
    await this.db.query(`CREATE TABLE IF NOT EXISTS pf2_reputation_history (id INTEGER PRIMARY KEY AUTOINCREMENT, reputation_id INTEGER NOT NULL, previous_score INTEGER NOT NULL, new_score INTEGER NOT NULL, delta INTEGER NOT NULL, reason TEXT NOT NULL DEFAULT '', changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`)
    // Seed once, only when there is no data. Never overwrite later GM changes.
    await this.db.transaction(async manager => {
      const rows = await manager.query('SELECT COUNT(*) as count FROM pf2_reputation_group')
      if (Number(rows[0].count) !== 0) return
      for (const [groupOrder,group] of seed.entries()) {
        await manager.query('INSERT INTO pf2_reputation_group(name,sort_order) VALUES (?,?)',[group.name,groupOrder])
        const id = (await manager.query('SELECT last_insert_rowid() as id'))[0].id
        for (const [order,entry] of group.entries.entries()) await manager.query('INSERT INTO pf2_reputation(group_id,name,score,sort_order) VALUES (?,?,?,?)',[id,entry.name,entry.score,order])
      }
    })
  }
  async list() {
    const groups = await this.db.query('SELECT id,name,sort_order FROM pf2_reputation_group ORDER BY sort_order,id')
    const items = await this.db.query('SELECT id,group_id,name,score,sort_order FROM pf2_reputation ORDER BY sort_order,id')
    return groups.map((g: any)=>({...g,entries:items.filter((r:any)=>r.group_id===g.id)}))
  }
  private name(value:unknown) {if(typeof value!=='string'||!value.trim()||value.trim().length>120) throw new BadRequestException('Nom invalide (1–120 caractères)');return value.trim()}
  private integer(value:unknown,min:number,max:number) {if(typeof value!=='number'||!Number.isInteger(value)||value<min||value>max)throw new BadRequestException('Valeur entière hors limites');return value}
  async createGroup(name:unknown) {
    const n=this.name(name)
    if((await this.db.query('SELECT id FROM pf2_reputation_group WHERE name=? COLLATE NOCASE',[n])).length)throw new ConflictException('Groupe existant')
    await this.db.query('INSERT INTO pf2_reputation_group(name,sort_order) VALUES (?,(SELECT COALESCE(MAX(sort_order),-1)+1 FROM pf2_reputation_group))',[n]);return this.list()
  }
  async create(name:unknown, groupId:unknown) {
    const n=this.name(name),g=this.integer(groupId,1,2147483647)
    if(!(await this.db.query('SELECT id FROM pf2_reputation_group WHERE id=?',[g])).length)throw new NotFoundException('Groupe inconnu')
    if((await this.db.query('SELECT id FROM pf2_reputation WHERE name=? COLLATE NOCASE',[n])).length)throw new ConflictException('Réputation existante')
    await this.db.query('INSERT INTO pf2_reputation(group_id,name,score,sort_order) VALUES (?,?,0,(SELECT COALESCE(MAX(sort_order),-1)+1 FROM pf2_reputation WHERE group_id=?))',[g,n,g]);return this.list()
  }
  async move(id:unknown,groupId:unknown) {
    const i=this.integer(id,1,2147483647),g=this.integer(groupId,1,2147483647)
    if(!(await this.db.query('SELECT id FROM pf2_reputation WHERE id=?',[i])).length)throw new NotFoundException('Réputation inconnue')
    if(!(await this.db.query('SELECT id FROM pf2_reputation_group WHERE id=?',[g])).length)throw new NotFoundException('Groupe inconnu')
    await this.db.query('UPDATE pf2_reputation SET group_id=?,sort_order=(SELECT COALESCE(MAX(sort_order),-1)+1 FROM pf2_reputation WHERE group_id=?) WHERE id=?',[g,g,i]);return this.list()
  }
  async change(id:unknown,score:unknown,reason:unknown) {
    const i=this.integer(id,1,2147483647),v=this.integer(score,-50,50)
    const note=typeof reason==='string'?reason.trim():''
    if(note.length>500)throw new BadRequestException('Motif trop long')
    await this.db.transaction(async m=>{
      const rows=await m.query('SELECT score FROM pf2_reputation WHERE id=?',[i]);if(!rows.length)throw new NotFoundException('Réputation inconnue')
      const previous=Number(rows[0].score)
      if(previous===v)return
      await m.query('UPDATE pf2_reputation SET score=? WHERE id=?',[v,i])
      await m.query('INSERT INTO pf2_reputation_history(reputation_id,previous_score,new_score,delta,reason) VALUES (?,?,?,?,?)',[i,previous,v,v-previous,note])
    });return this.list()
  }
}
