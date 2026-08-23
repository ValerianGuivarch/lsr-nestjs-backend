import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Req, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Pf2MjService } from './Pf2MjService'

@Controller('api/v1/pf2-mj')
@ApiTags('PF2 MJ')
export class Pf2MjController {
  constructor(private readonly service: Pf2MjService) {}

  @Get('curation')
  curation(): Promise<Record<string, unknown>> {
    return this.service.readCuration()
  }

  @Post('curation')
  async updateCuration(@Body() body: unknown): Promise<Record<string, unknown>> {
    try {
      return await this.service.updateCuration(body)
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'Erreur de curation', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('local-scan')
  async localScan(): Promise<Record<string, unknown>> {
    try {
      return await this.service.scanLibrary()
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'Analyse impossible', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('pnj/image')
  async uploadPnjImage(@Req() request: FastifyRequest): Promise<{ path: string }> {
    try {
      const file = await request.file()
      if (!file) throw new Error('Fichier image manquant.')
      const pnjField = file.fields.pnjId
      const pnjId = !Array.isArray(pnjField) && pnjField?.type === 'field' && typeof pnjField.value === 'string' ? pnjField.value.trim() : 'pnj'
      return { path: await this.service.savePnjImage(await file.toBuffer(), file.mimetype, pnjId) }
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'Impossible d’envoyer l’image.', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('pnj/image-from-url')
  async importPnjImage(@Body() body: { url?: unknown; pnjId?: unknown }): Promise<{ path: string }> {
    try {
      return { path: await this.service.importPnjImage(body?.url, typeof body?.pnjId === 'string' ? body.pnjId : 'pnj') }
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'Impossible d’importer l’image.', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('pnj-images/*')
  async pnjImage(@Param('*') filename: string, @Res() reply: FastifyReply): Promise<void> {
    try {
      const image = await this.service.resolvePnjImage(filename)
      reply.header('Content-Length', String(image.size))
      reply.header('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(image.filename)}`)
      await reply.send(image.stream)
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'Image introuvable', HttpStatus.NOT_FOUND)
    }
  }

  @Get('bibliotheque/*')
  async pdf(@Param('*') path: string, @Res() reply: FastifyReply): Promise<void> {
    try {
      const pdf = await this.service.resolvePdf(path)
      reply.header('Content-Type', 'application/pdf')
      reply.header('Content-Length', String(pdf.size))
      reply.header('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(pdf.filename)}`)
      await reply.send(pdf.stream)
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'Document PDF introuvable', HttpStatus.NOT_FOUND)
    }
  }

  @Get(':kind')
  async getReference(@Param('kind') kind: string): Promise<Record<string, unknown>[]> {
    if (!this.service.isReferenceKind(kind)) throw new HttpException('Référentiel inconnu', HttpStatus.NOT_FOUND)
    return this.service.readReference(kind)
  }

  @Post(':kind')
  async updateReference(@Param('kind') kind: string, @Body() body: unknown): Promise<unknown> {
    if (!this.service.isReferenceKind(kind)) throw new HttpException('Référentiel inconnu', HttpStatus.NOT_FOUND)
    try {
      const result = await this.service.updateReference(kind, body)
      return { ...result, summary: { added: result.added, updated: result.updated, total: result.added + result.updated } }
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'Erreur de sauvegarde', HttpStatus.BAD_REQUEST)
    }
  }
}
