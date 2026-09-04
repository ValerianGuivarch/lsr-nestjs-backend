import AdmZip from 'adm-zip'
import { Injectable } from '@nestjs/common'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import sharp from 'sharp'
import { Pf2PersistenceService, ScenarioDeployment, ScenarioNpcLink, ScenarioRelation, ScenarioRelationTargetKind } from '../pf2-storage/Pf2PersistenceService'

type PackageNpc = { key?: unknown; npcId?: unknown; name?: unknown; aliases?: unknown; description?: unknown; portrait?: unknown; role?: unknown; importance?: unknown; sourcePage?: unknown; notes?: unknown }
type PackageRelation = { key?: unknown; kind?: unknown; refId?: unknown; factionId?: unknown; eventId?: unknown; name?: unknown; aliases?: unknown; description?: unknown; role?: unknown; importance?: unknown; sourcePage?: unknown; notes?: unknown }
type ScenarioManifest = { packageVersion?: unknown; scenario?: { id?: unknown; name?: unknown }; npcs?: unknown; places?: unknown; factions?: unknown; events?: unknown; actors?: unknown; [key: string]: unknown }

@Injectable()
export class ScenarioPackageService {
  constructor(private readonly persistence: Pf2PersistenceService) {}

  async importZip(bytes: Buffer, originalName: string): Promise<{ scenarioId: string; packageVersion: number; state: 'integrated' | 'unchanged' | 'updated'; npcs: Array<{ id: string; name: string; created: boolean }> }> {
    const inspected = this.inspectZip(bytes)
    const { zip, manifest, scenarioId, packageVersion } = inspected
    if (manifest.npcs !== undefined && !Array.isArray(manifest.npcs)) throw new Error('npcs doit être un tableau.')
    if (manifest.places !== undefined && !Array.isArray(manifest.places)) throw new Error('places doit être un tableau.')
    if (manifest.factions !== undefined && !Array.isArray(manifest.factions)) throw new Error('factions doit être un tableau.')
    if (manifest.events !== undefined && !Array.isArray(manifest.events)) throw new Error('events doit être un tableau.')
    if (manifest.actors !== undefined && !Array.isArray(manifest.actors)) throw new Error('actors doit être un tableau.')
    const existing = await this.persistence.getScenarioPackage(scenarioId)
    if (existing && existing.packageVersion > packageVersion) throw new Error(`Une version plus récente (${existing.packageVersion}) est déjà intégrée.`)
    const npcs = await this.resolveNpcs(scenarioId, (manifest.npcs ?? []) as PackageNpc[], zip)
    const relations = await this.resolveRelations(scenarioId, manifest)
    const state: 'integrated' | 'unchanged' | 'updated' = existing?.packageVersion === packageVersion ? 'unchanged' : existing ? 'updated' : 'integrated'
    const packageDir = resolve(this.persistence.storageRoot, 'documents', 'scenario-packages', this.safeSegment(scenarioId))
    await mkdir(packageDir, { recursive: true })
    await writeFile(resolve(packageDir, `v${packageVersion}.zip`), bytes)
    await this.persistence.importScenarioPackageAtomically({
      records: [...npcs.records, ...relations.records], npcLinks: npcs.links, relations: relations.links,
      replaceRelationKinds: [
        ...(manifest.places === undefined ? [] : ['lieu', 'region'] as ScenarioRelationTargetKind[]),
        ...(manifest.factions === undefined ? [] : ['faction'] as ScenarioRelationTargetKind[]),
        ...(manifest.events === undefined ? [] : ['evenement'] as ScenarioRelationTargetKind[])
      ],
      package: { scenarioId, packageVersion, status: 'integrated', filename: basename(originalName) || `${scenarioId}.zip`, manifest }
    })
    return { scenarioId, packageVersion, state, npcs: npcs.items }
  }

