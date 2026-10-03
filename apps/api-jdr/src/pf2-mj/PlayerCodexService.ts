import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { randomUUID } from 'node:crypto'
import { DataSource } from 'typeorm'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'
import { MediaWikiClientService } from './MediaWikiClientService'

type ProfileRow = { npc_id: string; wiki_page_title: string; display_name: string; wiki_portrait_filename: string | null; short_description: string; is_player: number; is_published: number; created_at: string; updated_at: string }
type MjFaction = Record<string, unknown> & { id: string; nom: string; description: string; description_joueurs?: string; parent_id?: string | null; published?: boolean }

@Injectable()
export class PlayerCodexService {
  constructor(@InjectDataSource('pf2-sqlite') private readonly db: DataSource, private readonly persistence: Pf2PersistenceService, @Optional() private readonly mediaWiki?: MediaWikiClientService) {}

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
  async ensurePresentationCharacter(presentationId: string, displayName: string, wikiPageTitle: string, shortDescription = ''): Promise<unknown> {
    const presentation = await this.presentation(presentationId)
    let npcId = presentation.sourceNpcId
    if (!npcId) {
      npcId = `player-${randomUUID()}`
      // This uses the canonical persistence service, not a parallel player table.
      await this.persistence.saveRecord('pnj', { id: npcId, nom: presentation.name, description: '', aliases: [], factions: [], tags: [], statut: 'Actif', scope: 'global' })
      await this.db.query('UPDATE pf2_character_presentation SET source_npc_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [npcId, presentationId])
    }
    try {
      const profile = await this.createCharacter({ npcId, displayName, wikiPageTitle, shortDescription, published: true })
      return { ...(profile as Record<string, unknown>), created: true, newlyPublished: true }
    } catch (error) {
      if (error instanceof ConflictException) {
        const current = await this.character(npcId) as Record<string, unknown>
        const wasPublished = current.published === true
        const profile = await this.updateCharacter(npcId, { displayName, shortDescription, published: true })
        return { ...(profile as Record<string, unknown>), created: false, newlyPublished: !wasPublished }
      }
      throw error
    }
  }

  async listCharacters(): Promise<unknown[]> {
    const rows = await this.db.query('SELECT * FROM pf2_player_character_profile WHERE is_published = 1 ORDER BY display_name COLLATE NOCASE') as ProfileRow[]
    return Promise.all(rows.map(row => this.characterDto(row)))
  }
  async listAllCharacters(): Promise<unknown[]> {
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
  async createCharacter(input: { npcId: string; displayName: string; wikiPageTitle: string; wikiPortraitFilename?: string | null; shortDescription?: string; isPlayer?: boolean; published?: boolean }): Promise<unknown> {
    const npc = await this.persistence.getRecord('pnj', input.npcId)
    if (!npc) throw new NotFoundException('PNJ MJ introuvable.')
    const displayName = this.required(input.displayName, 'Nom')
    const title = this.required(input.wikiPageTitle, 'Titre wiki')
    const shortDescription = this.shortDescription(input.shortDescription)
    const isPlayer = typeof input.isPlayer === 'boolean' ? input.isPlayer : this.isTaggedPlayer(npc)
    const published = input.published !== false
    try {
      await this.db.query('INSERT INTO pf2_player_character_profile (npc_id, wiki_page_title, display_name, wiki_portrait_filename, short_description, is_player, is_published) VALUES (?, ?, ?, ?, ?, ?, ?)', [input.npcId, title, displayName, input.wikiPortraitFilename ?? null, shortDescription, isPlayer ? 1 : 0, published ? 1 : 0])
    } catch (error) { throw new ConflictException('Une fiche joueur existe déjà pour ce PNJ ou ce titre wiki est déjà utilisé.') }
    return this.character(input.npcId)
  }
  async updateCharacter(npcId: string, input: { displayName?: unknown; wikiPortraitFilename?: unknown; shortDescription?: unknown; isPlayer?: unknown; published?: unknown }): Promise<unknown> {
    await this.character(npcId)
    const name = typeof input.displayName === 'string' ? this.required(input.displayName, 'Nom') : null
    const portrait = typeof input.wikiPortraitFilename === 'string' ? input.wikiPortraitFilename.trim() || null : undefined
    if (name !== null) await this.db.query('UPDATE pf2_player_character_profile SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE npc_id = ?', [name, npcId])
    if (portrait !== undefined) await this.db.query('UPDATE pf2_player_character_profile SET wiki_portrait_filename = ?, updated_at = CURRENT_TIMESTAMP WHERE npc_id = ?', [portrait, npcId])
    if (typeof input.shortDescription === 'string') await this.db.query('UPDATE pf2_player_character_profile SET short_description = ?, updated_at = CURRENT_TIMESTAMP WHERE npc_id = ?', [this.shortDescription(input.shortDescription), npcId])
    if (typeof input.isPlayer === 'boolean') await this.db.query('UPDATE pf2_player_character_profile SET is_player = ?, updated_at = CURRENT_TIMESTAMP WHERE npc_id = ?', [input.isPlayer ? 1 : 0, npcId])
    if (typeof input.published === 'boolean') await this.db.query('UPDATE pf2_player_character_profile SET is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE npc_id = ?', [input.published ? 1 : 0, npcId])
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
      await manager.query('DELETE FROM pf2_player_character_owner WHERE npc_id = ?', [npcId])
      await manager.query('DELETE FROM pf2_player_character_contact WHERE player_npc_id = ?', [npcId])
      await manager.query('DELETE FROM pf2_player_character_background WHERE npc_id = ?', [npcId])
      await manager.query('DELETE FROM pf2_character_presentation WHERE source_npc_id = ?', [npcId])
      await manager.query('DELETE FROM pf2_player_character_profile WHERE npc_id = ?', [npcId])
    })
  }
  async profileCandidates(prefix = ''): Promise<Array<{ id: string; name: string; isPlayer: boolean }>> {
    const term = prefix.trim().toLocaleLowerCase()
    const rows = await this.db.query('SELECT npc_id, display_name, is_player FROM pf2_player_character_profile WHERE is_published = 1 ORDER BY display_name COLLATE NOCASE') as Array<{ npc_id: string; display_name: string; is_player: number }>
    return rows
      .filter(row => !term || row.display_name.toLocaleLowerCase().includes(term))
      .slice(0, 25)
      .map(row => ({ id: row.npc_id, name: row.display_name, isPlayer: row.is_player === 1 }))
  }

