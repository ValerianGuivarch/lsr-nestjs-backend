import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JdrService } from '../../domain/jdr/JdrService'
import { JdrDto } from '../jdr/dto/JdrDto'
import { CharacterService } from '../../domain/characters/CharacterService'
import {
  AddCharacterItemRequest,
  AddCharacterResourceRequest,
  AddCharacterRequest,
  UpdateCharacterRequest,
  UpdateCharacterResourceRequest,
  UpdateCharacterStatRequest
} from './dto/CharacterRequests'

// Character mutations still respond with the full recomposed Jdr to preserve the existing frontend contract.
@Controller('api/v1/jdr')
@ApiTags('JdR')
export class CharacterController {
  constructor(
    private readonly characterService: CharacterService,
    private readonly jdrService: JdrService
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/characters')
  async addCharacter(@Param('jdrSlug') jdrSlug: string, @Body() body: AddCharacterRequest): Promise<JdrDto> {
    await this.characterService.add(jdrSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Put(':jdrSlug/characters/:characterSlug')
  async updateCharacter(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Body() body: UpdateCharacterRequest
  ): Promise<JdrDto> {
    await this.characterService.update(jdrSlug, characterSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Delete(':jdrSlug/characters/:characterSlug')
  async removeCharacter(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string
  ): Promise<JdrDto> {
    await this.characterService.remove(jdrSlug, characterSlug)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/characters/:characterSlug/groups/:groupSlug')
  async addCharacterGroup(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Param('groupSlug') groupSlug: string
  ): Promise<JdrDto> {
    await this.characterService.addCharacterGroup(jdrSlug, characterSlug, groupSlug)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Delete(':jdrSlug/characters/:characterSlug/groups/:groupSlug')
  async removeCharacterGroup(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Param('groupSlug') groupSlug: string
  ): Promise<JdrDto> {
    await this.characterService.removeCharacterGroup(jdrSlug, characterSlug, groupSlug)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/characters/:characterSlug/traits/:traitSlug')
  async addCharacterTrait(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Param('traitSlug') traitSlug: string
  ): Promise<JdrDto> {
    await this.characterService.addCharacterTrait(jdrSlug, characterSlug, traitSlug)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Delete(':jdrSlug/characters/:characterSlug/traits/:traitSlug')
  async removeCharacterTrait(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Param('traitSlug') traitSlug: string
  ): Promise<JdrDto> {
    await this.characterService.removeCharacterTrait(jdrSlug, characterSlug, traitSlug)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/characters/:characterSlug/items')
  async addCharacterItem(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Body() body: AddCharacterItemRequest
  ): Promise<JdrDto> {
    await this.characterService.addCharacterItem(jdrSlug, characterSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Delete(':jdrSlug/characters/:characterSlug/items/:itemSlug')
  async removeCharacterItem(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Param('itemSlug') itemSlug: string
  ): Promise<JdrDto> {
    await this.characterService.removeCharacterItem(jdrSlug, characterSlug, itemSlug)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Put(':jdrSlug/characters/:characterSlug/stats/:statSlug')
  async updateCharacterStat(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Param('statSlug') statSlug: string,
    @Body() body: UpdateCharacterStatRequest
  ): Promise<JdrDto> {
    await this.characterService.updateCharacterStat(jdrSlug, characterSlug, statSlug, body.value)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Put(':jdrSlug/characters/:characterSlug/resources/:resourceSlug')
  async updateCharacterResource(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Param('resourceSlug') resourceSlug: string,
    @Body() body: UpdateCharacterResourceRequest
  ): Promise<JdrDto> {
    await this.characterService.updateCharacterResource(jdrSlug, characterSlug, resourceSlug, body.value)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/characters/:characterSlug/resources')
  async addCharacterResource(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Body() body: AddCharacterResourceRequest
  ): Promise<JdrDto> {
    await this.characterService.addCharacterResource(jdrSlug, characterSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Delete(':jdrSlug/characters/:characterSlug/resources/:resourceSlug')
  async removeCharacterResource(
    @Param('jdrSlug') jdrSlug: string,
    @Param('characterSlug') characterSlug: string,
    @Param('resourceSlug') resourceSlug: string
  ): Promise<JdrDto> {
    await this.characterService.removeCharacterResource(jdrSlug, characterSlug, resourceSlug)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }
}
