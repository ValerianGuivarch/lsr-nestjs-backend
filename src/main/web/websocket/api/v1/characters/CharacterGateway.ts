import { ApotheoseService } from '../../../../../domain/services/ApotheoseService'
import { CharacterService } from '../../../../../domain/services/CharacterService'
import { ClasseService } from '../../../../../domain/services/ClasseService'
import { MjService } from '../../../../../domain/services/MjService'
import { ProficiencyService } from '../../../../../domain/services/ProficiencyService'
import { SessionService } from '../../../../../domain/services/SessionService'
import { SkillService } from '../../../../../domain/services/SkillService'
import { CharacterPreviewVM } from '../../../../http/api/v1/characters/entities/CharacterPreviewVM'
import { CharacterVM } from '../../../../http/api/v1/characters/entities/CharacterVM'
import { Controller, Get, Param, Sse } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { concatMap, Observable } from 'rxjs'
import { Server } from 'ws'

@Controller('api/v1/sse/characters')
@WebSocketGateway()
@ApiTags('CharactersSse')
export class CharacterGateway {
  @WebSocketServer() server: Server

  constructor(
    private characterService: CharacterService,
    private classeService: ClasseService,
    private skillService: SkillService,
    private proficiencyService: ProficiencyService,
    private apotheoseService: ApotheoseService,
    private sessionService: SessionService,
    private mjService: MjService
  ) {}
  @Get(':name')
  @ApiOkResponse()
  @Sse('character')
  findByName(@Param('name') name: string): Observable<string> {
    // eslint-disable-next-line no-magic-numbers
    return this.characterService.getCharacterObservable(name).pipe(
      concatMap(async () => {
        const character = await this.characterService.findFullCharacterByName(name)
        const rest: {
          baseRest: number
          longRest: number
        } = await this.sessionService.getRestForCharacter(character.character)
        return `data: ${JSON.stringify(
          CharacterVM.of({
            character: character.character,
            skills: character.skills,
            apotheoses: character.apotheoses,
            proficiencies: character.proficiencies,
            rest: rest
          })
        )}\n\n`
      })
    )
  }

  @Get('characters-session')
  @ApiOkResponse()
  @Sse('character-session')
  findCharactersSessions(): Observable<string> {
    // eslint-disable-next-line no-magic-numbers
    return this.characterService.getCharactersSessionObservable().pipe(
      concatMap(async () => {
        const characters = await this.mjService.getSessionCharacters()
        const result = await Promise.all(
          characters.map(async (character) => {
            return CharacterPreviewVM.of({
              character: character.character
            })
          })
        )
        return `data: ${JSON.stringify(result)}\n\n`
      })
    )
  }

  @Get(':name/characters-controller')
  @ApiOkResponse()
  @Sse('character-controlled')
  findControlledByName(@Param('name') name: string): Observable<string> {
    // eslint-disable-next-line no-magic-numbers
    return this.characterService.getCharactersControlledObservable(name).pipe(
      concatMap(async () => {
        const characters = await this.characterService.findAllControllerBy(name)
        const result = await Promise.all(
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
        return `data: ${JSON.stringify(result)}\n\n`
      })
    )
  }
}
