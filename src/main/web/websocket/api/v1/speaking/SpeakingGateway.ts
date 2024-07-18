import { SessionService } from '../../../../../domain/services/SessionService'
import { Controller, Sse } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { concatMap, Observable } from 'rxjs'
import { Server } from 'ws'

@Controller('api/v1/sse/speaking')
@WebSocketGateway()
@ApiTags('SpeakingSse')
export class SpeakingGateway {
  @WebSocketServer() server: Server

  constructor(private sessionService: SessionService) {}
  @ApiOkResponse()
  @Sse('')
  getRolls(): Observable<string> {
    // eslint-disable-next-line no-magic-numbers
    return this.sessionService.getSpeakingObservable().pipe(
      concatMap(async () => {
        const session = await this.sessionService.getSession()
        return `data: ${JSON.stringify(session.speaking)}\n\n`
      })
    )
  }
}
