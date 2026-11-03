import type { Pf2Session } from '../pf2-storage/Pf2PersistenceService'
import { sessionXpAid } from './Pf2SessionXpAid'

function game(number: number, participants: string[], sessionXp: number): Pf2Session {
  return {
    id: 'session-' + number,
    sessionNumber: number,
    title: 'Séance ' + number,
    date: '', inGameStartDate: '', inGameEndDate: '',
    participants,
    sessionXp,
    shortSummary: '',
    shortSummaryAuthor: null,
    longSummaryAuthor: null,
    shortSummaryXp: 0, longSummaryXp: 0,
    discordMessageId: null, published: false,
    createdAt: '', updatedAt: '',
  }
}

describe('sessionXpAid', () => {
  it('calculates 1920 group XP and 480 per player for two level 2 and two level 3', () => {
    const one = game(1, ['A', 'B', 'C', 'D'], 300)
    const two = game(2, ['C', 'D'], 600)
    const current = game(3, ['A', 'B', 'C', 'D'], 0)
    const result = sessionXpAid(current, [one, two, current], [
      { uuid: 'A', name: 'A (j)' }, { uuid: 'B', name: 'B (j)' },
      { uuid: 'C', name: 'C (j)' }, { uuid: 'D', name: 'D (j)' },
    ])
    expect(result.participants.map(p => p.level)).toEqual([2, 2, 3, 3])
    expect(result.participants.map(p => p.xpToNextLevelBand)).toEqual([600, 600, 1800, 1800])
    expect(result.averageLevel).toBe(2.5)
    expect(result.totalLevelBands).toBe(4800)
    expect(result.targetGroupXp).toBe(1920)
    expect(result.targetXpPerPlayer).toBe(480)
  })

  it('averages mixed levels 1, 2, 2, 3 and excludes XP for the current session', () => {
    const one = game(1, ['B', 'C', 'D'], 300)
    const two = game(2, ['D'], 600)
    const current = game(3, ['A', 'B', 'C', 'D'], 9000)
    const result = sessionXpAid(current, [one, two, current], [])
    expect(result.participants.map(p => p.level)).toEqual([1, 2, 2, 3])
    expect(result.totalLevelBands).toBe(3300)
    expect(result.averageLevel).toBe(2)
    expect(result.targetGroupXp).toBe(1320)
    expect(result.targetXpPerPlayer).toBe(330)
  })

  it('supports level 20 and beyond using the canonical 50000 XPC progression', () => {
    const historical = game(1, ['A'], 356000)
    const current = game(2, ['A'], 0)
    const result = sessionXpAid(current, [historical, current], [])
    expect(result.participants[0].level).toBe(20)
    expect(result.participants[0].xpToNextLevelBand).toBe(50000)
    expect(result.targetXpPerPlayer).toBe(20000)
  })

  it('does not invent a budget when participants have not been selected', () => {
    const current = game(8, [], 0)
    const result = sessionXpAid(current, [current], [])
    expect(result.participantCount).toBe(0)
    expect(result.targetGroupXp).toBeNull()
    expect(result.targetXpPerPlayer).toBeNull()
    expect(result.averageLevel).toBeNull()
  })

  it('deduplicates participant UUIDs and retains cached actor names', () => {
    const current = game(1, ['A', 'A', 'B'], 0)
    const result = sessionXpAid(current, [current], [{ uuid: 'A', name: 'Héros (joueur)' }])
    expect(result.participantCount).toBe(2)
    expect(result.participants[0].name).toBe('Héros (joueur)')
    expect(result.totalLevelBands).toBe(600)
    expect(result.targetGroupXp).toBe(240)
  })
})
