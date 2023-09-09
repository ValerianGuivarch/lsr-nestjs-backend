import { CharacterService } from '../../../../../domain/services/CharacterService'
import { MjService } from '../../../../../domain/services/MjService'
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

  constructor(private characterService: CharacterService, private mjService: MjService) {}
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
