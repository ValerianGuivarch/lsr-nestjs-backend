import { Injectable } from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import { lookup } from 'node:dns/promises'
import { createReadStream } from 'node:fs'
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, relative, resolve, sep } from 'node:path'
import sharp from 'sharp'

const referenceFiles = {
  pnj: 'pf2_personnages.json',
  factions: 'pf2_factions.json',
  lieux: 'pf2_lieux.json',
  regions: 'pf2_regions.json',
  evenements: 'pf2_evenements.json'
} as const

export type ReferenceKind = keyof typeof referenceFiles

const MAX_PORTRAIT_BYTES = 10 * 1024 * 1024
const PORTRAIT_INPUT_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

@Injectable()
export class Pf2MjService {
  private readonly dataRoot = resolve(process.env['PF2_DATA_ROOT'] ?? 'apps/web-misc/src/pf2-mj/data')
  // The repository sits in ~/IdeaProjects/lsr-nestjs-backend locally, so this resolves to ~/PF2/MJ.
  private readonly libraryRoot = resolve(process.env['PF2_LIBRARY_ROOT'] ?? '../../PF2/MJ')
  private readonly foundryAssetsRoot = resolve(process.env['FOUNDRY_ASSETS_ROOT'] ?? '../../FoundryVTT/Data/assets/l7r')
  private readonly portraitRoot = resolve(this.foundryAssetsRoot, 'portraits', 'pnj')

  isReferenceKind(value: string): value is ReferenceKind {
    return value in referenceFiles
  }

  async readReference(kind: ReferenceKind): Promise<Record<string, unknown>[]> {
    const payload = JSON.parse(await readFile(resolve(this.dataRoot, referenceFiles[kind]), 'utf8')) as unknown
    const items = Array.isArray(payload) ? payload : this.asObject(payload).items
    if (!Array.isArray(items)) return []
    return items.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
  }

  async updateReference(kind: ReferenceKind, body: unknown): Promise<{ items: Record<string, unknown>[]; added: number; updated: number }> {
    const input = this.asObject(body)
    const rawItems = input.action === 'upsert' ? [input.item] : input.action === 'import' && Array.isArray(input.items) ? input.items : null
    if (!rawItems) throw new Error('Action invalide : utilisez upsert ou import.')

    const current = await this.readReference(kind)
    const byId = new Map(current.map((item) => [this.identifier(item), item]))
    let added = 0
    let updated = 0
    rawItems.forEach((raw) => {
      const item = this.asObject(raw)
      const id = this.identifier(item)
      if (byId.has(id)) updated++
      else added++
      byId.set(id, item)
    })

    const items = [...byId.values()].sort((left, right) => this.name(left).localeCompare(this.name(right), 'fr'))
    await this.writeJson(resolve(this.dataRoot, referenceFiles[kind]), items)
    return { items, added, updated }
  }

  async readCuration(): Promise<Record<string, unknown>> {
    return this.asObject(JSON.parse(await readFile(resolve(this.dataRoot, 'user-curation.json'), 'utf8')))
  }

  async updateCuration(body: unknown): Promise<Record<string, unknown>> {
    const input = this.asObject(body)
    const data = await this.readCuration()
    const entries = this.asObject(data.entries)
    data.entries = entries

    if (input.operation === 'place-add') {
      const value = typeof input.to === 'string' ? input.to.trim() : ''
      if (!value) throw new Error('Nom de lieu manquant.')
      const places = this.strings(data.customPlaces)
      if (!places.includes(value)) places.push(value)
      data.customPlaces = places
    } else if (input.operation === 'place-rename') {
      const from = typeof input.from === 'string' ? input.from.trim() : ''
      const to = typeof input.to === 'string' ? input.to.trim() : ''
      if (!from || !to) throw new Error('Ancien ou nouveau lieu manquant.')
      const names = this.asObject(data.placeRenames)
      names[from] = to
      data.placeRenames = names
    } else if (input.operation === 'place-delete') {
      const value = typeof input.from === 'string' ? input.from.trim() : ''
      if (!value) throw new Error('Lieu à supprimer manquant.')
      const deleted = this.strings(data.deletedPlaces)
      if (!deleted.includes(value)) deleted.push(value)
      data.deletedPlaces = deleted
    } else {
      const id = typeof input.id === 'string' ? input.id : ''
      const field = input.field === 'levels' ? 'levelsOverride' : input.field === 'places' ? 'placesOverride' : input.field
      if (!id || !['excluded', 'playability', 'progress', 'levelsOverride', 'placesOverride'].includes(String(field)))
        throw new Error('Entrée ou champ de curation invalide.')
      const value = field === 'excluded' ? (input.value ?? input.excluded) : field === 'placesOverride' ? (input.value ?? input.places) : input.value
      const entry = this.asObject(entries[id])
      if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) delete entry[String(field)]
      else entry[String(field)] = value
      entries[id] = entry
    }