  async assignPlayerOwner(discordUserId: string, npcId: string): Promise<{ discordUserId: string; wikiUsername: string; character: unknown }> {
    const link = await this.persistence.wikiAccountLink(discordUserId)
    if (!link) throw new BadRequestException('Ce membre Discord n’est associé à aucun compte Wiki. Utilise d’abord `/wiki-admin associer`.')
    await this.character(npcId)
    await this.db.transaction(async manager => {
      await manager.query('UPDATE pf2_player_character_profile SET is_player = 1, updated_at = CURRENT_TIMESTAMP WHERE npc_id = ?', [npcId])
      await manager.query('INSERT OR IGNORE INTO pf2_player_character_owner (discord_user_id, npc_id) VALUES (?, ?)', [discordUserId, npcId])
    })
    return { discordUserId, wikiUsername: link.wikiUsername, character: await this.character(npcId) }
  }

  async removePlayerOwner(discordUserId: string, npcId: string): Promise<boolean> {
    const rows = await this.db.query('SELECT 1 FROM pf2_player_character_owner WHERE discord_user_id = ? AND npc_id = ? LIMIT 1', [discordUserId, npcId]) as Array<Record<string, unknown>>
    if (!rows.length) return false
    await this.db.query('DELETE FROM pf2_player_character_owner WHERE discord_user_id = ? AND npc_id = ?', [discordUserId, npcId])
    return true
  }

  async listPlayerAssignments(): Promise<Array<{ discordUserId: string; wikiUsername: string | null; npcId: string; displayName: string }>> {
    return this.db.query(
      `SELECT o.discord_user_id AS discordUserId, a.wiki_username AS wikiUsername, o.npc_id AS npcId, p.display_name AS displayName
       FROM pf2_player_character_owner o
       JOIN pf2_player_character_profile p ON p.npc_id = o.npc_id
       LEFT JOIN pf2_wiki_account_link a ON a.discord_user_id = o.discord_user_id
       ORDER BY COALESCE(a.wiki_username, o.discord_user_id) COLLATE NOCASE, p.display_name COLLATE NOCASE`,
    ) as Promise<Array<{ discordUserId: string; wikiUsername: string | null; npcId: string; displayName: string }>>
  }

