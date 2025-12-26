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
  @ApiResponse({
    status: 201,
    description: 'Photo uploaded',
    schema: {
      example: {
        ok: true,
        item: {
          id: 'uuid',
          createdAt: '2025-12-25T22:00:00.000Z',
          url: 'https://l7r.fr/api/v1/wedding-photos/original?name=...',
          thumbUrl: 'https://l7r.fr/api/v1/wedding-photos/thumb?name=...'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Missing file / Not an image' })
  @ApiResponse({ status: 500, description: 'Image processing failed' })
  async upload(@Req() req: FastifyRequest): Promise<OkUploadResponse> {
    // Nécessite @fastify/multipart enregistré dans main.ts
    const part = await (req as any).file?.()
    if (!part) throw new BadRequestException('Missing file')

    if (!part.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Not an image')
    }

    const buffer: Buffer = await part.toBuffer()

    // Ton service actuel est typé Express.Multer.File : on lui passe l’objet minimum attendu
    const item = await this.svc.saveUpload({
      buffer,
      mimetype: part.mimetype,
      originalname: part.filename,
      size: buffer.length
    } as any)

    return { ok: true, item }
  }

  @Get('latest')
  @ApiResponse({
    status: 200,
    description: 'Latest photos (most recent first)',
    schema: {
      example: {
        ok: true,
        items: [
          {
            id: '2025-12-25T22-00-00-000Z_uuid_thumb.jpg',
            createdAt: '2025-12-25T22:00:00.000Z',
            url: 'https://l7r.fr/api/v1/wedding-photos/original?name=...',
            thumbUrl: 'https://l7r.fr/api/v1/wedding-photos/thumb?name=...'
          }
        ]
      }
    }
  })
  async latest(@Query('limit') limit?: string): Promise<OkLatestResponse> {
    // eslint-disable-next-line no-magic-numbers
    const n = Math.min(Math.max(Number(limit ?? 120), 1), 200)
    const items = await this.svc.listLatest(n)
    return { ok: true, items }
  }

  @Get('thumb')
  @ApiResponse({ status: 200, description: 'JPEG thumbnail (stream)' })
  @ApiResponse({ status: 400, description: 'Missing name' })
  async thumb(@Query('name') name: string, @Res() reply: FastifyReply): Promise<void> {
    if (!name) throw new BadRequestException('Missing name')

    reply.header('Content-Type', 'image/jpeg')
    // Cache léger côté mur (tu peux ajuster)
    reply.header('Cache-Control', 'public, max-age=60')

    const stream = this.svc.getThumbStream(name)
    await reply.send(stream)
  }

  @Get('original')
  @ApiResponse({ status: 200, description: 'JPEG original (stream)' })
  @ApiResponse({ status: 400, description: 'Missing name' })
  async original(@Query('name') name: string, @Res() reply: FastifyReply): Promise<void> {
    if (!name) throw new BadRequestException('Missing name')

    reply.header('Content-Type', 'image/jpeg')
    reply.header('Cache-Control', 'public, max-age=60')

    const stream = this.svc.getOriginalStream(name)
    await reply.send(stream)
  }

  @Get('stream')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @ApiResponse({
    status: 200,
    description: 'SSE stream. Emits events named "refresh" when a new photo is uploaded.'
  })
  async stream(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    // SSE en Fastify => utiliser reply.raw
    const res = reply.raw
    res.write(`event: ping\ndata: ${Date.now()}\n\n`)

    // Minimaliste: polling serveur-side toutes les 3s pour dire "refresh"
    // (si tu as déjà une mécanique event bus / Subject, branche-la ici)
    const interval = setInterval(() => {
      res.write(`event: refresh\ndata: ${Date.now()}\n\n`)
      // eslint-disable-next-line no-magic-numbers
    }, 3000)

    const cleanup = () => clearInterval(interval)
    req.raw.on('close', cleanup)
    req.raw.on('end', cleanup)
  }
}