    await this.writeJson(resolve(this.dataRoot, 'user-curation.json'), data)
    return data
  }

  async resolvePdf(encodedPath: string): Promise<{ stream: ReturnType<typeof createReadStream>; size: number; filename: string }> {
    const relativePath = decodeURIComponent(encodedPath).replace(/^\/+/, '')
    const target = resolve(this.libraryRoot, relativePath)
    if (target !== this.libraryRoot && !target.startsWith(`${this.libraryRoot}${sep}`)) throw new Error('Chemin refusé')
    const info = await stat(target)
    if (!info.isFile() || !/\.(?:pdf|pd)$/i.test(target)) throw new Error('Document PDF introuvable')
    return { stream: createReadStream(target), size: info.size, filename: target.split(sep).at(-1) ?? 'document.pdf' }
  }

  async scanLibrary(): Promise<Record<string, unknown>> {
    const files = await this.walkPdfFiles(this.libraryRoot)
    const catalogue = JSON.parse(await readFile(resolve(this.dataRoot, 'catalogue-pf2.json'), 'utf8')) as { files?: unknown }
    const known = new Set(
      Array.isArray(catalogue.files)
        ? catalogue.files
            .filter((item): item is { path?: unknown } => Boolean(item && typeof item === 'object'))
            .map((item) => (typeof item.path === 'string' ? item.path.replace(/\\/g, '/') : ''))
            .filter(Boolean)
        : []
    )
    const available = new Set(files)
    const added = files.filter((path) => !known.has(path))
    const removed = [...known].filter((path) => !available.has(path))
    return {
      scannedAt: new Date().toISOString(),
      totalOnDisk: files.length,
      knownInCatalogue: known.size,
      summary: { added: added.length, translations: 0, translationsCertain: 0, removed: removed.length },
      translations: [],
      classifiedNewPdfs: [],
      newPdfs: added,
      removed
    }
  }

  async savePnjPortrait(bytes: Uint8Array, mimeType: string, pnjId: string): Promise<string> {
    const prepared = await this.preparePortrait(bytes, mimeType)
    const slug = this.portraitSlug(pnjId)
    const filename = `${slug}.${prepared.extension}`
    const target = resolve(this.portraitRoot, filename)
    await mkdir(this.portraitRoot, { recursive: true })
    const temporary = `${target}.${randomBytes(4).toString('hex')}.tmp`
    await writeFile(temporary, prepared.bytes)
    await rename(temporary, target)
    await Promise.all(['webp', 'gif'].filter((extension) => extension !== prepared.extension).map((extension) => rm(resolve(this.portraitRoot, `${slug}.${extension}`), { force: true })))
    return `assets/l7r/portraits/pnj/${filename}`
  }

  async importPnjPortrait(urlValue: unknown, pnjId: string): Promise<string> {
    const { bytes, mimeType } = await this.downloadPortrait(urlValue)
    return this.savePnjPortrait(bytes, mimeType, pnjId)
  }

  async resolvePnjPortrait(encodedFilename: string): Promise<{ stream: ReturnType<typeof createReadStream>; size: number; filename: string }> {
    const filename = decodeURIComponent(encodedFilename)
    if (basename(filename) !== filename || !/\.(?:webp|gif)$/i.test(filename)) throw new Error('Chemin refusé')
    const target = resolve(this.portraitRoot, filename)
    const info = await stat(target)
    if (!info.isFile()) throw new Error('Image introuvable')
    return { stream: createReadStream(target), size: info.size, filename }
  }

  private async preparePortrait(value: Uint8Array, mimeType: string): Promise<{ bytes: Buffer; extension: 'webp' | 'gif' }> {
    if (!value.byteLength) throw new Error('Image vide.')
    if (value.byteLength > MAX_PORTRAIT_BYTES) throw new Error('Image trop volumineuse (maximum 10 Mo).')
    const type = mimeType.split(';', 1)[0].trim().toLowerCase()
    if (!PORTRAIT_INPUT_TYPES.has(type)) throw new Error('Format non supporté. Utilise PNG, JPEG, WebP ou GIF.')
    const bytes = Buffer.from(value)
    await sharp(bytes, { animated: true }).metadata().catch(() => { throw new Error('Le fichier ne contient pas une image valide.') })
    if (type === 'image/gif') return { bytes, extension: 'gif' }
    return { bytes: await sharp(bytes).rotate().webp({ quality: 88 }).toBuffer(), extension: 'webp' }
  }

  private async downloadPortrait(urlValue: unknown): Promise<{ bytes: Uint8Array; mimeType: string }> {
    if (typeof urlValue !== 'string') throw new Error('URL manquante.')
    let url: URL
    try { url = new URL(urlValue) } catch { throw new Error('URL invalide.') }
    for (let redirects = 0; redirects < 4; redirects++) {
      await this.assertPublicUrl(url)
      const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15_000) })
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location')
        if (!location) throw new Error('Redirection invalide.')
        url = new URL(location, url)
        continue
      }
      if (!response.ok || !response.headers.get('content-type')?.toLowerCase().startsWith('image/')) throw new Error('Impossible de récupérer cette URL.')
      if (Number(response.headers.get('content-length') ?? 0) > MAX_PORTRAIT_BYTES) throw new Error('Image trop volumineuse (maximum 10 Mo).')
      const reader = response.body?.getReader()
      if (!reader) throw new Error('Impossible de récupérer cette URL.')
      const chunks: Uint8Array[] = []
      let size = 0
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          size += value.byteLength
          if (size > MAX_PORTRAIT_BYTES) {
            await reader.cancel()
            throw new Error('Image trop volumineuse (maximum 10 Mo).')
          }
          chunks.push(value)
        }
      } finally {
        reader.releaseLock()
      }
      return { bytes: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), size), mimeType: response.headers.get('content-type') ?? '' }
    }
    throw new Error('Trop de redirections.')
  }

  private async assertPublicUrl(url: URL): Promise<void> {
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || this.isPrivateAddress(url.hostname)) throw new Error('Cette adresse n’est pas autorisée.')
    const addresses = await lookup(url.hostname, { all: true })
    if (!addresses.length || addresses.some((entry) => this.isPrivateAddress(entry.address))) throw new Error('Cette adresse n’est pas autorisée.')
  }

  private portraitSlug(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pnj'
  }

  private async walkPdfFiles(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true })
    const nested = await Promise.all(entries.map(async (entry) => {
      const target = resolve(directory, entry.name)
      if (entry.isDirectory()) return this.walkPdfFiles(target)
      return entry.isFile() && /\.(?:pdf|pd)$/i.test(entry.name) ? [relative(this.libraryRoot, target).split(sep).join('/')] : []
    }))
    return nested.flat().sort((left, right) => left.localeCompare(right, 'fr'))
  }

  private isPrivateAddress(address: string): boolean {
    const value = address.replace(/^\[|\]$/g, '').toLowerCase()
    if (value === '::1' || value === '::' || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe80:')) return true
    const parts = value.split('.').map(Number)
    return parts.length === 4 && (parts[0] === 10 || parts[0] === 127 || parts[0] === 0 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168))
  }

  private async writeJson(path: string, value: unknown): Promise<void> {
    await mkdir(dirname(path), { recursive: true })
    const temporary = `${path}.tmp`
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
    await rename(temporary, path)
  }

  private identifier(item: Record<string, unknown>): string {
    const id = typeof item.id === 'string' ? item.id.trim() : ''
    if (!id) throw new Error('Chaque entrée doit avoir un identifiant.')
    if (!this.name(item)) throw new Error('Chaque entrée doit avoir un nom.')
    return id
  }

  private name(item: Record<string, unknown>): string {
    return typeof item.nom === 'string' ? item.nom.trim() : ''
  }

  private strings(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  }

  private asObject(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
  }
}
