import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { resolve } from 'node:path'
import { ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, ModalBuilder, ModalSubmitInteraction, PermissionFlagsBits, RESTPostAPIApplicationGuildCommandsJSONBody, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, TextInputBuilder, TextInputStyle } from 'discord.js'
import { FoundryRelayService } from '../foundry/FoundryRelayService'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'
import { PlayerCodexService } from '../pf2-mj/PlayerCodexService'
import { MediaWikiClientService } from '../pf2-mj/MediaWikiClientService'
import { DiscordResumeSync, DiscordService } from './DiscordService'
import { shortSummaryRewardForSession } from '../pf2-sessions/Pf2CareerXp'
import { Pf2JournalsService } from '../pf2-journals/Pf2JournalsService'

@Injectable()
export class DiscordCommandsService {
  private readonly logger = new Logger(DiscordCommandsService.name)
  private readonly pendingGames = new Map<string, { actors: Array<{ uuid: string; name: string; player: string; userId: string }>; selected?: Array<{ uuid: string; name: string; player: string; userId: string }> }>()
  private readonly pendingAnnouncements = new Map<string, { content: string; userIds: string[] }>()
  private readonly pendingRecaps = new Map<string, { requesterId: string; actors: Array<{ uuid: string; name: string }> }>()
  private readonly pendingShortSummaries = new Map<string, {
    sessionId: string
    sessionNumber: number
    requesterId: string
    selectedAuthor: string
    allowedAuthors: Array<{ uuid: string; name: string }>
  }>()
  private readonly pendingResumePublications = new Map<string, {
    sessionId: string
    requesterId: string
    createdAt: number
  }>()
  private readonly pendingJournalReveals = new Map<string, { requesterId: string; journalNumber: number }>()
  private readonly pendingCharacterFactions = new Map<string, { requesterId: string; factionId: string | null }>()
  private readonly pendingFactionPublications = new Map<string, { requesterId: string; factionId: string }>()
  constructor(private readonly persistence: Pf2PersistenceService, private readonly foundry: FoundryRelayService, private readonly playerCodex?: PlayerCodexService, private readonly mediaWiki?: MediaWikiClientService, @Inject(forwardRef(() => DiscordService)) private readonly discord?: DiscordService, private readonly journals?: Pf2JournalsService) {}

  definitions(): RESTPostAPIApplicationGuildCommandsJSONBody[] {
    return [
      new SlashCommandBuilder().setName('ping').setDescription('Vérifie que PF2-Bot répond.').toJSON(),
      new SlashCommandBuilder().setName('recap').setDescription('Affiche les séances communes pour les PJ choisis.').toJSON(),
      new SlashCommandBuilder().setName('journaux').setDescription('Prépare la révélation d’un journal.').addIntegerOption(option => option.setName('numero').setDescription('Numéro du journal à révéler').setRequired(false).setMinValue(1)).toJSON(),
      new SlashCommandBuilder().setName('export-full').setDescription('Exporte tous les messages texte du serveur en JSON.').toJSON(),
      new SlashCommandBuilder().setName('new-game').setDescription('Prépare une nouvelle mission PF2 depuis les PJ actifs dans ce salon.').toJSON(),
      new SlashCommandBuilder().setName('finish-game').setDescription('Termine une mission et met à jour son résumé.').addIntegerOption(option => option.setName('xp').setDescription('XP gagnée par PJ').setRequired(true).setMinValue(0)).addIntegerOption(option => option.setName('numero').setDescription('Numéro du résumé à terminer')).addStringOption(option => option.setName('fin').setDescription('Date de fin en jeu : YYYY-MM-DD')).addIntegerOption(option => option.setName('jours').setDescription('Durée en jours, à partir du début en jeu').setMinValue(1)).toJSON(),
      new SlashCommandBuilder().setName('resume').setDescription('Édite le résumé court d’une séance.').addStringOption(option => option.setName('session').setDescription('Séance à résumer (la plus récente par défaut)').setAutocomplete(true)).addStringOption(option => option.setName('auteur').setDescription('Personnage auteur du résumé').setAutocomplete(true)).toJSON(),
      new SlashCommandBuilder().setName('personnage').setDescription('Présente un personnage au carnet joueur.').addStringOption(option => option.setName('personnage').setDescription('PNJ existant ou nom libre').setRequired(true).setAutocomplete(true)).addAttachmentOption(option => option.setName('portrait').setDescription('Portrait pour un personnage improvisé')).addBooleanOption(option => option.setName('afficher_nom').setDescription('Afficher le nom').setRequired(false)).toJSON(),
      new SlashCommandBuilder().setName('faction').setDescription('Prépare la publication d’une faction MJ.').addStringOption(option => option.setName('faction').setDescription('Faction à publier').setRequired(true).setAutocomplete(true)).toJSON(),
    ]
  }

