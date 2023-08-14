import { RollService } from '../../../../../domain/services/RollService'
import { RollVM } from '../../../../http/api/v1/rolls/entities/RollVM'
import { Controller, Get, Sse } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { concatMap, Observable } from 'rxjs'
import { Server } from 'ws'

@Controller('api/v1/sse/rolls')
@WebSocketGateway()
@ApiTags('RollsSse')
export class RollGateway {
  @WebSocketServer() server: Server

  constructor(private rollService: RollService) {}
  @Get('')
  @ApiOkResponse()
  @Sse('rolls')
  getRolls(): Observable<string> {
    // eslint-disable-next-line no-magic-numbers
    return this.rollService.getRollsChangeObservable().pipe(
      concatMap(async () => {
        const rolls = await this.rollService.getLast()
        const rolls2 = rolls.filter((roll) => !roll.resistRoll)
        const rolls3 = rolls2.map((roll) =>
          RollVM.of({
            roll: roll,
            othersRolls: rolls.filter((r) => r.resistRoll === '' + roll.id)
          })
        )
        return `data: ${JSON.stringify(rolls3)}\n\n`
      })
    )
  }
}
