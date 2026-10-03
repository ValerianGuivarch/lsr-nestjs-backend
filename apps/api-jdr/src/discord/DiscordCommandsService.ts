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

const PLANNING_DAYS = [
  { offset: 0, label: 'Lundi', emoji: '🇱' },
  { offset: 1, label: 'Mardi', emoji: '🇲' },
  // « Tercredi » + T est volontaire : cela évite l'ambiguïté avec Mardi/M.
  { offset: 2, label: 'Tercredi', emoji: '🇹' },
  { offset: 3, label: 'Jeudi', emoji: '🇯' },
  { offset: 4, label: 'Vendredi', emoji: '🇻' },
  { offset: 5, label: 'Samedi', emoji: '🇸' },
  { offset: 6, label: 'Dimanche', emoji: '🇩' },
] as const

const PLANNING_MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'] as const
const PLANNING_UNAVAILABLE_EMOJI = '❌'

@Injectable()
export class DiscordCommandsService {
  private readonly logger = new Logger(DiscordCommandsService.name)
  private readonly pendingGames = new Map<string, {
    actors: Array<{ uuid: string; name: string; player: string; userId: string }>
    selected?: Array<{ uuid: string; name: string; player: string; userId: string }>
    plan?: { current: string; earliest: string; progressionRolls: string[]; rollCounts: Map<string, number> }
    baseDate?: string
  }>()
  private readonly pendingAnnouncements = new Map<string, { content: string; userIds: string[] }>()
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
  private readonly pendingSchedulePublications = new Map<string, { requesterId: string; content: string }>()
  constructor(private readonly persistence: Pf2PersistenceService, private readonly foundry: FoundryRelayService, private readonly playerCodex?: PlayerCodexService, private readonly mediaWiki?: MediaWikiClientService, @Inject(forwardRef(() => DiscordService)) private readonly discord?: DiscordService, private readonly journals?: Pf2JournalsService) {}

