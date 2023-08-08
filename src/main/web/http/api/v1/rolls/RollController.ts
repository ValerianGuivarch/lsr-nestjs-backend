import { RollVM } from './entities/RollVM'
import { SendRollRequest } from './requests/SendRollRequest'
import { BloodlineService } from '../../../../../domain/services/BloodlineService'
import { ClasseService } from '../../../../../domain/services/ClasseService'
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
    private arcaneService: SkillService
  ) {}

  @ApiOkResponse({ type: RollVM })
  @Get('')
  async getAllRolls(): Promise<RollVM[]> {
    const rolls = await this.rollService.getLast()
    return rolls.map((roll) =>
      RollVM.of({
        roll: roll
      })
    )
  }

  @ApiOkResponse({ type: RollVM })
  @Post('')
  async sendRoll(@Body() req: SendRollRequest): Promise<RollVM> {
    const roll = await this.rollService.roll({
      rollerName: req.rollerName,
      secret: req.secret,
      focus: req.focus,
      power: req.power,
      proficiency: req.proficiency,
      bonus: req.bonus,
      malus: req.malus,
      empiriqueRoll: req.empiriqueRoll,
      resistRoll: req.resistRoll,
      skillName: req.skillName
    })
    return RollVM.of({
      roll: roll
    })
  }
}
