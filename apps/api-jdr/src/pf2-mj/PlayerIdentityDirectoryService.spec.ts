import { PlayerIdentityDirectoryService } from './PlayerIdentityDirectoryService'

describe('PlayerIdentityDirectoryService', () => {
  it('joins the persisted player names, Wiki logins, Foundry actors and PJ profiles without inventing confirmed links', async () => {
    const db = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('pf2_player_character_profile')) return [
          { npcId: 'wiki-pepin', displayName: 'Pépin', wikiPageTitle: 'Personnage:Pépin' },
          { npcId: 'wiki-eryn', displayName: 'Eryn', wikiPageTitle: 'Personnage:Eryn' },
          { npcId: 'wiki-tsuyu', displayName: 'Tsuyu-Nagori', wikiPageTitle: 'Personnage:Tsuyu-Nagori' },
        ]
        if (sql.includes('pf2_player_character_owner')) return [
          { discordUserId: '134346709487714304', npcId: 'wiki-eryn' },
          { discordUserId: '448500183186145291', npcId: 'wiki-tsuyu' },
        ]
        if (sql.includes('pf2_foundry_wiki_pj_link')) return [
          { foundryUuid: 'Actor.pepin', npcId: 'wiki-pepin' },
        ]
        throw new Error('Unexpected SQL')
      }),
    }
    const persistence = {
      listPlayerIdentities: jest.fn().mockResolvedValue([
        { discordUserId: '399621722158137346', playerName: 'Éric' },
        { discordUserId: '134346709487714304', playerName: 'Tom' },
        { discordUserId: '448500183186145291', playerName: 'Guilhem' },
      ]),
      listWikiAccountLinks: jest.fn().mockResolvedValue([
        { discordUserId: '134346709487714304', wikiUsername: 'Tom' },
      ]),
      readFoundryActorCache: jest.fn().mockResolvedValue([
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)' },
        { uuid: 'Actor.eryn', name: 'Eryn (Tom)' },
        { uuid: 'Actor.tsuyi', name: 'Tsuyi (Guilhem)' },
      ]),
    }
    const wiki = { pageUrl: (title: string) => `https://wiki.example/index.php?title=${encodeURIComponent(title)}` }
    const previous = process.env['PF2_MEDIAWIKI_PUBLIC_BASE_URL']
    process.env['PF2_MEDIAWIKI_PUBLIC_BASE_URL'] = 'https://wiki.example'
    try {
      const service = new PlayerIdentityDirectoryService(db as never, persistence as never, wiki as never)
      const result = await service.snapshot()
      expect(result.players).toHaveLength(3)
      expect(result.cachedActorCount).toBe(3)
      const eric = result.players.find(row => row.playerName === 'Éric')!
      expect(eric.discordUserId).toBe('399621722158137346')
      expect(eric.wikiUsername).toBeNull()
      expect(eric.characters[0]).toEqual(expect.objectContaining({
        name: 'Pépin', foundryUuid: 'Actor.pepin', wikiNpcId: 'wiki-pepin',
        association: 'confirmed', ownerStatus: 'missing',
      }))
      expect(eric.characters[0].wikiUrl).toContain('Personnage%3AP%C3%A9pin')
      const tom = result.players.find(row => row.playerName === 'Tom')!
      expect(tom.characters[0]).toEqual(expect.objectContaining({
        association: 'suggested', ownerStatus: 'confirmed',
      }))
      const guilhem = result.players.find(row => row.playerName === 'Guilhem')!
      expect(guilhem.characters[0]).toEqual(expect.objectContaining({
        foundryUuid: 'Actor.tsuyi', association: 'missing',
      }))
      expect(result.wikiOnly.map(item => item.npcId)).toEqual(['wiki-tsuyu'])
    } finally {
      if (previous === undefined) delete process.env['PF2_MEDIAWIKI_PUBLIC_BASE_URL']
      else process.env['PF2_MEDIAWIKI_PUBLIC_BASE_URL'] = previous
    }
  })
})