  definitions(): RESTPostAPIApplicationGuildCommandsJSONBody[] {
    return [
      new SlashCommandBuilder().setName('ping').setDescription('Vérifie que PF2-Bot répond.').toJSON(),
      new SlashCommandBuilder().setName('recap').setDescription('Affiche le nombre de séances jouées par joueur et par personnage.').toJSON(),
      new SlashCommandBuilder().setName('recap-seance').setDescription('Réaffiche les informations prévues pour une séance.').addStringOption(option => option.setName('session').setDescription('Numéro de séance').setRequired(true).setAutocomplete(true)).toJSON(),
      new SlashCommandBuilder().setName('journaux').setDescription('Prépare la révélation d’un journal.').addIntegerOption(option => option.setName('numero').setDescription('Numéro du journal à révéler').setRequired(false).setMinValue(1)).toJSON(),
      new SlashCommandBuilder().setName('export-full').setDescription('Exporte tous les messages texte du serveur en JSON.').toJSON(),
      new SlashCommandBuilder().setName('new-game').setDescription('Prépare une nouvelle mission PF2 depuis les PJ actifs dans ce salon.').toJSON(),
      new SlashCommandBuilder().setName('finish-game').setDescription('Termine une mission et met à jour son résumé.').addIntegerOption(option => option.setName('xp').setDescription('XP gagnée par PJ').setRequired(true).setMinValue(0)).addIntegerOption(option => option.setName('numero').setDescription('Numéro du résumé à terminer')).addStringOption(option => option.setName('fin').setDescription('Date de fin en jeu : YYYY-MM-DD')).addIntegerOption(option => option.setName('jours').setDescription('Durée en jours, à partir du début en jeu').setMinValue(1)).toJSON(),
      new SlashCommandBuilder().setName('personnage').setDescription('Présente un personnage au carnet joueur.').addStringOption(option => option.setName('personnage').setDescription('PNJ existant ou nom libre').setRequired(true).setAutocomplete(true)).addAttachmentOption(option => option.setName('portrait').setDescription('Portrait pour un personnage improvisé')).addBooleanOption(option => option.setName('afficher_nom').setDescription('Afficher le nom').setRequired(false)).toJSON(),
      new SlashCommandBuilder().setName('faction').setDescription('Prépare la publication d’une faction MJ.').addStringOption(option => option.setName('faction').setDescription('Faction à publier').setRequired(true).setAutocomplete(true)).toJSON(),
      new SlashCommandBuilder().setName('wiki').setDescription('Ouvre le wiki avec ton compte déjà connecté.').toJSON(),
      new SlashCommandBuilder()
        .setName('wiki-admin')
        .setDescription('Administre les associations Discord ↔ Wiki.')
        .addSubcommand(command => command.setName('help').setDescription('Liste les commandes d’administration du Wiki.'))
        .addSubcommand(command => command
          .setName('associer')
          .setDescription('Associe un membre Discord à son compte Wiki.')
          .addUserOption(option => option.setName('utilisateur').setDescription('Membre Discord').setRequired(true))
          .addStringOption(option => option.setName('compte').setDescription('Nom exact du compte MediaWiki').setRequired(true)))
        .addSubcommand(command => command.setName('liste').setDescription('Liste les associations Discord ↔ Wiki.'))
        .addSubcommand(command => command
          .setName('supprimer')
          .setDescription('Supprime une association Discord ↔ Wiki.')
          .addUserOption(option => option.setName('utilisateur').setDescription('Membre Discord').setRequired(true)))
        .toJSON(),
      new SlashCommandBuilder().setName('planification').setDescription('Publie les disponibilités proposées pour la prochaine semaine.').toJSON(),
      new SlashCommandBuilder().setName('programmer-seance').setDescription('Calcule les groupes possibles à partir de la planification.').toJSON(),
      new SlashCommandBuilder().setName('modifier-planification').setDescription('Ajoute ou retire des dates dans une planification existante.').toJSON(),
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
    if (interaction.commandName === 'recap-seance') {
      await this.recapSessionCommand(interaction as ChatInputCommandInteraction)
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
    if (interaction.commandName === 'wiki') { await this.wikiCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'wiki-admin') { await this.wikiAdminCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'planification') { await this.planningCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'programmer-seance') { await this.programmerSeanceCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'modifier-planification') { await this.modifyPlanningCommand(interaction as ChatInputCommandInteraction); return true }
    return false
  }

  private async journalsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }
    const requested = interaction.options.getInteger('numero')
    await interaction.deferReply({ ephemeral: true })
    try {
      const journal = requested === null ? await this.journals!.randomJournalToReveal() : await this.journals!.resolveJournalToReveal(requested)
      if (!journal) { await interaction.editReply({ content: requested === null ? 'Il ne reste aucun journal à révéler.' : 'Ce journal est déjà révélé.' }); return }
      const preview = `**${journal.number} - ${journal.title}**\n\n${journal.content}`
      if (preview.length > 2_000) { await interaction.editReply({ content: `Ce journal contient ${preview.length} caractères et dépasserait la limite Discord de 2 000 caractères. Il n’a pas été préparé pour publication.` }); return }
      const id = `pf2-journal:reveal:${interaction.id}`
      this.pendingJournalReveals.set(id, { requesterId: interaction.user.id, journalNumber: journal.number })
      const button = new ButtonBuilder().setCustomId(id).setLabel('Valider').setStyle(ButtonStyle.Primary)
      await interaction.editReply({ content: preview, components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)] })
    } catch (error) {
      await interaction.editReply({ content: error instanceof Error ? `Journal impossible : ${error.message}` : 'Journal impossible.' })
    }
  }

  private async factionCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }
    await interaction.deferReply({ ephemeral: true })
    try {
      const faction = await this.playerCodex!.factionForPublication(interaction.options.getString('faction', true))
      if (faction.published) { await interaction.editReply({ content: `La faction « ${faction.name} » est déjà publiée.` }); return }
      const id = `pf2-faction:publish:${interaction.id}`
      this.pendingFactionPublications.set(id, { requesterId: interaction.user.id, factionId: faction.id })
      const text = [
        `**${faction.name}**`,
        faction.description || '_Aucune description._',
        faction.parentName ? `Sous-faction de **${faction.parentName}**.` : '',
        '',
        '_Prévisualisation : valide pour créer la page Wiki et publier dans Discord._',
      ].filter(Boolean).join('\n\n')
      await interaction.editReply({ content: text, components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId(id).setLabel('Publier la faction').setStyle(ButtonStyle.Primary))], allowedMentions: { parse: [] } })
    } catch (error) {
      await interaction.editReply({ content: `Publication impossible : ${error instanceof Error ? error.message : String(error)}` })
    }
  }

  private async wikiCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true })
    try {
      if (!this.mediaWiki) throw new Error('MediaWiki est indisponible.')
      const link = await this.persistence.wikiAccountLink(interaction.user.id)
      if (!link) {
        await interaction.editReply({
          content: 'Ton compte Discord n’est pas encore associé à un compte Wiki. Demande à un administrateur d’utiliser `/wiki-admin associer`.',
        })
        return
      }

      const grant = await this.persistence.createWikiLoginGrant(interaction.user.id, 180)
      const button = new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(this.mediaWiki.wikiLoginUrl(grant))
        .setLabel('Aller vers le wiki')

      await interaction.editReply({
        content: `Connexion Wiki préparée pour **${link.wikiUsername}**. Ce bouton est personnel, utilisable une seule fois et expire dans 3 minutes.`,
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)],
        allowedMentions: { parse: [] },
      })
    } catch (error) {
      await interaction.editReply({
        content: `Connexion Wiki impossible : ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }

  private async wikiAdminCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.isAdmin(interaction)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }

    const subcommand = interaction.options.getSubcommand(true)
    if (subcommand === 'help') {
      await interaction.reply({
        content: [
          '**Administration des comptes Wiki**',
          '`/wiki-admin associer` — associe un membre Discord à un compte MediaWiki existant.',
          '`/wiki-admin liste` — affiche les associations enregistrées.',
          '`/wiki-admin supprimer` — supprime une association.',
        ].join('\n'),
        ephemeral: true,
      })
      return
    }

    await interaction.deferReply({ ephemeral: true })
    try {
      if (!this.mediaWiki) throw new Error('MediaWiki est indisponible.')

      if (subcommand === 'associer') {
        const discordUser = interaction.options.getUser('utilisateur', true)
        const requestedWikiName = interaction.options.getString('compte', true).trim()
        const wikiUsername = await this.mediaWiki.resolveUser(requestedWikiName)
        if (!wikiUsername) throw new Error(`Le compte MediaWiki « ${requestedWikiName} » n’existe pas.`)

        const link = await this.persistence.saveWikiAccountLink(discordUser.id, wikiUsername)
        await interaction.editReply({
          content: `Association enregistrée : <@${link.discordUserId}> → **${link.wikiUsername}**.`,
          allowedMentions: { parse: [] },
        })
        return
      }

      if (subcommand === 'liste') {
        const links = await this.persistence.listWikiAccountLinks()
        if (!links.length) {
          await interaction.editReply({ content: 'Aucune association Discord ↔ MediaWiki enregistrée.' })
          return
        }
        const lines = links.slice(0, 40).map(link => `<@${link.discordUserId}> → **${link.wikiUsername}**`)
        if (links.length > 40) lines.push(`… et ${links.length - 40} autre(s).`)
        await interaction.editReply({ content: lines.join('\n'), allowedMentions: { parse: [] } })
        return
      }

      if (subcommand === 'supprimer') {
        const discordUser = interaction.options.getUser('utilisateur', true)
        const removed = await this.persistence.deleteWikiAccountLink(discordUser.id)
        await interaction.editReply({
          content: removed
            ? `Association supprimée pour <@${discordUser.id}>.`
            : `Aucune association n’existait pour <@${discordUser.id}>.`,
          allowedMentions: { parse: [] },
        })
        return
      }

      await interaction.editReply({ content: 'Sous-commande Wiki inconnue. Utilise `/wiki-admin help`.' })
    } catch (error) {
      await interaction.editReply({
        content: `Administration Wiki impossible : ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }

  private async planningCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const monday = this.nextPlanningMonday()
    const select = new StringSelectMenuBuilder().setCustomId(`pf2-planification:create:${monday}`).setPlaceholder('Choisis les jours proposés').setMinValues(1).setMaxValues(PLANNING_DAYS.length).addOptions(PLANNING_DAYS.map(day => ({ label: `${day.label} ${this.planningDate(this.addDays(monday, day.offset))}`, value: String(day.offset), emoji: day.emoji })))
    await interaction.reply({ content: `Semaine du ${this.planningDate(monday, true)} : sélectionne toutes les dates à proposer.`, components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)], ephemeral: true })
  }

  private async modifyPlanningCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const channel = interaction.channel
    if (!channel?.isThread()) { await interaction.reply({ content: 'Utilise cette commande dans le fil créé depuis le message de planification.', ephemeral: true }); return }
    let starter
    try { starter = await channel.fetchStarterMessage() } catch { starter = null }
    if (!starter) { await interaction.reply({ content: 'Ce fil n’est pas rattaché à un message de planification.', ephemeral: true }); return }
    const parsed = this.parsePlanningMessage(starter.content)
    if (!parsed) { await interaction.reply({ content: 'Le message de départ de ce fil n’est pas une planification reconnue.', ephemeral: true }); return }
    const selected = new Set(parsed.selectedDays)
    const select = new StringSelectMenuBuilder().setCustomId(`pf2-planification:modify:${starter.id}`).setPlaceholder('Dates proposées').setMinValues(0).setMaxValues(PLANNING_DAYS.length).addOptions(PLANNING_DAYS.map(day => ({ label: `${day.label} ${this.planningDate(this.addDays(parsed.monday, day.offset))}`, value: String(day.offset), emoji: day.emoji, default: selected.has(day.offset) })))
    await interaction.reply({ content: 'Coche exactement les dates à conserver. Décoche une date pour la supprimer ; coche-en une nouvelle pour l’ajouter.', components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)], ephemeral: true })
  }

  private async programmerSeanceCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.isAdmin(interaction)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }
    const channel = interaction.channel
    if (!channel?.isTextBased() || !('messages' in channel)) {
      await interaction.reply({ content: 'Cette commande doit être utilisée dans un salon de discussion.', ephemeral: true })
      return
    }

    await interaction.deferReply({ ephemeral: true })
    const letters = ['L', 'M', 'T', 'J', 'V', 'S', 'D'] as const
    const dayByEmoji = new Map<string, string>()
    for (const day of PLANNING_DAYS) {
      const key = String(day.offset)
      const letter = letters[day.offset]
      dayByEmoji.set(day.emoji, key)
      dayByEmoji.set(letter, key)
      dayByEmoji.set(`REGIONAL_INDICATOR_${letter}`, key)
    }
    const reactionDayKey = (name: string | null): string | null => dayByEmoji.get(name?.trim().toUpperCase() ?? '') ?? null

    try {
      let scheduleMessage = null
      if (channel.isThread()) {
        try {
          const starter = await channel.fetchStarterMessage()
          if (starter && this.parsePlanningMessage(starter.content)) scheduleMessage = starter
        } catch {
          // Le fil peut ne plus avoir accès à son message de départ.
        }
      }
      if (!scheduleMessage) {
        const messages = await channel.messages.fetch({ limit: 100 })
        scheduleMessage = messages.find(message => this.parsePlanningMessage(message.content) !== null) ?? null
      }
      if (!scheduleMessage) {
        await interaction.editReply({ content: 'Je n’ai trouvé aucune planification récente dans ce salon.' })
        return
      }

      const parsed = this.parsePlanningMessage(scheduleMessage.content)
      if (!parsed) {
        await interaction.editReply({ content: 'Le message de planification trouvé n’est plus reconnaissable.' })
        return
      }

      const selectedDays = new Set(parsed.selectedDays)
      const days = PLANNING_DAYS
        .filter(day => selectedDays.has(day.offset))
        .map(day => [String(day.offset), `${day.label} ${this.planningDate(this.addDays(parsed.monday, day.offset))}`] as const)
      const valerianId = this.discordId('valerian')
      const playCounts = await this.discordSessionCounts()
      const availability = new Map<string, Array<{ id: string; name: string; played: number }>>()
      for (const [key] of days) availability.set(key, [])

      for (const reaction of scheduleMessage.reactions.cache.values()) {
        const key = reactionDayKey(reaction.emoji.name)
        if (!key || !availability.has(key)) continue
        const users = await reaction.users.fetch()
        const available = users
          .filter(user => !user.bot && user.id !== valerianId)
          .map(user => ({ id: user.id, name: user.globalName?.trim() || user.username, played: playCounts.get(user.id) ?? 0 }))
          .sort((a, b) => a.played - b.played || a.name.localeCompare(b.name, 'fr'))
        availability.set(key, available)
      }

      const proposals = this.bestSessionGroupProposals(days, availability)
      const lines = ['**Groupes possibles pour la prochaine semaine**']
      if (!proposals.length) {
        lines.push('Aucun groupe de 4 sans réutiliser un joueur ne peut être formé avec les disponibilités actuelles.')
      } else {
        const compact = this.compactSessionGroupProposals(proposals)
        if (compact) {
          for (const group of compact) {
            lines.push('', `**${group.label}**`)
            lines.push(...group.fixed.map(player => `- ${player.name} — ${player.played} séance${player.played > 1 ? 's' : ''} jouée${player.played > 1 ? 's' : ''}`))
            if (group.choose > 0) {
              const choices = group.pool.map(player => `${player.name} (${player.played})`).join(', ')
              lines.push(`- **Choisir ${group.choose}/${group.pool.length}** : ${choices}`)
            }
          }
        } else {
          for (const [index, groups] of proposals.slice(0, 3).entries()) {
            if (proposals.length > 1) lines.push('', `**Proposition ${index + 1} — ex æquo**`)
            for (const group of groups) {
              lines.push('', `**${group.label}**`, ...group.players.map(player => `- ${player.name} — ${player.played} séance${player.played > 1 ? 's' : ''} jouée${player.played > 1 ? 's' : ''}`))
            }
          }
        }
        const groupCount = proposals[0].length
        lines.push('', `${groupCount} groupe${groupCount > 1 ? 's' : ''} de 4 possible${groupCount > 1 ? 's' : ''}, sans réutiliser de joueur.`)
      }

      const publicContent = lines.join('\n')
      if (publicContent.length > 2_000) {
        await interaction.editReply({ content: `Le résultat fait ${publicContent.length} caractères et dépasse la limite Discord. Réduis le nombre de jours proposés ou les égalités à départager.` })
        return
      }

      const sourceLine = `Message analysé : ${scheduleMessage.url}`
      const preview = `${publicContent}\n\n${sourceLine}`.length <= 2_000 ? `${publicContent}\n\n${sourceLine}` : publicContent
      if (!proposals.length) {
        await interaction.editReply({ content: preview, components: [], allowedMentions: { parse: [] } })
        return
      }

      const publishId = `pf2-schedule:publish:${interaction.id}`
      this.pendingSchedulePublications.set(publishId, { requesterId: interaction.user.id, content: publicContent })
      const publish = new ButtonBuilder().setCustomId(publishId).setLabel('Publier').setStyle(ButtonStyle.Primary)
      await interaction.editReply({
        content: preview,
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(publish)],
        allowedMentions: { parse: [] },
      })
    } catch (error) {
      this.logger.error('programmer-seance: calcul impossible', error instanceof Error ? error.stack : undefined)
      await interaction.editReply({ content: `Calcul impossible : ${error instanceof Error ? error.message : String(error)}` })
    }
  }

  private async discordSessionCounts(): Promise<Map<string, number>> {
    const sessions = (await this.persistence.listSessions()).filter(session => session.published || (session.sessionXp ?? 0) > 0)
    const actorNames = await this.actorNames()
    const byUser = new Map<string, Set<number>>()
    for (const session of sessions) {
      const seen = new Set<string>()
      for (const uuid of new Set(session.participants)) {
        const actorName = actorNames.get(uuid)
        if (!actorName || !this.isPlayerActorName(actorName)) continue
        const userId = this.discordId(this.playerName(actorName))
        if (!userId || seen.has(userId)) continue
        seen.add(userId)
        if (!byUser.has(userId)) byUser.set(userId, new Set())
        byUser.get(userId)!.add(session.sessionNumber)
      }
    }
    return new Map([...byUser.entries()].map(([userId, played]) => [userId, played.size]))
  }

  private compactSessionGroupProposals(
    proposals: Array<Array<{ key: string; label: string; players: Array<{ id: string; name: string; played: number }> }>>,
  ): Array<{ key: string; label: string; fixed: Array<{ id: string; name: string; played: number }>; pool: Array<{ id: string; name: string; played: number }>; choose: number }> | null {
    if (proposals.length < 2) return null
    const reference = proposals[0]
    if (!proposals.every(proposal => proposal.length === reference.length && proposal.every((group, index) => group.key === reference[index].key))) return null

    const combinationCount = (n: number, k: number): number => {
      if (k < 0 || k > n) return 0
      let result = 1
      for (let i = 1; i <= Math.min(k, n - k); i++) result = (result * (n - i + 1)) / i
      return result
    }

    const compact = reference.map((group, index) => {
      const fixed = group.players.filter(player => proposals.every(proposal => proposal[index].players.some(candidate => candidate.id === player.id)))
      const fixedIds = new Set(fixed.map(player => player.id))
      const poolById = new Map<string, { id: string; name: string; played: number }>()
      const selections = new Set<string>()
      for (const proposal of proposals) {
        const variable = proposal[index].players.filter(player => !fixedIds.has(player.id))
        for (const player of variable) poolById.set(player.id, player)
        selections.add(variable.map(player => player.id).sort().join(','))
      }
      const pool = [...poolById.values()].sort((a, b) => a.played - b.played || a.name.localeCompare(b.name, 'fr'))
      const choose = 4 - fixed.length
      return { key: group.key, label: group.label, fixed, pool, choose, selections }
    })

    for (const group of compact) if (group.selections.size !== combinationCount(group.pool.length, group.choose)) return null
    const actual = new Set(proposals.map(proposal => proposal.map((group, index) => {
      const fixedIds = new Set(compact[index].fixed.map(player => player.id))
      return group.players.filter(player => !fixedIds.has(player.id)).map(player => player.id).sort().join(',')
    }).join('|'))).size
    const expected = compact.reduce((product, group) => product * group.selections.size, 1)
    if (actual !== expected) return null

    return compact.map(({ selections: _selections, ...group }) => group)
  }

  private bestSessionGroupProposals(
    days: readonly (readonly [string, string])[],
    availability: Map<string, Array<{ id: string; name: string; played: number }>>,
  ): Array<Array<{ key: string; label: string; players: Array<{ id: string; name: string; played: number }> }>> {
    type Player = { id: string; name: string; played: number }
    type Group = { key: string; label: string; players: Player[] }
    const options = days.map(([key, label]) => {
      const players = availability.get(key) ?? []
      const groups: Array<{ players: Player[]; score: number }> = []
      for (let a = 0; a < players.length - 3; a++) for (let b = a + 1; b < players.length - 2; b++)
        for (let c = b + 1; c < players.length - 1; c++) for (let d = c + 1; d < players.length; d++) {
          const group = [players[a], players[b], players[c], players[d]]
          groups.push({ players: group, score: group.reduce((sum, player) => sum + player.played, 0) })
        }
      groups.sort((left, right) => left.score - right.score)
      return { key, label, groups }
    })

    const allUserIds = new Set([...availability.values()].flat().map(player => player.id))
    let bestGroupCount = 0
    let bestScore = Number.POSITIVE_INFINITY
    let proposals: Group[][] = []
    let proposalKeys = new Set<string>()

    const saveProposal = (chosen: Group[], score: number): void => {
      const count = chosen.length
      if (count < bestGroupCount || (count === bestGroupCount && score > bestScore)) return
      if (count > bestGroupCount || score < bestScore) {
        bestGroupCount = count
        bestScore = score
        proposals = []
        proposalKeys = new Set<string>()
      }
      if (count === 0) return
      const key = chosen.map(group => `${group.key}:${group.players.map(player => player.id).sort().join(',')}`).join('|')
      if (proposalKeys.has(key)) return
      proposalKeys.add(key)
      if (proposals.length < 100) proposals.push(chosen.map(group => ({ ...group, players: [...group.players] })))
    }

    const search = (index: number, used: Set<string>, chosen: Group[], score: number): void => {
      const remainingPlayers = [...allUserIds].filter(userId => !used.has(userId)).length
      const maximum = chosen.length + Math.min(options.length - index, Math.floor(remainingPlayers / 4))
      if (maximum < bestGroupCount) return
      if (index >= options.length) { saveProposal(chosen, score); return }

      const option = options[index]
      for (const candidate of option.groups) {
        if (candidate.players.some(player => used.has(player.id))) continue
        const nextUsed = new Set(used)
        for (const player of candidate.players) nextUsed.add(player.id)
        search(index + 1, nextUsed, [...chosen, { key: option.key, label: option.label, players: candidate.players }], score + candidate.score)
      }
      search(index + 1, used, chosen, score)
    }

    search(0, new Set(), [], 0)
    return proposals
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
    const sessions = (await this.persistence.listSessions()).filter((session) => session.published)
    const names = await this.actorNames()
    const levels = await this.playerLevels()
    const characterSessions = new Map<string, number>()
    const playerSessions = new Map<string, Set<number>>()

    for (const session of sessions) {
      const playersInSession = new Set<string>()
      for (const uuid of new Set(session.participants)) {
        const name = names.get(uuid)
        if (!name || !this.isPlayerActorName(name)) continue
        characterSessions.set(uuid, (characterSessions.get(uuid) ?? 0) + 1)
        playersInSession.add(this.playerName(name))
      }
      for (const player of playersInSession) {
        if (!playerSessions.has(player)) playerSessions.set(player, new Set())
        playerSessions.get(player)!.add(session.sessionNumber)
      }
    }

    const characters = [...characterSessions.entries()]
      .filter(([, count]) => count > 0)
      .flatMap(([uuid, count]) => {
        const name = names.get(uuid)
        return name ? [{ uuid, name, player: this.playerName(name), count }] : []
      })

    const players = [...playerSessions.entries()]
      .filter(([, played]) => played.size > 0)
      .sort(([left], [right]) => left.localeCompare(right, 'fr'))

    if (!players.length) {
      await interaction.editReply({ content: 'Aucune séance jouée n’est enregistrée.' })
      return
    }

    const lines = ['**Récap des séances jouées**']
    for (const [player, played] of players) {
      lines.push('', `**${player} — ${played.size} séance${played.size > 1 ? 's' : ''}**`)
      for (const actor of characters.filter((item) => item.player === player).sort((a, b) => a.name.localeCompare(b.name, 'fr'))) {
        lines.push(`- ${this.characterLabel(actor.name)} — ${this.levelLabel(actor.uuid, levels)} — ${actor.count} séance${actor.count > 1 ? 's' : ''}`)
      }
    }
    await interaction.editReply({ content: lines.join('\n').slice(0, 2_000) })
  }

  private async recapSessionCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply()
    const raw = interaction.options.getString('session', true).trim()
    const number = Number(raw)
    if (!Number.isInteger(number) || number < 1) {
      await interaction.editReply({ content: 'Numéro de séance invalide.' })
      return
    }
    const sessions = await this.persistence.listSessions()
    const session = sessions.find((item) => item.sessionNumber === number)
    if (!session) {
      await interaction.editReply({ content: `Aucune séance n°${number} n’existe.` })
      return
    }
    const names = await this.actorNames()
    const actors = session.participants.flatMap((uuid) => {
      const name = names.get(uuid)
      return name ? [{ uuid, name }] : []
    })
    const rolls = this.progressionRollCounts(actors, sessions, session.sessionNumber)
    const content = await this.plannedSessionAnnouncement(session.sessionNumber, session.inGameStartDate, actors, rolls)
    await interaction.editReply({ content })
  }

  async handleAutocomplete(interaction: AutocompleteInteraction): Promise<boolean> {
    if (interaction.commandName === 'recap-seance') {
      const term = interaction.options.getFocused().toString().trim().toLocaleLowerCase()
      const sessions = await this.persistence.listSessions()
      await interaction.respond(
        sessions
          .filter((session) => String(session.sessionNumber).includes(term) || session.title.toLocaleLowerCase().includes(term))
          .sort((a, b) => b.sessionNumber - a.sessionNumber)
          .slice(0, 25)
          .map((session) => ({
            name: `#${session.sessionNumber} — ${session.title || (session.inGameStartDate ? this.displayDate(session.inGameStartDate) : 'Sans titre')}`.slice(0, 100),
            value: String(session.sessionNumber),
          })),
      )
      return true
    }
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
    await interaction.deferReply()
    let sourceNpcId: string | null = null; let name = value; let portrait: string | null = attachment?.url ?? null
    if (value.startsWith('npc:')) {
      sourceNpcId = value.slice(4)
      const candidate = await this.playerCodex!.characterCandidate(sourceNpcId)
      if (!candidate) {
        await interaction.editReply({ content: 'PNJ sélectionné invalide.' })
        return
      }
      name = candidate.name
      portrait ??= candidate.portrait
    }
    if (!sourceNpcId && !portrait) { await interaction.editReply({ content: 'Un portrait est obligatoire pour un personnage improvisé.' }); return }
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

    const message = await interaction.editReply({
      content: showName ? presentation.name : '\u200b',
      files: discordPortrait ? [discordPortrait] : [],
      components,
      allowedMentions: { parse: [] },
    })
    await this.playerCodex!.savePresentationMessage(presentation.id, message.id, message.attachments.first()?.url ?? portrait)
  }

  async handleComponent(interaction: StringSelectMenuInteraction): Promise<boolean> {
    const createPlanning = interaction.customId.match(/^pf2-planification:create:(\d{4}-\d{2}-\d{2})$/)
    if (createPlanning) {
      const monday = createPlanning[1]
      const selectedDays = this.planningSelectedDays(interaction.values)
      if (!selectedDays.length) { await interaction.reply({ content: 'Choisis au moins une date.', ephemeral: true }); return true }
      const channel = interaction.channel
      if (!channel?.isSendable()) { await interaction.reply({ content: 'Impossible de publier une planification dans ce salon.', ephemeral: true }); return true }
      await interaction.deferUpdate()
      try {
        const message = await channel.send({ content: this.planningMessage(monday, selectedDays), allowedMentions: { parse: ['everyone'] } })
        for (const day of PLANNING_DAYS.filter(day => selectedDays.includes(day.offset))) await message.react(day.emoji)
        await message.react(PLANNING_UNAVAILABLE_EMOJI)
        let threadCreated = true
        try { await message.startThread({ name: `Planification — semaine du ${this.planningDate(monday)}` }) }
        catch (error) { threadCreated = false; this.logger.warn(`Planification ${message.id} publiée, mais fil impossible : ${error instanceof Error ? error.message : String(error)}`) }
        await interaction.editReply({ content: threadCreated ? 'Planification publiée, réactions ajoutées et fil créé. Utilise `/modifier-planification` dans ce fil pour changer les dates.' : 'Planification publiée et réactions ajoutées. Le fil n’a pas pu être créé automatiquement : crée un fil depuis le message pour utiliser `/modifier-planification`.', components: [] })
      } catch (error) {
        await interaction.editReply({ content: `Publication impossible : ${error instanceof Error ? error.message : String(error)}`, components: [] })
      }
      return true
    }

    const modifyPlanning = interaction.customId.match(/^pf2-planification:modify:(\d+)$/)
    if (modifyPlanning) {
      const channel = interaction.channel
      if (!channel?.isThread()) { await interaction.reply({ content: 'Cette modification doit être utilisée dans le fil de la planification.', ephemeral: true }); return true }
      let starter
      try { starter = await channel.fetchStarterMessage() } catch { starter = null }
      if (!starter || starter.id !== modifyPlanning[1]) { await interaction.reply({ content: 'Le message de planification associé à ce menu est introuvable.', ephemeral: true }); return true }
      const parsed = this.parsePlanningMessage(starter.content)
      if (!parsed) { await interaction.reply({ content: 'Le message de planification n’est plus reconnaissable.', ephemeral: true }); return true }
      const selectedDays = this.planningSelectedDays(interaction.values)
      const before = new Set(parsed.selectedDays); const after = new Set(selectedDays)
      await interaction.deferUpdate()
      try {
        await starter.edit({ content: this.planningMessage(parsed.monday, selectedDays), allowedMentions: { parse: ['everyone'] } })
        for (const day of PLANNING_DAYS) {
          if (before.has(day.offset) && !after.has(day.offset)) { const reaction = starter.reactions.resolve(day.emoji); if (reaction) await reaction.remove() }
          else if (!before.has(day.offset) && after.has(day.offset)) await starter.react(day.emoji)
        }
        if (!starter.reactions.resolve(PLANNING_UNAVAILABLE_EMOJI)) await starter.react(PLANNING_UNAVAILABLE_EMOJI)
        await interaction.editReply({ content: 'Planification mise à jour.', components: [] })
      } catch (error) {
        await interaction.editReply({ content: `Modification impossible : ${error instanceof Error ? error.message : String(error)}`, components: [] })
      }
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
      const plan = pending.plan
      if (!plan) { await interaction.reply({ content: 'Le calcul des dates a expiré. Relance `/new-game`.', ephemeral: true }); return true }

      const offsetInput = new TextInputBuilder()
        .setCustomId('offset')
        .setLabel('J+')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('0')
        .setValue('0')
        .setRequired(true)

      if (interaction.values[0] === 'custom') {
        const modalId = interaction.customId.replace(/:date$/, ':custom-date')
        const modal = new ModalBuilder().setCustomId(modalId).setTitle('Date de la mission')
        const dateInput = new TextInputBuilder()
          .setCustomId('date')
          .setLabel(`À partir du ${plan.earliest}`)
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('YYYY-MM-DD')
          .setValue(plan.earliest)
          .setRequired(true)
        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(offsetInput),
        )
        this.pendingGames.set(modalId, pending)
        this.pendingGames.delete(interaction.customId)
        await interaction.showModal(modal)
        return true
      }

      const modalId = interaction.customId.replace(/:date$/, ':offset')
      pending.baseDate = interaction.values[0] === 'current' ? plan.current : plan.earliest
      this.pendingGames.set(modalId, pending)
      this.pendingGames.delete(interaction.customId)
      const modal = new ModalBuilder().setCustomId(modalId).setTitle('Décalage de la mission')
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(offsetInput))
      await interaction.showModal(modal)
      return true
    }

    const selected = pending.actors.filter(actor => interaction.values.includes(actor.uuid))
    if (!selected.length) { await interaction.reply({ content: 'Choisis au moins un PJ.', ephemeral: true }); return true }
    await interaction.deferUpdate()
    try {
      pending.selected = selected
      const plan = await this.plan(selected)
      pending.plan = plan
      const id = interaction.customId.replace(/:players$/, ':date')
      this.pendingGames.set(id, pending)
      this.pendingGames.delete(interaction.customId)
      const select = new StringSelectMenuBuilder().setCustomId(id).setPlaceholder('Choisis la date de début').addOptions([
        { label: `Le plus tôt — ${this.displayDate(plan.earliest)}`, value: 'earliest' },
        { label: `Après dernière mission — ${this.displayDate(plan.current)}`, value: 'current' },
        { label: 'Choisir une autre date…', value: 'custom' },
      ])
      await interaction.editReply({ content: `${selected.map(actor => actor.name).join(', ')}\n\n${plan.progressionRolls.join('\n')}\n\nChoisis la date de début.`, components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)] })
    } catch (error) {
      await interaction.editReply({ content: `Préparation impossible : ${error instanceof Error ? error.message : String(error)}`, components: [] })
    }
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

      await interaction.deferReply({ ephemeral: true })
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
      await interaction.deferReply({ ephemeral: true })
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
        await interaction.editReply({ content: profile.created ? `Fiche créée : ${pageUrl}` : `Cette fiche existe déjà : ${pageUrl}`, allowedMentions: { parse: [] } })
      } catch (error) { await interaction.editReply({ content: error instanceof Error ? `Création impossible : ${error.message}` : 'Création impossible.' }) }
      return true
    }
    if (!interaction.customId.startsWith('pf2-new-game:')) return false
    const pending = this.pendingGames.get(interaction.customId)
    if (!pending) { await interaction.reply({ content: 'Cette préparation a expiré. Relance `/new-game`.', ephemeral: true }); return true }
    const plan = pending.plan
    if (!plan) { await interaction.reply({ content: 'Le calcul des dates a expiré. Relance `/new-game`.', ephemeral: true }); return true }

    const rawOffset = interaction.fields.getTextInputValue('offset').trim()
    const offset = Number(rawOffset)
    if (!Number.isInteger(offset) || offset < 0) {
      await interaction.reply({ content: '`J+` doit être un nombre entier positif ou nul.', ephemeral: true })
      return true
    }

    let baseDate = pending.baseDate ?? ''
    if (interaction.customId.endsWith(':custom-date')) {
      baseDate = interaction.fields.getTextInputValue('date').trim()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(baseDate) || baseDate < plan.earliest) {
        await interaction.reply({ content: `Choisis une date YYYY-MM-DD à partir du ${this.displayDate(plan.earliest)}.`, ephemeral: true })
        return true
      }
    }

    if (!baseDate) {
      await interaction.reply({ content: 'La date de base est introuvable. Relance `/new-game`.', ephemeral: true })
      return true
    }

    const date = this.addDays(baseDate, offset)
    await interaction.deferReply({ ephemeral: true })
    try {
      await this.finishGameModal(interaction, pending, date, plan)
      this.pendingGames.delete(interaction.customId)
    } catch (error) {
      await interaction.editReply({ content: `Création du brouillon impossible : ${error instanceof Error ? error.message : String(error)}`, components: [] })
    }
    return true
  }

  async handleButton(interaction: ButtonInteraction): Promise<boolean> {
    if (interaction.customId.startsWith('pf2-schedule:publish:')) {
      const pending = this.pendingSchedulePublications.get(interaction.customId)
      if (!pending) { await interaction.reply({ content: 'Cette validation a expiré. Relance `/programmer-seance`.', ephemeral: true }); return true }
      if (interaction.user.id !== pending.requesterId) { await interaction.reply({ content: 'Cette validation appartient à un autre administrateur.', ephemeral: true }); return true }
      try {
        await interaction.update({ components: [] })
        await interaction.followUp({ content: pending.content, ephemeral: false, allowedMentions: { parse: [] } })
        this.pendingSchedulePublications.delete(interaction.customId)
      } catch (error) {
        await interaction.followUp({ content: `Publication impossible : ${error instanceof Error ? error.message : String(error)}`, ephemeral: true }).catch(() => undefined)
      }
      return true
    }
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
    await interaction.deferReply({ ephemeral: true })
    const requestedNumber = interaction.options.getInteger('numero') ?? await this.lastBotSessionNumber(interaction)
    if (!requestedNumber) { await interaction.editReply({ content: 'Indique `numero`, ou utilise la commande dans un salon contenant une annonce récente du bot avec « Résumé n°… ». ' }); return }
    const endDate = interaction.options.getString('fin')?.trim() ?? ''
    const days = interaction.options.getInteger('jours')
    const xp = interaction.options.getInteger('xp', true)
    if (Boolean(endDate) === (days !== null)) { await interaction.editReply({ content: 'Indique soit `fin` (YYYY-MM-DD), soit `jours`, mais pas les deux.' }); return }
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) { await interaction.editReply({ content: 'La date de fin doit être au format YYYY-MM-DD.' }); return }
    const session = (await this.persistence.listSessions()).find((item) => item.sessionNumber === requestedNumber)
    if (!session) { await interaction.editReply({ content: `Aucun résumé n°${requestedNumber} n’existe.` }); return }
    if (days !== null && !session.inGameStartDate) { await interaction.editReply({ content: `Le résumé n°${requestedNumber} n’a pas de date de début en jeu : précise plutôt \`fin\`.` }); return }
    const resolvedEndDate = endDate || this.addDays(session.inGameStartDate, Math.max(0, (days ?? 1) - 1))
    const updated = await this.persistence.updateSession(session.id, { inGameEndDate: resolvedEndDate, sessionXp: xp, ...(session.date ? {} : { date: this.realDate() }) })
    await interaction.editReply({ content: `Résumé n°${requestedNumber} mis à jour : fin en jeu le ${this.displayDate(resolvedEndDate)} ; ${xp} XP par PJ.` })
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

    const allowedAuthors = await this.summaryAuthors(interaction, true)
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
    await this.showShortSummaryModal(interaction, id, pending, author, session, sessions)
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
    current: import('../pf2-storage/Pf2PersistenceService').Pf2Session,
    sessions: import('../pf2-storage/Pf2PersistenceService').Pf2Session[],
  ): Promise<void> {
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
      .setMaxLength(4000)
      .setRequired(false)

    if (current.shortSummary) summaryInput.setValue(current.shortSummary.slice(0, 4000))

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(levelInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(summaryInput),
    )

    await interaction.showModal(modal)
  }

  private async saveShortSummary(
    interaction: Pick<ModalSubmitInteraction, 'editReply' | 'user'>,
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
      await interaction.editReply({ content: 'Séance, demandeur ou auteur invalide.' })
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

    if (finalLength > 2_000) {
      await interaction.editReply({
        content: `Le message Discord final ferait ${finalLength}/2000 caractères. Raccourcis le résumé ou ses libellés de liens.`,
      })
      return false
    }

    const updated = await this.persistence.updateSession(pending.sessionId, {
      title: values.title,
      date: values.date,
      shortSummary: values.summary,
      shortSummaryAuthor: author,
      shortSummaryXp,
    })

    if (!updated) {
      await interaction.editReply({ content: 'Séance introuvable.' })
      return false
    }

    const authorName = pending.allowedAuthors.find(actor => actor.uuid === author)?.name ?? author
    let syncNote = ''

    if (updated.published && this.discord) {
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

    await interaction.editReply({
      content:
        `Résumé court de la séance ${pending.sessionNumber} mis à jour — auteur : ${authorName}. ` +
        `Niveau du personnage au début de la séance : ${reward.levelAtStart}; bonus : ${shortSummaryXp} XP.` +
        syncNote,
      components: [this.resumeActionsRow(updated.id, updated.sessionNumber, pending.requesterId)],
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
    await interaction.deferReply({ ephemeral: true })
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
    if (!choices.length) { await interaction.editReply({ content: 'Aucun PJ connu n’a été détecté parmi les auteurs récents de ce salon. Les PJ doivent être nommés « Personnage (Joueur) ».' }); return }
    const id = `pf2-new-game:${interaction.id}:players`
    this.pendingGames.set(id, { actors: known })
    const select = new StringSelectMenuBuilder().setCustomId(id).setPlaceholder('Choisis les PJ participants').setMinValues(1).setMaxValues(choices.length).addOptions(choices)
    await interaction.editReply({ content: `PJ détectés dans cette discussion : ${known.map(actor => actor.name).join(', ')}. Choisis les participants.`, components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)] })
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

  private async plan(actors: Array<{ uuid: string; name: string }>): Promise<{ current: string; earliest: string; progressionRolls: string[]; rollCounts: Map<string, number> }> {
    const sessions = (await this.persistence.listSessions()).filter((session) => session.published)
    const lastMissionEnd = sessions.map((session) => this.missionEnd(session)).filter(Boolean).sort().at(-1)
    const current = lastMissionEnd ? this.addDays(lastMissionEnd, 1) : this.today()
    const rollCounts = this.progressionRollCounts(actors, sessions)
    const availability = actors.map((actor) => {
      const last = sessions.filter((session) => session.participants.includes(actor.uuid)).sort((left, right) => this.missionEnd(left).localeCompare(this.missionEnd(right))).at(-1)
      const available = last ? this.addDays(this.missionEnd(last), 1) : null
      return { actor, available, missed: rollCounts.get(actor.uuid) ?? 0 }
    })
    const constrainedAvailability = availability.flatMap((item) => item.available ? [item.available] : [])
    return {
      current,
      earliest: constrainedAvailability.sort().at(-1) || current,
      rollCounts,
      progressionRolls: [
        '**Jets de progression** — 1 jet correspond à 7 jours d’activité.',
        ...availability.map((item) => `${item.actor.name} : **${item.missed} jet${item.missed > 1 ? 's' : ''} de progression** (${item.missed * 7} jour${item.missed * 7 > 1 ? 's' : ''}).`)
      ]
    }
  }

  private async finishGame(interaction: StringSelectMenuInteraction, pending: { selected?: Array<{ uuid: string; name: string; userId: string }> }, date: string, plan: { progressionRolls: string[]; rollCounts: Map<string, number> }): Promise<void> {
    const sessions = await this.persistence.listSessions()
    const sessionNumber = Math.max(0, ...sessions.map((session) => session.sessionNumber)) + 1
    const selected = pending.selected ?? []
    const draft = await this.persistence.createSession({ sessionNumber, date: '', inGameStartDate: date, inGameEndDate: '', title: '', participants: selected.map((actor) => actor.uuid), published: false })
    const content = `Brouillon créé : résumé n°${draft.sessionNumber}.\nDébut : ${this.displayDate(date)}. Fin : à renseigner.\n\n${plan.progressionRolls.join('\n')}\n\nComplète puis publie le résumé dans l’application MJ.`
    const announcementId = `pf2-new-game:announce:${draft.id}`
    this.pendingAnnouncements.set(announcementId, { content: await this.plannedSessionAnnouncement(draft.sessionNumber, date, selected, plan.rollCounts, true), userIds: selected.map((actor) => actor.userId) })
    const publish = new ButtonBuilder().setCustomId(announcementId).setLabel('Publier l’annonce').setStyle(ButtonStyle.Primary)
    await interaction.update({ content, components: [new ActionRowBuilder<ButtonBuilder>().addComponents(publish)] })
  }

  private async finishGameModal(interaction: ModalSubmitInteraction, pending: { selected?: Array<{ uuid: string; name: string; userId: string }> }, date: string, plan: { progressionRolls: string[]; rollCounts: Map<string, number> }): Promise<void> {
    const sessions = await this.persistence.listSessions()
    const sessionNumber = Math.max(0, ...sessions.map((session) => session.sessionNumber)) + 1
    const selected = pending.selected ?? []
    const draft = await this.persistence.createSession({ sessionNumber, date: '', inGameStartDate: date, inGameEndDate: '', title: '', participants: selected.map((actor) => actor.uuid), published: false })
    const announcementId = `pf2-new-game:announce:${draft.id}`
    this.pendingAnnouncements.set(announcementId, { content: await this.plannedSessionAnnouncement(draft.sessionNumber, date, selected, plan.rollCounts, true), userIds: selected.map((actor) => actor.userId) })
    const publish = new ButtonBuilder().setCustomId(announcementId).setLabel('Publier l’annonce').setStyle(ButtonStyle.Primary)
    await interaction.editReply({ content: `Brouillon créé : résumé n°${draft.sessionNumber}.\nDébut : ${this.displayDate(date)}. Fin : à renseigner.\n\n${plan.progressionRolls.join('\n')}\n\nComplète puis publie le résumé dans l’application MJ.`, components: [new ActionRowBuilder<ButtonBuilder>().addComponents(publish)] })
  }

  private planningSelectedDays(values: readonly string[]): number[] { return [...new Set(values.map(Number))].filter(value => Number.isInteger(value) && value >= 0 && value < PLANNING_DAYS.length).sort((a, b) => a - b) }
  private planningToday(now = new Date()): string {
    const zone = process.env['PF2_TIME_ZONE'] ?? 'Europe/Paris'
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
    const value = (kind: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === kind)?.value ?? ''
    return `${value('year')}-${value('month')}-${value('day')}`
  }
  private nextPlanningMonday(now = new Date()): string { const today = this.planningToday(now); const date = new Date(`${today}T12:00:00Z`); const day = date.getUTCDay(); return this.addDays(today, day === 1 ? 7 : (8 - day) % 7) }
  private planningDate(date: string, withYear = false): string { const [year, month, day] = date.split('-').map(Number); const label = `${day} ${PLANNING_MONTHS[month - 1]}`; return withYear ? `${label} ${year}` : label }
  private planningMessage(monday: string, selectedDays: readonly number[]): string {
    const selected = new Set(selectedDays)
    return [`@everyone **Nouvelle séance ! La semaine du lundi ${this.planningDate(monday, true)}**`, '', ...PLANNING_DAYS.filter(day => selected.has(day.offset)).map(day => `${day.emoji} ${day.label} ${this.planningDate(this.addDays(monday, day.offset))}`), `${PLANNING_UNAVAILABLE_EMOJI} Pas dispo`].join('\n')
  }
  private parsePlanningMessage(content: string): { monday: string; selectedDays: number[] } | null {
    const match = content.match(/semaine du lundi\s+(\d{1,2})\s+([^\s*]+)\s+(\d{4})/iu)
    if (!match) return null
    const day = Number(match[1]); const month = PLANNING_MONTHS.findIndex(value => value.toLocaleLowerCase('fr') === match[2].toLocaleLowerCase('fr')) + 1; const year = Number(match[3])
    if (!month || !Number.isInteger(day) || day < 1 || day > 31 || !Number.isInteger(year)) return null
    const monday = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`; const parsed = new Date(`${monday}T12:00:00Z`)
    if (Number.isNaN(parsed.valueOf()) || parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day || parsed.getUTCDay() !== 1) return null
    return { monday, selectedDays: PLANNING_DAYS.filter(value => content.includes(`${value.emoji} ${value.label} `)).map(value => value.offset) }
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

  private characterLabel(name: string): string {
    const label = name.replace(/\s+\([^()]+\)\s*$/, '').trim()
    return label || name
  }

  private isPlayerActorName(name: string): boolean { return /^\S(?:.*\S)?\s+\([^()]+\)$/u.test(name.trim()) }

  private progressionRollCounts(
    actors: Array<{ uuid: string }>,
    sessions: import('../pf2-storage/Pf2PersistenceService').Pf2Session[],
    beforeSessionNumber?: number,
  ): Map<string, number> {
    const eligible = sessions
      .filter((session) => session.published && (beforeSessionNumber === undefined || session.sessionNumber < beforeSessionNumber))
      .sort((left, right) => left.sessionNumber - right.sessionNumber)
    return new Map(actors.map((actor) => {
      const last = eligible.filter((session) => session.participants.includes(actor.uuid)).at(-1)
      const missed = last ? eligible.filter((session) => session.sessionNumber > last.sessionNumber).length : eligible.length
      return [actor.uuid, missed]
    }))
  }

  private async playerLevels(): Promise<Map<string, { foundryLevel: number; theoreticalLevel: number }>> {
    try {
      const players = await this.foundry.listPlayers()
      return new Map(players.map((player) => [player.uuid, { foundryLevel: player.foundryLevel, theoreticalLevel: player.level }]))
    } catch (error) {
      this.logger.warn(`Niveaux Foundry indisponibles : ${error instanceof Error ? error.message : String(error)}`)
      return new Map()
    }
  }

  private levelLabel(uuid: string, levels: Map<string, { foundryLevel: number; theoreticalLevel: number }>): string {
    const value = levels.get(uuid)
    if (!value) return 'niveau ?'
    const delta = value.theoreticalLevel - value.foundryLevel
    if (delta > 0) return `niveau ${value.foundryLevel} (${delta} niveau${delta > 1 ? 'x' : ''} à faire !)`
    if (delta < 0) return `niveau ${value.foundryLevel} (niveau théorique ${value.theoreticalLevel})`
    return `niveau ${value.foundryLevel}`
  }

  private async plannedSessionAnnouncement(
    sessionNumber: number,
    date: string,
    actors: Array<{ uuid: string; name: string; userId?: string }>,
    rolls: Map<string, number>,
    mentionUsers = false,
  ): Promise<string> {
    const levels = await this.playerLevels()
    const lines = actors.map((actor) => {
      const count = rolls.get(actor.uuid) ?? 0
      const mention = mentionUsers && actor.userId ? ` (<@${actor.userId}>)` : ''
      return `- **${this.characterLabel(actor.name)}**, ${this.levelLabel(actor.uuid, levels)} : **${count} lancer${count > 1 ? 's' : ''} à faire**${mention}`
    })
    return [
      `**Séance prévue — Résumé n°${sessionNumber}**`,
      'Avec :',
      ...lines,
      `Début de la mission : ${date ? this.displayDate(date) : 'date non renseignée'}`,
    ].join('\n')
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
