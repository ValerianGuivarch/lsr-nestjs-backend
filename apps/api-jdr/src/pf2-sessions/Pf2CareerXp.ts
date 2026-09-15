import type { Pf2Session } from '../pf2-storage/Pf2PersistenceService'

const HISTORICAL_THRESHOLDS = [
  0,
  0,
  300,
  900,
  2_700,
  6_500,
  14_000,
  23_000,
  34_000,
  48_000,
  65_000,
  84_000,
  105_000,
  127_000,
  151_000,
  177_000,
  205_000,
  236_000,
  271_000,
  311_000,
  356_000,
] as const

const LEVEL_20_THRESHOLD = 356_000
const POST_20_XP_PER_LEVEL = 50_000

export type SummaryReward = {
  xpcAtStart: number
  levelAtStart: number
  xp: number
}

// Alias conservé pour ne pas casser le code Discord existant.
export type ShortSummaryReward = SummaryReward

export type SessionSummaryRewardLedger = {
  short: SummaryReward
  long: SummaryReward
}

export function thresholdForCareerLevel(level: number): number {
  const normalized = Math.max(1, Math.trunc(Number(level) || 1))
  if (normalized <= 20) return HISTORICAL_THRESHOLDS[normalized]
  return LEVEL_20_THRESHOLD + (normalized - 20) * POST_20_XP_PER_LEVEL
}

export function levelForCareerXp(total: number): number {
  const xpc = Math.max(0, Math.trunc(Number(total) || 0))

  if (xpc >= LEVEL_20_THRESHOLD) {
    return 20 + Math.floor((xpc - LEVEL_20_THRESHOLD) / POST_20_XP_PER_LEVEL)
  }

  for (let level = 19; level >= 1; level -= 1) {
    if (xpc >= HISTORICAL_THRESHOLDS[level]) return level
  }

  return 1
}

export function summaryXpForLevel(level: number): number {
  const normalized = Math.max(1, Math.trunc(Number(level) || 1))
  const span = thresholdForCareerLevel(normalized + 1) - thresholdForCareerLevel(normalized)
  return Math.trunc(span / 10)
}

export function shortSummaryXpForLevel(level: number): number {
  return summaryXpForLevel(level)
}

export function summaryRewardForCareerXp(total: number): SummaryReward {
  const xpcAtStart = Math.max(0, Math.trunc(Number(total) || 0))
  const levelAtStart = levelForCareerXp(xpcAtStart)
  return {
    xpcAtStart,
    levelAtStart,
    xp: summaryXpForLevel(levelAtStart),
  }
}

export function shortSummaryRewardForCareerXp(total: number): ShortSummaryReward {
  return summaryRewardForCareerXp(total)
}

function addTo(map: Map<string, number>, actorId: string | null | undefined, amount: number): void {
  if (!actorId || !amount) return
  map.set(actorId, (map.get(actorId) ?? 0) + amount)
}

function sortedSessions(sessions: Pf2Session[]): Pf2Session[] {
  return [...sessions].sort((left, right) =>
    left.sessionNumber - right.sessionNumber ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.id.localeCompare(right.id),
  )
}

function rewardsAtSessionStart(
  session: Pf2Session,
  totals: Map<string, number>,
): SessionSummaryRewardLedger {
  const shortAuthor = session.shortSummaryAuthor
  const longAuthor = session.longSummaryAuthor

  const shortBase = summaryRewardForCareerXp(shortAuthor ? totals.get(shortAuthor) ?? 0 : 0)
  const longBase = summaryRewardForCareerXp(longAuthor ? totals.get(longAuthor) ?? 0 : 0)

  return {
    short: {
      ...shortBase,
      xp: shortAuthor && session.shortSummary.trim() ? shortBase.xp : 0,
    },
    long: {
      ...longBase,
      // Le texte du résumé long vit dans MediaWiki et n'est pas stocké dans SQLite.
      // La présence d'un auteur est donc le signal qu'un bonus doit être attribué.
      xp: longAuthor ? longBase.xp : 0,
    },
  }
}

/**
 * Reconstruit chronologiquement les XPC et les deux bonus de résumé sans faire
 * confiance aux valeurs shortSummaryXp / longSummaryXp déjà stockées.
 * Les deux bonus utilisent le niveau du personnage AVANT la séance concernée.
 */
export function buildSummaryRewardLedger(
  sessions: Pf2Session[],
): Map<string, SessionSummaryRewardLedger> {
  const totals = new Map<string, number>()
  const ledger = new Map<string, SessionSummaryRewardLedger>()

  for (const session of sortedSessions(sessions)) {
    const rewards = rewardsAtSessionStart(session, totals)
    ledger.set(session.id, rewards)

    for (const participant of new Set(session.participants)) {
      addTo(totals, participant, session.sessionXp)
    }

    addTo(totals, session.shortSummaryAuthor, rewards.short.xp)
    addTo(totals, session.longSummaryAuthor, rewards.long.xp)
  }

  return ledger
}

/** Compatibilité avec le code existant qui ne consomme que le résumé court. */
export function buildShortSummaryLedger(
  sessions: Pf2Session[],
): Map<string, ShortSummaryReward> {
  const combined = buildSummaryRewardLedger(sessions)
  return new Map(
    [...combined.entries()].map(([id, rewards]) => [id, rewards.short]),
  )
}

export function careerXpBeforeSession(
  actorId: string,
  target: Pf2Session,
  sessions: Pf2Session[],
): number {
  const totals = new Map<string, number>()

  for (const session of sortedSessions(sessions)) {
    if (session.sessionNumber >= target.sessionNumber) break

    const rewards = rewardsAtSessionStart(session, totals)

    for (const participant of new Set(session.participants)) {
      addTo(totals, participant, session.sessionXp)
    }

    addTo(totals, session.shortSummaryAuthor, rewards.short.xp)
    addTo(totals, session.longSummaryAuthor, rewards.long.xp)
  }

  return totals.get(actorId) ?? 0
}

export function summaryRewardForSession(
  actorId: string,
  target: Pf2Session,
  sessions: Pf2Session[],
): SummaryReward {
  return summaryRewardForCareerXp(
    careerXpBeforeSession(actorId, target, sessions),
  )
}

export function shortSummaryRewardForSession(
  actorId: string,
  target: Pf2Session,
  sessions: Pf2Session[],
): ShortSummaryReward {
  return summaryRewardForSession(actorId, target, sessions)
}

export function longSummaryRewardForSession(
  actorId: string,
  target: Pf2Session,
  sessions: Pf2Session[],
): SummaryReward {
  return summaryRewardForSession(actorId, target, sessions)
}
