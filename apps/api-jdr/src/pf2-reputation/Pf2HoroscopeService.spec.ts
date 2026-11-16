import { DataSource } from 'typeorm'
import { cosmicSign, Pf2HoroscopeService } from './Pf2HoroscopeService'
import { Pf2RelationService } from './Pf2RelationService'

describe('Caravane cosmique', () => {
  it.each([
    [12,18,'La Grive'], [1,20,'La Grive'], [1,21,'Le Porteur de lanterne'],
    [2,16,'Le Porteur de lanterne'], [2,17,'Les Jeunes Mariés'],
    [3,12,'Le Pont'], [4,19,'La Fille'], [5,14,'Le Cavalier'],
    [6,21,'Le Patriarche'], [7,21,'Le Chariot'], [8,11,'La Meute'],
    [9,17,'La Mère'], [10,30,'La Mère'], [10,31,'L’Observateur des étoiles'],
    [11,20,'L’Observateur des étoiles'], [11,21,'L’Étranger'],
    [11,29,'L’Étranger'], [11,30,'Le Suiveur'], [12,17,'Le Suiveur'],
  ])('maps %i/%i to %s', (month,day,sign) => {
    expect(cosmicSign(month,day).sign).toBe(sign)
  })
})

describe('Horoscope permissions and storage', () => {
  let db: DataSource
  let service: Pf2HoroscopeService
  const eryn = 'npc_pj_eryn'
  const pepin = 'npc_pj_pepin'
  const roll = {targetNpcId:pepin,month:2,day:17,year:'',roll:24}
  beforeEach(async () => {
    db = new DataSource({type:'sqlite',database:':memory:',entities:[],synchronize:false})
    await db.initialize()
    await db.query('CREATE TABLE pf2_player_character_profile(npc_id TEXT PRIMARY KEY, display_name TEXT, is_player INTEGER, is_published INTEGER, wiki_portrait_filename TEXT)')
    await db.query('CREATE TABLE pf2_player_character_owner(npc_id TEXT, discord_user_id TEXT)')
    await db.query('CREATE TABLE pf2_wiki_account_link(discord_user_id TEXT, wiki_username TEXT)')
    await db.query('CREATE TABLE pf2_player_character_contact(player_npc_id TEXT,contact_npc_id TEXT,portrait_known INTEGER)')
    await db.query("INSERT INTO pf2_player_character_profile VALUES (?, 'Eryn',1,1,'eryn.webp'), (?, 'Pépin',1,1,'pepin.webp'), ('hidden','Secret',0,0,'secret.webp'), ('contact','Contact',0,0,'contact.webp')",[eryn,pepin])
    await db.query("INSERT INTO pf2_player_character_owner VALUES (?,'discord1'), (?,'discord2')",[eryn,pepin])
    await db.query("INSERT INTO pf2_wiki_account_link VALUES ('discord1','Owner'),('discord2','Other')")
    await db.query("INSERT INTO pf2_player_character_contact VALUES (?,'contact',0)",[eryn])
    service = new Pf2HoroscopeService(db)
    await service.onModuleInit()
  })
  afterEach(async () => { await db.destroy() })
  it('restricts the feature to Eryn and her owner or admin', async () => {
    await expect(service.list(pepin,'Other',true)).rejects.toThrow()
    await expect(service.save(eryn,roll,'Other',false)).rejects.toThrow()
    await expect(service.list(eryn,'Admin',true)).resolves.toBeDefined()
    await expect(new Pf2RelationService(db).list(eryn,'Admin',true)).rejects.toThrow()
  })
  it('keeps one record per known target, ordered by initial entry', async () => {
    await service.save(eryn,roll,'owner',false)
    await service.save(eryn,{...roll,targetNpcId:'contact'},'Owner',false)
    const result=await service.save(eryn,{...roll,roll:29},'Owner',false)
    expect(result.horoscopes).toMatchObject([{npcId:pepin,roll:29,sign:'Les Jeunes Mariés',portrait:'pepin.webp'},{npcId:'contact',portrait:null}])
    expect(result.candidates.some(c=>c.npcId==='hidden')).toBe(false)
    await expect(service.save(eryn,{...roll,targetNpcId:'hidden'},'Owner',false)).rejects.toThrow()
    await expect(service.save(eryn,{...roll,day:30},'Owner',false)).rejects.toThrow()
  })
  it('edits all fields and deletes only with permission', async () => {
    const saved=await service.save(eryn,{...roll,interpretation:'Un présage'},'Owner',false)
    const id=saved.horoscopes[0].id
    expect(saved.horoscopes[0].interpretation).toBe('Un présage')
    const edited=await service.save(eryn,{...roll,id,targetNpcId:'contact',month:11,day:30,roll:31,interpretation:'Autre'},'Owner',false)
    expect(edited.horoscopes).toMatchObject([{id,npcId:'contact',sign:'Le Suiveur',roll:31,interpretation:'Autre'}])
    await expect(service.save(eryn,{operation:'delete',id},'Other',false)).rejects.toThrow()
    expect((await service.save(eryn,{operation:'delete',id},'Owner',false)).horoscopes).toEqual([])
  })
})
