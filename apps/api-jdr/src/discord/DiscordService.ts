import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Client, Events, GatewayIntentBits, Interaction, Message, MessageCreateOptions, REST, Routes, TextChannel, ThreadAutoArchiveDuration } from 'discord.js'
import { DiscordCommandsService } from './DiscordCommandsService'
import type { Pf2Session } from '../pf2-storage/Pf2PersistenceService'

export type DiscordResumeSync = { status: 'skipped' | 'created' | 'updated' | 'failed'; messageId?: string; reason?: string }

@Injectable()
export class DiscordService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DiscordService.name)
  private client: Client | null = null

  constructor(private readonly commands: DiscordCommandsService) {}

  async onModuleInit(): Promise<void> {
    const config = this.config()
    if (!config) return

    let client: Client | null = null
    try {
      client = new Client({ intents: [GatewayIntentBits.Guilds] })
      client.on(Events.InteractionCreate, (interaction: Interaction) => {
        if (!interaction.isChatInputCommand()) return
        void this.commands.handle(interaction).catch((error: unknown) => this.logger.error('Discord interaction failed', error instanceof Error ? error.stack : undefined))
      })
      client.once(Events.ClientReady, (readyClient) => this.logger.log(`Discord connected as ${readyClient.user.tag}`))

      await client.login(config.token)
      await new REST({ version: '10' }).setToken(config.token).put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: this.commands.definitions() }
      )
      this.client = client
      this.logger.log('Discord slash commands registered for the configured guild.')
    } catch (error) {
      this.logger.error('Discord startup failed; API remains available.', error instanceof Error ? error.stack : undefined)
      client?.destroy()
      this.client = null
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.client?.destroy()
    this.client = null
  }

  async synchronizeResumeShortSummary(resume: Pf2Session): Promise<DiscordResumeSync> {
    if (!resume.shortSummary.trim()) return { status: 'skipped', reason: 'Résumé court vide.' }
    if (!this.client) return { status: 'skipped', reason: 'Discord indisponible ou désactivé.' }
    const config = this.config()
    if (!config) return { status: 'skipped', reason: 'Discord indisponible ou désactivé.' }
    try {
      const channel = await this.summaryChannel(config)
      const existing = await this.findResumeMessage(channel, resume)
      const payload = await this.resumeMessagePayload(resume, config)
      if (existing) {
        await existing.edit({ content: payload.content, embeds: payload.embeds, allowedMentions: payload.allowedMentions })
        return { status: 'updated', messageId: existing.id }
      }
      const created = await channel.send(payload)
      const thread = await created.startThread({ name: `Commentaires — Résumé #${resume.sessionNumber}`, autoArchiveDuration: ThreadAutoArchiveDuration.OneDay })
      await thread.send("N'hésitez pas à commenter ici !")
      return { status: 'created', messageId: created.id }
    } catch (error) {
      this.logger.error(`Discord summary synchronization failed for ${resume.id}`, error instanceof Error ? error.stack : undefined)
      return { status: 'failed', reason: error instanceof Error ? error.message : 'Erreur Discord inconnue.' }
    }
  }

  private async summaryChannel(config: DiscordConfig): Promise<TextChannel> {
    const client = this.requireClient()
    const guild = await client.guilds.fetch(config.guildId)
    await guild.channels.fetch()
    const channel = guild.channels.cache.find((candidate) => candidate.name === config.summaryChannelName && candidate.isTextBased()) as TextChannel | undefined
    if (!channel) throw new Error(`Canal Discord introuvable : ${config.summaryChannelName}`)
    return channel
  }

  private async findResumeMessage(channel: TextChannel, resume: Pf2Session): Promise<Message | null> {
    const matches = (message: Message | null | undefined): message is Message => Boolean(message && this.isResumeMessage(message, resume.id))
    if (resume.discordMessageId) {
      const cached = await channel.messages.fetch(resume.discordMessageId).catch(() => null)
      if (matches(cached)) return cached
    }
    let before: string | undefined
    for (;;) {
      const page = await channel.messages.fetch({ limit: 100, before })
      const found = page.find((message) => this.isResumeMessage(message, resume.id))
      if (found) return found
      const oldest = page.last()
      if (page.size < 100 || !oldest) return null
      before = oldest.id
    }
  }

  private isResumeMessage(message: Message, resumeId: string): boolean {
    return message.author.id === this.client?.user?.id && message.embeds.some((embed) => embed.footer?.text === this.resumeSignature(resumeId))
  }

  private async resumeMessagePayload(resume: Pf2Session, config: DiscordConfig): Promise<MessageCreateOptions> {
    const userId = await this.findMentionedUserId(config)
    const title = resume.title.trim() || `Résumé #${resume.sessionNumber}`
    const facts = [resume.date && `Date : ${resume.date}`, resume.shortSummaryAuthor && `Auteur : ${resume.shortSummaryAuthor}`, resume.shortSummaryXp > 0 && `XP résumé : ${resume.shortSummaryXp}`, resume.sessionXp > 0 && `XP séance : ${resume.sessionXp}`].filter(Boolean).join('\n')
    return {
      content: userId ? `<@${userId}>` : undefined,
      allowedMentions: userId ? { users: [userId] } : { parse: [] },
      embeds: [{ title: `Séance #${resume.sessionNumber} — ${title}`, description: resume.shortSummary.slice(0, 4_000), fields: facts ? [{ name: 'Informations', value: facts }] : [], footer: { text: this.resumeSignature(resume.id) } }]
    }
  }

  private async findMentionedUserId(config: DiscordConfig): Promise<string | null> {
    const client = this.requireClient()
    const guild = await client.guilds.fetch(config.guildId)
    const members = await guild.members.fetch({ query: config.mentionUsername, limit: 10 })
    const expected = config.mentionUsername.toLowerCase()
    const member = members.find((candidate) => candidate.user.username.toLowerCase() === expected || candidate.user.globalName?.toLowerCase() === expected)
    if (!member) this.logger.warn(`Discord user not found for summary mention: ${config.mentionUsername}`)
    return member?.user.id ?? null
  }

  private resumeSignature(id: string): string { return `pf2-resume:${id}` }

  private requireClient(): Client {
    if (!this.client) throw new Error('Client Discord indisponible.')
    return this.client
  }

  private config(): DiscordConfig | null {
    const token = process.env['DISCORD_BOT_TOKEN']?.trim()
    const clientId = process.env['DISCORD_CLIENT_ID']?.trim()
    const guildId = process.env['DISCORD_GUILD_ID']?.trim()
    if (token && clientId && guildId) return { token, clientId, guildId, summaryChannelName: process.env['DISCORD_SUMMARIES_CHANNEL_NAME']?.trim() || 'test', mentionUsername: process.env['DISCORD_SUMMARIES_MENTION_USERNAME']?.trim() || 'valerian0276' }
    const missing = [!token && 'DISCORD_BOT_TOKEN', !clientId && 'DISCORD_CLIENT_ID', !guildId && 'DISCORD_GUILD_ID'].filter(Boolean).join(', ')
    this.logger.log(`Discord disabled: missing ${missing}.`)
    return null
  }
}

type DiscordConfig = { token: string; clientId: string; guildId: string; summaryChannelName: string; mentionUsername: string }
