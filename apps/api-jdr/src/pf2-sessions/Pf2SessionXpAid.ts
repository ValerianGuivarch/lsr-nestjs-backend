import type { FoundryActorCacheEntry, Pf2Session } from '../pf2-storage/Pf2PersistenceService'
import {
  careerXpBeforeSession,
  levelForCareerXp,
  thresholdForCareerLevel,
} from './Pf2CareerXp'

export const SESSIONS_PER_LEVEL_TARGET = 2.5

export type SessionXpParticipant = {
  actorUuid: string
  name: string
  careerXpBefore: number
  level: number
  currentThreshold: number
  nextThreshold: number
  xpToNextLevelBand: number
}

export type SessionXpAid = {
  sessionId: string
  sessionNumber: number
  sessionTitle: string
  sessionXp: number
  participants: SessionXpParticipant[]
  participantCount: number
  averageLevel: number | null
  totalLevelBands: number
  sessionsPerLevelTarget: number
  targetGroupXp: number | null
  targetXpPerPlayer: number | null
}

/**
 * Aide MJ non prescriptive : la valeur saisie sur le wiki reste une note
 * provisoire, sans mise à jour de sessionXp ni d'Actor Foundry.
 *
 * La part par joueur est la moyenne des bandes d'XP de TOUS les participants
 * divisée par 2,5 séances, pas un calcul par PJ qui favoriserait les hauts niveaux.
 */
export function sessionXpAid(
  target: Pf2Session,
  sessions: Pf2Session[],
  actors: FoundryActorCacheEntry[],
): SessionXpAid {
  const actorNames = new Map(actors.map(actor => [actor.uuid, actor.name]))
  const participants = [...new Set(target.participants)].filter(Boolean).map(actorUuid => {
    const careerXpBefore = careerXpBeforeSession(actorUuid, target, sessions)
    const level = levelForCareerXp(careerXpBefore)
    const currentThreshold = thresholdForCareerLevel(level)
    const nextThreshold = thresholdForCareerLevel(level + 1)
    return {
      actorUuid,
      name: actorNames.get(actorUuid) ?? actorUuid,
      careerXpBefore,
      level,
      currentThreshold,
      nextThreshold,
      xpToNextLevelBand: nextThreshold - currentThreshold,
    }
  })

  const participantCount = participants.length
  const totalLevelBands = participants.reduce((sum, entry) => sum + entry.xpToNextLevelBand, 0)
  const targetGroupXp = participantCount ? totalLevelBands / SESSIONS_PER_LEVEL_TARGET : null
  return {
    sessionId: target.id,
    sessionNumber: target.sessionNumber,
    sessionTitle: target.title,
    sessionXp: target.sessionXp,
    participants,
    participantCount,
    averageLevel: participantCount
      ? participants.reduce((sum, entry) => sum + entry.level, 0) / participantCount
      : null,
    totalLevelBands,
    sessionsPerLevelTarget: SESSIONS_PER_LEVEL_TARGET,
    targetGroupXp,
    targetXpPerPlayer: targetGroupXp === null ? null : targetGroupXp / participantCount,
  }
}
