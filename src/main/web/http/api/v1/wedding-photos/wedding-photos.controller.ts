import { WeddingPhotosService, PhotoItem } from './wedding-photos.service'
import { Controller, Get, Header, Query, Req, Res } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import type { FastifyReply, FastifyRequest } from 'fastify'

type OkNextResponse = { ok: true; item: PhotoItem | null }

@ApiTags('wedding-photos')
@Controller('api/v1/wedding-photos')
export class WeddingPhotosController {
  constructor(private readonly svc: WeddingPhotosService) {}

  @Get('next')
  @ApiResponse({ status: 200, description: 'Returns one photo (random). If first=1 => latest.' })
  async next(@Query('first') first?: string): Promise<OkNextResponse> {
    const item = await this.svc.nextRandom({ first: first === '1' || first === 'true' })
    return { ok: true, item }
  }

  @Get('stream')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @ApiResponse({ status: 200, description: 'SSE stream. Emits event "new" when a photo is uploaded.' })
  async stream(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    const res = reply.raw

    // ping initial
    res.write(`event: ping\ndata: ${Date.now()}\n\n`)

    const unsubscribe = this.svc.onNewPhoto((item) => {
      res.write(`event: new\ndata: ${JSON.stringify({ id: item.id, createdAt: item.createdAt })}\n\n`)
    })

    const heartbeat = setInterval(() => {
      res.write(`: hb ${Date.now()}\n\n`)
    }, 15000)

    const cleanup = () => {
      clearInterval(heartbeat)
      unsubscribe()
    }

    req.raw.on('close', cleanup)
    req.raw.on('end', cleanup)
  }
}
