import { DataSource } from 'typeorm'
import { Pf2RelationService } from './Pf2RelationService'

describe('Carnet de contacts de Pépin', () => {
  let db: DataSource
  let service: Pf2RelationService
  const pepin = 'npc_pj_pepin'
  beforeEach(async () => {
    db = new DataSource({type:'sqlite',database:':memory:',entities:[],synchronize:false})
    await db.initialize()
    await db.query('CREATE TABLE pf2_player_character_profile(npc_id TEXT PRIMARY KEY, display_name TEXT, is_player INTEGER, is_published INTEGER, wiki_page_title TEXT)')
    await db.query('CREATE TABLE pf2_player_character_contact(player_npc_id TEXT, contact_npc_id TEXT)')
    await db.query('CREATE TABLE pf2_player_character_owner(npc_id TEXT, discord_user_id TEXT)')
    await db.query('CREATE TABLE pf2_wiki_account_link(discord_user_id TEXT, wiki_username TEXT)')
    await db.query("INSERT INTO pf2_player_character_profile VALUES (?, 'Pépin',1,1,'Pépin'), ('public','Aubergiste',0,1,'Aubergiste'), ('known','Homme aux cheveux blancs',0,0,'Inconnu'), ('hidden','Famille de Neyla',0,0,'Famille'), ('pj','Autre PJ',1,1,'PJ')",[pepin])
    await db.query("INSERT INTO pf2_player_character_contact VALUES (?,'known'), (?,'public'), ('npc_pj_neyla','hidden')",[pepin,pepin])
    await db.query("INSERT INTO pf2_player_character_owner VALUES (?,'eric')",[pepin])
    await db.query("INSERT INTO pf2_wiki_account_link VALUES ('eric','Eric')")
    service = new Pf2RelationService(db)
    await service.onModuleInit()
  })
  afterEach(async () => { await db.destroy() })

  it('lists public and personally known NPCs once, including for the GM, but excludes PCs and other private NPCs', async () => {
    const expected = [{npcId:'public',displayName:'Aubergiste'},{npcId:'known',displayName:'Homme aux cheveux blancs'}]
    expect((await service.catalog(pepin,'Eric',false)).candidates).toEqual(expected)
    expect((await service.catalog(pepin,'Admin',true)).candidates).toEqual(expected)
    await expect(service.catalog(pepin,'Other',false)).rejects.toThrow()
  })

  it('allows only visible NPC links and preserves GM-only editing', async () => {
    const contact = {operation:'create',name:'Contact',description:'',score:1}
    await expect(service.change(pepin,{...contact,linkedNpcId:'hidden'},'Admin',true)).rejects.toThrow()
    await expect(service.change(pepin,{...contact,linkedNpcId:'pj'},'Admin',true)).rejects.toThrow()
    await expect(service.change(pepin,{...contact,linkedNpcId:'public'},'Eric',false)).rejects.toThrow()
    await service.change(pepin,{...contact,linkedNpcId:'public'},'Admin',true)
    await service.change(pepin,{...contact,linkedNpcId:'known'},'Admin',true)
    expect((await service.catalog(pepin,'Eric',false)).relations.map(r=>r.linkedNpcId)).toEqual(expect.arrayContaining(['public','known']))
  })
})
