import type { Pf2Session } from '../pf2-storage/Pf2PersistenceService'
import {
  buildSummaryRewardLedger,
  buildShortSummaryLedger,
  levelForCareerXp,
  shortSummaryXpForLevel,
  thresholdForCareerLevel,
} from './Pf2CareerXp'

const session = (
  id: string,
  sessionNumber: number,
  overrides: Partial<Pf2Session> = {},
): Pf2Session => ({
  id,
  sessionNumber,
  date: '',
  inGameStartDate: '',
  inGameEndDate: '',
  title: id,
  participants: [],
  longSummaryAuthor: null,
  shortSummaryAuthor: null,
  sessionXp: 0,
  longSummaryXp: 0,
  shortSummaryXp: 0,
  shortSummary: '',
  discordMessageId: null,
  published: false,
  createdAt: `2026-01-${String(sessionNumber).padStart(2, '0')}`,
  updatedAt: '',
  ...overrides,
})

describe('PF2 career XP', () => {
  it.each([
    [0, 1],
    [299, 1],
    [300, 2],
    [899, 2],
    [900, 3],
    [356_000, 20],
    [405_999, 20],
    [406_000, 21],
    [456_000, 22],
  ])('maps %i XPC to level %i', (xpc, expected) => {
    expect(levelForCareerXp(xpc)).toBe(expected)
  })

  it.each([
    [1, 30],
    [2, 60],
    [3, 180],
    [19, 4_500],
    [20, 5_000],
    [21, 5_000],
    [25, 5_000],
  ])('gives level %i a %i XP summary reward', (level, expected) => {
    expect(shortSummaryXpForLevel(level)).toBe(expected)
  })

  it('extends thresholds by 50,000 XP per level from level 20', () => {
    expect(thresholdForCareerLevel(20)).toBe(356_000)
    expect(thresholdForCareerLevel(21)).toBe(406_000)
    expect(thresholdForCareerLevel(22)).toBe(456_000)
  })

  it('uses the level at the beginning of the session even if the session levels the author up', () => {
    const sessions = [
      session('s1', 1, {
        participants: ['Actor.hero'],
        sessionXp: 290,
      }),
      session('s2', 2, {
        participants: ['Actor.hero'],
        sessionXp: 100,
        shortSummaryAuthor: 'Actor.hero',
        shortSummary: 'Résumé',
      }),
    ]

    const ledger = buildShortSummaryLedger(sessions)
    expect(ledger.get('s2')).toMatchObject({
      xpcAtStart: 290,
      levelAtStart: 1,
      xp: 30,
    })
  })

  it('uses the same start-of-session rule for short and long summaries', () => {
    const sessions = [
      session('s1', 1, {
        participants: ['Actor.hero'],
        sessionXp: 290,
      }),
      session('s2', 2, {
        participants: ['Actor.hero'],
        sessionXp: 100,
        shortSummaryAuthor: 'Actor.hero',
        shortSummary: 'Résumé court',
        longSummaryAuthor: 'Actor.hero',
        // Les anciennes valeurs stockées ne doivent pas être prises comme source de vérité.
        shortSummaryXp: 999,
        longSummaryXp: 999,
      }),
      session('s3', 3, {
        shortSummaryAuthor: 'Actor.hero',
        shortSummary: 'Résumé suivant',
      }),
    ]

    const ledger = buildSummaryRewardLedger(sessions)
    expect(ledger.get('s2')).toEqual({
      short: { xpcAtStart: 290, levelAtStart: 1, xp: 30 },
      long: { xpcAtStart: 290, levelAtStart: 1, xp: 30 },
    })
    // Après s2 : 290 + 100 XP de séance + 30 court + 30 long = 450 XPC.
    expect(ledger.get('s3')?.short).toMatchObject({
      xpcAtStart: 450,
      levelAtStart: 2,
      xp: 60,
    })
  })
})
