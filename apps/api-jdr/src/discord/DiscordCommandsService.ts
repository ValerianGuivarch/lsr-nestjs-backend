import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { resolve } from 'node:path'
import { ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelType, ChatInputCommandInteraction, ModalBuilder, ModalSubmitInteraction, Message, MessageReaction, PartialMessageReaction, PermissionFlagsBits, RESTPostAPIApplicationGuildCommandsJSONBody, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder, UserSelectMenuInteraction } from 'discord.js'
import { FoundryRelayService } from '../foundry/FoundryRelayService'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'
import { PlayerCodexService } from '../pf2-mj/PlayerCodexService'
import { MediaWikiClientService } from '../pf2-mj/MediaWikiClientService'
import { DiscordResumeSync, DiscordService } from './DiscordService'
import { DiscordQuestPilotService } from './DiscordQuestPilotService'
import { Pf2RequestService, RequestStatus } from './Pf2RequestService'
import { pf2DiscordIdForPlayer, pf2MatchesPlayerOrDiscordAlias, pf2PlayerByDiscordId } from './Pf2PlayerIdentity'
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
const PLANNING_UNCERTAIN_EMOJI = '❓'

const RANDOM_CHARACTER_ANCESTRIES = [
  'Androïde', 'Azarketi', 'Distordu', 'Elfe', 'Félide', 'Fétchelin', 'Gnome', 'Gobelin', 'Halfelin', 'Hobgobelin', 'Homme-Lézard',
  'Homme-Rat', 'Humain', 'Kholo', 'Kitsune', 'Kobold', 'Léchi', 'Nain', 'Orc', 'Strix', 'Tengu', 'Tripki',
] as const

const RANDOM_CHARACTER_CLASSES = [
  'Alchimiste', 'Barbare', 'Barde', 'Bretteur', 'Champion', 'Druide', 'Enquêteur', 'Ensorceleur', 'Guerrier',
  'Invocateur', 'Magicien', 'Magus', 'Moine', 'Oracle', 'Prêtre', 'Rôdeur', 'Roublard', 'Sorcier',
] as const

@Injectable()
export class DiscordCommandsService {
  private readonly logger = new Logger(DiscordCommandsService.name)
  private readonly pendingRequests = new Map<string,{ owner:string;title:string;description:string;requesterId:string;requesterName:string;imageUrl?:string }>()
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
  private readonly pendingFactionAssociations = new Map<string, { requesterId: string; playerFactionId: string; mjFactionId: string }>()
  private readonly pendingSchedulePublications = new Map<string, {
    requesterId: string; channelId: string; planningMessageId: string; planningContent: string
    dates: Array<{ key: string; label: string }>
    availability: Map<string, Array<{ id: string; name: string; played: number }>>
    reactions: string
    selectedKeys?: string[]
    solutions?: Array<Array<{ key: string; label: string; players: Array<{ id: string; name: string; played: number }> }>>
    solutionPage?: number
  }>()
  private readonly pendingSessionValidations = new Map<string, { requesterId: string; channelId: string; content: string; userIds: string[]; planningMessageId?: string; planningContent?: string; reactions?: string; planningDates?: string[] }>()
  private readonly pendingManualSessionValidations = new Map<string, {
    requesterId: string
    channelId: string
    planningMonday: string
    selectedDate?: { iso: string; label: string }
  }>()
  private readonly publishingSessionIds = new Set<string>()
  private readonly sessionConfirmationQueues = new Map<string, Promise<void>>()
  private readonly pendingPlanningReminders = new Map<string, { requesterId: string; content: string; userIds: string[] }>()
  private readonly pendingPreviewPublications = new Map<string, { requesterId: string; content: string; files?: string[] }>()
  private readonly pendingPlayerDraws = new Map<string, { requesterId: string; players: Array<{ id: string; name: string }> }>()
  private readonly pendingQuestCompletions = new Map<string, { requesterId: string; threadId: string }>()
  private readonly choiceForumChannelId = process.env['PF2_DISCORD_QUEST_FORUM_CHANNEL_ID']?.trim() || '1536259632455094412'
  constructor(private readonly persistence: Pf2PersistenceService, private readonly foundry: FoundryRelayService, private readonly playerCodex?: PlayerCodexService, private readonly mediaWiki?: MediaWikiClientService, @Inject(forwardRef(() => DiscordService)) private readonly discord?: DiscordService, private readonly journals?: Pf2JournalsService, private readonly requests?: Pf2RequestService, private readonly questPilot?: DiscordQuestPilotService) {}

