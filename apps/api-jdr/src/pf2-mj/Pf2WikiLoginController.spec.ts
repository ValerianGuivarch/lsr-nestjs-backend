import { UnauthorizedException } from '@nestjs/common'
import { Pf2WikiLoginController } from './Pf2WikiLoginController'

describe('Pf2WikiLoginController', () => {
  const originalWikiKey = process.env['PF2_WIKI_LOGIN_INTERNAL_KEY']
  const originalJournalKey = process.env['PF2_JOURNALS_INTERNAL_KEY']

  afterEach(() => {
    if (originalWikiKey === undefined) delete process.env['PF2_WIKI_LOGIN_INTERNAL_KEY']
    else process.env['PF2_WIKI_LOGIN_INTERNAL_KEY'] = originalWikiKey
    if (originalJournalKey === undefined) delete process.env['PF2_JOURNALS_INTERNAL_KEY']
    else process.env['PF2_JOURNALS_INTERNAL_KEY'] = originalJournalKey
  })

  it('consumes a valid grant only through the internal key', async () => {
    process.env['PF2_WIKI_LOGIN_INTERNAL_KEY'] = 'test-key'
    const persistence = {
      consumeWikiLoginGrant: jest.fn().mockResolvedValue({
        discordUserId: '123456789012345678',
        wikiUsername: 'Valou',
      }),
    }
    const controller = new Pf2WikiLoginController(persistence as never)

    await expect(controller.consume({ grant: 'one-use' }, 'test-key')).resolves.toEqual({
      wikiUsername: 'Valou',
    })
    expect(persistence.consumeWikiLoginGrant).toHaveBeenCalledWith('one-use')
  })

  it('rejects an invalid internal key before consuming the grant', async () => {
    process.env['PF2_WIKI_LOGIN_INTERNAL_KEY'] = 'test-key'
    const persistence = { consumeWikiLoginGrant: jest.fn() }
    const controller = new Pf2WikiLoginController(persistence as never)

    await expect(controller.consume({ grant: 'one-use' }, 'wrong-key')).rejects.toBeInstanceOf(UnauthorizedException)
    expect(persistence.consumeWikiLoginGrant).not.toHaveBeenCalled()
  })

  it('rejects an expired or already consumed grant', async () => {
    process.env['PF2_WIKI_LOGIN_INTERNAL_KEY'] = 'test-key'
    const controller = new Pf2WikiLoginController({
      consumeWikiLoginGrant: jest.fn().mockResolvedValue(null),
    } as never)

    await expect(controller.consume({ grant: 'expired' }, 'test-key')).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
