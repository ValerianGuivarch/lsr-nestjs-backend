import { KnowledgeDto } from './entities/knowledge.dto'
import { KnowledgeService } from '../../../../domain/services/knowledge.service'
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/hp/knowledges')
@ApiTags('Knowledges')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @ApiOkResponse({
    description: 'Get all knowledges'
  })
  @HttpCode(HttpStatus.OK)
  @Get('')
  async getAllKnowledges(): Promise<KnowledgeDto[]> {
    const knowledges = await this.knowledgeService.getAll()
    return knowledges.map(KnowledgeDto.from)
  }
}
