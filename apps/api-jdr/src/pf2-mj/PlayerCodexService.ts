import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { randomUUID } from 'node:crypto'
import { DataSource } from 'typeorm'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'

type ProfileRow = { npc_id: string; wiki_page_title: string; display_name: string; wiki_portrait_filename: string | null; is_player: number; created_at: string; updated_at: string }
type FactionRow = { id: string; name: string; normalized_name: string; parent_faction_id: string | null; wiki_page_title: string; created_at: string; updated_at: string }

@Injectable()
export class PlayerCodexService {
  private readonly logger = new Logger(PlayerCodexService.name)
  constructor(@InjectDataSource('pf2-sqlite') private readonly db: DataSource, private readonly persistence: Pf2PersistenceService) {}

  async characterCandidates(prefix: string): Promise<Array<{ id: string; name: string; portrait: string | null }>> {
    const term = prefix.trim().toLocaleLowerCase()
    const records = await this.persistence.listRecords('pnj')
    return records.flatMap(record => {
      const id = typeof record.id === 'string' ? record.id : ''
      const name = typeof record.nom === 'string' ? record.nom : typeof record.name === 'string' ? record.name : ''
      if (!id || !name || (term && !name.toLocaleLowerCase().startsWith(term))) return []
      return [{ id, name, portrait: typeof record.portrait === 'string' ? record.portrait : null }]
    }).slice(0, 25)
  }
  async characterCandidate(id: string): Promise<{ id: string; name: string; portrait: string | null } | null> {
    const record = await this.persistence.getRecord('pnj', id)
    if (!record) return null
    const name = typeof record.nom === 'string'
      ? record.nom
      : typeof record.name === 'string'
        ? record.name
        : ''
    if (!name) return null
    return {
      id,
      name,
      portrait: typeof record.portrait === 'string' ? record.portrait : null,
    }
  }

