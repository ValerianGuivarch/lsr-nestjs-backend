import { StatDto } from './entities/stat.dto'
import { StatService } from '../../../../domain/services/stat.service'
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/hp/stats')
@ApiTags('Stats')
export class StatController {
  constructor(private readonly statService: StatService) {}

  @ApiOkResponse({
    description: 'Get all stats'
  })
  @HttpCode(HttpStatus.OK)
  @Get('')
  async getAllStats(): Promise<StatDto[]> {
    const stats = await this.statService.getAll()
    return stats.map(StatDto.from)
  }
}
