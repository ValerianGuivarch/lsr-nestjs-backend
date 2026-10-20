import { Body, Controller, Get, Headers, Param, Post, UnauthorizedException, BadRequestException } from '@nestjs/common'
import { DiscordService } from './DiscordService'
import { Pf2RequestService, RequestStatus } from './Pf2RequestService'

@Controller('api/pf2-mj/requests/internal')
export class Pf2RequestController {
  constructor(private readonly requests: Pf2RequestService,private readonly discord: DiscordService) {}
  private guard(key:string) {
    const expected=process.env['PF2_WIKI_LOGIN_INTERNAL_KEY']||process.env['PF2_JOURNALS_INTERNAL_KEY']
    if(!expected || key!==expected) throw new UnauthorizedException()
  }
  @Get()
  list(@Headers('x-pf2-wiki-key') key='') {this.guard(key);return this.requests.list()}
  @Post(':id/status')
  async change(@Headers('x-pf2-wiki-key') key='',@Param('id') id='',@Body() body:{status?:RequestStatus}) {
    this.guard(key)
    if(!['requested','in_progress','done'].includes(body.status||''))throw new BadRequestException('Statut invalide')
    const client=this.discord.requestClient()
    if(!client)throw new BadRequestException('Bot Discord indisponible')
    return this.requests.change(client,Number(id),body.status!)
  }
}
