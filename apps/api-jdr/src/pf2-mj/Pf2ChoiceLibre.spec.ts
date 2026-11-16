import { choiceCatalogue, choiceModuleKey, Pf2ChoiceLibreController, Pf2ChoiceLibreService } from './Pf2ChoiceLibre'

describe('Choix libre catalogue', () => {
  it('flattens campaign parts, independent stories and transverse arcs without duplicating modules', () => {
    const entries = [
      {id:'campaign',kind:'campaign',titleFr:'Campagne',parts:[{id:'chapter',kind:'volume_aventure',titleFr:'Partie',playableComponents:[{id:'component',titleFr:'Module'}]}]},
      {id:'pfs',kind:'pfs-scenario',titleFr:'PFS'},
      {id:'bounty-ignore',kind:'bounty'},
    ]
    const result=choiceCatalogue(entries,[{id:'arc',titleFr:'Arc',entryIds:['pfs']}])
    expect(result.modules).toHaveLength(2)
    expect(result.modules.find(m=>m.key===choiceModuleKey('chapter','component'))).toMatchObject({campaignIds:['campaign'],title:'Module',group:'Partie'})
    expect(result.modules.find(m=>m.key===choiceModuleKey('pfs'))).toMatchObject({campaignIds:['pfs','arc']})
  })
  it('keeps a simple scenario with explicit components instead of creating a second synthetic module', () => {
    expect(choiceCatalogue([{id:'one',playableComponents:[{id:'a',title:'A'}]}],[]).modules.map(m=>m.key)).toEqual([choiceModuleKey('one','a')])
  })
  it('does not duplicate an adventure source placeholder when explicit modules exist', () => {
    const result=choiceCatalogue([{id:'a',kind:'adventure',playableComponents:[{id:'m',title:'Module'}],parts:[{id:'a-main',kind:'aventure_autonome'}]}],[])
    expect(result.modules.map(m=>m.key)).toEqual([choiceModuleKey('a','m')])
  })
  it('saves a standalone template without creating a session', async () => {
    const query=jest.fn().mockResolvedValue([])
    const service=new Pf2ChoiceLibreService({query} as never, {} as never)
    jest.spyOn(service,'catalogue').mockResolvedValue(choiceCatalogue([{id:'a'}],[]))
    const moduleKey=choiceModuleKey('a')
    const body={summary:'Préparation',stages:[{id:'s',title:'Étape',blocks:[{id:'recap',kind:'texte',title:'Récapitulatif',text:'Contexte et déroulé'},{id:'b',kind:'lore',text:'Secret'}]}]}
    await expect(service.saveTemplate({moduleKey,body})).resolves.toEqual({ok:true})
    await expect(service.saveTemplate({moduleKey,body:{stages:[{id:'s',title:'Étape',blocks:[]}]}})).rejects.toThrow('Récapitulatif')
    expect(query).toHaveBeenCalledTimes(1)
    expect(query.mock.calls[0][0]).toContain('pf2_choice_template')
    expect(JSON.parse(query.mock.calls[0][1][1]).stages[0].blocks[1]).toMatchObject({kind:'lore',text:'Secret',done:false})
    await expect(service.saveTemplate({moduleKey,body:{stages:[{id:'s',title:'Étape',blocks:[{id:'s',kind:'lore'}]}]}})).rejects.toThrow('dupliqué')
  })
  it('accepts partial preparation without marking a module ready', async () => {
    const key=choiceModuleKey('a')
    const checklist={source:'done',template:'done',entities:'partial',foundry:'partial',review:'todo'}
    const query=jest.fn(async (sql:string)=>sql.includes('FROM pf2_choice_module')?[{moduleKey:key,checklist:JSON.stringify(checklist),progress:'todo'}]:[])
    const persistence={listDiscordQuests:async()=>[],listDiscordQuestVotes:async()=>[],listPlayerIdentities:async()=>[],questLauncherId:async()=>null}
    const service=new Pf2ChoiceLibreService({query} as never,persistence as never)
    jest.spyOn(service,'catalogue').mockResolvedValue(choiceCatalogue([{id:'a'}],[]))
    await expect(service.saveModule({moduleKey:key,checklist,progress:'todo'})).resolves.toEqual({ok:true})
    expect((await service.snapshot()).modules[0]).toMatchObject({ready:false,checklist})
  })
  it('uses the MJ trust model without a separate access key', () => {
    const controller=new Pf2ChoiceLibreController({snapshot:()=>({ok:true})} as unknown as Pf2ChoiceLibreService)
    expect(controller.list()).toEqual({ok:true})
  })
})
