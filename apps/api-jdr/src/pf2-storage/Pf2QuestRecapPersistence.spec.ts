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

  it('tracks message IDs, multiple chunks, updates and strictly future sessions', async () => {
    await store.saveQuestRecapPart({ threadId: 'session-1', guildId: 'guild', sessionDate: '2026-11-03', partIndex: 0, messageId: 'm1' })
    await store.saveQuestRecapPart({ threadId: 'session-1', guildId: 'guild', sessionDate: '2026-11-03', partIndex: 1, messageId: 'm2' })
    await store.saveQuestRecapPart({ threadId: 'session-2', guildId: 'guild', sessionDate: '2026-11-05', partIndex: 0, messageId: 'm3' })
    expect((await store.questRecapParts('session-1')).map(row => row.messageId)).toEqual(['m1', 'm2'])
    await store.saveQuestRecapPart({ threadId: 'session-1', guildId: 'guild', sessionDate: '2026-11-03', partIndex: 0, messageId: 'm1b' })
    expect((await store.questRecapParts('session-1')).map(row => row.messageId)).toEqual(['m1b', 'm2'])
    expect((await store.upcomingQuestRecapSessions('2026-11-03')).map(row => row.threadId)).toEqual(['session-2'])
    expect((await store.upcomingQuestRecapSessions('2026-11-04')).map(row => row.threadId)).toEqual(['session-2'])
    expect(await store.upcomingQuestRecapSessions('2026-11-05')).toEqual([])
  })
})
