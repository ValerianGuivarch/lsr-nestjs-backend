import { FlipService } from '../../../../../domain/services/flip.service'
import { FlipDto } from '../../../api/flips/entities/flip.dto'
import { Controller, Get, Sse } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { concatMap, Observable } from 'rxjs'
import { Server } from 'ws'

@Controller('api/v1/hp/sse/flips')
@WebSocketGateway()
@ApiTags('FlipsSse')
export class FlipGateway {
  @WebSocketServer() server: Server

  constructor(private flipService: FlipService) {}
  @Get('')
  @ApiOkResponse()
  @Sse('flips')
  getFlips(): Observable<string> {
    // eslint-disable-next-line no-magic-numbers
    return this.flipService.getFlipsChangeObservable().pipe(
      concatMap(async () => {
        console.log('getFlipsPipe')
        const flips = await this.flipService.getAllFlips()
        const flipsDtos = flips.map((flip) => FlipDto.from(flip))
        console.log('flipsDtos', JSON.stringify(flipsDtos))
        return `data: ${JSON.stringify(flipsDtos)}\n\n`
      })
    )
  }
}
