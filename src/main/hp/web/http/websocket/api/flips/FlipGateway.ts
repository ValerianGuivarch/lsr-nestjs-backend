/*import { FlipService } from '../../../../../domain/services/flip.service'
import { Controller, Get, Sse } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { map, Observable } from 'rxjs'
import { Server } from 'ws'

@Controller('api/v1/hp/sse/flips')
@WebSocketGateway()
@ApiTags('FlipsSse')
export class FlipGateway {
  @WebSocketServer() server: Server

  constructor(private flipService: FlipService) {}
  @Get('')
  @Sse()
  getFlips(): Observable<string> {
    console.log('SSE getFlips() called')
    return this.flipService.getFlipsChangeObservable().pipe(
      map((flips) => {
        console.log('Data emitted (before formatting):', flips)
        const formattedData = `data: ${JSON.stringify(flips)}\n\n`
        console.log('Formatted Data:', formattedData)
        return formattedData
      })
    )
  }
}
*/
