import { Injectable, InternalServerErrorException } from '@nestjs/common'
import sharp from 'sharp'
import { randomUUID } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { statSync, createReadStream, ReadStream } from 'node:fs'
import { mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'

export type PhotoItem = {
  id: string
  createdAt: string // ISO
  url: string // original
  thumbUrl: string // thumbnail
}

type CachedPhoto = {
  originalName: string
  thumbName: string
  mtimeMs: number
}

@Injectable()
export class WeddingPhotosService {
  private baseDir = process.env.WEDDING_PHOTOS_DIR || join(process.cwd(), 'data', 'wedding-photos')
  private originalsDir = join(this.baseDir, 'originals')
  private thumbsDir = join(this.baseDir, 'thumbs')

  private emitter = new EventEmitter()

  private cacheLoaded = false
  private photos: CachedPhoto[] = [] // triées du + récent au + ancien
  private recentIds: string[] = [] // derniers servis (anti-répétition)
  private readonly RECENT_MAX = 40

  async ensureDirs(): Promise<void> {
    await mkdir(this.originalsDir, { recursive: true })
    await mkdir(this.thumbsDir, { recursive: true })
  }

  private publicBase() {
    return (process.env.WEDDING_PHOTOS_PUBLIC_BASE || '').replace(/\/$/, '')
  }

  private apiPrefix() {
    // si ton nginx expose /apil7r -> /api côté backend, tu peux mettre directement apil7r ici
    // sinon laisse '/api/v1' (cohérent avec ton controller)
    return '/api/v1'
  }

  private toItem(originalName: string, thumbName: string, createdAt: string): PhotoItem {
    const base = this.publicBase()
    const prefix = this.apiPrefix()
    return {
      id: thumbName,
      createdAt,
      url: `${base}${prefix}/wedding-photos/original?name=${encodeURIComponent(originalName)}`,
      thumbUrl: `${base}${prefix}/wedding-photos/thumb?name=${encodeURIComponent(thumbName)}`
    }
  }

  private async loadCacheIfNeeded(): Promise<void> {
    if (this.cacheLoaded) return
    await this.ensureDirs()

    const files = await readdir(this.thumbsDir)
    const thumbs = files.filter((f) => f.endsWith('_thumb.jpg'))

    this.photos = thumbs
      .map((thumbName) => {
        const originalName = thumbName.replace(/_thumb\.jpg$/, '.jpg')
        const p = join(this.thumbsDir, thumbName)
        const st = statSync(p)
        return { originalName, thumbName, mtimeMs: st.mtimeMs }
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs)

    this.cacheLoaded = true
  }

  private registerInCache(originalName: string, thumbName: string): void {
    const p = join(this.thumbsDir, thumbName)
    const st = statSync(p)

    // enlève doublon éventuel
    this.photos = this.photos.filter((x) => x.thumbName !== thumbName)

    // ajoute en tête (plus récent)
    this.photos.unshift({ originalName, thumbName, mtimeMs: st.mtimeMs })
  }

  onNewPhoto(listener: (item: PhotoItem) => void): () => void {
    this.emitter.on('new', listener)
    return () => this.emitter.off('new', listener)
  }

  async saveUpload(fileLike: { buffer: Buffer; mimetype?: string; originalname?: string }): Promise<PhotoItem> {
    await this.ensureDirs()
    await this.loadCacheIfNeeded()

    const id = randomUUID()
    const createdAt = new Date().toISOString()

    const originalName = `${createdAt.replace(/[:.]/g, '-')}_${id}.jpg`
    const thumbName = `${createdAt.replace(/[:.]/g, '-')}_${id}_thumb.jpg`

    const originalPath = join(this.originalsDir, originalName)
    const thumbPath = join(this.thumbsDir, thumbName)

    try {
      const img = sharp(fileLike.buffer).rotate()

      await img.jpeg({ quality: 85, mozjpeg: true }).toFile(originalPath)
      await img.resize({ width: 900, withoutEnlargement: true }).jpeg({ quality: 70, mozjpeg: true }).toFile(thumbPath)
    } catch (e) {
      throw new InternalServerErrorException(`Image processing failed: ${(e as Error).message}`)
    }

    this.registerInCache(originalName, thumbName)

    const item = this.toItem(originalName, thumbName, createdAt)
    this.emitter.emit('new', item)

    return item
  }

  async listLatest(limit = 60): Promise<PhotoItem[]> {
    await this.loadCacheIfNeeded()
    const slice = this.photos.slice(0, limit)

    return slice.map((p) => this.toItem(p.originalName, p.thumbName, new Date().toISOString()))
  }

  async nextRandom(opts: { first?: boolean } = {}): Promise<PhotoItem | null> {
    await this.loadCacheIfNeeded()

    if (this.photos.length === 0) return null

    // 1ère fois => plus récent
    if (opts.first) {
      const top = this.photos[0]
      this.noteServed(top.thumbName)
      return this.toItem(top.originalName, top.thumbName, new Date().toISOString())
    }

    const exclude = new Set(this.recentIds)
    const candidates = this.photos.filter((p) => !exclude.has(p.thumbName))
    const pool = candidates.length > 0 ? candidates : this.photos

    const pick = pool[Math.floor(Math.random() * pool.length)]
    this.noteServed(pick.thumbName)

    return this.toItem(pick.originalName, pick.thumbName, new Date().toISOString())
  }

  private noteServed(id: string) {
    this.recentIds.unshift(id)
    if (this.recentIds.length > this.RECENT_MAX) this.recentIds.length = this.RECENT_MAX
  }

  getThumbStream(filename: string): ReadStream {
    return createReadStream(join(this.thumbsDir, filename))
  }

  getOriginalStream(filename: string): ReadStream {
    return createReadStream(join(this.originalsDir, filename))
  }
}
