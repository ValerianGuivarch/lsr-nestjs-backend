import { CharacterPreviewVM } from './entities/CharacterPreviewVM'
import { CharacterVM } from './entities/CharacterVM'
import { SkillVM } from './entities/SkillVM'
import { UpdateCharacterDto } from './requests/UpdateCharacterDto'
import { UpdateSkillsAttributionDto } from './requests/UpdateSkillsAttributionDto'
import { ApotheoseService } from '../../../../../domain/services/ApotheoseService'
import { CharacterService } from '../../../../../domain/services/CharacterService'
import { SessionService } from '../../../../../domain/services/SessionService'
import { SkillService } from '../../../../../domain/services/SkillService'
import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/characters')
@ApiTags('Character')
export class CharacterController {
  constructor(
    private characterService: CharacterService,
    private sessionService: SessionService,
    private skillService: SkillService,
    private apotheoseService: ApotheoseService
  ) {}

  @ApiOkResponse({})
  @Put(':name/rest')
  async rest(@Param('name') name: string): Promise<void> {
    await this.characterService.rest(name)
  }

  @Put(':name')
  @ApiOkResponse({ type: CharacterVM })
  async updateCharacter(
    @Param('name') name: string,
    @Body() updateCharacterDto: UpdateCharacterDto
  ): Promise<CharacterVM> {
    const character = await this.characterService.findOneByName(name)
    const characterToUpdate = {
      ...character,
      ...updateCharacterDto
    }
    if (updateCharacterDto.apotheoseName) {
      const apotheose = await this.apotheoseService.findOneByName(updateCharacterDto.apotheoseName)
      characterToUpdate.currentApotheose = apotheose
    } else {
      characterToUpdate.currentApotheose = null
    }
    await this.characterService.updateCharacter({ character: characterToUpdate })
    const updatedCharacter = await this.characterService.findFullCharacterByName(name)
    const rest: {
      baseRest: number
      longRest: number
    } = await this.sessionService.getRestForCharacter(updatedCharacter.character)
    return CharacterVM.of({
      character: updatedCharacter.character,
      skills: updatedCharacter.skills,
      apotheoses: updatedCharacter.apotheoses,
      proficiencies: updatedCharacter.proficiencies,
      rest: rest
    })
  }

  @ApiOkResponse({})
  @Put(':name/skills')
  async updateSkillsAttribution(
    @Param('name') name: string,
    @Body() updateSkillsAttributionDto: UpdateSkillsAttributionDto
  ): Promise<void> {
    await this.characterService.updateSkillsAttribution(
      name,
      updateSkillsAttributionDto.skillId.toString(),
      updateSkillsAttributionDto.dailyUse,
      updateSkillsAttributionDto.dailyUseMax,
      updateSkillsAttributionDto.affected ?? true,
      updateSkillsAttributionDto.arcaneDetteToDecrease
    )
  }

  @Get(':name/arcane-primes')
  @ApiOkResponse({ type: SkillVM, isArray: true })
  async getArcanePrimes(@Param('name') name: string): Promise<SkillVM[]> {
    const skills = (await this.skillService.findArcanePrimes(name)).sort((a, b) => {
      if (a.name > b.name) {
        return 1
      } else {
        // eslint-disable-next-line no-magic-numbers
        return -1
      }
    })
    return skills.map((skill) => {
      return SkillVM.of({
        skill: skill,
        character: undefined
      })
    })
  }

  @ApiOkResponse({ type: CharacterPreviewVM })
  @Get('')
  async getAllCharacters(): Promise<CharacterPreviewVM[]> {
    const characters = await this.characterService.findAll()
    return characters.map((character) =>
      CharacterPreviewVM.of({
        character: character
      })
    )
  }

  @ApiOkResponse()
  @Get(':name')
  async findByName(@Param('name') name: string): Promise<CharacterVM> {
    const character = await this.characterService.findFullCharacterByName(name)
    const rest: {
      baseRest: number
      longRest: number
    } = await this.sessionService.getRestForCharacter(character.character)
    return CharacterVM.of({
      character: character.character,
      skills: character.skills,
      apotheoses: character.apotheoses,
      proficiencies: character.proficiencies,
      rest: rest
    })
  }

  @ApiOkResponse({ type: CharacterVM })
  @Get(':name/characters-controller')
  async findControlledByName(@Param('name') name: string): Promise<CharacterVM[]> {
    const characters = await this.characterService.findAllControllerBy(name)
    return await Promise.all(
      characters.map(async (character) => {
        return CharacterVM.of({
          character: character.character,
          skills: character.skills,
          apotheoses: character.apotheoses,
          proficiencies: character.proficiencies,
          rest: {
            baseRest: 3,
            longRest: 0
          }
        })
      })
    )
  }

  @Get('characters-session')
  @ApiOkResponse()
  async findCharactersSessions(): Promise<Awaited<CharacterPreviewVM>[]> {
    const characters = await this.sessionService.getSessionCharacters()
    return await Promise.all(
      characters.map(async (character) => {
        return CharacterPreviewVM.of({
          character: character.character
        })
      })
    )
  }

  @ApiOkResponse()
  @Delete(':controllerName/characters-controller/:characterToDeleteName')
  async deleteInvocation(
    @Param('controllerName') controllerName: string,
    @Param('characterToDeleteName') characterToDeleteName: string
  ): Promise<void> {
    await this.characterService.deleteControlledCharacter(controllerName, characterToDeleteName)
  }
}
