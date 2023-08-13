import { CharacterPreviewVM } from './entities/CharacterPreviewVM'
import { CharacterVM } from './entities/CharacterVM'
import { CreateCharacterDto } from './requests/CreateCharacterDto'
import { UpdateCharacterDto } from './requests/UpdateCharacterDto'
import { Category } from '../../../../../domain/models/characters/Category'
import { Character } from '../../../../../domain/models/characters/Character'
import { ApotheoseService } from '../../../../../domain/services/ApotheoseService'
import { BloodlineService } from '../../../../../domain/services/BloodlineService'
import { CharacterService } from '../../../../../domain/services/CharacterService'
import { ClasseService } from '../../../../../domain/services/ClasseService'
import { ProficiencyService } from '../../../../../domain/services/ProficiencyService'
import { SessionService } from '../../../../../domain/services/SessionService'
import { SkillService } from '../../../../../domain/services/SkillService'
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
    private skillService: SkillService,
    private proficiencyService: ProficiencyService,
    private sessionService: SessionService,
    private apotheoseService: ApotheoseService
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
    const createdCharacter = await this.characterService.createCharacter({
      character: characterToCreate
    })
    const skillsList = await this.skillService.findSkillsByCharacter(createdCharacter)
    const apotheosesList = await this.apotheoseService.findApotheosesByCharacter(createdCharacter)
    const proficienciesList = await this.proficiencyService.findProficienciesByCharacter(createdCharacter)
    const rest: {
      baseRest: number
      longRest: number
    } = await this.sessionService.getRestForCharacter(characterToCreate)
    return CharacterVM.of({
      character: createdCharacter,
      classe: classe,
      bloodline: bloodline,
      skills: skillsList,
      proficiencies: proficienciesList,
      rest: rest,
      apotheoses: apotheosesList
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
    const skillsList = await this.skillService.findSkillsByCharacter(character)
    const proficienciesList = await this.proficiencyService.findProficienciesByCharacter(character)
    const characterToUpdate = {
      ...character,
      ...updateCharacterDto
    }
    const updatedCharacter = await this.characterService.updateCharacter({ character: characterToUpdate })
    const apotheosesList = await this.apotheoseService.findApotheosesByCharacter(updatedCharacter)
    const rest: {
      baseRest: number
      longRest: number
    } = await this.sessionService.getRestForCharacter(updatedCharacter)
    return CharacterVM.of({
      character: updatedCharacter,
      classe: classe,
      bloodline: bloodline,
      skills: skillsList,
      proficiencies: proficienciesList,
      rest: rest,
      apotheoses: apotheosesList
    })
  }

  @ApiOkResponse()
  @Get(':name')
  async findByName(@Param('name') name: string): Promise<CharacterVM> {
    const character = await this.characterService.findOneByName(name)
    const classe = await this.classeService.findOneByName(character.classeName)
    const bloodline = await this.bloodlineService.findOneByName(character.bloodlineName)
    const skillsList = await this.skillService.findSkillsByCharacter(character)
    const proficienciesList = await this.proficiencyService.findProficienciesByCharacter(character)
    const apotheosesList = await this.apotheoseService.findApotheosesByCharacter(character)
    const rest: {
      baseRest: number
      longRest: number
    } = await this.sessionService.getRestForCharacter(character)
    return CharacterVM.of({
      character: character,
      classe: classe,
      bloodline: bloodline,
      skills: skillsList,
      proficiencies: proficienciesList,
      rest: rest,
      apotheoses: apotheosesList
    })
  }

  @ApiOkResponse({ type: CharacterVM })
  @Get(':name/characters-controller')
  async findControlledByName(@Param('name') name: string): Promise<CharacterVM[]> {
    const characters = await this.characterService.findAllControllerBy(name)
    return await Promise.all(
      characters.map(async (character) => {
        const classe = await this.classeService.findOneByName(character.classeName)
        const bloodline = await this.bloodlineService.findOneByName(character.bloodlineName)
        const skillsList = await this.skillService.findSkillsByCharacter(character)
        const proficienciesList = await this.proficiencyService.findProficienciesByCharacter(character)
        const apotheosesList = await this.apotheoseService.findApotheosesByCharacter(character)

        return CharacterVM.of({
          character: character,
          classe: classe,
          bloodline: bloodline,
          skills: skillsList,
          proficiencies: proficienciesList,
          rest: {
            baseRest: 3,
            longRest: 0
          },
          apotheoses: apotheosesList
        })
      })
    )
  }
}
