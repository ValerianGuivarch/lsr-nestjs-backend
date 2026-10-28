import { DataSource } from 'typeorm'
import { Pf2PersistenceService } from './Pf2PersistenceService'

const QUEST = '1565017298668888206'
const OLD = '1565017298668888207'

describe('Quest reaction icon stored in SQLite', () => {
  let connection: DataSource
  let persistence: Pf2PersistenceService
  beforeEach(async () => {
    connection = new DataSource({ type: 'sqlite', database: ':memory:' })
    await connection.initialize()
    await connection.query(
      "CREATE TABLE pf2_quest_ui (thread_id TEXT PRIMARY KEY, kind TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', icon TEXT NOT NULL DEFAULT '', icon_pending INTEGER NOT NULL DEFAULT 0, icon_claim_token TEXT NOT NULL DEFAULT '')",
    )
    persistence = new Pf2PersistenceService(connection)
    await persistence.saveQuestUi(QUEST, 'quest', 'Une porte interdite', true)
    await persistence.saveQuestUi(OLD, 'quest', 'Description historique')
  })
  afterEach(async () => { await connection.destroy() })

  it('keeps existing quests finalized and new quests pending', async () => {
    expect(await persistence.questUi(QUEST)).toMatchObject({ icon: '', iconPending: true })
    expect(await persistence.questUi(OLD)).toMatchObject({ icon: '', iconPending: false })
    expect(await persistence.claimQuestIcon(OLD, '🐸')).toBe(false)
  })

  it('atomically locks the first emoji even when two players react concurrently', async () => {
    const claimed = await Promise.all([
      persistence.claimQuestIcon(QUEST, '🐸'),
      persistence.claimQuestIcon(QUEST, '🐲'),
    ])
    expect(claimed.filter(Boolean)).toHaveLength(1)
    const record = await persistence.questUi(QUEST)
    expect(record?.iconPending).toBe(false)
    expect(['🐸', '🐲']).toContain(record?.icon)
    expect(await persistence.claimQuestIcon(QUEST, '👻')).toBe(false)
    expect((await persistence.questUi(QUEST))?.icon).toBe(record?.icon)
  })
  it('overrides a finalized icon and disables a still-pending reaction choice', async () => {
    await persistence.replaceQuestIcon(QUEST, '🐸')
    expect(await persistence.questUi(QUEST)).toMatchObject({icon: '🐸', iconPending: false})
    expect(await persistence.claimQuestIcon(QUEST, '🐲')).toBe(false)
    await persistence.replaceQuestIcon(QUEST, '👻')
    expect(await persistence.questUi(QUEST)).toMatchObject({icon: '👻', iconPending: false})
    await persistence.replaceQuestIcon(OLD, '🌿')
    expect(await persistence.questUi(OLD)).toMatchObject({icon: '🌿', iconPending: false})
    await expect(persistence.replaceQuestIcon('1565017298668888299', '🐸'))
      .rejects.toThrow('pas gérée par le bot')
  })

})
