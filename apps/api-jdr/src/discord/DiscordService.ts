import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import {
  Client,
  Events,
  GatewayIntentBits,
  Interaction,
  Message,
  MessageCreateOptions,
  REST,
  Routes,
  TextChannel,
  ThreadAutoArchiveDuration,
} from 'discord.js'
import { DiscordCommandsService } from './DiscordCommandsService'
import type { Pf2Session } from '../pf2-storage/Pf2PersistenceService'
import { FoundryRelayService } from '../foundry/FoundryRelayService'

export type DiscordResumeSync = {
  status: 'skipped' | 'created' | 'updated' | 'failed'
  messageId?: string
  reason?: string
}

@Injectable()
export class DiscordService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DiscordService.name)
  private client: Client | null = null

  /**
   * Mapping nom de joueur normalisé -> Discord user ID.
   *
   * La normalisation :
   * - ignore les majuscules/minuscules
   * - ignore les accents
   * - trim les espaces
   *
   * Exemple :
   * "ÉRIC", "éric", "Eric" => "eric"
   */
  private readonly discordIdsByPlayerName: Record<string, string> = {
    julien: '308566148931387393',
    jupi: '308566148931387393',

    valerian: '492387405760823297',
    valou: '492387405760823297',

    david: '688742453276180560',
    tom: '134346709487714304',
    sameh: '688791427253403679',
    arcady: '344733584441081857',

    eric: '399621722158137346',

    mana: '404629333534179338',
    marinella: '404629333534179338',

    nico: '688860103629340690',
    nicolas: '688860103629340690',

    gus: '671746679636099094',
    augustin: '671746679636099094',

    elena: '689036096767524866',

    guilhem: '448500183186145291',

    arthur: '557907871212503050',
  }

  constructor(
    private readonly commands: DiscordCommandsService,
    private readonly foundry: FoundryRelayService,
  ) {}

  async onModuleInit(): Promise<void> {
    const config = this.config()
    if (!config) return

    let client: Client | null = null

    try {
      client = new Client({
        intents: [GatewayIntentBits.Guilds],
      })

      client.on(Events.InteractionCreate, (interaction: Interaction) => {
        if (!interaction.isChatInputCommand()) return

        void this.commands
          .handle(interaction)
          .catch((error: unknown) =>
            this.logger.error(
              'Discord interaction failed',
              error instanceof Error ? error.stack : undefined,
            ),
          )
      })

      client.once(Events.ClientReady, (readyClient) =>
        this.logger.log(`Discord connected as ${readyClient.user.tag}`),
      )

      await client.login(config.token)

      await new REST({ version: '10' })
        .setToken(config.token)
        .put(
          Routes.applicationGuildCommands(
            config.clientId,
            config.guildId,
          ),
          {
            body: this.commands.definitions(),
          },
        )

      this.client = client

      this.logger.log(
        'Discord slash commands registered for the configured guild.',
      )
    } catch (error) {
      this.logger.error(
        'Discord startup failed; API remains available.',
        error instanceof Error ? error.stack : undefined,
      )

      client?.destroy()
      this.client = null
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.client?.destroy()
    this.client = null
  }

  async synchronizeResumeShortSummary(
    resume: Pf2Session,
  ): Promise<DiscordResumeSync> {
    if (!resume.shortSummary.trim()) {
      return {
        status: 'skipped',
        reason: 'Résumé court vide.',
      }
    }

    if (!this.client) {
      return {
        status: 'skipped',
        reason: 'Discord indisponible ou désactivé.',
      }
    }

    const config = this.config()

    if (!config) {
      return {
        status: 'skipped',
        reason: 'Discord indisponible ou désactivé.',
      }
    }

    try {
      const channel = await this.summaryChannel(config)

      const existing = await this.findResumeMessage(
        channel,
        resume,
      )

      const payload = await this.resumeMessagePayload(
        resume,
      )

      /**
       * Si le message existe déjà :
       * on l'édite, on ne recrée pas le message ni le thread.
       */
      if (existing) {
        await existing.edit({
          content: payload.content,
          allowedMentions: payload.allowedMentions,
        })

        return {
          status: 'updated',
          messageId: existing.id,
        }
      }

      /**
       * Sinon :
       * création du message + thread de commentaires.
       */
      const created = await channel.send(payload)

      const thread = await created.startThread({
        name: `Commentaires — Résumé #${resume.sessionNumber}`,
        autoArchiveDuration:
          ThreadAutoArchiveDuration.OneDay,
      })

      await thread.send(
        "N'hésitez pas à commenter ici !",
      )

      return {
        status: 'created',
        messageId: created.id,
      }
    } catch (error) {
      this.logger.error(
        `Discord summary synchronization failed for ${resume.id}`,
        error instanceof Error ? error.stack : undefined,
      )

      return {
        status: 'failed',
        reason:
          error instanceof Error
            ? error.message
            : 'Erreur Discord inconnue.',
      }
    }
  }

  private async summaryChannel(
    config: DiscordConfig,
  ): Promise<TextChannel> {
    const client = this.requireClient()

    const guild = await client.guilds.fetch(
      config.guildId,
    )

    await guild.channels.fetch()

    const channel = guild.channels.cache.find(
      (candidate) =>
        candidate.name === config.summaryChannelName &&
        candidate.isTextBased(),
    ) as TextChannel | undefined

    if (!channel) {
      throw new Error(
        `Canal Discord introuvable : ${config.summaryChannelName}`,
      )
    }

    return channel
  }

  private async findResumeMessage(
    channel: TextChannel,
    resume: Pf2Session,
  ): Promise<Message | null> {
    const matches = (
      message: Message | null | undefined,
    ): message is Message =>
      Boolean(
        message &&
          this.isResumeMessage(
            message,
            resume.id,
          ),
      )

    /**
     * On tente d'abord le message ID stocké en base.
     */
    if (resume.discordMessageId) {
      const cached = await channel.messages
        .fetch(resume.discordMessageId)
        .catch(() => null)

      if (matches(cached)) {
        return cached
      }
    }

    /**
     * Mais on ne dépend pas uniquement de l'ID stocké :
     * on cherche aussi la signature stable dans l'historique.
     *
     * Si le message a été supprimé manuellement sur Discord,
     * on arrivera naturellement à null et il sera recréé.
     */
    let before: string | undefined

    for (;;) {
      const page = await channel.messages.fetch({
        limit: 100,
        before,
      })

      const found = page.find((message) =>
        this.isResumeMessage(
          message,
          resume.id,
        ),
      )

      if (found) {
        return found
      }

      const oldest = page.last()

      if (
        page.size < 100 ||
        !oldest
      ) {
        return null
      }

      before = oldest.id
    }
  }

  private isResumeMessage(
    message: Message,
    resumeId: string,
  ): boolean {
    return (
      message.author.id ===
        this.client?.user?.id &&
      message.content.includes(
        this.resumeSignature(resumeId),
      )
    )
  }

  private async resumeMessagePayload(
    resume: Pf2Session,
  ): Promise<MessageCreateOptions> {
    const title = resume.title.trim()

    /**
     * Récupération des noms Foundry.
     *
     * Exemple :
     * Actor.u5TLgUAsPlLH2lvJ
     * => "Tsuyi (Guilhem)"
     */
    const names = new Map(
      (
        await this.foundry.listActors()
      ).map((actor) => [
        actor.uuid,
        actor.name,
      ]),
    )

    /**
     * Exemple :
     *
     * "Tsuyi (Guilhem)"
     * => "Tsuyi <@448500183186145291>"
     *
     * "Janira Gavix"
     * => "Janira Gavix"
     */
    const label = (uuid: string) =>
      this.actorLabel(
        uuid,
        names,
      )

    const participants =
      resume.participants
        .map(label)
        .join(', ')

    const facts = [
      participants &&
        `PJ : ${participants}`,

      resume.sessionXp > 0 &&
        `XP total : ${
          resume.sessionXp *
          resume.participants.length
        }, soit ${resume.sessionXp} par PJ`,

      resume.shortSummaryAuthor &&
        `Auteur du résumé : ${label(
          resume.shortSummaryAuthor,
        )} (+${resume.shortSummaryXp} XP)`,

      resume.longSummaryAuthor &&
        `Version longue : ${label(
          resume.longSummaryAuthor,
        )} (+${resume.longSummaryXp} XP)${
          resume.longSummaryUrl
            ? `, disponible ici : ${resume.longSummaryUrl}`
            : ''
        }`,
    ]
      .filter(Boolean)
      .join('\n')

    /**
     * IDs Discord correspondant aux acteurs utilisés
     * dans ce résumé.
     *
     * Cela permet à Discord de réellement transformer
     * <@ID> en mention.
     */
    const actorMentionIds = [
      ...resume.participants,
      resume.shortSummaryAuthor,
      resume.longSummaryAuthor,
    ]
      .filter(
        (uuid): uuid is string =>
          Boolean(uuid),
      )
      .map((uuid) => {
        const rawName =
          names.get(uuid)

        if (!rawName) {
          return null
        }

        return this.actorInfo(
          rawName,
        ).discordId
      })
      .filter(
        (id): id is string =>
          Boolean(id),
      )

    return {
      content: [
        [
          `**Séance #${resume.sessionNumber}${
            title
              ? ` — ${title}`
              : ''
          }**`,
          resume.date &&
            `*${resume.date}*`,
        ]
          .filter(Boolean)
          .join('\n'),

        resume.shortSummary,

        [
          '**Informations**',
          facts ||
            'Aucune information complémentaire.',
        ].join('\n'),

        `-# ${this.resumeSignature(
          resume.id,
        )}`,
      ]
        .filter(Boolean)
        .join('\n\n'),

      allowedMentions: {
        users: [
          ...new Set(
            actorMentionIds,
          ),
        ],
      },
    }
  }

  /**
   * Normalise un nom pour pouvoir faire
   * des correspondances souples.
   *
   * Exemples :
   *
   * "Éric"     => "eric"
   * "ÉRIC"     => "eric"
   * "  Eric "  => "eric"
   * "Valérian" => "valerian"
   */
  private normalizePlayerName(
    value: string,
  ): string {
    return value
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
      .trim()
      .toLowerCase()
  }

  /**
   * Analyse le nom Foundry.
   *
   * Exemple :
   *
   * "Tsuyi (Guilhem)"
   *
   * devient :
   *
   * {
   *   actorName: "Tsuyi",
   *   discordId: "448500183186145291"
   * }
   *
   * Si aucun joueur n'est indiqué :
   *
   * "Janira Gavix"
   *
   * devient :
   *
   * {
   *   actorName: "Janira Gavix",
   *   discordId: null
   * }
   */
  private actorInfo(
    rawName: string,
  ): {
    actorName: string
    discordId: string | null
  } {
    const match =
      rawName.match(
        /^(.*?)\s*\(([^)]+)\)\s*$/,
      )

    if (!match) {
      return {
        actorName:
          rawName.trim(),
        discordId: null,
      }
    }

    const actorName =
      match[1].trim()

    const playerName =
      this.normalizePlayerName(
        match[2],
      )

    return {
      actorName,
      discordId:
        this.discordIdsByPlayerName[
          playerName
        ] ?? null,
    }
  }

  /**
   * Retourne le label final destiné à Discord.
   *
   * Si le Discord ID existe :
   *
   * Tsuyi <@448500183186145291>
   *
   * Sinon :
   *
   * Janira Gavix
   *
   * ou, par exemple :
   *
   * Oxi (Quelqu'un)
   *
   * devient simplement :
   *
   * Oxi
   */
  private actorLabel(
    uuid: string,
    names: Map<string, string>,
  ): string {
    const rawName =
      names.get(uuid) ??
      uuid

    const {
      actorName,
      discordId,
    } =
      this.actorInfo(rawName)

    if (!discordId) {
      return actorName
    }

    return `${actorName} <@${discordId}>`
  }

  private resumeSignature(
    id: string,
  ): string {
    return `pf2-resume:${id}`
  }

  private requireClient(): Client {
    if (!this.client) {
      throw new Error(
        'Client Discord indisponible.',
      )
    }

    return this.client
  }

  private config(): DiscordConfig | null {
    const token =
      process.env[
        'DISCORD_BOT_TOKEN'
      ]?.trim()

    const clientId =
      process.env[
        'DISCORD_CLIENT_ID'
      ]?.trim()

    const guildId =
      process.env[
        'DISCORD_GUILD_ID'
      ]?.trim()

    if (
      token &&
      clientId &&
      guildId
    ) {
      return {
        token,
        clientId,
        guildId,

        summaryChannelName:
          process.env[
            'DISCORD_SUMMARIES_CHANNEL_NAME'
          ]?.trim() ||
          'résumés-courts',
      }
    }

    const missing = [
      !token &&
        'DISCORD_BOT_TOKEN',

      !clientId &&
        'DISCORD_CLIENT_ID',

      !guildId &&
        'DISCORD_GUILD_ID',
    ]
      .filter(Boolean)
      .join(', ')

    this.logger.log(
      `Discord disabled: missing ${missing}.`,
    )

    return null
  }
}

type DiscordConfig = {
  token: string
  clientId: string
  guildId: string
  summaryChannelName: string
}