  /** Parse and validate the package header without writing anything. */
  inspectZip(bytes: Buffer): { zip: AdmZip; manifest: ScenarioManifest; scenarioId: string; packageVersion: number; scenarioName: string } {
    if (!bytes.byteLength) throw new Error('Archive ZIP vide.')
    if (bytes.byteLength > 80 * 1024 * 1024) throw new Error('Archive ZIP trop volumineuse (80 Mo maximum).')
    const zip = new AdmZip(bytes)
    const entry = zip.getEntries().find(item => this.cleanPath(item.entryName).toLowerCase() === 'scenario.json')
    if (!entry) throw new Error('Le ZIP doit contenir scenario.json à sa racine.')
    let manifest: ScenarioManifest
    try { manifest = JSON.parse(entry.getData().toString('utf8')) as ScenarioManifest } catch { throw new Error('scenario.json est invalide.') }
    const scenarioId = this.id(manifest.scenario?.id, 'scenario.id')
    const scenarioName = this.text(manifest.scenario?.name, 'scenario.name')
    const packageVersion = manifest.packageVersion === undefined ? 1 : this.version(manifest.packageVersion)
    return { zip, manifest, scenarioId, packageVersion, scenarioName }
  }

  async packageForScenario(scenarioId: string): Promise<unknown> { return this.persistence.getScenarioPackage(scenarioId) }
  async requestDeployment(scenarioId: string): Promise<ScenarioDeployment> {
    const packageStatus = await this.persistence.getScenarioPackage(scenarioId)
    if (!packageStatus) throw new Error('Ce scénario ne possède aucun package intégré.')
    const path = this.packagePath(scenarioId, packageStatus.packageVersion)
    try { if (!(await stat(path)).isFile()) throw new Error('missing') } catch { throw new Error(`Le ZIP intégré v${packageStatus.packageVersion} est introuvable dans le stockage.`) }
    return this.persistence.enqueueScenarioDeployment(scenarioId, packageStatus.packageVersion)
  }
  async claimDeployment(worldId: unknown, clientId: unknown): Promise<ScenarioDeployment | null> {
    return this.persistence.claimScenarioDeployment(this.id(worldId, 'worldId'), this.id(clientId, 'clientId'))
  }
  async latestDeployment(scenarioId: string): Promise<ScenarioDeployment | null> { return this.persistence.getLatestScenarioDeployment(scenarioId) }
  async deploymentZip(id: string, claimToken: unknown): Promise<{ bytes: Buffer; filename: string; deployment: ScenarioDeployment }> {
    const deployment = await this.persistence.getScenarioDeployment(this.id(id, 'deploymentId'))
    if (!deployment || deployment.status !== 'claimed' || typeof claimToken !== 'string' || claimToken !== deployment.claimToken) throw new Error('Lease de déploiement invalide ou expiré.')
    const path = this.packagePath(deployment.scenarioId, deployment.packageVersion)
    try { if (!(await stat(path)).isFile()) throw new Error('missing') } catch { throw new Error('ZIP du package déployé introuvable.') }
    return { bytes: await readFile(path), filename: `${this.safeSegment(deployment.scenarioId)}-v${deployment.packageVersion}.zip`, deployment }
  }
  async finishDeployment(id: string, body: unknown): Promise<ScenarioDeployment> {
    const input = body && typeof body === 'object' ? body as Record<string, unknown> : {}
    const deployment = await this.persistence.getScenarioDeployment(this.id(id, 'deploymentId'))
    if (!deployment) throw new Error('Demande de déploiement inconnue.')
    if (input.scenarioId !== deployment.scenarioId || input.packageVersion !== deployment.packageVersion) throw new Error('Résultat de déploiement incompatible avec la demande.')
    if (typeof input.success !== 'boolean') throw new Error('success doit être un booléen.')
    const object = (value: unknown) => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
    const result = { deploymentId: deployment.id, scenarioId: deployment.scenarioId, packageVersion: deployment.packageVersion, success: input.success, actors: object(input.actors), scenes: object(input.scenes), journals: object(input.journals), errors: Array.isArray(input.errors) ? input.errors.map(String) : [], ...(typeof input.error === 'string' ? { error: input.error } : {}) }
    return this.persistence.finishScenarioDeployment(deployment.id, typeof input.claimToken === 'string' ? input.claimToken : '', result)
  }
  async markDeployed(scenarioId: string, body: unknown): Promise<unknown> {
    const packageStatus = await this.persistence.getScenarioPackage(scenarioId)
    if (!packageStatus) throw new Error('Ce package doit être intégré dans l’application avant son déploiement Foundry.')
    const input = body && typeof body === 'object' ? body as Record<string, unknown> : {}
    if (input.packageVersion !== undefined && input.packageVersion !== packageStatus.packageVersion) throw new Error(`Version déployée invalide : l’application attend v${packageStatus.packageVersion}.`)
    await this.persistence.saveScenarioPackage({ ...packageStatus, status: 'deployed', deployedVersion: packageStatus.packageVersion, deployedAt: new Date().toISOString() })
    return this.persistence.getScenarioPackage(scenarioId)
  }
  async npcsForScenario(scenarioId: string): Promise<unknown[]> {
    const links = await this.persistence.listScenarioNpcLinks(scenarioId)
    return Promise.all(links.map(async link => ({ ...(await this.persistence.getRecord('pnj', link.npcId)), ...link })))
  }
  async relationsForScenario(scenarioId: string): Promise<Record<string, unknown[]>> {
    const links = await this.persistence.listScenarioRelations(scenarioId)
    const resolved = await Promise.all(links.map(async link => ({ ...(await this.persistence.getRecord(link.targetKind, link.targetId)), ...link })))
    return { npcs: await this.npcsForScenario(scenarioId), places: resolved.filter(link => link.targetKind === 'lieu' || link.targetKind === 'region'), factions: resolved.filter(link => link.targetKind === 'faction'), events: resolved.filter(link => link.targetKind === 'evenement') }
  }
  async packageRegistry(includeExcluded = false): Promise<Record<string, unknown[]>> {
    const compact = (kind: ScenarioRelationTargetKind | 'pnj') => this.persistence.listRecords(kind, { includeExcluded }).then(records => records.map(record => ({ id: record.id, name: record.nom ?? record.name ?? record.title ?? record.id, aliases: Array.isArray(record.aliases) ? record.aliases : [], ...(kind === 'lieu' || kind === 'region' ? { kind } : {}) })))
    const [npcs, lieu, region, factions, events] = await Promise.all([compact('pnj'), compact('lieu'), compact('region'), compact('faction'), compact('evenement')])
    return { npcs, places: [...lieu, ...region], factions, events }
  }
  async scenarioExport(scenarioId: string): Promise<Record<string, unknown>> {
    return { scenario: (await this.persistence.getCatalogueEntity(scenarioId)) ?? (await this.persistence.getRecord('scenario', scenarioId)) ?? { id: scenarioId }, ...(await this.relationsForScenario(scenarioId)) }
  }
  async scenariosForNpc(npcId: string): Promise<unknown[]> {
    const links = await this.persistence.listNpcScenarioLinks(npcId)
    return Promise.all(links.map(async link => ({ ...((await this.persistence.getCatalogueEntity(link.scenarioId)) ?? (await this.persistence.getRecord('scenario', link.scenarioId)) ?? { id: link.scenarioId }), ...link })))
  }
  async npcsForCampaign(campaignId: string): Promise<unknown[]> {
    const scenarios = await this.persistence.listCatalogueEntries()
    const scenarioIds = new Set<string>()
    for (const scenario of scenarios) {
      if (scenario.collectionId !== campaignId && scenario.id !== campaignId) continue
      if (typeof scenario.id === 'string') scenarioIds.add(scenario.id)
      if (scenario.id === campaignId && Array.isArray(scenario.parts)) for (const part of scenario.parts) if (part && typeof part === 'object' && typeof (part as Record<string, unknown>).id === 'string') scenarioIds.add(String((part as Record<string, unknown>).id))
    }
    const links = (await Promise.all([...scenarioIds].map(scenarioId => this.persistence.listScenarioNpcLinks(scenarioId)))).flat()
    const unique = [...new Map(links.map(link => [link.npcId, link])).values()]
    return Promise.all(unique.map(async link => ({ ...(await this.persistence.getRecord('pnj', link.npcId)), ...link })))
  }
  async registry(includeExcluded = false): Promise<unknown[]> {
    const pnjs = await this.persistence.listRecords('pnj', { includeExcluded })
    return Promise.all(pnjs.map(async pnj => ({ id: pnj.id, nom: pnj.nom, aliases: Array.isArray(pnj.aliases) ? pnj.aliases : [], portrait: pnj.portrait ?? null, scenarios: (await this.persistence.listNpcScenarioLinks(String(pnj.id))).map(link => link.scenarioId) })))
  }

