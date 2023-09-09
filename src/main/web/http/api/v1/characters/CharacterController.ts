import { CharacterPreviewVM } from './entities/CharacterPreviewVM'
import { CharacterVM } from './entities/CharacterVM'
import { UpdateCharacterDto } from './requests/UpdateCharacterDto'
import { UpdateSkillsAttributionDto } from './requests/UpdateSkillsAttributionDto'
import { CharacterService } from '../../../../../domain/services/CharacterService'
import { SessionService } from '../../../../../domain/services/SessionService'
import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/characters')
@ApiTags('Character')
export class CharacterController {
  constructor(private characterService: CharacterService, private sessionService: SessionService) {}

  @ApiOkResponse({})
  @Put(':name/rest')
  async rest(@Param('name') name: string): Promise<void> {
    await this.characterService.rest(name)
  }

  @ApiOkResponse({})
  @Put(':name/skills')
  async updateSkillsAttribution(
    @Param('name') name: string,
    @Body() updateSkillsAttributionDto: UpdateSkillsAttributionDto
  ): Promise<void> {
    await this.characterService.updateSkillsAttribution(
      name,
      updateSkillsAttributionDto.skillName,
      updateSkillsAttributionDto.dailyUse,
      updateSkillsAttributionDto.limitationMax
    )
  }

  @Put(':name/apotheose/:apotheoseName')
  @ApiOkResponse({ type: CharacterVM })
  async updateApotheose(
    @Param('name') characterName: string,
    @Param('apotheoseName') apotheoseName: string
  ): Promise<CharacterVM> {
    await this.characterService.updateApotheose({
      characterName: characterName,
      apotheoseName: apotheoseName
    })
    const updatedCharacter = await this.characterService.findFullCharacterByName(characterName)
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

  @ApiOkResponse()
  @Delete(':controllerName/characters-controller/:characterToDeleteName')
  async deleteInvocation(
    @Param('controllerName') controllerName: string,
    @Param('characterToDeleteName') characterToDeleteName: string
  ): Promise<void> {
    await this.characterService.deleteControlledCharacter(controllerName, characterToDeleteName)
  }
}
