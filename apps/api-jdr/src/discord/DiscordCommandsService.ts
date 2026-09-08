import { Injectable } from '@nestjs/common'
import { ActionRowBuilder, ChatInputCommandInteraction, ModalBuilder, ModalSubmitInteraction, RESTPostAPIApplicationGuildCommandsJSONBody, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, TextInputBuilder, TextInputStyle } from 'discord.js'
import { FoundryRelayService } from '../foundry/FoundryRelayService'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'

@Injectable()
export class DiscordCommandsService {
  private readonly pendingGames = new Map<string, { actors: Array<{ uuid: string; name: string; player: string; userId: string }>; userIds: string[]; selected?: Array<{ uuid: string; name: string; player: string; userId: string }> }>()
  constructor(private readonly persistence: Pf2PersistenceService, private readonly foundry: FoundryRelayService) {}

  definitions(): RESTPostAPIApplicationGuildCommandsJSONBody[] {
    return [
      new SlashCommandBuilder().setName('ping').setDescription('Vérifie que PF2-Bot répond.').toJSON(),
      new SlashCommandBuilder().setName('rec').setDescription('Récapitule les séances jouées par joueur.').toJSON(),
      new SlashCommandBuilder().setName('recap').setDescription('Récapitule les séances jouées par joueur.').toJSON(),
      new SlashCommandBuilder().setName('new-game').setDescription('Prépare une nouvelle mission PF2.').addUserOption(option => option.setName('joueur1').setDescription('Premier joueur').setRequired(true)).addUserOption(option => option.setName('joueur2').setDescription('Deuxième joueur')).addUserOption(option => option.setName('joueur3').setDescription('Troisième joueur')).addUserOption(option => option.setName('joueur4').setDescription('Quatrième joueur')).addUserOption(option => option.setName('joueur5').setDescription('Cinquième joueur')).addUserOption(option => option.setName('joueur6').setDescription('Sixième joueur')).toJSON(),
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
    if (interaction.commandName === 'new-game') {
      await this.newGame(interaction as ChatInputCommandInteraction)
      return true
    }
    return false
  }

  async handleComponent(interaction: StringSelectMenuInteraction): Promise<boolean> {
    if (!interaction.customId.startsWith('pf2-new-game:')) return false
    const pending = this.pendingGames.get(interaction.customId)
    if (!pending) { await interaction.reply({ content: 'Cette préparation a expiré. Relance `/new-game`.', ephemeral: true }); return true }
    if (interaction.customId.endsWith(':date')) {
      if (interaction.values[0] === 'custom') {
        const plan = await this.plan(pending.selected ?? [])
        const modal = new ModalBuilder().setCustomId(interaction.customId).setTitle('Date de la mission')
        const input = new TextInputBuilder().setCustomId('date').setLabel(`À partir du ${plan.earliest}`).setStyle(TextInputStyle.Short).setPlaceholder('YYYY-MM-DD').setRequired(true)
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input))
        await interaction.showModal(modal)
        return true
      }
      const plan = await this.plan(pending.selected ?? [])
      const date = interaction.values[0] === 'current' ? plan.current : plan.earliest
      await this.finishGame(interaction, pending, date, plan)
      return true
    }
    if (interaction.values.length !== pending.userIds.length) { await interaction.reply({ content: `Choisis exactement ${pending.userIds.length} PJ.`, ephemeral: true }); return true }
    const selected = pending.actors.filter(actor => interaction.values.includes(actor.uuid))
    if (new Set(selected.map(actor => actor.userId)).size !== pending.userIds.length) { await interaction.reply({ content: 'Choisis un PJ distinct pour chaque joueur.', ephemeral: true }); return true }
    pending.selected = selected
    const plan = await this.plan(selected)
    const id = interaction.customId.replace(/:players$/, ':date')
    this.pendingGames.set(id, pending)
    this.pendingGames.delete(interaction.customId)
    const select = new StringSelectMenuBuilder().setCustomId(id).setPlaceholder('Choisis la date de début').addOptions([
      { label: `Le plus tôt — ${this.displayDate(plan.earliest)}`, value: 'earliest' },
      { label: `Date actuelle — ${this.displayDate(plan.current)}`, value: 'current' },
      { label: 'Choisir une autre date…', value: 'custom' },
    ])
    await interaction.update({ content: `${selected.map(actor => actor.name).join(', ')}\n${plan.downtime.join('\n')}\n\nChoisis la date de début.`, components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)] })
    return true
  }

  async handleModal(interaction: ModalSubmitInteraction): Promise<boolean> {
    if (!interaction.customId.startsWith('pf2-new-game:')) return false
    const pending = this.pendingGames.get(interaction.customId)
    if (!pending) { await interaction.reply({ content: 'Cette préparation a expiré. Relance `/new-game`.', ephemeral: true }); return true }
    const date = interaction.fields.getTextInputValue('date').trim()
    const plan = await this.plan(pending.selected ?? [])
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < plan.earliest) { await interaction.reply({ content: `Choisis une date YYYY-MM-DD à partir du ${this.displayDate(plan.earliest)}.`, ephemeral: true }); return true }
    await this.finishGameModal(interaction, pending, date, plan)
    this.pendingGames.delete(interaction.customId)
    return true
  }

  private async newGame(interaction: ChatInputCommandInteraction): Promise<void> {
    const users = ['joueur1', 'joueur2', 'joueur3', 'joueur4', 'joueur5', 'joueur6'].flatMap(name => { const user = interaction.options.getUser(name); return user ? [user] : [] })
    const userIds = [...new Set(users.map((user) => user.id))]
    const names = await this.actorNames()
    const known = [...names.entries()].flatMap(([uuid, name]) => {
      const player = this.playerName(name)
      const userId = this.discordId(player)
      return userId && userIds.includes(userId) ? [{ uuid, name, player, userId }] : []
    })
    const choices = known.slice(0, 25).map(actor => ({ label: actor.name.slice(0, 100), value: actor.uuid }))
    if (!choices.length) { await interaction.reply({ content: 'Aucun PJ associé aux joueurs indiqués. Les PJ doivent être nommés « Personnage (Joueur) ».', ephemeral: true }); return }
    const id = `pf2-new-game:${interaction.id}:players`
    this.pendingGames.set(id, { actors: known, userIds })
    const select = new StringSelectMenuBuilder().setCustomId(id).setPlaceholder('Choisis un PJ par joueur').setMinValues(userIds.length).setMaxValues(userIds.length).addOptions(choices)
    await interaction.reply({ content: `Préparation pour ${users.map(user => `<@${user.id}>`).join(', ')}. Choisis leurs PJ participants.`, components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)], ephemeral: true })
  }

  private async plan(actors: Array<{ uuid: string; name: string }>): Promise<{ current: string; earliest: string; downtime: string[] }> {
    const sessions = (await this.persistence.listSessions()).filter((session) => session.published)
    const current = sessions.map((session) => this.missionEnd(session)).filter(Boolean).sort().at(-1) || this.today()
    const availability = actors.map((actor) => {
      const last = sessions.filter((session) => session.participants.includes(actor.uuid)).sort((left, right) => this.missionEnd(left).localeCompare(this.missionEnd(right))).at(-1)
      const available = last ? this.addDays(this.missionEnd(last), 1) : current
      const missed = last ? sessions.filter((session) => session.sessionNumber > last.sessionNumber).length : sessions.length
      return { actor, available, missed }
    })
    return { current, earliest: availability.map((item) => item.available).sort().at(-1) || current, downtime: availability.map((item) => `${item.actor.name} : ${item.missed} downtime (disponible le ${this.displayDate(item.available)})`) }
  }

  private async finishGame(interaction: StringSelectMenuInteraction, pending: { selected?: Array<{ uuid: string; name: string }> }, date: string, plan: { downtime: string[] }): Promise<void> {
    const sessions = await this.persistence.listSessions()
    const sessionNumber = Math.max(0, ...sessions.map((session) => session.sessionNumber)) + 1
    const draft = await this.persistence.createSession({ sessionNumber, date, endDate: '', title: '', participants: (pending.selected ?? []).map((actor) => actor.uuid), published: false })
    const content = `Brouillon créé : résumé n°${draft.sessionNumber}.\nDébut : ${this.displayDate(date)}. Fin : à renseigner.\n${plan.downtime.join('\n')}\n\nComplète puis publie le résumé dans l’application MJ.`
    await interaction.update({ content, components: [] })
  }

  private async finishGameModal(interaction: ModalSubmitInteraction, pending: { selected?: Array<{ uuid: string; name: string }> }, date: string, plan: { downtime: string[] }): Promise<void> {
    const sessions = await this.persistence.listSessions()
    const sessionNumber = Math.max(0, ...sessions.map((session) => session.sessionNumber)) + 1
    const draft = await this.persistence.createSession({ sessionNumber, date, endDate: '', title: '', participants: (pending.selected ?? []).map((actor) => actor.uuid), published: false })
    await interaction.reply({ content: `Brouillon créé : résumé n°${draft.sessionNumber}.\nDébut : ${this.displayDate(date)}. Fin : à renseigner.\n${plan.downtime.join('\n')}\n\nComplète puis publie le résumé dans l’application MJ.`, ephemeral: true })
  }

  private missionEnd(session: import('../pf2-storage/Pf2PersistenceService').Pf2Session): string { return session.endDate || session.date }
  private today(): string { return new Date().toISOString().slice(0, 10) }
  private addDays(date: string, days: number): string { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10) }
  private displayDate(date: string): string { const [year, month, day] = date.split('-').map(Number); const months = ['Abadius', 'Calistril', 'Pharast', 'Gozran', 'Desnus', 'Sarenith', 'Erastus', 'Arodus', 'Rova', 'Lamashan', 'Neth', 'Kuthona']; return `${day} ${months[month - 1]} ${year + 1694} AR (${day}/${String(month).padStart(2, '0')}/${year})` }
  private discordId(player: string): string | undefined { return ({ jupi: '308566148931387393', julien: '308566148931387393', valerian: '492387405760823297', valou: '492387405760823297', david: '688742453276180560', tom: '134346709487714304', sameh: '688791427253403679', arcady: '344733584441081857', eric: '399621722158137346', mana: '404629333534179338', marinella: '404629333534179338', nico: '688860103629340690', nicolas: '688860103629340690', gus: '671746679636099094', augustin: '671746679636099094', elena: '689036096767524866', guilhem: '448500183186145291', arthur: '557907871212503050' })[player.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()] }

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
