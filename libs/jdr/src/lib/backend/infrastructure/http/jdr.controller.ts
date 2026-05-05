import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JdrService } from '../../application/jdr.service'
import { DiceRollDto, JdrDto, JdrSummaryDto } from './jdr.dto'
import {
  AddCharacterRequest,
  AddClassRequest,
  AddClassResourceRequest,
  AddGroupRequest,
  AddGroupItemRequest,
  AddItemRequest,
  AddResourceRequest,
  AddStatRequest,
  AddTraitRequest,
  CreateJdrRequest,
  UpdateCharacterRequest,
  UpdateGroupResourceRequest,
  UpdateJdrRequest
} from './jdr.requests'

@Controller('api/v1/jdr')
@ApiTags('JdR')
export class JdrController {
  constructor(private readonly jdrService: JdrService) {}

  @Get()
  async findAll(): Promise<JdrSummaryDto[]> {
    return this.jdrService.findAll()
  }

  @Get(':jdrSlug')
  async findOne(@Param('jdrSlug') jdrSlug: string): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async create(@Body() body: CreateJdrRequest): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.create(body))
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':jdrSlug')
  async delete(@Param('jdrSlug') jdrSlug: string): Promise<void> {
    return this.jdrService.delete(jdrSlug)
  }

  @Put(':jdrSlug')
  async update(@Param('jdrSlug') jdrSlug: string, @Body() body: UpdateJdrRequest): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.update(jdrSlug, body))
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/stats')
  async addStat(@Param('jdrSlug') jdrSlug: string, @Body() body: AddStatRequest): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.addStat(jdrSlug, body))
  }

  @Delete(':jdrSlug/stats/:statSlug')
  async removeStat(@Param('jdrSlug') jdrSlug: string, @Param('statSlug') statSlug: string): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.removeStat(jdrSlug, statSlug))
  }

  // ─── Traits ───────────────────────────────────────────────────────────────

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/traits')
  async addTrait(@Param('jdrSlug') jdrSlug: string, @Body() body: AddTraitRequest): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.addTrait(jdrSlug, body))
  }

  @Delete(':jdrSlug/traits/:traitSlug')
  async removeTrait(@Param('jdrSlug') jdrSlug: string, @Param('traitSlug') traitSlug: string): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.removeTrait(jdrSlug, traitSlug))
  }

  // ─── Resources ────────────────────────────────────────────────────────────

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/resources')
  async addResource(@Param('jdrSlug') jdrSlug: string, @Body() body: AddResourceRequest): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.addResource(jdrSlug, body))
  }

  @Delete(':jdrSlug/resources/:resourceSlug')
  async removeResource(@Param('jdrSlug') jdrSlug: string, @Param('resourceSlug') resourceSlug: string): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.removeResource(jdrSlug, resourceSlug))
  }

  @Put(':jdrSlug/group-resources/:resourceSlug')
  async updateGroupResource(
    @Param('jdrSlug') jdrSlug: string,
    @Param('resourceSlug') resourceSlug: string,
    @Body() body: UpdateGroupResourceRequest
  ): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.updateGroupResource(jdrSlug, resourceSlug, body.value))
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/classes')
  async addClass(@Param('jdrSlug') jdrSlug: string, @Body() body: AddClassRequest): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.addClass(jdrSlug, body))
  }

  @Delete(':jdrSlug/classes/:classSlug')
  async removeClass(@Param('jdrSlug') jdrSlug: string, @Param('classSlug') classSlug: string): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.removeClass(jdrSlug, classSlug))
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/classes/:classSlug/resources')
  async addClassResource(
    @Param('jdrSlug') jdrSlug: string,
    @Param('classSlug') classSlug: string,
    @Body() body: AddClassResourceRequest
  ): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.addClassResource(jdrSlug, classSlug, body))
  }

  @Delete(':jdrSlug/classes/:classSlug/resources/:resourceSlug')
  async removeClassResource(
    @Param('jdrSlug') jdrSlug: string,
    @Param('classSlug') classSlug: string,
    @Param('resourceSlug') resourceSlug: string
  ): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.removeClassResource(jdrSlug, classSlug, resourceSlug))
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/groups')
  async addGroup(@Param('jdrSlug') jdrSlug: string, @Body() body: AddGroupRequest): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.addGroup(jdrSlug, body))
  }

  @Delete(':jdrSlug/groups/:groupSlug')
  async removeGroup(@Param('jdrSlug') jdrSlug: string, @Param('groupSlug') groupSlug: string): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.removeGroup(jdrSlug, groupSlug))
  }

  // ─── Items ────────────────────────────────────────────────────────────────

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/items')
  async addItem(@Param('jdrSlug') jdrSlug: string, @Body() body: AddItemRequest): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.addItem(jdrSlug, body))
  }

  @Delete(':jdrSlug/items/:itemSlug')
  async removeItem(@Param('jdrSlug') jdrSlug: string, @Param('itemSlug') itemSlug: string): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.removeItem(jdrSlug, itemSlug))
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/group-items')
  async addGroupItem(@Param('jdrSlug') jdrSlug: string, @Body() body: AddGroupItemRequest): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.addGroupItem(jdrSlug, body))
  }

  @Delete(':jdrSlug/group-items/:itemSlug')
  async removeGroupItem(@Param('jdrSlug') jdrSlug: string, @Param('itemSlug') itemSlug: string): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.removeGroupItem(jdrSlug, itemSlug))
  }

  // ─── Characters ───────────────────────────────────────────────────────────

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/characters')
  async addCharacter(@Param('jdrSlug') jdrSlug: string, @Body() body: AddCharacterRequest): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.addCharacter(jdrSlug, body))
  }

  @Put(':jdrSlug/characters/:characterSlug')
  async updateCharacter(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Body() body: UpdateCharacterRequest
  ): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.updateCharacter(jdrSlug, characterSlug, body))
  }

  @Delete(':jdrSlug/characters/:characterSlug')
  async removeCharacter(@Param('jdrSlug') jdrSlug: string, @Param('characterSlug') characterSlug: string): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.removeCharacter(jdrSlug, characterSlug))
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/characters/:characterSlug/traits/:traitSlug')
  async addCharacterTrait(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Param('traitSlug') traitSlug: string
  ): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.addCharacterTrait(jdrSlug, characterSlug, traitSlug))
  }

  @Delete(':jdrSlug/characters/:characterSlug/traits/:traitSlug')
  async removeCharacterTrait(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Param('traitSlug') traitSlug: string
  ): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.removeCharacterTrait(jdrSlug, characterSlug, traitSlug))
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/characters/:characterSlug/items')
  async addCharacterItem(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Body() body: AddGroupItemRequest
  ): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.addCharacterItem(jdrSlug, characterSlug, body))
  }

  @Delete(':jdrSlug/characters/:characterSlug/items/:itemSlug')
  async removeCharacterItem(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Param('itemSlug') itemSlug: string
  ): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.removeCharacterItem(jdrSlug, characterSlug, itemSlug))
  }

  @Put(':jdrSlug/characters/:characterSlug/stats/:statSlug')
  async updateCharacterStat(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Param('statSlug') statSlug: string,
    @Body() body: { value: number }
  ): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.updateCharacterStat(jdrSlug, characterSlug, statSlug, body.value))
  }

  @Put(':jdrSlug/characters/:characterSlug/resources/:resourceSlug')
  async updateCharacterResource(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Param('resourceSlug') resourceSlug: string,
    @Body() body: { value: number }
  ): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.updateCharacterResource(jdrSlug, characterSlug, resourceSlug, body.value))
  }

  // ─── Dice Rolls ───────────────────────────────────────────────────────────

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/characters/:characterSlug/roll/:statSlug')
  async rollDice(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Param('statSlug') statSlug: string
  ): Promise<DiceRollDto> {
    return DiceRollDto.from(await this.jdrService.rollDice(jdrSlug, characterSlug, statSlug))
  }

  @Get(':jdrSlug/rolls')
  async getLastRolls(
    @Param('jdrSlug') jdrSlug: string,
    @Query('size') size?: string
  ): Promise<DiceRollDto[]> {
    const rolls = await this.jdrService.getLastRolls(jdrSlug, size ? parseInt(size, 10) : 30)
    return rolls.map(DiceRollDto.from)
  }
}
