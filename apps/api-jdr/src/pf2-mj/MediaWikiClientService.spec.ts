import { MediaWikiClientService } from './MediaWikiClientService'

describe('MediaWikiClientService', () => {
  const previousPublicBase = process.env['PF2_MEDIAWIKI_PUBLIC_BASE_URL']

  afterEach(() => {
    if (previousPublicBase === undefined) delete process.env['PF2_MEDIAWIKI_PUBLIC_BASE_URL']
    else process.env['PF2_MEDIAWIKI_PUBLIC_BASE_URL'] = previousPublicBase
  })

  it('redirects Discord one-use login links to Mes personnages', () => {
    process.env['PF2_MEDIAWIKI_PUBLIC_BASE_URL'] = 'https://wiki.l7r.fr'
    const service = new MediaWikiClientService()
    const url = service.wikiLoginUrl('grant-test')

    expect(url).toContain('Special%3APF2DiscordLogin')
    expect(url).toContain('grant=grant-test')
    expect(url).toContain('returnto=Special%3AMesPersonnages')
  })
})
