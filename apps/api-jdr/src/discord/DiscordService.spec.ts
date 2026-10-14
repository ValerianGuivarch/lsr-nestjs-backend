import { ChannelType, Collection } from 'discord.js'
import { DiscordCommandsService } from './DiscordCommandsService'
import { DiscordService } from './DiscordService'
import type { Pf2Session } from '../pf2-storage/Pf2PersistenceService'

const resume = (overrides: Partial<Pf2Session> = {}): Pf2Session => ({
  id: 'resume-1', sessionNumber: 1, date: '2026-09-01', inGameStartDate: '', inGameEndDate: '', title: 'Le départ', participants: [], longSummaryAuthor: null, shortSummaryAuthor: 'Actor.valerian', sessionXp: 200, longSummaryXp: 0, shortSummaryXp: 50, shortSummary: 'Les héros quittent Absalom.', discordMessageId: null, published: true, createdAt: '', updatedAt: '', ...overrides
})

describe('DiscordService summary synchronization', () => {
  const original = { token: process.env.DISCORD_BOT_TOKEN, client: process.env.DISCORD_CLIENT_ID, guild: process.env.DISCORD_GUILD_ID, channel: process.env.DISCORD_SUMMARIES_CHANNEL_NAME }

  beforeEach(() => {
    process.env.DISCORD_BOT_TOKEN = 'token'
    process.env.DISCORD_CLIENT_ID = 'client'
    process.env.DISCORD_GUILD_ID = 'guild'
    process.env.DISCORD_SUMMARIES_CHANNEL_NAME = 'résumés-courts'
  })

  afterEach(() => {
    process.env.DISCORD_BOT_TOKEN = original.token
    process.env.DISCORD_CLIENT_ID = original.client
    process.env.DISCORD_GUILD_ID = original.guild
    process.env.DISCORD_SUMMARIES_CHANNEL_NAME = original.channel
  })

  function serviceWith(channel: Record<string, unknown>): DiscordService {
    const service = new DiscordService(
      new DiscordCommandsService({ listSessions: jest.fn(), readFoundryActorCache: jest.fn().mockResolvedValue([]), saveFoundryActorCache: jest.fn() } as never, { listActors: jest.fn() } as never),
      { listActors: jest.fn().mockResolvedValue([]) } as never,
      { listSessions: jest.fn().mockResolvedValue([]) } as never,
    )
    const guild = {
      channels: { fetch: jest.fn().mockResolvedValue(undefined), cache: { find: (predicate: (value: unknown) => boolean) => predicate(channel) ? channel : undefined } },
      members: { fetch: jest.fn().mockResolvedValue(new Collection([['member', { user: { id: 'user-1', username: 'valerian0276' } }]])) }
    }
    ;(service as unknown as { client: unknown }).client = { user: { id: 'bot-1' }, guilds: { fetch: jest.fn().mockResolvedValue(guild) } }
    return service
  }

  it('creates one message and one thread for a new short summary', async () => {
    const thread = { send: jest.fn().mockResolvedValue(undefined) }
    const created = { id: 'message-1', startThread: jest.fn().mockResolvedValue(thread) }
    const channel = { name: 'résumés-courts', isTextBased: () => true, messages: { fetch: jest.fn().mockImplementation((value: unknown) => typeof value === 'string' ? Promise.reject(new Error('Unknown Message')) : Promise.resolve(new Collection())) }, send: jest.fn().mockResolvedValue(created) }
    const result = await serviceWith(channel).synchronizeResumeShortSummary(resume())
    expect(result).toEqual({ status: 'created', messageId: 'message-1' })
    expect(channel.send).toHaveBeenCalledTimes(1)
    expect(created.startThread).toHaveBeenCalledTimes(1)
    expect(thread.send).toHaveBeenCalledWith("N'hésitez pas à commenter ici !")
  })

  it('edits an existing Discord message without creating another thread', async () => {
    const existing = { id: 'message-1', author: { id: 'bot-1' }, content: '-# pf2-resume:resume-1', edit: jest.fn().mockResolvedValue(undefined), startThread: jest.fn() }
    const channel = { name: 'résumés-courts', isTextBased: () => true, messages: { fetch: jest.fn().mockResolvedValue(existing) }, send: jest.fn() }
    const result = await serviceWith(channel).synchronizeResumeShortSummary(resume({ discordMessageId: 'message-1', shortSummary: 'Texte corrigé.' }))
    expect(result).toEqual({ status: 'updated', messageId: 'message-1' })
    expect(existing.edit).toHaveBeenCalledTimes(1)
    expect(channel.send).not.toHaveBeenCalled()
    expect(existing.startThread).not.toHaveBeenCalled()
  })

  it('recreates a deleted message and its thread after Discord confirms it is absent', async () => {
    const thread = { send: jest.fn().mockResolvedValue(undefined) }
    const created = { id: 'message-2', startThread: jest.fn().mockResolvedValue(thread) }
    const channel = { name: 'résumés-courts', isTextBased: () => true, messages: { fetch: jest.fn().mockImplementation((value: unknown) => typeof value === 'string' ? Promise.reject(new Error('Unknown Message')) : Promise.resolve(new Collection())) }, send: jest.fn().mockResolvedValue(created) }
    const result = await serviceWith(channel).synchronizeResumeShortSummary(resume({ discordMessageId: 'deleted-message' }))
    expect(result).toEqual({ status: 'created', messageId: 'message-2' })
    expect(created.startThread).toHaveBeenCalledTimes(1)
  })

  it('does nothing for an empty short summary', async () => {
    const service = new DiscordService(
      new DiscordCommandsService({ listSessions: jest.fn(), readFoundryActorCache: jest.fn().mockResolvedValue([]), saveFoundryActorCache: jest.fn() } as never, { listActors: jest.fn() } as never),
      { listActors: jest.fn().mockResolvedValue([]) } as never,
      { listSessions: jest.fn().mockResolvedValue([]) } as never,
    )
    await expect(service.synchronizeResumeShortSummary(resume({ shortSummary: '' }))).resolves.toEqual({ status: 'skipped', reason: 'Résumé court vide.' })
  })

  it('publishes a draft through the same shared publication path used by the wiki and Discord button', async () => {
    let stored = resume({ published: false, discordMessageId: null, shortSummaryXp: 30 })
    const persistence = {
      getSession: jest.fn().mockImplementation(async () => ({ ...stored })),
      listSessions: jest.fn().mockImplementation(async () => [{ ...stored }]),
      updateSession: jest.fn().mockImplementation(async (_id: string, input: Partial<Pf2Session>) => {
        stored = { ...stored, ...input }
        return { ...stored }
      }),
      saveSessionDiscordMessageId: jest.fn().mockImplementation(async (_id: string, messageId: string) => {
        stored = { ...stored, discordMessageId: messageId }
      }),
    }
    const service = new DiscordService(
      {} as never,
      {} as never,
      persistence as never,
    )
    jest.spyOn(service, 'synchronizeResumeShortSummary').mockResolvedValue({ status: 'created', messageId: 'published-message' })

    const result = await service.setResumePublication('resume-1', true)

    expect(result.resume.published).toBe(true)
    expect(result.discord).toEqual({ status: 'created', messageId: 'published-message' })
    expect(persistence.saveSessionDiscordMessageId).toHaveBeenCalledWith('resume-1', 'published-message')
  })

  it('rolls publication back when Discord refuses the summary', async () => {
    let stored = resume({ published: false, discordMessageId: null, shortSummaryXp: 30 })
    const persistence = {
      getSession: jest.fn().mockImplementation(async () => ({ ...stored })),
      listSessions: jest.fn().mockImplementation(async () => [{ ...stored }]),
      updateSession: jest.fn().mockImplementation(async (_id: string, input: Partial<Pf2Session>) => {
        stored = { ...stored, ...input }
        return { ...stored }
      }),
      saveSessionDiscordMessageId: jest.fn(),
    }
    const service = new DiscordService({} as never, {} as never, persistence as never)
    jest.spyOn(service, 'synchronizeResumeShortSummary').mockResolvedValue({ status: 'failed', reason: 'Trop long.' })

    await expect(service.setResumePublication('resume-1', true)).rejects.toThrow('Trop long.')
    expect(stored.published).toBe(false)
  })

})


