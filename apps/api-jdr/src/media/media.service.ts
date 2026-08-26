import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { lookup } from 'node:dns/promises'
import { createReadStream } from 'node:fs'
import { mkdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, resolve, sep } from 'node:path'
import { randomBytes } from 'node:crypto'
import sharp from 'sharp'
import { Repository } from 'typeorm'
import { MediaEntity, MediaType } from './media.entity'

const MAX_BYTES = 10 * 1024 * 1024
const INPUT_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

export class PortraitAlreadyExistsError extends Error {
  constructor(readonly media: MediaEntity) {
    super(`Un portrait nommé ${media.name} existe déjà.`)
  }
}

type PreparedImage = {
  bytes: Buffer
  mimeType: string
  extension: string
  width: number | null
  height: number | null
}

@Injectable()
export class MediaService {
  private readonly mediaRoot = resolve(process.env['MEDIA_ROOT'] ?? 'data/media')
  private readonly publicBaseUrl = (process.env['MEDIA_PUBLIC_BASE_URL'] ?? '').replace(/\/$/, '')

  constructor(@InjectRepository(MediaEntity, 'jdr-sqlite') private readonly repository: Repository<MediaEntity>) {}

  async list(type?: unknown, search?: unknown): Promise<ReturnType<MediaService['toDto']>[]> {
    const where: Record<string, unknown> = {}
    if (type === 'portrait' || type === 'image') where.type = type
    const items = await this.repository.find({ where, order: { updatedAt: 'DESC' } })
    const query = typeof search === 'string' ? this.normalize(search) : ''
    return items.filter((item) => !query || this.normalize(item.name).includes(query)).map((item) => this.toDto(item))
  }

  async find(id: string): Promise<ReturnType<MediaService['toDto']>> {
    return this.toDto(await this.getEntity(id))
  }

  async create(name: unknown, type: unknown, bytes: Uint8Array, mimeType: string): Promise<ReturnType<MediaService['toDto']>> {
    const mediaType = this.assertType(type)
    const cleanName = this.assertName(name)
    const slug = this.slugify(cleanName)
    if (mediaType === 'portrait') {
      const existing = await this.repository.findOneBy({ type: 'portrait', slug })
      if (existing) throw new PortraitAlreadyExistsError(existing)
    }
    const prepared = await this.prepareImage(bytes, mimeType)
    const filename = this.filenameFor(mediaType, slug, prepared.extension)
    await this.writeMediaFile(filename, prepared.bytes)
    try {
      const entity = this.repository.create({
        name: cleanName,
        slug: mediaType === 'portrait' ? slug : `${slug}-${randomBytes(3).toString('hex')}`,
        type: mediaType,
        filename,
        mimeType: prepared.mimeType,
        width: prepared.width,
        height: prepared.height,
        bytes: prepared.bytes.byteLength
      })
      return this.toDto(await this.repository.save(entity))
    } catch (error) {
      await this.removeFile(filename)
      throw error
    }
  }

  async replaceImage(id: string, bytes: Uint8Array, mimeType: string): Promise<ReturnType<MediaService['toDto']>> {
    const entity = await this.getEntity(id)
    const prepared = await this.prepareImage(bytes, mimeType)
    const wantedFilename = this.filenameFor(entity.type, entity.slug, prepared.extension)
    const previousFilename = entity.filename
    await this.writeMediaFile(wantedFilename, prepared.bytes)
    entity.filename = wantedFilename
    entity.mimeType = prepared.mimeType
    entity.width = prepared.width
    entity.height = prepared.height
    entity.bytes = prepared.bytes.byteLength
    const saved = await this.repository.save(entity)
    if (previousFilename !== wantedFilename) await this.removeFile(previousFilename)
    return this.toDto(saved)
  }

  async rename(id: string, name: unknown): Promise<ReturnType<MediaService['toDto']>> {
    const entity = await this.getEntity(id)
    const cleanName = this.assertName(name)
    const slug = this.slugify(cleanName)
    if (entity.type === 'portrait' && slug !== entity.slug) {
      const existing = await this.repository.findOneBy({ type: 'portrait', slug })
      if (existing && existing.id !== entity.id) throw new PortraitAlreadyExistsError(existing)
    }
    entity.name = cleanName
    // Keep the physical path stable: Foundry and existing links remain valid.
    return this.toDto(await this.repository.save(entity))
  }

  async remove(id: string): Promise<void> {
    const entity = await this.getEntity(id)
    await this.repository.remove(entity)
    await this.removeFile(entity.filename)
  }

  async importUrl(name: unknown, type: unknown, urlValue: unknown): Promise<ReturnType<MediaService['toDto']>> {
    const { bytes, mimeType } = await this.downloadImage(urlValue)
    return this.create(name, type, bytes, mimeType)
  }

  async fileByPath(encodedPath: string): Promise<{ stream: ReturnType<typeof createReadStream>; size: number; mimeType: string; filename: string }> {
    const relativePath = decodeURIComponent(encodedPath).replace(/^\/+/, '')
    const target = this.safePath(relativePath)
    const info = await stat(target)
    if (!info.isFile()) throw new Error('Fichier introuvable.')
    const entity = await this.repository.findOneBy({ filename: relativePath })
    if (!entity) throw new Error('Fichier introuvable.')
    return { stream: createReadStream(target), size: info.size, mimeType: entity.mimeType, filename: basename(target) }
  }

