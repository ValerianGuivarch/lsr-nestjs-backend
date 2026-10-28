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
      claimQuestIcon: jest.fn().mockResolvedValue(true),
      replaceQuestIcon: jest.fn().mockResolvedValue(undefined),
    }
    return { service: new DiscordQuestPilotService(stored as never), stored }
  }

  it('opens the Discord quest form directly from the existing launcher', async () => {
    const { service, stored } = setup()
    stored.questLauncherId.mockResolvedValueOnce(QUEST)
    const showModal = jest.fn().mockResolvedValue(undefined)
    await service.handleButton({
      customId: 'pf2-quest-ui:create', channelId: QUEST,
      message: { id: QUEST }, showModal,
    } as never)
    const modal = showModal.mock.calls[0][0].toJSON()
    expect(modal.custom_id).toBe('pf2-quest-ui:new')
    expect(modal.components.map((row: any) => row.components[0].custom_id)).toEqual(['title', 'description'])
  })

  it('opens the form directly from /nouvelle-quete', async () => {
    const { service } = setup()
    const showModal = jest.fn().mockResolvedValue(undefined)
    await service.handleCommand({
      commandName: 'nouvelle-quete', guildId: GUILD,
      client: { channels: { fetch: jest.fn().mockResolvedValue({ type: ChannelType.GuildForum, guildId: GUILD }) } },
      showModal,
    } as never)
    expect(showModal.mock.calls[0][0].toJSON().custom_id).toBe('pf2-quest-ui:new')
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
        title: 'Invoquer le démon', description: 'Destruction du monde depuis la Grande Loge.',
      } as Record<string,string>)[field] },
      client, guildId: GUILD,
      deferReply: jest.fn().mockResolvedValue(undefined), editReply,
    } as never)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({name:'Invoquer le démon'}))
    expect(stored.saveQuestUi).toHaveBeenCalledWith(QUEST, 'quest', 'Destruction du monde depuis la Grande Loge.', true)
    expect(stored.saveDiscordQuestSnapshots).toHaveBeenCalledWith([
      expect.objectContaining({id:QUEST, title:'Invoquer le démon', completed:false, obsolete:false}),
    ])
    const edited = starter.edit.mock.calls[0][0]
    const mapButton = edited.components[1].components[0].toJSON()
    expect(mapButton.url).toBe('https://map.l7r.fr/pj?quest=' + QUEST)
    expect(edited.content).toContain('Grande Loge')
    expect(edited.content).not.toContain('## Invoquer le démon')
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
    ;(starter as any).components = starter.edit.mock.calls[0][0].components.map((row: any) => ({
      components: row.components.map((button: any) => ({ url: button.data.url })),
    }))
    await service.refreshThreadPanel(thread as never)
    expect(starter.edit).toHaveBeenCalledTimes(1)
  })

  it('repairs the old generic map URL even if the quest card text did not change', async () => {
    const { service, stored } = setup()
    stored.questUi.mockResolvedValue({
      threadId: QUEST, kind: 'quest', description: 'Description de test', iconPending: false,
    })
    const starter: any = {
      content: '', author: { id: 'bot' }, edit: jest.fn().mockResolvedValue(undefined),
      components: [],
    }
    const forum = { type: ChannelType.GuildForum, availableTags: [] }
    const client = { user: { id: 'bot' }, channels: { fetch: jest.fn().mockResolvedValue(forum) } }
    const thread = {
      id: QUEST, name: '😈 Détruire le monde', appliedTags: [], client,
      fetchStarterMessage: jest.fn().mockResolvedValue(starter),
    }
    await service.refreshThreadPanel(thread as never)
    const correct = starter.edit.mock.calls[0][0]
    starter.content = correct.content
    starter.components = [{ components: [{ url: 'https://map.l7r.fr/pj' }] }]
    await service.refreshThreadPanel(thread as never)
    expect(starter.edit).toHaveBeenCalledTimes(2)
    expect(starter.edit.mock.calls[1][0].components[1].components[0].toJSON().url)
      .toBe('https://map.l7r.fr/pj?quest=' + QUEST)
    // Once the button is corrected, the five-minute polling is a no-op.
    starter.components = [{ components: [{ url: 'https://map.l7r.fr/pj?quest=' + QUEST }] }]
    await service.refreshThreadPanel(thread as never)
    expect(starter.edit).toHaveBeenCalledTimes(2)
  })

  it('rejects a manual icon in the title', async () => {
    const { service } = setup()
    const reply = jest.fn().mockResolvedValue(undefined)
    await service.handleModal({
      customId: 'pf2-quest-ui:new',
      fields: { getTextInputValue: (field: string) => ({
        title: '🐸 Quête', description: 'Test',
      } as Record<string, string>)[field] },
      reply,
    } as never)
    expect(reply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('Ne saisis pas d’emoji'), ephemeral: true,
    }))
  })

  it('accepts a frog on the first non-thumb reaction and locks the icon', async () => {
    const { service, stored } = setup()
    stored.questUi.mockResolvedValueOnce({
      threadId: QUEST, kind: 'quest', description: 'Description de test', icon: '', iconPending: true,
    }).mockResolvedValue({
      threadId: QUEST, kind: 'quest', description: 'Description de test', icon: '🐸', iconPending: false,
    })
    const starter = { content: 'Ancien contenu', author: { id: 'bot' }, edit: jest.fn().mockResolvedValue(undefined) }
    const forum = { type: ChannelType.GuildForum, availableTags: [], guildId: GUILD }
    const client = { user: { id: 'bot' }, channels: { fetch: jest.fn().mockResolvedValue(forum) } }
    const channel = {
      id: QUEST, parentId: FORUM, appliedTags: [], name: 'Détruire le monde',
      client, isThread: () => true, archived: false, createdTimestamp: Date.now(),
      setName: jest.fn().mockImplementation(async (name: string) => { channel.name = name }),
      fetchStarterMessage: jest.fn().mockResolvedValue(starter),
    }
    const react = (emoji: string) => ({
      emoji: { name: emoji, id: null },
      message: { id: QUEST, channelId: QUEST, channel },
    })
    expect(await service.handleQuestIconReaction(react('👍') as never, { bot: false } as never)).toBe(false)
    expect(stored.claimQuestIcon).not.toHaveBeenCalled()
    expect(await service.handleQuestIconReaction(react('🐸') as never, { bot: false } as never)).toBe(true)
    expect(stored.claimQuestIcon).toHaveBeenCalledWith(QUEST, '🐸')
    expect(channel.setName).toHaveBeenCalledWith('🐸 Détruire le monde', expect.any(String))
    const card = starter.edit.mock.calls[0][0].content as string
    expect(card).toContain('Description de test')
    expect(card).not.toContain('## 🐸 Détruire le monde')
    expect(card).not.toContain('Quête non finalisée')
    expect(stored.saveDiscordQuestSnapshots).toHaveBeenCalledWith([
      expect.objectContaining({ id: QUEST, title: '🐸 Détruire le monde' }),
    ])
    expect(await service.handleQuestIconReaction(react('🐲') as never, { bot: false } as never)).toBe(false)
    expect(stored.claimQuestIcon).toHaveBeenCalledTimes(1)
  })

  it('edits title and description while preserving a finalized emoji', async () => {
    const { service, stored } = setup()
    stored.questUi.mockResolvedValue({
      threadId: QUEST, kind: 'quest', description: 'Ancien descriptif', icon: '🐸', iconPending: false,
    })
    const starter = { content: '', author: { id: 'bot' }, edit: jest.fn().mockResolvedValue(undefined) }
    const forum = { type: ChannelType.GuildForum, availableTags: [], guildId: GUILD }
    const client = { user: { id: 'bot' }, channels: { fetch: jest.fn().mockResolvedValue(forum) } }
    const channel = {
      id: QUEST, parentId: FORUM, appliedTags: [], name: '🐸 Détruire le monde',
      client, isThread: () => true, archived: false, createdTimestamp: Date.now(),
      setName: jest.fn().mockImplementation(async (name: string) => { channel.name = name }),
      fetchStarterMessage: jest.fn().mockResolvedValue(starter),
    }
    const showModal = jest.fn().mockResolvedValue(undefined)
    await service.handleButton({
      customId: 'pf2-quest-ui:edit:' + QUEST, channel, channelId: QUEST,
      message: { id: QUEST }, showModal, client,
    } as never)
    const modal = showModal.mock.calls[0][0].toJSON()
    expect(modal.components.map((row: any) => row.components[0].custom_id)).toEqual(['title','description'])
    const editReply = jest.fn().mockResolvedValue(undefined)
    await service.handleModal({
      customId: 'pf2-quest-ui:edit', channel, channelId: QUEST, client, guildId: GUILD,
      fields: { getTextInputValue: (field: string) => ({ title: 'Sauver le monde', description: 'Nouvelle histoire' } as Record<string,string>)[field] },
      deferReply: jest.fn().mockResolvedValue(undefined), editReply,
    } as never)
    expect(channel.setName).toHaveBeenCalledWith('🐸 Sauver le monde', expect.any(String))
    expect(stored.updateQuestUiDescription).toHaveBeenCalledWith(QUEST, 'Nouvelle histoire')
  })

  it('does not let a bot or custom server emoji finalize a quest', async () => {
    const { service, stored } = setup()
    const react = { emoji: { name: 'frog', id: '12345' }, message: { id: QUEST, channelId: QUEST } }
    expect(await service.handleQuestIconReaction(react as never, { bot: false } as never)).toBe(false)
    const unicode = { ...react, emoji: { name: '🐸', id: null } }
    expect(await service.handleQuestIconReaction(unicode as never, { bot: true } as never)).toBe(false)
    expect(stored.questUi).not.toHaveBeenCalled()
  })

  it('replaces the icon of an already finalized quest without changing its description or linked places', async () => {
    const { service, stored } = setup()
    let savedIcon = '📜'
    stored.questUi.mockImplementation(async () => ({
      threadId: QUEST, kind: 'quest', description: 'Une porte mystérieuse',
      icon: savedIcon, iconPending: false,
    }))
    stored.replaceQuestIcon.mockImplementation(async (_id: string, emoji: string) => { savedIcon = emoji })
    const starter = { content: 'Ancienne fiche', edit: jest.fn().mockResolvedValue(undefined), author: { id: 'bot' } }
    const forum = { type: ChannelType.GuildForum, availableTags: [], guildId: GUILD }
    const client = { user: { id: 'bot' }, channels: { fetch: jest.fn().mockResolvedValue(forum) } }
    const thread = {
      id: QUEST, parentId: FORUM, appliedTags: [], name: '📜 Détruire le monde', client,
      isThread: () => true, archived: false, createdTimestamp: Date.now(),
      setName: jest.fn().mockImplementation(async (name: string) => { thread.name = name }),
      fetchStarterMessage: jest.fn().mockResolvedValue(starter),
    }
    const makeCommand = (icone: string) => ({
      commandName: 'changer-icone-quete', channel: thread, channelId: QUEST, guildId: GUILD, client,
      options: { getString: jest.fn().mockReturnValue(icone) },
      deferReply: jest.fn().mockResolvedValue(undefined),
      reply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined),
    })
    const first = makeCommand('🐸')
    await service.changeQuestIconCommand(first as never)
    expect(stored.replaceQuestIcon).toHaveBeenCalledWith(QUEST, '🐸')
    expect(thread.name).toBe('🐸 Détruire le monde')
    expect(starter.edit.mock.calls[0][0].content).toContain('Une porte mystérieuse')
    expect(starter.edit.mock.calls[0][0].content).toContain('Grande Loge')
    expect(first.editReply).toHaveBeenCalledWith(expect.stringContaining('🐸'))
    expect(stored.saveDiscordQuestSnapshots).toHaveBeenCalledWith([
      expect.objectContaining({ id: QUEST, title: '🐸 Détruire le monde' }),
    ])
    const second = makeCommand('👻')
    await service.changeQuestIconCommand(second as never)
    expect(thread.name).toBe('👻 Détruire le monde')
    expect(stored.replaceQuestIcon).toHaveBeenLastCalledWith(QUEST, '👻')
  })

  it.each(['grenouille', '🐸👻', '<:frog:123456789012345678>'])(
    'refuses invalid icon %s and leaves the database unchanged',
    async badIcon => {
      const { service, stored } = setup()
      const reply = jest.fn().mockResolvedValue(undefined)
      await service.changeQuestIconCommand({
        options: { getString: () => badIcon }, reply,
      } as never)
      expect(reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('un seul emoji Unicode'), ephemeral: true,
      }))
      expect(stored.replaceQuestIcon).not.toHaveBeenCalled()
    },
  )

  it('rejects an obsolete quest and a discussion not created by the bot', async () => {
    const { service, stored } = setup()
    const forum = { type: ChannelType.GuildForum, availableTags: [{ id: 'obsolete', name: 'obsolète' }], guildId: GUILD }
    const client = { user: { id: 'bot' }, channels: { fetch: jest.fn().mockResolvedValue(forum) } }
    const channel = {
      id: QUEST, parentId: FORUM, appliedTags: ['obsolete'], client, isThread: () => true,
    }
    const editReply = jest.fn().mockResolvedValue(undefined)
    const command = {
      channel, channelId: QUEST, guildId: GUILD, client, options: { getString: () => '🐸' },
      deferReply: jest.fn().mockResolvedValue(undefined), editReply,
    }
    await service.changeQuestIconCommand(command as never)
    expect(editReply).toHaveBeenCalledWith(expect.stringContaining('obsolète'))
    expect(stored.replaceQuestIcon).not.toHaveBeenCalled()
    channel.appliedTags = []
    stored.questUi.mockResolvedValue(null)
    await service.changeQuestIconCommand(command as never)
    expect(editReply).toHaveBeenCalledWith(expect.stringContaining('créée par le bot'))
    expect(stored.replaceQuestIcon).not.toHaveBeenCalled()
  })

})
