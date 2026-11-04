import { PF2_TREASURE_BY_LEVEL, sessionTreasureAid } from './Pf2SessionTreasureAid'

describe('PF2 GM Core party treasure, adapted to session participants', () => {
  it('uses the exact GM Core four-PC level reference across levels 1–20', () => {
    expect(Object.keys(PF2_TREASURE_BY_LEVEL)).toHaveLength(20)
    expect(PF2_TREASURE_BY_LEVEL[1]).toEqual({ totalGp: 175, currencyGp: 40 })
    expect(PF2_TREASURE_BY_LEVEL[2]).toEqual({ totalGp: 300, currencyGp: 70 })
    expect(PF2_TREASURE_BY_LEVEL[3]).toEqual({ totalGp: 500, currencyGp: 120 })
    expect(PF2_TREASURE_BY_LEVEL[4]).toEqual({ totalGp: 850, currencyGp: 200 })
    expect(PF2_TREASURE_BY_LEVEL[10]).toEqual({ totalGp: 8000, currencyGp: 2000 })
    expect(PF2_TREASURE_BY_LEVEL[20]).toEqual({ totalGp: 490000, currencyGp: 140000 })
    for (const row of Object.values(PF2_TREASURE_BY_LEVEL)) {
      expect(row.totalGp).toBeGreaterThan(row.currencyGp)
    }
  })

  it('provides the approved 2/2/4/4 example: 54 gp cash and 230 gp total per session', () => {
    const result = sessionTreasureAid([
      { actorUuid: 'a', level: 2 },
      { actorUuid: 'b', level: 2 },
      { actorUuid: 'c', level: 4 },
      { actorUuid: 'd', level: 4 },
    ])
    expect(result.currencyBudgetGp).toBe(54)
    expect(result.totalBudgetGp).toBe(230)
    expect(result.equipmentBudgetGp).toBe(176)
    expect(result.currencyPerPlayerGp).toBe(13.5)
    expect(result.totalPerPlayerGp).toBe(57.5)
    expect(result.partySizeFactor).toBe(1)
    expect(result.unsupportedLevels).toEqual([])
    expect(result.participants.map(x => x.currencyPerLevelGp)).toEqual([70, 70, 200, 200])
  })

  it('calculates the official four-PC level-1 budget for 2.5 sessions', () => {
    const result = sessionTreasureAid('abcd'.split('').map(actorUuid => ({ actorUuid, level: 1 })))
    expect(result.currencyBudgetGp).toBe(16)
    expect(result.totalBudgetGp).toBe(70)
    expect(result.equipmentBudgetGp).toBe(54)
  })

  it('also handles a mixed 1/2/2/3 group', () => {
    const result = sessionTreasureAid([1, 2, 2, 3].map((level, i) => ({ level, actorUuid: String(i) })))
    expect(result.currencyBudgetGp).toBe(30)
    expect(result.totalBudgetGp).toBe(127.5)
  })

  it('scales non-four-person groups proportionally as an explicit house approximation', () => {
    const three = sessionTreasureAid([1, 2, 3].map((_, i) => ({ actorUuid: String(i), level: 2 })))
    const five = sessionTreasureAid([1, 2, 3, 4, 5].map((_, i) => ({ actorUuid: String(i), level: 2 })))
    expect(three.partySizeFactor).toBe(0.75)
    expect(three.currencyBudgetGp).toBe(21)
    expect(three.totalBudgetGp).toBe(90)
    expect(five.partySizeFactor).toBe(1.25)
    expect(five.currencyBudgetGp).toBe(35)
    expect(five.totalBudgetGp).toBe(150)
  })

  it('does not invent a budget when attendance is empty', () => {
    const result = sessionTreasureAid([])
    expect(result.currencyBudgetGp).toBeNull()
    expect(result.totalBudgetGp).toBeNull()
    expect(result.equipmentBudgetGp).toBeNull()
    expect(result.unsupportedLevels).toEqual([])
  })

  it('does not extrapolate beyond level 20 or silently ignore uncovered levels', () => {
    const result = sessionTreasureAid([{ actorUuid: 'a', level: 20 }, { actorUuid: 'b', level: 21 }])
    expect(result.currencyBudgetGp).toBeNull()
    expect(result.totalBudgetGp).toBeNull()
    expect(result.unsupportedLevels).toEqual([21])
    expect(result.participants).toHaveLength(1)
  })
})
