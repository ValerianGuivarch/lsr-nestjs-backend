import { Injectable } from '@nestjs/common'
import { ChatInputCommandInteraction, RESTPostAPIApplicationGuildCommandsJSONBody, SlashCommandBuilder } from 'discord.js'
import { FoundryRelayService } from '../foundry/FoundryRelayService'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'

@Injectable()
export class DiscordCommandsService {
  constructor(private readonly persistence: Pf2PersistenceService, private readonly foundry: FoundryRelayService) {}

  definitions(): RESTPostAPIApplicationGuildCommandsJSONBody[] {
    return [
      new SlashCommandBuilder().setName('ping').setDescription('Vérifie que PF2-Bot répond.').toJSON(),
      new SlashCommandBuilder().setName('rec').setDescription('Récapitule les séances jouées par joueur.').toJSON(),
      new SlashCommandBuilder().setName('recap').setDescription('Récapitule les séances jouées par joueur.').toJSON(),
    ]
  }

  async handle(interaction: Pick<ChatInputCommandInteraction, 'commandName' | 'reply'>): Promise<boolean> {
    if (interaction.commandName === 'ping') {
      await interaction.reply({ content: 'Pong !', ephemeral: true })
      return true
    }
    if (interaction.commandName === 'rec' || interaction.commandName === 'recap') {
      await interaction.reply({ content: await this.recapMessage() })
      return true
    }
    return false
  }

  private async recapMessage(): Promise<string> {
    const [sessions, names] = await Promise.all([this.persistence.listSessions(), this.actorNames()])
    const counts = new Map<string, number>()
    for (const session of sessions) {
      const players = new Set(session.participants.map((uuid) => this.playerName(names.get(uuid) ?? uuid)))
      for (const player of players) counts.set(player, (counts.get(player) ?? 0) + 1)
    }
    if (!counts.size) return '**Récapitulatif des séances**\nAucune participation renseignée.'
    const rows = [...counts.entries()].sort(([leftName, leftCount], [rightName, rightCount]) => leftCount - rightCount || leftName.localeCompare(rightName, 'fr'))
    const lines = rows.map(([name, count]) => `• ${name} — ${count} séance${count > 1 ? 's' : ''}`)
    return `**Récapitulatif des séances**\n${lines.join('\n')}`.slice(0, 2_000)
  }

  private async actorNames(): Promise<Map<string, string>> {
    try {
      const actors = await this.foundry.listActors()
      if (actors.length) {
        await this.persistence.saveFoundryActorCache(actors)
        return new Map(actors.map((actor) => [actor.uuid, actor.name]))
      }
    } catch { /* Foundry remains optional for a Discord recap. */ }
    return new Map((await this.persistence.readFoundryActorCache()).map((actor) => [actor.uuid, actor.name]))
  }

  private playerName(actorName: string): string {
    const match = /\(([^()]+)\)\s*$/.exec(actorName.trim())
    return match?.[1]?.trim() || actorName.replace(/^Actor\./, '')
  }
}
