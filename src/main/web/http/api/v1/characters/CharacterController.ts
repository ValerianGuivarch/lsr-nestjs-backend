import { CharacterPreviewVM } from './entities/CharacterPreviewVM'
import { CharacterVM } from './entities/CharacterVM'
import { CreateCharacterDto } from './requests/CreateCharacterDto'
import { UpdateCharacterDto } from './requests/UpdateCharacterDto'
import { Category } from '../../../../../domain/models/characters/Category'
import { Character } from '../../../../../domain/models/characters/Character'
import { ArcaneService } from '../../../../../domain/services/ArcaneService'
import { BloodlineService } from '../../../../../domain/services/BloodlineService'
import { CharacterService } from '../../../../../domain/services/CharacterService'
import { ClasseService } from '../../../../../domain/services/ClasseService'
import { Body, Controller, Get, Logger, Param, Post, Put, Query } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/characters')
@ApiTags('Character')
export class CharacterController {
  private readonly logger = new Logger(CharacterController.name)
  constructor(
    private characterService: CharacterService,
    private bloodlineService: BloodlineService,
    private classeService: ClasseService,
    private arcaneService: ArcaneService
  ) {}

  @ApiOkResponse({ type: CharacterPreviewVM })
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
    const classe = await this.classeService.findOneByName(createCharacterDto.classeName)
    const bloodline = await this.bloodlineService.findOneByName(createCharacterDto.bloodlineName)
    const characterToCreate = Character.characterToCreateFactory({
      name: createCharacterDto.name,
      classeName: classe.name,
      bloodlineName: bloodline.name,
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
      }),
      classe: classe,
      bloodline: bloodline,
      skills: []
    })
  }

  @Put(':name')
  @ApiOkResponse({ type: CharacterVM })
  async updateCharacter(
    @Param('name') name: string,
    @Body() updateCharacterDto: UpdateCharacterDto
  ): Promise<CharacterVM> {
    const character = await this.characterService.findOneByName(name)
    const classe = await this.classeService.findOneByName(character.classeName)
    const bloodline = await this.bloodlineService.findOneByName(character.bloodlineName)
    const arcanesList = await this.arcaneService.findOwnedArcanes(character)
    const characterToUpdate = {
      ...character,
      ...updateCharacterDto
    }
    return CharacterVM.of({
      character: await this.characterService.updateCharacter({
        character: characterToUpdate
      }),
      classe: classe,
      bloodline: bloodline,
      skills: arcanesList
    })
  }

  @ApiOkResponse()
  @Get(':name')
  async findByName(@Param('name') name: string): Promise<CharacterVM> {
    this.logger.log('get character')
    const character = await this.characterService.findOneByName(name)
    const classe = await this.classeService.findOneByName(character.classeName)
    const bloodline = await this.bloodlineService.findOneByName(character.bloodlineName)
    const arcanesList = await this.arcaneService.findOwnedArcanes(character)
    this.logger.log('get character', character)
    const vm = CharacterVM.of({
      character: character,
      classe: classe,
      bloodline: bloodline,
      skills: arcanesList
    })
    return vm
  }
}
