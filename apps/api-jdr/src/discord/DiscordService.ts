import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Client, Events, GatewayIntentBits, Interaction, REST, Routes } from 'discord.js'
import { DiscordCommandsService } from './DiscordCommandsService'

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

  private config(): { token: string; clientId: string; guildId: string } | null {
    const token = process.env['DISCORD_BOT_TOKEN']?.trim()
    const clientId = process.env['DISCORD_CLIENT_ID']?.trim()
    const guildId = process.env['DISCORD_GUILD_ID']?.trim()
    if (token && clientId && guildId) return { token, clientId, guildId }
    const missing = [!token && 'DISCORD_BOT_TOKEN', !clientId && 'DISCORD_CLIENT_ID', !guildId && 'DISCORD_GUILD_ID'].filter(Boolean).join(', ')
    this.logger.log(`Discord disabled: missing ${missing}.`)
    return null
  }
}
