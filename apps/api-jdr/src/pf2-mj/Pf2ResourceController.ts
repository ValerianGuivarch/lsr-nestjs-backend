import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Query, Req, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { MultipartFile } from '@fastify/multipart'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Pf2ResourceService } from './Pf2ResourceService'

@Controller(['api/pf2-mj/resources', 'api/v1/pf2-mj/resources'])
@ApiTags('PF2 MJ Resources')
export class Pf2ResourceController {
  constructor(private readonly resources: Pf2ResourceService) {}

  @Get()
  list(
    @Query('q') q?: string,
    @Query('tag') tag?: string,
    @Query('origin') origin?: string,
    @Query('targetKind') targetKind?: string,
    @Query('targetId') targetId?: string,
    @Query('componentId') componentId?: string,
  ): Promise<unknown[]> {
    return this.resources.list({ q, tag, origin, targetKind, targetId, componentId })
  }

  @Get('export')
  export(): Promise<Record<string, unknown>> {
    return this.resources.export()
  }

  @Post()
  async create(@Body() body: unknown): Promise<unknown> {
    try {
      return await this.resources.create(this.asInput(body))
    } catch (error) {
      throw this.badRequest(error, 'Création de la ressource impossible.')
    }
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<unknown> {
    return this.resources.get(id)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: unknown): Promise<unknown> {
    try {
      return await this.resources.update(id, this.asInput(body))
    } catch (error) {
      throw this.badRequest(error, 'Mise à jour de la ressource impossible.')
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ deleted: true }> {
    try {
      await this.resources.remove(id)
      return { deleted: true }
    } catch (error) {
      throw this.badRequest(error, 'Suppression de la ressource impossible.')
    }
  }

  @Post(':id/files')
  async uploadFile(@Param('id') id: string, @Req() request: FastifyRequest): Promise<unknown> {
    try {
      const file = await (request as FastifyRequest & { file: () => Promise<MultipartFile | undefined> }).file()
      if (!file) throw new Error('Aucun PDF reçu.')
      return await this.resources.addFile(id, file.filename, await file.toBuffer())
    } catch (error) {
      throw this.badRequest(error, 'Ajout du PDF impossible.')
    }
  }

  @Get(':id/files/:fileId')
  async downloadFile(@Param('id') id: string, @Param('fileId') fileId: string, @Res() reply: FastifyReply): Promise<void> {
    try {
      const file = await this.resources.readResourceFile(id, fileId)
      reply.header('Content-Type', file.mimeType)
      reply.header('Content-Length', String(file.bytes.byteLength))
      reply.header('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`)
      await reply.send(file.bytes)
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'PDF introuvable.', HttpStatus.NOT_FOUND)
    }
  }

  @Delete(':id/files/:fileId')
  async removeFile(@Param('id') id: string, @Param('fileId') fileId: string): Promise<{ deleted: true }> {
    try {
      await this.resources.removeFile(id, fileId)
      return { deleted: true }
    } catch (error) {
      throw this.badRequest(error, 'Suppression du PDF impossible.')
    }
  }

  private asInput(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    return value as Record<string, unknown>
  }

  private badRequest(error: unknown, fallback: string): HttpException {
    if (error instanceof HttpException) return error
    return new HttpException(error instanceof Error ? error.message : fallback, HttpStatus.BAD_REQUEST)
  }
}