  async createPresentation(input: { name: string; sourceNpcId?: string | null; portraitUrl?: string | null; showName?: boolean; channelId: string; messageId?: string | null }): Promise<{ id: string; name: string; showName: boolean; portraitUrl: string | null }> {
    const sourceNpcId = input.sourceNpcId ?? null
    if (sourceNpcId && !(await this.persistence.getRecord('pnj', sourceNpcId))) throw new NotFoundException('PNJ MJ introuvable.')
    if (!sourceNpcId && !input.portraitUrl) throw new BadRequestException('Un portrait est obligatoire pour un personnage improvisé.')
    const id = randomUUID(); const name = this.required(input.name, 'Nom')
    await this.db.query('INSERT INTO pf2_character_presentation (id, discord_message_id, discord_channel_id, source_npc_id, presented_name, show_name, presented_image_url) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, input.messageId ?? null, input.channelId, sourceNpcId, name, input.showName === false ? 0 : 1, input.portraitUrl ?? null])
    return { id, name, showName: input.showName !== false, portraitUrl: input.portraitUrl ?? null }
  }
  async presentation(id: string): Promise<{ id: string; sourceNpcId: string | null; name: string; portraitUrl: string | null }> {
    const rows = await this.db.query('SELECT id, source_npc_id, presented_name, presented_image_url FROM pf2_character_presentation WHERE id=?', [id]) as Array<{ id: string; source_npc_id: string | null; presented_name: string; presented_image_url: string | null }>
    if (!rows[0]) throw new NotFoundException('Présentation Discord introuvable.')
    return { id: rows[0].id, sourceNpcId: rows[0].source_npc_id, name: rows[0].presented_name, portraitUrl: rows[0].presented_image_url }
  }
  async savePresentationMessage(id: string, messageId: string, portraitUrl: string | null): Promise<void> {
    await this.presentation(id)
    await this.db.query('UPDATE pf2_character_presentation SET discord_message_id=?, presented_image_url=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [messageId, portraitUrl, id])
  }
  async ensurePresentationCharacter(presentationId: string, displayName: string, wikiPageTitle: string): Promise<unknown> {
    const presentation = await this.presentation(presentationId)
    let npcId = presentation.sourceNpcId
    if (!npcId) {
      npcId = `player-${randomUUID()}`
      // This uses the canonical persistence service, not a parallel player table.
      await this.persistence.saveRecord('pnj', { id: npcId, nom: presentation.name, description: '', aliases: [], factions: [], tags: [], statut: 'Actif', scope: 'global' })
      await this.db.query('UPDATE pf2_character_presentation SET source_npc_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [npcId, presentationId])
    }
    try {
      const profile = await this.createCharacter({ npcId, displayName, wikiPageTitle })
      return { ...(profile as Record<string, unknown>), created: true }
    } catch (error) {
      if (error instanceof ConflictException) {
        const profile = await this.character(npcId)
        return { ...(profile as Record<string, unknown>), created: false }
      }
      throw error
    }
  }

  async listCharacters(): Promise<unknown[]> {
    const rows = await this.db.query('SELECT * FROM pf2_player_character_profile ORDER BY display_name COLLATE NOCASE') as ProfileRow[]
    return Promise.all(rows.map(row => this.characterDto(row)))
  }
  async listPlayers(): Promise<unknown[]> {
    const rows = await this.db.query('SELECT * FROM pf2_player_character_profile WHERE is_player = 1 ORDER BY display_name COLLATE NOCASE') as ProfileRow[]
    return Promise.all(rows.map(row => this.characterDto(row)))
  }
  async character(npcId: string): Promise<unknown> {
    const rows = await this.db.query('SELECT * FROM pf2_player_character_profile WHERE npc_id = ?', [npcId]) as ProfileRow[]
    if (!rows[0]) throw new NotFoundException('Personnage introuvable dans le carnet joueur.')
    return this.characterDto(rows[0])
  }
  async createCharacter(input: { npcId: string; displayName: string; wikiPageTitle: string; wikiPortraitFilename?: string | null; isPlayer?: boolean }): Promise<unknown> {
    const npc = await this.persistence.getRecord('pnj', input.npcId)
    if (!npc) throw new NotFoundException('PNJ MJ introuvable.')
    const displayName = this.required(input.displayName, 'Nom')
    const title = this.required(input.wikiPageTitle, 'Titre wiki')
    try {
      await this.db.query('INSERT INTO pf2_player_character_profile (npc_id, wiki_page_title, display_name, wiki_portrait_filename, is_player) VALUES (?, ?, ?, ?, ?)', [input.npcId, title, displayName, input.wikiPortraitFilename ?? null, input.isPlayer ? 1 : 0])
    } catch (error) { throw new ConflictException('Une fiche joueur existe déjà pour ce PNJ ou ce titre wiki est déjà utilisé.') }
    return this.character(input.npcId)
  }
  async updateCharacter(npcId: string, input: { displayName?: unknown; wikiPortraitFilename?: unknown; isPlayer?: unknown }): Promise<unknown> {
    await this.character(npcId)
    const name = typeof input.displayName === 'string' ? this.required(input.displayName, 'Nom') : null
    const portrait = typeof input.wikiPortraitFilename === 'string' ? input.wikiPortraitFilename.trim() || null : undefined
    if (name !== null) await this.db.query('UPDATE pf2_player_character_profile SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE npc_id = ?', [name, npcId])
    if (portrait !== undefined) await this.db.query('UPDATE pf2_player_character_profile SET wiki_portrait_filename = ?, updated_at = CURRENT_TIMESTAMP WHERE npc_id = ?', [portrait, npcId])
    if (typeof input.isPlayer === 'boolean') await this.db.query('UPDATE pf2_player_character_profile SET is_player = ?, updated_at = CURRENT_TIMESTAMP WHERE npc_id = ?', [input.isPlayer ? 1 : 0, npcId])
    return this.character(npcId)
  }
  async addCharacterFaction(npcId: string, factionId: string): Promise<unknown> {
    await this.character(npcId); await this.faction(factionId)
    await this.db.query('INSERT OR IGNORE INTO pf2_player_character_faction (npc_id, player_faction_id) VALUES (?, ?)', [npcId, factionId])
    return this.character(npcId)
  }
  async removeCharacterFaction(npcId: string, factionId: string): Promise<void> { await this.db.query('DELETE FROM pf2_player_character_faction WHERE npc_id = ? AND player_faction_id = ?', [npcId, factionId]) }
  async deleteCharacter(npcId: string): Promise<void> {
    await this.character(npcId)
    await this.db.transaction(async manager => {
      await manager.query('DELETE FROM pf2_player_character_faction WHERE npc_id = ?', [npcId])
      await manager.query('DELETE FROM pf2_character_presentation WHERE source_npc_id = ?', [npcId])
      await manager.query('DELETE FROM pf2_player_character_profile WHERE npc_id = ?', [npcId])
    })
  }
  async listFactions(): Promise<unknown[]> { return (await this.db.query('SELECT * FROM pf2_player_faction ORDER BY name COLLATE NOCASE') as FactionRow[]).map(row => this.factionDto(row)) }
  async faction(id: string): Promise<unknown> { const rows = await this.db.query('SELECT * FROM pf2_player_faction WHERE id = ?', [id]) as FactionRow[]; if (!rows[0]) throw new NotFoundException('Faction joueur introuvable.'); return this.factionDto(rows[0]) }
  async createFaction(input: { name: string; wikiPageTitle?: string }): Promise<unknown> {
    const name = this.required(input.name, 'Nom'); const id = `player-faction-${randomUUID()}`; const title = input.wikiPageTitle?.trim() || `Faction:${name}`
    try {
      await this.db.query('INSERT INTO pf2_player_faction (id, name, normalized_name, parent_faction_id, wiki_page_title) VALUES (?, ?, ?, NULL, ?)', [id, name, this.normalized(name), title])
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (/unique constraint|constraint failed/i.test(message)) {
        const rows = await this.db.query('SELECT id FROM pf2_player_faction WHERE normalized_name = ?', [this.normalized(name)]) as Array<{ id: string }>
        if (rows[0]) return this.faction(rows[0].id)
        throw new ConflictException('Titre wiki de faction déjà utilisé.')
      }
      this.logger.error(`Création de faction impossible (SQLite) : ${message}`, error instanceof Error ? error.stack : undefined)
      throw new InternalServerErrorException(`Création de faction impossible : ${message}`)
    }
    return this.faction(id)
  }
  async deleteFaction(id: string): Promise<void> {
    await this.faction(id)
    await this.db.transaction(async manager => {
      await manager.query('UPDATE pf2_player_faction SET parent_faction_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE parent_faction_id = ?', [id])
      await manager.query('DELETE FROM pf2_player_character_faction WHERE player_faction_id = ?', [id])
      await manager.query('DELETE FROM pf2_player_faction WHERE id = ?', [id])
    })
  }
  async updateFaction(id: string, input: { name?: unknown; parentFactionId?: unknown }): Promise<unknown> {
    const current = await this.factionRow(id)
    if (typeof input.name === 'string') { const name = this.required(input.name, 'Nom'); await this.db.query('UPDATE pf2_player_faction SET name=?, normalized_name=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [name, this.normalized(name), id]) }
    if (input.parentFactionId !== undefined) {
      const parent = typeof input.parentFactionId === 'string' && input.parentFactionId.trim() ? input.parentFactionId.trim() : null
      if (parent === id) throw new BadRequestException('Une faction ne peut pas être sa propre sous-faction.')
      if (parent) { await this.faction(parent); if (await this.isDescendant(parent, id)) throw new BadRequestException('Cette relation créerait un cycle de factions.') }
      if (current.parent_faction_id !== parent) await this.db.query('UPDATE pf2_player_faction SET parent_faction_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [parent, id])
    }
    return this.faction(id)
  }
  private async characterDto(row: ProfileRow): Promise<unknown> {
    const factions = await this.db.query('SELECT f.id, f.name, f.wiki_page_title AS wikiPageTitle FROM pf2_player_faction f JOIN pf2_player_character_faction r ON r.player_faction_id=f.id WHERE r.npc_id=? ORDER BY f.name COLLATE NOCASE', [row.npc_id])
    return { npcId: row.npc_id, wikiPageTitle: row.wiki_page_title, displayName: row.display_name, wikiPortraitFilename: row.wiki_portrait_filename, isPlayer: row.is_player === 1, factions }
  }
  private factionDto(row: FactionRow): unknown { return { id: row.id, name: row.name, parentFactionId: row.parent_faction_id, wikiPageTitle: row.wiki_page_title } }
  private async factionRow(id: string): Promise<FactionRow> { const rows = await this.db.query('SELECT * FROM pf2_player_faction WHERE id=?', [id]) as FactionRow[]; if (!rows[0]) throw new NotFoundException('Faction joueur introuvable.'); return rows[0] }
  private async isDescendant(candidate: string, ancestor: string): Promise<boolean> { let current: string | null = candidate; const seen = new Set<string>(); while (current && !seen.has(current)) { if (current === ancestor) return true; seen.add(current); current = (await this.factionRow(current)).parent_faction_id } return false }
  private normalized(value: string): string { return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase() }
  private required(value: string, label: string): string { const result = value.trim().replace(/\s+/g, ' '); if (!result) throw new BadRequestException(`${label} obligatoire.`); return result }
}
