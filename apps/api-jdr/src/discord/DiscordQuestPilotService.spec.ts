import { ChannelType } from 'discord.js'
import { DiscordQuestPilotService } from './DiscordQuestPilotService'

const QUEST = '1553098157544439878'
const FORUM = '1536259632455094412'
const GUILD = '1531345672639610920'

describe('DiscordQuestPilotService', () => {
  function setup() {
    const stored = {
      questUi: jest.fn().mockResolvedValue({ threadId: QUEST, kind: 'quest', description: 'Description de test' }),
      questLauncherId: jest.fn().mockResolvedValue(null),
      saveQuestUi: jest.fn().mockResolvedValue(undefined),
      saveDiscordQuestSnapshots: jest.fn().mockResolvedValue(undefined),
      questUiPlaces: jest.fn().mockResolvedValue([{ id: 'grand-lodge', name: 'Grande Loge' }, { id: 'absalom', name: 'Absalom' }]),
      questUiLinkedPlaceIds: jest.fn().mockResolvedValue(['grand-lodge']),
      changeQuestUiPlaces: jest.fn().mockResolvedValue(undefined),
      updateQuestUiDescription: jest.fn().mockResolvedValue(undefined),
    }
    return { service: new DiscordQuestPilotService(stored as never), stored }
  }

  it('opens an emoji selection menu from the already installed launcher', async () => {
    const { service, stored } = setup()
    stored.questLauncherId.mockResolvedValueOnce(QUEST)
    const reply = jest.fn().mockResolvedValue(undefined)
    await service.handleButton({
      customId: 'pf2-quest-ui:create', channelId: QUEST, message: { id: QUEST }, reply,
    } as never)
    const response = reply.mock.calls[0][0]
    expect(response.content).toContain('Choisis l’icône')
    expect(response.ephemeral).toBe(true)
    const menu = response.components[0].components[0].toJSON()
    expect(menu.options.some((opt: any) => opt.value === 'demon' && opt.emoji.name === '😈')).toBe(true)
    expect(menu.options.some((opt: any) => opt.value === 'custom')).toBe(true)
    expect(menu.options.length).toBeLessThanOrEqual(25)
  })

  it('opens a title/description modal after emoji selection', async () => {
    const { service } = setup()
    const forum = { type: ChannelType.GuildForum, guildId: GUILD }
    const showModal = jest.fn().mockResolvedValue(undefined)
    await service.handleSelect({
      customId: 'pf2-quest-ui:icon:new', values: ['demon'], guildId: GUILD,
      client: { channels: { fetch: jest.fn().mockResolvedValue(forum) } }, showModal,
    } as never)
    const modal = showModal.mock.calls[0][0].toJSON()
    expect(modal.custom_id).toBe('pf2-quest-ui:new:demon')
    expect(modal.components.map((component: any) => component.components[0].custom_id)).toEqual(['title', 'description'])
  })

  it('creates a forum quest with the bot as starter, persistent actions, and a synced catalogue entry', async () => {
    const { service, stored } = setup()
    const starter = { edit: jest.fn().mockResolvedValue(undefined), react: jest.fn().mockResolvedValue(undefined), author: { id: 'bot' } }
    const forum: any = { type: ChannelType.GuildForum, guildId: GUILD, availableTags: [{ id: 'done', name: 'Terminée' }] }
    const client = { user: { id: 'bot' }, channels: { fetch: jest.fn().mockResolvedValue(forum) } }
    const thread: any = {
      id: QUEST, name: '😈 Invoquer le démon', createdTimestamp: Date.now(), client, archived: false,
      appliedTags: [], fetchStarterMessage: jest.fn().mockResolvedValue(starter),
    }
    const create = jest.fn().mockResolvedValue(thread)
    forum.threads = {create}
    const editReply = jest.fn().mockResolvedValue(undefined)
    await service.handleModal({
      customId: 'pf2-quest-ui:new:demon',
      fields: { getTextInputValue: (field: string) => ({
        title: 'Invoquer le démon', description: 'Destruction du monde depuis la Grande Loge.',
      } as Record<string,string>)[field] },
      client, guildId: GUILD,
      deferReply: jest.fn().mockResolvedValue(undefined), editReply,
    } as never)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({name:'😈 Invoquer le démon'}))
    expect(stored.saveQuestUi).toHaveBeenCalledWith(QUEST, 'quest', 'Destruction du monde depuis la Grande Loge.')
    expect(stored.saveDiscordQuestSnapshots).toHaveBeenCalledWith([
      expect.objectContaining({id:QUEST, title:'😈 Invoquer le démon', completed:false, obsolete:false}),
    ])
    const edited = starter.edit.mock.calls[0][0]
    expect(edited.content).toContain('Grande Loge')
    expect(edited.components[0].components.map((c: any) => c.data.custom_id)).toEqual([
      'pf2-quest-ui:places:'+QUEST+':add:0',
      'pf2-quest-ui:places:'+QUEST+':remove:0',
      'pf2-quest-ui:edit:'+QUEST,
      'pf2-quest-ui:finish:'+QUEST,
    ])
    expect(starter.react).toHaveBeenCalledWith('👍')
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({content:expect.stringContaining('Quête créée')}))
  })

  it('lets any player attach another official map location to the same quest', async () => {
    const { service, stored } = setup()
    const starter = { edit: jest.fn().mockResolvedValue(undefined), author: { id: 'bot' } }
    const forum = { type: ChannelType.GuildForum, guildId: GUILD, availableTags: [{ id: 'done', name: 'Terminée' }] }
    const client = { user: { id: 'bot' }, channels: { fetch: jest.fn().mockResolvedValue(forum) } }
    const thread = {
      id: QUEST, parentId: FORUM, isThread: () => true, client, appliedTags: [],
      name: '😈 Invoquer le démon', fetchStarterMessage: jest.fn().mockResolvedValue(starter),
    }
    const editReply = jest.fn().mockResolvedValue(undefined)
    await service.handleSelect({
      customId: 'pf2-quest-ui:select:'+QUEST+':add', values: ['absalom'],
      channel: thread, channelId: QUEST, client,
      deferReply: jest.fn().mockResolvedValue(undefined), editReply,
    } as never)
    expect(stored.changeQuestUiPlaces).toHaveBeenCalledWith(QUEST, ['absalom'], 'add')
    expect(starter.edit).toHaveBeenCalledTimes(1)
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({content: expect.stringContaining('ajouté')}))
  })
  it('explains both location choices and shows a map link without page 1/1', async () => {
    const { service } = setup()
    const thread = {
      id: QUEST, parentId: FORUM, isThread: () => true, appliedTags: [], name: '😈 Test',
    }
    const forum = { type: ChannelType.GuildForum, guildId: GUILD, availableTags: [] }
    const reply = jest.fn().mockResolvedValue(undefined)
    await service.handleButton({
      customId: 'pf2-quest-ui:places:'+QUEST+':add:0', channelId: QUEST, channel: thread,
      client: { channels: { fetch: jest.fn().mockResolvedValue(forum) } }, reply,
    } as never)
    const payload = reply.mock.calls[0][0]
    expect(payload.content).toContain('Déjà associés à cette quête :** Grande Loge')
    expect(payload.content).toContain('ne figurent pas dans le menu')
    expect(payload.content).toContain('Lieu existant')
    expect(payload.content).toContain('Nouveau lieu')
    expect(payload.content).toContain('＋ Lieu')
    expect(payload.content).not.toContain('page 1/1')
    expect(payload.components.some((row: any) => row.toJSON().components.some((c: any) =>
      c.style === 5 && c.url === 'https://map.l7r.fr/pj'))).toBe(true)
  })

  it('displays a community location linked from the map and avoids redundant Discord edits', async () => {
    const { service, stored } = setup()
    stored.questUiPlaces.mockResolvedValue([
      { id: 'community-port', name: 'Port de la fin du monde' },
    ])
    stored.questUiLinkedPlaceIds.mockResolvedValue(['community-port'])
    const starter = { content: 'Ancienne fiche', edit: jest.fn().mockResolvedValue(undefined), author: { id: 'bot' } }
    const forum = { type: ChannelType.GuildForum, availableTags: [] }
    const client = { user: { id: 'bot' }, channels: { fetch: jest.fn().mockResolvedValue(forum) } }
    const thread = {
      id: QUEST, name: '📜 Détruire le monde', appliedTags: [], client,
      fetchStarterMessage: jest.fn().mockResolvedValue(starter),
    }
    await service.refreshThreadPanel(thread as never)
    expect(starter.edit).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('• Port de la fin du monde'),
    }))
    starter.content = starter.edit.mock.calls[0][0].content
    await service.refreshThreadPanel(thread as never)
    expect(starter.edit).toHaveBeenCalledTimes(1)
  })

  it('rejects a text string instead of a custom emoji', async () => {
    const { service } = setup()
    const reply = jest.fn().mockResolvedValue(undefined)
    await service.handleModal({
      customId: 'pf2-quest-ui:new:custom',
      fields: { getTextInputValue: (field: string) => ({
        customIcon: 'coucou', title: 'Quête', description: 'Test',
      } as Record<string, string>)[field] },
      reply,
    } as never)
    expect(reply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('un seul emoji'), ephemeral: true,
    }))
  })

})
