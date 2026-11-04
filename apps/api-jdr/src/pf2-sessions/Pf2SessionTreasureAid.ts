/**
 * Pathfinder 2e Remaster, GM Core, "Party Treasure by Level" (table 10-9).
 *
 * These values are the value of treasure distributed to a PARTY OF FOUR over
 * the course of an entire level, NOT starting-character wealth nor a per-PC
 * allowance. The cash column includes gems, art and other valuables sold at
 * their listed value; "total" includes permanent items and consumables too.
 *
 * https://2e.aonprd.com/Rules.aspx?ID=2656 (GM Core, treasure rewards)
 * https://pathfinder2e.org/browse/tables/p.html (complete table)
 */
export const PF2_TREASURE_BY_LEVEL: Readonly<Record<number, Readonly<{ totalGp: number; currencyGp: number }>>> = {
  1: { totalGp: 175, currencyGp: 40 },
  2: { totalGp: 300, currencyGp: 70 },
  3: { totalGp: 500, currencyGp: 120 },
  4: { totalGp: 850, currencyGp: 200 },
  5: { totalGp: 1350, currencyGp: 320 },
  6: { totalGp: 2000, currencyGp: 500 },
  7: { totalGp: 2900, currencyGp: 720 },
  8: { totalGp: 4000, currencyGp: 1000 },
  9: { totalGp: 5700, currencyGp: 1400 },
  10: { totalGp: 8000, currencyGp: 2000 },
  11: { totalGp: 11500, currencyGp: 2800 },
  12: { totalGp: 16500, currencyGp: 4000 },
  13: { totalGp: 25000, currencyGp: 6000 },
  14: { totalGp: 36500, currencyGp: 9000 },
  15: { totalGp: 54500, currencyGp: 13000 },
  16: { totalGp: 82500, currencyGp: 20000 },
  17: { totalGp: 128000, currencyGp: 30000 },
  18: { totalGp: 208000, currencyGp: 48000 },
  19: { totalGp: 355000, currencyGp: 80000 },
  20: { totalGp: 490000, currencyGp: 140000 },
}

export const TREASURE_SESSIONS_PER_LEVEL = 2.5

export type ParticipantTreasureBand = {
  actorUuid: string
  level: number
  totalPerLevelGp: number
  currencyPerLevelGp: number
}

export type SessionTreasureAid = {
  source: 'PF2 GM Core, table 10-9'
  sessionsPerLevel: number
  partySize: number
  /**
   * The canonical PF2 table covers FOUR PCs of the SAME level.
   * We average each individual level's 4-PC reference, proportionately adjust
   * the party size, and divide by 2.5 sessions (user's house-rule cadence).
   * For 5+ PCs, this intentionally isn't the official per-additional-PC
   * permanent/consumable breakdown; we label it a house approximation.
   */
  partySizeFactor: number
  currencyBudgetGp: number | null
  totalBudgetGp: number | null
  equipmentBudgetGp: number | null
  currencyPerPlayerGp: number | null
  totalPerPlayerGp: number | null
  unsupportedLevels: number[]
  participants: ParticipantTreasureBand[]
}

const gp = (value: number): number => Math.round(value * 100) / 100

export function sessionTreasureAid(
  participants: Array<{ actorUuid: string; level: number }>,
): SessionTreasureAid {
  const partySize = participants.length
  const unsupportedLevels = [...new Set(
    participants.map(player => player.level).filter(level => !Number.isInteger(level) || !PF2_TREASURE_BY_LEVEL[level]),
  )].sort((a, b) => a - b)
  const bands: ParticipantTreasureBand[] = participants.flatMap(player => {
    const row = PF2_TREASURE_BY_LEVEL[player.level]
    return row ? [{
      actorUuid: player.actorUuid,
      level: player.level,
      totalPerLevelGp: row.totalGp,
      currencyPerLevelGp: row.currencyGp,
    }] : []
  })
  // No extrapolation beyond 20th level and no arbitrary budget if attendance
  // hasn't been recorded. Avoid a misleading partial total in mixed groups.
  const available = partySize > 0 && unsupportedLevels.length === 0
  const currency = available
    ? gp(bands.reduce((sum, band) => sum + band.currencyPerLevelGp, 0) / (4 * TREASURE_SESSIONS_PER_LEVEL))
    : null
  const total = available
    ? gp(bands.reduce((sum, band) => sum + band.totalPerLevelGp, 0) / (4 * TREASURE_SESSIONS_PER_LEVEL))
    : null
  return {
    source: 'PF2 GM Core, table 10-9',
    sessionsPerLevel: TREASURE_SESSIONS_PER_LEVEL,
    partySize,
    partySizeFactor: gp(partySize / 4),
    currencyBudgetGp: currency,
    totalBudgetGp: total,
    equipmentBudgetGp: total !== null && currency !== null ? gp(total - currency) : null,
    currencyPerPlayerGp: currency === null ? null : gp(currency / partySize),
    totalPerPlayerGp: total === null ? null : gp(total / partySize),
    unsupportedLevels,
    participants: bands,
  }
}
