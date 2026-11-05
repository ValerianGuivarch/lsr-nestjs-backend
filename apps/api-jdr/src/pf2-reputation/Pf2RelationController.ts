import { Body, Controller, Get, Headers, Param, Post, Query, UnauthorizedException } from '@nestjs/common'
import { Pf2RelationService } from './Pf2RelationService'

@Controller('api/pf2-mj/relations/internal')
export class Pf2RelationController {
  constructor(private readonly service: Pf2RelationService) {}
  private guard(key: string) {
    const expected = process.env['PF2_WIKI_LOGIN_INTERNAL_KEY'] || process.env['PF2_JOURNALS_INTERNAL_KEY']
    if (!expected || expected !== key) throw new UnauthorizedException('Accès interne refusé.')
  }
  @Get(':npcId')
  list(@Param('npcId') npcId: string, @Query('wikiUsername') username = '',
    @Headers('x-pf2-wiki-admin') admin = '', @Headers('x-pf2-wiki-key') key = '') {
    this.guard(key)
    return this.service.list(npcId, username, admin === '1')
  }
  @Post(':npcId')
  update(@Param('npcId') npcId: string, @Body() body: Record<string, unknown>,
    @Headers('x-pf2-wiki-admin') admin = '', @Headers('x-pf2-wiki-key') key = '') {
    this.guard(key)
    if (admin !== '1') throw new UnauthorizedException('MJ uniquement.')
    return this.service.change(npcId, body, String(body.wikiUsername ?? ''), true)
  }
}