  async contactPlayers(contactNpcId: string): Promise<Array<{ npcId: string; displayName: string; wikiPageTitle: string; selected: boolean }>> {
    if (!(await this.persistence.getRecord('pnj', contactNpcId))) throw new NotFoundException('PNJ contact introuvable.')
    const rows = await this.db.query(
      `SELECT p.npc_id AS npcId, p.display_name AS displayName, p.wiki_page_title AS wikiPageTitle,
              CASE WHEN c.contact_npc_id IS NULL THEN 0 ELSE 1 END AS selected
       FROM pf2_player_character_profile p
       LEFT JOIN pf2_player_character_contact c ON c.player_npc_id = p.npc_id AND c.contact_npc_id = ?
       WHERE p.is_player = 1
       ORDER BY p.display_name COLLATE NOCASE`,
      [contactNpcId],
    ) as Array<{ npcId: string; displayName: string; wikiPageTitle: string; selected: number }>
    return rows.map(row => ({ ...row, selected: row.selected === 1 }))
  }

  async setPlayerContact(playerNpcId: string, contactNpcId: string, enabled: boolean): Promise<void> {
    const players = await this.db.query('SELECT 1 FROM pf2_player_character_profile WHERE npc_id = ? AND is_player = 1 LIMIT 1', [playerNpcId]) as Array<Record<string, unknown>>
    if (!players.length) throw new BadRequestException('Le personnage choisi n’est pas marqué comme PJ.')
    if (!(await this.persistence.getRecord('pnj', contactNpcId))) throw new NotFoundException('PNJ contact introuvable.')
    if (playerNpcId === contactNpcId) throw new BadRequestException('Un PJ ne peut pas être son propre contact.')
    if (enabled) {
      await this.ensureContactProfile(contactNpcId)
      await this.db.query('INSERT OR IGNORE INTO pf2_player_character_contact (player_npc_id, contact_npc_id) VALUES (?, ?)', [playerNpcId, contactNpcId])
    } else await this.db.query('DELETE FROM pf2_player_character_contact WHERE player_npc_id = ? AND contact_npc_id = ?', [playerNpcId, contactNpcId])
  }

  async myCharacters(wikiUsername: string): Promise<{ wikiUsername: string; characters: unknown[] }> {
    const username = this.required(wikiUsername, 'Compte Wiki')
    const accounts = await this.db.query('SELECT discord_user_id AS discordUserId FROM pf2_wiki_account_link WHERE wiki_username = ? COLLATE NOCASE LIMIT 1', [username]) as Array<{ discordUserId: string }>
    const account = accounts[0]
    if (!account) return { wikiUsername: username, characters: [] }
    const rows = await this.db.query(
      `SELECT p.* FROM pf2_player_character_owner o
       JOIN pf2_player_character_profile p ON p.npc_id = o.npc_id
       WHERE o.discord_user_id = ? AND p.is_player = 1
       ORDER BY p.display_name COLLATE NOCASE`,
      [account.discordUserId],
    ) as ProfileRow[]
    return { wikiUsername: username, characters: await Promise.all(rows.map(row => this.privateCharacterDto(row))) }
  }

  async updateMyBackground(wikiUsername: string, npcId: string, content: unknown): Promise<{ npcId: string; background: string }> {
    const username = this.required(wikiUsername, 'Compte Wiki')
    const value = typeof content === 'string' ? content : ''
    if (value.length > 100_000) throw new BadRequestException('Le background est trop long (maximum 100 000 caractères).')
    const owned = await this.db.query(
      `SELECT 1 FROM pf2_player_character_owner o
       JOIN pf2_wiki_account_link a ON a.discord_user_id = o.discord_user_id
       WHERE o.npc_id = ? AND a.wiki_username = ? COLLATE NOCASE LIMIT 1`,
      [npcId, username],
    ) as Array<Record<string, unknown>>
    if (!owned.length) throw new ForbiddenException('Ce personnage ne vous appartient pas.')
    await this.db.query(
      `INSERT INTO pf2_player_character_background (npc_id, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(npc_id) DO UPDATE SET content = excluded.content, updated_at = CURRENT_TIMESTAMP`,
      [npcId, value],
    )
    return { npcId, background: value }
  }

