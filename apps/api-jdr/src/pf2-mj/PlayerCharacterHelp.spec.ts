import { selectHelpDiscordSection } from './PlayerCharacterHelp'

describe('private character help section selection', () => {
  const help = { howToPlay: 'Approche sociale', nextLevel: 'Don de niveau 4',
    nextLevelFor: 4 }
  it('uses how to play when the actual level is already current', () => {
    expect(selectHelpDiscordSection(help, {
      currentLevel: 4, theoreticalLevel: 4, pendingLevelUp: false, foundryUuid: 'Actor.1',
    })).toMatchObject({ title: 'Comment le jouer', content: 'Approche sociale' })
  })
  it('uses only next-level text for the matching pending level', () => {
    expect(selectHelpDiscordSection(help, {
      currentLevel: 3, theoreticalLevel: 4, pendingLevelUp: true, foundryUuid: 'Actor.1',
    })).toMatchObject({ title: 'Faire son prochain niveau (4)', content: 'Don de niveau 4' })
  })
  it('refuses outdated level-up notes and does not expose long-term progression', () => {
    const result = selectHelpDiscordSection(help, {
      currentLevel: 4, theoreticalLevel: 5, pendingLevelUp: true, foundryUuid: 'Actor.1',
    })
    expect(result.content).toContain('reste à préparer')
    expect(result.content).not.toContain('Don de niveau 4')
  })
  it('never guesses a level up if Foundry levels are unavailable', () => {
    expect(selectHelpDiscordSection(help, {
      currentLevel: null, theoreticalLevel: null, pendingLevelUp: false, foundryUuid: null,
    }).title).toBe('Comment le jouer')
  })
})
