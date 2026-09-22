import { Controller, Get, Headers, Param, ParseIntPipe } from '@nestjs/common'
import { Pf2JournalsService } from './Pf2JournalsService'

@Controller(['api/pf2-mj/journals', 'api/v1/pf2-mj/journals'])
export class Pf2JournalsController {
  constructor(private readonly journals: Pf2JournalsService) {}
  @Get() list(): Promise<unknown> { return this.journals.list() }
  @Get(':number') view(@Param('number', ParseIntPipe) number: number, @Headers('x-pf2-journals-key') key?: string): Promise<unknown> {
    const internal = Boolean(process.env['PF2_JOURNALS_INTERNAL_KEY']) && key === process.env['PF2_JOURNALS_INTERNAL_KEY']
    return this.journals.view(number, internal)
  }
}