  async handle(interaction: Pick<ChatInputCommandInteraction, 'commandName' | 'reply' | 'deferReply' | 'editReply'>): Promise<boolean> {
    if (interaction.commandName === 'ping') {
      await interaction.reply({ content: 'Pong !', ephemeral: true })
      return true
    }
    if (interaction.commandName === 'recap') {
      await this.recapCommand(interaction as ChatInputCommandInteraction)
      return true
    }
    if (interaction.commandName === 'journaux') { await this.journalsCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'export-full') {
      await this.exportFull(interaction as ChatInputCommandInteraction)
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
    if (interaction.commandName === 'resume') { await this.resumeCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'personnage') { await this.presentCharacter(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'faction') { await this.factionCommand(interaction as ChatInputCommandInteraction); return true }
    return false
  }

  private async journalsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }
    const requested = interaction.options.getInteger('numero')
    try {
      const journal = requested === null ? await this.journals!.randomJournalToReveal() : await this.journals!.resolveJournalToReveal(requested)
      if (!journal) { await interaction.reply({ content: requested === null ? 'Il ne reste aucun journal à révéler.' : 'Ce journal est déjà révélé.', ephemeral: true }); return }
      const preview = `**${journal.number} - ${journal.title}**\n\n${journal.content}`
      if (preview.length > 2_000) { await interaction.reply({ content: `Ce journal contient ${preview.length} caractères et dépasserait la limite Discord de 2 000 caractères. Il n’a pas été préparé pour publication.`, ephemeral: true }); return }
      const id = `pf2-journal:reveal:${interaction.id}`
      this.pendingJournalReveals.set(id, { requesterId: interaction.user.id, journalNumber: journal.number })
      const button = new ButtonBuilder().setCustomId(id).setLabel('Valider').setStyle(ButtonStyle.Primary)
      await interaction.reply({ content: preview, components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)], ephemeral: true })
    } catch (error) {
      await interaction.reply({ content: error instanceof Error ? `Journal impossible : ${error.message}` : 'Journal impossible.', ephemeral: true })
    }
  }

  private async factionCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }
    try {
      const faction = await this.playerCodex!.factionForPublication(interaction.options.getString('faction', true))
      if (faction.published) { await interaction.reply({ content: `La faction « ${faction.name} » est déjà publiée.`, ephemeral: true }); return }
      const id = `pf2-faction:publish:${interaction.id}`
      this.pendingFactionPublications.set(id, { requesterId: interaction.user.id, factionId: faction.id })
      const text = [
        `**${faction.name}**`,
        faction.description || '_Aucune description._',
        faction.parentName ? `Sous-faction de **${faction.parentName}**.` : '',
        '',
        '_Prévisualisation : valide pour créer la page Wiki et publier dans Discord._',
      ].filter(Boolean).join('\n\n')
      await interaction.reply({ content: text, components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId(id).setLabel('Publier la faction').setStyle(ButtonStyle.Primary))], ephemeral: true, allowedMentions: { parse: [] } })
    } catch (error) {
      await interaction.reply({ content: `Publication impossible : ${error instanceof Error ? error.message : String(error)}`, ephemeral: true })
    }
  }

  private async exportFull(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }
    await interaction.deferReply({ ephemeral: true })
    try {
      const exportData = await this.discord?.exportFullGuild()
      if (!exportData) throw new Error('Discord est indisponible ou désactivé.')
      const json = JSON.stringify(exportData, null, 2)
      const bytes = Buffer.byteLength(json, 'utf8')
      // Discord's normal attachment limit is at least 25 MiB. Refuse rather
      // than silently returning an incomplete export.
      if (bytes > 25 * 1024 * 1024) throw new Error(`Export trop volumineux (${Math.ceil(bytes / 1024 / 1024)} Mo). Aucun export partiel n’a été envoyé.`)
      const stamp = exportData.exportedAt.slice(0, 10)
      await interaction.editReply({
        content: `${exportData.channels.length} salon(s)/fil(s), ${Object.keys(exportData.authors).length} auteur(s), ${exportData.skipped.length} élément(s) ignoré(s).`,
        files: [{ attachment: Buffer.from(json, 'utf8'), name: `discord-export-${stamp}.json` }],
      })
    } catch (error) {
      this.logger.error('Export Discord complet impossible', error instanceof Error ? error.stack : undefined)
      await interaction.editReply({ content: `Export impossible : ${error instanceof Error ? error.message : String(error)}` })
    }
  }

  private async recapCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply()
    const names = await this.actorNames()
    const actors = [...names.entries()]
      .map(([uuid, name]) => ({ uuid, name }))
      .filter((actor) => this.isPlayerActorName(actor.name))
      .sort((left, right) => left.name.localeCompare(right.name, 'fr'))
      .slice(0, 25)
    if (actors.length < 2) {
      await interaction.editReply({ content: 'Il faut au moins deux PJ nommés « Personnage (Joueur) » pour établir le tableau.' })
      return
    }
    const id = `pf2-recap:${interaction.id}`
    this.pendingRecaps.set(id, { requesterId: interaction.user.id, actors })
    const select = new StringSelectMenuBuilder()
      .setCustomId(id)
      .setPlaceholder('Choisis les PJ à comparer')
      .setMinValues(2)
      .setMaxValues(actors.length)
      .addOptions(actors.map((actor) => ({ label: actor.name.slice(0, 100), value: actor.uuid })))
    await interaction.editReply({ content: 'Choisis les PJ à comparer. Le tableau indiquera le nombre de séances jouées ensemble pour chaque paire.', components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)] })
  }

  async handleAutocomplete(interaction: AutocompleteInteraction): Promise<boolean> {
    if (interaction.commandName === 'resume') {
      const focused = interaction.options.getFocused(true)
      const term = focused.value.toString().trim().toLocaleLowerCase()

      if (focused.name === 'session') {
        const sessions = await this.persistence.listSessions()
        await interaction.respond(
          sessions
            .filter(session =>
              String(session.sessionNumber).includes(term) ||
              session.title.toLocaleLowerCase().includes(term),
            )
            .sort((a, b) => b.sessionNumber - a.sessionNumber)
            .slice(0, 25)
            .map(session => ({
              name: `#${session.sessionNumber} — ${session.title || 'Sans titre'}`.slice(0, 100),
              value: String(session.sessionNumber),
            })),
        )
        return true
      }

      if (focused.name === 'auteur') {
        const authors = await this.summaryAuthors(interaction, true)
        await interaction.respond(
          authors
            .filter(actor => actor.name.toLocaleLowerCase().includes(term))
            .slice(0, 25)
            .map(actor => ({ name: actor.name.slice(0, 100), value: actor.uuid })),
        )
        return true
      }

      await interaction.respond([])
      return true
    }
    if (interaction.commandName === 'faction') {
      const focused = interaction.options.getFocused().toString().toLocaleLowerCase()
      const factions = await this.playerCodex!.factionCandidates()
      await interaction.respond(factions.filter(faction => faction.path.toLocaleLowerCase().includes(focused)).slice(0, 25).map(faction => ({ name: faction.path.slice(0, 100), value: faction.id })))
      return true
    }
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
      sourceNpcId = value.slice(4)
      const candidate = await this.playerCodex!.characterCandidate(sourceNpcId)
      if (!candidate) {
        await interaction.reply({ content: 'PNJ sélectionné invalide.', ephemeral: true })
        return
      }
      name = candidate.name
      portrait ??= candidate.portrait
    }
    if (!sourceNpcId && !portrait) { await interaction.reply({ content: 'Un portrait est obligatoire pour un personnage improvisé.', ephemeral: true }); return }
    const presentation = await this.playerCodex!.createPresentation({
      name,
      sourceNpcId,
      portraitUrl: portrait,
      showName,
      channelId: interaction.channelId,
    })

    let buttonLabel = 'Créer la fiche'
    if (sourceNpcId) {
      try {
        await this.playerCodex!.character(sourceNpcId)
        buttonLabel = 'Voir la fiche'
      } catch {
        // Pas encore de profil joueur.
      }
    }

    const button = new ButtonBuilder()
      .setStyle(ButtonStyle.Primary)
      .setCustomId(`pf2-character:create:${presentation.id}`)
      .setLabel(buttonLabel)

    const discordPortrait = portrait ? this.discordPortraitSource(portrait) : null
    const factions = await this.playerCodex!.factionCandidates(true)
    const components: Array<ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>> = []
    if (factions.length) {
      const factionId = `pf2-character:faction:${presentation.id}`
      this.pendingCharacterFactions.set(presentation.id, { requesterId: interaction.user.id, factionId: null })
      const options = [{ label: '(Aucune faction)', value: 'none', default: true }, ...factions.slice(0, 24).map(faction => ({ label: faction.path.slice(0, 100), value: faction.id }))]
      components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(new StringSelectMenuBuilder().setCustomId(factionId).setPlaceholder('Faction principale (facultative)').addOptions(options)))
    }
    components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(button))

    await interaction.reply({
      content: showName ? presentation.name : '\u200b',
      files: discordPortrait ? [discordPortrait] : [],
      components,
      allowedMentions: { parse: [] },
    })
    const message = await interaction.fetchReply()
    await this.playerCodex!.savePresentationMessage(presentation.id, message.id, message.attachments.first()?.url ?? portrait)
  }

  async handleComponent(interaction: StringSelectMenuInteraction): Promise<boolean> {
    if (interaction.customId.startsWith('pf2-recap:')) {
      const pending = this.pendingRecaps.get(interaction.customId)
      if (!pending) { await interaction.reply({ content: 'Cette demande de récap a expiré. Relance `/recap`.', ephemeral: true }); return true }
      if (interaction.user.id !== pending.requesterId) { await interaction.reply({ content: 'Cette sélection appartient à un autre utilisateur.', ephemeral: true }); return true }
      const selected = pending.actors.filter((actor) => interaction.values.includes(actor.uuid))
      if (selected.length < 2) { await interaction.reply({ content: 'Choisis au moins deux PJ.', ephemeral: true }); return true }
      const messages = await this.recapMatrixMessages(selected)
      await interaction.update({ content: messages[0], components: [] })
      for (const content of messages.slice(1)) await interaction.followUp({ content })
      this.pendingRecaps.delete(interaction.customId)
      return true
    }
    if (interaction.customId.startsWith('pf2-character:faction:')) {
      const presentationId = interaction.customId.slice('pf2-character:faction:'.length)
      const pending = this.pendingCharacterFactions.get(presentationId)
      if (!pending) { await interaction.reply({ content: 'Cette présentation a expiré. Relance `/personnage`.', ephemeral: true }); return true }
      if (pending.requesterId !== interaction.user.id) { await interaction.reply({ content: 'Cette sélection appartient à la personne qui a créé la présentation.', ephemeral: true }); return true }
      pending.factionId = interaction.values[0] === 'none' ? null : interaction.values[0]
      await interaction.reply({ content: pending.factionId ? 'Faction principale sélectionnée.' : 'Aucune faction sélectionnée.', ephemeral: true })
      return true
    }
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
    const selected = pending.actors.filter(actor => interaction.values.includes(actor.uuid))
    if (!selected.length) { await interaction.reply({ content: 'Choisis au moins un PJ.', ephemeral: true }); return true }
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
    await interaction.update({ content: `${selected.map(actor => actor.name).join(', ')}\n\n${plan.progressionRolls.join('\n')}\n\nChoisis la date de début.`, components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)] })
    return true
  }

  async handleModal(interaction: ModalSubmitInteraction): Promise<boolean> {
    if (interaction.customId.startsWith('pf2-resume:')) {
      const pending = this.pendingShortSummaries.get(interaction.customId)

      if (!pending) {
        await interaction.reply({ content: 'Cette édition a expiré. Relance `/resume`.', ephemeral: true })
        return true
      }

      if (interaction.user.id !== pending.requesterId) {
        await interaction.reply({ content: 'Cette édition appartient à un autre utilisateur.', ephemeral: true })
        return true
      }

      if (!pending.allowedAuthors.some(actor => actor.uuid === pending.selectedAuthor)) {
        await interaction.reply({ content: 'Auteur invalide. Relance `/resume`.', ephemeral: true })
        return true
      }

      const title = interaction.fields.getTextInputValue('title').trim()
      const date = interaction.fields.getTextInputValue('date').trim()
      const summary = interaction.fields.getTextInputValue('shortSummary').trim()

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        await interaction.reply({ content: 'La date jouée doit être au format YYYY-MM-DD.', ephemeral: true })
        return true
      }

      const saved = await this.saveShortSummary(
        interaction,
        pending,
        pending.selectedAuthor,
        { title, date, summary },
      )

      if (saved) this.pendingShortSummaries.delete(interaction.customId)
      return true
    }
    if (interaction.customId.startsWith('pf2-character:create:')) {
      const presentationId = interaction.customId.slice('pf2-character:create:'.length)
      const name = interaction.fields.getTextInputValue('name').trim()
      const description = interaction.fields.getTextInputValue('description').trim()
      const title = `Personnage:${name}`
      try {
        const presentation = await this.playerCodex!.presentation(presentationId)
        const portrait = presentation.portraitUrl ? await this.mediaWiki!.uploadFromUrl(presentation.portraitUrl, name) : null
        await this.mediaWiki!.createPage(title, description)
        const profile = await this.playerCodex!.ensurePresentationCharacter(presentationId, name, title) as { npcId: string; wikiPageTitle: string; created: boolean }
        if (portrait) await this.playerCodex!.updateCharacter(profile.npcId, { wikiPortraitFilename: portrait })
        const selectedFaction = this.pendingCharacterFactions.get(presentationId)?.factionId
        if (selectedFaction) await this.playerCodex!.addCharacterFaction(profile.npcId, selectedFaction)
        this.pendingCharacterFactions.delete(presentationId)
        const pageUrl = this.mediaWiki!.pageUrl(profile.wikiPageTitle)
        if (profile.created) {
          const publication = await this.discord?.publishCharacterIntroduction({
            name,
            portraitUrl: presentation.portraitUrl,
            description,
            wikiUrl: pageUrl,
          })
          if (publication?.status === 'failed') this.logger.warn(`Fiche créée, mais publication Discord impossible : ${publication.reason}`)
        }
        await interaction.reply({ content: profile.created ? `Fiche créée : ${pageUrl}` : `Cette fiche existe déjà : ${pageUrl}`, ephemeral: true, allowedMentions: { parse: [] } })
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
    if (interaction.customId.startsWith('pf2-journal:reveal:')) {
      const pending = this.pendingJournalReveals.get(interaction.customId)
      if (!pending) { await interaction.reply({ content: 'Cette validation a expiré. Relance `/journaux`.', ephemeral: true }); return true }
      if (interaction.user.id !== pending.requesterId) { await interaction.reply({ content: 'Cette validation appartient à un autre administrateur.', ephemeral: true }); return true }
      await interaction.deferUpdate()
      try {
        const journal = await this.journals!.resolveJournalToReveal(pending.journalNumber)
        if (!journal || journal.number !== pending.journalNumber) throw new Error(journal ? 'Les prérequis ont changé ; relance `/journaux`.' : 'Ce journal est déjà révélé.')
        const claim = await this.journals!.claim(journal.number, interaction.user.id)
        this.logger.log(`Journal ${journal.number} : réservation SQLite=${claim}.`)
        if (claim !== 'claimed') throw new Error(claim === 'revealed' ? 'Ce journal est déjà révélé.' : 'Une autre publication est déjà en cours.')
        const publication = await this.discord!.publishJournal(journal)
        if (publication.status !== 'sent' || !publication.messageId) {
          await this.journals!.abandon(journal.number, interaction.user.id)
          throw new Error(publication.reason ?? 'Discord n’a pas confirmé la publication.')
        }
        this.logger.log(`Journal ${journal.number} : Discord confirmé (message ${publication.messageId}), finalisation SQLite en cours.`)
        const completed = await this.journals!.complete(journal.number, interaction.user.id, publication.messageId)
        if (!completed) {
          this.logger.error(`Journal ${journal.number} : Discord a confirmé le message ${publication.messageId}, mais SQLite n’a pas confirmé la révélation.`)
          throw new Error('Discord a reçu le journal, mais SQLite n’a pas confirmé la révélation. Réparation manuelle requise.')
        }
        this.logger.log(`Journal ${journal.number} : révélé dans SQLite et publié sur Discord.`)
        this.pendingJournalReveals.delete(interaction.customId)
        await interaction.editReply({ content: `Journal ${journal.number} révélé.`, components: [] })
      } catch (error) {
        this.logger.error(`Révélation du journal ${pending.journalNumber} impossible : ${error instanceof Error ? error.message : String(error)}`)
        await interaction.editReply({ content: `Révélation impossible : ${error instanceof Error ? error.message : String(error)}`, components: [] })
      }
      return true
    }
    if (interaction.customId.startsWith('pf2-resume-publish:')) {
      const pending = this.pendingResumePublications.get(interaction.customId)
      if (!pending) {
        await interaction.reply({ content: 'Ce bouton de publication a expiré. Relance `/resume`.', ephemeral: true })
        return true
      }
      if (interaction.user.id !== pending.requesterId) {
        await interaction.reply({ content: 'Ce bouton appartient à un autre utilisateur.', ephemeral: true })
        return true
      }

      await interaction.deferReply({ ephemeral: true })
      try {
        if (!this.discord) throw new Error('Discord est indisponible ou désactivé.')
        const result = await this.discord.setResumePublication(pending.sessionId, true)
        this.pendingResumePublications.delete(interaction.customId)
        await interaction.editReply({
          content: `Séance #${result.resume.sessionNumber} publiée${result.discord.status === 'updated' ? ' et synchronisée' : ''}.`,
          components: this.resumeWikiComponents(result.resume.sessionNumber),
        })
      } catch (error) {
        await interaction.editReply({
          content: `Publication impossible : ${error instanceof Error ? error.message : String(error)}`,
          components: [],
        })
      }
      return true
    }

    if (interaction.customId.startsWith('pf2-faction:publish:')) {
      const pending = this.pendingFactionPublications.get(interaction.customId)
      if (!pending) { await interaction.reply({ content: 'Cette prévisualisation a expiré. Relance `/faction`.', ephemeral: true }); return true }
      if (interaction.user.id !== pending.requesterId) { await interaction.reply({ content: 'Cette validation appartient à un autre administrateur.', ephemeral: true }); return true }
      await interaction.deferReply({ ephemeral: true })
      try {
        const faction = await this.playerCodex!.factionForPublication(pending.factionId)
        if (faction.published) throw new Error('Cette faction est déjà publiée.')
        if (!(await this.mediaWiki!.pageExists(faction.wikiPageTitle))) await this.mediaWiki!.createPage(faction.wikiPageTitle, faction.description)
        const publication = await this.discord!.publishFaction({ name: faction.name, description: faction.description, parentName: faction.parentName, wikiUrl: this.mediaWiki!.pageUrl(faction.wikiPageTitle) })
        if (publication.status !== 'sent') throw new Error(publication.reason ?? 'Discord n’a pas confirmé la publication.')
        await this.playerCodex!.markFactionPublished(faction.id)
        this.pendingFactionPublications.delete(interaction.customId)
        await interaction.editReply({ content: `Faction publiée : ${this.mediaWiki!.pageUrl(faction.wikiPageTitle)}` })
      } catch (error) {
        await interaction.editReply({ content: `Publication impossible : ${error instanceof Error ? error.message : String(error)}` })
      }
      return true
    }

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

  private discordPortraitSource(portrait: string): string {
    const value = portrait.trim()
    if (/^https?:\/\//i.test(value)) return value

    const foundryPrefix = 'assets/l7r/'
    if (value.startsWith(foundryPrefix)) {
      const root = resolve(
        process.env['FOUNDRY_ASSETS_ROOT'] ??
          '../../FoundryVTT/Data/assets/l7r',
      )
      return resolve(root, value.slice(foundryPrefix.length))
    }

    return value
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
    const updated = await this.persistence.updateSession(session.id, { inGameEndDate: resolvedEndDate, sessionXp: xp, ...(session.date ? {} : { date: this.realDate() }) })
    await interaction.reply({ content: `Résumé n°${requestedNumber} mis à jour : fin en jeu le ${this.displayDate(resolvedEndDate)} ; ${xp} XP par PJ.`, ephemeral: true })
    if (!updated) this.logger.warn(`finish-game: résumé ${requestedNumber} supprimé pendant la mise à jour.`)
  }

  private async resumeCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const sessions = await this.persistence.listSessions()
    const requested = interaction.options.getString('session')?.trim()
    const requestedNumber = requested ? Number(requested) : null

    if (requested && (!Number.isInteger(requestedNumber) || !requestedNumber)) {
      await interaction.reply({ content: 'La séance sélectionnée est invalide.', ephemeral: true })
      return
    }

    const session = requestedNumber
      ? sessions.find(item => item.sessionNumber === requestedNumber)
      : [...sessions].sort((a, b) => b.sessionNumber - a.sessionNumber)[0]

    if (!session) {
      await interaction.reply({
        content: requested
          ? `Aucun résumé n°${requested} n’existe.`
          : 'Aucune séance n’existe encore.',
        ephemeral: true,
      })
      return
    }

    const allowedAuthors = await this.summaryAuthors(interaction)
    if (!allowedAuthors.length) {
      await interaction.reply({ content: 'Aucun PJ ne t’est associé.', ephemeral: true })
      return
    }

    const requestedAuthor = interaction.options.getString('auteur')?.trim() ?? ''
    let author = requestedAuthor

    if (!author && session.shortSummaryAuthor && allowedAuthors.some(actor => actor.uuid === session.shortSummaryAuthor)) {
      author = session.shortSummaryAuthor
    }
    if (!author && allowedAuthors.length === 1) author = allowedAuthors[0].uuid

    if (!author) {
      await interaction.reply({
        content: 'Choisis le personnage auteur avec l’option `auteur` de `/resume`.',
        ephemeral: true,
      })
      return
    }

    if (!allowedAuthors.some(actor => actor.uuid === author)) {
      await interaction.reply({ content: 'Cet auteur n’est pas autorisé.', ephemeral: true })
      return
    }

    const id = `pf2-resume:${interaction.id}`
    const pending = {
      sessionId: session.id,
      sessionNumber: session.sessionNumber,
      requesterId: interaction.user.id,
      selectedAuthor: author,
      allowedAuthors,
    }
    this.pendingShortSummaries.set(id, pending)
    await this.showShortSummaryModal(interaction, id, pending, author)
  }

  private async showShortSummaryModal(
    interaction: ChatInputCommandInteraction,
    customId: string,
    pending: {
      sessionId: string
      sessionNumber: number
      requesterId: string
      selectedAuthor: string
      allowedAuthors: Array<{ uuid: string; name: string }>
    },
    author: string,
  ): Promise<void> {
    const [current, sessions] = await Promise.all([
      this.persistence.getSession(pending.sessionId),
      this.persistence.listSessions(),
    ])

    if (!current) {
      await interaction.reply({ content: 'Séance introuvable.', ephemeral: true })
      return
    }

    const authorEntry = pending.allowedAuthors.find(actor => actor.uuid === author)
    if (!authorEntry) {
      await interaction.reply({ content: 'Auteur invalide.', ephemeral: true })
      return
    }

    const reward = shortSummaryRewardForSession(author, current, sessions)
    const authorName = authorEntry.name.replace(/\s*\([^()]+\)\s*$/, '').trim()
    const modal = new ModalBuilder()
      .setCustomId(customId)
      .setTitle(`Résumé #${pending.sessionNumber} — ${authorName}`.slice(0, 45))

    const titleInput = new TextInputBuilder()
      .setCustomId('title')
      .setLabel('Titre')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(120)
      .setRequired(true)
      .setValue((current.title || `Séance ${current.sessionNumber}`).slice(0, 120))

    const dateInput = new TextInputBuilder()
      .setCustomId('date')
      .setLabel('Date jouée')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(10)
      .setRequired(true)
      .setValue(current.date || this.realDate())

    const levelInput = new TextInputBuilder()
      .setCustomId('levelAtStart')
      .setLabel('Niveau du personnage au début de la séance')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(40)
      .setRequired(false)
      .setValue(`Niveau ${reward.levelAtStart} — bonus ${reward.xp} XP`)

    const summaryInput = new TextInputBuilder()
      .setCustomId('shortSummary')
      .setLabel('Résumé court')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(1550)
      .setRequired(false)

    if (current.shortSummary) summaryInput.setValue(current.shortSummary.slice(0, 1550))

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(levelInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(summaryInput),
    )

    await interaction.showModal(modal)
  }

  private async saveShortSummary(
    interaction: Pick<ModalSubmitInteraction, 'reply' | 'user'>,
    pending: {
      sessionId: string
      sessionNumber: number
      requesterId: string
      selectedAuthor: string
      allowedAuthors: Array<{ uuid: string; name: string }>
    },
    author: string,
    values: { title: string; date: string; summary: string },
  ): Promise<boolean> {
    const [current, sessions] = await Promise.all([
      this.persistence.getSession(pending.sessionId),
      this.persistence.listSessions(),
    ])

    if (
      interaction.user.id !== pending.requesterId ||
      !current ||
      !pending.allowedAuthors.some(actor => actor.uuid === author)
    ) {
      await interaction.reply({ content: 'Séance, demandeur ou auteur invalide.', ephemeral: true })
      return false
    }

    const reward = shortSummaryRewardForSession(author, current, sessions)
    const shortSummaryXp = values.summary ? reward.xp : 0
    const candidate = {
      ...current,
      title: values.title,
      date: values.date,
      shortSummary: values.summary,
      shortSummaryAuthor: author,
      shortSummaryXp,
    }

    const finalLength = this.discord
      ? await this.discord.resumeMessageLength(candidate)
      : 0

    const updated = await this.persistence.updateSession(pending.sessionId, {
      title: values.title,
      date: values.date,
      shortSummary: values.summary,
      shortSummaryAuthor: author,
      shortSummaryXp,
    })

    if (!updated) {
      await interaction.reply({ content: 'Séance introuvable.', ephemeral: true })
      return false
    }

    const authorName = pending.allowedAuthors.find(actor => actor.uuid === author)?.name ?? author
    let syncNote = ''

    if (updated.published && this.discord) {
      if (finalLength > 2000) {
        syncNote =
          ` Déjà publiée, mais le message Discord final ferait ${finalLength}/2000 caractères : ` +
          'raccourcis le résumé avant de republier.'
      } else {
        let sync: DiscordResumeSync
        try {
          sync = await this.discord.synchronizeResumeShortSummary(updated)
        } catch (error) {
          sync = {
            status: 'failed',
            reason: error instanceof Error ? error.message : 'erreur inattendue',
          }
        }

        if (sync.status === 'created' || sync.status === 'updated') {
          if (sync.messageId) {
            await this.persistence.saveSessionDiscordMessageId(updated.id, sync.messageId)
          }
        } else {
          syncNote =
            ` Résumé enregistré, mais Discord n’a pas été synchronisé : ${sync.reason ?? 'raison inconnue'}.`
        }
      }
    }

    await interaction.reply({
      content:
        `Résumé court de la séance ${pending.sessionNumber} mis à jour — auteur : ${authorName}. ` +
        `Niveau du personnage au début de la séance : ${reward.levelAtStart}; bonus : ${shortSummaryXp} XP.` +
        syncNote,
      components: [this.resumeActionsRow(updated.id, updated.sessionNumber, pending.requesterId)],
      ephemeral: true,
    })
    return true
  }

  private resumeActionsRow(
    sessionId: string,
    sessionNumber: number,
    requesterId: string,
  ): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>()

    if (this.mediaWiki?.enabled()) {
      row.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel('Voir la fiche')
          .setURL(this.mediaWiki.sessionsPageUrl(sessionNumber)),
      )
    }

    for (const [id, pending] of this.pendingResumePublications) {
      if (Date.now() - pending.createdAt > 6 * 60 * 60 * 1000) {
        this.pendingResumePublications.delete(id)
      }
    }

    const customId = `pf2-resume-publish:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`
    this.pendingResumePublications.set(customId, { sessionId, requesterId, createdAt: Date.now() })
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(customId)
        .setStyle(ButtonStyle.Success)
        .setLabel('Publier'),
    )

    return row
  }

  private resumeWikiComponents(sessionNumber: number): ActionRowBuilder<ButtonBuilder>[] {
    if (!this.mediaWiki?.enabled()) return []
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel('Voir la fiche')
          .setURL(this.mediaWiki.sessionsPageUrl(sessionNumber)),
      ),
    ]
  }

  private async summaryAuthors(
    interaction: Pick<ChatInputCommandInteraction, 'user' | 'memberPermissions'> | Pick<AutocompleteInteraction, 'user' | 'memberPermissions'>,
    preferCache = false,
  ): Promise<Array<{ uuid: string; name: string }>> {
    let names: Map<string, string>

    if (preferCache) {
      const cached = await this.persistence.readFoundryActorCache()
      names = cached.length
        ? new Map(cached.map(actor => [actor.uuid, actor.name]))
        : await this.actorNames()
    } else {
      names = await this.actorNames()
    }

    const allActors = [...names.entries()]
      .filter(([, name]) => /^\S(?:.*\S)?\s+\([^()]+\)$/u.test(name))
      .map(([uuid, name]) => ({ uuid, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

    return this.isAdmin(interaction)
      ? allActors
      : allActors.filter(actor => this.discordId(this.playerName(actor.name)) === interaction.user.id)
  }

  private isAdmin(interaction: Pick<ChatInputCommandInteraction, 'user' | 'memberPermissions'> | Pick<AutocompleteInteraction, 'user' | 'memberPermissions'>): boolean {
    const configured = (process.env['DISCORD_ADMIN_USER_IDS'] ?? '').split(',').map(value => value.trim()).filter(Boolean)
    return configured.includes(interaction.user.id) || Boolean(interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild))
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
    const names = await this.actorNames()
    const actors = [...names.entries()].map(([uuid, name]) => ({ uuid, name, player: this.playerName(name) }))
    const knownActors = actors.flatMap(({ uuid, name, player }) => {
      const userId = this.discordId(player)
      return userId ? [{ uuid, name, player, userId }] : []
    })
    const discussion = await this.discussionUserIds(interaction, [...new Set(knownActors.map(actor => actor.userId))])
    const userIds = discussion.userIds
    const known = knownActors.filter(actor => userIds.includes(actor.userId))
    this.logger.log(`new-game: auteurs=${discussion.authorIds.join(', ') || 'aucun'}; membres de fil=${discussion.threadMemberIds.join(', ') || 'aucun'}; membres du salon=${discussion.channelMemberIds.join(', ') || 'aucun'}; acteurs=${actors.map((actor) => `${actor.name} [joueur=${actor.player || 'inconnu'}, discord=${this.discordId(actor.player) ?? 'non associé'}, retenu=${userIds.includes(this.discordId(actor.player) ?? '') ? 'oui' : 'non'}]`).join('; ') || 'aucun'}; PJ retenus=${known.map((actor) => actor.name).join(', ') || 'aucun'}`)
    const choices = known.slice(0, 25).map(actor => ({ label: actor.name.slice(0, 100), value: actor.uuid }))
    if (!choices.length) { await interaction.reply({ content: 'Aucun PJ connu n’a été détecté parmi les auteurs récents de ce salon. Les PJ doivent être nommés « Personnage (Joueur) ».', ephemeral: true }); return }
    const id = `pf2-new-game:${interaction.id}:players`
    this.pendingGames.set(id, { actors: known })
    const select = new StringSelectMenuBuilder().setCustomId(id).setPlaceholder('Choisis les PJ participants').setMinValues(1).setMaxValues(choices.length).addOptions(choices)
    await interaction.reply({ content: `PJ détectés dans cette discussion : ${known.map(actor => actor.name).join(', ')}. Choisis les participants.`, components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)], ephemeral: true })
  }

  /** Discord n’expose pas les lecteurs d’un salon texte : on utilise les auteurs récents. */
  private async discussionUserIds(interaction: ChatInputCommandInteraction, candidateIds: string[]): Promise<{ userIds: string[]; authorIds: string[]; threadMemberIds: string[]; channelMemberIds: string[] }> {
    const userIds = new Set<string>([interaction.user.id])
    const authorIds = new Set<string>([interaction.user.id])
    const threadMemberIds = new Set<string>()
    const channelMemberIds = new Set<string>()
    const channel = interaction.channel
    if (channel?.isTextBased() && 'messages' in channel) {
      try {
        const messages = await channel.messages.fetch({ limit: 100 })
        for (const message of messages.values()) {
          userIds.add(message.author.id)
          authorIds.add(message.author.id)
        }
      } catch (error) {
        this.logger.warn(`new-game: impossible de lire les messages du salon : ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    if (channel && 'isThread' in channel && channel.isThread()) {
      try {
        const members = await channel.members.fetch()
        for (const member of members.values()) {
          userIds.add(member.id)
          threadMemberIds.add(member.id)
        }
      } catch (error) {
        this.logger.warn(`new-game: impossible de lire les membres du fil : ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    if (channel && interaction.guild && 'permissionsFor' in channel) {
      for (const userId of candidateIds) {
        try {
          const member = await interaction.guild.members.fetch(userId)
          if (channel.permissionsFor(member)?.has(PermissionFlagsBits.ViewChannel)) {
            userIds.add(userId)
            channelMemberIds.add(userId)
          }
        } catch (error) {
          this.logger.warn(`new-game: membre Discord ${userId} introuvable : ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }
    return { userIds: [...userIds], authorIds: [...authorIds], threadMemberIds: [...threadMemberIds], channelMemberIds: [...channelMemberIds] }
  }

  private async plan(actors: Array<{ uuid: string; name: string }>): Promise<{ current: string; earliest: string; progressionRolls: string[] }> {
    const sessions = (await this.persistence.listSessions()).filter((session) => session.published)
    const current = sessions.map((session) => this.missionEnd(session)).filter(Boolean).sort().at(-1) || this.today()
    const availability = actors.map((actor) => {
      const last = sessions.filter((session) => session.participants.includes(actor.uuid)).sort((left, right) => this.missionEnd(left).localeCompare(this.missionEnd(right))).at(-1)
      const available = last ? this.addDays(this.missionEnd(last), 1) : current
      const missed = last ? sessions.filter((session) => session.sessionNumber > last.sessionNumber).length : sessions.length
      return { actor, available, missed }
    })
    return {
      current,
      earliest: availability.map((item) => item.available).sort().at(-1) || current,
      progressionRolls: [
        '**Jets de progression** — 1 jet correspond à 7 jours d’activité.',
        ...availability.map((item) => `${item.actor.name} : **${item.missed} jet${item.missed > 1 ? 's' : ''} de progression** (${item.missed * 7} jour${item.missed * 7 > 1 ? 's' : ''}).`)
      ]
    }
  }

  private async finishGame(interaction: StringSelectMenuInteraction, pending: { selected?: Array<{ uuid: string; name: string; userId: string }> }, date: string, plan: { progressionRolls: string[] }): Promise<void> {
    const sessions = await this.persistence.listSessions()
    const sessionNumber = Math.max(0, ...sessions.map((session) => session.sessionNumber)) + 1
    const draft = await this.persistence.createSession({ sessionNumber, date: '', inGameStartDate: date, inGameEndDate: '', title: '', participants: (pending.selected ?? []).map((actor) => actor.uuid), published: false })
    const content = `Brouillon créé : résumé n°${draft.sessionNumber}.\nDébut : ${this.displayDate(date)}. Fin : à renseigner.\n\n${plan.progressionRolls.join('\n')}\n\nComplète puis publie le résumé dans l’application MJ.`
    const announcementId = `pf2-new-game:announce:${draft.id}`
    this.pendingAnnouncements.set(announcementId, { content: `**Séance prévue — Résumé n°${draft.sessionNumber}**\nAvec : ${(pending.selected ?? []).map((actor) => `<@${actor.userId}>`).join(', ')}\nDébut de la mission : ${this.displayDate(date)}`, userIds: (pending.selected ?? []).map((actor) => actor.userId) })
    const publish = new ButtonBuilder().setCustomId(announcementId).setLabel('Publier l’annonce').setStyle(ButtonStyle.Primary)
    await interaction.update({ content, components: [new ActionRowBuilder<ButtonBuilder>().addComponents(publish)] })
  }

  private async finishGameModal(interaction: ModalSubmitInteraction, pending: { selected?: Array<{ uuid: string; name: string; userId: string }> }, date: string, plan: { progressionRolls: string[] }): Promise<void> {
    const sessions = await this.persistence.listSessions()
    const sessionNumber = Math.max(0, ...sessions.map((session) => session.sessionNumber)) + 1
    const draft = await this.persistence.createSession({ sessionNumber, date: '', inGameStartDate: date, inGameEndDate: '', title: '', participants: (pending.selected ?? []).map((actor) => actor.uuid), published: false })
    const announcementId = `pf2-new-game:announce:${draft.id}`
    this.pendingAnnouncements.set(announcementId, { content: `**Séance prévue — Résumé n°${draft.sessionNumber}**\nAvec : ${(pending.selected ?? []).map((actor) => `<@${actor.userId}>`).join(', ')}\nDébut de la mission : ${this.displayDate(date)}`, userIds: (pending.selected ?? []).map((actor) => actor.userId) })
    const publish = new ButtonBuilder().setCustomId(announcementId).setLabel('Publier l’annonce').setStyle(ButtonStyle.Primary)
    await interaction.reply({ content: `Brouillon créé : résumé n°${draft.sessionNumber}.\nDébut : ${this.displayDate(date)}. Fin : à renseigner.\n\n${plan.progressionRolls.join('\n')}\n\nComplète puis publie le résumé dans l’application MJ.`, components: [new ActionRowBuilder<ButtonBuilder>().addComponents(publish)], ephemeral: true })
  }

  private missionEnd(session: import('../pf2-storage/Pf2PersistenceService').Pf2Session): string { return session.inGameEndDate || session.inGameStartDate }
  private realDate(now = new Date()): string {
    const zone = process.env['PF2_TIME_ZONE'] ?? 'Europe/Paris'
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now)
    const value = (kind: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === kind)?.value ?? ''
    const year = Number(value('year')); const month = Number(value('month')); const day = Number(value('day')); const hour = Number(value('hour'))
    const local = new Date(Date.UTC(year, month - 1, day - (hour < 5 ? 1 : 0)))
    return local.toISOString().slice(0, 10)
  }
  private today(): string { return new Date().toISOString().slice(0, 10) }
  private addDays(date: string, days: number): string { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10) }
  private displayDate(date: string): string { const [year, month, day] = date.split('-').map(Number); const months = ['Abadius', 'Calistril', 'Pharast', 'Gozran', 'Desnus', 'Sarenith', 'Erastus', 'Arodus', 'Rova', 'Lamashan', 'Neth', 'Kuthona']; return year >= 3000 ? `${day} ${months[month - 1]} ${year} AR` : `${day} ${months[month - 1]} ${year + 1694} AR (${day}/${String(month).padStart(2, '0')}/${year})` }
  private discordId(player: string): string | undefined { return ({ jupi: '308566148931387393', julien: '308566148931387393', valerian: '492387405760823297', valou: '492387405760823297', david: '688742453276180560', tom: '134346709487714304', sameh: '688791427253403679', arcady: '344733584441081857', eric: '399621722158137346', mana: '404629333534179338', marinella: '404629333534179338', nico: '688860103629340690', nicolas: '688860103629340690', gus: '671746679636099094', augustin: '671746679636099094', elena: '689036096767524866', guilhem: '448500183186145291', arthur: '557907871212503050' })[player.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()] }

  private async recapMatrixMessages(actors: Array<{ uuid: string; name: string }>): Promise<string[]> {
    const sessions = await this.persistence.listSessions()
    const selected = new Set(actors.map((actor) => actor.uuid))
    const labels = actors.map((actor) => this.characterLabel(actor.name))
    const shared = actors.map(() => actors.map(() => 0))
    for (const session of sessions) {
      const participants = new Set(session.participants)
      for (let left = 0; left < actors.length; left += 1) {
        if (!participants.has(actors[left].uuid)) continue
        for (let right = left + 1; right < actors.length; right += 1) {
          if (!participants.has(actors[right].uuid)) continue
          shared[left][right] += 1
          shared[right][left] += 1
        }
      }
    }
    // The guard keeps TypeScript and the intent explicit: only selected PJ
    // influence the matrix, even if a session stores other participants.
    if (!selected.size) return ['**Séances communes**\nAucun PJ sélectionné.']
    const header = `| PJ | ${labels.join(' | ')} |`
    const separator = `|---|${labels.map(() => '---').join('|')}|`
    const rows = actors.map((actor, row) => `| ${labels[row]} | ${actors.map((_other, column) => row === column ? '—' : String(shared[row][column])).join(' | ')} |`)
    return this.discordTableChunks('**Séances communes des PJ sélectionnés**', header, separator, rows)
  }

  private characterLabel(name: string): string {
    const label = name.replace(/\s+\([^()]+\)\s*$/, '').trim()
    return label || name
  }

  private isPlayerActorName(name: string): boolean { return /^\S(?:.*\S)?\s+\([^()]+\)$/u.test(name.trim()) }

  private discordTableChunks(title: string, header: string, separator: string, rows: string[]): string[] {
    const limit = 1_900
    const prefix = `${title}\n${header}\n${separator}`
    if (prefix.length > limit) return [`${title}\nLa sélection est trop large pour un tableau Discord. Choisis moins de PJ.`]
    const chunks: string[] = []
    let current = prefix
    for (const row of rows) {
      if (`${current}\n${row}`.length > limit && current !== prefix) {
        chunks.push(current)
        current = `${title} — suite\n${header}\n${separator}\n${row}`
      } else current += `\n${row}`
    }
    chunks.push(current)
    return chunks
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
