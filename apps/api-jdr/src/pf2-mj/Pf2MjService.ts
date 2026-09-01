import { Injectable } from '@nestjs/common'
import { lookup } from 'node:dns/promises'
import { createReadStream } from 'node:fs'
import { readdir, readFile, stat } from 'node:fs/promises'
import { basename, relative, resolve, sep } from 'node:path'
import sharp from 'sharp'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'
import { FoundryNpcSummary, FoundryRelayService } from '../foundry/FoundryRelayService'

const referenceFiles = {
  pnj: 'pf2_personnages.json',
  factions: 'pf2_factions.json',
  lieux: 'pf2_lieux.json',
  regions: 'pf2_regions.json',
  evenements: 'pf2_evenements.json'
} as const

export type ReferenceKind = keyof typeof referenceFiles
export type ResumeActorReference = { uuid: string; name: string }

export type ResourceBundleRecord = {
  id: string
  filename: string
  path: string
  targetId: string | null
  scope: 'exact' | 'descendants'
  presence: 'present'
  associationStatus: 'confirmed' | 'review' | 'unassociated'
  associationScore: number | null
  evidence: string[]
}

export type ResourceBundleInventory = {
  schemaVersion: 1
  inventoryKnown: true
  scannedAt: string
  totalOnDisk: number
  bundles: ResourceBundleRecord[]
}

type ScanTarget = {
  id: string
  kind: 'container' | 'playable' | 'component'
  isCampaign: boolean
  parentId: string | null
  labels: string[]
  numbers: string[]
}

type ScanCatalogue = {
  files?: Array<{ path?: unknown }>
  entries?: Array<{
    id?: unknown
    kind?: unknown
    titleFr?: unknown
    titleOriginal?: unknown
    aliases?: unknown
    number?: unknown
    collectionId?: unknown
    parts?: Array<{
      id?: unknown
      kind?: unknown
      titleFr?: unknown
      titleOriginal?: unknown
      number?: unknown
      sequence?: unknown
    }>
  }>
  collections?: Array<{
    id?: unknown
    kind?: unknown
    titleFr?: unknown
    titleOriginal?: unknown
    parentId?: unknown
    season?: unknown
  }>
}

const MAX_PORTRAIT_BYTES = 10 * 1024 * 1024
const PORTRAIT_INPUT_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

@Injectable()
export class Pf2MjService {
  // The repository sits in ~/IdeaProjects/lsr-nestjs-backend locally, so this resolves to ~/PF2/MJ.
  private readonly libraryRoot = resolve(process.env['PF2_LIBRARY_ROOT'] ?? '../../PF2/MJ')
  private readonly dataRoot = resolve(process.env['PF2_DATA_ROOT'] ?? 'apps/web-misc/src/pf2-mj/data')
  private readonly legacyPortraitRoot = resolve(process.env['FOUNDRY_ASSETS_ROOT'] ?? '../../FoundryVTT/Data/assets/l7r', 'portraits', 'pnj')
  constructor(private readonly persistence: Pf2PersistenceService, private readonly foundry: FoundryRelayService) {}

  isReferenceKind(value: string): value is ReferenceKind {
    return value in referenceFiles
  }

  async readReference(kind: ReferenceKind): Promise<Record<string, unknown>[]> {
    return this.persistence.readReference(kind)
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
    await this.persistence.replaceReference(kind, items)
    return { items, added, updated }
  }

  async readCuration(): Promise<Record<string, unknown>> {
    return this.persistence.readCuration()
  }

  async saveResumeActorCache(actors: ResumeActorReference[]): Promise<void> {
    await this.persistence.saveFoundryActorCache(actors)
  }

  async readResumeActorCache(): Promise<ResumeActorReference[]> {
    return this.persistence.readFoundryActorCache()
  }

