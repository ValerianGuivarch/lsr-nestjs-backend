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

  it('installs an idempotent pinned launcher only at admin command time', async () => {
    const { service, stored } = setup()
    const pin = jest.fn().mockResolvedValue(undefined)
    const create = jest.fn().mockResolvedValue({ id: QUEST, pin })
    const forum = { type: ChannelType.GuildForum, guildId: GUILD, threads: { create } }
    const editReply = jest.fn().mockResolvedValue(undefined)
    const command = {
      commandName: 'installer-creation-quete', guildId: GUILD,
      client: { channels: { fetch: jest.fn().mockResolvedValue(forum) } },
      deferReply: jest.fn().mockResolvedValue(undefined), editReply,
    }
    await service.handleCommand(command as never)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ name: '📌 Créer une quête' }))
    const options = create.mock.calls[0][0]
    expect(options.message.components[0].components[0].data.custom_id).toBe('pf2-quest-ui:create')
    expect(stored.saveQuestUi).toHaveBeenCalledWith(QUEST, 'launcher', '')
    expect(pin).toHaveBeenCalled()
    stored.questLauncherId.mockResolvedValueOnce(QUEST)
    await service.handleCommand(command as never)
    expect(create).toHaveBeenCalledTimes(1)
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({content:expect.stringContaining('existe déjà')}))
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
      customId: 'pf2-quest-ui:new',
      fields: { getTextInputValue: (field: string) => ({
        icon: '😈', title: 'Invoquer le démon', description: 'Destruction du monde depuis la Grande Loge.',
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
})
