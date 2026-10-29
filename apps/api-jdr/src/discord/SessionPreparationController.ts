import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { SessionPreparationService } from './SessionPreparationService'

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
