import { DataSource } from 'typeorm'
import { Pf2PersistenceService } from './Pf2PersistenceService'

describe('Discord quest recap persistence', () => {
  let database: DataSource
  let store: Pf2PersistenceService

  beforeEach(async () => {
    database = new DataSource({ type: 'sqlite', database: ':memory:' })
    await database.initialize()
    await database.query('CREATE TABLE pf2_discord_quest_recap (thread_id TEXT NOT NULL, guild_id TEXT NOT NULL, session_date TEXT NOT NULL, part_index INTEGER NOT NULL CHECK(part_index >= 0), message_id TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(thread_id, part_index))')
    store = new Pf2PersistenceService(database)
  })
  afterEach(async () => { await database.destroy() })

  it('replaces all tracked messages atomically on explicit repost, including fewer parts', async () => {
    const old = [
      { threadId: 'session-1', guildId: 'guild', sessionDate: '2026-11-05', partIndex: 0, messageId: 'm1' },
      { threadId: 'session-1', guildId: 'guild', sessionDate: '2026-11-05', partIndex: 1, messageId: 'm2' },
    ]
    for (const part of old) await store.saveQuestRecapPart(part)
    const newer = [{ ...old[0], messageId: 'm3' }]
    await expect(store.replaceQuestRecapParts('session-1', ['wrong', 'm2'], newer))
      .rejects.toThrow('a changé')
    expect((await store.questRecapParts('session-1')).map(p => p.messageId)).toEqual(['m1', 'm2'])

    await store.replaceQuestRecapParts('session-1', ['m1', 'm2'], newer)
    expect(await store.questRecapParts('session-1')).toEqual(newer)
    expect((await store.upcomingQuestRecapSessions('2026-11-05')).map(p => p.threadId))
      .toEqual(['session-1'])

    // A unique-message-ID SQL error must roll back the DELETE, preserving m3.
    await store.saveQuestRecapPart({
      threadId: 'session-2', guildId: 'guild', sessionDate: '2026-11-06',
      partIndex: 0, messageId: 'other-session',
    })
    await expect(store.replaceQuestRecapParts('session-1', ['m3'], [
      { ...newer[0], messageId: 'other-session' },
    ])).rejects.toThrow()
    expect(await store.questRecapParts('session-1')).toEqual(newer)
  })

  it('tracks message IDs, multiple chunks, updates and sessions through the end of their calendar day', async () => {
    await store.saveQuestRecapPart({ threadId: 'session-1', guildId: 'guild', sessionDate: '2026-11-03', partIndex: 0, messageId: 'm1' })
    await store.saveQuestRecapPart({ threadId: 'session-1', guildId: 'guild', sessionDate: '2026-11-03', partIndex: 1, messageId: 'm2' })
    await store.saveQuestRecapPart({ threadId: 'session-2', guildId: 'guild', sessionDate: '2026-11-05', partIndex: 0, messageId: 'm3' })
    expect((await store.questRecapParts('session-1')).map(row => row.messageId)).toEqual(['m1', 'm2'])
    await store.saveQuestRecapPart({ threadId: 'session-1', guildId: 'guild', sessionDate: '2026-11-03', partIndex: 0, messageId: 'm1b' })
    expect((await store.questRecapParts('session-1')).map(row => row.messageId)).toEqual(['m1b', 'm2'])
    expect((await store.upcomingQuestRecapSessions('2026-11-03')).map(row => row.threadId)).toEqual(['session-1', 'session-2'])
    expect((await store.upcomingQuestRecapSessions('2026-11-04')).map(row => row.threadId)).toEqual(['session-2'])
    expect((await store.upcomingQuestRecapSessions('2026-11-05')).map(row => row.threadId)).toEqual(['session-2'])
    expect(await store.upcomingQuestRecapSessions('2026-11-06')).toEqual([])
  })
})
