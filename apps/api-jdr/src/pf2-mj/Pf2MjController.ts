import { Body, Controller, Delete, Get, HttpException, HttpStatus, Logger, Param, Post, Put, Req, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { MultipartFile } from '@fastify/multipart'
import { FastifyReply, FastifyRequest } from 'fastify'
import { FoundryRelayService } from '../foundry/FoundryRelayService'
import { Pf2MjService } from './Pf2MjService'

// Le sélecteur des résumés ne propose que les PJ. La convention de nommage
// Foundry de la table est « Nom du PJ (Nom du joueur) ».
const playerActorName = /^\S(?:.*\S)?\s+\([^()]+\)$/u

// Le NAS historique traduit /apil7r/* vers /api/*. Les deux préfixes restent
// intentionnellement actifs et partagent cette unique implémentation.
@Controller(['api/pf2-mj', 'api/v1/pf2-mj'])
@ApiTags('PF2 MJ')
export class Pf2MjController {
  private readonly logger = new Logger(Pf2MjController.name)
  constructor(private readonly service: Pf2MjService, private readonly foundry: FoundryRelayService) {}

  @Get('actors')
  async actors(): Promise<Array<{ uuid: string; name: string }>> {
    let actors: Array<{ uuid: string; name: string }>
    try {
      actors = await this.foundry.listActors()
      await this.service.saveResumeActorCache(actors)
    } catch (error) {
      actors = await this.service.readResumeActorCache()
      if (!actors.length) throw error
      this.logger.warn('Foundry indisponible : liste de PJ servie depuis le cache SQLite.')
    }
    const excluded = new Set((process.env['PF2_RESUMES_EXCLUDED_ACTOR_UUIDS'] ?? 'Actor.w6XEy0w1OSAiSEGi,Actor.xxxPF2ExPARTYxxx').split(',').map((uuid) => uuid.trim()).filter(Boolean))
    return actors
      .filter(({ uuid, name }) => !excluded.has(uuid) && playerActorName.test(name.trim()))
      .map(({ uuid, name }) => ({ uuid, name }))
      .sort((left, right) => left.name.localeCompare(right.name, 'fr'))
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

  @Get('resource-bundles')
  async resourceBundles(): Promise<unknown> {
    try {
      return await this.service.resourceBundles()
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'Inventaire ZIP impossible', HttpStatus.BAD_REQUEST)
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

  @Post('pnj/:id/portrait')
  async uploadAndSyncPnjPortrait(@Param('id') id: string, @Req() request: FastifyRequest): Promise<unknown> {
    try {
      const file = await (request as FastifyRequest & { file: () => Promise<MultipartFile | undefined> }).file()
      if (!file) throw new Error('Fichier image manquant.')
      return await this.service.saveAndSyncPnjPortrait(await file.toBuffer(), file.mimetype, id)
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

  @Post('pnj/:id/portrait/url')
  async importAndSyncPnjPortrait(@Param('id') id: string, @Body() body: { url?: unknown }): Promise<unknown> {
    try { return await this.service.importAndSyncPnjPortrait(body?.url, id) }
    catch (error) { throw new HttpException(error instanceof Error ? error.message : 'Impossible d’importer l’image.', HttpStatus.BAD_REQUEST) }
  }

  @Get('pnj/:id/foundry')
  foundryForPnj(@Param('id') id: string): Promise<unknown> { return this.service.foundryForPnj(id) }

  @Get('pnj/foundry/candidates')
  foundryCandidates(): Promise<unknown> { return this.service.listFoundryActorCandidates() }

  @Put('pnj/:id/foundry')
  async associateFoundryActor(@Param('id') id: string, @Body() body: { actorUuid?: unknown }): Promise<unknown> {
    try { return await this.service.associateFoundryActor(id, body?.actorUuid) }
    catch (error) { throw new HttpException(error instanceof Error ? error.message : 'Association Foundry impossible.', HttpStatus.BAD_REQUEST) }
  }

  @Delete('pnj/:id/foundry')
  async detachFoundryActor(@Param('id') id: string): Promise<unknown> {
    try { return await this.service.detachFoundryActor(id) }
    catch (error) { throw new HttpException(error instanceof Error ? error.message : 'Dissociation Foundry impossible.', HttpStatus.BAD_REQUEST) }
  }

  @Post('pnj/:id/foundry/create-placeholder')
  async createFoundryPlaceholder(@Param('id') id: string): Promise<unknown> {
    try { return await this.service.createFoundryPlaceholder(id) }
    catch (error) { throw new HttpException(error instanceof Error ? error.message : 'Création du pion impossible.', HttpStatus.BAD_REQUEST) }
  }

  @Post('pnj/:id/foundry/sync-portrait')
  async syncFoundryPortrait(@Param('id') id: string): Promise<unknown> {
    try { return await this.service.resyncPnjPortrait(id) }
    catch (error) { throw new HttpException(error instanceof Error ? error.message : 'Synchronisation du portrait impossible.', HttpStatus.BAD_REQUEST) }
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
