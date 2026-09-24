import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JdrDto } from '../jdr/dto/JdrDto'
import { JdrImportRequest } from './dto/JdrImportRequest'
import { JdrImportService } from './JdrImportService'

@Controller('api/v1/jdr')
@ApiTags('JdR')
export class JdrImportController {
  constructor(private readonly importService: JdrImportService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('import')
  async import(@Body() body: JdrImportRequest): Promise<JdrDto> {
    return JdrDto.from(await this.importService.import(body))
  }
}
