import { ArcaneService } from '../../../../../domain/services/ArcaneService'
import { BloodlineService } from '../../../../../domain/services/BloodlineService'
import { CharacterService } from '../../../../../domain/services/CharacterService'
import { ClasseService } from '../../../../../domain/services/ClasseService'
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
    private bloodlineService: BloodlineService,
    private classeService: ClasseService,
    private arcaneService: ArcaneService
  ) {}
  @Get(':name')
  @ApiOkResponse()
  @Sse('character')
  findByName(@Param('name') name: string): Observable<string> {
    // eslint-disable-next-line no-magic-numbers
    return this.characterService.getCharacterObservable(name).pipe(
      concatMap(async () => {
        const character = await this.characterService.findOneByName(name)
        const classe = await this.classeService.findOneByName(character.classeName)
        const bloodline = await this.bloodlineService.findOneByName(character.bloodlineName)
        const arcanesList = await this.arcaneService.findOwnedArcanes(character)
        return `data: ${JSON.stringify(
          CharacterVM.of({
            character: character,
            classe: classe,
            bloodline: bloodline,
            skills: arcanesList
          })
        )}\n\n`
      })
    )
  }
}