  private async privateCharacterDto(row: ProfileRow): Promise<unknown> {
    const character = await this.characterDto(row) as Record<string, unknown>
    const backgrounds = await this.db.query('SELECT content FROM pf2_player_character_background WHERE npc_id = ? LIMIT 1', [row.npc_id]) as Array<{ content: string }>
    const contacts = await this.db.query('SELECT contact_npc_id AS contactNpcId FROM pf2_player_character_contact WHERE player_npc_id = ? ORDER BY created_at, contact_npc_id', [row.npc_id]) as Array<{ contactNpcId: string }>
    return {
      ...character,
      background: backgrounds[0]?.content ?? '',
      contacts: (await Promise.all(contacts.map(contact => this.privateContactDto(contact.contactNpcId)))).filter(Boolean),
    }
  }

  private async privateContactDto(npcId: string): Promise<unknown | null> {
    let profiles = await this.db.query('SELECT * FROM pf2_player_character_profile WHERE npc_id = ? LIMIT 1', [npcId]) as ProfileRow[]
    if (!profiles[0]) {
      try {
        await this.ensureContactProfile(npcId)
        profiles = await this.db.query('SELECT * FROM pf2_player_character_profile WHERE npc_id = ? LIMIT 1', [npcId]) as ProfileRow[]
      } catch {
        return null
      }
    }
    const profile = profiles[0]
    if (!profile) return null
    return {
      npcId,
      displayName: profile.display_name,
      shortDescription: profile.short_description,
      wikiPortraitFilename: profile.wiki_portrait_filename,
      wikiPageTitle: profile.wiki_page_title,
      published: profile.is_published === 1,
    }
  }

  private async ensureContactProfile(npcId: string): Promise<void> {
    const existing = await this.db.query('SELECT 1 FROM pf2_player_character_profile WHERE npc_id = ? LIMIT 1', [npcId]) as Array<Record<string, unknown>>
    if (existing.length) return
    const npc = await this.persistence.getRecord('pnj', npcId)
    if (!npc) throw new NotFoundException('PNJ contact introuvable.')
    const displayName = typeof npc.nom === 'string' ? npc.nom.trim() : typeof npc.name === 'string' ? npc.name.trim() : ''
    if (!displayName) throw new BadRequestException('Le PNJ contact n’a pas de nom exploitable.')
    const wikiPageTitle = `Personnage:${displayName}`
    let wikiPortraitFilename: string | null = null
    if (this.mediaWiki?.enabled()) {
      if (!(await this.mediaWiki.pageExists(wikiPageTitle))) await this.mediaWiki.createPage(wikiPageTitle, '<!-- Fiche personnage : contenu détaillé à compléter ici. -->')
      const portraitUrl = this.mediaWikiPortraitSource(npc.portrait)
      if (portraitUrl) wikiPortraitFilename = await this.mediaWiki.uploadFromUrl(portraitUrl, displayName)
    }
    await this.createCharacter({ npcId, displayName, wikiPageTitle, wikiPortraitFilename, published: false })
  }

  private publicPortraitUrl(value: unknown): string | null {
    if (typeof value !== 'string') return null
    const match = /^assets\/l7r\/portraits\/pnj\/([^/]+\.(?:webp|gif|png|jpe?g))$/i.exec(value.trim())
    if (!match) return /^https?:\/\//i.test(value.trim()) ? value.trim() : null
    const base = (process.env['PF2_PUBLIC_WEB_BASE'] ?? 'https://l7r.fr').replace(/\/$/, '')
    return `${base}/apil7r/pf2-mj/portraits/${encodeURIComponent(match[1])}`
  }

  private mediaWikiPortraitSource(value: unknown): string | null {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    const match = /^assets\/l7r\/portraits\/pnj\/([^/]+\.(?:webp|gif|png|jpe?g))$/i.exec(trimmed)
    if (match) return `http://127.0.0.1:3333/api/pf2-mj/portraits/${encodeURIComponent(match[1])}`
    return /^https?:\/\//i.test(trimmed) ? trimmed : null
  }

