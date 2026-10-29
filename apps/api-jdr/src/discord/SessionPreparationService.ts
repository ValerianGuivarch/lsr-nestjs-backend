import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { DataSource } from 'typeorm'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js'
import { PlayerCodexService } from '../pf2-mj/PlayerCodexService'
import { DiscordService } from './DiscordService'
import { DiscordCommandsService } from './DiscordCommandsService'

type Kind = 'personnage' | 'lore' | 'loot' | 'rencontre' | 'texte' | 'checklist'
export type PrepBlock = {
  id: string; kind: Kind; title: string; text: string; done: boolean;
  npcId?: string; name?: string; portraitUrl?: string; showName?: boolean;
  quantity?: string; reference?: string; secret?: boolean;
}
export type PrepStage = { id: string; title: string; time: string; notes: string; done: boolean; blocks: PrepBlock[] }
export type PrepBody = { stages: PrepStage[]; summary: string }
type PrepRow = { id: string; title: string; campaign_id: string | null; scenario_id: string | null; session_id: string | null; body_json: string; revision: number; created_at: string; updated_at: string }
type ContextRow = { session_id: string; channel_id: string; guild_id: string; ended_at: string | null }

@Injectable()
export class SessionPreparationService {
  constructor(
    @InjectDataSource('pf2-sqlite') private readonly db: DataSource,
    private readonly codex: PlayerCodexService,
    private readonly discord: DiscordService,
    private readonly commands: DiscordCommandsService,
  ) {}

