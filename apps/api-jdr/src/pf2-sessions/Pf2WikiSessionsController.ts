import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import {
  FoundryActorCacheEntry,
  Pf2PersistenceService,
  Pf2Session,
  Pf2SessionInput,
} from '../pf2-storage/Pf2PersistenceService'
import {
  DiscordResumeSync,
  DiscordService,
} from '../discord/DiscordService'
import { buildSummaryRewardLedger } from './Pf2CareerXp'

type WikiSession = Pf2Session & {
  participantNames: string[]
  longSummaryAuthorName: string | null
  shortSummaryAuthorName: string | null
  shortSummaryLevelAtStart: number | null
  longSummaryLevelAtStart: number | null
}

type WikiScenarioOption = {
  id: string
  title: string
  kind: string
  campaignId: string | null
  campaignTitle: string | null
  playableComponents: Array<{
    id: string
    title: string
    order: number
  }>
}

type WikiSessionsPayload = {
  sessions: WikiSession[]
  actors: FoundryActorCacheEntry[]
  scenarios: WikiScenarioOption[]
}

const playerActorName = /^\S(?:.*\S)?\s+\([^()]+\)$/u

const editableFields: Array<keyof Pf2SessionInput> = [
  'sessionNumber',
  'date',
  'inGameStartDate',
  'inGameEndDate',
  'title',
  'participants',
  'longSummaryAuthor',
  'shortSummaryAuthor',
  'sessionXp',
  'shortSummary',
  'content',
]

@Controller([
  'api/pf2-mj/wiki/sessions',
  'api/v1/pf2-mj/wiki/sessions',
])
@ApiTags('PF2 séances — vue wiki')
export class Pf2WikiSessionsController {
  constructor(
    private readonly persistence: Pf2PersistenceService,
    private readonly discord: DiscordService,
  ) {}

