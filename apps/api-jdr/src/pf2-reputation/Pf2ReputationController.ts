import { Controller, Get, Post, Body, Param, Headers, Query, UnauthorizedException } from '@nestjs/common'
import { Pf2ReputationService } from './Pf2ReputationService'
@Controller('api/pf2-mj/reputations/internal')
export class Pf2ReputationController {
 constructor(private readonly svc:Pf2ReputationService){}
 private guard(key:string){const expected=process.env['PF2_WIKI_LOGIN_INTERNAL_KEY']||process.env['PF2_JOURNALS_INTERNAL_KEY'];if(!expected||key!==expected)throw new UnauthorizedException()}
 @Get() list(@Headers('x-pf2-wiki-key') key='',@Headers('x-pf2-wiki-admin') admin='',@Query('wikiUsername') username=''){this.guard(key);return this.svc.listForWiki(username,admin==='1')}
 @Post('groups') createGroup(@Headers('x-pf2-wiki-key') key='',@Body() body:{name:string}){this.guard(key);return this.svc.createGroup(body.name)}
 @Post() create(@Headers('x-pf2-wiki-key') key='',@Body() body:{name:string;groupId:number}){this.guard(key);return this.svc.create(body.name,body.groupId)}
 @Post(':id/move') move(@Headers('x-pf2-wiki-key') key='',@Param('id') id:string,@Body() body:{groupId:number}){this.guard(key);return this.svc.move(Number(id),body.groupId)}
 @Post(':id/score') score(@Headers('x-pf2-wiki-key') key='',@Param('id') id:string,@Body() body:{score:number;reason?:string}){this.guard(key);return this.svc.change(Number(id),body.score,body.reason)}
 @Post(':id/modifier') modifier(@Headers('x-pf2-wiki-key') key='',@Headers('x-pf2-wiki-admin') admin='',@Param('id') id:string,@Body() body:{playerNpcId:string;modifier:number}){this.guard(key);if(admin!=='1')throw new UnauthorizedException();return this.svc.setModifier(Number(id),body.playerNpcId,body.modifier)}
 @Post(':id/visibility') visibility(@Headers('x-pf2-wiki-key') key='',@Param('id') id:string,@Body() body:{type:'group'|'reputation';visible:boolean}){this.guard(key);if(body.type!=='group'&&body.type!=='reputation')throw new UnauthorizedException();return this.svc.setVisibility(body.type,Number(id),body.visible)}

}

// Public read-only catalog: only factions already visible to players; no scores or hidden records.
@Controller('api/pf2-mj/reputations')
export class Pf2ReputationCandidatesController {
 constructor(private readonly svc: Pf2ReputationService) {}
 @Get('visible') async visible() {
  const groups = await this.svc.list(false) as Array<{name:string;entries:Array<{id:number;name:string}>}>
  return groups.flatMap(group => group.entries.map(entry => ({id:entry.id,name:entry.name,group:group.name})))
 }
}
