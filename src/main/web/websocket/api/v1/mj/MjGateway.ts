import { ApotheoseService } from '../../../../../domain/services/ApotheoseService'
import { BloodlineService } from '../../../../../domain/services/BloodlineService'
import { CharacterService } from '../../../../../domain/services/CharacterService'
import { ClasseService } from '../../../../../domain/services/ClasseService'
import { MjService } from '../../../../../domain/services/MjService'
import { ProficiencyService } from '../../../../../domain/services/ProficiencyService'
import { SessionService } from '../../../../../domain/services/SessionService'
import { SkillService } from '../../../../../domain/services/SkillService'
import { CharacterVM } from '../../../../http/api/v1/characters/entities/CharacterVM'
import { Controller, Get, Sse } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { concatMap, Observable } from 'rxjs'
import { Server } from 'ws'

@Controller('api/v1/sse/mj/characters')
@WebSocketGateway()
@ApiTags('MjSse')
export class MjGateway {
  @WebSocketServer() server: Server

  constructor(
    private characterService: CharacterService,
    private mjService: MjService,
    private bloodlineService: BloodlineService,
    private classeService: ClasseService,
    private skillService: SkillService,
    private proficiencyService: ProficiencyService,
    private apotheoseService: ApotheoseService,
    private sessionService: SessionService
  ) {}
  @Get('')
  @ApiOkResponse()
  @Sse('character')
  findByName(): Observable<string> {
    // eslint-disable-next-line no-magic-numbers
    return this.characterService.getCharactersSessionObservable().pipe(
      concatMap(async () => {
        const characters = await this.mjService.getSessionCharacters()
        const result = await Promise.all(
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
        return `data: ${JSON.stringify(result)}\n\n`
      })
    )
  }
}