  @Get()
  async list(
    @Query('includeDrafts') includeDrafts?: string,
  ): Promise<WikiSessionsPayload> {
    await this.normalizeSummaryBonuses()
    const [sessions, cachedActors, catalogue, curation] = await Promise.all([
      this.persistence.listSessions(),
      this.persistence.readFoundryActorCache(),
      this.persistence.readCatalogueSnapshot(),
      this.persistence.readCuration(),
    ])

    const actors = cachedActors
      .filter((actor) => playerActorName.test(actor.name.trim()))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

    const names = new Map(
      cachedActors.map((actor) => [actor.uuid, actor.name]),
    )

    const showDrafts = includeDrafts === '1' || includeDrafts === 'true'
    const summaryLedger = buildSummaryRewardLedger(sessions)

    return {
      sessions: sessions
        .filter((session) => showDrafts || session.published)
        .map((session) => ({
          ...session,
          participantNames: session.participants.map(
            (uuid) => names.get(uuid) ?? uuid,
          ),
          longSummaryAuthorName: session.longSummaryAuthor
            ? names.get(session.longSummaryAuthor) ?? session.longSummaryAuthor
            : null,
          shortSummaryAuthorName: session.shortSummaryAuthor
            ? names.get(session.shortSummaryAuthor) ?? session.shortSummaryAuthor
            : null,
          shortSummaryLevelAtStart: session.shortSummaryAuthor
            ? summaryLedger.get(session.id)?.short.levelAtStart ?? null
            : null,
          longSummaryLevelAtStart: session.longSummaryAuthor
            ? summaryLedger.get(session.id)?.long.levelAtStart ?? null
            : null,
        })),
      actors,
      scenarios: this.scenarioOptions(catalogue, curation),
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ): Promise<{
    resume: Pf2Session
    discord: DiscordResumeSync
  }> {
    const current = await this.persistence.getSession(id)
    if (!current) throw new NotFoundException('Séance introuvable.')

    const input = this.editableInput(body ?? {})

    if (
      typeof input.shortSummary === 'string' &&
      input.shortSummary.trim().length > 1550
    ) {
      throw new HttpException(
        'Le résumé court ne peut pas dépasser 1550 caractères.',
        HttpStatus.BAD_REQUEST,
      )
    }

    try {
      const saved = await this.persistence.updateSession(id, input)
      if (!saved) throw new NotFoundException('Séance introuvable.')

      await this.normalizeSummaryBonuses()
      const resume = await this.persistence.getSession(id)
      if (!resume) throw new NotFoundException('Séance introuvable.')

      if (!resume.published) {
        return {
          resume,
          discord: { status: 'skipped', reason: 'Brouillon non publié.' },
        }
      }

      // La base SQLite reste la source de vérité. Une panne Discord ne doit
      // jamais annuler silencieusement une édition faite depuis le wiki.
      const discord = await this.synchronizeDiscord(resume)
      return { resume, discord }
    } catch (error) {
      if (error instanceof HttpException || error instanceof NotFoundException) {
        throw error
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Séance invalide.',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post(':id/publication')
  async setPublication(
    @Param('id') id: string,
    @Body() body: { published?: unknown },
  ): Promise<{
    resume: Pf2Session
    discord: DiscordResumeSync
  }> {
    const rawPublished = body?.published

    let published: boolean

    if (
      rawPublished === true ||
      rawPublished === 1 ||
      rawPublished === '1' ||
      rawPublished === 'true'
    ) {
      published = true
    } else if (
      rawPublished === false ||
      rawPublished === 0 ||
      rawPublished === '0' ||
      rawPublished === 'false'
    ) {
      published = false
    } else {
      throw new HttpException(
        'published doit être un booléen.',
        HttpStatus.BAD_REQUEST,
      )
    }

    return this.discord.setResumePublication(id, published)
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: true; id: string }> {
    const current = await this.persistence.getSession(id)
    if (!current) throw new NotFoundException('Séance introuvable.')
    await this.persistence.deleteSession(id)
    await this.normalizeSummaryBonuses()
    return { success: true, id }
  }

  private editableInput(body: Record<string, unknown>): Pf2SessionInput {
    const input: Pf2SessionInput = {}
    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        ;(input as Record<string, unknown>)[field] = body[field]
      }
    }
    return input
  }

  private async normalizeSummaryBonuses(): Promise<void> {
    const sessions = await this.persistence.listSessions()
    const ledger = buildSummaryRewardLedger(sessions)

    for (const session of sessions) {
      const rewards = ledger.get(session.id)
      const shortSummaryXp = rewards?.short.xp ?? 0
      const longSummaryXp = rewards?.long.xp ?? 0
      const update: Pf2SessionInput = {}

      if (session.shortSummaryXp !== shortSummaryXp) update.shortSummaryXp = shortSummaryXp
      if (session.longSummaryXp !== longSummaryXp) update.longSummaryXp = longSummaryXp
      if (Object.keys(update).length) {
        await this.persistence.updateSession(session.id, update)
      }
    }
  }

  private scenarioOptions(
    catalogue: Record<string, unknown>,
    curation: Record<string, unknown>,
  ): WikiScenarioOption[] {
    const object = (value: unknown): Record<string, unknown> =>
      value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {}
    const strings = (value: unknown): string[] =>
      Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
    const overridesById = object(curation.byId)
    const legacyEntries = object(curation.entries)
    const journalStatuses = new Set(['to_play', 'in_progress', 'played'])
    const playablePartKinds = new Set([
      'volume_aventure',
      'aventure_autonome',
      'one_shot',
      'aventure_communautaire',
    ])

    const overrideFor = (id: string, scenario: boolean): Record<string, unknown> => {
      const generic = object(overridesById[id] ?? legacyEntries[id])
      const progressMap = object(
        scenario ? curation.progressByScenario : curation.progressByCampaign,
      )
      const progress = typeof generic.progress === 'string'
        ? generic.progress
        : typeof progressMap[id] === 'string'
          ? progressMap[id]
          : undefined

      let excluded = typeof generic.excluded === 'boolean' ? generic.excluded : undefined
      let preparationStatus = typeof generic.preparationStatus === 'string'
        ? generic.preparationStatus
        : undefined
      let playStatus = typeof generic.playStatus === 'string'
        ? generic.playStatus
        : undefined

      if (progress === 'Écarté' && excluded === undefined) excluded = true
      if (progress === 'Sélectionné') {
        preparationStatus ??= 'selected'
        playStatus ??= 'none'
      }
      if (progress === 'À jouer') {
        preparationStatus ??= 'selected'
        playStatus ??= 'to_play'
      }
      if (progress === 'En cours') {
        preparationStatus ??= 'untreated'
        playStatus ??= 'in_progress'
      }
      if (progress === 'Joué') {
        preparationStatus ??= 'untreated'
        playStatus ??= 'played'
      }

      if (excluded === undefined) {
        if (generic.inclusion === 'excluded') excluded = true
        else if (generic.inclusion === 'reinstated') excluded = false
        else if (scenario && strings(curation.excludedScenarioIds).includes(id)) excluded = true
        else if (!scenario && strings(curation.includedCampaignIds).includes(id)) excluded = false
        else if (!scenario && strings(curation.excludedCampaignIds).includes(id)) excluded = true
      }

      return { ...generic, progress, excluded, preparationStatus, playStatus }
    }

    const lifecycleStatus = (override: Record<string, unknown>): string => {
      if (override.excluded === true) {
        return override.excludedReason === 'later' ? 'later' : 'rejected'
      }
      const playStatus = typeof override.playStatus === 'string' ? override.playStatus : 'none'
      if (journalStatuses.has(playStatus)) return playStatus
      return override.preparationStatus === 'selected' ? 'retained' : 'untracked'
    }

    const rawCollections = Array.isArray(catalogue.collections)
      ? catalogue.collections
      : []
    const collections = new Map<string, Record<string, unknown>>()
    for (const raw of rawCollections) {
      if (!raw || typeof raw !== 'object') continue
      const item = raw as Record<string, unknown>
      const id = typeof item.id === 'string' ? item.id.trim() : ''
      if (id) collections.set(id, item)
    }

    const collectionExcluded = (id: string | null, seen = new Set<string>()): boolean => {
      if (!id || seen.has(id)) return false
      const item = collections.get(id)
      if (!item) return false
      const override = overrideFor(id, false)
      if (override.progress === 'Écarté') return true
      if (override.excluded !== undefined) return Boolean(override.excluded)
      const parentId = typeof item.parentId === 'string' && item.parentId.trim()
        ? item.parentId.trim()
        : null
      return collectionExcluded(parentId, new Set([...seen, id]))
    }

    const isExcluded = (
      override: Record<string, unknown>,
      fallback: boolean,
    ): boolean => {
      if (override.progress === 'Écarté') return true
      if (override.excluded !== undefined) return Boolean(override.excluded)
      return fallback
    }

    const componentsOf = (value: unknown): WikiScenarioOption['playableComponents'] => {
      const rawComponents = Array.isArray(value) ? value : []
      return rawComponents.flatMap((rawComponent, index) => {
        if (!rawComponent || typeof rawComponent !== 'object') return []
        const component = rawComponent as Record<string, unknown>
        const componentId = typeof component.id === 'string' ? component.id.trim() : ''
        if (!componentId) return []
        return [{
          id: componentId,
          title: typeof component.title === 'string' && component.title.trim()
            ? component.title.trim()
            : componentId,
          order: typeof component.order === 'number' ? component.order : index,
        }]
      }).sort((left, right) =>
        left.order - right.order || left.title.localeCompare(right.title, 'fr'),
      )
    }

    const rawEntries = Array.isArray(catalogue.entries) ? catalogue.entries : []
    const options: WikiScenarioOption[] = []

    for (const raw of rawEntries) {
      if (!raw || typeof raw !== 'object') continue
      const item = raw as Record<string, unknown>
      const id = typeof item.id === 'string' ? item.id.trim() : ''
      if (!id) continue
      const kind = typeof item.kind === 'string' ? item.kind : ''
      const story = object(item.story)
      const editorialExcluded = story.usage === 'ÉCARTÉ'
      const collectionId = typeof item.collectionId === 'string' && item.collectionId.trim()
        ? item.collectionId.trim()
        : null

      if (kind === 'campaign') {
        const campaignOverride = overrideFor(id, false)
        const campaignExcluded = isExcluded(
          campaignOverride,
          editorialExcluded || collectionExcluded(collectionId),
        )
        if (
          campaignExcluded ||
          !journalStatuses.has(lifecycleStatus(campaignOverride))
        ) continue

        const campaignTitle = this.catalogueTitle(item, id)
        const parts = Array.isArray(item.parts) ? item.parts : []
        for (const rawPart of parts) {
          if (!rawPart || typeof rawPart !== 'object') continue
          const part = rawPart as Record<string, unknown>
          const partKind = typeof part.kind === 'string' ? part.kind : ''
          if (!playablePartKinds.has(partKind)) continue
          const partId = typeof part.id === 'string' ? part.id.trim() : ''
          if (!partId) continue
          const partOverride = overrideFor(partId, false)
          if (isExcluded(partOverride, campaignExcluded)) continue

          options.push({
            id: partId,
            title: this.catalogueTitle(part, partId),
            kind: partKind,
            campaignId: id,
            campaignTitle,
            playableComponents: componentsOf(part.playableComponents),
          })
        }
        continue
      }

      const isLegacyScenario = ['pfs-scenario', 'pfs-intro', 'pfs-special'].includes(kind)
      const override = overrideFor(id, isLegacyScenario)
      const excluded = isExcluded(
        override,
        editorialExcluded || item.sectionId === 'legacy' || collectionExcluded(collectionId),
      )
      if (excluded || !journalStatuses.has(lifecycleStatus(override))) continue

      const collection = collectionId ? collections.get(collectionId) : null
      options.push({
        id,
        title: this.catalogueTitle(item, id),
        kind,
        campaignId: collectionId,
        campaignTitle: collection
          ? this.catalogueTitle(collection, collectionId!)
          : null,
        playableComponents: componentsOf(item.playableComponents),
      })
    }

    return options.sort((left, right) => {
      const leftCampaign = left.campaignTitle ?? ''
      const rightCampaign = right.campaignTitle ?? ''
      return leftCampaign.localeCompare(rightCampaign, 'fr') ||
        left.title.localeCompare(right.title, 'fr')
    })
  }

  private catalogueTitle(item: Record<string, unknown>, fallback: string): string {
    if (typeof item.titleFr === 'string' && item.titleFr.trim()) return item.titleFr.trim()
    if (typeof item.titleOriginal === 'string' && item.titleOriginal.trim()) return item.titleOriginal.trim()
    if (typeof item.name === 'string' && item.name.trim()) return item.name.trim()
    return fallback
  }

  private async synchronizeDiscord(
    resume: Pf2Session,
  ): Promise<DiscordResumeSync> {
    try {
      const discord = await this.discord.synchronizeResumeShortSummary(resume)

      if (
        (discord.status === 'created' || discord.status === 'updated') &&
        discord.messageId
      ) {
        await this.persistence.saveSessionDiscordMessageId(
          resume.id,
          discord.messageId,
        )
        resume.discordMessageId = discord.messageId
      }

      return discord
    } catch (error) {
      return {
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Erreur Discord inattendue.',
      }
    }
  }
}
