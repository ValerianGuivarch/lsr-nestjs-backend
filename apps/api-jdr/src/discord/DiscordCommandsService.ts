import { Injectable, Logger } from '@nestjs/common'
import { ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, ModalBuilder, ModalSubmitInteraction, RESTPostAPIApplicationGuildCommandsJSONBody, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, TextInputBuilder, TextInputStyle } from 'discord.js'
import { FoundryRelayService } from '../foundry/FoundryRelayService'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'
import { PlayerCodexService } from '../pf2-mj/PlayerCodexService'
import { MediaWikiClientService } from '../pf2-mj/MediaWikiClientService'

@Injectable()
export class DiscordCommandsService {
  private readonly logger = new Logger(DiscordCommandsService.name)
  private readonly pendingGames = new Map<string, { actors: Array<{ uuid: string; name: string; player: string; userId: string }>; userIds: string[]; selected?: Array<{ uuid: string; name: string; player: string; userId: string }> }>()
  private readonly pendingAnnouncements = new Map<string, { content: string; userIds: string[] }>()
  constructor(private readonly persistence: Pf2PersistenceService, private readonly foundry: FoundryRelayService, private readonly playerCodex?: PlayerCodexService, private readonly mediaWiki?: MediaWikiClientService) {}

  definitions(): RESTPostAPIApplicationGuildCommandsJSONBody[] {
    return [
      new SlashCommandBuilder().setName('ping').setDescription('Vérifie que PF2-Bot répond.').toJSON(),
      new SlashCommandBuilder().setName('rec').setDescription('Récapitule les séances jouées par joueur.').toJSON(),
      new SlashCommandBuilder().setName('recap').setDescription('Récapitule les séances jouées par joueur.').toJSON(),
      new SlashCommandBuilder().setName('new-game').setDescription('Prépare une nouvelle mission PF2.').addUserOption(option => option.setName('joueur1').setDescription('Premier joueur').setRequired(true)).addUserOption(option => option.setName('joueur2').setDescription('Deuxième joueur')).addUserOption(option => option.setName('joueur3').setDescription('Troisième joueur')).addUserOption(option => option.setName('joueur4').setDescription('Quatrième joueur')).addUserOption(option => option.setName('joueur5').setDescription('Cinquième joueur')).addUserOption(option => option.setName('joueur6').setDescription('Sixième joueur')).toJSON(),
      new SlashCommandBuilder().setName('finish-game').setDescription('Termine une mission et met à jour son résumé.').addIntegerOption(option => option.setName('xp').setDescription('XP gagnée par PJ').setRequired(true).setMinValue(0)).addIntegerOption(option => option.setName('numero').setDescription('Numéro du résumé à terminer')).addStringOption(option => option.setName('fin').setDescription('Date de fin en jeu : YYYY-MM-DD')).addIntegerOption(option => option.setName('jours').setDescription('Durée en jours, à partir du début en jeu').setMinValue(1)).toJSON(),
      new SlashCommandBuilder().setName('personnage').setDescription('Présente un personnage au carnet joueur.').addStringOption(option => option.setName('personnage').setDescription('PNJ existant ou nom libre').setRequired(true).setAutocomplete(true)).addAttachmentOption(option => option.setName('portrait').setDescription('Portrait pour un personnage improvisé')).addBooleanOption(option => option.setName('afficher_nom').setDescription('Afficher le nom').setRequired(false)).toJSON(),
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
    if (interaction.commandName === 'finish-game') {
      await this.finishGameCommand(interaction as ChatInputCommandInteraction)
      return true
    }
    if (interaction.commandName === 'personnage') { await this.presentCharacter(interaction as ChatInputCommandInteraction); return true }
    return false
  }

  async handleAutocomplete(interaction: AutocompleteInteraction): Promise<boolean> {
    if (interaction.commandName !== 'personnage') return false
    const focused = interaction.options.getFocused().toString()
    const candidates = await this.playerCodex!.characterCandidates(focused)
    await interaction.respond(candidates.map(candidate => ({ name: candidate.name, value: `npc:${candidate.id}` })))
    return true
  }

  private async presentCharacter(interaction: ChatInputCommandInteraction): Promise<void> {
    const value = interaction.options.getString('personnage', true).trim(); const attachment = interaction.options.getAttachment('portrait')
    const showName = interaction.options.getBoolean('afficher_nom') ?? true
    let sourceNpcId: string | null = null; let name = value; let portrait: string | null = attachment?.url ?? null
    if (value.startsWith('npc:')) {
      sourceNpcId = value.slice(4); const candidate = (await this.playerCodex!.characterCandidates('')).find(item => item.id === sourceNpcId)
      if (!candidate) { await interaction.reply({ content: 'PNJ sélectionné invalide.', ephemeral: true }); return }
      name = candidate.name; portrait ??= candidate.portrait
    }
    if (!sourceNpcId && !portrait) { await interaction.reply({ content: 'Un portrait est obligatoire pour un personnage improvisé.', ephemeral: true }); return }
    const presentation = await this.playerCodex!.createPresentation({ name, sourceNpcId, portraitUrl: portrait, showName, channelId: interaction.channelId })
    const button = new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId(`pf2-character:create:${presentation.id}`).setLabel('Créer la fiche')
    await interaction.reply({ content: showName ? presentation.name : '\u200b', files: portrait ? [portrait] : [], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)], allowedMentions: { parse: [] } })
    const message = await interaction.fetchReply()
    await this.playerCodex!.savePresentationMessage(presentation.id, message.id, message.attachments.first()?.url ?? portrait)
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
    if (interaction.customId.startsWith('pf2-character:create:')) {
      const presentationId = interaction.customId.slice('pf2-character:create:'.length)
      const name = interaction.fields.getTextInputValue('name').trim()
      const description = interaction.fields.getTextInputValue('description').trim()
      const title = `Personnage:${name}`
      try {
        const presentation = await this.playerCodex!.presentation(presentationId)
        const portrait = presentation.portraitUrl ? await this.mediaWiki!.uploadFromUrl(presentation.portraitUrl, name) : null
        await this.mediaWiki!.createPage(title, description)
        const profile = await this.playerCodex!.ensurePresentationCharacter(presentationId, name, title) as { npcId: string; wikiPageTitle: string }
        if (portrait) await this.playerCodex!.updateCharacter(profile.npcId, { wikiPortraitFilename: portrait })
        await interaction.reply({ content: `Fiche créée : ${this.mediaWiki!.pageUrl(profile.wikiPageTitle)}`, ephemeral: true })
      } catch (error) { await interaction.reply({ content: error instanceof Error ? `Création impossible : ${error.message}` : 'Création impossible.', ephemeral: true }) }
      return true
    }
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

