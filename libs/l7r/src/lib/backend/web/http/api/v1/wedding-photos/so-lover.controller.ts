import { SoLoverService } from './so-lover.service'
import { BadRequestException, Controller, Post, Req } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { FastifyRequest } from 'fastify'

@ApiTags('so-lover')
@Controller('api/v1/so-lover')
export class SoLoverController {
  constructor(private readonly svc: SoLoverService) {}

  @Post('check')
  async check(@Req() req: FastifyRequest): Promise<any> {
    const part = await (req as any).file?.()
    if (!part) throw new BadRequestException('Missing file')
    if (!part.mimetype?.startsWith('image/')) throw new BadRequestException('Not an image')

    const buffer: Buffer = await part.toBuffer()
    return await this.svc.checkBoard(buffer)
  }
}
