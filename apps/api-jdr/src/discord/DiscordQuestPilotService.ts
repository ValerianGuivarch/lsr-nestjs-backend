import { Injectable } from '@nestjs/common'
import {
  ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelType,
  ChatInputCommandInteraction, ForumChannel, ModalBuilder, ModalSubmitInteraction,
  StringSelectMenuBuilder, StringSelectMenuInteraction, TextInputBuilder, TextInputStyle,
  ThreadChannel, ThreadAutoArchiveDuration, MessageReaction, PartialMessageReaction, User, PartialUser,
} from 'discord.js'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'

const PREFIX = 'pf2-quest-ui'
const FORUM_ID = process.env['PF2_DISCORD_QUEST_FORUM_CHANNEL_ID']?.trim() || '1536259632455094412'
const MAP_URL = 'https://map.l7r.fr/pj'
const NO_PINGS = { parse: [] as Array<'everyone' | 'users' | 'roles'> }

// Unicode reactions work as icons in Discord thread titles. Server-specific
// animated/custom emoji reactions cannot be rendered in a thread title.
const isUnicodeEmoji = (value: string): boolean =>
  value.length <= 20 && !/\s/u.test(value) &&
  /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u.test(value)
const leadingEmoji = (value: string): { icon: string; title: string } | null => {
  const match = /^(\S+)\s+(.+)$/u.exec(value)
  return match && isUnicodeEmoji(match[1]) ? { icon: match[1], title: match[2] } : null
}

@Injectable()
export class DiscordQuestPilotService {
  constructor(private readonly persistence: Pf2PersistenceService) {}

  private async forum(client: ChatInputCommandInteraction['client']): Promise<ForumChannel> {
    const channel = await client.channels.fetch(FORUM_ID)
    if (!channel || channel.type !== ChannelType.GuildForum) throw new Error('Forum des quêtes inaccessible.')
    return channel
  }

  private async thread(interaction: ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction, id: string): Promise<ThreadChannel> {
    const channel = interaction.channel
    if (!channel?.isThread() || channel.id !== id || channel.parentId !== FORUM_ID) {
      throw new Error('Cette action doit être effectuée dans la discussion de la quête.')
    }
    const record = await this.persistence.questUi(id)
    if (!record || record.kind !== 'quest') {
      throw new Error('Ce panneau ne correspond pas à une quête créée par le bot.')
    }
    const forum = await this.forum(interaction.client)
    const obsoleteId = forum.availableTags.find(tag => tag.name.trim().toLocaleLowerCase('fr') === 'obsolète')?.id
    if (obsoleteId && channel.appliedTags.includes(obsoleteId)) throw new Error('Cette quête est obsolète.')
    return channel
  }

