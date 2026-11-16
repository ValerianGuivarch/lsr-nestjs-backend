import { choiceCatalogue, choiceModuleKey, Pf2ChoiceLibreController, Pf2ChoiceLibreService } from './Pf2ChoiceLibre'
import { ForbiddenException } from '@nestjs/common'

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
  it('requires a configured correct private MJ key', () => {
    const old=process.env.PF2_CHOICE_MJ_KEY
    try {
      const controller=new Pf2ChoiceLibreController({snapshot:()=>({ok:true})} as unknown as Pf2ChoiceLibreService)
      delete process.env.PF2_CHOICE_MJ_KEY
      expect(()=>controller.list('')).toThrow(ForbiddenException)
      process.env.PF2_CHOICE_MJ_KEY='test-only'
      expect(()=>controller.list('test-wrong')).toThrow(ForbiddenException)
      expect(controller.list('test-only')).toEqual({ok:true})
    } finally {
      if(old===undefined)delete process.env.PF2_CHOICE_MJ_KEY
      else process.env.PF2_CHOICE_MJ_KEY=old
    }
  })
})
