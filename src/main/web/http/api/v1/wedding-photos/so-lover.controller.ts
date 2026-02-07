import { SoLoverService } from './so-lover.service'
import { BadRequestException, Controller, Post, Req } from '@nestjs/common'
import { ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { FastifyRequest } from 'fastify'

type OkChairResponse = { ok: true; hasChair: boolean; raw?: string }

@ApiTags('so-lover')
@Controller('api/v1/so-lover')
export class SoLoverController {
  constructor(private readonly svc: SoLoverService) {}

  @Post('check')
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Chair detection result' })
  async checkChair(@Req() req: FastifyRequest): Promise<OkChairResponse> {
    const part = await (req as any).file?.()
    if (!part) throw new BadRequestException('Missing file')
    if (!part.mimetype?.startsWith('image/')) throw new BadRequestException('Not an image')

    const buffer: Buffer = await part.toBuffer()
    const hasChair = await this.svc.hasChair(buffer)

    return { ok: true, hasChair }
  }
}
