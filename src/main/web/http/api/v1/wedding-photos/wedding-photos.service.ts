import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common'
import sharp = require('sharp')
import { randomUUID } from 'node:crypto'
import { createReadStream, ReadStream, existsSync } from 'node:fs'
import { mkdir, readdir, unlink } from 'node:fs/promises'
import { join, basename } from 'node:path'

export type PhotoItem = {
  id: string
  createdAt: string // ISO
  url: string // original (query ?name=...)
  thumbUrl: string // thumbnail (query ?name=...)
}

@Injectable()
export class WeddingPhotosService {
  // eslint-disable-next-line no-process-env
  private baseDir = process.env.WEDDING_PHOTOS_DIR || join(process.cwd(), 'data', 'wedding-photos')
  private originalsDir = join(this.baseDir, 'originals')
  private thumbsDir = join(this.baseDir, 'thumbs')

  async ensureDirs(): Promise<void> {
    await mkdir(this.originalsDir, { recursive: true })
    await mkdir(this.thumbsDir, { recursive: true })
  }

  private safeName(name: string): string {
    if (!name) throw new BadRequestException('Missing id')
    const base = basename(name)
    if (base !== name) throw new BadRequestException('Invalid id')
    if (base.includes('..')) throw new BadRequestException('Invalid id')
    return base
  }

  async deleteById(id: string): Promise<void> {
    await this.ensureDirs()
    const thumb = this.safeName(id)

    const thumbPath = join(this.thumbsDir, thumb)
    if (!existsSync(thumbPath)) throw new NotFoundException('Thumb not found')

    const original = thumb.replace(/_thumb\.jpg$/, '.jpg')
    const originalPath = join(this.originalsDir, original)

    await unlink(thumbPath).catch(() => undefined)
    if (existsSync(originalPath)) {
      await unlink(originalPath).catch(() => undefined)
    }
  }

  private publicBase(): string {
    // eslint-disable-next-line no-process-env
    return (process.env.WEDDING_PHOTOS_PUBLIC_BASE || '').replace(/\/$/, '')
  }

  async saveUpload(file: { buffer: Buffer }, folder: string): Promise<PhotoItem> {
    await this.ensureDirs()

    const id = randomUUID()
    const createdAt = new Date().toISOString()
    const stamp = createdAt.replace(/[:.]/g, '-')

    const originalName = `${stamp}_${id}.jpg`
    const thumbName = `${stamp}_${id}_thumb.jpg`

    const originalPath = join(this.originalsDir, originalName)
    const thumbPath = join(this.thumbsDir, thumbName)

    try {
      const img = sharp(file.buffer).rotate()

      await img.jpeg({ quality: 85, mozjpeg: true }).toFile(originalPath)
      await img.resize({ width: 900, withoutEnlargement: true }).jpeg({ quality: 70, mozjpeg: true }).toFile(thumbPath)
    } catch (e) {
      throw new InternalServerErrorException(`Image processing failed: ${(e as Error).message}`)
    }

    const base = this.publicBase()
    return {
      id,
      createdAt,
      url: `${base}/wedding-photos/${folder}/original?name=${encodeURIComponent(originalName)}`,
      thumbUrl: `${base}/wedding-photos/${folder}/thumb?name=${encodeURIComponent(thumbName)}`
    }
  }

  // eslint-disable-next-line no-magic-numbers
  async listLatest(limit = 60): Promise<PhotoItem[]> {
    await this.ensureDirs()
    const base = this.publicBase()

    const files = await readdir(this.thumbsDir)
    const thumbs = files.filter((f) => f.endsWith('_thumb.jpg'))

    // tri par mtime desc (plus récent d'abord)
    const sorted = thumbs
      .map((thumbName) => {
        const p = join(this.thumbsDir, thumbName)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const st = require('node:fs').statSync(p) as { mtimeMs: number }
        return { thumbName, mtimeMs: st.mtimeMs }
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
      .slice(0, limit)

    return sorted.map(({ thumbName }) => {
      const originalName = thumbName.replace(/_thumb\.jpg$/, '.jpg')
      return {
        id: thumbName,
        createdAt: new Date().toISOString(),
        url: `${base}//wedding-photos/golf/original?name=${encodeURIComponent(originalName)}`,
        thumbUrl: `${base}//wedding-photos/golf/thumb?name=${encodeURIComponent(thumbName)}`
      }
    })
  }

  getThumbStream(name: string): ReadStream {
    const filename = this.safeName(name)
    const p = join(this.thumbsDir, filename)
    if (!existsSync(p)) throw new NotFoundException('Thumb not found')
    return createReadStream(p)
  }

  getOriginalStream(name: string): ReadStream {
    const filename = this.safeName(name)
    const p = join(this.originalsDir, filename)
    if (!existsSync(p)) throw new NotFoundException('Original not found')
    return createReadStream(p)
  }
}
