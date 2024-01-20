import { ScenarioVM, ScenarioVMExample } from './entities/ScenarioVM'
import { CreateScenarioRequest, CreateScenarioRequestExample1 } from './requests/CreateScenarioRequest'
import { Scenario } from '../../../../../domain/models/elena/Scenario'
import { ScenarioService } from '../../../../../domain/services/entities/elena/ScenarioService'
import { generateRequestSchemasAndExamples, generateResponseContent } from '../../utils/swagger'
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/scenarios')
@ApiTags('Elena')
export class ScenarioController {
  constructor(private readonly scenarioService: ScenarioService) {}

  @ApiCreatedResponse({
    description: 'Create a new scenario',
    content: generateResponseContent<ScenarioVM>({
      types: ScenarioVM,
      examples: {
        Example: ScenarioVMExample
      }
    })
  })
  @ApiBody({
    description: 'Create a new scenario for account',
    required: true,
    ...generateRequestSchemasAndExamples<CreateScenarioRequest>({
      types: CreateScenarioRequest,
      examples: {
        Scenario1: CreateScenarioRequestExample1
      }
    })
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('')
  async createNewScenario(@Body() request: CreateScenarioRequest): Promise<ScenarioVM> {
    return ScenarioVM.fromScenario(
      await this.scenarioService.create(
        Scenario.toScenarioToCreate({
          name: request.name,
          category: request.category,
          difficulty: request.difficulty,
          victory: request.victory,
          defeat: request.defeat,
          time: request.time,
          reward: request.reward,
          text: request.text,
          victoryMsg: request.victoryMsg,
          defaiteMsg: request.defaiteMsg
        })
      )
    )
  }

  @ApiOkResponse({
    description: 'Get a scenario by id',
    content: generateResponseContent<ScenarioVM>({
      types: ScenarioVM,
      examples: {
        Example: ScenarioVMExample
      }
    })
  })
  @HttpCode(HttpStatus.OK)
  @Get(':scenarioId')
  async getScenarioById(@Param('scenarioId') scenarioId: string): Promise<ScenarioVM> {
    return ScenarioVM.fromScenario(await this.scenarioService.findOneById(scenarioId))
  }
}
