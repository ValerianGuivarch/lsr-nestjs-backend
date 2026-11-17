import { DataSource } from 'typeorm'
import { claimSessionCoinAward, enqueueSessionCoins, finishSessionCoinAward, listSessionCoinAwards, migrateSessionCoinAwards, requireCoinWorld } from './SessionCoinAwards'

describe('durable session coin awards',()=>{
  const id='5efb95f7-5ef8-438c-a984-9a4bdff0c273'
  const coins={gp:7,sp:3,cp:2}
  let db:DataSource
  beforeEach(async()=>{
    db=await new DataSource({type:'sqlite',database:':memory:'}).initialize()
    await db.query('CREATE TABLE pf2_session(id TEXT PRIMARY KEY)')
    await db.query('INSERT INTO pf2_session(id) VALUES(?)',[id])
    await migrateSessionCoinAwards(db.manager)
  })
  afterEach(async()=>{await db.destroy()})
  it('queues exactly one immutable reward per participant; no queue for zero coins',async()=>{
    await enqueueSessionCoins(db.manager,id,['Actor.hero','Actor.hero','Actor.other'],{gp:0,sp:0,cp:0})
    expect(await listSessionCoinAwards(db)).toEqual([])
    await enqueueSessionCoins(db.manager,id,['Actor.hero','Actor.hero','Actor.other'],coins)
    await enqueueSessionCoins(db.manager,id,['Actor.hero','Actor.other'],{gp:999,sp:0,cp:0})
    expect(await listSessionCoinAwards(db)).toEqual([
      expect.objectContaining({actorUuid:'Actor.hero',coins,status:'pending'}),
      expect.objectContaining({actorUuid:'Actor.other',coins,status:'pending'}),
    ])
  })
  it('claims only once even concurrently; never auto-reclaims an ambiguous job',async()=>{
    await enqueueSessionCoins(db.manager,id,['Actor.hero'],coins)
    const results=await Promise.all([claimSessionCoinAward(db,id,'Actor.hero'),claimSessionCoinAward(db,id,'Actor.hero')])
    const claimed=results.filter(Boolean)
    expect(claimed).toHaveLength(1)
    const token=claimed[0]!.token
    expect(await listSessionCoinAwards(db)).toEqual([expect.objectContaining({status:'applying'})])
    await db.query("UPDATE pf2_session_coin_award SET updated_at='2000-01-01 00:00:00'")
    expect(await claimSessionCoinAward(db,id,'Actor.hero')).toBeNull()
    await finishSessionCoinAward(db,token,'review')
    expect(await claimSessionCoinAward(db,id,'Actor.hero')).toBeNull()
    await finishSessionCoinAward(db,token,'applied')
    await finishSessionCoinAward(db,token,'applied') // lost ACK
    expect(await listSessionCoinAwards(db)).toEqual([])
    expect(await claimSessionCoinAward(db,id,'Actor.hero')).toBeNull()
    await expect(finishSessionCoinAward(db,token,'review')).rejects.toThrow()
  })
  it('confines work to the campaign world and flags invalid actor IDs',async()=>{
    expect(()=>requireCoinWorld('other-world')).toThrow()
    expect(()=>requireCoinWorld('test-pf2')).not.toThrow()
    await enqueueSessionCoins(db.manager,id,['Compendium.foo'],coins)
    expect(await listSessionCoinAwards(db)).toEqual([expect.objectContaining({status:'review'})])
    await expect(claimSessionCoinAward(db,id,'Compendium.foo')).rejects.toThrow()
  })
})
