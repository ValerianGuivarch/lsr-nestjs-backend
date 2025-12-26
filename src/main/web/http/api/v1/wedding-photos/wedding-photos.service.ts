import { Injectable, InternalServerErrorException } from '@nestjs/common'
import * as sharp from 'sharp'
import { randomUUID } from 'node:crypto'
import { statSync, createReadStream, ReadStream } from 'node:fs'
import { mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'

export type PhotoItem = {
  id: string
  createdAt: string // ISO
  url: string // original
  thumbUrl: string // thumbnail
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

  private publicBase() {
    // eslint-disable-next-line no-process-env
    return (process.env.WEDDING_PHOTOS_PUBLIC_BASE || '').replace(/\/$/, '')
  }

  async saveUpload(file: Express.Multer.File): Promise<PhotoItem> {
    await this.ensureDirs()

    const id = randomUUID()
    const createdAt = new Date().toISOString()
    const originalName = `${createdAt.replace(/[:.]/g, '-')}_${id}.jpg`
    const thumbName = `${createdAt.replace(/[:.]/g, '-')}_${id}_thumb.jpg`

    const originalPath = join(this.originalsDir, originalName)
    const thumbPath = join(this.thumbsDir, thumbName)

    try {
      // On force JPEG (si le front a déjà converti, c’est direct)
      // rotate() = corrige orientation EXIF
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
      url: `${base}/api/wedding-photos/original/${encodeURIComponent(originalName)}`,
      thumbUrl: `${base}/api/wedding-photos/thumb/${encodeURIComponent(thumbName)}`
    }
  }

  // eslint-disable-next-line no-magic-numbers
  async listLatest(limit = 60): Promise<PhotoItem[]> {
    await this.ensureDirs()

    const base = this.publicBase()
    const files = await readdir(this.thumbsDir)

    // tri par mtime desc
    const withStats = files
      .filter((f) => f.endsWith('_thumb.jpg'))
      .map((f) => {
        const p = join(this.thumbsDir, f)
        const stat = statSync(p)
        return { f, mtimeMs: stat.mtimeMs }
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
      .slice(0, limit)

    return withStats.map(({ f }) => {
      // on reconstruit le nom original (même préfixe sans _thumb)
      const original = f.replace(/_thumb\.jpg$/, '.jpg')
      return {
        id: f,
        createdAt: new Date().toISOString(), // option: tu peux parser depuis le nom si tu veux
        url: `${base}/api/wedding-photos/original/${encodeURIComponent(original)}`,
        thumbUrl: `${base}/api/wedding-photos/thumb/${encodeURIComponent(f)}`
      }
    })
  }

  getThumbStream(filename: string): ReadStream {
    return createReadStream(join(this.thumbsDir, filename))
  }

  getOriginalStream(filename: string): ReadStream {
    return createReadStream(join(this.originalsDir, filename))
  }
}
