import { Injectable } from '@nestjs/common'
import { lookup } from 'node:dns/promises'
import { createReadStream } from 'node:fs'
import { mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
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
  schemaVersion?: unknown
  documents?: Array<{
    id?: unknown
    filename?: unknown
    path?: unknown
    targetId?: unknown
    targetKind?: unknown
    role?: unknown
    libraryCategory?: unknown
    isInformationFallback?: unknown
    association?: { status?: unknown; confidence?: unknown; evidence?: unknown }
  }>
  containers?: Array<{
    id?: unknown
    containerType?: unknown
    parentId?: unknown
    titles?: { fr?: unknown; original?: unknown; aliases?: unknown }
    season?: unknown
  }>
  playableUnits?: Array<{
    id?: unknown
    playableType?: unknown
    parentId?: unknown
    titles?: { fr?: unknown; original?: unknown; aliases?: unknown }
    number?: unknown
  }>
  components?: Array<{
    id?: unknown
    componentType?: unknown
    ownerId?: unknown
    titles?: { fr?: unknown; original?: unknown; aliases?: unknown }
    number?: unknown
  }>
  reconciliation?: { pending?: unknown; relocationsApplied?: unknown; notes?: unknown }
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
  private readonly foundryAssetsRoot = resolve(process.env['FOUNDRY_ASSETS_ROOT'] ?? '../../FoundryVTT/Data/assets/l7r')
  private readonly foundryPortraitRoot = resolve(this.foundryAssetsRoot, 'portraits', 'pnj')
  private readonly foundryPortraitPrefix = 'assets/l7r/portraits/pnj'
  constructor(private readonly persistence: Pf2PersistenceService, private readonly foundry: FoundryRelayService) {}

  isReferenceKind(value: string): value is ReferenceKind {
    return value in referenceFiles
  }

  async readReference(kind: ReferenceKind): Promise<Record<string, unknown>[]> {
    const items = await this.persistence.readReference(kind)
    // Les anciennes données pouvaient contenir `image: https://…` ou
    // `portrait: https://…`. Elles ne doivent plus jamais sortir vers le
    // navigateur : un portrait PF2 est désormais obligatoirement un asset
    // Foundry local. Le script de migration peut ensuite matérialiser les
    // sources distantes dans ce dossier sans exposition CORS.
    return kind === 'pnj' ? items.map((item) => this.normalizePnjRecord(item)) : items
  }

  async catalogue(): Promise<Record<string, unknown>> {
    return this.persistence.readCatalogueSnapshot()
  }

  async geography(): Promise<Record<string, unknown>> {
    const [lieux, regions, config] = await Promise.all([
      this.persistence.readReference('lieux'),
      this.persistence.readReference('regions'),
      this.persistence.readGeographyConfig()
    ])
    return { schemaVersion: 1, lieux, regions, aliases: this.asObject(config.aliases), parents: this.asObject(config.parents) }
  }

  async exportData(domain: string, id?: string): Promise<Record<string, unknown>> {
    const generatedAt = new Date().toISOString()
    if (domain === 'catalogue') {
      const catalogue = await this.persistence.readCatalogueSnapshot()
      const data = id ? this.catalogueSelection(catalogue, id) : catalogue
      return { _meta: { source: 'pf2.sqlite', generatedAt, domain, id: id ?? null, editable: true, requiresImportToApply: true }, data }
    }
    if (domain === 'geography') return { _meta: { source: 'pf2.sqlite', generatedAt, domain, editable: true, requiresImportToApply: true }, data: await this.geography() }
    if (this.isReferenceKind(domain)) {
      const items = await this.readReference(domain)
      const data = id ? items.find((item) => item.id === id) ?? null : items
      if (id && !data) throw new Error(`${domain} introuvable : ${id}.`)
      return { _meta: { source: 'pf2.sqlite', generatedAt, domain, id: id ?? null, editable: true, requiresImportToApply: true }, data }
    }
    if (domain === 'curation') return { _meta: { source: 'pf2.sqlite', generatedAt, domain, editable: true, requiresImportToApply: true }, data: await this.readCuration() }
    throw new Error(`Domaine d’export inconnu : ${domain}.`)
  }

  async importData(domain: string, body: unknown, dryRun = false): Promise<Record<string, unknown>> {
    const envelope = this.asObject(body)
    const data = envelope.data ?? body
    if (domain === 'catalogue') {
      const incoming = this.asObject(data)
      const current = await this.persistence.readCatalogueSnapshot()
      const next = incoming.scope === 'catalogue-selection' ? this.mergeCatalogueSelection(current, incoming) : incoming
      this.validateCatalogue(next)
      const diff = this.catalogueDiff(current, next)
      if (!dryRun) await this.persistence.replaceCatalogueSnapshot(next)
      return { dryRun, domain, ...diff }
    }
    if (domain === 'geography') {
      const incoming = this.asObject(data)
      const lieux = Array.isArray(incoming.lieux) ? incoming.lieux.map((item) => this.asObject(item)) : null
      const regions = Array.isArray(incoming.regions) ? incoming.regions.map((item) => this.asObject(item)) : null
      if (!lieux || !regions) throw new Error('L’export géographique doit contenir lieux[] et regions[].')
      this.validateUniqueIds(lieux, 'lieux')
      this.validateUniqueIds(regions, 'regions')
      const current = await this.geography()
      const summary = {
        lieux: this.arrayDiff(this.records(current.lieux), lieux),
        regions: this.arrayDiff(this.records(current.regions), regions),
        aliases: Object.keys(this.asObject(incoming.aliases)).length,
        parents: Object.keys(this.asObject(incoming.parents)).length
      }
      if (!dryRun) {
        await this.persistence.replaceReference('lieux', lieux)
        await this.persistence.replaceReference('regions', regions)
        await this.persistence.saveGeographyConfig({ aliases: this.asObject(incoming.aliases), parents: this.asObject(incoming.parents) })
      }
      return { dryRun, domain, summary }
    }
    if (this.isReferenceKind(domain)) {
      const objectData = this.asObject(data)
      const items = Array.isArray(data) ? data.map((item) => this.normalizeReferenceItem(domain, this.asObject(item))) : Array.isArray(objectData.items) ? (objectData.items as unknown[]).map((item) => this.normalizeReferenceItem(domain, this.asObject(item))) : typeof objectData.id === 'string' ? [this.normalizeReferenceItem(domain, objectData)] : null
      if (!items) throw new Error('Le fichier doit contenir un tableau de données.')
      this.validateUniqueIds(items, domain)
      const current = await this.readReference(domain)
      const single = !Array.isArray(data) && typeof objectData.id === 'string' && !Array.isArray(objectData.items)
      const next = single ? [...new Map([...current, ...items].map((item) => [String(item.id), item])).values()] : items
      const summary = this.arrayDiff(current, next)
      if (!dryRun) await this.persistence.replaceReference(domain, next)
      return { dryRun, domain, summary }
    }
    if (domain === 'curation') {
      const incoming = this.asObject(data)
      if (!dryRun) await this.persistence.saveCuration(this.normalizeCuration(incoming))
      return { dryRun, domain, changed: JSON.stringify(await this.readCuration()) !== JSON.stringify(incoming) }
    }
    throw new Error(`Domaine d’import inconnu : ${domain}.`)
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
      const item = this.normalizeReferenceItem(kind, this.asObject(raw))
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
    const current = await this.persistence.readCuration()
    const normalized = this.normalizeCuration(current)
    if (JSON.stringify(normalized) !== JSON.stringify(current)) await this.persistence.saveCuration(normalized)
    return normalized
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

  async scanLibrary(apply = false): Promise<Record<string, unknown>> {
    const disk = await this.walkLibraryFiles(this.libraryRoot)
    const catalogue = await this.readScanCatalogue()
    const knownPaths = this.catalogueDocumentPaths(catalogue)
    const reconciliation = this.reconcilePdfPaths(knownPaths, disk.pdfs)
    const added = reconciliation.added
    const removed = reconciliation.removed
    const informationPdfs = disk.pdfs.filter((path) => this.isInformationPdf(path))
    const addedInformationPdfs = added.filter((path) => this.isInformationPdf(path))
    const resourceInventory = this.buildResourceInventory(catalogue, disk.zips)

    const targetIndex = this.scanTargets(catalogue)
    const translations = added.flatMap((path) => {
      if (!this.isTranslationPdf(path)) return []
      const candidates = disk.pdfs.filter((candidate) => candidate !== path && !this.isTranslationPdf(candidate) && this.translationIdentity(candidate) === this.translationIdentity(path))
      return [{ path, originalPath: candidates.length === 1 ? candidates[0] : null, association: candidates.length === 1 ? 'certaine' as const : 'à vérifier' as const }]
    })
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

    if (apply) {
      await this.persistence.replaceScannedZipAssets(resourceInventory.bundles, resourceInventory.scannedAt)
      const sync = await this.applyCatalogueReconciliation(catalogue, reconciliation, added, targetIndex)
      const refreshed = await this.scanLibrary(false)
      return { ...refreshed, sync }
    }

    return {
      scannedAt: resourceInventory.scannedAt,
      totalOnDisk: disk.pdfs.length,
      knownInCatalogue: knownPaths.length,
      summary: {
        added: added.length,
        translations: translations.length,
        translationsCertain: translations.filter((item) => item.association === 'certaine').length,
        removed: removed.length,
        relocated: reconciliation.relocations.length,
        ignoredMetadata: disk.ignoredMetadata,
        information: informationPdfs.length,
        informationAdded: addedInformationPdfs.length,
        zips: disk.zips.length,
        zipsAssociated: resourceInventory.bundles.filter((bundle) => bundle.associationStatus !== 'unassociated').length,
        zipsToReview: resourceInventory.bundles.filter((bundle) => bundle.associationStatus === 'review').length
      },
      translations,
      classifiedNewPdfs,
      informationPdfs,
      addedInformationPdfs,
      pdfPaths: disk.pdfs,
      pdfAliases: Object.fromEntries(reconciliation.relocations.map((item) => [item.cataloguePath, item.diskPath])),
      relocations: reconciliation.relocations,
      ignoredMetadataFiles: disk.ignoredMetadata,
      newPdfs: added,
      removed,
      resourceInventory
    }
  }

  async savePnjPortrait(bytes: Uint8Array, mimeType: string, pnjId: string): Promise<string> {
    const prepared = await this.preparePortrait(bytes, mimeType)
    const stem = this.safePortraitStem(pnjId)
    const filename = `${stem}.${prepared.extension}`
    await mkdir(this.foundryPortraitRoot, { recursive: true })
    const target = resolve(this.foundryPortraitRoot, filename)
    const temporary = resolve(this.foundryPortraitRoot, `.${filename}.${process.pid}.${Date.now()}.tmp`)
    await writeFile(temporary, prepared.bytes)
    await rename(temporary, target)
    return `${this.foundryPortraitPrefix}/${filename}`
  }

  async importPnjPortrait(urlValue: unknown, pnjId: string): Promise<string> {
    const { bytes, mimeType } = await this.downloadPortrait(urlValue)
    return this.savePnjPortrait(bytes, mimeType, pnjId)
  }

  async saveAndSyncPnjPortrait(bytes: Uint8Array, mimeType: string, pnjId: string): Promise<{ portrait: string; local: 'success'; foundry: 'not-linked' | 'synchronized' | 'unavailable'; foundryMessage?: string }> {
    const portrait = await this.savePnjPortrait(bytes, mimeType, pnjId)
    // Pour un PNJ existant, l'upload est une vraie modification : on persiste
    // immédiatement le chemin Foundry afin qu'un abandon du dialogue n'introduise
    // pas de divergence entre l'Actor et le référentiel PF2-MJ.
    await this.updatePnj(pnjId, { portrait })
    return this.syncPortraitForPnj(pnjId, portrait)
  }

  async importAndSyncPnjPortrait(urlValue: unknown, pnjId: string): Promise<{ portrait: string; local: 'success'; foundry: 'not-linked' | 'synchronized' | 'unavailable'; foundryMessage?: string }> {
    const portrait = await this.importPnjPortrait(urlValue, pnjId)
    await this.updatePnj(pnjId, { portrait })
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
    const portrait = this.normalizePortraitPath(pnj.portrait)
    if (portrait) await this.assertFoundryPortraitExists(portrait)
    const actor = await this.foundry.createNpcPlaceholder(this.name(pnj), portrait)
    const updated = await this.updatePnj(id, { foundryActorUuid: actor.uuid })
    return { pnj: updated, actor, portrait }
  }

  async resyncPnjPortrait(id: string): Promise<{ portrait: string; local: 'success'; foundry: 'not-linked' | 'synchronized' | 'unavailable'; foundryMessage?: string }> {
    const pnj = await this.requirePnj(id)
    const portrait = this.normalizePortraitPath(pnj.portrait)
    if (!portrait) throw new Error('Ce PNJ ne possède pas de portrait Foundry synchronisable.')
    return this.syncPortraitForPnj(id, portrait)
  }

  async resolvePnjPortrait(encodedFilename: string): Promise<{ stream: ReturnType<typeof createReadStream>; size: number; filename: string; mimeType: string }> {
    const filename = decodeURIComponent(encodedFilename)
    if (basename(filename) !== filename || !/\.(?:webp|gif|png|jpe?g)$/i.test(filename)) throw new Error('Chemin refusé')
    const target = resolve(this.foundryPortraitRoot, filename)
    if (target !== this.foundryPortraitRoot && !target.startsWith(`${this.foundryPortraitRoot}${sep}`)) throw new Error('Chemin refusé')
    const info = await stat(target)
    if (!info.isFile()) throw new Error('Image introuvable')
    const extension = filename.split('.').at(-1)?.toLowerCase()
    const mimeType = extension === 'gif' ? 'image/gif' : extension === 'png' ? 'image/png' : extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : 'image/webp'
    return { stream: createReadStream(target), size: info.size, filename, mimeType }
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

  private async syncPortraitForPnj(id: string, portraitValue: string): Promise<{ portrait: string; local: 'success'; foundry: 'not-linked' | 'synchronized' | 'unavailable'; foundryMessage?: string }> {
    const portrait = this.normalizePortraitPath(portraitValue)
    if (!portrait) throw new Error('Portrait Foundry invalide.')
    await this.assertFoundryPortraitExists(portrait)
    const pnj = await this.requirePnj(id)
    const actorUuid = this.foundryActorUuid(pnj)
    if (!actorUuid) return { portrait, local: 'success', foundry: 'not-linked' }
    try {
      // Le fichier est déjà dans Foundry : on ne le ré-uploade pas via le relay.
      // L'Actor référence exactement le même asset que PF2-MJ.
      await this.foundry.syncActorPortrait(actorUuid, portrait)
      return { portrait, local: 'success', foundry: 'synchronized' }
    } catch (error) {
      return { portrait, local: 'success', foundry: 'unavailable', foundryMessage: this.errorMessage(error) }
    }
  }

  private normalizeReferenceItem(kind: ReferenceKind, item: Record<string, unknown>): Record<string, unknown> {
    return kind === 'pnj' ? this.normalizePnjRecord(item) : item
  }

  private normalizePnjRecord(item: Record<string, unknown>): Record<string, unknown> {
    const normalized = { ...item }
    // `image` était l'ancien champ permettant les hotlinks. Il est supprimé de
    // la donnée active, même lorsqu'il contient une URL valide.
    delete normalized.image
    const portrait = this.normalizePortraitPath(normalized.portrait)
    if (portrait) normalized.portrait = portrait
    else delete normalized.portrait
    return normalized
  }

  private normalizePortraitPath(value: unknown): string | null {
    if (typeof value !== 'string') return null
    const trimmed = value.trim().replace(/^\/+/, '')
    if (!trimmed || /^https?:\/\//i.test(trimmed)) return null
    const current = /^assets\/l7r\/portraits\/pnj\/([^/]+\.(?:webp|gif|png|jpe?g))$/i.exec(trimmed)
    if (current) return `${this.foundryPortraitPrefix}/${current[1]}`
    // Compatibilité de lecture avec la V3.2. Une prochaine écriture convertit
    // automatiquement `portraits/foo.webp` vers le chemin Foundry canonique.
    const legacy = /^portraits\/([^/]+\.(?:webp|gif|png|jpe?g))$/i.exec(trimmed)
    return legacy ? `${this.foundryPortraitPrefix}/${legacy[1]}` : null
  }

  private portraitFilename(portrait: string): string {
    const normalized = this.normalizePortraitPath(portrait)
    if (!normalized) throw new Error('Portrait Foundry invalide.')
    return normalized.split('/').at(-1) as string
  }

  private async assertFoundryPortraitExists(portrait: string): Promise<void> {
    const filename = this.portraitFilename(portrait)
    const target = resolve(this.foundryPortraitRoot, filename)
    const info = await stat(target)
    if (!info.isFile()) throw new Error(`Portrait Foundry introuvable : ${portrait}`)
  }

  private safePortraitStem(value: string): string {
    const stem = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (!stem) throw new Error('Identifiant de PNJ invalide pour le portrait.')
    return stem.slice(0, 120)
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
    return await this.persistence.readCatalogueSnapshot() as ScanCatalogue
  }

  private async walkLibraryFiles(directory: string): Promise<{ pdfs: string[]; zips: string[]; ignoredMetadata: number }> {
    const entries = await readdir(directory, { withFileTypes: true })
    const nested = await Promise.all(entries.map(async (entry) => {
      // Les fichiers AppleDouble `._foo.pdf` sont des métadonnées macOS, pas des PDF réels.
      // Même chose pour les répertoires __MACOSX et quelques fichiers techniques courants.
      if (entry.name === '__MACOSX' || entry.name === '.DS_Store' || entry.name.startsWith('._')) {
        return { pdfs: [] as string[], zips: [] as string[], ignoredMetadata: 1 }
      }
      const target = resolve(directory, entry.name)
      if (entry.isDirectory()) return this.walkLibraryFiles(target)
      if (!entry.isFile()) return { pdfs: [] as string[], zips: [] as string[], ignoredMetadata: 0 }
      const path = this.normalizedPath(relative(this.libraryRoot, target))
      if (/\.(?:pdf|pd)$/i.test(entry.name)) return { pdfs: [path], zips: [], ignoredMetadata: 0 }
      if (/\.zip$/i.test(entry.name)) return { pdfs: [], zips: [path], ignoredMetadata: 0 }
      return { pdfs: [], zips: [], ignoredMetadata: 0 }
    }))
    return {
      pdfs: nested.flatMap((item) => item.pdfs).sort((left, right) => left.localeCompare(right, 'fr')),
      zips: nested.flatMap((item) => item.zips).sort((left, right) => left.localeCompare(right, 'fr')),
      ignoredMetadata: nested.reduce((total, item) => total + item.ignoredMetadata, 0)
    }
  }

  private reconcilePdfPaths(knownPaths: string[], diskPaths: string[]): {
    added: string[]
    removed: string[]
    relocations: Array<{ cataloguePath: string; diskPath: string; reason: 'normalized-path' | 'unique-filename' }>
  } {
    const known = [...new Set(knownPaths.map((path) => this.normalizedPath(path)))]
    const disk = [...new Set(diskPaths.map((path) => this.normalizedPath(path)))]
    const diskExact = new Set(disk)
    const exactKnown = new Set(known.filter((path) => diskExact.has(path)))
    const unmatchedKnown = known.filter((path) => !exactKnown.has(path))
    const unmatchedDisk = disk.filter((path) => !exactKnown.has(path))

    const relocations: Array<{ cataloguePath: string; diskPath: string; reason: 'normalized-path' | 'unique-filename' }> = []
    const usedKnown = new Set<string>()
    const usedDisk = new Set<string>()

    const pairUnique = (
      knownKey: (path: string) => string,
      diskKey: (path: string) => string,
      reason: 'normalized-path' | 'unique-filename'
    ) => {
      const knownByKey = new Map<string, string[]>()
      const diskByKey = new Map<string, string[]>()
      for (const path of unmatchedKnown) {
        if (usedKnown.has(path)) continue
        const key = knownKey(path)
        if (!key) continue
        knownByKey.set(key, [...(knownByKey.get(key) ?? []), path])
      }
      for (const path of unmatchedDisk) {
        if (usedDisk.has(path)) continue
        const key = diskKey(path)
        if (!key) continue
        diskByKey.set(key, [...(diskByKey.get(key) ?? []), path])
      }
      for (const [key, oldPaths] of knownByKey) {
        const newPaths = diskByKey.get(key) ?? []
        if (oldPaths.length !== 1 || newPaths.length !== 1) continue
        const cataloguePath = oldPaths[0]
        const diskPath = newPaths[0]
        usedKnown.add(cataloguePath)
        usedDisk.add(diskPath)
        relocations.push({ cataloguePath, diskPath, reason })
      }
    }

    // 1. Même chemin logique après normalisation Unicode / ponctuation.
    pairUnique((path) => this.pathIdentity(path), (path) => this.pathIdentity(path), 'normalized-path')
    // 2. Même nom logique mais fichier déplacé dans un autre dossier. Uniquement si la correspondance est unique.
    pairUnique((path) => this.filenameIdentity(path), (path) => this.filenameIdentity(path), 'unique-filename')

    return {
      added: unmatchedDisk.filter((path) => !usedDisk.has(path)),
      removed: unmatchedKnown.filter((path) => !usedKnown.has(path)),
      relocations: relocations.sort((left, right) => left.cataloguePath.localeCompare(right.cataloguePath, 'fr'))
    }
  }

  private pathIdentity(path: string): string {
    return this.matchText(this.normalizedPath(path).replace(/\.(?:pdf|pd)$/i, ''))
  }

  private filenameIdentity(path: string): string {
    const filename = this.normalizedPath(path).split('/').at(-1) ?? path
    return this.matchText(filename.replace(/\.(?:pdf|pd)$/i, ''))
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

  private catalogueDocumentPaths(catalogue: ScanCatalogue): string[] {
    if (Number(catalogue.schemaVersion) === 3 && Array.isArray(catalogue.documents)) {
      return catalogue.documents.map((item) => typeof item.path === 'string' ? this.normalizedPath(item.path) : '').filter(Boolean)
    }
    return Array.isArray(catalogue.files) ? catalogue.files.map((item) => typeof item.path === 'string' ? this.normalizedPath(item.path) : '').filter(Boolean) : []
  }

  private async applyCatalogueReconciliation(catalogue: ScanCatalogue, reconciliation: { relocations: Array<{ cataloguePath: string; diskPath: string; reason: 'normalized-path' | 'unique-filename' }> }, added: string[], targets: ScanTarget[]): Promise<{ changed: boolean; relocated: number; inventoried: number; review: number }> {
    const version = Number(catalogue.schemaVersion)
    const documents = version === 3 && Array.isArray(catalogue.documents) ? catalogue.documents : null
    const files = Array.isArray(catalogue.files) ? catalogue.files as Array<Record<string, unknown>> : null
    if (!documents && !files) throw new Error('Catalogue SQLite invalide : aucun document/fichier disponible.')

    let relocated = 0
    for (const relocation of reconciliation.relocations) {
      const collection = documents ?? files!
      const document = collection.find((item) => typeof item.path === 'string' && this.normalizedPath(item.path) === this.normalizedPath(relocation.cataloguePath))
      if (!document) continue
      document.path = relocation.diskPath
      document.filename = relocation.diskPath.split('/').at(-1) ?? relocation.diskPath
      relocated++
    }

    const pending = Array.isArray(catalogue.reconciliation?.pending) ? [...catalogue.reconciliation!.pending as unknown[]] : []
    let review = 0
    for (const path of added) {
      const filename = path.split('/').at(-1) ?? path
      const match = this.matchTarget(path, targets, false)
      const info = this.isInformationPdf(path)
      const category = this.documentCategory(path)
      const target = match.targetId ? targets.find((item) => item.id === match.targetId) : undefined
      const status: 'confirmed' | 'review' | 'unassociated' = category === 'rules' || category === 'setting' ? 'confirmed' : match.status === 'confirmed' ? 'confirmed' : match.targetId ? 'review' : 'unassociated'
      if (status !== 'confirmed') review++
      const normalized = this.normalizedPath(path)
      const collection = documents ?? files!
      if (collection.some((item) => typeof item.path === 'string' && this.normalizedPath(item.path) === normalized)) continue
      const translation = this.isTranslationPdf(path)
      const originalCandidates = translation ? (files ?? []).filter((item) => typeof item.path === 'string' && !this.isTranslationPdf(String(item.path)) && this.translationIdentity(String(item.path)) === this.translationIdentity(path)) : []
      const originalId = originalCandidates.length === 1 && typeof originalCandidates[0].id === 'string' ? originalCandidates[0].id : null

      if (documents) {
        documents.push({
          id: `scan-${this.slug(path.replace(/\.(?:pdf|pd)$/i, ''))}`,
          filename, path, targetId: match.targetId, targetKind: target?.kind ?? null,
          role: info ? 'information' : category === 'map' || category === 'playerGuide' || category === 'rules' || category === 'setting' ? 'resource' : 'core',
          libraryCategory: category, isInformationFallback: info,
          association: { status, confidence: match.score, evidence: status === 'confirmed' && !match.targetId ? [`Catégorie ${category} déterminée par le chemin`] : match.evidence },
          ...(translation ? { language: 'FR', variant: 'translationUnofficial', translationOf: originalId } : {})
        })
      } else {
        files!.push({
          id: `scan-${this.slug(path.replace(/\.(?:pdf|pd)$/i, ''))}`,
          filename, path, extension: 'pdf', pages: null,
          roleHint: info ? 'information' : category,
          languageHint: translation ? 'fr' : this.languageHint(path),
          translationVariant: translation,
          ...(originalId ? { translationOf: originalId } : {}),
          association: {
            status: status === 'unassociated' ? 'non_associé' : 'associé',
            campaignId: match.campaignId,
            itemId: match.targetId,
            confidence: status === 'confirmed' ? 'confirmé' : 'à vérifier',
            evidence: status === 'confirmed' && !match.targetId ? [`Catégorie ${category} déterminée par le chemin`] : match.evidence
          }
        })
      }
      if (status !== 'confirmed') pending.push({ path, reason: 'Association automatique à vérifier', candidateId: match.targetId, evidence: match.evidence })
    }
    catalogue.reconciliation = { ...(catalogue.reconciliation ?? {}), pending, relocationsApplied: [...(Array.isArray(catalogue.reconciliation?.relocationsApplied) ? catalogue.reconciliation!.relocationsApplied as unknown[] : []), ...reconciliation.relocations.map((item) => ({ from: item.cataloguePath, to: item.diskPath }))] }
    await this.persistence.replaceCatalogueSnapshot(catalogue as Record<string, unknown>)
    return { changed: relocated > 0 || added.length > 0, relocated, inventoried: added.length, review }
  }

  private documentCategory(path: string): 'adventure' | 'map' | 'playerGuide' | 'rules' | 'setting' | 'information' | 'other' {
    const filename = path.split('/').at(-1) ?? path
    if (this.isInformationPdf(path)) return 'information'
    if (/^Règles\//i.test(path)) return 'rules'
    if (/^Univers\//i.test(path)) return 'setting'
    if (/\(map\)/i.test(filename) || /\/Cartes\//i.test(path)) return 'map'
    if (/\(player\)/i.test(filename) || /\/Guides joueurs\//i.test(path)) return 'playerGuide'
    if (/^Campagnes\//i.test(path)) return 'adventure'
    return 'other'
  }

  private scanTargets(catalogue: ScanCatalogue): ScanTarget[] {
    const result: ScanTarget[] = []

    if (Number(catalogue.schemaVersion) === 3 && (catalogue.playableUnits || catalogue.containers || catalogue.components)) {
      for (const container of catalogue.containers ?? []) {
        const id = typeof container.id === 'string' ? container.id : ''
        if (!id) continue
        const titles = this.asObject(container.titles)
        const isCampaign = container.containerType === 'campaign'
        result.push({ id, kind: 'container', isCampaign, parentId: typeof container.parentId === 'string' ? container.parentId : null, labels: this.scanLabels(titles.fr, titles.original, titles.aliases, id), numbers: this.scanNumbers(container.season) })
      }
      for (const unit of catalogue.playableUnits ?? []) {
        const id = typeof unit.id === 'string' ? unit.id : ''
        if (!id) continue
        const titles = this.asObject(unit.titles)
        result.push({ id, kind: 'playable', isCampaign: false, parentId: typeof unit.parentId === 'string' ? unit.parentId : null, labels: this.scanLabels(titles.fr, titles.original, titles.aliases, id), numbers: this.scanNumbers(unit.number) })
      }
      for (const component of catalogue.components ?? []) {
        const id = typeof component.id === 'string' ? component.id : ''
        if (!id) continue
        const titles = this.asObject(component.titles)
        result.push({ id, kind: 'component', isCampaign: false, parentId: typeof component.ownerId === 'string' ? component.ownerId : null, labels: this.scanLabels(titles.fr, titles.original, titles.aliases, id), numbers: this.scanNumbers(component.number) })
      }
      return result
    }

    const playablePartKinds = new Set(['volume_aventure', 'aventure_autonome', 'one_shot', 'aventure_communautaire'])
    for (const entry of catalogue.entries ?? []) {
      const id = typeof entry.id === 'string' ? entry.id : ''
      if (!id) continue
      const kind = typeof entry.kind === 'string' ? entry.kind : ''
      const isCampaign = kind === 'campaign'
      result.push({ id, kind: isCampaign ? 'container' : 'playable', isCampaign, parentId: typeof entry.collectionId === 'string' ? entry.collectionId : null, labels: this.scanLabels(entry.titleFr, entry.titleOriginal, entry.aliases, id), numbers: this.scanNumbers(entry.number) })
      for (const part of entry.parts ?? []) {
        const partId = typeof part.id === 'string' ? part.id : ''
        if (!partId) continue
        const partKind = typeof part.kind === 'string' ? part.kind : ''
        result.push({ id: partId, kind: isCampaign && playablePartKinds.has(partKind) ? 'playable' : 'component', isCampaign: false, parentId: id, labels: this.scanLabels(part.titleFr, part.titleOriginal, [], partId), numbers: this.scanNumbers(part.number, part.sequence) })
      }
    }
    for (const collection of catalogue.collections ?? []) {
      const id = typeof collection.id === 'string' ? collection.id : ''
      if (!id) continue
      const season = typeof collection.season === 'number' ? collection.season : null
      result.push({ id, kind: 'container', isCampaign: false, parentId: typeof collection.parentId === 'string' ? collection.parentId : null, labels: this.scanLabels(collection.titleFr, collection.titleOriginal, [], id), numbers: season === null ? [] : [String(season)] })
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


  private isTranslationPdf(path: string): boolean {
    const filename = path.split('/').at(-1) ?? path
    return /(?:^|[\s._(\[-])(?:trad|traduction|translated|vf)(?:[\s._)\]-]|$)/i.test(filename)
  }

  private translationIdentity(path: string): string {
    const filename = (path.split('/').at(-1) ?? path).replace(/\.(?:pdf|pd)$/i, '')
    return this.matchText(filename).replace(/\b(?:trad|traduction|translated|vf)\b/g, ' ').replace(/\s+/g, ' ').trim()
  }

  private languageHint(path: string): 'fr' | 'en' | undefined {
    const filename = path.split('/').at(-1) ?? path
    if (this.isTranslationPdf(path) || /(?:^|[\s._(\[-])(?:fr|vf)(?:[\s._)\]-]|$)/i.test(filename)) return 'fr'
    if (/(?:^|[\s._(\[-])(?:en|vo)(?:[\s._)\]-]|$)/i.test(filename)) return 'en'
    return undefined
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
    return value.normalize('NFC').replace(/\\/g, '/').replace(/^\/+/, '')
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

  private validateCatalogue(value: Record<string, unknown>): void {
    for (const key of ['entries', 'collections', 'files', 'sections', 'arcs']) if (!Array.isArray(value[key])) throw new Error(`Catalogue invalide : ${key} doit être un tableau.`)
    this.validateUniqueIds(this.records(value.entries), 'entries')
    this.validateUniqueIds(this.records(value.collections), 'collections')
    this.validateUniqueIds(this.records(value.files), 'files')
  }

  private validateUniqueIds(items: Record<string, unknown>[], label: string): void {
    const seen = new Set<string>()
    for (const item of items) {
      const id = typeof item.id === 'string' ? item.id.trim() : ''
      if (!id) throw new Error(`${label} contient une entrée sans id.`)
      if (seen.has(id)) throw new Error(`${label} contient un id dupliqué : ${id}.`)
      seen.add(id)
    }
  }

  private records(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => this.isRecord(item)) : [] }
  private isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) }

  private arrayDiff(current: Record<string, unknown>[], next: Record<string, unknown>[]): { current: number; next: number; added: number; updated: number; removed: number } {
    const before = new Map(current.map((item) => [String(item.id ?? ''), JSON.stringify(item)]))
    const after = new Map(next.map((item) => [String(item.id ?? ''), JSON.stringify(item)]))
    let added = 0, updated = 0, removed = 0
    for (const [id, value] of after) { if (!before.has(id)) added++; else if (before.get(id) !== value) updated++ }
    for (const id of before.keys()) if (!after.has(id)) removed++
    return { current: current.length, next: next.length, added, updated, removed }
  }

  private catalogueDiff(current: Record<string, unknown>, next: Record<string, unknown>): Record<string, unknown> {
    return {
      summary: {
        entries: this.arrayDiff(this.records(current.entries), this.records(next.entries)),
        collections: this.arrayDiff(this.records(current.collections), this.records(next.collections)),
        files: this.arrayDiff(this.records(current.files), this.records(next.files)),
        sections: this.arrayDiff(this.records(current.sections), this.records(next.sections)),
        arcs: this.arrayDiff(this.records(current.arcs), this.records(next.arcs))
      }
    }
  }

  private catalogueSelection(catalogue: Record<string, unknown>, targetId: string): Record<string, unknown> {
    const entries = this.records(catalogue.entries)
    const collections = this.records(catalogue.collections)
    const files = this.records(catalogue.files)
    const selectedIds = new Set<string>([targetId])
    const owner = entries.find((entry) => Array.isArray(entry.parts) && entry.parts.some((part) => this.isRecord(part) && part.id === targetId))
    if (owner && typeof owner.id === 'string') selectedIds.add(owner.id)
    const collectionQueue = [...selectedIds]
    while (collectionQueue.length) {
      const parent = collectionQueue.shift()!
      for (const collection of collections) if (collection.parentId === parent && typeof collection.id === 'string' && !selectedIds.has(collection.id)) { selectedIds.add(collection.id); collectionQueue.push(collection.id) }
    }
    for (const entry of entries) if (typeof entry.id === 'string' && (entry.id === targetId || (typeof entry.collectionId === 'string' && selectedIds.has(entry.collectionId)))) selectedIds.add(entry.id)
    const selectedEntries = entries.filter((entry) => typeof entry.id === 'string' && selectedIds.has(entry.id))
    const partIds = new Set(selectedEntries.flatMap((entry) => Array.isArray(entry.parts) ? entry.parts.flatMap((part) => this.isRecord(part) && typeof part.id === 'string' ? [part.id] : []) : []))
    const fileIds = new Set<string>()
    for (const entry of selectedEntries) {
      for (const link of Array.isArray(entry.documents) ? entry.documents : []) if (this.isRecord(link) && typeof link.fileId === 'string') fileIds.add(link.fileId)
      for (const part of Array.isArray(entry.parts) ? entry.parts : []) if (this.isRecord(part)) for (const link of Array.isArray(part.documents) ? part.documents : []) if (this.isRecord(link) && typeof link.fileId === 'string') fileIds.add(link.fileId)
    }
    const selectedFiles = files.filter((file) => {
      if (typeof file.id === 'string' && fileIds.has(file.id)) return true
      const association = this.asObject(file.association)
      return (typeof association.itemId === 'string' && (selectedIds.has(association.itemId) || partIds.has(association.itemId))) || (typeof association.campaignId === 'string' && selectedIds.has(association.campaignId))
    })
    return {
      scope: 'catalogue-selection', targetId, schemaVersion: catalogue.schemaVersion ?? 2, meta: catalogue.meta ?? {},
      entries: selectedEntries, collections: collections.filter((collection) => typeof collection.id === 'string' && selectedIds.has(collection.id)),
      files: selectedFiles, sections: this.records(catalogue.sections), arcs: this.records(catalogue.arcs), narrativeThreads: this.records(catalogue.narrativeThreads)
    }
  }

  private mergeCatalogueSelection(current: Record<string, unknown>, selection: Record<string, unknown>): Record<string, unknown> {
    const merge = (key: string) => {
      const map = new Map(this.records(current[key]).map((item) => [String(item.id ?? ''), item]))
      for (const item of this.records(selection[key])) map.set(String(item.id ?? ''), item)
      return [...map.values()]
    }
    return { ...current, entries: merge('entries'), collections: merge('collections'), files: merge('files'), sections: current.sections ?? [], arcs: current.arcs ?? [], narrativeThreads: current.narrativeThreads ?? [] }
  }

  private normalizeCuration(value: Record<string, unknown>): Record<string, unknown> {
    const data = { ...value }
    const byId = { ...this.asObject(data.byId), ...this.asObject(data.entries) }
    const set = (id: string, field: string, fieldValue: unknown, overwrite = false) => {
      if (!id) return
      const entry = { ...this.asObject(byId[id]) }
      if (overwrite || entry[field] === undefined) entry[field] = fieldValue
      byId[id] = entry
    }
    this.strings(data.excludedCampaignIds).forEach((id) => set(id, 'inclusion', 'excluded'))
    this.strings(data.includedCampaignIds).forEach((id) => set(id, 'inclusion', 'reinstated'))
    this.strings(data.excludedScenarioIds).forEach((id) => set(id, 'inclusion', 'excluded'))
    const maps: Array<[string, string]> = [['playabilityByCampaign','playability'],['playabilityByScenario','playability'],['progressByCampaign','progress'],['progressByScenario','progress'],['levelsByCampaign','levelsOverride'],['levelsByScenario','levelsOverride'],['placesByCampaign','placesOverride'],['placesByScenario','placesOverride']]
    for (const [source, field] of maps) for (const [id, fieldValue] of Object.entries(this.asObject(data[source]))) set(id, field, fieldValue)
    data.schemaVersion = 3
    data.byId = byId
    return data
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
