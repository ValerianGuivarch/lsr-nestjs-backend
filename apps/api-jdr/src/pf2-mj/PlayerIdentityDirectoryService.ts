import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'
import { pf2DiscordIdForPlayer } from '../discord/Pf2PlayerIdentity'
import { MediaWikiClientService } from './MediaWikiClientService'

type WikiProfile = { npcId: string; displayName: string; wikiPageTitle: string }
type SavedLink = { foundryUuid: string; npcId: string }
type Owner = { discordUserId: string; npcId: string }
export type DirectoryCharacter = {
  name: string
  foundryUuid: string
  wikiNpcId: string | null
  wikiPageTitle: string | null
  wikiUrl: string | null
  association: 'confirmed' | 'suggested' | 'missing'
  ownerStatus: 'confirmed' | 'missing' | 'other'
}
export type DirectoryPlayer = {
  discordUserId: string | null
  playerName: string
  wikiUsername: string | null
  characters: DirectoryCharacter[]
  status: string[]
}
export type DirectorySnapshot = {
  players: DirectoryPlayer[]
  wikiOnly: Array<{ npcId: string; name: string; wikiUrl: string | null; ownerIds: string[] }>
  cachedActorCount: number
  checkedAt: string
}

@Injectable()
export class PlayerIdentityDirectoryService {
  constructor(
    @InjectDataSource('pf2-sqlite') private readonly db: DataSource,
    private readonly persistence: Pf2PersistenceService,
    private readonly wiki: MediaWikiClientService,
  ) {}

  private normalized(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  }

  private wikiUrl(title: string): string | null {
    return title && process.env['PF2_MEDIAWIKI_PUBLIC_BASE_URL']?.trim() ? this.wiki.pageUrl(title) : null
  }

  async snapshot(): Promise<DirectorySnapshot> {
    const [identities, wikiLinks, actors, profiles, owners, links] = await Promise.all([
      this.persistence.listPlayerIdentities(),
      this.persistence.listWikiAccountLinks(),
      this.persistence.readFoundryActorCache(),
      this.db.query('SELECT npc_id AS npcId, display_name AS displayName, wiki_page_title AS wikiPageTitle FROM pf2_player_character_profile WHERE is_player = 1') as Promise<WikiProfile[]>,
      this.db.query('SELECT discord_user_id AS discordUserId, npc_id AS npcId FROM pf2_player_character_owner') as Promise<Owner[]>,
      this.db.query('SELECT foundry_uuid AS foundryUuid, npc_id AS npcId FROM pf2_foundry_wiki_pj_link') as Promise<SavedLink[]>,
    ])
    const rows = new Map<string, DirectoryPlayer>()
    for (const identity of identities) rows.set(identity.discordUserId, {
      discordUserId: identity.discordUserId,
      playerName: identity.playerName,
      wikiUsername: wikiLinks.find(link => link.discordUserId === identity.discordUserId)?.wikiUsername ?? null,
      characters: [], status: [],
    })
    const byWikiId = new Map(profiles.map(profile => [profile.npcId, profile]))
    const foundryPlayers = actors.flatMap(actor => {
      const parsed = /^(.*?)\s+\(([^()]+)\)$/.exec(actor.name.trim())
      return parsed && this.normalized(parsed[2]) !== 'valou'
        ? [{ uuid: actor.uuid, character: parsed[1].trim(), player: parsed[2].trim() }] : []
    })
    const usedWikiIds = new Set<string>()
    for (const actor of foundryPlayers) {
      const id = identities.find(identity => this.normalized(identity.playerName) === this.normalized(actor.player))?.discordUserId
        ?? pf2DiscordIdForPlayer(actor.player) ?? null
      const key = id ?? `unknown:${this.normalized(actor.player)}`
      if (!rows.has(key)) rows.set(key, {
        discordUserId: id,
        playerName: actor.player,
        wikiUsername: id ? wikiLinks.find(link => link.discordUserId === id)?.wikiUsername ?? null : null,
        characters: [], status: id ? [] : ['Compte Discord inconnu'],
      })
      const row = rows.get(key)!
      const explicit = links.find(link => link.foundryUuid === actor.uuid)
      const exact = profiles.filter(profile => this.normalized(profile.displayName) === this.normalized(actor.character))
      const prefixed = exact.length ? [] : profiles.filter(profile =>
        this.normalized(profile.displayName).startsWith(this.normalized(actor.character) + ' ')
      )
      const candidates = exact.length ? exact : prefixed
      const profile = explicit ? byWikiId.get(explicit.npcId) : candidates.length === 1 ? candidates[0] : undefined
      const association = explicit && profile ? 'confirmed' : profile ? 'suggested' : 'missing'
      if (profile) usedWikiIds.add(profile.npcId)
      const ownerIds = profile ? owners.filter(owner => owner.npcId === profile.npcId).map(owner => owner.discordUserId) : []
      const ownerStatus = id && ownerIds.includes(id) ? 'confirmed' : ownerIds.length ? 'other' : 'missing'
      row.characters.push({
        name: actor.character,
        foundryUuid: actor.uuid,
        wikiNpcId: profile?.npcId ?? null,
        wikiPageTitle: profile?.wikiPageTitle ?? null,
        wikiUrl: profile ? this.wikiUrl(profile.wikiPageTitle) : null,
        association,
        ownerStatus,
      })
      if (association === 'missing') row.status.push(`Fiche Wiki introuvable pour ${actor.character}`)
      else if (association === 'suggested') row.status.push(`Lien Foundry ↔ Wiki à confirmer : ${actor.character}`)
      if (ownerStatus === 'missing' && profile) row.status.push(`Propriétaire Wiki à renseigner : ${actor.character}`)
      if (ownerStatus === 'other') row.status.push(`Propriétaire Wiki différent : ${actor.character}`)
    }
    for (const row of rows.values()) {
      if (!row.wikiUsername) row.status.push('Compte Wiki non lié')
      if (!row.characters.length) row.status.push('Aucun acteur Foundry associé')
    }
    return {
      players: [...rows.values()].sort((a, b) => a.playerName.localeCompare(b.playerName, 'fr')),
      wikiOnly: profiles.filter(profile => !usedWikiIds.has(profile.npcId)).map(profile => ({
        npcId: profile.npcId,
        name: profile.displayName,
        wikiUrl: this.wikiUrl(profile.wikiPageTitle),
        ownerIds: owners.filter(owner => owner.npcId === profile.npcId).map(owner => owner.discordUserId),
      })),
      cachedActorCount: foundryPlayers.length,
      checkedAt: new Date().toISOString(),
    }
  }
}
