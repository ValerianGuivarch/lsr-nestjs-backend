import { Injectable } from '@nestjs/common'
import { ChatInputCommandInteraction, RESTPostAPIApplicationGuildCommandsJSONBody, SlashCommandBuilder } from 'discord.js'

@Injectable()
export class DiscordCommandsService {
  definitions(): RESTPostAPIApplicationGuildCommandsJSONBody[] {
    return [new SlashCommandBuilder().setName('ping').setDescription('Vérifie que PF2-Bot répond.').toJSON()]
  }

  async handle(interaction: Pick<ChatInputCommandInteraction, 'commandName' | 'reply'>): Promise<boolean> {
    if (interaction.commandName !== 'ping') return false
    await interaction.reply({ content: 'Pong !', ephemeral: true })
    return true
  }
}
