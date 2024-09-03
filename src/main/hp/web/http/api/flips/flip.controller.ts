import { FlipDto } from './entities/flip.dto'
import { CreateFlipRequest } from './requests/flip-create.request'
import { FlipService } from '../../../../domain/services/flip.service'
import { FlipWorkflowService } from '../../../../domain/services/flip.workflow-service'
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/hp/flips')
@ApiTags('Flips')
export class FlipController {
  constructor(private readonly flipService: FlipService, private readonly flipWorkflowService: FlipWorkflowService) {}

  @ApiCreatedResponse({
    description: 'Create a new flip for account'
  })
  @ApiBody({
    description: 'Create a new flip',
    required: true
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('')
  async createNewFlip(@Body() request: CreateFlipRequest): Promise<FlipDto> {
    return FlipDto.from(
      await this.flipWorkflowService.createFlip({
        wizardId: request.wizardId,
        knowledgeId: request.knowledgeId,
        statId: request.statId
      })
    )
  }

  @ApiOkResponse({
    description: 'Get all flips name'
  })
  @HttpCode(HttpStatus.OK)
  @Get('')
  async getAllFlipsName(): Promise<FlipDto[]> {
    const flips = await this.flipService.getAllFlips()
    return flips.map(FlipDto.from)
  }
}