  async handleButton(interaction: ButtonInteraction): Promise<boolean> {
    if (interaction.customId.startsWith('pf2-character:create:')) {
      const presentationId = interaction.customId.slice('pf2-character:create:'.length)
      try {
        const presentation = await this.playerCodex!.presentation(presentationId)
        if (presentation.sourceNpcId) {
          try { const profile = await this.playerCodex!.character(presentation.sourceNpcId) as { wikiPageTitle: string }; await interaction.reply({ content: `Ce personnage existe déjà dans le carnet : ${this.mediaWiki!.pageUrl(profile.wikiPageTitle)}`, ephemeral: true }); return true } catch { /* profil absent : ouvrir le modal */ }
        }
        const modal = new ModalBuilder().setCustomId(interaction.customId).setTitle('Créer la fiche personnage')
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('name').setLabel('Nom connu des joueurs').setStyle(TextInputStyle.Short).setValue(presentation.name).setRequired(true)))
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description initiale').setStyle(TextInputStyle.Paragraph).setRequired(false)))
        await interaction.showModal(modal)
      } catch (error) { await interaction.reply({ content: error instanceof Error ? error.message : 'Présentation introuvable.', ephemeral: true }) }
      return true
    }
    const announcement = this.pendingAnnouncements.get(interaction.customId)
    if (!announcement || !interaction.customId.startsWith('pf2-new-game:announce:')) return false
    await interaction.reply({ content: announcement.content, allowedMentions: { users: announcement.userIds }, ephemeral: false })
    this.pendingAnnouncements.delete(interaction.customId)
    return true
  }

  private async finishGameCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const requestedNumber = interaction.options.getInteger('numero') ?? await this.lastBotSessionNumber(interaction)
    if (!requestedNumber) { await interaction.reply({ content: 'Indique `numero`, ou utilise la commande dans un salon contenant une annonce récente du bot avec « Résumé n°… ». ', ephemeral: true }); return }
    const endDate = interaction.options.getString('fin')?.trim() ?? ''
    const days = interaction.options.getInteger('jours')
    const xp = interaction.options.getInteger('xp', true)
    if (Boolean(endDate) === (days !== null)) { await interaction.reply({ content: 'Indique soit `fin` (YYYY-MM-DD), soit `jours`, mais pas les deux.', ephemeral: true }); return }
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) { await interaction.reply({ content: 'La date de fin doit être au format YYYY-MM-DD.', ephemeral: true }); return }
    const session = (await this.persistence.listSessions()).find((item) => item.sessionNumber === requestedNumber)
    if (!session) { await interaction.reply({ content: `Aucun résumé n°${requestedNumber} n’existe.`, ephemeral: true }); return }
    if (days !== null && !session.inGameStartDate) { await interaction.reply({ content: `Le résumé n°${requestedNumber} n’a pas de date de début en jeu : précise plutôt \`fin\`.`, ephemeral: true }); return }
    const resolvedEndDate = endDate || this.addDays(session.inGameStartDate, Math.max(0, (days ?? 1) - 1))
    const updated = await this.persistence.updateSession(session.id, { inGameEndDate: resolvedEndDate, sessionXp: xp })
    await interaction.reply({ content: `Résumé n°${requestedNumber} mis à jour : fin en jeu le ${this.displayDate(resolvedEndDate)} ; ${xp} XP par PJ.`, ephemeral: true })
    if (!updated) this.logger.warn(`finish-game: résumé ${requestedNumber} supprimé pendant la mise à jour.`)
  }

  private async lastBotSessionNumber(interaction: ChatInputCommandInteraction): Promise<number | null> {
    const channel = interaction.channel
    if (!channel?.isTextBased() || !('messages' in channel)) return null
    try {
      const messages = await channel.messages.fetch({ limit: 100 })
      const botId = interaction.client.user?.id
      const message = messages.find((item) => item.author.id === botId && /Résumé n°(\d+)/.test(item.content))
      const match = message ? /Résumé n°(\d+)/.exec(message.content) : null
      return match ? Number(match[1]) : null
    } catch (error) {
      this.logger.warn(`finish-game: impossible de lire l’historique Discord : ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }

  private async newGame(interaction: ChatInputCommandInteraction): Promise<void> {
    const users = ['joueur1', 'joueur2', 'joueur3', 'joueur4', 'joueur5', 'joueur6'].flatMap(name => { const user = interaction.options.getUser(name); return user ? [user] : [] })
    const userIds = [...new Set(users.map((user) => user.id))]
    const names = await this.actorNames()
    const actors = [...names.entries()].map(([uuid, name]) => ({ uuid, name, player: this.playerName(name) }))
    const known = actors.flatMap(({ uuid, name, player }) => {
      const userId = this.discordId(player)
      return userId && userIds.includes(userId) ? [{ uuid, name, player, userId }] : []
    })
    this.logger.log(`new-game: joueurs Discord=${userIds.join(', ')}; acteurs=${actors.map((actor) => `${actor.name} [${actor.player || 'sans joueur'}]`).join('; ') || 'aucun'}; PJ retenus=${known.map((actor) => actor.name).join(', ') || 'aucun'}`)
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

  private async finishGame(interaction: StringSelectMenuInteraction, pending: { selected?: Array<{ uuid: string; name: string; userId: string }> }, date: string, plan: { downtime: string[] }): Promise<void> {
    const sessions = await this.persistence.listSessions()
    const sessionNumber = Math.max(0, ...sessions.map((session) => session.sessionNumber)) + 1
    const draft = await this.persistence.createSession({ sessionNumber, date: '', inGameStartDate: date, inGameEndDate: '', title: '', participants: (pending.selected ?? []).map((actor) => actor.uuid), published: false })
    const content = `Brouillon créé : résumé n°${draft.sessionNumber}.\nDébut : ${this.displayDate(date)}. Fin : à renseigner.\n${plan.downtime.join('\n')}\n\nComplète puis publie le résumé dans l’application MJ.`
    const announcementId = `pf2-new-game:announce:${draft.id}`
    this.pendingAnnouncements.set(announcementId, { content: `**Séance prévue — Résumé n°${draft.sessionNumber}**\nAvec : ${(pending.selected ?? []).map((actor) => `<@${actor.userId}>`).join(', ')}\nDébut de la mission : ${this.displayDate(date)}`, userIds: (pending.selected ?? []).map((actor) => actor.userId) })
    const publish = new ButtonBuilder().setCustomId(announcementId).setLabel('Publier l’annonce').setStyle(ButtonStyle.Primary)
    await interaction.update({ content, components: [new ActionRowBuilder<ButtonBuilder>().addComponents(publish)] })
  }

  private async finishGameModal(interaction: ModalSubmitInteraction, pending: { selected?: Array<{ uuid: string; name: string; userId: string }> }, date: string, plan: { downtime: string[] }): Promise<void> {
    const sessions = await this.persistence.listSessions()
    const sessionNumber = Math.max(0, ...sessions.map((session) => session.sessionNumber)) + 1
    const draft = await this.persistence.createSession({ sessionNumber, date: '', inGameStartDate: date, inGameEndDate: '', title: '', participants: (pending.selected ?? []).map((actor) => actor.uuid), published: false })
    const announcementId = `pf2-new-game:announce:${draft.id}`
    this.pendingAnnouncements.set(announcementId, { content: `**Séance prévue — Résumé n°${draft.sessionNumber}**\nAvec : ${(pending.selected ?? []).map((actor) => `<@${actor.userId}>`).join(', ')}\nDébut de la mission : ${this.displayDate(date)}`, userIds: (pending.selected ?? []).map((actor) => actor.userId) })
    const publish = new ButtonBuilder().setCustomId(announcementId).setLabel('Publier l’annonce').setStyle(ButtonStyle.Primary)
    await interaction.reply({ content: `Brouillon créé : résumé n°${draft.sessionNumber}.\nDébut : ${this.displayDate(date)}. Fin : à renseigner.\n${plan.downtime.join('\n')}\n\nComplète puis publie le résumé dans l’application MJ.`, components: [new ActionRowBuilder<ButtonBuilder>().addComponents(publish)], ephemeral: true })
  }

  private missionEnd(session: import('../pf2-storage/Pf2PersistenceService').Pf2Session): string { return session.inGameEndDate || session.inGameStartDate }
  private today(): string { return new Date().toISOString().slice(0, 10) }
  private addDays(date: string, days: number): string { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10) }
  private displayDate(date: string): string { const [year, month, day] = date.split('-').map(Number); const months = ['Abadius', 'Calistril', 'Pharast', 'Gozran', 'Desnus', 'Sarenith', 'Erastus', 'Arodus', 'Rova', 'Lamashan', 'Neth', 'Kuthona']; return year >= 3000 ? `${day} ${months[month - 1]} ${year} AR` : `${day} ${months[month - 1]} ${year + 1694} AR (${day}/${String(month).padStart(2, '0')}/${year})` }
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

  async actorNames(): Promise<Map<string, string>> {
    try {
      const actors = await this.foundry.listActors()
      if (actors.length) {
        await this.persistence.saveFoundryActorCache(actors)
        return new Map(actors.map((actor) => [actor.uuid, actor.name]))
      }
      this.logger.warn('new-game: le Relay a répondu mais la structure ne contient aucun Actor de monde.')
    } catch (error) {
      this.logger.warn(`new-game: lecture Foundry impossible : ${error instanceof Error ? error.message : String(error)}`)
    }
    const cached = await this.persistence.readFoundryActorCache()
    this.logger.log(`new-game: cache Actors SQLite=${cached.length}`)
    return new Map(cached.map((actor) => [actor.uuid, actor.name]))
  }

  private playerName(actorName: string): string {
    const match = /\(([^()]+)\)\s*$/.exec(actorName.trim())
    return match?.[1]?.trim() || actorName.replace(/^Actor\./, '')
  }
}