  async updateCuration(body: unknown): Promise<Record<string, unknown>> {
    const input = this.asObject(body)
    const data = await this.readCuration()

    // V3 : toutes les nouvelles écritures sont centralisées par id.
    // Les anciennes maps restent intactes pour la lecture rétrocompatible.
    const byId = this.asObject(data.byId)
    data.byId = byId
    data.schemaVersion = 3

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
      const id = typeof input.id === 'string' ? input.id.trim() : ''
      const aliases: Record<string, string> = {
        levels: 'levelsOverride',
        places: 'placesOverride',
        tracking: 'progress'
      }
      const field = aliases[String(input.field)] ?? String(input.field ?? '')
      const allowed = new Set([
        'excluded',
        'inclusion',
        'playability',
        'progress',
        'levelsOverride',
        'placesOverride',
        'relevance',
        'locations'
      ])
      if (!id || !allowed.has(field)) throw new Error('Entrée ou champ de curation invalide.')

      const value =
        field === 'excluded'
          ? (input.value ?? input.excluded)
          : field === 'placesOverride'
            ? (input.value ?? input.places)
            : input.value

      const entry = this.asObject(byId[id])
      if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) delete entry[field]
      else entry[field] = value

      if (Object.keys(entry).length) byId[id] = entry
      else delete byId[id]
    }

    await this.persistence.saveCuration(data)
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

  async resourceBundles(): Promise<ResourceBundleInventory> {
    const catalogue = await this.readScanCatalogue()
    const files = await this.walkLibraryFiles(this.libraryRoot)
    return this.buildResourceInventory(catalogue, files.zips)
  }

  async scanLibrary(): Promise<Record<string, unknown>> {
    const disk = await this.walkLibraryFiles(this.libraryRoot)
    const catalogue = await this.readScanCatalogue()
    const known = new Set(
      Array.isArray(catalogue.files)
        ? catalogue.files
            .map((item) => (typeof item.path === 'string' ? this.normalizedPath(item.path) : ''))
            .filter(Boolean)
        : []
    )
    const available = new Set(disk.pdfs)
    const added = disk.pdfs.filter((path) => !known.has(path))
    const removed = [...known].filter((path) => !available.has(path))
    const informationPdfs = disk.pdfs.filter((path) => this.isInformationPdf(path))
    const addedInformationPdfs = added.filter((path) => this.isInformationPdf(path))
    const resourceInventory = this.buildResourceInventory(catalogue, disk.zips)

    const targetIndex = this.scanTargets(catalogue)
    const classifiedNewPdfs = added.map((path) => {
      const match = this.matchTarget(path, targetIndex, false)
      return match.targetId && match.status !== 'unassociated'
        ? {
            path,
            entryId: match.targetId,
            campaignId: match.campaignId,
            association: match.status,
            score: match.score,
            informationOnly: this.isInformationPdf(path)
          }
        : null
    }).filter((value): value is NonNullable<typeof value> => Boolean(value))

    return {
      scannedAt: resourceInventory.scannedAt,
      totalOnDisk: disk.pdfs.length,
      knownInCatalogue: known.size,
      summary: {
        added: added.length,
        translations: 0,
        translationsCertain: 0,
        removed: removed.length,
        information: informationPdfs.length,
        informationAdded: addedInformationPdfs.length,
        zips: disk.zips.length,
        zipsAssociated: resourceInventory.bundles.filter((bundle) => bundle.associationStatus !== 'unassociated').length,
        zipsToReview: resourceInventory.bundles.filter((bundle) => bundle.associationStatus === 'review').length
      },
      translations: [],
      classifiedNewPdfs,
      informationPdfs,
      addedInformationPdfs,
      pdfPaths: disk.pdfs,
      newPdfs: added,
      removed,
      resourceInventory
    }
  }

  async savePnjPortrait(bytes: Uint8Array, mimeType: string, pnjId: string): Promise<string> {
    const prepared = await this.preparePortrait(bytes, mimeType)
    const portrait = await this.persistence.savePortrait(prepared.bytes, prepared.extension, pnjId, prepared.extension === 'gif' ? 'image/gif' : 'image/webp')
    return portrait.path
  }

  async importPnjPortrait(urlValue: unknown, pnjId: string): Promise<string> {
    const { bytes, mimeType } = await this.downloadPortrait(urlValue)
    return this.savePnjPortrait(bytes, mimeType, pnjId)
  }

  async saveAndSyncPnjPortrait(bytes: Uint8Array, mimeType: string, pnjId: string): Promise<{ portrait: string; local: 'success'; foundry: 'not-linked' | 'synchronized' | 'unavailable'; foundryMessage?: string }> {
    const portrait = await this.savePnjPortrait(bytes, mimeType, pnjId)
    return this.syncPortraitForPnj(pnjId, portrait)
  }

  async importAndSyncPnjPortrait(urlValue: unknown, pnjId: string): Promise<{ portrait: string; local: 'success'; foundry: 'not-linked' | 'synchronized' | 'unavailable'; foundryMessage?: string }> {
    const portrait = await this.importPnjPortrait(urlValue, pnjId)
    return this.syncPortraitForPnj(pnjId, portrait)
  }

  async foundryForPnj(id: string): Promise<{ actorUuid: string | null; actor: FoundryNpcSummary | null; status: 'not-linked' | 'available' | 'unavailable'; message?: string }> {
    const pnj = await this.requirePnj(id)
    const actorUuid = this.foundryActorUuid(pnj)
    if (!actorUuid) return { actorUuid: null, actor: null, status: 'not-linked' }
    try { return { actorUuid, actor: await this.foundry.getNpcSummary(actorUuid), status: 'available' } }
    catch (error) { return { actorUuid, actor: null, status: 'unavailable', message: this.errorMessage(error) } }
  }

  async listFoundryActorCandidates(): Promise<Array<{ uuid: string; name: string; type: string }>> { return this.foundry.listNpcCandidates() }

  async associateFoundryActor(id: string, actorUuid: unknown): Promise<Record<string, unknown>> {
    if (typeof actorUuid !== 'string' || !/^Actor\.[A-Za-z0-9]+$/.test(actorUuid)) throw new Error('UUID Actor Foundry invalide.')
    // Confirm the target exists before persisting the stable association.
    await this.foundry.getNpcSummary(actorUuid)
    return this.updatePnj(id, { foundryActorUuid: actorUuid })
  }

  async detachFoundryActor(id: string): Promise<Record<string, unknown>> { return this.updatePnj(id, { foundryActorUuid: null }) }

  async createFoundryPlaceholder(id: string): Promise<{ pnj: Record<string, unknown>; actor: { uuid: string; name: string }; portrait: string | null }> {
    const pnj = await this.requirePnj(id)
    if (this.foundryActorUuid(pnj)) throw new Error('Ce PNJ possède déjà un Actor Foundry associé.')
    const portrait = typeof pnj.portrait === 'string' && /^portraits\/[^/]+\.(?:webp|gif)$/i.test(pnj.portrait) ? await this.uploadPortraitToFoundry(pnj.portrait) : null
    const actor = await this.foundry.createNpcPlaceholder(this.name(pnj), portrait)
    const updated = await this.updatePnj(id, { foundryActorUuid: actor.uuid })
    return { pnj: updated, actor, portrait }
  }

  async resyncPnjPortrait(id: string): Promise<{ portrait: string; local: 'success'; foundry: 'not-linked' | 'synchronized' | 'unavailable'; foundryMessage?: string }> {
    const pnj = await this.requirePnj(id)
    if (typeof pnj.portrait !== 'string' || !/^portraits\/[^/]+\.(?:webp|gif)$/i.test(pnj.portrait)) throw new Error('Ce PNJ ne possède pas de portrait local synchronisable.')
    return this.syncPortraitForPnj(id, pnj.portrait)
  }

  async resolvePnjPortrait(encodedFilename: string): Promise<{ stream: ReturnType<typeof createReadStream>; size: number; filename: string }> {
    const filename = decodeURIComponent(encodedFilename)
    if (basename(filename) !== filename || !/\.(?:webp|gif)$/i.test(filename)) throw new Error('Chemin refusé')
    let target = this.persistence.portraitPath(filename)
    let info
    try {
      info = await stat(target)
    } catch {
      target = resolve(this.legacyPortraitRoot, filename)
      info = await stat(target)
    }
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

  private async syncPortraitForPnj(id: string, portrait: string): Promise<{ portrait: string; local: 'success'; foundry: 'not-linked' | 'synchronized' | 'unavailable'; foundryMessage?: string }> {
    const pnj = await this.requirePnj(id)
    const actorUuid = this.foundryActorUuid(pnj)
    if (!actorUuid) return { portrait, local: 'success', foundry: 'not-linked' }
    try {
      const foundryPortrait = await this.uploadPortraitToFoundry(portrait)
      await this.foundry.syncActorPortrait(actorUuid, foundryPortrait)
      return { portrait, local: 'success', foundry: 'synchronized' }
    } catch (error) {
      return { portrait, local: 'success', foundry: 'unavailable', foundryMessage: this.errorMessage(error) }
    }
  }

  private async uploadPortraitToFoundry(portrait: string): Promise<string> {
    const media = await this.persistence.readPortrait(portrait)
    return this.foundry.uploadPortrait(media.bytes, media.filename, media.mimeType)
  }

  private async requirePnj(id: string): Promise<Record<string, unknown>> {
    const pnj = (await this.readReference('pnj')).find((item) => this.identifier(item) === id)
    if (!pnj) throw new Error('PNJ introuvable.')
    return pnj
  }

  private async updatePnj(id: string, patch: Record<string, unknown>): Promise<Record<string, unknown>> {
    const pnj = await this.requirePnj(id)
    const item = { ...pnj, ...patch }
    await this.updateReference('pnj', { action: 'upsert', item })
    return item
  }

  private foundryActorUuid(pnj: Record<string, unknown>): string | null { return typeof pnj.foundryActorUuid === 'string' && /^Actor\.[A-Za-z0-9]+$/.test(pnj.foundryActorUuid) ? pnj.foundryActorUuid : null }
  private errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Foundry indisponible.' }

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
        for (;;) {
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

  private async readScanCatalogue(): Promise<ScanCatalogue> {
    return JSON.parse(await readFile(resolve(this.dataRoot, 'catalogue-pf2.json'), 'utf8')) as ScanCatalogue
  }

  private async walkLibraryFiles(directory: string): Promise<{ pdfs: string[]; zips: string[] }> {
    const entries = await readdir(directory, { withFileTypes: true })
    const nested = await Promise.all(entries.map(async (entry) => {
      const target = resolve(directory, entry.name)
      if (entry.isDirectory()) return this.walkLibraryFiles(target)
      if (!entry.isFile()) return { pdfs: [] as string[], zips: [] as string[] }
      const path = this.normalizedPath(relative(this.libraryRoot, target))
      if (/\.(?:pdf|pd)$/i.test(entry.name)) return { pdfs: [path], zips: [] }
      if (/\.zip$/i.test(entry.name)) return { pdfs: [], zips: [path] }
      return { pdfs: [], zips: [] }
    }))
    return {
      pdfs: nested.flatMap((item) => item.pdfs).sort((left, right) => left.localeCompare(right, 'fr')),
      zips: nested.flatMap((item) => item.zips).sort((left, right) => left.localeCompare(right, 'fr'))
    }
  }

  private buildResourceInventory(catalogue: ScanCatalogue, zipPaths: string[]): ResourceBundleInventory {
    const scannedAt = new Date().toISOString()
    const targets = this.scanTargets(catalogue)
    const bundles = zipPaths.map((path, index): ResourceBundleRecord => {
      const match = this.matchTarget(path, targets, true)
      const filename = path.split('/').at(-1) ?? path
      return {
        id: `zip-${this.slug(path.replace(/\.zip$/i, '')) || index + 1}`,
        filename,
        path,
        targetId: match.targetId,
        scope: match.scope,
        presence: 'present',
        associationStatus: match.status,
        associationScore: match.score,
        evidence: match.evidence
      }
    })
    return { schemaVersion: 1, inventoryKnown: true, scannedAt, totalOnDisk: zipPaths.length, bundles }
  }

  private scanTargets(catalogue: ScanCatalogue): ScanTarget[] {
    const result: ScanTarget[] = []
    const playablePartKinds = new Set(['volume_aventure', 'aventure_autonome', 'one_shot', 'aventure_communautaire'])

    for (const entry of catalogue.entries ?? []) {
      const id = typeof entry.id === 'string' ? entry.id : ''
      if (!id) continue
      const kind = typeof entry.kind === 'string' ? entry.kind : ''
      const isCampaign = kind === 'campaign'
      result.push({
        id,
        kind: isCampaign ? 'container' : 'playable',
        isCampaign,
        parentId: typeof entry.collectionId === 'string' ? entry.collectionId : null,
        labels: this.scanLabels(entry.titleFr, entry.titleOriginal, entry.aliases, id),
        numbers: this.scanNumbers(entry.number)
      })

      for (const part of entry.parts ?? []) {
        const partId = typeof part.id === 'string' ? part.id : ''
        if (!partId) continue
        const partKind = typeof part.kind === 'string' ? part.kind : ''
        result.push({
          id: partId,
          kind: isCampaign && playablePartKinds.has(partKind) ? 'playable' : 'component',
          isCampaign: false,
          parentId: id,
          labels: this.scanLabels(part.titleFr, part.titleOriginal, [], partId),
          numbers: this.scanNumbers(part.number, part.sequence)
        })
      }
    }

    for (const collection of catalogue.collections ?? []) {
      const id = typeof collection.id === 'string' ? collection.id : ''
      if (!id) continue
      const season = typeof collection.season === 'number' ? collection.season : null
      result.push({
        id,
        kind: 'container',
        isCampaign: false,
        parentId: typeof collection.parentId === 'string' ? collection.parentId : null,
        labels: this.scanLabels(collection.titleFr, collection.titleOriginal, [], id),
        numbers: season === null ? [] : [String(season)]
      })
    }

    return result
  }

  private scanLabels(fr: unknown, original: unknown, aliases: unknown, id: string): string[] {
    const values = [
      typeof fr === 'string' ? fr : '',
      typeof original === 'string' ? original : '',
      ...(Array.isArray(aliases) ? aliases.filter((value): value is string => typeof value === 'string') : []),
      id
    ]
    return [...new Set(values.map((value) => this.matchText(value)).filter((value) => value.length >= 4))]
  }

  private scanNumbers(...values: unknown[]): string[] {
    return [...new Set(values.flatMap((value) => {
      if (typeof value === 'number' && Number.isFinite(value)) return [String(value)]
      if (typeof value !== 'string') return []
      const text = value.trim()
      return text ? [text, ...([...text.matchAll(/\b\d{1,2}[-.]\d{1,2}\b/g)].map((match) => match[0]))] : []
    }).map((value) => this.matchText(value)).filter(Boolean))]
  }

  private matchTarget(path: string, targets: ScanTarget[], resourceBundle: boolean): {
    targetId: string | null
    campaignId: string | null
    scope: 'exact' | 'descendants'
    status: 'confirmed' | 'review' | 'unassociated'
    score: number | null
    evidence: string[]
  } {
    const full = this.matchText(path.replace(/\.(?:pdf|pd|zip)$/i, ''))
    const filename = this.matchText((path.split('/').at(-1) ?? path).replace(/\.(?:pdf|pd|zip)$/i, ''))
    const base = resourceBundle ? this.stripResourceWords(filename) : this.stripDocumentWords(filename)
    const directory = this.matchText(path.split('/').slice(0, -1).join(' '))
    const scored = targets.map((target) => {
      let score = 0
      const evidence: string[] = []
      for (const label of target.labels) {
        if (base === label) {
          score = Math.max(score, 120)
          evidence.push('nom exact')
        } else if (base.length >= 5 && (base.includes(label) || label.includes(base))) {
          const candidate = 82 + Math.min(18, Math.floor(Math.min(base.length, label.length) / 4))
          if (candidate > score) score = candidate
          evidence.push('titre dans le nom')
        } else if (full.includes(label) && label.length >= 8) {
          score = Math.max(score, 78)
          evidence.push('titre dans le chemin')
        } else if (directory.includes(label) && label.length >= 8) {
          score = Math.max(score, 64)
          evidence.push('dossier parent')
        }
      }
      for (const number of target.numbers) {
        if (!number || !base.includes(number)) continue
        const isStructuredNumber = /\d+\s+\d+/.test(number)
        if (isStructuredNumber && new RegExp(`\\bpfs\\s+${number.replace(/\s+/g, '\\s+')}\\b`).test(base)) {
          score = Math.max(score, 92)
          evidence.push('numéro PFS')
        } else if (isStructuredNumber) {
          score = Math.max(score, 68)
          evidence.push('numéro structuré')
        } else if (number.length >= 2) {
          score += 18
          evidence.push('numéro')
        }
      }
      if (resourceBundle && target.kind === 'component') score -= 25
      if (resourceBundle && target.isCampaign && /campagne|campaign|adventure path|\bap\b/.test(full)) {
        score += 12
        evidence.push('marqueur campagne')
      }
      return { target, score, evidence: [...new Set(evidence)] }
    }).filter((candidate) => candidate.score > 0).sort((a, b) => b.score - a.score)

    const best = scored[0]
    if (!best || best.score < 58) {
      return { targetId: null, campaignId: null, scope: 'exact', status: 'unassociated', score: best?.score ?? null, evidence: [] }
    }

    const second = scored[1]
    const ambiguous = Boolean(second && best.score - second.score < 8)
    const status: 'confirmed' | 'review' = best.score >= 92 && !ambiguous ? 'confirmed' : 'review'
    const campaignId = best.target.isCampaign ? best.target.id : this.firstCampaignAncestor(best.target, targets)

    return {
      targetId: best.target.id,
      campaignId,
      scope: best.target.isCampaign ? 'descendants' : 'exact',
      status,
      score: best.score,
      evidence: best.evidence
    }
  }

  private firstCampaignAncestor(target: ScanTarget, targets: ScanTarget[]): string | null {
    const byId = new Map(targets.map((item) => [item.id, item]))
    const seen = new Set<string>()
    let current: ScanTarget | undefined = target
    while (current?.parentId && !seen.has(current.parentId)) {
      seen.add(current.parentId)
      current = byId.get(current.parentId)
      if (current?.isCampaign) return current.id
    }
    return null
  }

  private isInformationPdf(path: string): boolean {
    return /(?:^|[\s._(\[-])(?:info|information)(?:[\s._)\]-]|$)/i.test(path.split('/').at(-1) ?? path)
  }

  private stripResourceWords(value: string): string {
    return value
      .replace(/\b(?:ressources?|resources?|foundry|foundryvtt|fvtt|assets?|pack|module)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private stripDocumentWords(value: string): string {
    return value
      .replace(/\b(?:info|information|fr|en|vf|vo|traduction|trad|officiel|officielle|partial|partiel|partielle)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private normalizedPath(value: string): string {
    return value.replace(/\\/g, '/').replace(/^\/+/, '')
  }

  private matchText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[’']/g, ' ')
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ')
  }

  private slug(value: string): string {
    return this.matchText(value).replace(/\s+/g, '-').slice(0, 180)
  }

  private isPrivateAddress(address: string): boolean {
    const value = address.replace(/^\[|\]$/g, '').toLowerCase()
    if (value === '::1' || value === '::' || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe80:')) return true
    const parts = value.split('.').map(Number)
    return parts.length === 4 && (parts[0] === 10 || parts[0] === 127 || parts[0] === 0 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168))
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
