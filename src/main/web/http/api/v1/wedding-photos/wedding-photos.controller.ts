import { WeddingPhotosService, PhotoItem } from './wedding-photos.service'
import { BadRequestException, Controller, Get, Header, Post, Query, Req, Res } from '@nestjs/common'
import { ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { FastifyReply, FastifyRequest } from 'fastify'

type OkUploadResponse = { ok: true; item: PhotoItem }
type OkLatestResponse = { ok: true; items: PhotoItem[] }

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

    const item = await this.svc.saveUpload({ buffer })
    return { ok: true, item }
  }

  @Get('latest')
  @ApiResponse({ status: 200, description: 'Latest photos (most recent first)' })
  async latest(@Query('limit') limit?: string): Promise<OkLatestResponse> {
    // eslint-disable-next-line no-magic-numbers
    const n = Math.min(Math.max(Number(limit ?? 120), 1), 200)
    const items = await this.svc.listLatest(n)
    return { ok: true, items }
  }

  @Get('thumb')
  @ApiResponse({ status: 200, description: 'JPEG thumbnail (stream)' })
  @ApiResponse({ status: 404, description: 'Thumb not found' })
  async thumb(@Query('name') name: string, @Res() reply: FastifyReply): Promise<void> {
    const stream = this.svc.getThumbStream(name)

    reply.header('Content-Type', 'image/jpeg')
    reply.header('Cache-Control', 'public, max-age=60')
    await reply.send(stream)
  }

  @Get('original')
  @ApiResponse({ status: 200, description: 'JPEG original (stream)' })
  @ApiResponse({ status: 404, description: 'Original not found' })
  async original(@Query('name') name: string, @Res() reply: FastifyReply): Promise<void> {
    const stream = this.svc.getOriginalStream(name)

    reply.header('Content-Type', 'image/jpeg')
    reply.header('Cache-Control', 'public, max-age=60')
    await reply.send(stream)
  }

  @Get('stream')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @ApiResponse({ status: 200, description: 'SSE stream (heartbeat only in this version)' })
  async stream(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    const res = reply.raw
    res.write(`event: ping\ndata: ${Date.now()}\n\n`)

    const interval = setInterval(() => {
      res.write(`event: refresh\ndata: ${Date.now()}\n\n`)
      // eslint-disable-next-line no-magic-numbers
    }, 3000)

    const cleanup = () => clearInterval(interval)
    req.raw.on('close', cleanup)
    req.raw.on('end', cleanup)
  }
}