  async deleteMjPnj(npcId: string): Promise<void> {
    const pnj = await this.persistence.getRecord('pnj', npcId)
    if (!pnj) throw new NotFoundException('PNJ MJ introuvable.')
    const profiles = await this.db.query('SELECT wiki_page_title FROM pf2_player_character_profile WHERE npc_id = ?', [npcId]) as Array<{ wiki_page_title: string }>
    if (profiles[0]) throw new ConflictException(`Ce personnage possède la fiche Wiki « ${profiles[0].wiki_page_title} ». Supprime-la d’abord depuis le Wiki.`)
    await this.db.transaction(async manager => {
      await manager.query('DELETE FROM pf2_scenario_npc WHERE npc_id = ?', [npcId])
      await manager.query('DELETE FROM pf2_player_character_contact WHERE contact_npc_id = ? OR player_npc_id = ?', [npcId, npcId])
      await manager.query('DELETE FROM pf2_player_character_owner WHERE npc_id = ?', [npcId])
      await manager.query('DELETE FROM pf2_player_character_background WHERE npc_id = ?', [npcId])
      await manager.query('DELETE FROM pf2_character_presentation WHERE source_npc_id = ?', [npcId])
      await manager.query('DELETE FROM pf2_record WHERE kind = ? AND id = ?', ['pnj', npcId])
    })
  }
  async listFactions(): Promise<unknown[]> { return Promise.all((await this.mjFactions()).filter(faction => faction.published === true).map(faction => this.factionDto(faction))) }
  async factionCandidates(publishedOnly = false): Promise<Array<{ id: string; name: string; path: string }>> {
    const factions = (await this.mjFactions()).filter(faction => !publishedOnly || faction.published === true)
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
    return { npcId: row.npc_id, wikiPageTitle: row.wiki_page_title, displayName: row.display_name, wikiPortraitFilename: row.wiki_portrait_filename, shortDescription: row.short_description, isPlayer: row.is_player === 1, published: row.is_published === 1, factions }
  }
  private async mjFactions(): Promise<MjFaction[]> { return (await this.persistence.listRecords('faction')).flatMap(record => { const id = typeof record.id === 'string' ? record.id : ''; const nom = typeof record.nom === 'string' ? record.nom.trim() : ''; return id && nom ? [{ ...record, id, nom, description: typeof record.description === 'string' ? record.description : '' } as MjFaction] : [] }) }
  private async mjFaction(id: string): Promise<MjFaction> { const faction = await this.persistence.getRecord('faction', id); const nom = typeof faction?.nom === 'string' ? faction.nom.trim() : ''; if (!faction || !nom) throw new NotFoundException('Faction MJ introuvable.'); return { ...faction, id, nom, description: typeof faction.description === 'string' ? faction.description : '' } as MjFaction }
  private parentId(faction: MjFaction): string | null { return typeof faction.parent_id === 'string' && faction.parent_id.trim() ? faction.parent_id.trim() : null }
  private async factionAncestors(id: string): Promise<MjFaction[]> { const chain: MjFaction[] = []; const seen = new Set<string>(); let current = await this.mjFaction(id); while (!seen.has(current.id)) { chain.unshift(current); seen.add(current.id); const parent = this.parentId(current); if (!parent) break; current = await this.mjFaction(parent) } return chain }
  private factionPath(faction: MjFaction, byId: Map<string, MjFaction>): string { const labels = [faction.nom]; const seen = new Set([faction.id]); let parent = this.parentId(faction); while (parent && !seen.has(parent)) { seen.add(parent); const current = byId.get(parent); if (!current) break; labels.unshift(current.nom); parent = this.parentId(current) } return labels.join(' › ') }
  private playerDescription(faction: MjFaction): string { return typeof faction.description_joueurs === 'string' && faction.description_joueurs.trim() ? faction.description_joueurs.trim() : faction.description }
  private factionWikiTitle(faction: MjFaction): string { return `Faction:${faction.nom}` }
  private factionDto(faction: MjFaction): unknown { return { id: faction.id, name: faction.nom, description: this.playerDescription(faction), parentFactionId: this.parentId(faction), wikiPageTitle: this.factionWikiTitle(faction), published: faction.published === true } }
  private isTaggedPlayer(npc: Record<string, unknown>): boolean {
    return Array.isArray(npc.tags) && npc.tags.some(tag => typeof tag === 'string' && tag.trim().toLocaleLowerCase() === 'pj')
  }

  private shortDescription(value: unknown): string {
    const text = typeof value === 'string' ? value.trim() : ''
    if (text.length > 1000) throw new BadRequestException('La description courte est trop longue (maximum 1 000 caractères).')
    return text
  }

  private required(value: unknown, label: string): string {
    const result = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
    if (!result) throw new BadRequestException(`${label} obligatoire.`)
    return result
  }
}
