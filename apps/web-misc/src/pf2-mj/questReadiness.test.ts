import { describe, expect, it } from 'vitest'
import { questBlocked, questNeedsPreparation, questPlayable, questPreparationLabel, type QuestState } from './questReadiness'
import type { ModuleState } from './moduleReadiness'

const base: QuestState = {nature:'mission',blocked:false,personal:false,characterIds:[],dependsOnQuestId:'',dependencyBlocked:false,dependencyCompleted:false,moduleKey:''}
const module: ModuleState = {key:'m',scenarioId:'s',componentId:'',campaignIds:['c'],order:0,campaignOrder:{c:0},title:'Module',checklist:{source:'done',template:'done',entities:'done',foundry:'done',review:'done'},progress:'todo',ready:true,hasTemplate:true}
describe('Quest readiness',()=>{
  it('requires a module on a mission but not on an optional personal RP lead',()=>{
    expect(questNeedsPreparation(base)).toBe(true)
    const personal: QuestState={...base,nature:'rp',personal:true,characterIds:['a','b']}
    expect(questNeedsPreparation(personal)).toBe(false)
    expect(questPlayable(personal)).toBe(false)
    expect(questPreparationLabel(personal)).toContain('facultatif')
    expect(questPlayable({...personal,moduleKey:'m'},module)).toBe(true)
    expect(questNeedsPreparation({...personal,moduleKey:'m'},{...module,ready:false})).toBe(true)
  })
  it('does not count a blocked or dependent quest as playable or urgent',()=>{
    const blocked={...base,moduleKey:'m',blocked:true}
    expect(questPlayable(blocked,module)).toBe(false)
    expect(questNeedsPreparation(blocked,module)).toBe(false)
    const dependent:QuestState={...base,nature:'dependent',dependsOnQuestId:'x',dependencyBlocked:true}
    expect(questBlocked(dependent)).toBe(true)
    expect(questNeedsPreparation(dependent)).toBe(false)
    expect(questPlayable({...dependent,dependencyBlocked:false,moduleKey:'m'},module)).toBe(false)
  })
  it('does not mistake a completed or incomplete module for a playable one',()=>{
    const q={...base,moduleKey:'m'}
    expect(questPlayable(q,{...module,progress:'done'})).toBe(false)
    expect(questNeedsPreparation(q,{...module,progress:'done'})).toBe(true)
    expect(questPlayable(q,{...module,hasTemplate:false})).toBe(false)
  })
})
