import { CharacterPreviewVM } from './entities/CharacterPreviewVM'
import { CharacterVM } from './entities/CharacterVM'
import { CreateCharacterDto } from './requests/CreateCharacterDto'
import { UpdateCharacterDto } from './requests/UpdateCharacterDto'
import { Category } from '../../../../../domain/models/characters/Category'
import { Character } from '../../../../../domain/models/characters/Character'
import { CharacterService } from '../../../../../domain/services/CharacterService'
import { Body, Controller, Get, Logger, Param, Post, Put, Query } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/characters')
@ApiTags('Character')
export class CharacterController {
  private readonly logger = new Logger(CharacterController.name)
  constructor(private characterService: CharacterService) {}

  @ApiOkResponse({ type: CharacterVM })
  @Get('')
  async getAllCharacters(@Query('category') category?: Category): Promise<CharacterPreviewVM[]> {
    const characters = await this.characterService.findAll(category)
    return characters.map((character) =>
      CharacterPreviewVM.of({
        character: character
      })
    )
  }

  @ApiOkResponse({ type: CharacterVM })
  @Post('')
  async createCharacter(@Body() createCharacterDto: CreateCharacterDto): Promise<CharacterVM> {
    const characterToCreate = Character.characterToCreateFactory({
      name: createCharacterDto.name,
      classe: createCharacterDto.classe,
      bloodline: createCharacterDto.bloodline,
      chair: createCharacterDto.chair,
      esprit: createCharacterDto.esprit,
      essence: createCharacterDto.essence,
      pvMax: createCharacterDto.pvMax,
      pfMax: createCharacterDto.pfMax,
      ppMax: createCharacterDto.ppMax,
      arcanesMax: createCharacterDto.arcanesMax,
      niveau: createCharacterDto.niveau,
      lux: createCharacterDto.lux,
      umbra: createCharacterDto.umbra,
      secunda: createCharacterDto.secunda,
      category: createCharacterDto.category,
      genre: createCharacterDto.genre,
      picture: createCharacterDto.picture,
      pictureApotheose: createCharacterDto.pictureApotheose,
      background: createCharacterDto.background,
      buttonColor: createCharacterDto.buttonColor,
      textColor: createCharacterDto.textColor
    })
    return CharacterVM.of({
      character: await this.characterService.createCharacter({
        character: characterToCreate
      })
    })
  }

  @Put(':name')
  @ApiOkResponse({ type: CharacterVM })
  async updateCharacter(
    @Param('name') name: string,
    @Body() updateCharacterDto: UpdateCharacterDto
  ): Promise<CharacterVM> {
    const characterToUpdate = new Character({
      apotheose: updateCharacterDto.apotheose,
      apotheoseImprovementList: updateCharacterDto.apotheoseImprovementList,
      battleState: updateCharacterDto.battleState,
      notes: updateCharacterDto.notes,
      relance: updateCharacterDto.relance,
      name: updateCharacterDto.name,
      classe: updateCharacterDto.classe,
      bloodline: updateCharacterDto.bloodline,
      chair: updateCharacterDto.chair,
      esprit: updateCharacterDto.esprit,
      essence: updateCharacterDto.essence,
      pv: updateCharacterDto.pv,
      pvMax: updateCharacterDto.pvMax,
      pf: updateCharacterDto.pf,
      pfMax: updateCharacterDto.pfMax,
      pp: updateCharacterDto.pp,
      ppMax: updateCharacterDto.ppMax,
      dettes: updateCharacterDto.dettes,
      arcanes: updateCharacterDto.arcanes,
      arcanesMax: updateCharacterDto.arcanesMax,
      niveau: updateCharacterDto.niveau,
      lux: updateCharacterDto.lux,
      umbra: updateCharacterDto.umbra,
      secunda: updateCharacterDto.secunda,
      category: updateCharacterDto.category,
      genre: updateCharacterDto.genre,
      picture: updateCharacterDto.picture,
      pictureApotheose: updateCharacterDto.pictureApotheose,
      background: updateCharacterDto.background,
      buttonColor: updateCharacterDto.buttonColor,
      textColor: updateCharacterDto.textColor
    })
    return CharacterVM.of({
      character: await this.characterService.updateCharacter({
        character: characterToUpdate
      })
    })
  }

  @ApiOkResponse()
  @Get(':name')
  async findByName(@Param('name') name: string): Promise<CharacterVM> {
    this.logger.log('get character')
    const character = await this.characterService.findByName(name)
    this.logger.log('get character', character)
    return CharacterVM.of({
      character: character
    })
  }
}