  private async resolveNpcs(scenarioId: string, definitions: PackageNpc[], zip: AdmZip): Promise<{ items: Array<{ id: string; name: string; created: boolean }>; links: ScenarioNpcLink[]; records: Array<{ kind: 'pnj'; item: Record<string, unknown> }> }> {
    const seen = new Set<string>()
    const items: Array<{ id: string; name: string; created: boolean }> = []
    const links: ScenarioNpcLink[] = []
    const records: Array<{ kind: 'pnj'; item: Record<string, unknown> }> = []
    for (const definition of definitions) {
      if (!definition || typeof definition !== 'object') throw new Error('Chaque PNJ doit être un objet.')
      const key = this.id(definition.key, 'npcs[].key')
      let npcId = typeof definition.npcId === 'string' && definition.npcId.trim() ? definition.npcId.trim() : ''
      let pnj = npcId ? await this.persistence.getRecord('pnj', npcId) : null
      let created = false
      if (npcId && !pnj) throw new Error(`PNJ inconnu : ${npcId}.`) 
      if (!pnj) {
        npcId = `${scenarioId}--${key}`
        pnj = await this.persistence.getRecord('pnj', npcId)
        if (!pnj) {
          const nom = this.text(definition.name, `npcs[${key}].name`)
          const portrait = await this.materializePortrait(zip, definition.portrait, npcId)
          pnj = { id: npcId, nom, description: typeof definition.description === 'string' ? definition.description.trim() : '', aliases: this.strings(definition.aliases), portrait: portrait ?? undefined, factions: [], tags: [], role: typeof definition.role === 'string' ? definition.role.trim() : '', importance: typeof definition.importance === 'string' ? definition.importance.trim() : 'Secondaire', statut: 'Actif', notes: typeof definition.notes === 'string' ? definition.notes.trim() : '', scope: 'scenario', ownerScenarioId: scenarioId }
          records.push({ kind: 'pnj', item: pnj })
          created = true
        }
      }
      if (seen.has(npcId)) throw new Error(`PNJ dupliqué dans le package : ${npcId}.`)
      seen.add(npcId)
      items.push({ id: npcId, name: String(pnj.nom ?? npcId), created })
      links.push({ scenarioId, npcId, role: this.optional(definition.role), importance: this.optional(definition.importance), sourcePage: this.optional(definition.sourcePage), notes: this.optional(definition.notes) })
    }
    return { items, links, records }
  }

