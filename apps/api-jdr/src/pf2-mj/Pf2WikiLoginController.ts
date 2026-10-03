import { Body, Controller, Headers, HttpCode, Post, UnauthorizedException } from '@nestjs/common'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'

@Controller(['api/pf2-mj/wiki-login', 'api/v1/pf2-mj/wiki-login'])
export class Pf2WikiLoginController {
  constructor(private readonly persistence: Pf2PersistenceService) {}

  @Post('consume')
  @HttpCode(200)
  async consume(
    @Body() body: { grant?: unknown },
    @Headers('x-pf2-wiki-key') suppliedKey = '',
  ): Promise<{ wikiUsername: string }> {
    const expectedKey =
      process.env['PF2_WIKI_LOGIN_INTERNAL_KEY'] ??
      process.env['PF2_JOURNALS_INTERNAL_KEY'] ??
      ''

    if (!expectedKey || suppliedKey !== expectedKey) {
      throw new UnauthorizedException('Accès interne refusé.')
    }

    const grant = typeof body?.grant === 'string' ? body.grant : ''
    const consumed = await this.persistence.consumeWikiLoginGrant(grant)
    if (!consumed) {
      throw new UnauthorizedException('Lien de connexion invalide ou expiré.')
    }

    return { wikiUsername: consumed.wikiUsername }
  }
}