  async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (interaction.commandName !== 'nouvelle-quete') return
    const forum = await this.forum(interaction.client)
    if (!interaction.guildId || interaction.guildId !== forum.guildId) {
      await interaction.reply({ content: 'Commande utilisable uniquement sur le serveur configuré.', ephemeral: true })
      return
    }
    await interaction.showModal(this.questForm('new'))
  }

  private questForm(kind: 'new' | 'edit', title = '', description = ''): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId(PREFIX + ':' + kind)
      .setTitle(kind === 'new' ? 'Créer une quête' : 'Modifier la quête')
    const name = new TextInputBuilder()
      .setCustomId('title').setLabel('Titre de la quête')
      .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(78)
    const details = new TextInputBuilder()
      .setCustomId('description').setLabel('Description de la quête')
      .setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1400)
    if (title) name.setValue(title.slice(0, 78))
    if (description) details.setValue(description)
    return modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(name),
      new ActionRowBuilder<TextInputBuilder>().addComponents(details),
    )
  }

  /** First non-👍 emoji reaction permanently selects the icon for a new bot-owned quest. */
  async handleQuestIconReaction(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): Promise<boolean> {
    if (user.bot || reaction.emoji.id || !reaction.emoji.name ||
      /^👍[\u{1F3FB}-\u{1F3FF}]?$/u.test(reaction.emoji.name) || !isUnicodeEmoji(reaction.emoji.name)) return false
    const message = reaction.message
    if (message.id !== message.channelId) return false // Only the forum starter message
    const channel = message.channel
    if (!channel?.isThread() || channel.parentId !== FORUM_ID) return false
    const ui = await this.persistence.questUi(channel.id)
    if (ui?.kind !== 'quest' || !ui.iconPending) return false
    const forum = await this.forum(channel.client)
    const obsoleteTag = forum.availableTags.find(tag => tag.name.trim().toLocaleLowerCase('fr') === 'obsolète')
    if (obsoleteTag && channel.appliedTags.includes(obsoleteTag.id)) return false
    const starter = await channel.fetchStarterMessage({ force: true })
    if (!starter || starter.author.id !== channel.client.user?.id) return false
    const icon = reaction.emoji.name
    if (!await this.persistence.claimQuestIcon(channel.id, icon)) return false
    // The state is committed first. If Discord is temporarily unavailable,
    // the five-minute catalogue reconciliation will retry applying the icon.
    await this.refreshThreadPanel(channel)
    await this.persistence.saveDiscordQuestSnapshots([{
      id: channel.id, title: channel.name,
      completed: await this.completed(channel), archived: Boolean(channel.archived), obsolete: false,
      url: 'https://discord.com/channels/' + forum.guildId + '/' + channel.id,
      createdAt: new Date(channel.createdTimestamp ?? Date.now()).toISOString(),
    }])
    return true
  }

  private actions(threadId: string, completed: boolean) {
    const finishOrReopen = completed
      ? new ButtonBuilder().setCustomId(`${PREFIX}:reopen:${threadId}`).setLabel('Relancer').setStyle(ButtonStyle.Success)
      : new ButtonBuilder().setCustomId(`${PREFIX}:finish:${threadId}`).setLabel('Terminer').setStyle(ButtonStyle.Danger)
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`${PREFIX}:places:${threadId}:add:0`).setLabel('Associer un lieu').setEmoji('📍').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`${PREFIX}:places:${threadId}:remove:0`).setLabel('Retirer un lieu').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`${PREFIX}:edit:${threadId}`).setLabel('Modifier').setStyle(ButtonStyle.Secondary),
        finishOrReopen,
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setLabel('Voir sur la carte').setStyle(ButtonStyle.Link).setURL(MAP_URL),
      ),
    ]
  }

  private async completed(thread: ThreadChannel): Promise<boolean> {
    const forum = await this.forum(thread.client)
    const tag = forum.availableTags.find(t => t.name.trim().toLocaleLowerCase('fr') === 'terminée')
    return Boolean(tag && thread.appliedTags.includes(tag.id))
  }

  private async card(thread: ThreadChannel, description: string, iconPending = false): Promise<{ content: string; components: ReturnType<DiscordQuestPilotService['actions']>; allowedMentions: typeof NO_PINGS }> {
    const [locations, associated, done] = await Promise.all([
      this.persistence.questUiPlaces(thread.id),
      this.persistence.questUiLinkedPlaceIds(thread.id),
      this.completed(thread),
    ])
    const byId = new Map(locations.map(p => [p.id, p.name]))
    const places = associated.map(id => byId.get(id)).filter((v): v is string => Boolean(v))
    const shown = places.length ? places.map(x => '• ' + x).join('\n') : '_Aucun lieu : utilise « Associer un lieu »._'
    const instruction = iconPending
      ? '**⚠️ Quête non finalisée : ajoutez une réaction (autre que 👍) à ce message pour choisir définitivement l’icône de la quête.**\n\n'
      : ''
    // Discord already shows the title (and its icon) above the starter message.
    const content = instruction + description + '\n\n**📍 Lieux de la quête**\n' + shown +
      '\n\n**Statut :** ' + (done ? '✅ Terminée' : '🟢 En cours') +
      '\n\n_' + (done ? 'La quête est terminée : le bouton « Relancer » permet de la rouvrir.' :
        'Réagissez 👍 à ce premier message pour indiquer votre intérêt.') +
      ' Les boutons restent utilisables après un redémarrage du bot._'
    return { content: content.slice(0, 1995), components: this.actions(thread.id, done), allowedMentions: NO_PINGS }
  }

  async refreshThreadPanel(thread: ThreadChannel): Promise<void> {
    const ui = await this.persistence.questUi(thread.id)
    if (!ui || ui.kind !== 'quest') return
    if (!ui.iconPending && ui.icon && !thread.name.startsWith(ui.icon + ' ')) {
      const original = leadingEmoji(thread.name)?.title ?? thread.name
      await thread.setName(ui.icon + ' ' + original, 'Icône figée après la première réaction')
    }
    const starter = await thread.fetchStarterMessage({ force: true })
    if (!starter || starter.author.id !== thread.client.user?.id) throw new Error('Premier message du bot introuvable.')
    const next = await this.card(thread, ui.description, ui.iconPending)
    // Poll-based reconciliation is a safety net for missed notifications.
    // Don't send an edit to Discord if the current card is already accurate.
    if (starter.content === next.content) return
    await starter.edit(next)
  }

  async handleButton(interaction: ButtonInteraction): Promise<boolean> {
    const id = interaction.customId
    if (id === `${PREFIX}:create`) {
      const launcher = await this.persistence.questLauncherId()
      if (!launcher || interaction.channelId !== launcher || interaction.message.id !== launcher) {
        await interaction.reply({ content: 'Ce bouton de création n’est plus actif.', ephemeral: true }); return true
      }
      await interaction.showModal(this.questForm('new'))
      return true
    }
    const match = /^pf2-quest-ui:(edit|places):(\d{15,22})(?::(add|remove):(\d+))?$/.exec(id)
    if (!match) return false
    const [, action, threadId, mode, pageText] = match
    try {
      const thread = await this.thread(interaction, threadId)
      if (action !== 'places' && interaction.message.id !== thread.id) throw new Error('Utilise les boutons de la fiche initiale.')
      if (action === 'edit') {
        const saved = await this.persistence.questUi(threadId)
        await interaction.showModal(this.questForm('edit',
          leadingEmoji(thread.name)?.title ?? thread.name, saved?.description ?? ''))
        return true
      }
      await interaction.reply({ ...await this.placePicker(threadId, mode === 'remove' ? 'remove' : 'add', Number(pageText || 0)), ephemeral: true })
      return true
    } catch (error) {
      if (!interaction.replied && !interaction.deferred) await interaction.reply({ content: this.error(error), ephemeral: true })
      else if (interaction.deferred) await interaction.editReply(this.error(error))
      return true
    }
  }

  private async placePicker(threadId: string, mode: 'add' | 'remove', page: number) {
    const [all, linked] = await Promise.all([
      this.persistence.questUiPlaces(threadId),
      this.persistence.questUiLinkedPlaceIds(threadId),
    ])
    const set = new Set(linked)
    const available = all.filter(p => p.id.length <= 100 && (mode === 'add' ? !set.has(p.id) : set.has(p.id)))
    const totalPages = Math.max(1, Math.ceil(available.length / 25))
    const index = Math.max(0, Math.min(totalPages - 1, Number.isSafeInteger(page) ? page : 0))
    const slice = available.slice(index * 25, index * 25 + 25)
    const linkedNames = all.filter(p => set.has(p.id)).map(p => p.name)
    const linkedText = linkedNames.length
      ? '**Déjà associés à cette quête :** ' + linkedNames.join(', ')
      : '**Déjà associés à cette quête :** aucun'
    const locationExplanation = [
      '**📍 Ajouter des lieux à cette quête**',
      '',
      linkedText,
      'Les lieux déjà associés ne figurent pas dans le menu ci-dessous. Ils sont visibles dans la fiche de quête et via « Retirer un lieu ».',
      '',
      '**1. Lieu existant :** choisis-le dans la liste ci-dessous. Tu peux en sélectionner plusieurs.',
      '**2. Nouveau lieu :** clique sur **Créer un lieu sur la carte**, puis sur **＋ Lieu** en haut à droite de la carte. Clique sur l’emplacement désiré, choisis **★ Lieu de quête**, associe cette quête et enregistre.',
      '',
      'Tu peux laisser la quête sans lieu et y revenir plus tard via **Associer un lieu**.',
    ].join('\n')
    const newPlaceLink = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setLabel('Créer un lieu sur la carte').setEmoji('🗺️').setStyle(ButtonStyle.Link).setURL(MAP_URL),
    )
    if (!slice.length) {
      return { content: mode === 'add' ? locationExplanation + '\n\nTous les lieux existants sont déjà associés.' : 'Aucun lieu associé pour le moment.',
        components: mode === 'add' ? [newPlaceLink] : [] }
    }
    const select = new StringSelectMenuBuilder()
      .setCustomId(`${PREFIX}:select:${threadId}:${mode}`)
      .setPlaceholder(mode === 'add' ? 'Sélectionne un ou plusieurs lieux' : 'Choisis les lieux à retirer')
      .setMinValues(1).setMaxValues(slice.length)
      .addOptions(slice.map(p => ({ label: p.name.slice(0, 100), value: p.id })))
    const components: Array<ActionRowBuilder<StringSelectMenuBuilder> | ActionRowBuilder<ButtonBuilder>> = [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
    ]
    if (totalPages > 1) {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`${PREFIX}:places:${threadId}:${mode}:${Math.max(0, index-1)}`).setLabel('Précédent').setStyle(ButtonStyle.Secondary).setDisabled(index === 0),
        new ButtonBuilder().setCustomId(`${PREFIX}:places:${threadId}:${mode}:${Math.min(totalPages-1,index+1)}`).setLabel('Suivant').setStyle(ButtonStyle.Secondary).setDisabled(index+1 === totalPages),
      )
      components.push(row)
    }
    if (mode === 'add') components.push(newPlaceLink)
    const pageLabel = totalPages > 1 ? ` — page ${index + 1}/${totalPages}` : ''
    return {
      content: mode === 'add' ? locationExplanation + pageLabel : `**Retirer des lieux de la quête**${pageLabel}\nChoisis les lieux à détacher. Les lieux eux-mêmes ne seront pas supprimés de la carte.`,
      components,
    }
  }

  async handleSelect(interaction: StringSelectMenuInteraction): Promise<boolean> {
    const match = /^pf2-quest-ui:select:(\d{15,22}):(add|remove)$/.exec(interaction.customId)
    if (!match) return false
    await interaction.deferReply({ ephemeral: true })
    const [, threadId, mode] = match
    try {
      const thread = await this.thread(interaction, threadId)
      await this.persistence.changeQuestUiPlaces(threadId, interaction.values, mode as 'add' | 'remove')
      await this.refreshThreadPanel(thread)
      await interaction.editReply({ content: `${mode === 'add' ? 'Lieu(x) ajouté(s)' : 'Lieu(x) retiré(s)'} : ${interaction.values.length}. Tu peux répéter l’action pour plusieurs lieux.` })
    } catch (error) { await interaction.editReply(this.error(error)) }
    return true
  }

  async handleModal(interaction: ModalSubmitInteraction): Promise<boolean> {
    if (interaction.customId !== PREFIX + ':new' && interaction.customId !== PREFIX + ':edit') return false
    const edit = interaction.customId === PREFIX + ':edit'
    if (edit) {
      if (!interaction.channel?.isThread() || interaction.channel.parentId !== FORUM_ID) {
        await interaction.reply({ content: 'Cette édition doit avoir lieu dans une quête créée par le bot.', ephemeral: true })
        return true
      }
      const ui = await this.persistence.questUi(interaction.channelId)
      if (!ui || ui.kind !== 'quest') { await interaction.reply({ content: 'Quête inconnue.', ephemeral: true }); return true }
    }
    const title = interaction.fields.getTextInputValue('title').replace(/\s+/g, ' ').trim()
    const description = interaction.fields.getTextInputValue('description').trim()
    if (!title || !description || title.length > 78 || title.includes('@everyone') ||
      title.includes('@here') || leadingEmoji(title)) {
      await interaction.reply({
        content: 'Titre invalide (78 caractères maximum). Ne saisis pas d’emoji dans le titre : utilise une réaction sur la quête.',
        ephemeral: true,
      })
      return true
    }
    await interaction.deferReply({ ephemeral: true })
    try {
      if (edit) {
        const thread = await this.thread(interaction, interaction.channelId)
        const ui = await this.persistence.questUi(thread.id)
        const lockedIcon = ui?.icon || leadingEmoji(thread.name)?.icon || ''
        const name = (lockedIcon ? lockedIcon + ' ' : '') + title
        await thread.setName(name, 'Modification de quête via sa fiche')
        await this.persistence.updateQuestUiDescription(thread.id, description)
        await this.persistence.saveDiscordQuestSnapshots([{
          id: thread.id, title: name, completed: await this.completed(thread), archived: Boolean(thread.archived), obsolete: false,
          url: `https://discord.com/channels/${interaction.guildId}/${thread.id}`,
          createdAt: new Date(thread.createdTimestamp ?? Date.now()).toISOString(),
        }])
        await this.refreshThreadPanel(thread)
        await interaction.editReply('Fiche de quête modifiée. Le titre du forum a également été mis à jour.')
      } else {
        const forum = await this.forum(interaction.client)
        const name = title
        const thread = await forum.threads.create({
          name, autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
          message: {
            content: '**⚠️ Quête non finalisée : ajoutez une réaction (autre que 👍) à ce message pour choisir définitivement l’icône de la quête.**\n\n' +
              description + '\n\n**📍 Lieux de la quête**\n_Aucun lieu associé._\n\n**Statut :** 🟢 En cours',
            allowedMentions: NO_PINGS,
          },
        })
        await this.persistence.saveQuestUi(thread.id, 'quest', description, true)
        await this.persistence.saveDiscordQuestSnapshots([{
          id: thread.id, title: name, completed: false, archived: false, obsolete: false,
          url: `https://discord.com/channels/${forum.guildId}/${thread.id}`,
          createdAt: new Date(thread.createdTimestamp ?? Date.now()).toISOString(),
        }])
        await this.refreshThreadPanel(thread)
        const starter = await thread.fetchStarterMessage({ force: true })
        if (starter) await starter.react('👍').catch(() => undefined)
        await interaction.editReply({
          content: 'Quête créée : https://discord.com/channels/' + forum.guildId + '/' + thread.id +
            '\nRéagis au premier message avec l’emoji de ton choix pour fixer définitivement l’icône de la quête. Tu peux aussi associer des lieux.',
        })
      }
    } catch (error) { await interaction.editReply('Création/modification impossible : ' + this.error(error)) }
    return true
  }

  private error(error: unknown): string { return error instanceof Error ? error.message.slice(0, 600) : String(error).slice(0, 600) }
}
