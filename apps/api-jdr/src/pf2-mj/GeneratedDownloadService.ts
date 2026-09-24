import { Injectable } from '@nestjs/common'
import { createReadStream } from 'node:fs'
import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'

// PF2_ROBUST_DOWNLOADS_V2

type DownloadMeta = {
  token: string
  filename: string
  contentType: string
  size: number
  createdAt: string
}

@Injectable()
export class GeneratedDownloadService {
  private readonly root = resolve(process.env['STORAGE_PATH'] ?? 'storage', 'generated-downloads')
  private readonly ttlMs = 6 * 60 * 60 * 1000

  async create(bytes: Buffer, filename: string, contentType: string): Promise<DownloadMeta> {
    await mkdir(this.root, { recursive: true })
    await this.cleanup().catch(() => undefined)

    const token = randomUUID()
    const meta: DownloadMeta = { token, filename: this.safeFilename(filename), contentType, size: bytes.byteLength, createdAt: new Date().toISOString() }
    await writeFile(this.dataPath(token), bytes)
    await writeFile(this.metaPath(token), JSON.stringify(meta), 'utf8')
    return meta
  }

  async open(token: string, rangeHeader?: string): Promise<{ statusCode: 200 | 206; headers: Record<string, string>; stream: ReturnType<typeof createReadStream> }> {
    this.validateToken(token)
    const meta = JSON.parse(await readFile(this.metaPath(token), 'utf8')) as DownloadMeta
    const disk = await stat(this.dataPath(token))
    const size = disk.size

    let start = 0
    let end = size - 1
    let statusCode: 200 | 206 = 200

    if (rangeHeader) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim())
      if (match) {
        const rawStart = match[1]
        const rawEnd = match[2]
        if (rawStart) start = Math.max(0, Number(rawStart))
        if (rawEnd) end = Math.min(size - 1, Number(rawEnd))
        if (!rawStart && rawEnd) {
          const suffix = Math.min(size, Number(rawEnd))
          start = size - suffix
          end = size - 1
        }
        if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= size) throw new Error('Range invalide.')
        statusCode = 206
      }
    }

    const length = end - start + 1
    const headers: Record<string, string> = {
      'Content-Type': meta.contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(meta.filename)}`,
      'Content-Length': String(length),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, no-store'
    }
    if (statusCode === 206) headers['Content-Range'] = `bytes ${start}-${end}/${size}`

    return { statusCode, headers, stream: createReadStream(this.dataPath(token), { start, end }) }
  }

  private async cleanup(): Promise<void> {
    await mkdir(this.root, { recursive: true })
    const names = await readdir(this.root)
    const now = Date.now()
    for (const name of names) {
      if (!name.endsWith('.json')) continue
      const metaPath = resolve(this.root, name)
      try {
        const meta = JSON.parse(await readFile(metaPath, 'utf8')) as DownloadMeta
        if (now - Date.parse(meta.createdAt) <= this.ttlMs) continue
        await unlink(metaPath).catch(() => undefined)
        await unlink(this.dataPath(meta.token)).catch(() => undefined)
      } catch {
        await unlink(metaPath).catch(() => undefined)
      }
    }
  }

  private validateToken(token: string): void { if (!/^[0-9a-f-]{36}$/i.test(token)) throw new Error('Token de téléchargement invalide.') }
  private dataPath(token: string): string { return resolve(this.root, `${token}.bin`) }
  private metaPath(token: string): string { return resolve(this.root, `${token}.json`) }
  private safeFilename(value: string): string { const cleaned = value.replace(/[\\/\0\r\n]+/g, '-').trim(); return cleaned || 'export.bin' }
}
