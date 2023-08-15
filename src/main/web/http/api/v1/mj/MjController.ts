import { InitDatabase } from '../../../../../config/evolutions/InitDatabase'
import { ApotheoseService } from '../../../../../domain/services/ApotheoseService'
import { BloodlineService } from '../../../../../domain/services/BloodlineService'
import { CharacterService } from '../../../../../domain/services/CharacterService'
import { ClasseService } from '../../../../../domain/services/ClasseService'
import { MjService } from '../../../../../domain/services/MjService'
import { ProficiencyService } from '../../../../../domain/services/ProficiencyService'
import { RollService } from '../../../../../domain/services/RollService'
import { SessionService } from '../../../../../domain/services/SessionService'
import { SkillService } from '../../../../../domain/services/SkillService'
import { CharacterVM } from '../characters/entities/CharacterVM'
import { Controller, Get, Put } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/mj')
@ApiTags('Mj')
export class MjController {
  constructor(
    private mjService: MjService,
    private characterService: CharacterService,
    private bloodlineService: BloodlineService,
    private classeService: ClasseService,
    private skillService: SkillService,
    private proficiencyService: ProficiencyService,
    private sessionService: SessionService,
    private apotheoseService: ApotheoseService,
    private rollService: RollService,
    private initDatabase: InitDatabase
  ) {}

  @ApiOkResponse({})
  @Put('newTurn')
  async newTurn(): Promise<void> {
    const apotheosedCharacters = await this.mjService.newTurn()
    for (const character of apotheosedCharacters) {
      const apotheose = await this.apotheoseService.findApotheosesByCharacterAndName(character, character.apotheoseName)
      this.rollService.rollApotheose({
        character: character,
        apotheose: apotheose
      })
    }
  }
  @ApiOkResponse({})
  @Put('resetRolls')
  async resetRolls(): Promise<void> {
    await this.rollService.deleteAll()
  }

  @ApiOkResponse({})
  @Put('initDatabase')
  async runInitDatabase(): Promise<void> {
    await this.initDatabase.initDatabase()
  }

  @ApiOkResponse({ type: CharacterVM })
  @Get('characters')
  async getSessionCharacters(): Promise<CharacterVM[]> {
    const characters = await this.mjService.getSessionCharacters()

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
