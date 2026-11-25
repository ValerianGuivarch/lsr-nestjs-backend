import { UnauthorizedException } from '@nestjs/common'
import { PlayerCodexController } from './PlayerCodexController'

describe('Wiki private character-help proxy endpoints', () => {
  const before = process.env['PF2_WIKI_LOGIN_INTERNAL_KEY']
  beforeEach(() => { process.env['PF2_WIKI_LOGIN_INTERNAL_KEY'] = 'wiki-test-key' })
  afterAll(() => { if (before === undefined) delete process.env['PF2_WIKI_LOGIN_INTERNAL_KEY']
    else process.env['PF2_WIKI_LOGIN_INTERNAL_KEY'] = before })
  it('refuses unauthenticated internal access and forwards the user identity', async () => {
    const service = {
      wikiCharacterHelp: jest.fn().mockResolvedValue({ npcId: 'npc_pj_pepin' }),
      updateWikiCharacterHelp: jest.fn().mockResolvedValue({ npcId: 'npc_pj_pepin' }),
    }
    const controller = new PlayerCodexController(service as never)
    expect(() => controller.wikiHelp('EricWiki', 'npc_pj_pepin', '', 'bad-key'))
      .toThrow(UnauthorizedException)
    expect(() => controller.updateWikiHelp({ wikiUsername: 'MJ', npcId: 'npc_pj_pepin',
      field: 'howToPlay', value: 'aide', wikiIsAdmin: true }, 'bad-key'))
      .toThrow(UnauthorizedException)
    await controller.wikiHelp('EricWiki', 'npc_pj_pepin', '', 'wiki-test-key')
    expect(service.wikiCharacterHelp).toHaveBeenCalledWith('EricWiki', 'npc_pj_pepin', false)
    await controller.updateWikiHelp({ wikiUsername: 'MJ', npcId: 'npc_pj_pepin',
      field: 'howToPlay', value: 'aide', wikiIsAdmin: true }, 'wiki-test-key')
    expect(service.updateWikiCharacterHelp).toHaveBeenCalledWith(
      'MJ', 'npc_pj_pepin', 'howToPlay', 'aide', true,
    )
  })
})
