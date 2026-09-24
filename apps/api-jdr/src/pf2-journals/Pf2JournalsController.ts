import { Body, Controller, Delete, ForbiddenException, Get, Headers, Param, ParseIntPipe, Put } from '@nestjs/common'
import { Pf2JournalsService } from './Pf2JournalsService'

@Controller(['api/pf2-mj/journals', 'api/v1/pf2-mj/journals'])
export class Pf2JournalsController {
  constructor(private readonly journals: Pf2JournalsService) {}
  @Get() list(): Promise<unknown> { return this.journals.list() }
  @Get('admin/catalogue') catalogue(@Headers('x-pf2-journals-key') key?: string): Promise<unknown> { this.requireInternalKey(key); return this.journals.catalogueForAdmin() }
  @Get(':number') view(@Param('number', ParseIntPipe) number: number, @Headers('x-pf2-journals-key') key?: string): Promise<unknown> {
    const internal = Boolean(process.env['PF2_JOURNALS_INTERNAL_KEY']) && key === process.env['PF2_JOURNALS_INTERNAL_KEY']
    return this.journals.view(number, internal)
  }
  @Put('admin/catalogue/:number') save(@Param('number', ParseIntPipe) number: number, @Body() body: Record<string, unknown>, @Headers('x-pf2-journals-key') key?: string): Promise<unknown> { this.requireInternalKey(key); return this.journals.saveDefinition({ ...body, number }) }
  @Delete('admin/catalogue/:number') async remove(@Param('number', ParseIntPipe) number: number, @Headers('x-pf2-journals-key') key?: string): Promise<{ deleted: true }> { this.requireInternalKey(key); await this.journals.deleteDefinition(number); return { deleted: true } }
  private requireInternalKey(key?: string): void {
    const expected = process.env['PF2_JOURNALS_INTERNAL_KEY']
    if (!expected || key !== expected) throw new ForbiddenException('Accès administrateur Journaux refusé.')
  }
}
