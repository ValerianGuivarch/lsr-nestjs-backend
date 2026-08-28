import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Req, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { MultipartFile } from '@fastify/multipart'
import { FastifyReply, FastifyRequest } from 'fastify'
import { FoundryRelayService } from '../foundry/FoundryRelayService'
import { Pf2MjService } from './Pf2MjService'

// Le NAS historique traduit /apil7r/* vers /api/*. Les deux préfixes restent
// intentionnellement actifs et partagent cette unique implémentation.
@Controller(['api/pf2-mj', 'api/v1/pf2-mj'])
@ApiTags('PF2 MJ')
export class Pf2MjController {
  constructor(private readonly service: Pf2MjService, private readonly foundry: FoundryRelayService) {}

  @Get('actors')
  async actors(): Promise<Array<{ id: string; name: string }>> {
    const players = await this.foundry.listPlayers()
    return players.map(({ uuid, name }) => ({ id: uuid, name })).sort((left, right) => left.name.localeCompare(right.name, 'fr'))
  }

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

  @Post('pnj/portrait')
  async uploadPnjPortrait(@Req() request: FastifyRequest): Promise<{ portrait: string }> {
    try {
      const file = await (request as FastifyRequest & { file: () => Promise<MultipartFile | undefined> }).file()
      if (!file) throw new Error('Fichier image manquant.')
      const pnjField = file.fields.pnjId
      const pnjId = !Array.isArray(pnjField) && pnjField?.type === 'field' && typeof pnjField.value === 'string' ? pnjField.value.trim() : 'pnj'
      return { portrait: await this.service.savePnjPortrait(await file.toBuffer(), file.mimetype, pnjId) }
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'Impossible d’envoyer l’image.', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('pnj/portrait-from-url')
  async importPnjPortrait(@Body() body: { url?: unknown; pnjId?: unknown }): Promise<{ portrait: string }> {
    try {
      return { portrait: await this.service.importPnjPortrait(body?.url, typeof body?.pnjId === 'string' ? body.pnjId : 'pnj') }
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'Impossible d’importer l’image.', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('portraits/*')
  async pnjPortrait(@Param('*') filename: string, @Res() reply: FastifyReply): Promise<void> {
    try {
      const image = await this.service.resolvePnjPortrait(filename)
      reply.header('Content-Type', image.filename.endsWith('.gif') ? 'image/gif' : 'image/webp')
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
