import { describe, expect, it } from 'vitest'
import { applyCatalogueSnapshot, isJournalStatusVisible, isStandaloneCampaign, legacy, playableMap, documents, type PlayableUnit } from './catalogue'
import snapshot from './data/catalogue-player.json'

describe('Journal MJ',()=>{
  it('charge tout le catalogue malgré une entrée sans parts et conserve les documents et mini-campagnes',()=>{
    const first=snapshot.entries.find(entry=>entry.kind==='adventure' && entry.id!=='crown-of-the-kobold-king')!
    const {parts: _parts, ...withoutParts}=first
    try {
      expect(()=>applyCatalogueSnapshot({...snapshot, files:[{id:'test-pdf',filename:'test.pdf',path:'test.pdf',association:{itemId:first.id}}], entries:snapshot.entries.map(entry=>entry.id===first.id?withoutParts:entry)})).not.toThrow()
      expect(playableMap.has(first.id)).toBe(true)
      expect(documents.length).toBeGreaterThan(0)
      expect(isStandaloneCampaign(playableMap.get('crown-of-the-kobold-king')!)).toBe(true)
    } finally {applyCatalogueSnapshot({})}
  })
  it('affiche les intégrés à venir et en cours, sans les terminés par défaut',()=>{
    expect(['to_play','in_progress','played','untracked','retained','later','rejected'].filter(s=>isJournalStatusVisible(s,false,false))).toEqual(['to_play','in_progress'])
  })
  it('filtre En cours et permet de réafficher les terminés indépendamment',()=>{
    expect(['to_play','in_progress','played','later'].filter(s=>isJournalStatusVisible(s,true,true))).toEqual(['in_progress','played'])
    expect(isJournalStatusVisible('played',false,true)).toBe(true)
    expect(isJournalStatusVisible('rejected',false,true)).toBe(false)
  })
  it('classe comme campagne une aventure de plus de deux séances',()=>{
    const unit={id:'test-long-adventure',legacyEntryId:'test-long-adventure',playableComponents:[{estimatedSessions:{min:3,max:4}}]} as PlayableUnit
    expect(isStandaloneCampaign(unit)).toBe(true)
    expect(isStandaloneCampaign({...unit,playableComponents:[{estimatedSessions:{min:1,max:2}}] as PlayableUnit['playableComponents']})).toBe(false)
    expect(isStandaloneCampaign({...unit,playableComponents:[{},{},{}] as PlayableUnit['playableComponents']})).toBe(false)
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
