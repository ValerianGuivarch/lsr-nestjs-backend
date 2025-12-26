import { WeddingPhotosService, PhotoItem } from './wedding-photos.service'
import { BadRequestException, Controller, Get, Header, Post, Query, Req, Res } from '@nestjs/common'
import { ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { FastifyReply, FastifyRequest } from 'fastify'

type OkUploadResponse = { ok: true; item: PhotoItem }
type OkLatestResponse = { ok: true; items: PhotoItem[] }
type OkNextResponse = { ok: true; item: PhotoItem | null }

@ApiTags('wedding-photos')
@Controller('api/v1/wedding-photos')
export class WeddingPhotosController {
  constructor(private readonly svc: WeddingPhotosService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Photo uploaded' })
  async upload(@Req() req: FastifyRequest): Promise<OkUploadResponse> {
    const part = await (req as any).file?.()
    if (!part) throw new BadRequestException('Missing file')
    if (!part.mimetype?.startsWith('image/')) throw new BadRequestException('Not an image')

    const buffer: Buffer = await part.toBuffer()

    const item = await this.svc.saveUpload({
      buffer,
      mimetype: part.mimetype,
      originalname: part.filename,
      size: buffer.length
    } as any)

    return { ok: true, item }
  }

  // ✅ REMIS : /latest
  @Get('latest')
  @ApiResponse({ status: 200, description: 'Latest photos (most recent first)' })
  async latest(@Query('limit') limit?: string): Promise<OkLatestResponse> {
    const n = Math.min(Math.max(Number(limit ?? 120), 1), 200)
    const items = await this.svc.listLatest(n)
    return { ok: true, items }
  }

  // ✅ Nouveau : /next
  @Get('next')
  @ApiResponse({ status: 200, description: 'One photo (random). first=1 => latest.' })
  async next(@Query('first') first?: string): Promise<OkNextResponse> {
    const item = await this.svc.nextRandom({ first: first === '1' || first === 'true' })
    return { ok: true, item }
  }

  @Get('thumb')
  @ApiResponse({ status: 200, description: 'JPEG thumbnail (stream)' })
  async thumb(@Query('name') name: string, @Res() reply: FastifyReply): Promise<void> {
    if (!name) throw new BadRequestException('Missing name')
    reply.header('Content-Type', 'image/jpeg')
    reply.header('Cache-Control', 'public, max-age=60')
    await reply.send(this.svc.getThumbStream(name))
  }

  @Get('original')
  @ApiResponse({ status: 200, description: 'JPEG original (stream)' })
  async original(@Query('name') name: string, @Res() reply: FastifyReply): Promise<void> {
    if (!name) throw new BadRequestException('Missing name')
    reply.header('Content-Type', 'image/jpeg')
    reply.header('Cache-Control', 'public, max-age=60')
    await reply.send(this.svc.getOriginalStream(name))
  }

  @Get('stream')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @ApiResponse({ status: 200, description: 'SSE stream. Emits event "new".' })
  async stream(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    const res = reply.raw
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
