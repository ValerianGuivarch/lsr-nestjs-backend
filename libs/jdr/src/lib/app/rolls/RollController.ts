import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { RollService } from '../../domain/rolls/RollService'
import { DiceRollDto } from './dto/RollDto'
import { RollArbitraryRequest, RollDiceRequest } from './dto/RollRequests'

@Controller('api/v1/jdr')
@ApiTags('JdR')
export class RollController {
  constructor(private readonly rollService: RollService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/characters/:characterSlug/roll/:statSlug')
  async rollDice(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Param('statSlug') statSlug: string,
    @Body() body: RollDiceRequest
  ): Promise<DiceRollDto> {
    return DiceRollDto.from(await this.rollService.rollDice(jdrSlug, characterSlug, statSlug, body?.rollState, body?.text))
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/characters/:characterSlug/roll-arbitrary')
  async rollArbitrary(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Body() body: RollArbitraryRequest
  ): Promise<DiceRollDto> {
    return DiceRollDto.from(await this.rollService.rollArbitrary(jdrSlug, characterSlug, body.formula))
  }

  @Get(':jdrSlug/rolls')
  async getLastRolls(
    @Param('jdrSlug') jdrSlug: string,
    @Query('size') size?: string
  ): Promise<DiceRollDto[]> {
    const rolls = await this.rollService.getLastRolls(jdrSlug, size ? parseInt(size, 10) : 30)
    return rolls.map(DiceRollDto.from)
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':jdrSlug/rolls/:rollId')
  async deleteRoll(@Param('jdrSlug') jdrSlug: string, @Param('rollId') rollId: string): Promise<void> {
    await this.rollService.deleteRoll(jdrSlug, rollId)
  }
}
