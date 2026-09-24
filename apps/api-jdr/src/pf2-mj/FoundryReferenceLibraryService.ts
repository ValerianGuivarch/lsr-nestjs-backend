import { Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// PF2_AI_TWO_PASS_REFERENCE_LIBRARY_V1

type RequiredKind = 'foundry_actor_source' | 'foundry_item_source' | 'foundry_spell_source' | 'foundry_hazard_source' | 'foundry_effect_source'
type RequiredRequest = {
  requestId: string
  kind: RequiredKind
  subject: { uuid: string; name: string | null }
  reason: string
  required: boolean
}

export type RequiredDataStatus = {
  targetId: string
  targetKind: 'scenario' | 'campaign'
  status: 'ready' | 'needs_more_data' | 'blocked'
  requests: Array<RequiredRequest & { available: boolean; indexName: string | null; sourceType: 'Actor' | 'Item' }>
  unresolved: unknown[]
  requiredMissing: number
  availableCount: number
  importedAt: string | null
}

@Injectable()
export class FoundryReferenceLibraryService {
  private readonly libraryRoot = resolve(process.env['PF2_LIBRARY_ROOT'] ?? '../../PF2/MJ')
  private readonly referencePath = resolve(this.libraryRoot, '_Foundry', 'pf2e-reference-library.json')
  private readonly requiredRoot = resolve(this.libraryRoot, '_AI', 'required-data')
  private cachedLibrary: Record<string, unknown> | null = null
  private cachedMtimeMs = -1

  async importLibrary(bytes: Buffer, originalName: string): Promise<Record<string, unknown>> {
    if (!bytes.byteLength) throw new Error('Export Foundry vide.')
    if (bytes.byteLength > 800 * 1024 * 1024) throw new Error('Export Foundry trop volumineux (800 Mo maximum).')
    let parsed: Record<string, unknown>
    try { parsed = this.object(JSON.parse(bytes.toString('utf8'))) } catch { throw new Error('Le fichier de bibliothèque Foundry n’est pas un JSON valide.') }
    this.validateLibrary(parsed)
    await mkdir(resolve(this.libraryRoot, '_Foundry'), { recursive: true })
    await writeFile(this.referencePath, bytes)
    this.cachedLibrary = parsed
    this.cachedMtimeMs = (await stat(this.referencePath)).mtimeMs
    return { ...(await this.status()), importedFile: originalName, sha256: createHash('sha256').update(bytes).digest('hex') }
  }

  async status(): Promise<Record<string, unknown>> {
    try {
      const library = await this.library()
      const metadata = this.object(library.metadata)
      const index = this.object(library.index)
      const sources = this.object(library.sources)
      const actors = this.array(index.actors)
      const items = this.array(index.items)
      const actorSources = this.array(sources.actors)
      const itemSources = this.array(sources.items)
      const disk = await stat(this.referencePath)
      return {
        available: true,
        path: '_Foundry/pf2e-reference-library.json',
        formatVersion: library.formatVersion,
        metadata,
        actorCount: actors.length,
        itemCount: items.length,
        actorSourceCount: actorSources.length,
        itemSourceCount: itemSources.length,
        size: disk.size,
        updatedAt: disk.mtime.toISOString()
      }
    } catch {
      return { available: false, path: '_Foundry/pf2e-reference-library.json', formatVersion: null, metadata: {}, actorCount: 0, itemCount: 0, actorSourceCount: 0, itemSourceCount: 0, size: 0, updatedAt: null }
    }
  }

  async lightIndex(): Promise<Record<string, unknown>> {
    const library = await this.library()
    const index = this.object(library.index)
    return { formatVersion: 1, sourceLibraryFormatVersion: library.formatVersion, metadata: this.object(library.metadata), actors: this.array(index.actors), items: this.array(index.items) }
  }

  async assertActorReferences(manifest: Record<string, unknown>): Promise<void> {
    const references: Array<{ label: string; uuid: string | null; lookup: string | null }> = []
    const visit = (raw: unknown, label: string): void => {
      const actor = this.object(raw)
      if (actor.type === 'reference') {
        references.push({ label, uuid: this.optionalText(actor.uuid), lookup: this.optionalText(actor.lookup) })
        return
      }
      if (actor.type === 'narrative') visit(actor.actor, `${label}.actor`)
    }
    for (const [index, actor] of this.array(manifest.actors).entries()) visit(actor, `actors[${index}]`)
    if (!references.length) return

    const library = await this.library().catch(() => null)
    if (!library) throw new Error('Ce package contient des références de compendium mais aucune bibliothèque de références Foundry n’est installée dans l’application.')
    const actorIndex = new Set(this.array(this.object(library.index).actors).map((entry) => this.optionalText(this.object(entry).uuid)).filter((uuid): uuid is string => Boolean(uuid)))
    const errors: string[] = []
    for (const ref of references) {
      if (!ref.uuid) {
        errors.push(`${ref.label} utilise une référence sans UUID exact${ref.lookup ? ` (lookup « ${ref.lookup} »)` : ''}.`)
        continue
      }
      if (!actorIndex.has(ref.uuid)) errors.push(`${ref.label} pointe vers un UUID Actor absent de la bibliothèque Foundry : ${ref.uuid}.`)
    }
    if (errors.length) throw new Error(`Références Foundry invalides : ${errors.join(' | ')}`)
  }

  async importRequiredData(targetId: string, bytes: Buffer, originalName: string): Promise<RequiredDataStatus> {
    if (!bytes.byteLength) throw new Error('required-data.json est vide.')
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error('required-data.json est anormalement volumineux.')
    let parsed: Record<string, unknown>
    try { parsed = this.object(JSON.parse(bytes.toString('utf8'))) } catch { throw new Error('required-data.json n’est pas un JSON valide.') }
    this.validateRequiredData(targetId, parsed)
    await mkdir(this.requiredRoot, { recursive: true })
    const stored = { ...parsed, importedAt: new Date().toISOString(), importedFile: originalName }
    await writeFile(this.requiredPath(targetId), JSON.stringify(stored, null, 2), 'utf8')
    return this.requiredDataStatus(targetId) as Promise<RequiredDataStatus>
  }

  async requiredDataStatus(targetId: string): Promise<RequiredDataStatus | null> {
    let parsed: Record<string, unknown>
    try { parsed = this.object(JSON.parse(await readFile(this.requiredPath(targetId), 'utf8'))) } catch { return null }
    this.validateRequiredData(targetId, parsed)
    const requests = this.requiredRequests(parsed.requests)
    const result = await Promise.all(requests.map(async (request) => {
      const sourceType = this.sourceTypeForKind(request.kind)
      const resolved = await this.resolveSource(request.subject.uuid, sourceType)
      return { ...request, available: Boolean(resolved), indexName: resolved?.indexName ?? null, sourceType }
    }))
    return {
      targetId,
      targetKind: parsed.targetKind as 'scenario' | 'campaign',
      status: parsed.status as 'ready' | 'needs_more_data' | 'blocked',
      requests: result,
      unresolved: this.array(parsed.unresolved),
      requiredMissing: result.filter((request) => request.required && !request.available).length,
      availableCount: result.filter((request) => request.available).length,
      importedAt: this.optionalText(parsed.importedAt)
    }
  }

  async requiredData(targetId: string): Promise<Record<string, unknown>> {
    let parsed: Record<string, unknown>
    try { parsed = this.object(JSON.parse(await readFile(this.requiredPath(targetId), 'utf8'))) } catch { throw new Error('Aucun required-data.json importé pour cette cible.') }
    this.validateRequiredData(targetId, parsed)
    return parsed
  }

  async resolvedSources(targetId: string): Promise<Array<Record<string, unknown>>> {
    const required = await this.requiredData(targetId)
    const requests = this.requiredRequests(required.requests)
    const resolved: Array<Record<string, unknown>> = []
    for (const request of requests) {
      const sourceType = this.sourceTypeForKind(request.kind)
      const found = await this.resolveSource(request.subject.uuid, sourceType)
      if (!found) {
        if (request.required) throw new Error(`Donnée Foundry requise introuvable : ${request.requestId} · ${request.subject.uuid}`)
        continue
      }
      resolved.push({ requestId: request.requestId, kind: request.kind, uuid: request.subject.uuid, name: request.subject.name, reason: request.reason, required: request.required, sourceType, index: found.index, source: found.source })
    }
    return resolved
  }

  private async resolveSource(uuid: string, sourceType: 'Actor' | 'Item'): Promise<{ indexName: string | null; index: Record<string, unknown>; source: Record<string, unknown> } | null> {
    const library = await this.library()
    const key = sourceType === 'Actor' ? 'actors' : 'items'
    const index = this.array(this.object(library.index)[key]).map((value) => this.object(value)).find((entry) => entry.uuid === uuid)
    if (!index) return null
    const sourceEntry = this.array(this.object(library.sources)[key]).map((value) => this.object(value)).find((entry) => entry.uuid === uuid)
    const source = sourceEntry ? this.object(sourceEntry.source) : {}
    if (!Object.keys(source).length) return null
    return { indexName: this.optionalText(index.name), index, source }
  }

  private validateLibrary(value: Record<string, unknown>): void {
    if (value.formatVersion !== 3) throw new Error('La bibliothèque Foundry doit utiliser formatVersion = 3.')
    const index = this.object(value.index)
    const sources = this.object(value.sources)
    if (!Array.isArray(index.actors) || !Array.isArray(index.items)) throw new Error('La bibliothèque doit contenir index.actors et index.items.')
    if (!Array.isArray(sources.actors) || !Array.isArray(sources.items)) throw new Error('La bibliothèque doit contenir sources.actors et sources.items.')
    const seen = new Set<string>()
    for (const [kind, list] of [['Actor', index.actors], ['Item', index.items]] as const) {
      for (const [i, raw] of this.array(list).entries()) {
        const entry = this.object(raw)
        const uuid = this.optionalText(entry.uuid)
        if (!uuid || !uuid.startsWith('Compendium.')) throw new Error(`${kind} index[${i}] possède un UUID invalide.`)
        if (seen.has(uuid)) throw new Error(`UUID dupliqué dans l’index Foundry : ${uuid}.`)
        seen.add(uuid)
      }
    }
  }

  private validateRequiredData(targetId: string, value: Record<string, unknown>): void {
    if (value.formatVersion !== 1) throw new Error('required-data.json doit utiliser formatVersion = 1.')
    if (value.targetId !== targetId) throw new Error(`required-data.json vise « ${String(value.targetId ?? '')} », pas « ${targetId} ».`)
    if (value.targetKind !== 'scenario' && value.targetKind !== 'campaign') throw new Error('targetKind doit valoir scenario ou campaign.')
    if (!['ready', 'needs_more_data', 'blocked'].includes(String(value.status))) throw new Error('status doit valoir ready, needs_more_data ou blocked.')
    this.requiredRequests(value.requests)
    if (value.unresolved !== undefined && !Array.isArray(value.unresolved)) throw new Error('unresolved doit être un tableau.')
  }

  private requiredRequests(value: unknown): RequiredRequest[] {
    if (!Array.isArray(value)) throw new Error('requests doit être un tableau.')
    const allowed = new Set<RequiredKind>(['foundry_actor_source', 'foundry_item_source', 'foundry_spell_source', 'foundry_hazard_source', 'foundry_effect_source'])
    const seen = new Set<string>()
    return value.map((raw, index) => {
      const item = this.object(raw)
      const requestId = this.requiredText(item.requestId, `requests[${index}].requestId`)
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(requestId)) throw new Error(`requestId invalide : ${requestId}.`)
      if (seen.has(requestId)) throw new Error(`requestId dupliqué : ${requestId}.`)
      seen.add(requestId)
      const kind = this.requiredText(item.kind, `requests[${index}].kind`) as RequiredKind
      if (!allowed.has(kind)) throw new Error(`kind non supporté : ${kind}.`)
      const subject = this.object(item.subject)
      const uuid = this.requiredText(subject.uuid, `requests[${index}].subject.uuid`)
      if (!uuid.startsWith('Compendium.')) throw new Error(`UUID de compendium invalide : ${uuid}.`)
      return { requestId, kind, subject: { uuid, name: this.optionalText(subject.name) }, reason: this.requiredText(item.reason, `requests[${index}].reason`), required: item.required !== false }
    })
  }

  private sourceTypeForKind(kind: RequiredKind): 'Actor' | 'Item' { return kind === 'foundry_actor_source' || kind === 'foundry_hazard_source' ? 'Actor' : 'Item' }

  private async library(): Promise<Record<string, unknown>> {
    const disk = await stat(this.referencePath)
    if (this.cachedLibrary && this.cachedMtimeMs === disk.mtimeMs) return this.cachedLibrary
    const parsed = this.object(JSON.parse(await readFile(this.referencePath, 'utf8')))
    this.validateLibrary(parsed)
    this.cachedLibrary = parsed
    this.cachedMtimeMs = disk.mtimeMs
    return parsed
  }

  private requiredPath(targetId: string): string {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(targetId)) throw new Error('ID de cible invalide.')
    return resolve(this.requiredRoot, `${targetId}.json`)
  }

  private object(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
  private array(value: unknown): unknown[] { return Array.isArray(value) ? value : [] }
  private optionalText(value: unknown): string | null { return typeof value === 'string' && value.trim() ? value.trim() : null }
  private requiredText(value: unknown, label: string): string { const text = this.optionalText(value); if (!text) throw new Error(`${label} est obligatoire.`); return text }
}
