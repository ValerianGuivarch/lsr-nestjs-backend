import { describe, expect, it } from 'vitest'
import { isJournalStatusVisible, isStandaloneCampaign, legacy, type PlayableUnit } from './catalogue'

describe('Journal MJ',()=>{
  it('affiche les intégrés à venir et en cours, sans les terminés par défaut',()=>{
    expect(['to_play','in_progress','played','untracked','retained','later','rejected'].filter(s=>isJournalStatusVisible(s,false,false))).toEqual(['to_play','in_progress'])
  })
  it('filtre En cours et permet de réafficher les terminés indépendamment',()=>{
    expect(['to_play','in_progress','played','later'].filter(s=>isJournalStatusVisible(s,true,true))).toEqual(['in_progress','played'])
    expect(isJournalStatusVisible('played',false,true)).toBe(true)
    expect(isJournalStatusVisible('rejected',false,true)).toBe(false)
  })
  it('regroupe un livre de mini-campagne en conservant le scénario existant',()=>{
    const id='test-single-book'
    legacy.rawEntryMap.set(id,{id,parts:[{kind:'compilation_campagne'}]} as never)
    try{
      expect(isStandaloneCampaign({id,legacyEntryId:id} as PlayableUnit)).toBe(true)
      expect(isStandaloneCampaign({id:'episode',legacyEntryId:id} as PlayableUnit)).toBe(false)
    }finally{legacy.rawEntryMap.delete(id)}
  })
})