  private async resolveRelations(scenarioId: string, manifest: ScenarioManifest): Promise<{ links: ScenarioRelation[]; records: Array<{ kind: ScenarioRelationTargetKind; item: Record<string, unknown> }> }> {
    const definitions: Array<{ kind: ScenarioRelationTargetKind; values: PackageRelation[] }> = [
      { kind: 'lieu', values: (manifest.places ?? []) as PackageRelation[] },
      { kind: 'faction', values: (manifest.factions ?? []) as PackageRelation[] },
      { kind: 'evenement', values: (manifest.events ?? []) as PackageRelation[] }
    ]
    const output: ScenarioRelation[] = []
    const records: Array<{ kind: ScenarioRelationTargetKind; item: Record<string, unknown> }> = []
    const seen = new Set<string>()
    for (const group of definitions) for (const definition of group.values) {
      if (!definition || typeof definition !== 'object') throw new Error(`Chaque ${group.kind} doit être un objet.`)
      const kind = group.kind === 'lieu' && definition.kind === 'region' ? 'region' : group.kind
      if (group.kind === 'lieu' && definition.kind !== undefined && definition.kind !== 'lieu' && definition.kind !== 'region') throw new Error('places[].kind doit être lieu ou region.')
      if (group.kind !== 'lieu' && definition.kind !== undefined && definition.kind !== group.kind) throw new Error(`kind invalide pour ${group.kind}.`)
      const key = this.id(definition.key, `${group.kind}[].key`)
      const reference = kind === 'faction' ? definition.factionId : kind === 'evenement' ? definition.eventId : definition.refId
      let id = typeof reference === 'string' && reference.trim() ? reference.trim() : ''
      let record = id ? await this.persistence.getRecord(kind, id) : null
      if (id && !record) throw new Error(`${kind} inconnu : ${id}.`)
      if (!record) {
        id = `${scenarioId}--${key}`
        record = await this.persistence.getRecord(kind, id)
        if (!record) {
          const raw = definition as Record<string, unknown>
          const ignored = new Set(['key', 'kind', 'refId', 'factionId', 'eventId', 'role', 'importance', 'sourcePage', 'notes', 'name'])
          record = { ...Object.fromEntries(Object.entries(raw).filter(([field]) => !ignored.has(field))), id, nom: this.text(definition.name, `${group.kind}[${key}].name`), aliases: this.strings(definition.aliases), description: this.optional(definition.description) ?? '', notes: this.optional(definition.notes) ?? '', scope: 'scenario', ownerScenarioId: scenarioId }
          records.push({ kind, item: record })
        }
      }
      const identity = `${kind}:${id}`
      if (seen.has(identity)) throw new Error(`Relation dupliquée : ${identity}.`)
      seen.add(identity)
      output.push({ scenarioId, targetKind: kind, targetId: id, role: this.optional(definition.role), importance: this.optional(definition.importance), sourcePage: this.optional(definition.sourcePage), notes: this.optional(definition.notes) })
    }
    return { links: output, records }
  }

