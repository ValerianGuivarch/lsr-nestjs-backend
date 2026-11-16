import { Body, Controller, Get, Headers, Param, Post, Query, UnauthorizedException } from '@nestjs/common'
import { Pf2HoroscopeService } from './Pf2HoroscopeService'

@Controller('api/pf2-mj/horoscopes/internal')
export class Pf2HoroscopeController {
  constructor(private readonly service: Pf2HoroscopeService) {}
  private guard(key: string) {
    const expected = process.env['PF2_WIKI_LOGIN_INTERNAL_KEY'] || process.env['PF2_JOURNALS_INTERNAL_KEY']
    if (!expected || expected !== key) throw new UnauthorizedException('Accès interne refusé.')
  }
  @Get(':npcId')
  list(@Param('npcId') npcId: string, @Query('wikiUsername') username = '',
    @Headers('x-pf2-wiki-admin') admin = '', @Headers('x-pf2-wiki-key') key = '') {
    this.guard(key)
    return this.service.list(npcId,username,admin === '1')
  }
  @Post(':npcId')
  save(@Param('npcId') npcId: string, @Body() body: Record<string,unknown>,
    @Headers('x-pf2-wiki-admin') admin = '', @Headers('x-pf2-wiki-key') key = '') {
    this.guard(key)
    return this.service.save(npcId,body,String(body.wikiUsername ?? ''),admin === '1')
  }
}
