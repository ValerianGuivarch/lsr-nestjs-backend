import { BadRequestException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'

export const zodiac = [
  [1218, 'La Grive', 'renouveau, opportunité'],
  [121, 'Le Porteur de lanterne', 'protection, guidance'],
  [217, 'Les Jeunes Mariés', 'amour, engagement'],
  [312, 'Le Pont', 'transition, changement'],
  [419, 'La Fille', 'joie, liberté'],
  [514, 'Le Cavalier', 'courage, défense'],
  [621, 'Le Patriarche', 'autorité, responsabilité'],
  [721, 'Le Chariot', 'voyage, solidarité'],
  [811, 'La Meute', 'loyauté, instinct'],
  [917, 'La Mère', 'soin, réconfort'],
  [1031, "L’Observateur des étoiles", 'savoir, découverte'],
  [1121, "L’Étranger", 'mystère, indépendance'],
  [1130, 'Le Suiveur', 'mort, fin de cycle'],
] as const

// The Thrush starts on 18 Kuthona and wraps across the new year.
export function cosmicSign(month: number, day: number) {
  const date = month * 100 + day
  const sign = date >= 1218 || date < 121 ? zodiac[0] :
    [...zodiac.slice(1)].reverse().find(entry => date >= entry[0])!
  return { sign: sign[1], themes: sign[2] }
}

@Injectable()
export class Pf2HoroscopeService implements OnModuleInit {
  constructor(@InjectDataSource('pf2-sqlite') private readonly db: DataSource) {}

  async onModuleInit() {
    await this.db.query(`CREATE TABLE IF NOT EXISTS pf2_player_character_horoscope (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_npc_id TEXT NOT NULL REFERENCES pf2_player_character_profile(npc_id),
      target_npc_id TEXT NOT NULL REFERENCES pf2_player_character_profile(npc_id),
      birth_month INTEGER NOT NULL CHECK(birth_month BETWEEN 1 AND 12),
      birth_day INTEGER NOT NULL CHECK(birth_day BETWEEN 1 AND 31),
      roll INTEGER NOT NULL,
      interpretation TEXT NOT NULL DEFAULT '',
      UNIQUE(player_npc_id,target_npc_id)
    )`)
    const columns = await this.db.query('PRAGMA table_info(pf2_player_character_horoscope)')
    if (!columns.some((c:any) => c.name === 'interpretation')) {
      await this.db.query("ALTER TABLE pf2_player_character_horoscope ADD COLUMN interpretation TEXT NOT NULL DEFAULT ''")
    }
  }

  private async authorize(playerId: string, username: string, admin: boolean) {
    if (playerId !== 'npc_pj_eryn') throw new ForbiddenException('Carnet réservé à Eryn.')
    const rows = await this.db.query('SELECT 1 FROM pf2_player_character_profile WHERE npc_id=? AND is_player=1', [playerId])
    if (!rows.length) throw new NotFoundException('PJ introuvable.')
    if (admin) return
    const owners = await this.db.query(`SELECT 1 FROM pf2_player_character_owner o
      JOIN pf2_wiki_account_link a ON a.discord_user_id=o.discord_user_id
      WHERE o.npc_id=? AND a.wiki_username=? COLLATE NOCASE LIMIT 1`, [playerId, username])
    if (!owners.length) throw new ForbiddenException('Ce personnage ne vous appartient pas.')
  }

  private async candidates(playerId: string) {
    return this.db.query(`SELECT p.npc_id AS npcId, p.display_name AS name,
      CASE WHEN p.is_published=1 OR p.is_player=1 OR c.portrait_known=1
        THEN p.wiki_portrait_filename ELSE NULL END AS portrait
      FROM pf2_player_character_profile p
      LEFT JOIN pf2_player_character_contact c ON c.contact_npc_id=p.npc_id AND c.player_npc_id=?
      WHERE p.is_player=1 OR p.is_published=1 OR c.contact_npc_id IS NOT NULL
      ORDER BY p.display_name COLLATE NOCASE`, [playerId]) as Promise<Array<{npcId:string; name:string; portrait:string|null}>>
  }

  async list(playerId: string, username: string, admin: boolean) {
    await this.authorize(playerId, username, admin)
    const candidates = await this.candidates(playerId)
    const byId = new Map(candidates.map(c => [c.npcId,c]))
    const rows = await this.db.query(`SELECT id,target_npc_id AS npcId,birth_month AS month,
      birth_day AS day,roll,interpretation FROM pf2_player_character_horoscope
      WHERE player_npc_id=? ORDER BY id`, [playerId])
    return { zodiac: zodiac.map(([start,sign,themes]) => ({start,sign,themes})), candidates, horoscopes: rows.filter((r:any) => byId.has(r.npcId))
      .map((r:any) => ({ ...r, ...byId.get(r.npcId), ...cosmicSign(r.month,r.day) })) }
  }

  async save(playerId: string, body: Record<string, unknown>, username: string, admin: boolean) {
    await this.authorize(playerId, username, admin)
    const id = Number(body.id ?? 0)
    if (!Number.isSafeInteger(id) || id < 0) throw new BadRequestException('Identifiant invalide.')
    if (body.operation === 'delete') {
      if (!id) throw new BadRequestException('Identifiant manquant.')
      await this.db.query('DELETE FROM pf2_player_character_horoscope WHERE id=? AND player_npc_id=?',[id,playerId])
      return this.list(playerId,username,admin)
    }
    if (body.operation != null && body.operation !== 'save') throw new BadRequestException('Opération inconnue.')
    const npcId = String(body.targetNpcId ?? '')
    if (!(await this.candidates(playerId)).some(c => c.npcId === npcId)) throw new BadRequestException('Personnage inconnu.')
    const month = Number(body.month), day = Number(body.day), roll = Number(body.roll)
    const interpretation = body.interpretation ?? ''
    const days = [31,29,31,30,31,30,31,31,30,31,30,31]
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > days[month-1]
      || typeof interpretation !== 'string' || interpretation.length > 5000
      || body.roll === '' || body.roll == null || !Number.isSafeInteger(roll) || roll < -100 || roll > 100)
      throw new BadRequestException('Date ou résultat du jet invalide.')
    if (id) {
      const existing = await this.db.query('SELECT 1 FROM pf2_player_character_horoscope WHERE id=? AND player_npc_id=?',[id,playerId])
      if (!existing.length) throw new NotFoundException('Horoscope introuvable.')
      const duplicate = await this.db.query('SELECT 1 FROM pf2_player_character_horoscope WHERE player_npc_id=? AND target_npc_id=? AND id<>?',[playerId,npcId,id])
      if (duplicate.length) throw new BadRequestException('Ce personnage possède déjà un horoscope.')
      await this.db.query('UPDATE pf2_player_character_horoscope SET target_npc_id=?,birth_month=?,birth_day=?,roll=?,interpretation=? WHERE id=? AND player_npc_id=?',
        [npcId,month,day,roll,interpretation,id,playerId])
    } else {
      await this.db.query(`INSERT INTO pf2_player_character_horoscope(player_npc_id,target_npc_id,birth_month,birth_day,roll,interpretation)
        VALUES (?,?,?,?,?,?) ON CONFLICT(player_npc_id,target_npc_id) DO UPDATE SET
        birth_month=excluded.birth_month,birth_day=excluded.birth_day,roll=excluded.roll,interpretation=excluded.interpretation`,
        [playerId,npcId,month,day,roll,interpretation])
    }
    return this.list(playerId,username,admin)
  }
}
