import { Body, ConflictException, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Query, Req, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { FastifyReply, FastifyRequest } from 'fastify'
import { MediaService, PortraitAlreadyExistsError } from './media.service'

@Controller('api/v1/media')
@ApiTags('Media')
export class MediaController {
  constructor(private readonly service: MediaService) {}

  @Get()
  list(@Query('type') type?: string, @Query('search') search?: string) {
    return this.service.list(type, search)
  }

  @Get('files/*')
  async file(@Param('*') path: string, @Res() reply: FastifyReply): Promise<void> {
    await this.sendFile(() => this.service.fileByPath(path), reply)
  }

  @Get(':id/file')
  async fileById(@Param('id') id: string, @Res() reply: FastifyReply): Promise<void> {
    await this.sendFile(() => this.service.fileById(id), reply)
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.handle(() => this.service.find(id))
  }

  @Post()
  async create(@Req() request: FastifyRequest) {
    try {
      const file = await request.file()
      if (!file) throw new Error('Fichier image manquant.')
      const name = this.field(file.fields.name)
      const type = this.field(file.fields.type)
      return await this.service.create(name, type, await file.toBuffer(), file.mimetype)
    } catch (error) {
      this.throwError(error)
    }
  }

  @Post('import-url')
  importUrl(@Body() body: { name?: unknown; type?: unknown; url?: unknown }) {
    return this.handle(() => this.service.importUrl(body?.name, body?.type, body?.url))
  }

  @Put(':id')
  rename(@Param('id') id: string, @Body() body: { name?: unknown }) {
    return this.handle(() => this.service.rename(id, body?.name))
  }

  @Post(':id/image')
  async replace(@Param('id') id: string, @Req() request: FastifyRequest) {
    try {
      const file = await request.file()
      if (!file) throw new Error('Fichier image manquant.')
      return await this.service.replaceImage(id, await file.toBuffer(), file.mimetype)
    } catch (error) {
      this.throwError(error)
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ deleted: true }> {
    await this.handle(() => this.service.remove(id))
    return { deleted: true }
  }

  private field(value: unknown): unknown {
    return !Array.isArray(value) && value && typeof value === 'object' && 'value' in value ? (value as { value?: unknown }).value : undefined
  }

  private async sendFile(loader: () => ReturnType<MediaService['fileById']>, reply: FastifyReply): Promise<void> {
    try {
      const file = await loader()
      reply.header('Content-Type', file.mimeType)
      reply.header('Content-Length', String(file.size))
      reply.header('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`)
      await reply.send(file.stream)
    } catch (error) {
      this.throwError(error, HttpStatus.NOT_FOUND)
    }
  }

  private async handle<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation() } catch (error) { this.throwError(error) }
  }

  private throwError(error: unknown, fallback = HttpStatus.BAD_REQUEST): never {
    if (error instanceof PortraitAlreadyExistsError)
      throw new ConflictException({ message: error.message, existing: { id: error.media.id, name: error.media.name, filename: error.media.filename } })
    throw new HttpException(error instanceof Error ? error.message : 'Erreur Media', fallback)
  }
}
