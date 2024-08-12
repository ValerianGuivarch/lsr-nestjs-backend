import { RollVM } from './entities/RollVM'
import { SendRollRequest } from './requests/SendRollRequest'
import { UpdateRollRequest } from './requests/UpdateRollRequest'
import { CharacterService } from '../../../../../domain/services/CharacterService'
import { ClasseService } from '../../../../../domain/services/ClasseService'
import { RollService } from '../../../../../domain/services/RollService'
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/rolls')
@ApiTags('Roll')
export class RollController {
  constructor(
    private rollService: RollService,
    private classeService: ClasseService,
    private characterService: CharacterService
  ) {}

  @ApiOkResponse({ type: RollVM })
  @Get(':name')
  async getAllRolls(@Param('name') name: string): Promise<RollVM[]> {
    const rolls = await this.rollService.getLastExceptSecretOrDarkness(name)
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
  @Put(':id')
  async updateRoll(@Param('id') id: string, @Body() req: UpdateRollRequest): Promise<void> {
    console.log('updateRoll', id, req)
    const rollToUpdate = await this.rollService.findOneById(id)
    if (rollToUpdate) {
      await this.rollService.updateRoll({
        ...rollToUpdate,
        ...req
      })
    }
  }

  @ApiOkResponse({ type: RollVM })
  @Post('')
  async sendRoll(@Body() req: SendRollRequest): Promise<void> {
    const character = await this.characterService.findOneByName(req.rollerName)
    await this.rollService.roll({
      character: character,
      skillId: req.skillId,
      secret: req.secret,
      focus: req.focus,
      power: req.power,
      proficiency: req.proficiency,
      bonus: req.bonus,
      malus: req.malus,
      empiriqueRoll: req.empiriqueRoll,
      resistRoll: req.resistRoll,
      affect: true
    })
  }

  @ApiOkResponse()
  @Delete(':id')
  async deleteRoll(@Param() id: string): Promise<void> {
    await this.rollService.delete(id)
  }

  @ApiOkResponse({})
  @Delete('')
  async resetRolls(): Promise<void> {
    await this.rollService.deleteAll()
  }
}
