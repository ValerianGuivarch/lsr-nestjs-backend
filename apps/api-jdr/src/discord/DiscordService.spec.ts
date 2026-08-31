import { Collection } from 'discord.js'
import { DiscordCommandsService } from './DiscordCommandsService'
import { DiscordService } from './DiscordService'
import type { Pf2Session } from '../pf2-storage/Pf2PersistenceService'

const resume = (overrides: Partial<Pf2Session> = {}): Pf2Session => ({
  id: 'resume-1', sessionNumber: 1, date: '2026-09-01', title: 'Le départ', participants: [], longSummaryAuthor: null, shortSummaryAuthor: 'Actor.valerian', sessionXp: 200, longSummaryXp: 0, shortSummaryXp: 50, longSummaryUrl: '', shortSummary: 'Les héros quittent Absalom.', discordMessageId: null, createdAt: '', updatedAt: '', ...overrides
})

describe('DiscordService summary synchronization', () => {
  const original = { token: process.env.DISCORD_BOT_TOKEN, client: process.env.DISCORD_CLIENT_ID, guild: process.env.DISCORD_GUILD_ID }

  beforeEach(() => {
    process.env.DISCORD_BOT_TOKEN = 'token'
    process.env.DISCORD_CLIENT_ID = 'client'
    process.env.DISCORD_GUILD_ID = 'guild'
  })

  afterEach(() => {
    process.env.DISCORD_BOT_TOKEN = original.token
    process.env.DISCORD_CLIENT_ID = original.client
    process.env.DISCORD_GUILD_ID = original.guild
  })

  function serviceWith(channel: Record<string, unknown>): DiscordService {
    const service = new DiscordService(new DiscordCommandsService(), { listActors: jest.fn().mockResolvedValue([]) } as never)
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
    const channel = { name: 'test', isTextBased: () => true, messages: { fetch: jest.fn().mockImplementation((value: unknown) => typeof value === 'string' ? Promise.reject(new Error('Unknown Message')) : Promise.resolve(new Collection())) }, send: jest.fn().mockResolvedValue(created) }
    const result = await serviceWith(channel).synchronizeResumeShortSummary(resume())
    expect(result).toEqual({ status: 'created', messageId: 'message-1' })
    expect(channel.send).toHaveBeenCalledTimes(1)
    expect(created.startThread).toHaveBeenCalledTimes(1)
    expect(thread.send).toHaveBeenCalledWith("N'hésitez pas à commenter ici !")
  })

  it('edits an existing Discord message without creating another thread', async () => {
    const existing = { id: 'message-1', author: { id: 'bot-1' }, content: '-# pf2-resume:resume-1', edit: jest.fn().mockResolvedValue(undefined), startThread: jest.fn() }
    const channel = { name: 'test', isTextBased: () => true, messages: { fetch: jest.fn().mockResolvedValue(existing) }, send: jest.fn() }
    const result = await serviceWith(channel).synchronizeResumeShortSummary(resume({ discordMessageId: 'message-1', shortSummary: 'Texte corrigé.' }))
    expect(result).toEqual({ status: 'updated', messageId: 'message-1' })
    expect(existing.edit).toHaveBeenCalledTimes(1)
    expect(channel.send).not.toHaveBeenCalled()
    expect(existing.startThread).not.toHaveBeenCalled()
  })

  it('recreates a deleted message and its thread after Discord confirms it is absent', async () => {
    const thread = { send: jest.fn().mockResolvedValue(undefined) }
    const created = { id: 'message-2', startThread: jest.fn().mockResolvedValue(thread) }
    const channel = { name: 'test', isTextBased: () => true, messages: { fetch: jest.fn().mockImplementation((value: unknown) => typeof value === 'string' ? Promise.reject(new Error('Unknown Message')) : Promise.resolve(new Collection())) }, send: jest.fn().mockResolvedValue(created) }
    const result = await serviceWith(channel).synchronizeResumeShortSummary(resume({ discordMessageId: 'deleted-message' }))
    expect(result).toEqual({ status: 'created', messageId: 'message-2' })
    expect(created.startThread).toHaveBeenCalledTimes(1)
  })

  it('does nothing for an empty short summary', async () => {
    const service = new DiscordService(new DiscordCommandsService(), { listActors: jest.fn().mockResolvedValue([]) } as never)
    await expect(service.synchronizeResumeShortSummary(resume({ shortSummary: '' }))).resolves.toEqual({ status: 'skipped', reason: 'Résumé court vide.' })
  })
})
