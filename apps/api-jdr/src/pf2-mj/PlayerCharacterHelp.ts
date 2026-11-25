/** This feature is intentionally limited to five guided PF2 characters.
 * Discord identities/owners are resolved dynamically from SQLite.
 */
export const GUIDED_CHARACTER_IDS = [
  'npc_pj_sashka', 'npc_pj_pepin', 'npc_pj_zab',
  'npc_pj_vaga', 'npc_pj_neyla_ketta',
] as const

export type PlayerHelpField = 'howToPlay' | 'nextLevel' | 'progression' | 'nextLevelFor' | 'unfinishedLevel'
export type PlayerHelpLevel = { currentLevel: number | null; theoreticalLevel: number | null;
  pendingLevelUp: boolean; levelToComplete: number | null; foundryUuid: string | null }

export function normalizeCharacterHelpName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}
export function selectHelpDiscordSection(
  help: { howToPlay: string; nextLevel: string; nextLevelFor: number | null },
  level: PlayerHelpLevel,
): { title: string; content: string; needsLevelUp: boolean } {
  if (level.pendingLevelUp) {
    const target = level.levelToComplete
    if (target === null) throw new Error('Un niveau à faire nécessite son niveau cible.')
    const isForLevel = help.nextLevelFor === target
    return {
      title: level.currentLevel === target ? 'Terminer son niveau ' + target
        : 'Faire son prochain niveau (' + target + ')',
      content: isForLevel && help.nextLevel.trim() ? help.nextLevel
        : 'Le guide pour le niveau ' + target + ' reste à préparer. Demande conseil au MJ avant de choisir tes dons.',
      needsLevelUp: true,
    }
  }
  return { title: 'Comment le jouer',
    content: help.howToPlay.trim() || 'Le guide de jeu de ce personnage reste à préparer avec le MJ.',
    needsLevelUp: false }
}
