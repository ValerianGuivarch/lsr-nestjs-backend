import { selectHelpDiscordSection } from './PlayerCharacterHelp'

describe('private character help section selection', () => {
  const help = { howToPlay: 'Approche sociale', nextLevel: 'Don de niveau 4',
    nextLevelFor: 4 }
  it('uses how to play when the actual level is already current', () => {
    expect(selectHelpDiscordSection(help, {
      currentLevel: 4, theoreticalLevel: 4, pendingLevelUp: false, levelToComplete: null, foundryUuid: 'Actor.1',
    })).toMatchObject({ title: 'Comment le jouer', content: 'Approche sociale' })
  })
  it('uses only next-level text for the matching pending level', () => {
    expect(selectHelpDiscordSection(help, {
      currentLevel: 3, theoreticalLevel: 4, pendingLevelUp: true, levelToComplete: 4, foundryUuid: 'Actor.1',
    })).toMatchObject({ title: 'Faire son prochain niveau (4)', content: 'Don de niveau 4' })
  })
  it('refuses outdated level-up notes and does not expose long-term progression', () => {
    const result = selectHelpDiscordSection(help, {
      currentLevel: 4, theoreticalLevel: 5, pendingLevelUp: true, levelToComplete: 5, foundryUuid: 'Actor.1',
    })
    expect(result.content).toContain('reste à préparer')
    expect(result.content).not.toContain('Don de niveau 4')
  })
  it('guides finishing level 4 even when Foundry and theory both already show level 4', () => {
    expect(selectHelpDiscordSection(help, {
      currentLevel: 4, theoreticalLevel: 4, pendingLevelUp: true, levelToComplete: 4,
      foundryUuid: 'Actor.1',
    })).toMatchObject({ title: 'Terminer son niveau 4', content: 'Don de niveau 4' })
  })
  it('requires a fresh guide when a manual incomplete level has no written choices', () => {
    const result = selectHelpDiscordSection({ ...help, nextLevel: '' }, {
      currentLevel: 4, theoreticalLevel: 4, pendingLevelUp: true, levelToComplete: 4, foundryUuid: 'Actor.1',
    })
    expect(result.content).toContain('reste à préparer')
  })
  it('never guesses a level up if Foundry levels are unavailable', () => {
    expect(selectHelpDiscordSection(help, {
      currentLevel: null, theoreticalLevel: null, pendingLevelUp: false, levelToComplete: null, foundryUuid: null,
    }).title).toBe('Comment le jouer')
  })
})