  private trim(value: unknown, label: string, max: number, required = false): string {
    if (value !== undefined && value !== null && typeof value !== 'string') throw new BadRequestException(`${label} doit être du texte.`)
    const text = (value ?? '').toString().trim()
    if ((required && !text) || text.length > max) throw new BadRequestException(`${label} invalide (maximum ${max} caractères).`)
    return text
  }
  private optionalId(value: unknown, label: string): string | null { return this.trim(value, label, 160) || null }
  private body(value: unknown): PrepBody {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('Préparation invalide.')
    const input = value as Record<string, unknown>
    if (!Array.isArray(input.stages) || input.stages.length > 100) throw new BadRequestException('100 étapes maximum.')
    const unique = new Set<string>()
    const stages = input.stages.map((raw: unknown) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new BadRequestException('Étape invalide.')
      const stage = raw as Record<string, unknown>
      const id = this.trim(stage.id, 'Identifiant étape', 100, true)
      if (unique.has(id)) throw new BadRequestException('Identifiant de bloc dupliqué.')
      unique.add(id)
      if (!Array.isArray(stage.blocks) || stage.blocks.length > 100) throw new BadRequestException('100 blocs maximum par étape.')
      const blocks: PrepBlock[] = stage.blocks.map((rawBlock: unknown) => {
        if (!rawBlock || typeof rawBlock !== 'object' || Array.isArray(rawBlock)) throw new BadRequestException('Bloc invalide.')
        const b = rawBlock as Record<string, unknown>
        const blockId = this.trim(b.id, 'Identifiant bloc', 100, true)
        if (unique.has(blockId)) throw new BadRequestException('Identifiant de bloc dupliqué.')
        unique.add(blockId)
        const kind = b.kind as Kind
        if (!['personnage', 'lore', 'loot', 'rencontre', 'texte', 'checklist'].includes(kind)) throw new BadRequestException('Type de bloc inconnu.')
        const npcId = this.optionalId(b.npcId, 'Référence personnage')
        const name = this.trim(b.name, 'Nom du personnage', 160)
        if (kind === 'personnage' && !npcId && !name) throw new BadRequestException('Un personnage temporaire doit avoir un nom.')
        return {
          id: blockId, kind, title: this.trim(b.title, 'Titre du bloc', 220),
          text: this.trim(b.text, 'Contenu', 12000), done: b.done === true,
          ...(npcId ? { npcId } : {}), ...(name ? { name } : {}),
          portraitUrl: this.trim(b.portraitUrl, 'Portrait', 1200), showName: b.showName !== false,
          quantity: this.trim(b.quantity, 'Quantité', 100), reference: this.trim(b.reference, 'Référence', 500), secret: b.secret === true,
        }
      })
      return { id, title: this.trim(stage.title, 'Titre étape', 220, true), time: this.trim(stage.time, 'Horaire', 60), notes: this.trim(stage.notes, 'Notes', 12000), done: stage.done === true, blocks }
    })
    return { stages, summary: this.trim(input.summary, 'Résumé', 15000) }
  }
  private dto(row: PrepRow): Record<string, unknown> { return {
    id: row.id, title: row.title, campaignId: row.campaign_id, scenarioId: row.scenario_id,
    sessionId: row.session_id, body: JSON.parse(row.body_json) as PrepBody,
    revision: row.revision, createdAt: row.created_at, updatedAt: row.updated_at,
  } }
  async list(): Promise<unknown[]> {
    const rows = await this.db.query('SELECT * FROM pf2_session_preparation ORDER BY updated_at DESC') as PrepRow[]
    return rows.map(row => this.dto(row))
  }
  async get(id: string): Promise<Record<string, unknown>> {
    const rows = await this.db.query('SELECT * FROM pf2_session_preparation WHERE id=?', [id]) as PrepRow[]
    if (!rows.length) throw new NotFoundException('Préparation introuvable.')
    return this.dto(rows[0])
  }
  async sessions(): Promise<unknown[]> {
    const rows = await this.db.query(`SELECT s.id, s.session_number, s.title, c.channel_id, c.guild_id, c.ended_at
      FROM pf2_session s LEFT JOIN pf2_session_discord_context c ON c.session_id=s.id
      ORDER BY s.session_number DESC LIMIT 80`) as Array<{ id: string; session_number: number; title: string; channel_id: string | null; guild_id: string | null; ended_at: string | null }>
    return rows.map(row => ({ id: row.id, number: row.session_number, title: row.title, channelName: row.channel_id ? (() => { const ch = this.discord.requestClient()?.channels.cache.get(row.channel_id); return ch && 'name' in ch ? ch.name : null })() : null, channelId: row.channel_id, guildId: row.guild_id, ended: Boolean(row.ended_at) }))
  }
  private async validateSession(id: string | null): Promise<void> {
    if (!id) return
    const rows = await this.db.query('SELECT 1 FROM pf2_session WHERE id=?', [id]) as unknown[]
    if (!rows.length) throw new BadRequestException('La séance sélectionnée est introuvable.')
  }
  async create(input: Record<string, unknown>): Promise<unknown> {
    const id = randomUUID()
    const title = this.trim(input?.title, 'Titre de la préparation', 220, true)
    const campaignId = this.optionalId(input?.campaignId, 'Campagne')
    const scenarioId = this.optionalId(input?.scenarioId, 'Scénario')
    const sessionId = this.optionalId(input?.sessionId, 'Séance')
    await this.validateSession(sessionId)
    const body = this.body(input?.body ?? { stages: [], summary: '' })
    await this.db.query('INSERT INTO pf2_session_preparation(id,title,campaign_id,scenario_id,session_id,body_json) VALUES (?,?,?,?,?,?)', [id, title, campaignId, scenarioId, sessionId, JSON.stringify(body)])
    return this.get(id)
  }
  async update(id: string, input: Record<string, unknown>): Promise<unknown> {
    const current = await this.get(id)
    const revision = Number(input?.revision)
    if (!Number.isInteger(revision) || revision !== current.revision) throw new ConflictException('Cette préparation a été modifiée ailleurs. Recharge la page avant de sauvegarder.')
    const title = this.trim(input.title, 'Titre', 220, true)
    const campaignId = this.optionalId(input.campaignId, 'Campagne')
    const scenarioId = this.optionalId(input.scenarioId, 'Scénario')
    const sessionId = this.optionalId(input.sessionId, 'Séance')
    await this.validateSession(sessionId)
    const body = this.body(input.body)
    await this.db.transaction(async manager => {
      const rows = await manager.query('SELECT revision FROM pf2_session_preparation WHERE id=?', [id]) as Array<{ revision: number }>
      if (rows[0]?.revision !== revision) throw new ConflictException('Conflit de sauvegarde. Recharge la page.')
      await manager.query(`UPDATE pf2_session_preparation SET title=?,campaign_id=?,scenario_id=?,session_id=?,body_json=?,
        revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=?`, [title, campaignId, scenarioId, sessionId, JSON.stringify(body), id, revision])
    })
    return this.get(id)
  }
  async remove(id: string): Promise<{ deleted: true }> {
    await this.get(id)
    await this.db.query('DELETE FROM pf2_session_preparation WHERE id=?', [id])
    return { deleted: true }
  }
  private async channelFor(sessionId: string | null): Promise<ContextRow> {
    if (sessionId) {
      const rows = await this.db.query('SELECT * FROM pf2_session_discord_context WHERE session_id=?', [sessionId]) as ContextRow[]
      if (!rows.length) throw new BadRequestException('Cette séance n’a pas de salon Discord mémorisé par /debut-seance.')
      if (rows[0].ended_at) throw new BadRequestException('Cette séance est terminée. Sélectionne la séance active pour partager.')
      return rows[0]
    }
    const active = await this.db.query('SELECT * FROM pf2_session_discord_context WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 2') as ContextRow[]
    if (active.length !== 1) throw new BadRequestException('Associe cette préparation à une séance Discord active (aucune ou plusieurs séances possibles).')
    return active[0]
  }
  async share(preparationId: string, blockId: string): Promise<Record<string, unknown>> {
    const prep = await this.get(preparationId)
    const body = prep.body as PrepBody
    const block = body.stages.flatMap(stage => stage.blocks).find(b => b.id === blockId && b.kind === 'personnage')
    if (!block) throw new NotFoundException('Personnage absent de la préparation enregistrée.')
    const context = await this.channelFor(prep.sessionId as string | null)
    const client = this.discord.requestClient()
    if (!client?.isReady()) throw new ServiceUnavailableException('Bot Discord indisponible : rien n’a été publié.')
    const channel = await client.channels.fetch(context.channel_id)
    if (!channel || !('send' in channel) || typeof channel.send !== 'function') throw new BadRequestException('Salon Discord non accessible au bot.')
    const candidate = block.npcId ? await this.codex.characterCandidate(block.npcId) : null
    if (block.npcId && !candidate) throw new BadRequestException('PNJ lié introuvable.')
    const name = candidate?.name ?? block.name ?? ''
    const portrait = candidate?.portrait ?? block.portraitUrl ?? ''
    if (!name) throw new BadRequestException('Nom du personnage manquant.')
    let profile: { published?: boolean; wikiPageTitle?: string } | null = null
    if (block.npcId) { try { profile = await this.codex.character(block.npcId) as typeof profile } catch { profile = null } }
    const presentation = await this.codex.createPresentation({ name, sourceNpcId: block.npcId, portraitUrl: portrait || null, showName: block.showName, channelId: context.channel_id, guildId: context.guild_id })
    const button = profile?.published && profile.wikiPageTitle
      ? new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Voir la fiche').setURL(this.codex.wikiPageUrl(profile.wikiPageTitle))
      : new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId(`pf2-character:create:${presentation.id}`).setLabel(profile ? 'Publier la fiche' : 'Créer la fiche')
    const components: Array<ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>> = []
    const factions = await this.codex.playerFactionCandidates(true)
    if (!profile?.published && factions.length) {
      const options = [{ label: '(Aucune faction)', value: 'none', default: true }, ...factions.slice(0, 24).map(faction => ({ label: faction.path.slice(0, 100), value: faction.id }))]
      components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(new StringSelectMenuBuilder().setCustomId(`pf2-character:faction:${presentation.id}`).setPlaceholder('Faction principale (facultative)').addOptions(options)))
    }
    components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(button))
    let file: string | null = null
    if (/^https:\/\//i.test(portrait)) file = portrait
    else if (portrait.startsWith('assets/l7r/')) {
      const relative = portrait.slice('assets/l7r/'.length)
      if (!relative || relative.split(/[\\/]/).some(part => part === '..' || part === '.')) throw new BadRequestException('Chemin de portrait interdit.')
      const root = resolve(process.env['FOUNDRY_ASSETS_ROOT'] ?? '/app/foundry-assets')
      file = resolve(root, relative)
      if (!file.startsWith(`${root}/`)) throw new BadRequestException('Chemin de portrait interdit.')
    }
    else if (portrait) throw new BadRequestException('Portrait : utiliser une URL HTTPS ou un asset Foundry.')
    let message
    try {
      message = await channel.send({ content: block.showName === false ? '\u200b' : name, files: file ? [file] : [], components, allowedMentions: { parse: [] } })
    } catch (error) {
      throw new ServiceUnavailableException(`Partage Discord impossible : ${error instanceof Error ? error.message : String(error)}`)
    }
    try {
      await this.codex.savePresentationMessage(presentation.id, message.id, message.attachments.first()?.url ?? (portrait || null))
      if (!profile?.published && factions.length) this.commands.registerPreparedCharacterFaction(presentation.id)
    } catch (error) {
      throw new ServiceUnavailableException(`Message Discord publié (${message.url}), mais synchronisation Foundry non enregistrée : ${error instanceof Error ? error.message : String(error)}`)
    }
    return { discord: 'sent', foundry: 'queued', discordUrl: message.url, presentationId: presentation.id, channelId: context.channel_id }
  }
}
