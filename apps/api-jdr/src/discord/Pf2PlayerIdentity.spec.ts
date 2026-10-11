import { PF2_PLAYER_IDENTITIES, pf2DiscordIdForPlayer, pf2MatchesPlayerOrDiscordAlias, pf2PlayerByDiscordId } from './Pf2PlayerIdentity'

describe('PF2 player identities', () => {
  it('covers all 12 player actors in the Foundry cache plus the GM, without duplicate Discord IDs', () => {
    const actorsFromFoundry = [
      'Eos', 'Eryn', 'Jilkra', 'Neyla', 'Pen-Pen', 'Pépin',
      'Ruhtra', 'Sashka', 'Tsuyi', 'Vaga', 'Yaz Lorok', 'Zab',
    ]
    const identities = PF2_PLAYER_IDENTITIES.filter(item => item.actor !== 'Valou')
    expect(identities).toHaveLength(12)
    expect([...identities.map(item => item.actor)].sort()).toEqual(actorsFromFoundry.sort())
    expect(new Set(PF2_PLAYER_IDENTITIES.map(item => item.id)).size).toBe(PF2_PLAYER_IDENTITIES.length)
    for (const item of PF2_PLAYER_IDENTITIES) {
      expect(item.id).toMatch(/^\d{17,20}$/)
      expect(pf2PlayerByDiscordId(item.id)?.name).toBe(item.name)
      expect(pf2DiscordIdForPlayer(item.name)).toBe(item.id)
      for (const alias of item.aliases) expect(pf2DiscordIdForPlayer(alias)).toBe(item.id)
      expect(pf2MatchesPlayerOrDiscordAlias(item.id, item.actor)).toBe(true)
      for (const alias of item.discordAliases) expect(pf2MatchesPlayerOrDiscordAlias(item.id, alias)).toBe(true)
    }
  })

  it('uses first names, not account names or PJ names, for quest choices', () => {
    const examples = [
      ['399621722158137346', 'Éric', 'Helluin', 'Pépin'],
      ['344733584441081857', 'Arcady', 'playest', 'Pen-Pen'],
      ['134346709487714304', 'Tom', 'nyu', 'Eryn'],
      ['688791427253403679', 'Sameh', 'triki', 'Neyla'],
      ['688860103629340690', 'Nicolas', 'Actéon Abbot', 'Vaga'],
      ['404629333534179338', 'Marinella', 'Mana', 'Sashka'],
    ]
    for (const [id, playerName, discordAlias, character] of examples) {
      expect(pf2PlayerByDiscordId(id)?.name).toBe(playerName)
      expect(pf2MatchesPlayerOrDiscordAlias(id, discordAlias)).toBe(true)
      expect(pf2MatchesPlayerOrDiscordAlias(id, character)).toBe(true)
    }
    expect(pf2PlayerByDiscordId('000000000000000000')).toBeUndefined()
    expect(pf2DiscordIdForPlayer('inconnu')).toBeUndefined()
  })
})
