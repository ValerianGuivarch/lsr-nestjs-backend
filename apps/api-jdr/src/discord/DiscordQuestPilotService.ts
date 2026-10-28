import { Injectable, Logger } from '@nestjs/common'
import {
  ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelType,
  ChatInputCommandInteraction, ForumChannel, ModalBuilder, ModalSubmitInteraction,
  StringSelectMenuBuilder, StringSelectMenuInteraction, TextInputBuilder, TextInputStyle,
  ThreadChannel, ThreadAutoArchiveDuration,
} from 'discord.js'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'

const PREFIX = 'pf2-quest-ui'
const FORUM_ID = process.env['PF2_DISCORD_QUEST_FORUM_CHANNEL_ID']?.trim() || '1536259632455094412'
const MAP_URL = 'https://map.l7r.fr/pj'
const NO_PINGS = { parse: [] as Array<'everyone' | 'users' | 'roles'> }

type Place = { id: string; name: string }

@Injectable()
export class DiscordQuestPilotService {
  private readonly logger = new Logger(DiscordQuestPilotService.name)
  private installing = false

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
    if (interaction.commandName === 'nouvelle-quete') {
      if (!interaction.guildId || interaction.guildId !== (await this.forum(interaction.client)).guildId) throw new Error('Commande utilisable uniquement sur le serveur configuré.')
      await interaction.showModal(this.questForm('new'))
      return
    }
    if (interaction.commandName !== 'installer-creation-quete') return
    await interaction.deferReply({ ephemeral: true })
    if (this.installing) { await interaction.editReply('Installation en cours.'); return }
    this.installing = true
    try {
      const forum = await this.forum(interaction.client)
      if (forum.guildId !== interaction.guildId) throw new Error('Installation réservée au serveur configuré.')
      const existingId = await this.persistence.questLauncherId()
      if (existingId) {
        await interaction.editReply({ content: `Le sujet de création existe déjà : https://discord.com/channels/${forum.guildId}/${existingId}` })
        return
      }
      const created = await forum.threads.create({
        name: '📌 Créer une quête',
        autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
        message: {
          content: '## 📜 Journal de quêtes\n\nCliquez sur **Créer une quête** pour ouvrir un formulaire. La quête sera publiée dans ce forum avec une fiche interactive.\n\nLes discussions historiques restent accessibles pendant la transition.',
          components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(`${PREFIX}:create`).setLabel('Créer une quête').setEmoji('✨').setStyle(ButtonStyle.Success),
          )],
          allowedMentions: NO_PINGS,
        },
      })
      await this.persistence.saveQuestUi(created.id, 'launcher', '')
      let pinned = true
      try { await created.pin('Sujet d’accueil du journal de quêtes') }
      catch (error) { pinned = false; this.logger.warn('Épinglage du sujet impossible : ' + String(error)) }
      await interaction.editReply({
        content: `Sujet créé : https://discord.com/channels/${forum.guildId}/${created.id}\n${pinned ? 'Sujet épinglé dans le forum.' : 'Épinglage automatique impossible : épingle-le manuellement dans le forum.'}`,
      })
    } catch (error) {
      await interaction.editReply({ content: 'Installation impossible : ' + this.error(error) })
    } finally { this.installing = false }
  }

  private questForm(kind: 'new' | 'edit', title = '', description = '', emoji = ''): ModalBuilder {
    const modal = new ModalBuilder().setCustomId(kind === 'new' ? `${PREFIX}:new` : `${PREFIX}:edit`).setTitle(kind === 'new' ? 'Créer une quête' : 'Modifier la quête')
    const icon = new TextInputBuilder().setCustomId('icon').setLabel('Icône (emoji)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(36).setPlaceholder('😈')
    const name = new TextInputBuilder().setCustomId('title').setLabel('Titre de la quête').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(88)
    const details = new TextInputBuilder().setCustomId('description').setLabel('Description de la quête').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1400)
    if (emoji) icon.setValue(emoji)
    if (title) name.setValue(title)
    if (description) details.setValue(description)
    return modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(icon),
      new ActionRowBuilder<TextInputBuilder>().addComponents(name),
      new ActionRowBuilder<TextInputBuilder>().addComponents(details),
    )
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

  private async card(thread: ThreadChannel, description: string): Promise<{ content: string; components: ReturnType<DiscordQuestPilotService['actions']>; allowedMentions: typeof NO_PINGS }> {
    const [locations, associated, done] = await Promise.all([
      this.persistence.questUiPlaces(thread.id),
      this.persistence.questUiLinkedPlaceIds(thread.id),
      this.completed(thread),
    ])
    const byId = new Map(locations.map(p => [p.id, p.name]))
    const places = associated.map(id => byId.get(id)).filter((v): v is string => Boolean(v))
    const shown = places.length ? places.map(x => '• ' + x).join('\n') : '_Aucun lieu : utilise « Associer un lieu »._'
    const content = `## ${thread.name}\n\n${description}\n\n**📍 Lieux de la quête**\n${shown}\n\n**Statut :** ${done ? '✅ Terminée' : '🟢 En cours'}\n\n_${done ? 'La quête est terminée : le bouton « Relancer » permet de la rouvrir.' : 'Réagissez 👍 à ce premier message pour indiquer votre intérêt.'} Les boutons restent utilisables après un redémarrage du bot._`
    return { content: content.slice(0, 1995), components: this.actions(thread.id, done), allowedMentions: NO_PINGS }
  }

  async refreshThreadPanel(thread: ThreadChannel): Promise<void> {
    const ui = await this.persistence.questUi(thread.id)
    if (!ui || ui.kind !== 'quest') return
    const starter = await thread.fetchStarterMessage({ force: true })
    if (!starter || starter.author.id !== thread.client.user?.id) throw new Error('Premier message du bot introuvable.')
    await starter.edit(await this.card(thread, ui.description))
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
        const parts = thread.name.match(/^(\S+)\s+(.+)$/u)
        await interaction.showModal(this.questForm('edit', parts?.[2] ?? thread.name, saved?.description ?? '', parts?.[1] ?? ''))
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
    if (!slice.length) return { content: mode === 'add' ? 'Tous les lieux existants sont déjà associés.' : 'Aucun lieu associé pour le moment.', components: [] }
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
    return { content: `${mode === 'add' ? 'Ajouter' : 'Retirer'} des lieux de la quête — page ${index+1}/${totalPages}`, components }
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
    if (interaction.customId !== `${PREFIX}:new` && interaction.customId !== `${PREFIX}:edit`) return false
    const edit = interaction.customId.endsWith(':edit')
    if (edit) {
      if (!interaction.channel?.isThread() || interaction.channel.parentId !== FORUM_ID) {
        await interaction.reply({ content: 'Cette édition doit avoir lieu dans une quête créée par le bot.', ephemeral: true })
        return true
      }
      const ui = await this.persistence.questUi(interaction.channelId)
      if (!ui || ui.kind !== 'quest') { await interaction.reply({ content: 'Quête inconnue.', ephemeral: true }); return true }
    }
    const icon = interaction.fields.getTextInputValue('icon').trim() || '📜'
    const title = interaction.fields.getTextInputValue('title').replace(/\s+/g, ' ').trim()
    const description = interaction.fields.getTextInputValue('description').trim()
    const name = `${icon} ${title}`
    if (!title || !description || name.length > 100 || name.includes('@everyone') || name.includes('@here')) {
      await interaction.reply({ content: 'Titre/emoji invalide (100 caractères maximum au total) ou description vide.', ephemeral: true })
      return true
    }
    await interaction.deferReply({ ephemeral: true })
    try {
      if (edit) {
        const thread = await this.thread(interaction, interaction.channelId)
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
        const thread = await forum.threads.create({
          name, autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
          message: {
            content: `## ${name}\n\n${description}\n\n**📍 Lieux**\n_Aucun lieu associé pour le moment._\n\n**Statut :** 🟢 En cours\n\n_Réagissez 👍 à ce message si la quête vous intéresse._`,
            allowedMentions: NO_PINGS,
          },
        })
        await this.persistence.saveQuestUi(thread.id, 'quest', description)
        await this.persistence.saveDiscordQuestSnapshots([{
          id: thread.id, title: name, completed: false, archived: false, obsolete: false,
          url: `https://discord.com/channels/${forum.guildId}/${thread.id}`,
          createdAt: new Date(thread.createdTimestamp ?? Date.now()).toISOString(),
        }])
        await this.refreshThreadPanel(thread)
        const starter = await thread.fetchStarterMessage({ force: true })
        if (starter) await starter.react('👍').catch(() => undefined)
        await interaction.editReply({
          content: `Quête créée : https://discord.com/channels/${forum.guildId}/${thread.id}\nOuvre la discussion pour associer la Grande Loge (ou plusieurs lieux) à la quête.`,
        })
      }
    } catch (error) { await interaction.editReply('Création/modification impossible : ' + this.error(error)) }
    return true
  }

  private error(error: unknown): string { return error instanceof Error ? error.message.slice(0, 600) : String(error).slice(0, 600) }
}
