import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { randomUUID } from 'node:crypto'
import { DataSource } from 'typeorm'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'

type ProfileRow = { npc_id: string; wiki_page_title: string; display_name: string; wiki_portrait_filename: string | null; is_player: number; created_at: string; updated_at: string }
type MjFaction = Record<string, unknown> & { id: string; nom: string; description: string; description_joueurs?: string; parent_id?: string | null; published?: boolean }

@Injectable()
export class PlayerCodexService {
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
    await this.character(npcId)
    for (const faction of await this.factionAncestors(factionId)) {
      await this.db.query('INSERT OR IGNORE INTO pf2_player_character_mj_faction (npc_id, faction_id) VALUES (?, ?)', [npcId, faction.id])
    }
    return this.character(npcId)
  }
  async removeCharacterFaction(npcId: string, factionId: string): Promise<void> { await this.db.query('DELETE FROM pf2_player_character_mj_faction WHERE npc_id = ? AND faction_id = ?', [npcId, factionId]) }
  async deleteCharacter(npcId: string): Promise<void> {
    await this.character(npcId)
    await this.db.transaction(async manager => {
      await manager.query('DELETE FROM pf2_player_character_mj_faction WHERE npc_id = ?', [npcId])
      await manager.query('DELETE FROM pf2_character_presentation WHERE source_npc_id = ?', [npcId])
      await manager.query('DELETE FROM pf2_player_character_profile WHERE npc_id = ?', [npcId])
    })
  }
  async deleteMjPnj(npcId: string): Promise<void> {
    const pnj = await this.persistence.getRecord('pnj', npcId)
    if (!pnj) throw new NotFoundException('PNJ MJ introuvable.')
    const profiles = await this.db.query('SELECT wiki_page_title FROM pf2_player_character_profile WHERE npc_id = ?', [npcId]) as Array<{ wiki_page_title: string }>
    if (profiles[0]) throw new ConflictException(`Ce personnage possède la fiche Wiki « ${profiles[0].wiki_page_title} ». Supprime-la d’abord depuis le Wiki.`)
    await this.db.transaction(async manager => {
      await manager.query('DELETE FROM pf2_scenario_npc WHERE npc_id = ?', [npcId])
      await manager.query('DELETE FROM pf2_character_presentation WHERE source_npc_id = ?', [npcId])
      await manager.query('DELETE FROM pf2_record WHERE kind = ? AND id = ?', ['pnj', npcId])
    })
  }
  async listFactions(): Promise<unknown[]> { return Promise.all((await this.mjFactions()).filter(faction => faction.published === true).map(faction => this.factionDto(faction))) }
  async factionCandidates(): Promise<Array<{ id: string; name: string; path: string }>> {
    const factions = await this.mjFactions()
    const byId = new Map(factions.map(faction => [faction.id, faction]))
    return factions.map(faction => ({ id: faction.id, name: faction.nom, path: this.factionPath(faction, byId) })).sort((left, right) => left.path.localeCompare(right.path, 'fr'))
  }
  async factionForPublication(id: string): Promise<{ id: string; name: string; description: string; parentName: string | null; wikiPageTitle: string; published: boolean }> {
    const faction = await this.mjFaction(id)
    const parentId = this.parentId(faction)
    const parent = parentId ? await this.mjFaction(parentId) : null
    if (parent && parent.published !== true) throw new BadRequestException(`La faction parente « ${parent.nom} » doit être publiée avant cette sous-faction.`)
    return { id: faction.id, name: faction.nom, description: this.playerDescription(faction), parentName: parent?.nom ?? null, wikiPageTitle: this.factionWikiTitle(faction), published: faction.published === true }
  }
  async markFactionPublished(id: string): Promise<void> { const faction = await this.mjFaction(id); await this.persistence.saveRecord('faction', { ...faction, published: true }) }
  private async characterDto(row: ProfileRow): Promise<unknown> {
    const links = await this.db.query('SELECT faction_id FROM pf2_player_character_mj_faction WHERE npc_id = ?', [row.npc_id]) as Array<{ faction_id: string }>
    const factions = (await Promise.all(links.map(async link => {
      try { const faction = await this.mjFaction(link.faction_id); return faction.published === true ? this.factionDto(faction) : null } catch { return null }
    }))).filter(Boolean).sort((left, right) => String((left as { name: string }).name).localeCompare(String((right as { name: string }).name), 'fr'))
    return { npcId: row.npc_id, wikiPageTitle: row.wiki_page_title, displayName: row.display_name, wikiPortraitFilename: row.wiki_portrait_filename, isPlayer: row.is_player === 1, factions }
  }
  private async mjFactions(): Promise<MjFaction[]> { return (await this.persistence.listRecords('faction')).flatMap(record => { const id = typeof record.id === 'string' ? record.id : ''; const nom = typeof record.nom === 'string' ? record.nom.trim() : ''; return id && nom ? [{ ...record, id, nom, description: typeof record.description === 'string' ? record.description : '' } as MjFaction] : [] }) }
  private async mjFaction(id: string): Promise<MjFaction> { const faction = await this.persistence.getRecord('faction', id); const nom = typeof faction?.nom === 'string' ? faction.nom.trim() : ''; if (!faction || !nom) throw new NotFoundException('Faction MJ introuvable.'); return { ...faction, id, nom, description: typeof faction.description === 'string' ? faction.description : '' } as MjFaction }
  private parentId(faction: MjFaction): string | null { return typeof faction.parent_id === 'string' && faction.parent_id.trim() ? faction.parent_id.trim() : null }
  private async factionAncestors(id: string): Promise<MjFaction[]> { const chain: MjFaction[] = []; const seen = new Set<string>(); let current = await this.mjFaction(id); while (!seen.has(current.id)) { chain.unshift(current); seen.add(current.id); const parent = this.parentId(current); if (!parent) break; current = await this.mjFaction(parent) } return chain }
  private factionPath(faction: MjFaction, byId: Map<string, MjFaction>): string { const labels = [faction.nom]; const seen = new Set([faction.id]); let parent = this.parentId(faction); while (parent && !seen.has(parent)) { seen.add(parent); const current = byId.get(parent); if (!current) break; labels.unshift(current.nom); parent = this.parentId(current) } return labels.join(' › ') }
  private playerDescription(faction: MjFaction): string { return typeof faction.description_joueurs === 'string' && faction.description_joueurs.trim() ? faction.description_joueurs.trim() : faction.description }
  private factionWikiTitle(faction: MjFaction): string { return `Faction:${faction.nom}` }
  private factionDto(faction: MjFaction): unknown { return { id: faction.id, name: faction.nom, description: this.playerDescription(faction), parentFactionId: this.parentId(faction), wikiPageTitle: this.factionWikiTitle(faction), published: faction.published === true } }
  private required(value: unknown, label: string): string {
    const result = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
    if (!result) throw new BadRequestException(`${label} obligatoire.`)
    return result
  }
}
