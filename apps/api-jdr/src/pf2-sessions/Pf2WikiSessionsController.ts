import {
  Body,
  Controller,
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

type WikiSession = Pf2Session & {
  participantNames: string[]
  longSummaryAuthorName: string | null
  shortSummaryAuthorName: string | null
}

type WikiSessionsPayload = {
  sessions: WikiSession[]
  actors: FoundryActorCacheEntry[]
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
  'longSummaryXp',
  'shortSummaryXp',
  'shortSummary',
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
    const [sessions, cachedActors] = await Promise.all([
      this.persistence.listSessions(),
      this.persistence.readFoundryActorCache(),
    ])

    const actors = cachedActors
      .filter((actor) => playerActorName.test(actor.name.trim()))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

    const names = new Map(
      cachedActors.map((actor) => [actor.uuid, actor.name]),
    )

    const showDrafts = includeDrafts === '1' || includeDrafts === 'true'

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
        })),
      actors,
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
    if (!current) {
      throw new NotFoundException('Séance introuvable.')
    }

    const input = this.editableInput(body ?? {})

    if (
      typeof input.shortSummary === 'string' &&
      input.shortSummary.trim().length > 1400
    ) {
      throw new HttpException(
        'Le résumé court ne peut pas dépasser 1400 caractères.',
        HttpStatus.BAD_REQUEST,
      )
    }

    try {
      const resume = await this.persistence.updateSession(id, input)
      if (!resume) {
        throw new NotFoundException('Séance introuvable.')
      }

      if (!resume.published) {
        return {
          resume,
          discord: { status: 'skipped', reason: 'Brouillon non publié.' },
        }
      }

      const discord = await this.synchronizeDiscord(resume)

      if (
        resume.shortSummary.trim() &&
        discord.status !== 'created' &&
        discord.status !== 'updated'
      ) {
        await this.persistence.updateSession(id, this.snapshot(current))
        throw new HttpException(
          discord.reason ?? 'Discord n’a pas confirmé la mise à jour de la séance.',
          HttpStatus.BAD_GATEWAY,
        )
      }

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
    const current = await this.persistence.getSession(id)
    if (!current) {
      throw new NotFoundException('Séance introuvable.')
    }

    if (typeof body?.published !== 'boolean') {
      throw new HttpException(
        'published doit être un booléen.',
        HttpStatus.BAD_REQUEST,
      )
    }

    const resume = await this.persistence.updateSession(id, {
      published: body.published,
    })
    if (!resume) {
      throw new NotFoundException('Séance introuvable.')
    }

    if (!body.published) {
      return {
        resume,
        discord: { status: 'skipped', reason: 'Séance remise en brouillon.' },
      }
    }

    const discord = await this.synchronizeDiscord(resume)
    if (
      resume.shortSummary.trim() &&
      discord.status !== 'created' &&
      discord.status !== 'updated'
    ) {
      await this.persistence.updateSession(id, { published: current.published })
      throw new HttpException(
        discord.reason ?? 'Discord n’a pas confirmé la publication.',
        HttpStatus.BAD_GATEWAY,
      )
    }

    return { resume, discord }
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

  private snapshot(session: Pf2Session): Pf2SessionInput {
    return {
      sessionNumber: session.sessionNumber,
      date: session.date,
      inGameStartDate: session.inGameStartDate,
      inGameEndDate: session.inGameEndDate,
      title: session.title,
      participants: [...session.participants],
      longSummaryAuthor: session.longSummaryAuthor,
      shortSummaryAuthor: session.shortSummaryAuthor,
      sessionXp: session.sessionXp,
      longSummaryXp: session.longSummaryXp,
      shortSummaryXp: session.shortSummaryXp,
      shortSummary: session.shortSummary,
    }
  }

  private async synchronizeDiscord(
    resume: Pf2Session,
  ): Promise<DiscordResumeSync> {
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
  }
}
