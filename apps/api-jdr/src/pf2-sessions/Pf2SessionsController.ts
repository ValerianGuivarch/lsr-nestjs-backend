import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import {
  Pf2PersistenceService,
  Pf2Session,
  Pf2SessionInput,
} from '../pf2-storage/Pf2PersistenceService'
import {
  DiscordResumeSync,
  DiscordService,
} from '../discord/DiscordService'

@Controller([
  'api/pf2-mj/sessions',
  'api/v1/pf2-mj/sessions',
])
@ApiTags('PF2 séances')
export class Pf2SessionsController {
  constructor(
    private readonly persistence: Pf2PersistenceService,
    private readonly discord: DiscordService,
  ) {}

  @Get()
  list(): Promise<Pf2Session[]> {
    return this.persistence.listSessions()
  }

  @Get(':id')
  async get(
    @Param('id') id: string,
  ): Promise<Pf2Session> {
    const session =
      await this.persistence.getSession(id)

    if (!session) {
      throw new NotFoundException(
        'Séance introuvable.',
      )
    }

    return session
  }

  @Post()
  async create(
    @Body() body: Pf2SessionInput,
  ): Promise<{
    resume: Pf2Session
    discord: DiscordResumeSync
  }> {
    try {
      const resume =
        await this.persistence.createSession(
          { ...(body ?? {}), published: false },
        )

      return {
        resume,
        discord: { status: 'skipped', reason: 'Brouillon enregistré.' },
      }
    } catch (error) {
      throw new HttpException(
        error instanceof Error
          ? error.message
          : 'Séance invalide.',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Pf2SessionInput,
  ): Promise<{
    resume: Pf2Session
    discord: DiscordResumeSync
  }> {
    try {
      const session =
        await this.persistence.updateSession(
          id,
          body ?? {},
        )

      if (!session) {
        throw new NotFoundException(
          'Séance introuvable.',
        )
      }

      return {
        resume: session,
        discord: { status: 'skipped', reason: 'Résumé enregistré. Utilise Publier pour synchroniser Discord.' },
      }
    } catch (error) {
      if (
        error instanceof
        NotFoundException
      ) {
        throw error
      }

      throw new HttpException(
        error instanceof Error
          ? error.message
          : 'Séance invalide.',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string, @Body() body: Pf2SessionInput): Promise<{ resume: Pf2Session; discord: DiscordResumeSync }> {
    const resume = await this.persistence.updateSession(id, { ...(body ?? {}), published: true })
    if (!resume) throw new NotFoundException('Séance introuvable.')
    const discord = await this.synchronizeDiscord(resume)
    if (resume.shortSummary.trim() && discord.status !== 'created' && discord.status !== 'updated') {
      await this.persistence.updateSession(id, { published: false })
      throw new HttpException(discord.reason ?? 'Discord n’a pas confirmé la publication.', HttpStatus.BAD_REQUEST)
    }
    return { resume, discord }
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ): Promise<{
    success: true
    id: string
  }> {
    try {
      /*
       * On vérifie d'abord que le résumé existe.
       */
      const session =
        await this.persistence.getSession(id)

      if (!session) {
        throw new NotFoundException(
          'Séance introuvable.',
        )
      }

      /*
       * Suppression SQLite.
       */
      await this.persistence.deleteSession(id)

      return {
        success: true,
        id,
      }
    } catch (error) {
      if (
        error instanceof
        NotFoundException
      ) {
        throw error
      }

      throw new HttpException(
        error instanceof Error
          ? error.message
          : 'Impossible de supprimer la séance.',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  private async synchronizeDiscord(
    resume: Pf2Session,
  ): Promise<DiscordResumeSync> {
    if (!resume.published) return { status: 'skipped', reason: 'Brouillon non publié.' }
    const discord =
      await this.discord.synchronizeResumeShortSummary(
        resume,
      )

    if (
      (discord.status ===
        'created' ||
        discord.status ===
          'updated') &&
      discord.messageId
    ) {
      await this.persistence.saveSessionDiscordMessageId(
        resume.id,
        discord.messageId,
      )

      resume.discordMessageId =
        discord.messageId
    }

    return discord
  }
}