  definitions(): RESTPostAPIApplicationGuildCommandsJSONBody[] {
    return [
      new SlashCommandBuilder().setName('requete').setDescription('Déposer une requête PF2.')
        .addAttachmentOption(o=>o.setName('image').setDescription('Capture facultative')).toJSON(),
      new SlashCommandBuilder().setName('requete-pour').setDescription('Créer une requête pour un membre Discord.')
        .addUserOption(o=>o.setName('demandeur').setDescription('Auteur réel de la demande').setRequired(true))
        .addAttachmentOption(o=>o.setName('image').setDescription('Capture facultative'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
      ...(['requete-demande','requete-encours','requete-termine'] as const).map(name=>
        new SlashCommandBuilder().setName(name).setDescription('Modifier le statut de la requête dans ce fil.')
          .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON()),
      new SlashCommandBuilder().setName('random-perso').setDescription('Tire au hasard une ascendance, une classe et un genre.').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
      new SlashCommandBuilder().setName('tirage-sort-joueur').setDescription('Tire au sort des personnes parmi une sélection Discord.').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
      new SlashCommandBuilder().setName('help').setDescription('Affiche les commandes PF2 disponibles.').toJSON(),
      new SlashCommandBuilder().setName('nouvelle-quete').setDescription('Créer une quête dans le journal avec une fiche interactive.').toJSON(),
      new SlashCommandBuilder().setName('choix-quete').setDescription('Affiche les quêtes du forum et les joueurs intéressés.').toJSON(),
      new SlashCommandBuilder().setName('terminer-quete').setDescription('Marque comme terminée la quête de ce fil.').toJSON(),
      new SlashCommandBuilder().setName('relancer-quete').setDescription('Relance une quête terminée depuis son fil.').toJSON(),
      new SlashCommandBuilder().setName('help-admin').setDescription('Affiche les commandes PF2 réservées aux administrateurs.').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
      new SlashCommandBuilder().setName('recap-pjs').setDescription('Prévisualise le nombre de séances jouées par joueur et par personnage.').toJSON(),
      new SlashCommandBuilder().setName('recap-seance').setDescription('Prévisualise les informations prévues pour une séance.').addStringOption(option => option.setName('session').setDescription('Numéro de séance').setRequired(true).setAutocomplete(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
      new SlashCommandBuilder().setName('journaux').setDescription('Prépare la révélation d’un journal.').addIntegerOption(option => option.setName('numero').setDescription('Numéro du journal à révéler').setRequired(false).setMinValue(1)).setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
      new SlashCommandBuilder().setName('debut-seance').setDescription('Prépare le début d’une nouvelle séance PF2.').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
      new SlashCommandBuilder().setName('fin-seance').setDescription('Termine une séance et met à jour son résumé.').addIntegerOption(option => option.setName('xp').setDescription('XP gagnée par PJ').setRequired(true).setMinValue(0)).addIntegerOption(option => option.setName('numero').setDescription('Numéro du résumé à terminer')).addStringOption(option => option.setName('fin').setDescription('Date de fin en jeu : YYYY-MM-DD')).addIntegerOption(option => option.setName('jours').setDescription('Durée en jours, à partir du début en jeu').setMinValue(1)).setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
      new SlashCommandBuilder().setName('personnage').setDescription('Présente ou publie un personnage dans le carnet joueur.').addStringOption(option => option.setName('personnage').setDescription('PNJ existant ou nom libre').setRequired(true).setAutocomplete(true)).addAttachmentOption(option => option.setName('portrait').setDescription('Portrait pour un personnage improvisé')).addBooleanOption(option => option.setName('afficher_nom').setDescription('Afficher le nom').setRequired(false)).setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
      new SlashCommandBuilder().setName('faction').setDescription('Prépare la publication d’une faction MJ.').addStringOption(option => option.setName('faction').setDescription('Faction à publier').setRequired(true).setAutocomplete(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
      new SlashCommandBuilder().setName('nouvelle-faction').setDescription('Crée une faction dans le carnet joueur.').addStringOption(option => option.setName('nom').setDescription('Nom connu des joueurs').setRequired(true)).addStringOption(option => option.setName('description').setDescription('Description connue des joueurs').setRequired(false).setMaxLength(2000)).addStringOption(option => option.setName('parente').setDescription('Faction parente côté joueurs').setRequired(false).setAutocomplete(true)).toJSON(),
      new SlashCommandBuilder().setName('associer-faction').setDescription('Associe une faction joueur à une faction MJ.').addStringOption(option => option.setName('faction_joueur').setDescription('Faction joueur non associée').setRequired(true).setAutocomplete(true)).addStringOption(option => option.setName('faction_mj').setDescription('Faction MJ non associée').setRequired(true).setAutocomplete(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
      new SlashCommandBuilder().setName('afficher-personnage').setDescription('Affiche un personnage publié, avec option de partage.').addStringOption(option => option.setName('personnage').setDescription('Personnage publié').setRequired(true).setAutocomplete(true)).toJSON(),
      new SlashCommandBuilder().setName('afficher-faction').setDescription('Affiche une faction publiée, avec option de partage.').addStringOption(option => option.setName('faction').setDescription('Faction publiée').setRequired(true).setAutocomplete(true)).toJSON(),
      new SlashCommandBuilder().setName('rechercher').setDescription('Recherche un personnage ou une faction publiée.').addStringOption(option => option.setName('cible').setDescription('Personnage ou faction').setRequired(true).setAutocomplete(true)).toJSON(),
      new SlashCommandBuilder().setName('wiki').setDescription('Ouvre le wiki avec ton compte déjà connecté.').toJSON(),
      new SlashCommandBuilder()
        .setName('wiki-admin')
        .setDescription('Administre les associations Discord ↔ Wiki.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(command => command.setName('help').setDescription('Liste les commandes d’administration du Wiki.'))
        .addSubcommand(command => command
          .setName('connexion')
          .setDescription('Crée un lien de connexion Wiki comme un membre Discord.')
          .addUserOption(option => option.setName('utilisateur').setDescription('Membre Discord').setRequired(true)))
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
        .addSubcommand(command => command
          .setName('associer-personnage')
          .setDescription('Associe un PJ publié à un membre Discord et à son compte Wiki.')
          .addUserOption(option => option.setName('utilisateur').setDescription('Membre Discord').setRequired(true))
          .addStringOption(option => option.setName('personnage').setDescription('Personnage publié sur le Wiki').setRequired(true).setAutocomplete(true)))
        .addSubcommand(command => command
          .setName('dissocier-personnage')
          .setDescription('Retire un PJ des personnages personnels d’un membre.')
          .addUserOption(option => option.setName('utilisateur').setDescription('Membre Discord').setRequired(true))
          .addStringOption(option => option.setName('personnage').setDescription('Personnage publié sur le Wiki').setRequired(true).setAutocomplete(true)))
        .addSubcommand(command => command.setName('liste-personnages').setDescription('Liste les associations entre membres et PJ.'))
        .toJSON(),
      new SlashCommandBuilder().setName('proposer-date-seance').setDescription('Propose les dates de séance pour la prochaine semaine.').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
      new SlashCommandBuilder().setName('modifier-groupe-seance').setDescription('Ajoute ou retire un joueur du fil de séance.')
        .addUserOption(option => option.setName('ajouter').setDescription('Joueur à ajouter'))
        .addUserOption(option => option.setName('retirer').setDescription('Joueur à retirer'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
      new SlashCommandBuilder().setName('analyse-date-seance').setDescription('Analyse les disponibilités et calcule les groupes possibles.').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
      new SlashCommandBuilder().setName('valider-date-seance').setDescription('Confirme une proposition de groupes publiée dans ce fil.').addIntegerOption(option => option.setName('numero').setDescription('Numéro de proposition à valider').setRequired(true).setMinValue(1)).setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
      new SlashCommandBuilder().setName('valider-date-seance-manuel').setDescription('Valide manuellement une date et 4 joueurs, sans passer par l’analyse.').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
      new SlashCommandBuilder().setName('modifier-date-seance').setDescription('Ajoute ou retire des dates dans une proposition existante.').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
      new SlashCommandBuilder().setName('relancer-date-seance').setDescription('Relance les joueurs sans réponse ou encore indécis sur la planification.').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).toJSON(),
    ]
  }

  async handle(interaction: Pick<ChatInputCommandInteraction, 'commandName' | 'reply' | 'deferReply' | 'editReply'>): Promise<boolean> {
    if (interaction.commandName === 'nouvelle-quete') {
      const command = interaction as ChatInputCommandInteraction
      if (!this.questPilot) throw new Error('Créateur de quêtes indisponible.')
      await this.questPilot.handleCommand(command)
      return true
    }

    if (interaction.commandName === 'requete' || interaction.commandName === 'requete-pour' || interaction.commandName.startsWith('requete-')) {
      await this.requestCommand(interaction as ChatInputCommandInteraction)
      return true
    }
    if (interaction.commandName === 'random-perso') {
      await this.randomCharacterCommand(interaction as ChatInputCommandInteraction)
      return true
    }
    if (interaction.commandName === 'tirage-sort-joueur') {
      await this.playerDrawCommand(interaction as ChatInputCommandInteraction)
      return true
    }
    if (interaction.commandName === 'help') {
      await this.helpCommand(interaction as ChatInputCommandInteraction)
      return true
    }
    if (interaction.commandName === 'choix-quete') {
      await this.choiceCommand(interaction as ChatInputCommandInteraction)
      return true
    }
    if (interaction.commandName === 'terminer-quete') {
      await this.finishQuestCommand(interaction as ChatInputCommandInteraction)
      return true
    }
    if (interaction.commandName === 'relancer-quete') {
      await this.reopenQuestCommand(interaction as ChatInputCommandInteraction)
      return true
    }
    if (interaction.commandName === 'help-admin') {
      await this.helpAdminCommand(interaction as ChatInputCommandInteraction)
      return true
    }
    if (interaction.commandName === 'recap-pjs') {
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
    if (interaction.commandName === 'debut-seance') {
      await this.newGame(interaction as ChatInputCommandInteraction)
      return true
    }
    if (interaction.commandName === 'fin-seance') {
      await this.finishGameCommand(interaction as ChatInputCommandInteraction)
      return true
    }
    if (interaction.commandName === 'resume') { await this.resumeCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'personnage') { await this.presentCharacter(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'faction') { await this.factionCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'nouvelle-faction') { await this.newPlayerFactionCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'associer-faction') { await this.associateFactionCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'afficher-personnage') { await this.displayCharacterCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'afficher-faction') { await this.displayFactionCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'rechercher') { await this.searchPublishedCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'wiki') { await this.wikiCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'wiki-admin') { await this.wikiAdminCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'proposer-date-seance') { await this.planningCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'modifier-groupe-seance') { await this.modifySessionGroupCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'analyse-date-seance') { await this.programmerSeanceCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'valider-date-seance') { await this.validateSessionProposalCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'valider-date-seance-manuel') { await this.manualSessionValidationCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'modifier-date-seance') { await this.modifyPlanningCommand(interaction as ChatInputCommandInteraction); return true }
    if (interaction.commandName === 'relancer-date-seance') { await this.remindPlanningCommand(interaction as ChatInputCommandInteraction); return true }
    return false
  }

  private async helpCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply({
      content: [
        '**Commandes PF2**',
        '`/nouvelle-quete` — crée une quête avec une fiche interactive dans le journal.',
        '`/choix-quete` — liste les quêtes du forum, les réservations par 👍 et signale les doubles choix.',
        '`/terminer-quete` — depuis un fil du journal des quêtes, demande un compte rendu, marque la quête Terminée et libère les réservations 👍.',
        '`/relancer-quete` — depuis un fil terminé, retire le tag Terminée et remet la quête dans `/choix-quete`.',
        '`/recap-pjs` — aperçu du récapitulatif des joueurs/PJ, puis bouton de publication.',
        '`/afficher-personnage` — affiche pour toi un personnage publié, puis permet de le partager.',
        '`/afficher-faction` — affiche pour toi une faction publiée, puis permet de la partager.',
        '`/nouvelle-faction` — crée une faction ou sous-faction dans le carnet des joueurs.',
        '`/rechercher` — recherche au même endroit un personnage ou une faction publiée, puis permet de le/la partager.',
        '`/wiki` — ouvre le Wiki avec ton compte déjà connecté.',
        '`/help` — affiche cette aide.',
      ].join('\n'),
      ephemeral: true,
    })
  }

  private async helpAdminCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.isAdmin(interaction)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }
    await interaction.reply({
      content: [
        '**Commandes PF2 — administration**',
        '`/random-perso` — tire une ascendance, une classe et un genre.',
        '`/tirage-sort-joueur` — sélectionne des personnes puis en tire un nombre au hasard, avec aperçu avant publication.',
        '`/debut-seance` — prépare le début d’une séance.',
        '`/recap-seance` — prévisualise les informations d’une séance, puis permet leur publication.',
        '`/fin-seance` — saisit la fin de séance et les XP.',
        '`/journaux` — prévisualise puis révèle un journal après validation.',
        '`/personnage` — présente un personnage et permet de créer/publier sa fiche.',
        '`/faction` — prévisualise puis publie une faction MJ vers le carnet joueur.',
        '`/associer-faction` — relie une faction du carnet joueur à sa faction MJ sans modifier son nom ni sa hiérarchie.',
        '`/wiki-admin` — gère les associations Discord ↔ Wiki et les PJ.',
        '`/proposer-date-seance` — choisit puis publie les dates proposées pour la prochaine semaine.',
        '`/modifier-date-seance` — modifie les dates depuis le fil de la proposition.',
        '`/relancer-date-seance` — depuis le fil, relance séparément les joueurs sans réponse et ceux encore sur ❓.',
        '`/analyse-date-seance` — analyse les réactions, propose les groupes puis permet leur publication.',
        '`/valider-date-seance numero:2` — valide une proposition et crée directement les fils dans #objectif-prochaine-mission.',
        '`/valider-date-seance-manuel` — crée une séance et son fil de mission en choisissant manuellement la date et 4 joueurs.',
        '`/help-admin` — affiche cette aide.',
      ].join('\n'),
      ephemeral: true,
    })
  }

  /**
   * Ne compare les réservations qu'avec une séance explicitement préparée par le bot.
   * Le message d'origine dans #objectif-prochaine-mission est la source des 4 IDs :
   * pas de déduction à partir des surnoms Discord ni du nom du fil.
   */
  private async missionThreadPlayerIds(interaction: ChatInputCommandInteraction): Promise<Set<string> | null> {
    const thread = interaction.channel
    if (!thread?.isThread() || !/^Séance \d{2}\/\d{2}$/.test(thread.name)) return null

    const parentId = thread.parentId
    if (!parentId) return null
    const parent = await interaction.client.channels.fetch(parentId)
    if (!parent || !('name' in parent) || parent.name !== 'objectif-prochaine-mission') return null

    const starter = await thread.fetchStarterMessage({ force: true }).catch(() => null)
    if (!starter || starter.author.id !== interaction.client.user?.id) return null
    const lines = starter.content.split('\n')
    if (lines.length < 4
      || !/^\*\*Séance du (?:Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche) \d{1,2} \p{L}+ \d{4}\*\*$/u.test(lines[0])
      || !lines[1]?.startsWith('Avec ')
      || !lines.some(line => /^Source : https:\/\/discord\.com\/channels\//.test(line))
    ) return null
    const mentions = [...lines[1].matchAll(/<@!?(\d+)>/g)].map(match => match[1])
    if (mentions.length !== 4 || new Set(mentions).size !== 4) return null
    return new Set(mentions)
  }

  private async questThreadContext(interaction: ChatInputCommandInteraction | ButtonInteraction): Promise<{ thread: any; forum: any; completedTagId: string }> {
    const thread = interaction.channel
    if (!thread?.isThread?.() || thread.parentId !== this.choiceForumChannelId) {
      throw new Error('Cette commande doit être lancée depuis la discussion de la quête dans le journal des quêtes.')
    }
    const forum = await interaction.client.channels.fetch(this.choiceForumChannelId)
    if (!forum || !('availableTags' in forum) || !Array.isArray(forum.availableTags)) throw new Error('Le forum des quêtes est introuvable ou inaccessible.')
    const obsoleteTag = forum.availableTags.find((tag: any) => String(tag.name ?? '').trim().toLocaleLowerCase('fr') === 'obsolète')
    if (obsoleteTag?.id && thread.appliedTags?.includes(obsoleteTag.id)) {
      throw new Error('Cette discussion est obsolète : elle ne peut plus être modifiée comme une quête active.')
    }
    const completedTag = forum.availableTags.find((tag: any) => String(tag.name ?? '').trim().toLocaleLowerCase('fr') === 'terminée')
    if (!completedTag?.id) throw new Error('Le tag « Terminée » est introuvable dans le forum des quêtes.')
    return { thread, forum, completedTagId: completedTag.id }
  }

  private async clearQuestThumbReservations(thread: any): Promise<void> {
    const starter = await thread.fetchStarterMessage({ force: true }).catch(() => null)
    if (!starter) return
    const thumbs = starter.reactions.cache.find((reaction: any) => reaction.emoji.name === '👍')
    if (thumbs) {
      const users = await thumbs.users.fetch().catch(() => new Map())
      for (const user of users.values() as Iterable<any>) {
        if (!user.bot) await thumbs.users.remove(user.id).catch(() => undefined)
      }
    }
    await starter.react('👍').catch(() => undefined)
  }

  private async finishQuestCommand(interaction: ChatInputCommandInteraction | ButtonInteraction): Promise<void> {
    try {
      const { thread, completedTagId } = await this.questThreadContext(interaction)
      if (thread.appliedTags?.includes(completedTagId)) {
        await interaction.reply({ content: 'Cette quête est déjà marquée **Terminée**.', ephemeral: true })
        return
      }

      const modalId = `pf2-quest-finish:${interaction.id}`
      this.pendingQuestCompletions.set(modalId, { requesterId: interaction.user.id, threadId: thread.id })
      const report = new TextInputBuilder()
        .setCustomId('report')
        .setLabel('Compte rendu')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Ex. : Le tueur était X, il a été arrêté, et…')
        .setRequired(true)
        .setMaxLength(1_500)
      const modal = new ModalBuilder()
        .setCustomId(modalId)
        .setTitle('Terminer la quête')
        .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(report))
      await interaction.showModal(modal)
    } catch (error) {
      await interaction.reply({ content: error instanceof Error ? error.message : String(error), ephemeral: true })
    }
  }

  private async reopenQuestCommand(interaction: ChatInputCommandInteraction | ButtonInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true })
    try {
      const { thread, completedTagId } = await this.questThreadContext(interaction)
      if (!thread.appliedTags?.includes(completedTagId)) {
        await interaction.editReply({ content: 'Cette quête n’est pas marquée **Terminée**.' })
        return
      }
      await thread.setAppliedTags((thread.appliedTags ?? []).filter((tagId: string) => tagId !== completedTagId), 'Quête relancée via /relancer-quete')
      const starter = await thread.fetchStarterMessage({ force: true }).catch(() => null)
      if (starter) await starter.react('👍').catch(() => undefined)
      await thread.send({ content: '🔄 **Quête relancée.** Elle réapparaît maintenant dans `/choix-quete`.', allowedMentions: { parse: [] } })
      await this.questPilot?.refreshThreadPanel(thread).catch(error => this.logger.warn(String(error)))
      await interaction.editReply({ content: 'Quête relancée.' })
    } catch (error) {
      await interaction.editReply({ content: `Impossible de relancer la quête : ${error instanceof Error ? error.message : String(error)}` })
    }
  }

  private questTitleEmoji(title: string): string | null {
    const value = title.trimStart()
    const custom = value.match(/^<a?:[A-Za-z0-9_]+:\d+>/)?.[0]
    if (custom) return custom
    const unicode = value.match(/^((?:\p{Regional_Indicator}{2})|(?:[#*0-9]\uFE0F?\u20E3)|(?:\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?)*))/u)?.[0]
    return unicode ?? null
  }

  private async choiceCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply()
    try {
      const missionPlayerIds = await this.missionThreadPlayerIds(interaction)
      const forum = await interaction.client.channels.fetch(this.choiceForumChannelId)
      if (!forum || !('threads' in forum) || !forum.threads) throw new Error('Le forum des quêtes est introuvable ou inaccessible.')

      const discovered = new Map<string, any>()
      const active = await forum.threads.fetchActive()
      for (const thread of active.threads.values()) discovered.set(thread.id, thread)

      let before: Date | undefined
      do {
        const archived = await forum.threads.fetchArchived({ type: 'public', limit: 100, ...(before ? { before } : {}) })
        for (const thread of archived.threads.values()) discovered.set(thread.id, thread)
        const last = archived.threads.last()
        before = last?.archiveTimestamp ? new Date(last.archiveTimestamp) : undefined
        if (!archived.hasMore || !before) break
      } while (before)

      const quests: Array<{ id: string; title: string; emoji: string | null; createdAt: number; url: string | null; users: Array<{ id: string; name: string }> }> = []
      const completedTagId = Array.isArray((forum as any).availableTags)
        ? (forum as any).availableTags.find((tag: any) => String(tag.name ?? '').trim().toLocaleLowerCase('fr') === 'terminée')?.id ?? null
        : null
      const obsoleteTagId = Array.isArray((forum as any).availableTags)
        ? (forum as any).availableTags.find((tag: any) => String(tag.name ?? '').trim().toLocaleLowerCase('fr') === 'obsolète')?.id ?? null
        : null
      const launcherId = await this.persistence.questLauncherId?.()
      const choicesByUser = new Map<string, { name: string; count: number }>()
      const playerNames = new Map((await this.persistence.listPlayerIdentities?.() ?? []).map(identity => [identity.discordUserId, identity.playerName]))

      for (const thread of discovered.values()) {
        if (thread.id === launcherId || (obsoleteTagId && thread.appliedTags?.includes(obsoleteTagId))) continue
        if (completedTagId && thread.appliedTags?.includes(completedTagId)) continue
        const starter = await thread.fetchStarterMessage({ force: true }).catch(() => null)
        const reactions = starter
          ? (typeof starter.reactions.fetch === 'function'
            ? await starter.reactions.fetch().catch(() => starter.reactions.cache)
            : starter.reactions.cache)
          : null
        const thumbs = reactions?.find((reaction: any) => reaction.emoji.name === '👍')
        const users = thumbs
          ? [...(await thumbs.users.fetch()).values()]
              .filter((user: any) => !user.bot)
              .map((user: any) => ({ id: user.id, name: playerNames.get(user.id) ?? pf2PlayerByDiscordId(user.id)?.name ?? `Joueur non associé (${user.id})` }))
              .sort((left, right) => left.name.localeCompare(right.name, 'fr'))
          : []

        for (const user of users) {
          const existing = choicesByUser.get(user.id)
          choicesByUser.set(user.id, { name: user.name, count: (existing?.count ?? 0) + 1 })
        }

        quests.push({
          id: thread.id,
          title: thread.name?.trim() || 'Quête sans titre',
          emoji: this.questTitleEmoji(thread.name?.trim() || ''),
          createdAt: Number(thread.createdTimestamp ?? thread.createdAt?.getTime?.() ?? 0),
          url: typeof thread.url === 'string' ? thread.url : interaction.guildId ? `https://discord.com/channels/${interaction.guildId}/${thread.id}` : null,
          users,
        })
      }

      quests.sort((left, right) => {
        if (missionPlayerIds) {
          const rank = (quest: { users: Array<{ id: string }> }): number => {
            if (!quest.users.length) return 1
            return quest.users.every(user => missionPlayerIds.has(user.id)) ? 0 : 2
          }
          const rankDiff = rank(left) - rank(right)
          if (rankDiff !== 0) return rankDiff
        }
        return left.createdAt - right.createdAt || left.title.localeCompare(right.title, 'fr')
      })

      const missingEmoji = quests.filter(quest => !quest.emoji)
      if (missingEmoji.length) {
        await this.replyLong(interaction, missingEmoji.map(quest =>
          `❌ Émoticône manquante pour la quête : ${quest.url ? `[${quest.title}](${quest.url})` : quest.title}`
        ))
        return
      }

      const lines = quests.length
        ? quests.map(quest => `${quest.url ? `**[${quest.title}](${quest.url})**` : `**${quest.title}**`} : ${quest.users.length
          ? quest.users.map(user => missionPlayerIds
            ? `${user.name} ${missionPlayerIds.has(user.id) ? '✅' : '❌'}`
            : user.name).join(', ')
          : 'Libre'}`)
        : ['Aucune quête trouvée dans le forum.']
      if (missionPlayerIds) {
        lines.unshift('✅ Joueur prévu pour cette séance · ❌ Joueur non prévu', '')
      }

      const alerts = [...choicesByUser.values()]
        .filter(user => user.count > 1)
        .sort((left, right) => left.name.localeCompare(right.name, 'fr'))
        .map(user => `⚠️ **Alerte :** ${user.name} a mis plus d’une réaction.`)

      if (alerts.length) lines.push('', ...alerts)
      const message = await this.replyLong(interaction, lines)
      for (const emoji of [...new Set(quests.map(quest => quest.emoji).filter((value): value is string => Boolean(value)))]) {
        await message?.react?.(emoji).catch(() => undefined)
      }
    } catch (error) {
      await interaction.editReply({ content: `Lecture des choix impossible : ${error instanceof Error ? error.message : String(error)}` })
    }
  }

  private async replyLong(interaction: ChatInputCommandInteraction, lines: string[]): Promise<any> {
    const chunks: string[] = []
    let current = ''
    for (const line of lines) {
      const next = current ? `${current}\n${line}` : line
      if (next.length <= 2_000) {
        current = next
        continue
      }
      if (current) chunks.push(current)
      current = line.length <= 2_000 ? line : `${line.slice(0, 1_999)}…`
    }
    if (current || !chunks.length) chunks.push(current || 'Aucun résultat.')

    const firstMessage = await interaction.editReply({ content: chunks[0], allowedMentions: { parse: [] } })
    for (const chunk of chunks.slice(1)) {
      await interaction.followUp({ content: chunk, allowedMentions: { parse: [] } })
    }
    return firstMessage
  }

  private async randomCharacterCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.isAdmin(interaction)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }

    const ancestry = RANDOM_CHARACTER_ANCESTRIES[Math.floor(Math.random() * RANDOM_CHARACTER_ANCESTRIES.length)]
    const characterClass = RANDOM_CHARACTER_CLASSES[Math.floor(Math.random() * RANDOM_CHARACTER_CLASSES.length)]
    const genderRoll = Math.random()
    const gender = genderRoll < 0.01 ? 'Non binaire' : genderRoll < 0.505 ? 'Homme' : 'Femme'

    await interaction.reply({
      content: [
        '🎲 **Personnage aléatoire**',
        `Ascendance : **${ancestry}**`,
        `Classe : **${characterClass}**`,
        `Genre : **${gender}**`,
      ].join('\n'),
      ephemeral: true,
    })
  }

  private async playerDrawCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.isAdmin(interaction)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }

    const selectId = `pf2-player-draw:players:${interaction.id}`
    this.pendingPlayerDraws.set(selectId, { requesterId: interaction.user.id, players: [] })

    const select = new UserSelectMenuBuilder()
      .setCustomId(selectId)
      .setPlaceholder('Sélectionne les personnes à inclure')
      .setMinValues(1)
      .setMaxValues(25)

    await interaction.reply({
      content: 'Sélectionne les personnes parmi lesquelles faire le tirage au sort.',
      components: [new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(select)],
      ephemeral: true,
    })
  }

  private async journalsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.isAdmin(interaction)) {
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
    if (!this.isAdmin(interaction)) {
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

  private async newPlayerFactionCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true })
    try {
      if (!this.playerCodex || !this.mediaWiki || !this.discord) throw new Error('Le carnet joueur, MediaWiki ou Discord est indisponible.')
      const name = interaction.options.getString('nom', true).trim()
      const description = interaction.options.getString('description')?.trim() ?? ''
      const parentFactionId = interaction.options.getString('parente')?.trim() || null
      const faction = await this.playerCodex.createPlayerFaction({ name, description, parentFactionId, published: false }) as { id: string; name: string; description: string; parentFactionId: string | null; wikiPageTitle: string }
      const parent = faction.parentFactionId ? await this.playerCodex.playerFaction(faction.parentFactionId) as { name: string } : null
      const publication = await this.discord.publishFaction({
        name: faction.name,
        description: faction.description,
        parentName: parent?.name ?? null,
        wikiUrl: this.mediaWiki.pageUrl(faction.wikiPageTitle),
      })
      if (publication.status !== 'sent') throw new Error(publication.reason ?? 'Discord n’a pas confirmé la publication.')
      await this.playerCodex.markPlayerFactionPublished(faction.id)
      await interaction.editReply({ content: `Faction créée dans le carnet joueur : ${this.mediaWiki.pageUrl(faction.wikiPageTitle)}` })
    } catch (error) {
      await interaction.editReply({ content: `Création impossible : ${error instanceof Error ? error.message : String(error)}` })
    }
  }

  private async associateFactionCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.isAdmin(interaction)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }
    await interaction.deferReply({ ephemeral: true })
    try {
      const playerFactionId = interaction.options.getString('faction_joueur', true)
      const mjFactionId = interaction.options.getString('faction_mj', true)
      const player = await this.playerCodex!.playerFaction(playerFactionId) as { name: string; sourceMjFactionId: string | null }
      const mj = (await this.playerCodex!.factionCandidates(false)).find(item => item.id === mjFactionId)
      if (!mj) throw new Error('Faction MJ introuvable.')
      if (player.sourceMjFactionId) throw new Error('Cette faction joueur est déjà associée à une faction MJ.')
      const id = `pf2-faction:associate:${interaction.id}`
      this.pendingFactionAssociations.set(id, { requesterId: interaction.user.id, playerFactionId, mjFactionId })
      const button = new ButtonBuilder().setCustomId(id).setLabel('Associer').setStyle(ButtonStyle.Primary)
      await interaction.editReply({
        content: `Associer la faction joueur **${player.name}** à la faction MJ **${mj.name}** ?\n\nLe nom, le texte et la hiérarchie côté joueurs ne seront pas modifiés.`,
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)],
        allowedMentions: { parse: [] },
      })
    } catch (error) {
      await interaction.editReply({ content: `Association impossible : ${error instanceof Error ? error.message : String(error)}` })
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
          '`/wiki-admin connexion` — crée un lien personnel pour ouvrir le Wiki comme un membre Discord.',
          '`/wiki-admin associer` — associe un membre Discord à un compte MediaWiki existant.',
          '`/wiki-admin liste` — affiche les associations enregistrées.',
          '`/wiki-admin supprimer` — supprime une association.',
          '`/wiki-admin associer-personnage` — associe un PJ publié au membre et le marque comme PJ.',
          '`/wiki-admin dissocier-personnage` — retire ce PJ de la page Mes personnages du membre.',
          '`/wiki-admin liste-personnages` — affiche les associations membre ↔ PJ.',
        ].join('\n'),
        ephemeral: true,
      })
      return
    }

    await interaction.deferReply({ ephemeral: true })
    try {
      if (!this.mediaWiki) throw new Error('MediaWiki est indisponible.')

      if (subcommand === 'connexion') {
        const discordUser = interaction.options.getUser('utilisateur', true)
        const link = await this.persistence.wikiAccountLink(discordUser.id)
        if (!link) throw new Error(`Aucun compte MediaWiki n’est associé à ${discordUser.username ?? discordUser.id}.`)

        const grant = await this.persistence.createWikiLoginGrant(discordUser.id, 180)
        const url = this.mediaWiki.wikiLoginUrl(grant)
        const button = new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setURL(url)
          .setLabel(`Se connecter comme ${link.wikiUsername}`.slice(0, 80))

        await interaction.editReply({
          content: `Connexion préparée pour <@${discordUser.id}> → **${link.wikiUsername}**.\nLien personnel, utilisable une seule fois et valable 3 minutes.`,
          components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)],
          allowedMentions: { parse: [] },
        })
        return
      }

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

      if (subcommand === 'associer-personnage') {
        const discordUser = interaction.options.getUser('utilisateur', true)
        const npcId = interaction.options.getString('personnage', true)
        const assigned = await this.playerCodex!.assignPlayerOwner(discordUser.id, npcId) as { wikiUsername: string; character: { displayName?: string } }
        await interaction.editReply({
          content: `**${assigned.character.displayName ?? npcId}** est maintenant un PJ de <@${discordUser.id}> (Wiki : **${assigned.wikiUsername}**).`,
          allowedMentions: { parse: [] },
        })
        return
      }

      if (subcommand === 'dissocier-personnage') {
        const discordUser = interaction.options.getUser('utilisateur', true)
        const npcId = interaction.options.getString('personnage', true)
        const character = await this.playerCodex!.character(npcId) as { displayName?: string }
        const removed = await this.playerCodex!.removePlayerOwner(discordUser.id, npcId)
        await interaction.editReply({
          content: removed
            ? `**${character.displayName ?? npcId}** a été retiré des personnages personnels de <@${discordUser.id}>.`
            : `Ce personnage n’était pas associé à <@${discordUser.id}>.`,
          allowedMentions: { parse: [] },
        })
        return
      }

      if (subcommand === 'liste-personnages') {
        const assignments = await this.playerCodex!.listPlayerAssignments()
        if (!assignments.length) { await interaction.editReply({ content: 'Aucune association membre ↔ PJ enregistrée.' }); return }
        await interaction.editReply({
          content: assignments.slice(0, 40).map(item => `<@${item.discordUserId}> → **${item.displayName}**${item.wikiUsername ? ` (Wiki : ${item.wikiUsername})` : ''}`).join('\n'),
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
    if (!this.isAdmin(interaction)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }
    const monday = this.nextPlanningMonday()
    const select = new StringSelectMenuBuilder().setCustomId(`pf2-planification:create:${monday}`).setPlaceholder('Choisis les jours proposés').setMinValues(1).setMaxValues(PLANNING_DAYS.length).addOptions(PLANNING_DAYS.map(day => ({ label: `${day.label} ${this.planningDate(this.addDays(monday, day.offset))}`, value: String(day.offset), emoji: day.emoji })))
    await interaction.reply({ content: `Semaine du ${this.planningDate(monday, true)} : sélectionne toutes les dates à proposer.`, components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)], ephemeral: true })
  }

  private async modifyPlanningCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.isAdmin(interaction)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }
    const channel = interaction.channel
    if (!channel?.isThread()) { await interaction.reply({ content: 'Utilise cette commande dans le fil créé depuis le message de planification.', ephemeral: true }); return }
    let starter
    try { starter = await channel.fetchStarterMessage({ force: true }) } catch { starter = null }
    if (!starter) { await interaction.reply({ content: 'Ce fil n’est pas rattaché à un message de planification.', ephemeral: true }); return }
    const parsed = this.parsePlanningMessage(starter.content)
    if (!parsed) { await interaction.reply({ content: 'Le message de départ de ce fil n’est pas une planification reconnue.', ephemeral: true }); return }
    const selected = new Set(parsed.selectedDays)
    const select = new StringSelectMenuBuilder().setCustomId(`pf2-planification:modify:${starter.id}`).setPlaceholder('Dates proposées').setMinValues(0).setMaxValues(PLANNING_DAYS.length).addOptions(PLANNING_DAYS.map(day => ({ label: `${day.label} ${this.planningDate(this.addDays(parsed.monday, day.offset))}`, value: String(day.offset), emoji: day.emoji, default: selected.has(day.offset) })))
    await interaction.reply({ content: 'Coche exactement les dates à conserver. Décoche une date pour la supprimer ; coche-en une nouvelle pour l’ajouter.', components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)], ephemeral: true })
  }

  private async remindPlanningCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.isAdmin(interaction)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }

    const channel = interaction.channel
    if (!channel?.isThread()) {
      await interaction.reply({ content: 'Utilise cette commande dans le fil créé depuis le message de planification.', ephemeral: true })
      return
    }

    let starter
    try { starter = await channel.fetchStarterMessage({ force: true }) } catch { starter = null }
    if (!starter) {
      await interaction.reply({ content: 'Ce fil n’est pas rattaché à un message de planification.', ephemeral: true })
      return
    }

    const parsed = this.parsePlanningMessage(starter.content)
    if (!parsed) {
      await interaction.reply({ content: 'Le message de départ de ce fil n’est pas une planification reconnue.', ephemeral: true })
      return
    }

    await interaction.deferReply({ ephemeral: true })
    try {
      const definiteResponseEmojis = new Set<string>([
        ...PLANNING_DAYS.filter(day => parsed.selectedDays.includes(day.offset)).map(day => day.emoji),
        PLANNING_UNAVAILABLE_EMOJI,
      ])
      const definiteResponders = new Set<string>()
      const uncertainResponders = new Set<string>()

      for (const reaction of starter.reactions.cache.values()) {
        const emoji = reaction.emoji.name ?? ''
        if (!definiteResponseEmojis.has(emoji) && emoji !== PLANNING_UNCERTAIN_EMOJI) continue
        const users = await reaction.users.fetch()
        for (const user of users.values()) {
          if (user.bot) continue
          if (emoji === PLANNING_UNCERTAIN_EMOJI) uncertainResponders.add(user.id)
          else definiteResponders.add(user.id)
        }
      }

      const playerById = new Map<string, string>()
      for (const actorName of (await this.actorNames()).values()) {
        if (!this.isPlayerActorName(actorName)) continue
        const player = this.playerName(actorName)
        const userId = this.discordId(player)
        if (userId && userId !== this.discordId('valerian') && !playerById.has(userId)) playerById.set(userId, player)
      }

      const missing = [...playerById.entries()]
        .filter(([userId]) => !definiteResponders.has(userId) && !uncertainResponders.has(userId))
        .map(([id, name]) => ({ id, name }))
        .sort((left, right) => left.name.localeCompare(right.name, 'fr'))
      const waiting = [...playerById.entries()]
        .filter(([userId]) => !definiteResponders.has(userId) && uncertainResponders.has(userId))
        .map(([id, name]) => ({ id, name }))
        .sort((left, right) => left.name.localeCompare(right.name, 'fr'))

      if (!missing.length && !waiting.length) {
        await interaction.editReply({ content: 'Tout le monde a donné une réponse définitive à cette planification.', components: [] })
        return
      }

      const targets = [...missing, ...waiting]
      const userIds = targets.map(user => user.id)
      const publicLines = ['🔔 **Relance de planification**']
      if (missing.length) publicLines.push(`**Sans réponse :** ${missing.map(user => `<@${user.id}>`).join(' ')}`)
      if (waiting.length) publicLines.push(`❓ **En attente — « Ne sais pas encore » :** ${waiting.map(user => `<@${user.id}>`).join(' ')}`)
      publicLines.push('Merci de répondre ou de mettre à jour votre réaction sur la planification de séance ci-dessus.')
      const content = publicLines.join('\n')
      const buttonId = `pf2-planning-reminder:publish:${interaction.id}`
      this.pendingPlanningReminders.set(buttonId, { requesterId: interaction.user.id, content, userIds })

      const previewLines = [
        `**Relance à publier — ${targets.length} personne${targets.length > 1 ? 's' : ''} à relancer**`,
      ]
      if (missing.length) previewLines.push('', `**Sans réponse (${missing.length})**`, ...missing.map(user => `- <@${user.id}>`))
      if (waiting.length) previewLines.push('', `**En attente — « Ne sais pas encore » (${waiting.length})**`, ...waiting.map(user => `- <@${user.id}>`))
      previewLines.push('', 'Valide pour les mentionner publiquement dans ce fil.')

      await interaction.editReply({
        content: previewLines.join('\n'),
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId(buttonId).setLabel('Valider la relance').setStyle(ButtonStyle.Primary))],
        allowedMentions: { parse: [] },
      })
    } catch (error) {
      await interaction.editReply({ content: `Relance impossible : ${error instanceof Error ? error.message : String(error)}`, components: [] })
    }
  }

  private fullPlanningDateLabel(isoDate: string): string | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
    if (!match) return null
    const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3])
    const date = new Date(Date.UTC(year, month - 1, day, 12))
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
    const offset = (date.getUTCDay() + 6) % 7
    return `${PLANNING_DAYS[offset].label} ${day} ${PLANNING_MONTHS[month - 1]} ${year}`
  }

  private isoDateFromFullPlanningLabel(label: string): string | null {
    const match = /^(Lundi|Mardi|Tercredi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche) (\d{1,2}) (\p{L}+) (\d{4})$/u.exec(label)
    if (!match) return null
    const month = PLANNING_MONTHS.findIndex(candidate => candidate === match[3].toLocaleLowerCase('fr')) + 1
    if (!month) return null
    const iso = `${match[4]}-${String(month).padStart(2, '0')}-${String(Number(match[2])).padStart(2, '0')}`
    const expected = this.fullPlanningDateLabel(iso)
    if (!expected) return null
    const normalized = label.replace(/^Mercredi /, 'Tercredi ')
    return expected === normalized ? iso : null
  }

  private manualSessionPlayerSelection(commandId: string): { content: string; components: Array<ActionRowBuilder<UserSelectMenuBuilder>> } {
    const pending = this.pendingManualSessionValidations.get(commandId)!
    const select = new UserSelectMenuBuilder()
      .setCustomId(`pf2-manual-session:players:${commandId}`)
      .setPlaceholder('Choisis exactement 4 joueurs')
      .setMinValues(4)
      .setMaxValues(4)
    return {
      content: `**Validation manuelle — ${pending.selectedDate?.label ?? 'date inconnue'}**\nChoisis exactement 4 membres Discord.`,
      components: [new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(select)],
    }
  }

  private async manualSessionValidationCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.isAdmin(interaction)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }
    const channel = interaction.channel
    if (!channel?.isThread()) {
      await interaction.reply({ content: 'Utilise cette commande dans le fil de planification concerné.', ephemeral: true })
      return
    }
    const starter = await channel.fetchStarterMessage({ force: true }).catch(() => null)
    const planning = starter && this.parsePlanningMessage(starter.content)
    if (!planning) {
      await interaction.reply({ content: 'Ce fil n’est pas rattaché à une planification reconnue.', ephemeral: true })
      return
    }

    const commandId = interaction.id
    this.pendingManualSessionValidations.set(commandId, {
      requesterId: interaction.user.id,
      channelId: channel.id,
      planningMonday: planning.monday,
    })
    const options: Array<{ label: string; value: string; emoji: string }> = PLANNING_DAYS
      .filter(day => planning.selectedDays.includes(day.offset))
      .map(day => {
        const iso = this.addDays(planning.monday, day.offset)
        return { label: `${day.label} ${this.planningDate(iso)}`, value: iso, emoji: day.emoji }
      })
    options.push({ label: 'Autre date…', value: 'custom', emoji: '📅' })
    const select = new StringSelectMenuBuilder()
      .setCustomId(`pf2-manual-session:date:${commandId}`)
      .setPlaceholder('Choisis la date de la séance')
      .addOptions(options)
    await interaction.reply({
      content: '**Validation manuelle de séance**\nChoisis d’abord la date. Les dates de la planification sont proposées, mais tu peux en saisir une autre.',
      components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
      ephemeral: true,
    })
  }

  private parsePublishedSessionProposals(content: string): Array<Array<{ label: string; players: string[] }>> | null {
    if (!content.startsWith('**Groupes possibles pour la prochaine semaine**')) return null
    const proposals: Array<Array<{ label: string; players: string[] }>> = []
    let groups: Array<{ label: string; players: string[] }> = []
    let currentGroup: { label: string; players: string[] } | null = null
    for (const line of content.split('\n').slice(1)) {
      const proposal = /^\*\*Proposition (\d+)(?: — ex æquo)?\*\*$/.exec(line)
      if (proposal) {
        if (groups.length) proposals.push(groups)
        if (Number(proposal[1]) !== proposals.length + 1) return null
        groups = []
        currentGroup = null
        continue
      }
      const date = /^\*\*((?:Lundi|Mardi|Tercredi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche) \d{1,2} \p{L}+(?: \d{4})?)\*\*$/u.exec(line)
      if (date) {
        if (currentGroup && currentGroup.players.length !== 4) return null
        currentGroup = { label: date[1], players: [] }
        groups.push(currentGroup)
        continue
      }
      const player = /^- (.+) — \d+ séances? jouées?$/.exec(line)
      if (player) {
        if (!currentGroup || currentGroup.players.length >= 4) return null
        currentGroup.players.push(player[1])
        continue
      }
      if (line.includes('**Choisir ')) return null
    }
    if (groups.length) proposals.push(groups)
    if (!proposals.length || proposals.some(option =>
      option.some(group => group.players.length !== 4)
      || new Set(option.flatMap(group => group.players)).size !== option.length * 4
    )) return null
    return proposals
  }

  private async validateSessionProposalCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.isAdmin(interaction)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }
    const channel = interaction.channel
    if (!channel?.isThread()) {
      await interaction.reply({ content: 'Utilise cette commande dans le fil de planification où l’analyse a été publiée.', ephemeral: true })
      return
    }

    await interaction.deferReply({ ephemeral: true })
    try {
      const starter = await channel.fetchStarterMessage({ force: true }).catch(() => null)
      const planning = starter && this.parsePlanningMessage(starter.content)
      if (!starter || !planning) {
        await interaction.editReply({ content: 'Ce fil n’est pas rattaché à une planification reconnue.' })
        return
      }
      const messages = await channel.messages.fetch({ limit: 100 })
      const botId = interaction.client.user?.id
      const analysis = [...messages.values()]
        .filter(message => botId && message.author?.id === botId && message.content.startsWith('**Groupes possibles pour la prochaine semaine**'))
        .sort((a, b) => b.createdTimestamp - a.createdTimestamp)[0]
      if (!analysis) {
        await interaction.editReply({ content: 'Aucune analyse publiée par le bot dans les 100 derniers messages de ce fil. Lance puis publie /analyse-date-seance.' })
        return
      }

      const proposals = this.parsePublishedSessionProposals(analysis.content)
      if (!proposals) {
        await interaction.editReply({ content: 'La dernière analyse ne contient pas de groupes complets numérotés. Relance /analyse-date-seance pour obtenir des propositions explicites.' })
        return
      }
      const number = interaction.options.getInteger('numero', true)
      const selected = proposals[number - 1]
      if (!selected) {
        await interaction.editReply({ content: `Proposition ${number} introuvable. Choisis un numéro entre 1 et ${proposals.length}.` })
        return
      }
      // Les analyses déjà publiées contiennent des noms, pas les identifiants Discord.
      // On retrouve les utilisateurs à partir des réactions aux jours concernés, comme /analyse-date-seance.
      const userIds = new Set<string>()
      const mentionedGroups: Array<{ label: string; players: string[] }> = []
      for (const group of selected) {
        const day = PLANNING_DAYS.find(candidate =>
          planning.selectedDays.includes(candidate.offset)
          && group.label === `${candidate.label} ${this.planningDate(this.addDays(planning.monday, candidate.offset))}`
        )
        if (!day) throw new Error(`La date « ${group.label} » ne correspond pas à la planification du fil.`)
        const reaction = [...starter.reactions.cache.values()].find(item => item.emoji.name === day.emoji)
        if (!reaction) throw new Error(`Réactions introuvables pour ${group.label}. Relance /analyse-date-seance.`)
        const users = await reaction.users.fetch()
        const candidates = await Promise.all([...users.values()].filter(user => !user.bot).map(async user => {
          const member = await interaction.guild?.members?.fetch(user.id).catch(() => null)
          return { user, serverName: member?.displayName?.trim() || null }
        }))
        const players: string[] = []
        for (const name of group.players) {
          // Les nouvelles analyses contiennent des mentions Discord ; les anciennes
          // (noms du compte ou surnoms) restent reconnues sans deviner l'identité.
          const id = /^<@!?(\d+)>$/.exec(name)?.[1]
          const serverMatches = candidates.filter(candidate => candidate.serverName === name)
          const matches = id
            ? candidates.filter(candidate => candidate.user.id === id)
            : serverMatches.length
              ? serverMatches
              : candidates.filter(candidate =>
                candidate.user.globalName?.trim() === name
                || candidate.user.username === name
                || pf2MatchesPlayerOrDiscordAlias(candidate.user.id, name)
              )
          if (matches.length !== 1) {
            throw new Error(`Impossible d’identifier de façon sûre « ${name} » (${group.label}) parmi les réactions. Vérifie les réactions ou relance /analyse-date-seance.`)
          }
          const userId = matches[0].user.id
          if (userIds.has(userId)) throw new Error(`Le membre ${name} figure dans plusieurs groupes. Aucune annonce publiée.`)
          userIds.add(userId)
          players.push(`- <@${userId}>`)
        }
        mentionedGroups.push({ label: group.label, players })
      }
      const content = [
        `✅ **Séances validées — proposition ${number}**`,
        ...mentionedGroups.flatMap(group => ['', `**${group.label}**`, ...group.players]),
        '',
        `Source : ${analysis.url}`,
        '',
        'La confirmation des joueurs sera demandée dans #objectif-prochaine-mission.',
      ].join('\n')
      if (content.length > 2000) throw new Error('L’annonce dépasse la limite de 2 000 caractères de Discord.')
      const confirmationId = interaction.id
      this.pendingSessionValidations.set(confirmationId, {
        requesterId: interaction.user.id,
        channelId: channel.id,
        content,
        userIds: [...userIds],
      })
      const confirm = new ButtonBuilder()
        .setCustomId(`pf2-date-confirm:publish:${confirmationId}`)
        .setLabel('Créer la séance')
        .setStyle(ButtonStyle.Success)
      const cancel = new ButtonBuilder()
        .setCustomId(`pf2-date-confirm:cancel:${confirmationId}`)
        .setLabel('Annuler')
        .setStyle(ButtonStyle.Secondary)
      await interaction.editReply({
        content: `**Aperçu privé — proposition ${number}**\nVérifie les groupes ci-dessous. Une annonce unique par séance sera créée dans #objectif-prochaine-mission après ta confirmation.\n\n${content}`,
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(confirm, cancel)],
        allowedMentions: { parse: [] },
      })
    } catch (error) {
      this.logger.error('valider-date-seance: publication impossible', error instanceof Error ? error.stack : undefined)
      await interaction.editReply({ content: `Validation impossible : ${error instanceof Error ? error.message : String(error)}` })
    }
  }

  private parseConfirmedMissionGroups(content: string): Array<{ label: string; userIds: string[] }> | null {
    if (!/^✅ \*\*Séances validées — (?:proposition \d+|validation manuelle)\*\*/.test(content)) return null
    const groups: Array<{ label: string; userIds: string[] }> = []
    let current: { label: string; userIds: string[] } | null = null
    for (const line of content.split('\n').slice(1)) {
      const date = /^\*\*((?:Lundi|Mardi|Tercredi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche) \d{1,2} \p{L}+(?: \d{4})?)\*\*$/u.exec(line)
      if (date) {
        current = { label: date[1], userIds: [] }
        groups.push(current)
        continue
      }
      const mention = /^- <@!?(\d+)>$/.exec(line)
      if (mention) {
        if (!current) return null
        current.userIds.push(mention[1])
      }
    }
    if (!groups.length || groups.some(group => group.userIds.length !== 4)
      || new Set(groups.flatMap(group => group.userIds)).size !== groups.length * 4) return null
    return groups
  }

  /** Keep the parent announcement as the single, silent source for attendance status. */
  private async updateSessionConfirmationMessage(message: Message): Promise<void> {
    if (message.channel.type !== ChannelType.GuildText || message.channel.name !== 'objectif-prochaine-mission') return
    if (message.author?.id !== message.client.user?.id || !message.content.includes('[PF2-SESSION:')) return
    const line = message.content.split('\n').find(value => value.startsWith('**Groupe proposé :** '))
    if (!line) return
    const ids = [...line.matchAll(/<@!?(\d+)>/g)].map(match => match[1])
    if (!ids.length) return
    const usersFor = async (emoji: string): Promise<Set<string>> => {
      const found = message.reactions.cache.find(reaction => reaction.emoji.name === emoji)
      if (!found) return new Set()
      const users = await found.users.fetch()
      return new Set([...users.values()].filter(user => !user.bot).map(user => user.id))
    }
    const yes = await usersFor('✅')
    const no = await usersFor('❌')
    const confirmed = ids.filter(id => yes.has(id) && !no.has(id)).length
    const declined = ids.filter(id => no.has(id) && !yes.has(id)).length
    const conflicts = ids.filter(id => no.has(id) && yes.has(id)).length
    const waiting = ids.length - confirmed - declined - conflicts
    const state = conflicts ? '⚠️ Réactions contradictoires'
      : declined ? '⚠️ Groupe à compléter'
      : confirmed === ids.length ? '✅ Groupe confirmé'
      : '⏳ Confirmations en attente'
    const status = `**Statut du groupe :** ${confirmed}/${ids.length} ✅ · ${declined} ❌ · ${waiting} ⏳${conflicts ? ` · ${conflicts} ⚠️` : ''} — ${state}`
    const withoutOldStatus = message.content.replace(/^\*\*Statut du groupe :\*\*[^\n]*\n?/m, '')
    const next = withoutOldStatus.replace('**Choisissez également votre prochaine mission**', `${status}\n**Choisissez également votre prochaine mission**`)
    if (next !== message.content) await message.edit({ content: next, allowedMentions: { parse: [] } })
  }

  async handleSessionConfirmationReaction(reaction: MessageReaction | PartialMessageReaction): Promise<void> {
    if (reaction.emoji.name !== '✅' && reaction.emoji.name !== '❌') return
    const messageId = reaction.message.id
    const previous = this.sessionConfirmationQueues.get(messageId) ?? Promise.resolve()
    const task = previous.catch(() => undefined).then(async () => {
      const message = await reaction.message.fetch().catch(() => null)
      if (message) await this.updateSessionConfirmationMessage(message)
    })
    this.sessionConfirmationQueues.set(messageId, task)
    try {
      await task
    } finally {
      if (this.sessionConfirmationQueues.get(messageId) === task) this.sessionConfirmationQueues.delete(messageId)
    }
  }

  private async modifySessionGroupCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.isAdmin(interaction)) {
      await interaction.reply({ content: 'Commande réservée au MJ.', ephemeral: true })
      return
    }
    const channel = interaction.channel
    if (!channel?.isThread() || channel.parent?.name !== 'objectif-prochaine-mission') {
      await interaction.reply({ content: 'À utiliser dans un fil de #objectif-prochaine-mission.', ephemeral: true })
      return
    }
    const add = interaction.options.getUser('ajouter')
    const remove = interaction.options.getUser('retirer')
    if ((!add && !remove) || (add && remove && add.id === remove.id)) {
      await interaction.reply({ content: 'Indique un ajout ou un retrait valide.', ephemeral: true })
      return
    }
    await interaction.deferReply({ ephemeral: true })
    try {
      const starter = await channel.fetchStarterMessage({ force: true })
      if (!starter || starter.author.id !== interaction.client.user?.id || !starter.content.includes('[PF2-SESSION:')) {
        throw new Error('Ce fil ne correspond pas à une annonce de séance du bot.')
      }
      const line = starter.content.split('\n').find(item => item.startsWith('**Groupe proposé :** '))
      if (!line) throw new Error('Groupe introuvable.')
      const ids = [...line.matchAll(/<@!?(\d+)>/g)].map(match => match[1])
      if (remove && !ids.includes(remove.id)) throw new Error('Le joueur à retirer ne fait pas partie du groupe.')
      if (add && ids.includes(add.id)) throw new Error('Ce joueur est déjà dans le groupe.')
      const updated = ids.filter(id => id !== remove?.id)
      if (add) updated.push(add.id)
      if (!updated.length) throw new Error('Le groupe ne peut pas être vide.')
      const replaced = starter.content.replace(line, `**Groupe proposé :** ${updated.map(id => `<@${id}>`).join(', ')}`)
      await starter.edit({ content: replaced, allowedMentions: { parse: [] } })
      await this.updateSessionConfirmationMessage(await starter.fetch()).catch(error =>
        this.logger.warn('Group confirmation status refresh failed: ' + (error instanceof Error ? error.message : String(error))))
      if (add) {
        await channel.send({ content: `<@${add.id}> a été ajouté au groupe. Merci de confirmer ta présence sur l’annonce de séance et de participer au choix de mission.`, allowedMentions: { users: [add.id] } })
      }
      await interaction.editReply({ content: 'Groupe mis à jour dans l’annonce existante, sans renotifier les autres joueurs.' })
    } catch (error) {
      await interaction.editReply({ content: `Modification impossible : ${error instanceof Error ? error.message : String(error)}` })
    }
  }

  private scheduleDateChoiceRow(commandId: string): ActionRowBuilder<StringSelectMenuBuilder> {
    const pending = this.pendingSchedulePublications.get(commandId)!
    const days = pending.dates.filter(day => (pending.availability.get(day.key)?.length ?? 0) >= 4)
    const menu = new StringSelectMenuBuilder().setCustomId(`pf2-schedule:dates:${commandId}`)
      .setPlaceholder('Sélectionner les dates').setMinValues(1).setMaxValues(days.length)
      .addOptions(days.map(day => ({
        label: `${day.label} — ${pending.availability.get(day.key)?.length ?? 0} disponibles`,
        value: day.key, default: pending.selectedKeys?.includes(day.key) ?? false,
      })))
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)
  }

  private scheduleSolutionChoiceView(commandId: string): {
    content: string
    components: Array<ActionRowBuilder<StringSelectMenuBuilder>>
    allowedMentions: { parse: [] }
  } {
    const pending = this.pendingSchedulePublications.get(commandId)!
    const solutions = pending.solutions ?? []
    const page = pending.solutionPage ?? 0
    const begin = page * 3
    const visible = solutions.slice(begin, begin + 3)
    const lines = [
      '**Propositions de groupes — décision MJ privée**',
      `${solutions.length} solution(s) complète(s) optimale(s) conservée(s). Les joueurs moins souvent présents sont prioritaires.`,
      'Tu peux choisir une proposition ou demander un tirage au sort ; aucun tirage n’est effectué automatiquement.',
    ]
    for (const [offset, solution] of visible.entries()) {
      lines.push('', `**Proposition ${begin + offset + 1}**`)
      for (const group of solution) {
        lines.push(`**${group.label}** : ${group.players.map(player => `<@${player.id}> (${player.played})`).join(', ')}`)
      }
    }
    const choices = visible.map((_, offset) => ({
      label: `Choisir la proposition ${begin + offset + 1}`, value: `solution:${begin + offset}`,
    }))
    choices.push({ label: '🎲 Tirer au sort entre les solutions optimales', value: 'random' })
    if (solutions.length > 3) choices.push({ label: 'Voir les autres propositions', value: 'next' })
    choices.push({ label: 'Modifier les dates', value: 'dates' })
    return {
      content: lines.join('\n').slice(0, 2000),
      components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder().setCustomId(`pf2-schedule:solution:${commandId}`)
          .setPlaceholder('Choisir le groupe ou tirer au sort').addOptions(choices),
      )],
      allowedMentions: { parse: [] },
    }
  }

  private async showScheduleFinalPreview(
    interaction: StringSelectMenuInteraction,
    commandId: string,
    chosen: Array<{ key: string; label: string; players: Array<{ id: string; name: string; played: number }> }>,
    selectionLabel: string,
  ): Promise<void> {
    const pending = this.pendingSchedulePublications.get(commandId)!
    const userIds = chosen.flatMap(group => group.players.map(player => player.id))
    const content = [
      '✅ **Séances validées — proposition 1**',
      ...chosen.flatMap(group => ['', `**${group.label}**`, ...group.players.map(player => `- <@${player.id}>`)]),
      '', 'La confirmation des joueurs sera demandée dans #objectif-prochaine-mission.',
    ].join('\n')
    this.pendingSessionValidations.set(commandId, {
      requesterId: pending.requesterId, channelId: pending.channelId, content, userIds,
      planningMessageId: pending.planningMessageId, planningContent: pending.planningContent,
      reactions: pending.reactions, planningDates: pending.dates.map(day => day.key),
    })
    const confirm = new ButtonBuilder().setCustomId(`pf2-date-confirm:publish:${commandId}`)
      .setLabel('Créer les séances').setStyle(ButtonStyle.Success)
    const back = new ButtonBuilder().setCustomId(`pf2-date-confirm:back:${commandId}`)
      .setLabel('Modifier le choix').setStyle(ButtonStyle.Secondary)
    const cancel = new ButtonBuilder().setCustomId(`pf2-date-confirm:cancel:${commandId}`)
      .setLabel('Annuler').setStyle(ButtonStyle.Secondary)
    await interaction.editReply({
      content: ['**Aperçu privé — aucun ping avant confirmation**', selectionLabel, content].join('\n\n'),
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(confirm, back, cancel)],
      allowedMentions: { parse: [] },
    })
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
          const starter = await channel.fetchStarterMessage({ force: true })
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
          .map(user => ({
            id: user.id,
            name: pf2PlayerByDiscordId(user.id)?.name ?? user.globalName?.trim() ?? user.username,
            played: playCounts.get(user.id) ?? 0,
          }))
          .sort((a, b) => a.played - b.played || a.name.localeCompare(b.name, 'fr'))
        availability.set(key, available)
      }

      const proposals = this.bestSessionGroupProposals(days, availability)
      if (!proposals.length) {
        const names = days.flatMap(([key, label]) => [
          `**${label}** : ${availability.get(key)?.length ?? 0} disponible(s)`,
          ...(availability.get(key) ?? []).map(player => `- <@${player.id}> : ${player.played} séance(s) jouée(s)`),
        ])
        await interaction.editReply({
          content: ['**Analyse des disponibilités**', 'Aucun groupe de 4 compatible avec les réponses actuelles.', ...names].join('\n').slice(0, 2000),
          components: [], allowedMentions: { parse: [] },
        })
        return
      }
      const unavailableReaction = [...scheduleMessage.reactions.cache.values()].find(item => item.emoji.name === PLANNING_UNAVAILABLE_EMOJI)
      const unavailableUsers = unavailableReaction ? await unavailableReaction.users.fetch() : null
      const unavailableIds = new Set(unavailableUsers ? [...unavailableUsers.values()].filter(user => !user.bot).map(user => user.id) : [])
      const contradictions = [...new Set([...availability.values()].flat().map(player => player.id).filter(id => unavailableIds.has(id)))]
      if (contradictions.length) {
        await interaction.editReply({
          content: `Disponibilités contradictoires : ${contradictions.map(id => `<@${id}>`).join(', ')} ont répondu à la fois ❌ et un jour disponible. Demande-leur de corriger leurs réactions avant de relancer l'analyse.`,
          components: [], allowedMentions: { parse: [] },
        })
        return
      }
      const reactions = [...availability.entries()].map(([key, players]) => `${key}:${players.map(player => player.id).sort().join(',')}`)
        .concat(`x:${[...unavailableIds].sort().join(',')}`).sort().join('|')
      this.pendingSchedulePublications.set(interaction.id, {
        requesterId: interaction.user.id, channelId: interaction.channelId,
        planningMessageId: scheduleMessage.id, planningContent: scheduleMessage.content,
        dates: days.map(([key, label]) => ({ key, label })), availability, reactions,
      })
      const options = days.filter(([key]) => (availability.get(key)?.length ?? 0) >= 4)
      const menu = new StringSelectMenuBuilder().setCustomId(`pf2-schedule:dates:${interaction.id}`)
        .setPlaceholder('Sélectionner une ou plusieurs séances').setMinValues(1).setMaxValues(options.length)
        .addOptions(options.map(([key, label]) => ({ label: `${label} — ${availability.get(key)?.length ?? 0} disponibles`, value: key })))

      // Conserver l'analyse nominative de l'ancien workflow, avec les scores
      // de priorité et les éventuels groupes ex æquo. Aucun ping dans cet aperçu.
      const detail: string[] = ['**Analyse des disponibilités — groupes et priorités**']
      for (const [key, label] of days) {
        const players = availability.get(key) ?? []
        detail.push('', `**${label} — ${players.length} disponible(s)**`)
        detail.push(...players.map(player => `- <@${player.id}> : ${player.played} séance(s) jouée(s)`))
        if (players.length < 4) detail.push('_Pas assez de joueurs pour constituer un groupe de 4._')
      }
      const compact = this.compactSessionGroupProposals(proposals)
      const result: string[] = ['**Meilleure répartition globale**']
      if (compact) {
        for (const group of compact) {
          result.push('', `**${group.label}**`)
          result.push(...group.fixed.map(player => `- <@${player.id}> (${player.played} séance(s))`))
          if (group.choose) result.push(`- **${group.choose} place(s) parmi ${group.pool.length} candidats ex æquo** : ${group.pool.map(player => `<@${player.id}> (${player.played})`).join(', ')}`)
        }
      } else {
        for (const [index, solution] of proposals.slice(0, 3).entries()) {
          if (proposals.length > 1) result.push('', `**Proposition ${index + 1} — ex æquo**`)
          for (const group of solution) {
            result.push('', `**${group.label}**`, ...group.players.map(player => `- <@${player.id}> (${player.played} séance(s))`))
          }
        }
      }
      const playable = days.filter(([key]) => (availability.get(key)?.length ?? 0) >= 4)
      const conflicts: string[] = []
      for (let a = 0; a < playable.length; a++) for (let b = a + 1; b < playable.length; b++) {
        const [keyA, labelA] = playable[a]
        const [keyB, labelB] = playable[b]
        const distinct = new Set([...(availability.get(keyA) ?? []), ...(availability.get(keyB) ?? [])].map(player => player.id))
        if (distinct.size < 8) {
          const first = new Set((availability.get(keyA) ?? []).map(player => player.id))
          const common = (availability.get(keyB) ?? []).filter(player => first.has(player.id))
          conflicts.push(`${labelA} / ${labelB} : ${common.map(player => `<@${player.id}>`).join(', ')} disponible(s) les deux jours`)
        }
      }
      if (conflicts.length) result.push('', '**Chevauchements de disponibilités :**', ...conflicts.map(value => `- ${value}`))
      result.push('', `${proposals[0].length} séance(s) maximum ; ${proposals.length > 1 ? `${proposals.length} solutions optimales conservées (égalité après priorité)` : 'une répartition optimale'}.`)
      result.push('Sélectionne les dates à organiser ; tu pourras choisir une proposition ou demander un tirage si plusieurs solutions sont équivalentes.')
      const maxText = 2000
      const showDetail = [...detail, '', ...result].join('\n').length <= maxText
      const content = showDetail ? [...detail, '', ...result].join('\n')
        : ['**Analyse globale — groupes optimaux**', ...result].join('\n')
      await interaction.editReply({
        content: content.length <= maxText ? content : content.slice(0, 1900) + '\n… (voir les détails complémentaires ci-dessous)',
        components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)],
        allowedMentions: { parse: [] },
      })
      if (!showDetail) {
        const detailLines = [...detail, '', ...result]
        let chunk = ''
        for (const line of detailLines) {
          if (chunk.length + line.length + 1 > 1900) {
            if (chunk) await interaction.followUp({ content: chunk, ephemeral: true, allowedMentions: { parse: [] } })
            chunk = ''
          }
          if (line.length > 1900) continue
          chunk += (chunk ? '\n' : '') + line
        }
        if (chunk) await interaction.followUp({ content: chunk, ephemeral: true, allowedMentions: { parse: [] } })
      }
    } catch (error) {
      this.logger.error('analyse-date-seance: calcul impossible', error instanceof Error ? error.stack : undefined)
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
    let equalProposalCount = 0

    const saveProposal = (chosen: Group[], score: number): void => {
      const count = chosen.length
      if (count < bestGroupCount || (count === bestGroupCount && score > bestScore)) return
      if (count > bestGroupCount || score < bestScore) {
        bestGroupCount = count
        bestScore = score
        proposals = []
        proposalKeys = new Set<string>()
        equalProposalCount = 0
      }
      if (count === 0) return
      const key = chosen.map(group => `${group.key}:${group.players.map(player => player.id).sort().join(',')}`).join('|')
      if (proposalKeys.has(key)) return
      proposalKeys.add(key)
      equalProposalCount++
      const snapshot = chosen.map(group => ({ ...group, players: [...group.players] }))
      if (proposals.length < 100) proposals.push(snapshot)
      else {
        // Reservoir sampling: even if ties exceed 100, every complete solution
        // has an equal probability of being selected from the retained sample.
        const replacement = Math.floor(Math.random() * equalProposalCount)
        if (replacement < 100) proposals[replacement] = snapshot
      }
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
    await interaction.deferReply({ ephemeral: true })
    const sessions = (await this.persistence.listSessions()).filter((session) => session.published)
    const names = await this.actorNames()
    const characterSessions = new Map<string, number>()
    const playerSessions = new Map<string, Set<number>>()
    const playerLastSessionDate = new Map<string, string>()

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
        if (session.date && (!playerLastSessionDate.get(player) || session.date > playerLastSessionDate.get(player)!)) {
          playerLastSessionDate.set(player, session.date)
        }
      }
    }

    const characters = [...characterSessions.entries()]
      .filter(([, count]) => count > 0)
      .flatMap(([uuid, count]) => {
        const name = names.get(uuid)
        return name ? [{ uuid, name, player: this.playerName(name), count }] : []
      })
    const levels = await this.playerLevels(characters.map(character => character.uuid))

    const players = [...playerSessions.entries()]
      .filter(([, played]) => played.size > 0)
      .sort(([left], [right]) => left.localeCompare(right, 'fr'))

    if (!players.length) {
      await interaction.editReply({ content: 'Aucune séance jouée n’est enregistrée.' })
      return
    }

    const namesByDiscordId = new Map((await this.persistence.listPlayerIdentities?.() ?? []).map(identity => [identity.discordUserId, identity.playerName]))
    const lines = ['**Récap des séances jouées**']
    for (const [player, played] of players) {
      const discordId = this.discordId(player)
      const name = discordId ? namesByDiscordId.get(discordId) ?? pf2PlayerByDiscordId(discordId)?.name ?? player : player
      const lastSessionDate = playerLastSessionDate.get(player)
      lines.push('', `**${name} — ${played.size} séance${played.size > 1 ? 's' : ''}**${discordId ? ` (<@${discordId}>)` : ''}${lastSessionDate ? ` — dernière séance : ${this.displayRealDate(lastSessionDate)}` : ''}`)
      for (const actor of characters.filter((item) => item.player === player).sort((a, b) => a.name.localeCompare(b.name, 'fr'))) {
        lines.push(`- ${this.characterLabel(actor.name)} — ${this.levelLabel(actor.uuid, levels)} — ${actor.count} séance${actor.count > 1 ? 's' : ''}`)
      }
    }
    await this.previewPublicMessage(interaction, lines.join('\n'))
  }

  private async recapSessionCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.isAdmin(interaction)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }
    await interaction.deferReply({ ephemeral: true })
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
    try {
      const names = await this.cachedActorNames()
      const actors = session.participants.flatMap((uuid) => {
        const name = names.get(uuid)
        return name ? [{ uuid, name }] : []
      })
      const rolls = this.progressionRollCounts(actors, sessions, session.sessionNumber)
      const actorsWithIds = actors.map(actor => ({ ...actor, userId: this.discordId(this.playerName(actor.name)) }))
      const content = await this.plannedSessionAnnouncement(session.sessionNumber, session.inGameStartDate, actorsWithIds, rolls, true)
      await this.previewPublicMessage(interaction, content)
    } catch (error) {
      await interaction.editReply({ content: `Récap de séance impossible : ${error instanceof Error ? error.message : String(error)}` })
    }
  }

  private async previewPublicMessage(
    interaction: ChatInputCommandInteraction | ModalSubmitInteraction,
    content: string,
    options: { buttonLabel?: string; files?: string[] } = {},
  ): Promise<void> {
    if (content.length > 2_000) {
      await interaction.editReply({ content: `Le message ferait ${content.length}/2000 caractères et ne peut pas être publié tel quel.` })
      return
    }
    const publishId = `pf2-preview:publish:${interaction.id}`
    const files = options.files?.filter(Boolean)
    this.pendingPreviewPublications.set(publishId, { requesterId: interaction.user.id, content, ...(files?.length ? { files } : {}) })
    const publish = new ButtonBuilder().setCustomId(publishId).setLabel(options.buttonLabel ?? 'Publier').setStyle(ButtonStyle.Primary)
    await interaction.editReply({
      content,
      ...(files?.length ? { files } : {}),
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(publish)],
      allowedMentions: { parse: [] },
    })
  }

  private async displayCharacterCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true })
    try {
      const npcId = interaction.options.getString('personnage', true).trim()
      const profile = await this.playerCodex!.character(npcId) as {
        displayName: string
        shortDescription?: string
        wikiPageTitle: string
        wikiPortraitFilename?: string | null
        published?: boolean
      }
      if (!profile.published) {
        await interaction.editReply({ content: 'Ce personnage n’est pas publié dans le carnet joueur.' })
        return
      }
      const source = await this.playerCodex!.characterCandidate(npcId)
      const portrait = source?.portrait
        ? this.discordPortraitSource(source.portrait)
        : profile.wikiPortraitFilename && this.mediaWiki
          ? this.mediaWiki.fileUrl(profile.wikiPortraitFilename)
          : null
      const content = [
        `**${profile.displayName}**`,
        profile.shortDescription?.trim() || '',
        this.mediaWiki ? `Fiche wiki : ${this.mediaWiki.pageUrl(profile.wikiPageTitle)}` : '',
      ].filter(Boolean).join('\n\n')
      await this.previewPublicMessage(interaction, content, { buttonLabel: 'Partager', ...(portrait ? { files: [portrait] } : {}) })
    } catch (error) {
      await interaction.editReply({ content: `Affichage impossible : ${error instanceof Error ? error.message : String(error)}` })
    }
  }

  private async displayFactionCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true })
    try {
      const faction = await this.playerCodex!.playerFaction(interaction.options.getString('faction', true)) as { name: string; description: string; parentFactionId: string | null; wikiPageTitle: string; published: boolean }
      if (!faction.published) {
        await interaction.editReply({ content: 'Cette faction n’est pas publiée dans le carnet joueur.' })
        return
      }
      const parent = faction.parentFactionId ? await this.playerCodex!.playerFaction(faction.parentFactionId) as { name: string } : null
      const content = [
        `**${faction.name}**`,
        faction.description.trim(),
        parent ? `Sous-faction de **${parent.name}**.` : '',
        this.mediaWiki ? `Fiche wiki : ${this.mediaWiki.pageUrl(faction.wikiPageTitle)}` : '',
      ].filter(Boolean).join('\n\n')
      await this.previewPublicMessage(interaction, content, { buttonLabel: 'Partager' })
    } catch (error) {
      await interaction.editReply({ content: `Affichage impossible : ${error instanceof Error ? error.message : String(error)}` })
    }
  }

  private async searchPublishedCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true })
    const selection = interaction.options.getString('cible', true).trim()
    try {
      if (selection.startsWith('personnage:')) {
        const npcId = selection.slice('personnage:'.length)
        const profile = await this.playerCodex!.character(npcId) as {
          displayName: string
          shortDescription?: string
          wikiPageTitle: string
          wikiPortraitFilename?: string | null
          published?: boolean
        }
        if (!profile.published) {
          await interaction.editReply({ content: 'Ce personnage n’est pas publié dans le carnet joueur.' })
          return
        }
        const source = await this.playerCodex!.characterCandidate(npcId)
        const portrait = source?.portrait
          ? this.discordPortraitSource(source.portrait)
          : profile.wikiPortraitFilename && this.mediaWiki
            ? this.mediaWiki.fileUrl(profile.wikiPortraitFilename)
            : null
        const content = [
          `**${profile.displayName}**`,
          profile.shortDescription?.trim() || '',
          this.mediaWiki ? `Fiche wiki : ${this.mediaWiki.pageUrl(profile.wikiPageTitle)}` : '',
        ].filter(Boolean).join('\n\n')
        await this.previewPublicMessage(interaction, content, { buttonLabel: 'Partager', ...(portrait ? { files: [portrait] } : {}) })
        return
      }

      if (selection.startsWith('faction:')) {
        const faction = await this.playerCodex!.playerFaction(selection.slice('faction:'.length)) as { name: string; description: string; parentFactionId: string | null; wikiPageTitle: string; published: boolean }
        if (!faction.published) {
          await interaction.editReply({ content: 'Cette faction n’est pas publiée dans le carnet joueur.' })
          return
        }
        const parent = faction.parentFactionId ? await this.playerCodex!.playerFaction(faction.parentFactionId) as { name: string } : null
        const content = [
          `**${faction.name}**`,
          faction.description.trim(),
          parent ? `Sous-faction de **${parent.name}**.` : '',
          this.mediaWiki ? `Fiche wiki : ${this.mediaWiki.pageUrl(faction.wikiPageTitle)}` : '',
        ].filter(Boolean).join('\n\n')
        await this.previewPublicMessage(interaction, content, { buttonLabel: 'Partager' })
        return
      }

      await interaction.editReply({ content: 'Sélection invalide. Choisis un personnage ou une faction proposé par la commande.' })
    } catch (error) {
      await interaction.editReply({ content: `Affichage impossible : ${error instanceof Error ? error.message : String(error)}` })
    }
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
    if (interaction.commandName === 'wiki-admin') {
      let subcommand = ''
      try { subcommand = interaction.options.getSubcommand() } catch { subcommand = '' }
      const focused = interaction.options.getFocused(true)
      if ((subcommand === 'associer-personnage' || subcommand === 'dissocier-personnage') && focused.name === 'personnage') {
        const candidates = await this.playerCodex!.profileCandidates(focused.value.toString())
        await interaction.respond(candidates.map(candidate => ({ name: `${candidate.isPlayer ? 'PJ' : 'Personnage'} — ${candidate.name}`.slice(0, 100), value: candidate.id })))
        return true
      }
      await interaction.respond([])
      return true
    }
    if (interaction.commandName === 'rechercher') {
      const focused = interaction.options.getFocused().toString()
      const term = focused.trim().toLocaleLowerCase('fr')
      const [characters, factions] = await Promise.all([
        this.playerCodex!.profileCandidates(focused),
        this.playerCodex!.playerFactionCandidates(true),
      ])
      const options = [
        ...characters.map(candidate => ({
          name: `Personnage — ${candidate.name}`.slice(0, 100),
          value: `personnage:${candidate.id}`,
        })),
        ...factions
          .filter(faction => !term || faction.path.toLocaleLowerCase('fr').includes(term))
          .map(faction => ({
            name: `Faction — ${faction.path}`.slice(0, 100),
            value: `faction:${faction.id}`,
          })),
      ]
        .sort((left, right) => left.name.localeCompare(right.name, 'fr'))
        .slice(0, 25)
      await interaction.respond(options)
      return true
    }
    if (interaction.commandName === 'nouvelle-faction') {
      const focused = interaction.options.getFocused().toString().toLocaleLowerCase()
      const factions = await this.playerCodex!.playerFactionCandidates(true)
      await interaction.respond(factions.filter(faction => faction.path.toLocaleLowerCase().includes(focused)).slice(0, 25).map(faction => ({ name: faction.path.slice(0, 100), value: faction.id })))
      return true
    }
    if (interaction.commandName === 'associer-faction') {
      const focused = interaction.options.getFocused(true)
      const term = focused.value.toString().toLocaleLowerCase()
      if (focused.name === 'faction_joueur') {
        const factions = await this.playerCodex!.playerFactionCandidates(true, true)
        await interaction.respond(factions.filter(faction => faction.path.toLocaleLowerCase().includes(term)).slice(0, 25).map(faction => ({ name: faction.path.slice(0, 100), value: faction.id })))
        return true
      }
      if (focused.name === 'faction_mj') {
        const factions = await this.playerCodex!.factionCandidates(true)
        await interaction.respond(factions.filter(faction => faction.path.toLocaleLowerCase().includes(term)).slice(0, 25).map(faction => ({ name: faction.path.slice(0, 100), value: faction.id })))
        return true
      }
      await interaction.respond([])
      return true
    }
    if (interaction.commandName === 'faction') {
      const focused = interaction.options.getFocused().toString().toLocaleLowerCase()
      const factions = await this.playerCodex!.factionCandidates(false)
      await interaction.respond(factions.filter(faction => faction.path.toLocaleLowerCase().includes(focused)).slice(0, 25).map(faction => ({ name: faction.path.slice(0, 100), value: faction.id })))
      return true
    }
    if (interaction.commandName === 'afficher-faction') {
      const focused = interaction.options.getFocused().toString().toLocaleLowerCase()
      const factions = await this.playerCodex!.playerFactionCandidates(true)
      await interaction.respond(factions.filter(faction => faction.path.toLocaleLowerCase().includes(focused)).slice(0, 25).map(faction => ({ name: faction.path.slice(0, 100), value: faction.id })))
      return true
    }
    if (interaction.commandName === 'afficher-personnage') {
      const focused = interaction.options.getFocused().toString()
      const candidates = await this.playerCodex!.profileCandidates(focused)
      await interaction.respond(candidates.map(candidate => ({ name: candidate.name.slice(0, 100), value: candidate.id })))
      return true
    }
    if (interaction.commandName !== 'personnage') return false
    const focused = interaction.options.getFocused().toString()
    const candidates = await this.playerCodex!.characterCandidates(focused)
    await interaction.respond(candidates.map(candidate => ({ name: candidate.name, value: `npc:${candidate.id}` })))
    return true
  }

  private async presentCharacter(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.isAdmin(interaction)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur. Utilise `/afficher-personnage` pour consulter un personnage publié.', ephemeral: true })
      return
    }
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
        const profile = await this.playerCodex!.character(sourceNpcId) as { published?: boolean }
        buttonLabel = profile.published ? 'Voir la fiche' : 'Publier la fiche'
      } catch {
        // Pas encore de profil joueur.
      }
    }

    const button = new ButtonBuilder()
      .setStyle(ButtonStyle.Primary)
      .setCustomId(`pf2-character:create:${presentation.id}`)
      .setLabel(buttonLabel)

    const discordPortrait = portrait ? this.discordPortraitSource(portrait) : null
    const factions = await this.playerCodex!.playerFactionCandidates(true)
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
    if (interaction.customId.startsWith('pf2-quest-ui:')) return this.questPilot!.handleSelect(interaction)

    if (interaction.customId.startsWith('pf2-manual-session:date:')) {
      const commandId = interaction.customId.slice('pf2-manual-session:date:'.length)
      const pending = this.pendingManualSessionValidations.get(commandId)
      if (!pending) { await interaction.reply({ content: 'Cette validation manuelle a expiré. Relance `/valider-date-seance-manuel`.', ephemeral: true }); return true }
      if (interaction.user.id !== pending.requesterId || interaction.channelId !== pending.channelId) { await interaction.reply({ content: 'Cette validation appartient à un autre administrateur ou à un autre fil.', ephemeral: true }); return true }
      const value = interaction.values[0]
      if (value === 'custom') {
        const modal = new ModalBuilder().setCustomId(`pf2-manual-session:custom-date:${commandId}`).setTitle('Date manuelle de séance')
        const dateInput = new TextInputBuilder().setCustomId('date').setLabel('Date (YYYY-MM-DD)').setStyle(TextInputStyle.Short).setPlaceholder('2026-10-19').setRequired(true)
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput))
        await interaction.showModal(modal)
        return true
      }
      const label = PLANNING_DAYS.map(day => ({ day, iso: this.addDays(pending.planningMonday, day.offset) }))
        .find(item => item.iso === value)?.day
      if (!label) { await interaction.reply({ content: 'Date invalide. Relance la commande.', ephemeral: true }); return true }
      pending.selectedDate = { iso: value, label: `${label.label} ${this.planningDate(value)}` }
      await interaction.update(this.manualSessionPlayerSelection(commandId))
      return true
    }
    if (interaction.customId.startsWith('pf2-schedule:dates:')) {
      const key = interaction.customId.slice('pf2-schedule:dates:'.length)
      const pending = this.pendingSchedulePublications.get(key)
      if (!pending || interaction.user.id !== pending.requesterId || interaction.channelId !== pending.channelId) {
        await interaction.reply({ content: 'Sélection expirée ou non autorisée. Relance /analyse-date-seance.', ephemeral: true })
        return true
      }
      await interaction.deferUpdate()
      try {
        const selected = pending.dates.filter(day => interaction.values.includes(day.key))
        const solutions = this.bestSessionGroupProposals(selected.map(day => [day.key, day.label] as const), pending.availability)
          .filter(groups => groups.length === selected.length)
        if (!solutions.length) {
          await interaction.editReply({
            content: 'Ces dates ne peuvent pas toutes être constituées avec des joueurs distincts. Choisis une autre combinaison.',
            components: [this.scheduleDateChoiceRow(key)], allowedMentions: { parse: [] },
          })
          return true
        }
        pending.selectedKeys = selected.map(day => day.key)
        pending.solutions = solutions
        pending.solutionPage = 0
        if (solutions.length === 1) {
          await this.showScheduleFinalPreview(interaction, key, solutions[0],
            'Une seule solution optimale pour les dates choisies : aucun tirage nécessaire.')
        } else {
          await interaction.editReply(this.scheduleSolutionChoiceView(key))
        }
      } catch (error) {
        this.logger.error('Sélection des dates impossible', error instanceof Error ? error.stack : undefined)
        await interaction.editReply({ content: `Choix impossible : ${error instanceof Error ? error.message : String(error)}. Relance /analyse-date-seance.`, components: [] })
      }
      return true
    }
    if (interaction.customId.startsWith('pf2-schedule:solution:')) {
      const key = interaction.customId.slice('pf2-schedule:solution:'.length)
      const pending = this.pendingSchedulePublications.get(key)
      if (!pending?.solutions?.length || interaction.user.id !== pending.requesterId || interaction.channelId !== pending.channelId) {
        await interaction.reply({ content: 'Choix expiré. Relance /analyse-date-seance.', ephemeral: true })
        return true
      }
      await interaction.deferUpdate()
      const choice = interaction.values[0]
      if (choice === 'dates') {
        await interaction.editReply({
          content: '**Modifier les dates** — les joueurs et leurs priorités restent mémorisés dans cette analyse.',
          components: [this.scheduleDateChoiceRow(key)], allowedMentions: { parse: [] },
        })
        return true
      }
      if (choice === 'next') {
        pending.solutionPage = ((pending.solutionPage ?? 0) + 1) % Math.ceil(pending.solutions.length / 3)
        await interaction.editReply(this.scheduleSolutionChoiceView(key))
        return true
      }
      const random = choice === 'random'
      const index = random ? Math.floor(Math.random() * pending.solutions.length)
        : /^solution:(\d+)$/.exec(choice)?.[1]
      const selectedIndex = typeof index === 'number' ? index : index === undefined ? -1 : Number(index)
      if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= pending.solutions.length) {
        await interaction.editReply({ content: 'Proposition invalide. Recommence la sélection.', ...this.scheduleSolutionChoiceView(key) })
        return true
      }
      await this.showScheduleFinalPreview(interaction, key, pending.solutions[selectedIndex],
        random ? `Tirage demandé par le MJ : proposition ${selectedIndex + 1} parmi ${pending.solutions.length} solutions optimales.`
          : `Proposition ${selectedIndex + 1} choisie manuellement par le MJ, sans tirage.`)
      return true
    }
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
        await message.react(PLANNING_UNCERTAIN_EMOJI)
        let threadCreated = true
        try { await message.startThread({ name: `Planification — semaine du ${this.planningDate(monday)}` }) }
        catch (error) { threadCreated = false; this.logger.warn(`Planification ${message.id} publiée, mais fil impossible : ${error instanceof Error ? error.message : String(error)}`) }
        await interaction.editReply({ content: threadCreated ? 'Planification publiée, réactions ajoutées et fil créé. Utilise `/modifier-date-seance` dans ce fil pour changer les dates.' : 'Planification publiée et réactions ajoutées. Le fil n’a pas pu être créé automatiquement : crée un fil depuis le message pour utiliser `/modifier-date-seance`.', components: [] })
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
      try { starter = await channel.fetchStarterMessage({ force: true }) } catch { starter = null }
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
        if (!starter.reactions.resolve(PLANNING_UNCERTAIN_EMOJI)) await starter.react(PLANNING_UNCERTAIN_EMOJI)
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
    if (!pending) { await interaction.reply({ content: 'Cette préparation a expiré. Relance `/debut-seance`.', ephemeral: true }); return true }
    if (interaction.customId.endsWith(':date')) {
      const plan = pending.plan
      if (!plan) { await interaction.reply({ content: 'Le calcul des dates a expiré. Relance `/debut-seance`.', ephemeral: true }); return true }

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

  async handleUserSelect(interaction: UserSelectMenuInteraction): Promise<boolean> {
    if (interaction.customId.startsWith('pf2-manual-session:players:')) {
      const commandId = interaction.customId.slice('pf2-manual-session:players:'.length)
      const pending = this.pendingManualSessionValidations.get(commandId)
      if (!pending || !pending.selectedDate) { await interaction.reply({ content: 'Cette validation manuelle a expiré. Relance `/valider-date-seance-manuel`.', ephemeral: true }); return true }
      if (interaction.user.id !== pending.requesterId || interaction.channelId !== pending.channelId) { await interaction.reply({ content: 'Cette validation appartient à un autre administrateur ou à un autre fil.', ephemeral: true }); return true }
      const userIds = [...new Set(interaction.values)]
      if (userIds.length !== 4) { await interaction.reply({ content: 'Choisis exactement 4 joueurs.', ephemeral: true }); return true }
      const content = [
        '✅ **Séances validées — validation manuelle**',
        '',
        `**${pending.selectedDate.label}**`,
        ...userIds.map(id => `- <@${id}>`),
        '',
        'Source : validation manuelle',
        '',
        'La confirmation des joueurs sera demandée dans #objectif-prochaine-mission.',
      ].join('\n')
      this.pendingSessionValidations.set(commandId, { requesterId: pending.requesterId, channelId: pending.channelId, content, userIds })
      this.pendingManualSessionValidations.delete(commandId)
      const confirm = new ButtonBuilder().setCustomId(`pf2-date-confirm:publish:${commandId}`).setLabel('Créer les séances dans #objectif-prochaine-mission').setStyle(ButtonStyle.Success)
      const cancel = new ButtonBuilder().setCustomId(`pf2-date-confirm:cancel:${commandId}`).setLabel('Annuler').setStyle(ButtonStyle.Secondary)
      await interaction.update({
        content: `**Aperçu privé — validation manuelle**\nVérifie la date et les 4 joueurs. Une seule annonce sera créée dans #objectif-prochaine-mission après ta confirmation.\n\n${content}`,
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(confirm, cancel)],
        allowedMentions: { parse: [] },
      })
      return true
    }
    if (!interaction.customId.startsWith('pf2-player-draw:players:')) return false

    const pending = this.pendingPlayerDraws.get(interaction.customId)
    if (!pending) {
      await interaction.reply({ content: 'Cette sélection a expiré. Relance `/tirage-sort-joueur`.', ephemeral: true })
      return true
    }
    if (interaction.user.id !== pending.requesterId) {
      await interaction.reply({ content: 'Cette sélection appartient à un autre administrateur.', ephemeral: true })
      return true
    }

    const players = interaction.values.map(id => ({ id, name: `<@${id}>` }))

    const modalId = `pf2-player-draw:count:${interaction.id}`
    this.pendingPlayerDraws.set(modalId, { requesterId: pending.requesterId, players })
    this.pendingPlayerDraws.delete(interaction.customId)

    const modal = new ModalBuilder()
      .setCustomId(modalId)
      .setTitle('Tirage au sort joueur')

    const count = new TextInputBuilder()
      .setCustomId('count')
      .setLabel(`Nombre à tirer (1-${players.length})`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('1')
      .setRequired(true)
      .setMaxLength(String(players.length).length)

    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(count))
    await interaction.showModal(modal)
    return true
  }

  private async requestCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if(!this.requests){await interaction.reply({content:'Module indisponible.',ephemeral:true});return}
    const action=interaction.commandName
    if(action.startsWith('requete-') && action!=='requete-pour') {
      if(!this.isAdmin(interaction)){await interaction.reply({content:'Commande réservée aux administrateurs.',ephemeral:true});return}
      const item=await this.requests.byThread(interaction.channelId)
      if(!item){await interaction.reply({content:'Cette commande doit être exécutée dans le fil d’une requête.',ephemeral:true});return}
      const status:RequestStatus=action==='requete-encours'?'in_progress':action==='requete-termine'?'done':'requested'
      await interaction.deferReply({ephemeral:true})
      await this.requests.change(interaction.client,item.id,status)
      await interaction.editReply('État mis à jour.')
      return
    }
    if(interaction.channelId!=='1554492543654436875'){await interaction.reply({content:'Utilise cette commande dans #bot-et-app.',ephemeral:true});return}
    const user=action==='requete-pour'?interaction.options.getUser('demandeur'):null
    if(action==='requete-pour' && !this.isAdmin(interaction)){await interaction.reply({content:'Commande réservée aux administrateurs.',ephemeral:true});return}
    if(user && !this.isAdmin(interaction)){await interaction.reply({content:'Seul un administrateur peut choisir le demandeur.',ephemeral:true});return}
    const requester=user||interaction.user
    const member=user?await interaction.guild?.members.fetch(user.id).catch(()=>null):interaction.member
    const name=(member && 'displayName' in member ? member.displayName:null)||requester.globalName||requester.username
    const attachment=interaction.options.getAttachment('image')
    if(attachment && !attachment.contentType?.startsWith('image/')){await interaction.reply({content:'La pièce jointe doit être une image.',ephemeral:true});return}
    this.pendingRequests.set(interaction.id,{owner:interaction.user.id,title:'',description:'',requesterId:requester.id,requesterName:name,imageUrl:attachment?.url})
    const modal=new ModalBuilder().setCustomId('pf2-request:form:'+interaction.id).setTitle('Nouvelle requête PF2')
      .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('subject').setLabel('Sujet').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(150)),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('details').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1600)))
    await interaction.showModal(modal)
  }

  async handleModal(interaction: ModalSubmitInteraction): Promise<boolean> {
    if (interaction.customId.startsWith('pf2-quest-ui:')) return this.questPilot!.handleModal(interaction)

    if(interaction.customId.startsWith('pf2-request:form:')) {
      const isAdmin=this.isAdmin(interaction as unknown as ChatInputCommandInteraction)
      const userId=interaction.customId.slice('pf2-request:form:'.length)
      const draft=this.pendingRequests.get(userId)
      if(!draft || interaction.user.id!==draft.owner) {await interaction.reply({content:'Formulaire expiré.',ephemeral:true});return true}
      draft.title=interaction.fields.getTextInputValue('subject').trim()
      draft.description=interaction.fields.getTextInputValue('details').trim()
      if(!draft.title || !draft.description){await interaction.reply({content:'Sujet et description obligatoires.',ephemeral:true});return true}
      if(!isAdmin && draft.requesterId!==interaction.user.id) draft.requesterId=interaction.user.id
      await interaction.reply({content:`**Prévisualisation**\nDemande de <@${draft.requesterId}>\n**${draft.title}**\n${draft.description}`,ephemeral:true,allowedMentions:{parse:[]},
        components:[new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('pf2-request:publish:'+userId).setLabel('Publier').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('pf2-request:cancel:'+userId).setLabel('Annuler').setStyle(ButtonStyle.Secondary))]})
      return true
    }

    if (interaction.customId.startsWith('pf2-manual-session:custom-date:')) {
      const commandId = interaction.customId.slice('pf2-manual-session:custom-date:'.length)
      const pending = this.pendingManualSessionValidations.get(commandId)
      if (!pending) { await interaction.reply({ content: 'Cette validation manuelle a expiré. Relance `/valider-date-seance-manuel`.', ephemeral: true }); return true }
      if (interaction.user.id !== pending.requesterId || interaction.channelId !== pending.channelId) { await interaction.reply({ content: 'Cette validation appartient à un autre administrateur ou à un autre fil.', ephemeral: true }); return true }
      const iso = interaction.fields.getTextInputValue('date').trim()
      const label = this.fullPlanningDateLabel(iso)
      if (!label) { await interaction.reply({ content: 'Date invalide. Utilise le format YYYY-MM-DD.', ephemeral: true }); return true }
      pending.selectedDate = { iso, label }
      await interaction.reply({ ...this.manualSessionPlayerSelection(commandId), ephemeral: true })
      return true
    }
    if (interaction.customId.startsWith('pf2-quest-finish:')) {
      const pending = this.pendingQuestCompletions.get(interaction.customId)
      if (!pending) {
        await interaction.reply({ content: 'Cette validation a expiré. Relance `/terminer-quete`.', ephemeral: true })
        return true
      }
      if (interaction.user.id !== pending.requesterId || interaction.channelId !== pending.threadId) {
        await interaction.reply({ content: 'Cette validation appartient à un autre utilisateur ou à une autre quête.', ephemeral: true })
        return true
      }

      const report = interaction.fields.getTextInputValue('report').trim()
      if (!report) {
        await interaction.reply({ content: 'Le compte rendu ne peut pas être vide.', ephemeral: true })
        return true
      }

      await interaction.deferReply({ ephemeral: true })
      try {
        const thread = interaction.channel as any
        const forum = await interaction.client.channels.fetch(this.choiceForumChannelId)
        const completedTag = forum && 'availableTags' in forum && Array.isArray((forum as any).availableTags)
          ? (forum as any).availableTags.find((tag: any) => String(tag.name ?? '').trim().toLocaleLowerCase('fr') === 'terminée')
          : null
        if (!completedTag?.id) throw new Error('Le tag « Terminée » est introuvable dans le forum des quêtes.')
        await thread.setAppliedTags([...new Set([...(thread.appliedTags ?? []), completedTag.id])], 'Quête terminée via /terminer-quete')
        await this.clearQuestThumbReservations(thread)
        await thread.send({
          content: `✅ **Quête terminée. Merci d’avoir participé.**\n\n**Compte rendu :**\n${report}\n\nVous pouvez la relancer avec \`/relancer-quete\`.`,
          allowedMentions: { parse: [] },
        })
        this.pendingQuestCompletions.delete(interaction.customId)
        await this.questPilot?.refreshThreadPanel(thread).catch(error => this.logger.warn(String(error)))
        await interaction.editReply({ content: 'Quête terminée et compte rendu publié.' })
      } catch (error) {
        await interaction.editReply({ content: `Impossible de terminer la quête : ${error instanceof Error ? error.message : String(error)}` })
      }
      return true
    }
    if (interaction.customId.startsWith('pf2-player-draw:count:')) {
      const pending = this.pendingPlayerDraws.get(interaction.customId)
      if (!pending) {
        await interaction.reply({ content: 'Ce tirage a expiré. Relance `/tirage-sort-joueur`.', ephemeral: true })
        return true
      }
      if (interaction.user.id !== pending.requesterId) {
        await interaction.reply({ content: 'Ce tirage appartient à un autre administrateur.', ephemeral: true })
        return true
      }

      const count = Number(interaction.fields.getTextInputValue('count').trim())
      if (!Number.isInteger(count) || count < 1 || count > pending.players.length) {
        this.pendingPlayerDraws.delete(interaction.customId)
        await interaction.reply({
          content: `Le nombre doit être un entier entre 1 et ${pending.players.length}.`,
          ephemeral: true,
        })
        return true
      }

      const pool = [...pending.players]
      const selected: Array<{ id: string; name: string }> = []
      while (selected.length < count) {
        const index = Math.floor(Math.random() * pool.length)
        selected.push(pool.splice(index, 1)[0])
      }

      const content = [
        '🎲 **Tirage au sort joueur**',
        `Parmi : ${pending.players.map(player => player.name).join(', ')}`,
        '',
        '**Liste des tirages au sort :**',
        ...selected.map(player => `- ${player.name}`),
      ].join('\n')

      this.pendingPlayerDraws.delete(interaction.customId)
      await interaction.deferReply({ ephemeral: true })
      await this.previewPublicMessage(interaction, content)
      return true
    }
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
        let current: { wikiPortraitFilename?: string | null; published?: boolean } | null = null
        if (presentation.sourceNpcId) {
          try { current = await this.playerCodex!.character(presentation.sourceNpcId) as { wikiPortraitFilename?: string | null; published?: boolean } } catch { current = null }
        }
        const portrait = current?.wikiPortraitFilename ?? (presentation.portraitUrl ? await this.mediaWiki!.uploadFromUrl(presentation.portraitUrl, name) : null)
        if (!(await this.mediaWiki!.pageExists(title))) await this.mediaWiki!.createPage(title, '<!-- Fiche personnage : contenu détaillé à compléter ici. -->')
        const profile = await this.playerCodex!.ensurePresentationCharacter(presentationId, name, title, description) as { npcId: string; wikiPageTitle: string; created: boolean; newlyPublished?: boolean }
        if (portrait) await this.playerCodex!.updateCharacter(profile.npcId, { wikiPortraitFilename: portrait })
        const selectedFaction = this.pendingCharacterFactions.get(presentationId)?.factionId
        if (selectedFaction) await this.playerCodex!.addCharacterFaction(profile.npcId, selectedFaction)
        this.pendingCharacterFactions.delete(presentationId)
        const pageUrl = this.mediaWiki!.pageUrl(profile.wikiPageTitle)
        if (profile.created || profile.newlyPublished) {
          const publication = await this.discord?.publishCharacterIntroduction({
            name,
            portraitUrl: presentation.portraitUrl,
            description,
            wikiUrl: pageUrl,
          })
          if (publication?.status === 'failed') this.logger.warn(`Fiche publiée, mais publication Discord impossible : ${publication.reason}`)
        }
        await interaction.editReply({ content: profile.created ? `Fiche créée : ${pageUrl}` : profile.newlyPublished ? `Fiche publiée : ${pageUrl}` : `Cette fiche existe déjà : ${pageUrl}`, allowedMentions: { parse: [] } })
      } catch (error) { await interaction.editReply({ content: error instanceof Error ? `Création impossible : ${error.message}` : 'Création impossible.' }) }
      return true
    }
    if (!interaction.customId.startsWith('pf2-new-game:')) return false
    const pending = this.pendingGames.get(interaction.customId)
    if (!pending) { await interaction.reply({ content: 'Cette préparation a expiré. Relance `/debut-seance`.', ephemeral: true }); return true }
    const plan = pending.plan
    if (!plan) { await interaction.reply({ content: 'Le calcul des dates a expiré. Relance `/debut-seance`.', ephemeral: true }); return true }

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
      await interaction.reply({ content: 'La date de base est introuvable. Relance `/debut-seance`.', ephemeral: true })
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
    if (interaction.customId.startsWith('pf2-quest-ui:finish:')) {
      await this.finishQuestCommand(interaction)
      return true
    }
    if (interaction.customId.startsWith('pf2-quest-ui:reopen:')) {
      await this.reopenQuestCommand(interaction)
      return true
    }
    if (interaction.customId.startsWith('pf2-quest-ui:')) return this.questPilot!.handleButton(interaction)

    if(interaction.customId.startsWith('pf2-request:')) {
      const parts=interaction.customId.split(':')
      const draft=this.pendingRequests.get(parts[2])
      if(!draft || draft.owner!==interaction.user.id){await interaction.reply({content:'Confirmation expirée.',ephemeral:true});return true}
      this.pendingRequests.delete(parts[2])
      if(parts[1]==='cancel'){await interaction.update({content:'Publication annulée.',components:[]});return true}
      await interaction.deferUpdate()
      try {
        const created=await this.requests!.create(interaction.client,{...draft,createdBy:draft.owner})
        await interaction.editReply({content:`Requête #${created.id} publiée : https://discord.com/channels/${interaction.guildId}/${created.thread_id}`,components:[]})
      } catch(e){await interaction.editReply({content:'Échec de publication : '+(e instanceof Error?e.message:'erreur'),components:[]})}
      return true
    }

    if (interaction.customId.startsWith('pf2-date-confirm:')) {
      const [prefix, action, id] = interaction.customId.split(':')
      const pending = this.pendingSessionValidations.get(id)
      if (!pending) {
        await interaction.reply({ content: 'Cette confirmation a expiré. Relance `/analyse-date-seance` (ou `/valider-date-seance-manuel`).', ephemeral: true })
        return true
      }
      if (interaction.user.id !== pending.requesterId || interaction.channelId !== pending.channelId) {
        await interaction.reply({ content: 'Cette confirmation appartient à un autre administrateur ou à un autre fil.', ephemeral: true })
        return true
      }
      if (prefix !== 'pf2-date-confirm' || !['publish', 'cancel', 'back'].includes(action)) return false
      if (action === 'cancel') {
        this.pendingSessionValidations.delete(id)
        this.pendingSchedulePublications.delete(id)
        await interaction.update({ content: 'Validation annulée. Aucun message publié et aucun joueur notifié.', components: [], allowedMentions: { parse: [] } })
        return true
      }
      if (action === 'back') {
        const schedule = this.pendingSchedulePublications.get(id)
        this.pendingSessionValidations.delete(id)
        if (!schedule) {
          await interaction.update({ content: 'Ce choix ne peut plus être modifié. Relance /analyse-date-seance.', components: [] })
          return true
        }
        await interaction.update(schedule.solutions && schedule.solutions.length > 1
          ? this.scheduleSolutionChoiceView(id)
          : { content: '**Modifier les dates**', components: [this.scheduleDateChoiceRow(id)], allowedMentions: { parse: [] } })
        return true
      }
      if (this.publishingSessionIds.has(id)) {
        await interaction.reply({ content: 'Publication déjà en cours. Ne clique pas une seconde fois.', ephemeral: true })
        return true
      }
      this.publishingSessionIds.add(id)
      // Discord requires the component to be acknowledged within 3 seconds.
      // Reading live reactions and creating threads must happen AFTER this.
      try {
        await interaction.deferUpdate()
      } catch (error) {
        this.publishingSessionIds.delete(id)
        throw error
      }
      const retry = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`pf2-date-confirm:publish:${id}`).setLabel('Réessayer la publication').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`pf2-date-confirm:cancel:${id}`).setLabel('Annuler').setStyle(ButtonStyle.Secondary),
      )
      try {
      if (pending.planningMessageId && pending.planningContent && pending.reactions && pending.planningDates) {
        const channel = interaction.channel
        if (!channel || !('messages' in channel)) {
          await interaction.editReply({ content: 'Impossible de vérifier la planification ; relance /analyse-date-seance.', components: [] })
          return true
        }
        const starter = channel.isThread()
          ? await channel.fetchStarterMessage({ force: true }).catch(() => null)
          : await channel.messages.fetch(pending.planningMessageId).catch(() => null)
        if (!starter || starter.id !== pending.planningMessageId || starter.content !== pending.planningContent) {
          await interaction.editReply({ content: 'Les dates ont changé. Relance /analyse-date-seance.', components: [] })
          return true
        }
        const refreshed: string[] = []
        for (const day of PLANNING_DAYS) {
          if (!pending.planningDates.includes(String(day.offset))) continue
          const reaction = starter.reactions.cache.find(item => item.emoji.name === day.emoji)
          const users = reaction ? await reaction.users.fetch() : null
          refreshed.push(`${day.offset}:${users ? [...users.values()].filter(user => !user.bot && user.id !== this.discordId('valerian')).map(user => user.id).sort().join(',') : ''}`)
        }
        const unavailable = starter.reactions.cache.find(item => item.emoji.name === PLANNING_UNAVAILABLE_EMOJI)
        const unavailableUsers = unavailable ? await unavailable.users.fetch() : null
        refreshed.push(`x:${unavailableUsers ? [...unavailableUsers.values()].filter(user => !user.bot).map(user => user.id).sort().join(',') : ''}`)
        if (refreshed.sort().join('|') !== pending.reactions) {
          await interaction.editReply({ content: 'Les disponibilités ont changé depuis l’analyse. Relance /analyse-date-seance.', components: [] })
          return true
        }
      }
      await interaction.editReply({ content: 'Disponibilités vérifiées. Création des annonces de mission…', components: [], allowedMentions: { parse: [] } })
      try {
        const groups = this.parseConfirmedMissionGroups(pending.content)
        if (!groups) throw new Error('Les groupes de la validation sont invalides.')
        const channelList = await interaction.guild?.channels.fetch()
        const target = channelList && [...channelList.values()].find(item =>
          item?.type === ChannelType.GuildText && item.name === 'objectif-prochaine-mission'
        )
        if (!target || target.type !== ChannelType.GuildText) throw new Error('Salon #objectif-prochaine-mission introuvable.')
        const published: string[] = []
        const failures: string[] = []
        for (const group of groups) {
          let date = this.isoDateFromFullPlanningLabel(group.label)
          if (!date && interaction.channel?.isThread()) {
            const starter = await interaction.channel.fetchStarterMessage({ force: true }).catch(() => null)
            const planning = starter && this.parsePlanningMessage(starter.content)
            if (planning) {
              const matching = PLANNING_DAYS.find(day =>
                planning.selectedDays.includes(day.offset)
                && group.label === `${day.label} ${this.planningDate(this.addDays(planning.monday, day.offset))}`
              )
              if (matching) date = this.addDays(planning.monday, matching.offset)
            }
          }
          if (!date) {
            failures.push(`${group.label} : date non reconnue`)
            continue
          }
          const title = `Séance ${date.slice(8, 10)}/${date.slice(5, 7)}`
          const key = `[PF2-SESSION:${date}]`
          const content = [
            `**Séance du ${group.label}**`,
            `**Groupe proposé :** ${group.userIds.map(userId => `<@${userId}>`).join(', ')}`,
            '',
            '**Merci de confirmer votre présence :** ✅ présent · ❌ indisponible.',
            '**Choisissez également votre prochaine mission** dans le fil ci-dessous.',
            'La commande `/choix-quete` permet de consulter les quêtes disponibles.',
            '',
            key,
          ].join('\n')
          try {
            const recent = await target.messages.fetch({ limit: 100 })
            let announcement = [...recent.values()].find(message => message.author?.id === interaction.client.user?.id && message.content.includes(key))
            if (!announcement) {
              announcement = await target.send({ content, allowedMentions: { parse: [], users: group.userIds } })
              await announcement.react('✅').catch(() => undefined)
              await announcement.react('❌').catch(() => undefined)
            }
            const existingThread = announcement.thread
            const thread = existingThread ?? await announcement.startThread({ name: title })
            const messages = await thread.messages.fetch({ limit: 20 })
            if (![...messages.values()].some(message => message.author?.id === interaction.client.user?.id && message.content.startsWith('**Que voulez-vous faire ?**'))) {
              await thread.send({
                content: '**Que voulez-vous faire ?**\nDiscutez de la prochaine mission ici. Utilisez `/choix-quete` pour voir les quêtes disponibles et leurs réservations.',
                allowedMentions: { parse: [] },
              })
            }
            await this.updateSessionConfirmationMessage(announcement).catch(error =>
              this.logger.warn('Initial session confirmation status failed: ' + (error instanceof Error ? error.message : String(error))))
            published.push(`${group.label} : ${thread.url}`)
          } catch (error) {
            failures.push(`${group.label} : ${error instanceof Error ? error.message : String(error)}`)
          }
        }
        const report = [
          published.length ? `**Séances créées :**\n${published.join('\n')}` : 'Aucune séance créée.',
          failures.length ? `**À vérifier :**\n${failures.join('\n')}` : '',
        ].filter(Boolean).join('\n\n')
        if (failures.length) {
          await interaction.editReply({
            content: `**Publication partielle : une reprise est possible sans renotifier les séances déjà créées.**\n\n${report}`,
            components: [retry], allowedMentions: { parse: [] },
          })
        } else {
          this.pendingSessionValidations.delete(id)
          this.pendingSchedulePublications.delete(id)
          await interaction.editReply({ content: report, components: [], allowedMentions: { parse: [] } })
        }
      } catch (error) {
        await interaction.editReply({
          content: `Publication impossible : ${error instanceof Error ? error.message : String(error)}. Tu peux réessayer sans recréer les annonces déjà publiées.`,
          components: [retry], allowedMentions: { parse: [] },
        }).catch(() => undefined)
      }
      } catch (error) {
        this.logger.error('Validation de séance : vérification impossible', error instanceof Error ? error.stack : undefined)
        await interaction.editReply({
          content: `Vérification impossible : ${error instanceof Error ? error.message : String(error)}. Réessaie ou relance l’analyse.`,
          components: [retry], allowedMentions: { parse: [] },
        }).catch(() => undefined)
      } finally {
        this.publishingSessionIds.delete(id)
      }
      return true
    }
    if (interaction.customId.startsWith('pf2-preview:publish:')) {
      const pending = this.pendingPreviewPublications.get(interaction.customId)
      if (!pending) { await interaction.reply({ content: 'Cette prévisualisation a expiré. Relance la commande.', ephemeral: true }); return true }
      if (interaction.user.id !== pending.requesterId) { await interaction.reply({ content: 'Cette validation appartient à un autre utilisateur.', ephemeral: true }); return true }
      try {
        await interaction.update({ components: [] })
        await interaction.followUp({
          content: pending.content,
          ...(pending.files?.length ? { files: pending.files } : {}),
          ephemeral: false,
          allowedMentions: { parse: [] },
        })
        this.pendingPreviewPublications.delete(interaction.customId)
      } catch (error) {
        await interaction.followUp({ content: `Publication impossible : ${error instanceof Error ? error.message : String(error)}`, ephemeral: true }).catch(() => undefined)
      }
      return true
    }
    if (interaction.customId.startsWith('pf2-planning-reminder:publish:')) {
      const pending = this.pendingPlanningReminders.get(interaction.customId)
      if (!pending) { await interaction.reply({ content: 'Cette relance a expiré. Relance `/relancer-date-seance`.', ephemeral: true }); return true }
      if (interaction.user.id !== pending.requesterId) { await interaction.reply({ content: 'Cette validation appartient à un autre administrateur.', ephemeral: true }); return true }
      try {
        await interaction.update({ components: [] })
        await interaction.followUp({ content: pending.content, ephemeral: false, allowedMentions: { users: pending.userIds } })
        this.pendingPlanningReminders.delete(interaction.customId)
      } catch (error) {
        await interaction.followUp({ content: `Relance impossible : ${error instanceof Error ? error.message : String(error)}`, ephemeral: true }).catch(() => undefined)
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

    if (interaction.customId.startsWith('pf2-faction:associate:')) {
      const pending = this.pendingFactionAssociations.get(interaction.customId)
      if (!pending) { await interaction.reply({ content: 'Cette association a expiré. Relance `/associer-faction`.', ephemeral: true }); return true }
      if (interaction.user.id !== pending.requesterId) { await interaction.reply({ content: 'Cette validation appartient à un autre administrateur.', ephemeral: true }); return true }
      await interaction.deferReply({ ephemeral: true })
      try {
        const faction = await this.playerCodex!.associateFaction(pending.playerFactionId, pending.mjFactionId) as { name: string; wikiPageTitle: string }
        this.pendingFactionAssociations.delete(interaction.customId)
        await interaction.editReply({ content: `Association enregistrée : **${faction.name}** ↔ faction MJ.\n${this.mediaWiki!.pageUrl(faction.wikiPageTitle)}`, components: [] })
      } catch (error) {
        await interaction.editReply({ content: `Association impossible : ${error instanceof Error ? error.message : String(error)}`, components: [] })
      }
      return true
    }

    if (interaction.customId.startsWith('pf2-faction:publish:')) {
      const pending = this.pendingFactionPublications.get(interaction.customId)
      if (!pending) { await interaction.reply({ content: 'Cette prévisualisation a expiré. Relance `/faction`.', ephemeral: true }); return true }
      if (interaction.user.id !== pending.requesterId) { await interaction.reply({ content: 'Cette validation appartient à un autre administrateur.', ephemeral: true }); return true }
      await interaction.deferReply({ ephemeral: true })
      try {
        const preview = await this.playerCodex!.factionForPublication(pending.factionId)
        if (preview.published) throw new Error('Cette faction est déjà publiée côté joueurs.')
        const faction = await this.playerCodex!.ensurePlayerFactionForMj(pending.factionId) as { id: string; name: string; description: string; parentFactionId: string | null; wikiPageTitle: string }
        const parent = faction.parentFactionId ? await this.playerCodex!.playerFaction(faction.parentFactionId) as { name: string } : null
        if (!(await this.mediaWiki!.pageExists(faction.wikiPageTitle))) await this.mediaWiki!.createPage(faction.wikiPageTitle, faction.description)
        const publication = await this.discord!.publishFaction({ name: faction.name, description: faction.description, parentName: parent?.name ?? null, wikiUrl: this.mediaWiki!.pageUrl(faction.wikiPageTitle) })
        if (publication.status !== 'sent') throw new Error(publication.reason ?? 'Discord n’a pas confirmé la publication.')
        await this.playerCodex!.markPlayerFactionPublished(faction.id)
        await this.playerCodex!.markMjFactionPublished(pending.factionId)
        this.pendingFactionPublications.delete(interaction.customId)
        await interaction.editReply({ content: `Faction publiée et associée : ${this.mediaWiki!.pageUrl(faction.wikiPageTitle)}` })
      } catch (error) {
        await interaction.editReply({ content: `Publication impossible : ${error instanceof Error ? error.message : String(error)}` })
      }
      return true
    }

    if (interaction.customId.startsWith('pf2-character:create:')) {
      const presentationId = interaction.customId.slice('pf2-character:create:'.length)
      try {
        const presentation = await this.playerCodex!.presentation(presentationId)
        let current: { wikiPageTitle: string; shortDescription?: string; published?: boolean } | null = null
        if (presentation.sourceNpcId) {
          try { current = await this.playerCodex!.character(presentation.sourceNpcId) as { wikiPageTitle: string; shortDescription?: string; published?: boolean } } catch { current = null }
          if (current?.published) { await interaction.reply({ content: `Ce personnage existe déjà dans le carnet : ${this.mediaWiki!.pageUrl(current.wikiPageTitle)}`, ephemeral: true }); return true }
        }
        const modal = new ModalBuilder().setCustomId(interaction.customId).setTitle(current ? 'Publier la fiche personnage' : 'Créer la fiche personnage')
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('name').setLabel('Nom connu des joueurs').setStyle(TextInputStyle.Short).setValue(presentation.name).setRequired(true)))
        const descriptionInput = new TextInputBuilder().setCustomId('description').setLabel('Description courte').setStyle(TextInputStyle.Paragraph).setMaxLength(1000).setRequired(false)
        if (current?.shortDescription) descriptionInput.setValue(current.shortDescription.slice(0, 4000))
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput))
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
    if (!this.isAdmin(interaction)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }
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
    if (!this.isAdmin(interaction)) {
      await interaction.reply({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
      return
    }
    await interaction.deferReply({ ephemeral: true })
    const names = await this.cachedActorNames()
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
    const announcement = await this.plannedSessionAnnouncement(sessionNumber, date, selected, plan.rollCounts, true)
    const draft = await this.persistence.createSession({ sessionNumber, date: '', inGameStartDate: date, inGameEndDate: '', title: '', participants: selected.map((actor) => actor.uuid), published: false })
    const content = `Brouillon créé : résumé n°${draft.sessionNumber}.\nDébut : ${this.displayDate(date)}. Fin : à renseigner.\n\n${plan.progressionRolls.join('\n')}\n\nComplète puis publie le résumé dans l’application MJ.`
    const announcementId = `pf2-new-game:announce:${draft.id}`
    this.pendingAnnouncements.set(announcementId, { content: announcement, userIds: selected.map((actor) => actor.userId) })
    const publish = new ButtonBuilder().setCustomId(announcementId).setLabel('Publier l’annonce').setStyle(ButtonStyle.Primary)
    await interaction.update({ content, components: [new ActionRowBuilder<ButtonBuilder>().addComponents(publish)] })
  }

  private async finishGameModal(interaction: ModalSubmitInteraction, pending: { selected?: Array<{ uuid: string; name: string; userId: string }> }, date: string, plan: { progressionRolls: string[]; rollCounts: Map<string, number> }): Promise<void> {
    const sessions = await this.persistence.listSessions()
    const sessionNumber = Math.max(0, ...sessions.map((session) => session.sessionNumber)) + 1
    const selected = pending.selected ?? []
    const announcement = await this.plannedSessionAnnouncement(sessionNumber, date, selected, plan.rollCounts, true)
    const draft = await this.persistence.createSession({ sessionNumber, date: '', inGameStartDate: date, inGameEndDate: '', title: '', participants: selected.map((actor) => actor.uuid), published: false })
    const announcementId = `pf2-new-game:announce:${draft.id}`
    this.pendingAnnouncements.set(announcementId, { content: announcement, userIds: selected.map((actor) => actor.userId) })
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
    return [`@everyone **Nouvelle séance ! La semaine du lundi ${this.planningDate(monday, true)}**`, '', ...PLANNING_DAYS.filter(day => selected.has(day.offset)).map(day => `${day.emoji} ${day.label} ${this.planningDate(this.addDays(monday, day.offset))}`), `${PLANNING_UNAVAILABLE_EMOJI} Pas dispo`, `${PLANNING_UNCERTAIN_EMOJI} Ne sais pas encore`].join('\n')
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
  private displayRealDate(date: string): string { const [year, month, day] = date.split('-'); return day && month && year ? `${day}/${month}/${year}` : date }
  private discordId(player: string): string | undefined { return pf2DiscordIdForPlayer(player) }

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

  private async playerLevels(uuids: string[] = []): Promise<Map<string, { foundryLevel: number; theoreticalLevel: number }>> {
    const levels = await this.persistence.readFoundryPlayerLevels()
    const refreshed: Array<{ uuid: string; foundryLevel: number; theoreticalLevel: number }> = []
    try {
      const players = await this.foundry.listPlayers()
      for (const player of players) {
        const value = { foundryLevel: player.foundryLevel, theoreticalLevel: player.level }
        levels.set(player.uuid, value)
        refreshed.push({ uuid: player.uuid, ...value })
      }
    } catch (error) {
      this.logger.warn(`Progression Foundry indisponible, utilisation des niveaux en cache : ${error instanceof Error ? error.message : String(error)}`)
    }

    for (const uuid of [...new Set(uuids)].filter(uuid => !refreshed.some(player => player.uuid === uuid))) {
      try {
        const actor = await this.foundry.getNpcSummary(uuid)
        if (actor.level !== null) {
          const value = { foundryLevel: actor.level, theoreticalLevel: levels.get(uuid)?.theoreticalLevel ?? actor.level }
          levels.set(uuid, value)
          refreshed.push({ uuid, ...value })
        }
      } catch (error) {
        this.logger.warn(`Niveau Foundry indisponible pour ${uuid} : ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    if (refreshed.length) await this.persistence.saveFoundryPlayerLevels(refreshed)
    return levels
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
    const lines = actors.map((actor) => {
      const count = rolls.get(actor.uuid) ?? 0
      const mention = mentionUsers && actor.userId ? ` (<@${actor.userId}>)` : ''
      return `- **${this.characterLabel(actor.name)}** : **${count} lancer${count > 1 ? 's' : ''} à faire**${mention}`
    })
    return [
      `**Séance prévue — Résumé n°${sessionNumber}**`,
      'Avec :',
      ...lines,
      `Début de la mission : ${date ? this.displayDate(date) : 'date non renseignée'}`,
    ].join('\n')
  }

  private async cachedActorNames(): Promise<Map<string, string>> {
    const cached = await this.persistence.readFoundryActorCache()
    return new Map(cached.map((actor) => [actor.uuid, actor.name]))
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
