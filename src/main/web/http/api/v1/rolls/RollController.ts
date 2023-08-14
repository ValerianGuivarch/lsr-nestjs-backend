import { RollVM } from './entities/RollVM'
import { SendRollRequest } from './requests/SendRollRequest'
import { ApotheoseService } from '../../../../../domain/services/ApotheoseService'
import { BloodlineService } from '../../../../../domain/services/BloodlineService'
import { CharacterService } from '../../../../../domain/services/CharacterService'
import { ClasseService } from '../../../../../domain/services/ClasseService'
import { InvocationService } from '../../../../../domain/services/InvocationService'
import { RollService } from '../../../../../domain/services/RollService'
import { SkillService } from '../../../../../domain/services/SkillService'
import { Body, Controller, Get, Logger, Post } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/rolls')
@ApiTags('Roll')
export class RollController {
  private readonly logger = new Logger(RollController.name)
  constructor(
    private rollService: RollService,
    private bloodlineService: BloodlineService,
    private classeService: ClasseService,
    private skillService: SkillService,
    private characterService: CharacterService,
    private invocationService: InvocationService,
    private apotheoseService: ApotheoseService
  ) {}

  @ApiOkResponse({ type: RollVM })
  @Get('')
  async getAllRolls(): Promise<RollVM[]> {
    const rolls = await this.rollService.getLast()
    return rolls
      .filter((roll) => !roll.resistRoll)
      .map((roll) =>
        RollVM.of({
          roll: roll,
          othersRolls: rolls.filter((r) => r.resistRoll === '' + roll.id)
        })
      )
  }

  @ApiOkResponse({ type: RollVM })
  @Post('')
  async sendRoll(@Body() req: SendRollRequest): Promise<void> {
    const character = await this.characterService.findOneByName(req.rollerName)
    const skill = await this.skillService.findOneSkillByCharacterAndName(character, req.skillName)
    const roll = await this.rollService.roll({
      character: character,
      skill: skill,
      secret: req.secret,
      focus: req.focus,
      power: req.power,
      proficiency: req.proficiency,
      bonus: req.bonus,
      malus: req.malus,
      empiriqueRoll: req.empiriqueRoll,
      resistRoll: req.resistRoll
    })
    if (skill.invocationTemplateName) {
      await this.invocationService.createInvocation(skill.invocationTemplateName, roll)
    }
  }
}
