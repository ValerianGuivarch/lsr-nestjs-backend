import { WizardDto, WizardNameDto } from './entities/wizard.dto'
import { CreateWizardRequest } from './requests/wizard-create.request'
import { Wizard } from '../../../../domain/entities/wizard.entity'
import { WizardService } from '../../../../domain/services/wizard.service'
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/hp/wizards')
@ApiTags('Wizards')
export class WizardController {
  constructor(private readonly wizardService: WizardService) {}

  @ApiCreatedResponse({
    description: 'Create a new wizard for account'
  })
  @ApiBody({
    description: 'Create a new wizard',
    required: true
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('')
  async createNewWizard(@Body() request: CreateWizardRequest): Promise<WizardDto> {
    return WizardDto.from(
      await this.wizardService.createWizard(
        Wizard.toWizardToCreate({
          name: request.name,
          category: request.category,
          stats: request.stats.map((stat) => ({
            level: stat.level,
            stat: {
              id: stat.id
            }
          })),
          knowledges: request.knowledges.map((knowledge) => ({
            level: knowledge.level,
            knowledge: {
              id: knowledge.id
            }
          }))
        })
      )
    )
  }

  @ApiOkResponse({
    description: 'Get all wizards name'
  })
  @HttpCode(HttpStatus.OK)
  @Get('')
  async getAllWizardsName(): Promise<WizardNameDto[]> {
    const wizards = await this.wizardService.getAllWizardNames()
    return wizards.map((wizard) => ({
      id: wizard.id,
      name: wizard.name
    }))
  }

  @ApiOkResponse({
    description: 'Get a wizard by id'
  })
  @HttpCode(HttpStatus.OK)
  @Get(':wizardId')
  async getWizardById(@Param('wizardId') wizardId: string): Promise<WizardDto> {
    return WizardDto.from(await this.wizardService.getWizardById(wizardId))
  }

  @ApiOkResponse({
    description: 'Get a wizard by id'
  })
  @HttpCode(HttpStatus.OK)
  @Get('name/:wizardName')
  async getWizardByName(@Param('wizardName') wizardName: string): Promise<WizardDto> {
    return WizardDto.from(await this.wizardService.getWizardByName(wizardName))
  }
}