  private id(value: unknown, label: string): string { const text = this.text(value, label); if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(text)) throw new Error(`${label} doit être un identifiant stable sans espace.`); return text }
  private text(value: unknown, label: string): string { if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} est obligatoire.`); return value.trim() }
  private optional(value: unknown): string | null { return typeof value === 'string' && value.trim() ? value.trim() : null }
  private strings(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map(item => item.trim()) : [] }
  private version(value: unknown): number { if (!Number.isInteger(value) || Number(value) < 1) throw new Error('packageVersion doit être un entier positif.'); return Number(value) }
  private cleanPath(value: string): string { return value.replace(/\\/g, '/').replace(/^\.\//, '') }
  private safeSegment(value: string): string { return value.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-|-$/g, '') }
  private packagePath(scenarioId: string, version: number): string { return resolve(this.persistence.storageRoot, 'documents', 'scenario-packages', this.safeSegment(scenarioId), `v${version}.zip`) }
  private async materializePortrait(zip: AdmZip, value: unknown, npcId: string): Promise<string | null> {
    if (typeof value !== 'string' || !value.trim()) return null
    const path = this.cleanPath(value)
    if (!path.startsWith('assets/') || path.includes('..')) throw new Error(`Portrait PNJ invalide : ${value}`)
    const entry = zip.getEntries().find(item => this.cleanPath(item.entryName) === path)
    if (!entry || entry.isDirectory) throw new Error(`Portrait PNJ absent du ZIP : ${value}`)
    const bytes = entry.getData()
    if (!bytes.byteLength || bytes.byteLength > 10 * 1024 * 1024) throw new Error(`Portrait PNJ invalide ou trop volumineux : ${value}`)
    const filename = `${this.safeSegment(npcId)}.webp`
    const root = resolve(process.env['FOUNDRY_ASSETS_ROOT'] ?? '../../FoundryVTT/Data/assets/l7r', 'portraits', 'pnj')
    await mkdir(root, { recursive: true })
    await writeFile(resolve(root, filename), await sharp(bytes).rotate().webp({ quality: 88 }).toBuffer())
    return `assets/l7r/portraits/pnj/${filename}`
  }
}
