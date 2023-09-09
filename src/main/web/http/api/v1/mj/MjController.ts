import { InitDatabase } from '../../../../../config/evolutions/InitDatabase'
import { ApotheoseService } from '../../../../../domain/services/ApotheoseService'
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
    this.mjService.newTurn()
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
}
