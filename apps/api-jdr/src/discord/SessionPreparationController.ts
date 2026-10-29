import { Body, CanActivate, Controller, Delete, ExecutionContext, Get, Injectable, Param, Patch, Post, UnauthorizedException, UseGuards } from '@nestjs/common'
import { timingSafeEqual } from 'node:crypto'
import { SessionPreparationService } from './SessionPreparationService'

@Injectable()
class SessionPreparationKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>()
    const received = request.headers['x-pf2-preparation-key'] ?? ''
    const expected = process.env['PF2_SESSION_PREP_KEY'] ?? ''
    const a = Buffer.from(received)
    const b = Buffer.from(expected)
    if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException('Clé MJ de préparation invalide.')
    return true
  }
}

@UseGuards(SessionPreparationKeyGuard)
@Controller(['api/pf2-mj/session-preparations' , 'api/v1/pf2-mj/session-preparations'])
export class SessionPreparationController {
  constructor(private readonly service: SessionPreparationService) {}
  @Get() list(): Promise<unknown[]> { return this.service.list() }
  @Get('sessions') sessions(): Promise<unknown[]> { return this.service.sessions() }
  @Get(':id') get(@Param('id') id: string): Promise<unknown> { return this.service.get(id) }
  @Post() create(@Body() body: Record<string, unknown>): Promise<unknown> { return this.service.create(body) }
  @Patch(':id') update(@Param('id') id: string, @Body() body: Record<string, unknown>): Promise<unknown> { return this.service.update(id, body) }
  @Delete(':id') remove(@Param('id') id: string): Promise<unknown> { return this.service.remove(id) }
  @Post(':id/share/:blockId') share(@Param('id') id: string, @Param('blockId') blockId: string): Promise<unknown> { return this.service.share(id, blockId) }
}