describe('Discord forum quest catalogue synchronization', () => {
  const forumId = '1536259632455094412'
  const guildId = '1535837285461004328'
  const completedTagId = 'tag-terminated'
  const threads = new Collection<string, any>([
    ['1555323732329766982', {
      id: '1555323732329766982', parentId: forumId,
      name: 'Le Cartel du Sel', appliedTags: [],
      archived: false, createdTimestamp: Date.now(),
    }],
    ['1553122329624715294', {
      id: '1553122329624715294', parentId: forumId,
      name: 'Le tueur de la rue Rose', appliedTags: [completedTagId],
      archived: true, createdTimestamp: Date.now(),
    }],
  ])

  const setup = (availableTags = [{ id: completedTagId, name: 'Terminée' }]) => {
    const persist = { saveDiscordQuestSnapshots: jest.fn().mockResolvedValue(undefined) }
    const forum = {
      id: forumId, type: ChannelType.GuildForum, guildId,
      availableTags,
      threads: {
        fetchActive: jest.fn().mockResolvedValue({ threads: new Collection([['1555323732329766982', threads.first()!]]) }),
        fetchArchived: jest.fn().mockResolvedValue({
          threads: new Collection([['1553122329624715294', threads.last()!]]), hasMore: false,
        }),
      },
    }
    const service = new DiscordService({} as never, {} as never, persist as never)
    ;(service as unknown as {client: unknown}).client = {
      isReady: () => true,
      channels: { fetch: jest.fn().mockResolvedValue(forum) },
    }
    return { service, persist, forum }
  }

  it('reads active and archived threads independently from /choix-quete', async () => {
    const { service, persist } = setup()
    await service.refreshQuestCatalogue()
    expect(persist.saveDiscordQuestSnapshots).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: '1555323732329766982', completed: false }),
      expect.objectContaining({ id: '1553122329624715294', completed: true }),
    ]))
  })

  it('preserves the stored catalogue if the completed tag is not available', async () => {
    const { service, persist } = setup([])
    await expect(service.refreshQuestCatalogue()).rejects.toThrow('Terminée')
    expect(persist.saveDiscordQuestSnapshots).not.toHaveBeenCalled()
  })

  it('reflects the relaunch when the completed tag is removed', async () => {
    const { service, persist, forum } = setup()
    await service.refreshQuestCatalogue()
    const updated = { ...threads.last(), appliedTags: [] }
    forum.threads.fetchArchived.mockResolvedValueOnce({
      threads: new Collection([[updated.id, updated]]), hasMore: false,
    })
    await service.refreshQuestCatalogue()
    const second = persist.saveDiscordQuestSnapshots.mock.calls[1][0] as Array<{id:string;completed:boolean}>
    expect(second.find(q => q.id === updated.id)?.completed).toBe(false)
  })
})
