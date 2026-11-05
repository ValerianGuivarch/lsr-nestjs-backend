import { BadRequestException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'

@Injectable()
export class Pf2RelationService implements OnModuleInit {
  constructor(@InjectDataSource('pf2-sqlite') private readonly db: DataSource) {}

  async onModuleInit() {
    await this.db.query(`CREATE TABLE IF NOT EXISTS pf2_player_character_relation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_npc_id TEXT NOT NULL REFERENCES pf2_player_character_profile(npc_id),
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      score INTEGER NOT NULL DEFAULT 0 CHECK(score BETWEEN -50 AND 50),
      linked_npc_id TEXT REFERENCES pf2_player_character_profile(npc_id)
    )`)
    await this.db.query('CREATE INDEX IF NOT EXISTS idx_pf2_relation_player ON pf2_player_character_relation(player_npc_id)')
    await this.db.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_pf2_relation_linked_npc ON pf2_player_character_relation(player_npc_id, linked_npc_id) WHERE linked_npc_id IS NOT NULL')
  }

  private async authorize(playerId: string, wikiUsername: string, admin: boolean) {
    const rows = await this.db.query('SELECT 1 FROM pf2_player_character_profile WHERE npc_id=? AND is_player=1 LIMIT 1', [playerId])
    if (!rows.length) throw new NotFoundException('PJ introuvable.')
    if (admin) return
    const access = await this.db.query(`SELECT 1 FROM pf2_player_character_owner o
      JOIN pf2_wiki_account_link a ON a.discord_user_id=o.discord_user_id
      WHERE o.npc_id=? AND a.wiki_username=? COLLATE NOCASE LIMIT 1`, [playerId, wikiUsername])
    if (!access.length) throw new ForbiddenException('Ce personnage ne vous appartient pas.')
  }

  private validateText(value: unknown, name: string, max: number, required = false): string {
    if (typeof value !== 'string') throw new BadRequestException(name + ' invalide.')
    const text = value.trim()
    if ((required && !text) || text.length > max) throw new BadRequestException(name + ' invalide (maximum ' + max + ' caractères).')
    return text
  }

  async list(playerId: string, wikiUsername: string, admin: boolean) {
    await this.authorize(playerId, wikiUsername, admin)
    const rows = await this.db.query(`SELECT r.id, r.player_npc_id AS playerNpcId,
      r.name, r.description, r.score, r.linked_npc_id AS linkedNpcId,
      CASE WHEN p.npc_id IS NOT NULL AND
        (p.is_published=1 OR c.contact_npc_id IS NOT NULL)
        THEN p.wiki_page_title ELSE NULL END AS linkedWikiPageTitle,
      CASE WHEN p.npc_id IS NOT NULL AND
        (p.is_published=1 OR c.contact_npc_id IS NOT NULL) THEN 1 ELSE 0 END AS linkVisible
      FROM pf2_player_character_relation r
      LEFT JOIN pf2_player_character_profile p ON p.npc_id=r.linked_npc_id
      LEFT JOIN pf2_player_character_contact c ON c.player_npc_id=r.player_npc_id AND c.contact_npc_id=r.linked_npc_id
      WHERE r.player_npc_id=? ORDER BY r.score DESC, r.name COLLATE NOCASE`, [playerId])
    return rows.map((row: any) => ({
      id: row.id, name: row.name, description: row.description, score: row.score,
      linkedNpcId: admin ? row.linkedNpcId : (row.linkVisible ? row.linkedNpcId : null),
      linkedWikiPageTitle: row.linkedWikiPageTitle
    }))
  }

  async change(playerId: string, body: Record<string, unknown>, wikiUsername: string, admin: boolean) {
    if (!admin) throw new ForbiddenException('MJ uniquement.')
    await this.authorize(playerId, wikiUsername, true)
    const operation = String(body.operation ?? '')
    if (operation === 'delete') {
      const id = Number(body.id)
      if (!Number.isSafeInteger(id) || id < 1) throw new BadRequestException('Identifiant invalide.')
      const exists = await this.db.query('SELECT 1 FROM pf2_player_character_relation WHERE id=? AND player_npc_id=?', [id,playerId])
      if (!exists.length) throw new NotFoundException('Relation introuvable.')
      await this.db.query('DELETE FROM pf2_player_character_relation WHERE id=? AND player_npc_id=?', [id,playerId])
      return this.list(playerId,wikiUsername,true)
    }
    if (operation !== 'create' && operation !== 'update') throw new BadRequestException('Opération inconnue.')
    const name = this.validateText(body.name,'Nom',120,true)
    const description = this.validateText(body.description ?? '','Description',500)
    const score = Number(body.score ?? 0)
    if (!Number.isInteger(score) || score < -50 || score > 50) throw new BadRequestException('Score hors limites.')
    const linkedNpcId = body.linkedNpcId == null || body.linkedNpcId === '' ? null : this.validateText(body.linkedNpcId,'PNJ',150,true)
    if (linkedNpcId) {
      const link = await this.db.query('SELECT 1 FROM pf2_player_character_profile WHERE npc_id=? AND is_player=0 LIMIT 1',[linkedNpcId])
      if (!link.length) throw new BadRequestException('PNJ lié introuvable dans le carnet.')
    }
    if (operation === 'create') {
      await this.db.query('INSERT INTO pf2_player_character_relation(player_npc_id,name,description,score,linked_npc_id) VALUES (?,?,?,?,?)',
        [playerId,name,description,score,linkedNpcId])
    } else {
      const id = Number(body.id)
      if (!Number.isSafeInteger(id) || id < 1) throw new BadRequestException('Identifiant invalide.')
      const existing = await this.db.query('SELECT 1 FROM pf2_player_character_relation WHERE id=? AND player_npc_id=?',[id,playerId])
      if (!existing.length) throw new NotFoundException('Relation introuvable.')
      await this.db.query('UPDATE pf2_player_character_relation SET name=?,description=?,score=?,linked_npc_id=? WHERE id=? AND player_npc_id=?',
        [name,description,score,linkedNpcId,id,playerId])
    }
    return this.list(playerId,wikiUsername,true)
  }
}
