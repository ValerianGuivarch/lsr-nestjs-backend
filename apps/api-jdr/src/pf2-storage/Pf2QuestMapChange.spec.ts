import { DataSource } from 'typeorm'
import { Pf2PersistenceService } from './Pf2PersistenceService'

const QUEST = '1565017298668888206'
const SECOND = '1565017298668888207'
const PLACE = 'community-port'

describe('Quest location synchronization from the map', () => {
  let dataSource: DataSource
  let persistence: Pf2PersistenceService

  beforeEach(async () => {
    dataSource = new DataSource({ type: 'sqlite', database: ':memory:' })
    await dataSource.initialize()
    await dataSource.query("CREATE TABLE pf2_record (kind TEXT NOT NULL, id TEXT NOT NULL, name TEXT, payload TEXT NOT NULL, updated_at TEXT, PRIMARY KEY(kind, id))")
    await dataSource.query("CREATE TABLE pf2_discord_quest (thread_id TEXT PRIMARY KEY, title TEXT, obsolete INTEGER DEFAULT 0)")
    await dataSource.query("CREATE TABLE pf2_map_place_quest (place_id TEXT, thread_id TEXT, legacy_name TEXT, PRIMARY KEY(place_id,thread_id))")
    await dataSource.query("CREATE TABLE pf2_quest_ui (thread_id TEXT PRIMARY KEY, kind TEXT, description TEXT)")
    await dataSource.query("INSERT INTO pf2_discord_quest (thread_id,title) VALUES (?,?)", [QUEST,'📜 Détruire le monde'])
    await dataSource.query("INSERT INTO pf2_discord_quest (thread_id,title) VALUES (?,?)", [SECOND,'Autre quête'])
    await dataSource.query("INSERT INTO pf2_record(kind,id,name,payload) VALUES ('lieu',?,?,?)",
      [PLACE,'Port de la fin du monde',JSON.stringify({
        id: PLACE, nom: 'Port de la fin du monde', map_visible: true,
        map_kind: 'quest', map_origin: 'pj',
      })])
    await dataSource.query("INSERT INTO pf2_quest_ui(thread_id,kind,description) VALUES (?,'quest','Description')", [QUEST])
    persistence = new Pf2PersistenceService(dataSource)
  })

  afterEach(async () => { await dataSource.destroy() })

  it('offers a visible newly created community location in the Discord location catalogue', async () => {
    // Scenario exclusions are irrelevant to a global map place.
    jest.spyOn(persistence, 'listRecords').mockResolvedValue([
      { id: PLACE, nom: 'Port de la fin du monde', map_visible: true, scope: 'global' },
    ])
    expect(await persistence.questUiPlaces(QUEST)).toContainEqual({
      id: PLACE, name: 'Port de la fin du monde',
    })
  })

  it('emits old and new quest IDs only after a map association commits', async () => {
    const notified = jest.fn().mockResolvedValue(undefined)
    const unsubscribe = persistence.onQuestMapLinksChanged(notified)
    await persistence.setMapQuestLinks(PLACE,[QUEST])
    await new Promise(resolve => setImmediate(resolve))
    expect(notified).toHaveBeenCalledWith([QUEST])
    expect(await persistence.questUiLinkedPlaceIds(QUEST)).toEqual([PLACE])
    notified.mockClear()
    await persistence.setMapQuestLinks(PLACE,[SECOND])
    await new Promise(resolve => setImmediate(resolve))
    expect(notified).toHaveBeenCalledWith([QUEST,SECOND])
    expect(await persistence.questUiLinkedPlaceIds(QUEST)).toEqual([])
    unsubscribe()
    notified.mockClear()
    await persistence.clearMapQuestLinks(PLACE)
    await new Promise(resolve => setImmediate(resolve))
    expect(notified).not.toHaveBeenCalled()
  })

  it('notifies on location rename and deletion without removing the quest', async () => {
    await persistence.setMapQuestLinks(PLACE,[QUEST])
    const notified = jest.fn().mockResolvedValue(undefined)
    persistence.onQuestMapLinksChanged(notified)
    await persistence.updateCommunityMapPlace(PLACE,{ nom: 'Port renommé' })
    await new Promise(resolve => setImmediate(resolve))
    expect(notified).toHaveBeenCalledWith([QUEST])
    notified.mockClear()
    await persistence.updateCommunityMapPlace(PLACE,null)
    await new Promise(resolve => setImmediate(resolve))
    expect(notified).toHaveBeenCalledWith([QUEST])
    expect(await persistence.questUiLinkedPlaceIds(QUEST)).toEqual([])
  })
})
