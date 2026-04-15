import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { createReadStream, ReadStream, existsSync, statSync } from 'node:fs'
import { writeFile, mkdir, readdir, unlink } from 'node:fs/promises'
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
  private baseDirGolf = (process.env.WEDDING_PHOTOS_DIR || join(process.cwd(), 'data', 'wedding-photos')) + '/golf'
  // eslint-disable-next-line no-process-env
  private baseDirSelfie = (process.env.WEDDING_PHOTOS_DIR || join(process.cwd(), 'data', 'wedding-photos')) + '/selfie'
  private originalsDirGolf = join(this.baseDirGolf, 'originals')
  private originalsDirSelfie = join(this.baseDirSelfie, 'originals')
  private thumbsDirGolf = join(this.baseDirGolf, 'thumbs')
  private thumbsDirSelfie = join(this.baseDirSelfie, 'thumbs')

  async ensureDirs(): Promise<void> {
    await mkdir(this.originalsDirGolf, { recursive: true })
    await mkdir(this.thumbsDirGolf, { recursive: true })
    await mkdir(this.originalsDirSelfie, { recursive: true })
    await mkdir(this.thumbsDirSelfie, { recursive: true })
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

    const filename = this.safeName(id)
    const p = join(this.originalsDirGolf, filename)

    if (!existsSync(p)) throw new NotFoundException('File not found')

    await unlink(p)
  }

  private publicBase(): string {
    // eslint-disable-next-line no-process-env
    return (process.env.WEDDING_PHOTOS_PUBLIC_BASE || '').replace(/\/$/, '')
  }

  async saveUpload(file: { buffer: Buffer }, folder: 'golf' | 'selfie'): Promise<PhotoItem> {
    await this.ensureDirs()

    const id = randomUUID()
    const createdAt = new Date().toISOString()
    const stamp = createdAt.replace(/[:.]/g, '-')

    const originalName = `${stamp}_${id}.jpg`
    const originalPath = join(folder === 'golf' ? this.originalsDirGolf : this.originalsDirSelfie, originalName)

    // 🔥 juste écrire le fichier
    await writeFile(originalPath, file.buffer)

    const base = this.publicBase()

    return {
      id,
      createdAt,
      url: `${base}/wedding-photos/original?name=${encodeURIComponent(originalName)}`,
      thumbUrl: `${base}/wedding-photos/original?name=${encodeURIComponent(originalName)}` // même image
    }
  }
  // eslint-disable-next-line no-magic-numbers
  async listLatest(limit = 60): Promise<PhotoItem[]> {
    await this.ensureDirs()
    const base = this.publicBase()

    const files = await readdir(this.originalsDirGolf)
    const originals = files.filter((f) => f.endsWith('.jpg'))

    const sorted = originals
      .map((name) => {
        const p = join(this.originalsDirGolf, name)
        const st = statSync(p)
        return { name, mtimeMs: st.mtimeMs }
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
      .slice(0, limit)

    return sorted.map(({ name }) => ({
      id: name,
      createdAt: new Date().toISOString(),
      url: `${base}/wedding-photos/original?name=${encodeURIComponent(name)}`,
      thumbUrl: `${base}/wedding-photos/original?name=${encodeURIComponent(name)}`
    }))
  }

  getOriginalStream(name: string): ReadStream {
    const filename = this.safeName(name)
    const p = join(this.originalsDirGolf, filename)
    if (!existsSync(p)) throw new NotFoundException('Original not found')
    return createReadStream(p)
  }
}