  async fileById(id: string): Promise<{ stream: ReturnType<typeof createReadStream>; size: number; mimeType: string; filename: string }> {
    const entity = await this.getEntity(id)
    return this.fileByPath(entity.filename)
  }

  private async getEntity(id: string): Promise<MediaEntity> {
    const entity = await this.repository.findOneBy({ id })
    if (!entity) throw new Error('Média introuvable.')
    return entity
  }

  private async prepareImage(value: Uint8Array, mimeType: string): Promise<PreparedImage> {
    if (!value.byteLength) throw new Error('Image vide.')
    if (value.byteLength > MAX_BYTES) throw new Error('Image trop volumineuse (maximum 10 Mo).')
    const type = mimeType.split(';', 1)[0].trim().toLowerCase()
    if (!INPUT_TYPES.has(type)) throw new Error('Format non supporté. Utilise PNG, JPEG, WebP ou GIF.')
    const bytes = Buffer.from(value)
    const metadata = await sharp(bytes, { animated: true }).metadata().catch(() => {
      throw new Error('Le fichier ne contient pas une image valide.')
    })
    if (type === 'image/gif') {
      return { bytes, mimeType: type, extension: 'gif', width: metadata.width ?? null, height: metadata.height ?? null }
    }
    const webp = await sharp(bytes).rotate().webp({ quality: 88 }).toBuffer()
    return { bytes: webp, mimeType: 'image/webp', extension: 'webp', width: metadata.width ?? null, height: metadata.height ?? null }
  }

  private async downloadImage(urlValue: unknown): Promise<{ bytes: Uint8Array; mimeType: string }> {
    if (typeof urlValue !== 'string') throw new Error('URL manquante.')
    let url: URL
    try { url = new URL(urlValue) } catch { throw new Error('URL invalide.') }
    for (let redirectCount = 0; redirectCount < 4; redirectCount++) {
      await this.assertPublicUrl(url)
      const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15_000) })
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location')
        if (!location) throw new Error('Redirection invalide.')
        url = new URL(location, url)
        continue
      }
      if (!response.ok || !response.headers.get('content-type')?.toLowerCase().startsWith('image/'))
        throw new Error('Impossible de récupérer cette URL.')
      if (Number(response.headers.get('content-length') ?? 0) > MAX_BYTES) throw new Error('Image trop volumineuse (maximum 10 Mo).')
      const reader = response.body?.getReader()
      if (!reader) throw new Error('Impossible de récupérer cette URL.')
      const chunks: Uint8Array[] = []
      let total = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        total += value.byteLength
        if (total > MAX_BYTES) throw new Error('Image trop volumineuse (maximum 10 Mo).')
        chunks.push(value)
      }
      const bytes = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))
      return { bytes, mimeType: response.headers.get('content-type') ?? '' }
    }
    throw new Error('Trop de redirections.')
  }

  private async assertPublicUrl(url: URL): Promise<void> {
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || this.isPrivateAddress(url.hostname))
      throw new Error('Cette adresse n’est pas autorisée.')
    const addresses = await lookup(url.hostname, { all: true })
    if (!addresses.length || addresses.some(({ address }) => this.isPrivateAddress(address))) throw new Error('Cette adresse n’est pas autorisée.')
  }

  private isPrivateAddress(address: string): boolean {
    const value = address.replace(/^\[|\]$/g, '').toLowerCase()
    if (value === 'localhost' || value === '::1' || value === '::' || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe80:')) return true
    const parts = value.split('.').map(Number)
    return parts.length === 4 && (parts[0] === 10 || parts[0] === 127 || parts[0] === 0 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168))
  }

  private assertType(value: unknown): MediaType {
    if (value === 'portrait' || value === 'image') return value
    throw new Error('Type de média invalide.')
  }

  private assertName(value: unknown): string {
    const name = typeof value === 'string' ? value.trim() : ''
    if (!name) throw new Error('Nom obligatoire.')
    if (name.length > 160) throw new Error('Nom trop long.')
    return name
  }

  private slugify(value: string): string {
    return this.normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'media'
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  }

  private filenameFor(type: MediaType, slug: string, extension: string): string {
    return `${type === 'portrait' ? 'portraits' : 'images'}/${slug}.${extension}`
  }

  private safePath(relativePath: string): string {
    const target = resolve(this.mediaRoot, relativePath)
    if (target !== this.mediaRoot && !target.startsWith(`${this.mediaRoot}${sep}`)) throw new Error('Chemin refusé.')
    return target
  }

  private async writeMediaFile(filename: string, bytes: Uint8Array): Promise<void> {
    const target = this.safePath(filename)
    await mkdir(dirname(target), { recursive: true })
    const temporary = `${target}.${randomBytes(4).toString('hex')}.tmp`
    await writeFile(temporary, bytes)
    await rename(temporary, target)
  }

  private async removeFile(filename: string): Promise<void> {
    await rm(this.safePath(filename), { force: true })
  }

  private toDto(entity: MediaEntity) {
    const path = `/api/media/files/${entity.filename.split('/').map(encodeURIComponent).join('/')}`
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      type: entity.type,
      filename: entity.filename,
      mimeType: entity.mimeType,
      width: entity.width,
      height: entity.height,
      bytes: entity.bytes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      url: this.publicBaseUrl ? `${this.publicBaseUrl}${path}` : path
    }
  }
}
