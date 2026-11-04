import { DataSource } from 'typeorm'
import { Pf2ReputationService } from './Pf2ReputationService'

const SESSION_ID = '5efb95f7-5ef8-438c-a984-9a4bdff0c273'

describe('session reputation deltas (not absolute scores)', () => {
  let db: DataSource
  let service: Pf2ReputationService

  beforeEach(async () => {
    db = new DataSource({ type:'sqlite', database:':memory:', entities:[], synchronize:false })
    await db.initialize()
    await db.query('CREATE TABLE pf2_reputation (id INTEGER PRIMARY KEY, score INTEGER NOT NULL CHECK(score BETWEEN -50 AND 50))')
    await db.query('CREATE TABLE pf2_reputation_history (id INTEGER PRIMARY KEY AUTOINCREMENT, reputation_id INTEGER, previous_score INTEGER, new_score INTEGER, delta INTEGER, reason TEXT)')
    await db.query('INSERT INTO pf2_reputation (id,score) VALUES (11,12),(12,-49),(13,7)')
    service = new Pf2ReputationService(db)
  })

  afterEach(async () => { await db.destroy() })

  it('applies +3/-2, records history and never duplicates when retried', async () => {
    await service.applySessionDeltas([{id:11,delta:3},{id:13,delta:-2}],SESSION_ID)
    await service.applySessionDeltas([{id:11,delta:3},{id:13,delta:-2}],SESSION_ID)
    expect(await db.query('SELECT id,score FROM pf2_reputation ORDER BY id')).toEqual([
      {id:11,score:15},{id:12,score:-49},{id:13,score:5},
    ])
    const history = await db.query('SELECT reputation_id,previous_score,new_score,delta,reason FROM pf2_reputation_history ORDER BY reputation_id')
    expect(history).toEqual([
      {reputation_id:11,previous_score:12,new_score:15,delta:3,reason:'fin-seance:'+SESSION_ID},
      {reputation_id:13,previous_score:7,new_score:5,delta:-2,reason:'fin-seance:'+SESSION_ID},
    ])
  })

  it('rolls back all reputation changes if one faction would exceed its bounds', async () => {
    await expect(service.applySessionDeltas([{id:11,delta:3},{id:12,delta:-3}],SESSION_ID)).rejects.toThrow(/hors limites/)
    expect(await db.query('SELECT score FROM pf2_reputation WHERE id=11')).toEqual([{score:12}])
    expect(await db.query('SELECT count(*) AS amount FROM pf2_reputation_history')).toEqual([{amount:0}])
  })

  it('rejects duplicate faction IDs and invalid sessions', async () => {
    await expect(service.applySessionDeltas([{id:11,delta:1},{id:11,delta:1}],SESSION_ID)).rejects.toThrow(/répétée/)
    await expect(service.applySessionDeltas([{id:11,delta:1}],'session-number-7')).rejects.toThrow(/invalide/)
  })
})
