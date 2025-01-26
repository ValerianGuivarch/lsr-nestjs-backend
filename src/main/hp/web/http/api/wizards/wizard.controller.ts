import { WizardDto, WizardNameDto } from './entities/wizard.dto'
import { CreateWizardRequest } from './requests/wizard-create.request'
import { UpdateWizardRequest } from './requests/wizard-update.request'
import { Wizard } from '../../../../domain/entities/wizard.entity'
import { WizardService } from '../../../../domain/services/wizard.service'
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common'
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
    console.log('request', JSON.stringify(request))
    return WizardDto.from(
      await this.wizardService.createWizard(
        Wizard.toWizardToCreate({
          houseName: request.houseName,
          name: request.name,
          familyName: request.familyName ?? '',
          animal: '',
          category: request.category,
          stats: request.stats.map((stat) => ({
            level: stat.level,
            stat: {
              name: stat.name
            }
          })),
          knowledges: request.knowledges.map((knowledge) => ({
            level: knowledge.level,
            knowledge: {
              name: knowledge.name
            }
          })),
          spells: request.spells.map((spell) => ({
            difficulty: spell.difficulty,
            spell: {
              name: spell.name
            }
          }))
        })
      )
    )
  }

  @ApiCreatedResponse({
    description: 'Create a new wizard for account'
  })
  @ApiBody({
    description: 'Create a new wizard',
    required: true
  })
  @Patch(':wizardName')
  async updateNewWizard(
    @Param('wizardName') wizardName: string,
    @Body() request: UpdateWizardRequest
  ): Promise<WizardDto> {
    console.log('request', JSON.stringify(request))
    const wizard = await this.wizardService.getWizardByName(wizardName)
    return WizardDto.from(
      await this.wizardService.updateWizard({
        wizardName: wizardName,
        wizard: {
          text: request.text ?? wizard.text,
          category: request.category ?? wizard.category,
          statsToUpdate: request.stats?.map((stat) => ({
            statName: stat.name,
            level: stat.level
          })),
          knowledgesToUpdate: request.knowledges?.map((knowledge) => ({
            knowledgeName: knowledge.name,
            level: knowledge.level
          })),
          pv: request.pv ?? wizard.pv,
          spellsToUpdate: request.spells?.map((spell) => ({
            difficulty: spell.difficulty,
            spell: {
              name: spell.name
            }
          }))
        }
      })
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
      name: wizard.name
    }))
  }

  @ApiOkResponse({
    description: 'Get a wizard by id'
  })
  @HttpCode(HttpStatus.OK)
  @Get(':wizardId')
  async getWizardById(@Param('wizardId') wizardId: string): Promise<WizardDto> {
    return WizardDto.from(await this.wizardService.getWizardByName(wizardId))
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
