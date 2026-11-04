import {
  finishCurrencyText, finishInt, finishLines, finishReport, finishReportParts,
  finishReputationDefaults, parseFinishReputationGroup, sortedFinishReputations,
  type SessionFinishDraft, type SessionFinishGroup,
} from './SessionFinishFlow'

const group: SessionFinishGroup = {
  id: 1, name: 'Pointesable', entries: [
    { id: 1, name: 'Citadins', score: 1 },
    { id: 2, name: 'Cathédrale de Pointesable', score: 12 },
    { id: 3, name: 'Garde de la ville', score: 4 },
  ],
}

const draft: SessionFinishDraft = {
  token: 'abc', requesterId: 'admin', channelId: 'chan', guildId: 'guild',
  sessionId: null, mock: true, createdAt: Date.now(), number: 7,
  days: 2, xpPerPlayer: 310, xpTotal: 1240,
  activities: 'Gnome libéré : 30XP\n- Chef vaincu : 1200 XP',
  coins: { gp: 7, sp: 3, cp: 2 }, loot: 'Potion de soins\n- Anneau de protection',
  groups: [group],
  changes: [
    { id: 2, name: 'Cathédrale de Pointesable', delta: -2, group: 'Pointesable' },
    { id: 1, name: 'Citadins', delta: 3, group: 'Pointesable' },
    { id: 3, name: 'Garde de la ville', delta: 1, group: 'Pointesable' },
  ],
  step: 'review',
}

describe('SessionFinishFlow', () => {
  it('validates independent numerical input (do not recompute total XP)', () => {
    expect(finishInt('0', 'jours')).toBe(0)
    expect(finishInt('310', 'XP')).toBe(310)
    expect(() => finishInt('-3', 'XP')).toThrow()
    expect(() => finishInt('2.5', 'XP')).toThrow()
    expect(() => finishInt('nan', 'XP')).toThrow()
  })

  it('prefills all reputations with zero and applies numeric deltas', () => {
    expect(finishReputationDefaults(group)).toContain('Cathédrale de Pointesable: 0')
    const changes = parseFinishReputationGroup(group, 'Citadins: +3\nCathédrale de Pointesable: -2\nGarde de la ville: 0')
    expect(changes).toEqual([
      { id: 1, name: 'Citadins', delta: 3, group: 'Pointesable' },
      { id: 2, name: 'Cathédrale de Pointesable', delta: -2, group: 'Pointesable' },
    ])
    expect(() => parseFinishReputationGroup(group, 'Autre: 2')).toThrow(/faction inconnue/)
    expect(() => parseFinishReputationGroup(group, 'Citadins: 999')).toThrow()
    expect(() => parseFinishReputationGroup(group, 'Citadins: 1\nCitadins: 2')).toThrow(/plusieurs/)
    expect(sortedFinishReputations(draft.changes).map(change => change.delta)).toEqual([3, 1, -2])
  })

  it('creates the exact formatted summary, bullet lists, cash and simulation only in mj', () => {
    const text = finishReport(draft)
    expect(finishLines('Gnome\n- Chef')).toEqual(['Gnome','Chef'])
    expect(finishCurrencyText({ gp: 0, sp: 3, cp: 2 })).toBe('3 pièces d’argent, 2 pièces de cuivre')
    expect(text).toContain('**Fin de séance n°7**')
    expect(text).toContain('**Durée en jeu :** 2 jours écoulés')
    expect(text).toContain('• Gnome libéré : 30XP')
    expect(text).toContain('• Chef vaincu : 1200 XP')
    expect(text).toContain('**Total : 1240 XP, soit 310 XP par PJ.**')
    expect(text).toContain('• 7 pièces d’or, 3 pièces d’argent, 2 pièces de cuivre (par PJ)')
    expect(text).toContain('• Potion de soins')
    expect(text.indexOf('Citadins : +3')).toBeLessThan(text.indexOf('Garde de la ville : +1'))
    expect(text.indexOf('Garde de la ville : +1')).toBeLessThan(text.indexOf('Cathédrale de Pointesable : -2'))
    expect(text).toContain('SIMULATION MJ')
    expect(text).toContain('**Simulation des changements :** séance n°7')
    expect(finishReport({ ...draft, mock: false })).not.toContain('SIMULATION MJ')
  })

  it('splits messages at line boundaries without dropping content', () => {
    const text = Array.from({ length: 90 }, (_, i) => '• Une ligne de butin ' + i).join('\n')
    expect(finishReportParts(text, 100).join('\n')).toBe(text)
    expect(finishReportParts(text, 100).every(chunk => chunk.length <= 100)).toBe(true)
    expect(() => finishReportParts('x'.repeat(101), 100)).toThrow()
  })
})
