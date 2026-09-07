import AdmZip from 'adm-zip'
import { Injectable, Optional } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import sharp from 'sharp'
import { Pf2PersistenceService, ScenarioDependency, ScenarioDependencyType, ScenarioDeployment, ScenarioDeploymentEnqueueOptions, ScenarioNpcLink, ScenarioRelation, ScenarioRelationTargetKind } from '../pf2-storage/Pf2PersistenceService'
import { FoundryReferenceLibraryService } from './FoundryReferenceLibraryService'

type PackageNpc = { key?: unknown; npcId?: unknown; name?: unknown; aliases?: unknown; description?: unknown; portrait?: unknown; role?: unknown; roleplay?: unknown; importance?: unknown; sourcePage?: unknown; notes?: unknown }
type PackageRelation = { key?: unknown; kind?: unknown; refId?: unknown; factionId?: unknown; eventId?: unknown; name?: unknown; aliases?: unknown; description?: unknown; role?: unknown; importance?: unknown; sourcePage?: unknown; notes?: unknown }
type ScenarioManifest = { packageFormatVersion?: unknown; packageVersion?: unknown; scenario?: { id?: unknown; name?: unknown }; npcs?: unknown; places?: unknown; factions?: unknown; events?: unknown; actors?: unknown; maps?: unknown; [key: string]: unknown }
type ScenarioImportOptions = { preserveExistingBusinessLinks?: boolean }

@Injectable()
export class ScenarioPackageService {
  constructor(private readonly persistence: Pf2PersistenceService, @Optional() private readonly referenceLibrary?: FoundryReferenceLibraryService) {}

  async importZip(bytes: Buffer, originalName: string, options: ScenarioImportOptions = {}): Promise<{ scenarioId: string; packageVersion: number; state: 'integrated' | 'unchanged' | 'updated'; npcs: Array<{ id: string; name: string; created: boolean }> }> {
    const inspected = this.inspectZip(bytes)
    const { zip, manifest, scenarioId, packageVersion } = inspected
    this.validateManifestArrays(manifest)
    if (this.referenceLibrary) await this.referenceLibrary.assertActorReferences(manifest as Record<string, unknown>)
    const existing = await this.persistence.getScenarioPackage(scenarioId)
    if (existing && existing.packageVersion > packageVersion) throw new Error(`Une version plus récente (${existing.packageVersion}) est déjà intégrée.`)
    const npcs = await this.resolveNpcs(scenarioId, (manifest.npcs ?? []) as PackageNpc[], zip)
    const relations = await this.resolveRelations(scenarioId, manifest)
    let npcLinks = npcs.links
    let relationLinks = relations.links
    if (options.preserveExistingBusinessLinks) {
      const [existingNpcLinks, existingRelations] = await Promise.all([
        this.persistence.listScenarioNpcLinks(scenarioId),
        this.persistence.listScenarioRelations(scenarioId)
      ])
      npcLinks = this.mergeNpcLinks(existingNpcLinks, npcLinks)
      relationLinks = this.mergeRelations(existingRelations, relationLinks, manifest)
    }
    const state: 'integrated' | 'unchanged' | 'updated' = existing?.packageVersion === packageVersion ? 'unchanged' : existing ? 'updated' : 'integrated'
    const packageDir = resolve(this.persistence.storageRoot, 'documents', 'scenario-packages', this.safeSegment(scenarioId))
    await mkdir(packageDir, { recursive: true })
    await writeFile(resolve(packageDir, `v${packageVersion}.zip`), bytes)
    await this.persistence.importScenarioPackageAtomically({
      records: [...npcs.records, ...relations.records], npcLinks, relations: relationLinks,
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
    this.validateManifestArrays(manifest)
    this.validatePackageFormat(manifest)
    const scenarioId = this.id(manifest.scenario?.id, 'scenario.id')
    const scenarioName = this.text(manifest.scenario?.name, 'scenario.name')
    const packageVersion = manifest.packageVersion === undefined ? 1 : this.version(manifest.packageVersion)
    return { zip, manifest, scenarioId, packageVersion, scenarioName }
  }

  async packageForScenario(scenarioId: string): Promise<unknown> { return this.persistence.getScenarioPackage(scenarioId) }
  async requestDeployment(scenarioId: string, options: ScenarioDeploymentEnqueueOptions = {}): Promise<ScenarioDeployment> {
    const packageStatus = await this.persistence.getScenarioPackage(scenarioId)
    if (!packageStatus) throw new Error('Ce scénario ne possède aucun package intégré.')
    const path = this.packagePath(scenarioId, packageStatus.packageVersion)
    try { if (!(await stat(path)).isFile()) throw new Error('missing') } catch { throw new Error(`Le ZIP intégré v${packageStatus.packageVersion} est introuvable dans le stockage.`) }
    return this.persistence.enqueueScenarioDeployment(scenarioId, packageStatus.packageVersion, options)
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
    const result = { deploymentId: deployment.id, scenarioId: deployment.scenarioId, packageVersion: deployment.packageVersion, success: input.success, actors: object(input.actors), scenes: object(input.scenes), journals: object(input.journals), reset: object(input.reset), errors: Array.isArray(input.errors) ? input.errors.map(String) : [], ...(typeof input.error === 'string' ? { error: input.error } : {}) }
    const finished = await this.persistence.finishScenarioDeployment(deployment.id, typeof input.claimToken === 'string' ? input.claimToken : '', result)
    if (finished.operation === 'reset' && finished.status === 'success' && finished.payload?.cleanupApp === true) {
      const resetScopeIds = Array.isArray(finished.payload.resetScopeIds) ? finished.payload.resetScopeIds.map(String) : [finished.scenarioId]
      await this.resetApplicationScenario(finished.scenarioId, resetScopeIds)
    }
    return finished
  }

  async requestReset(scenarioId: string, payload: Record<string, unknown>, batchId: string, batchSequence: number): Promise<ScenarioDeployment> {
    return this.persistence.enqueueScenarioDeployment(scenarioId, 0, { operation: 'reset', payload, batchId, batchSequence })
  }

  async resetApplicationScenario(scenarioId: string, resetScopeIds: string[] = [scenarioId], deleteDeploymentHistory = true): Promise<unknown> {
    const result = await this.persistence.resetScenarioApplicationState(scenarioId, resetScopeIds, deleteDeploymentHistory)
    await rm(resolve(this.persistence.storageRoot, 'documents', 'scenario-packages', this.safeSegment(scenarioId)), { recursive: true, force: true })
    return result
  }

  // PF2_SCENARIO_RESET_V1
  async scenarioResetPreview(scenarioId: string): Promise<{
    scenarioId: string
    name: string
    confirmationText: string
    application: unknown
    foundryKnown: { version: number | null; actors: number; scenes: number; journals: number; state: 'present' | 'reset' | 'unknown'; note: string }
    preserveNpcIds: string[]
  }> {
    const [entry, application, preserveNpcIds, latestDeployment, lastSuccessfulDeploy] = await Promise.all([
      this.persistence.getCatalogueEntity(scenarioId),
      this.persistence.previewScenarioApplicationReset([scenarioId]),
      this.persistence.sharedNpcIdsForScenarioReset([scenarioId], [scenarioId]),
      this.persistence.getLatestScenarioDeployment(scenarioId),
      this.persistence.getLatestSuccessfulScenarioDeployment(scenarioId)
    ])

    const nameCandidate = entry
      ? [entry.titleFr, entry.title, entry.name, entry.titleOriginal, scenarioId].find((value) => typeof value === 'string' && value.trim())
      : scenarioId
    const name = typeof nameCandidate === 'string' && nameCandidate.trim() ? nameCandidate.trim() : scenarioId

    const resetCompletedAfterDeploy =
      latestDeployment?.operation === 'reset' &&
      latestDeployment.status === 'success' &&
      (
        !lastSuccessfulDeploy?.completedAt ||
        !latestDeployment.completedAt ||
        latestDeployment.completedAt >= lastSuccessfulDeploy.completedAt
      )

    const result = resetCompletedAfterDeploy ? null : lastSuccessfulDeploy?.result
    const countSection = (field: 'actors' | 'scenes'): number => {
      const section = result?.[field]
      if (!section || typeof section !== 'object') return 0
      const total = (section as Record<string, unknown>).total
      return typeof total === 'number' && Number.isFinite(total) ? total : 0
    }
    const journalSection = result?.journals
    const journals =
      journalSection && typeof journalSection === 'object' &&
      (journalSection as Record<string, unknown>).imported === true
        ? 1
        : 0

    const version = resetCompletedAfterDeploy ? null : lastSuccessfulDeploy?.packageVersion ?? null
    const state: 'present' | 'reset' | 'unknown' =
      resetCompletedAfterDeploy ? 'reset' : version !== null ? 'present' : 'unknown'

    return {
      scenarioId,
      name,
      confirmationText: `Réinitialiser ${name}`,
      application,
      foundryKnown: {
        version,
        actors: resetCompletedAfterDeploy ? 0 : countSection('actors'),
        scenes: resetCompletedAfterDeploy ? 0 : countSection('scenes'),
        journals: resetCompletedAfterDeploy ? 0 : journals,
        state,
        note: resetCompletedAfterDeploy
          ? 'Le dernier état connu indique que ce scénario a été retiré de Foundry.'
          : 'Comptage issu du dernier déploiement réussi ; le reset Foundry recomptera les documents réellement présents.'
      },
      preserveNpcIds
    }
  }

  async resetScenario(scenarioId: string, body: unknown): Promise<Record<string, unknown>> {
    const input = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {}
    const mode = String(input.mode ?? '')
    if (!['app', 'foundry', 'all'].includes(mode)) throw new Error('Mode de reset invalide.')

    const preview = await this.scenarioResetPreview(scenarioId)
    if (input.confirm !== preview.confirmationText) {
      throw new Error(`Confirmation invalide. Tape exactement : ${preview.confirmationText}`)
    }

    if (mode === 'app') {
      const result = await this.resetApplicationScenario(scenarioId, [scenarioId], false)
      return { scenarioId, mode, state: 'done', result }
    }

    const batchId = randomUUID()
    const deployment = await this.requestReset(
      scenarioId,
      {
        cleanupApp: mode === 'all',
        preserveNpcIds: preview.preserveNpcIds,
        resetScopeIds: [scenarioId]
      },
      batchId,
      1
    )

    return {
      scenarioId,
      mode,
      batchId,
      state: 'queued',
      deployment
    }
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
  async scenarioRegistry(): Promise<Array<{ id: string; name: string; parentId: string | null; kind: string | null; order: number | null }>> {
    const entries = await this.persistence.listCatalogueEntries()

    const playablePartKinds = new Set([
      'volume_aventure',
      'aventure_autonome',
      'one_shot',
      'aventure_communautaire'
    ])

    const output: Array<{
      id: string
      name: string
      parentId: string | null
      kind: string | null
      order: number | null
    }> = []

    const add = (
      value: Record<string, unknown>,
      parentId: string | null,
      fallbackOrder: number | null
    ) => {
      const id =
        typeof value.id === 'string'
          ? value.id.trim()
          : ''

      if (!id) return

      const title = [
        value.titleFr,
        value.title,
        value.name,
        value.titleOriginal
      ].find(
        candidate =>
          typeof candidate === 'string' &&
          candidate.trim()
      ) as string | undefined

      const rawOrder =
        typeof value.sequence === 'number'
          ? value.sequence
          : typeof value.number === 'number'
            ? value.number
            : fallbackOrder

      output.push({
        id,
        name: title?.trim() || id,
        parentId,
        kind:
          typeof value.kind === 'string'
            ? value.kind
            : null,
        order:
          typeof rawOrder === 'number' &&
          Number.isFinite(rawOrder)
            ? rawOrder
            : null
      })
    }

    for (const [entryIndex, entry] of entries.entries()) {
      if (entry.kind === 'campaign') {
        if (!Array.isArray(entry.parts)) continue

        for (const [partIndex, rawPart] of entry.parts.entries()) {
          if (
            !rawPart ||
            typeof rawPart !== 'object' ||
            Array.isArray(rawPart)
          ) continue

          const part = rawPart as Record<string, unknown>

          if (
            typeof part.kind !== 'string' ||
            !playablePartKinds.has(part.kind)
          ) continue

          add(
            part,
            typeof entry.id === 'string'
              ? entry.id
              : null,
            partIndex + 1
          )
        }

        continue
      }

      // Le frontend considère actuellement toutes les entrées
      // hors campaign comme des unités jouables.
      add(
        entry,
        typeof entry.collectionId === 'string'
          ? entry.collectionId
          : null,
        entryIndex + 1
      )
    }

    return [
      ...new Map(
        output.map(item => [item.id, item])
      ).values()
    ]
  }

  async dependenciesForScenario(scenarioId: string): Promise<{ dependencies: unknown[]; dependents: unknown[] }> {
    const [dependencies, dependents, registry] = await Promise.all([
      this.persistence.listScenarioDependencies(scenarioId),
      this.persistence.listScenarioDependents(scenarioId),
      this.scenarioRegistry()
    ])
    const byId = new Map(registry.map(item => [item.id, item]))
    return {
      dependencies: dependencies.map(link => ({ ...link, scenario: byId.get(link.dependsOnScenarioId) ?? { id: link.dependsOnScenarioId, name: link.dependsOnScenarioId } })),
      dependents: dependents.map(link => ({ ...link, scenario: byId.get(link.scenarioId) ?? { id: link.scenarioId, name: link.scenarioId } }))
    }
  }

  async replaceDependenciesForScenario(scenarioId: string, value: unknown): Promise<{ dependencies: unknown[]; dependents: unknown[] }> {
    if (!Array.isArray(value)) throw new Error('Le corps doit être un tableau de dépendances.')
    const registry = await this.scenarioRegistry()
    const known = new Set(registry.map(item => item.id))
    if (!known.has(scenarioId)) throw new Error(`Scénario inconnu : ${scenarioId}.`)
    const links: ScenarioDependency[] = value.map((raw, index) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`Dépendance ${index + 1} invalide.`)
      const item = raw as Record<string, unknown>
      const dependsOnScenarioId = typeof item.dependsOnScenarioId === 'string' ? item.dependsOnScenarioId.trim() : ''
      if (!dependsOnScenarioId || !known.has(dependsOnScenarioId)) throw new Error(`Scénario dépendance inconnu : ${dependsOnScenarioId || '(vide)'}.`)
      const relationType = item.relationType
      if (relationType !== 'required' && relationType !== 'recommended') throw new Error('relationType doit être required ou recommended.')
      const optional = (candidate: unknown) => typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null
      return {
        scenarioId,
        dependsOnScenarioId,
        relationType: relationType as ScenarioDependencyType,
        source: optional(item.source),
        sourcePage: optional(item.sourcePage),
        notes: optional(item.notes)
      }
    })
    const duplicate = links.find((link, index) => links.findIndex(other => other.dependsOnScenarioId === link.dependsOnScenarioId) !== index)
    if (duplicate) throw new Error(`Dépendance dupliquée : ${duplicate.dependsOnScenarioId}.`)
    await this.persistence.replaceScenarioDependencies(scenarioId, links)
    return this.dependenciesForScenario(scenarioId)
  }

  // PF2_AI_CONTEXT_AND_PREFLIGHT_V6
  async packageRegistry(includeExcluded = false): Promise<Record<string, unknown[]>> {
    const compact = (kind: ScenarioRelationTargetKind | 'pnj') => this.persistence.listRecords(kind, { includeExcluded }).then(records => records.map(record => ({ id: record.id, name: record.nom ?? record.name ?? record.title ?? record.id, aliases: Array.isArray(record.aliases) ? record.aliases : [], ...(kind === 'pnj' ? {
      description: typeof record.description === 'string' ? record.description : '',
      role: typeof record.role === 'string' ? record.role : '',
      roleplay: typeof record.roleplay === 'string' ? record.roleplay : '',
      tags: Array.isArray(record.tags)
        ? record.tags.filter((tag): tag is string => typeof tag === 'string' && Boolean(tag.trim()))
        : [],
      importance: typeof record.importance === 'string' ? record.importance : '',
      statut: typeof record.statut === 'string' ? record.statut : ''
    } : {}), ...(kind === 'lieu' || kind === 'region' ? { kind } : {}) })))
    const [npcs, lieu, region, factions, events] = await Promise.all([compact('pnj'), compact('lieu'), compact('region'), compact('faction'), compact('evenement')])
    return { npcs, places: [...lieu, ...region], factions, events }
  }
  async scenarioExport(scenarioId: string): Promise<Record<string, unknown>> {
    return {
      scenario: (await this.persistence.getCatalogueEntity(scenarioId)) ?? (await this.persistence.getRecord('scenario', scenarioId)) ?? { id: scenarioId },
      ...(await this.relationsForScenario(scenarioId)),
      scenarioDependencies: await this.dependenciesForScenario(scenarioId)
    }
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
          pnj = { id: npcId, nom, description: typeof definition.description === 'string' ? definition.description.trim() : '', aliases: this.strings(definition.aliases), portrait: portrait ?? undefined, factions: [], tags: [], role: typeof definition.role === 'string' ? definition.role.trim() : '', roleplay: typeof definition.roleplay === 'string' ? definition.roleplay.trim() : '', importance: typeof definition.importance === 'string' ? definition.importance.trim() : 'Secondaire', statut: 'Actif', notes: typeof definition.notes === 'string' ? definition.notes.trim() : '', scope: 'scenario', ownerScenarioId: scenarioId }
          records.push({ kind: 'pnj', item: pnj })
          created = true
        }
      }
      const incomingRoleplay = this.optional(definition.roleplay)
      const currentRoleplay = typeof pnj.roleplay === 'string' && pnj.roleplay.trim() ? pnj.roleplay.trim() : null
      if (!created && !currentRoleplay && incomingRoleplay) {
        pnj = { ...pnj, roleplay: incomingRoleplay }
        records.push({ kind: 'pnj', item: pnj })
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

  private validateManifestArrays(manifest: ScenarioManifest): void {
    if (manifest.npcs !== undefined && !Array.isArray(manifest.npcs)) throw new Error('npcs doit être un tableau.')
    if (manifest.places !== undefined && !Array.isArray(manifest.places)) throw new Error('places doit être un tableau.')
    if (manifest.factions !== undefined && !Array.isArray(manifest.factions)) throw new Error('factions doit être un tableau.')
    if (manifest.events !== undefined && !Array.isArray(manifest.events)) throw new Error('events doit être un tableau.')
    if (manifest.actors !== undefined && !Array.isArray(manifest.actors)) throw new Error('actors doit être un tableau.')
    if (manifest.maps !== undefined && !Array.isArray(manifest.maps)) throw new Error('maps doit être un tableau.')
  }

  private validatePackageFormat(manifest: ScenarioManifest): void {
    if (manifest.packageFormatVersion === undefined) return // packages historiques : validation legacy
    if (!Number.isInteger(manifest.packageFormatVersion) || Number(manifest.packageFormatVersion) < 1) throw new Error('packageFormatVersion doit être un entier positif.')
    if (Number(manifest.packageFormatVersion) < 4) return

    const errors: string[] = []
    const object = (value: unknown): Record<string, any> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
    const finite = (value: unknown): boolean => Number.isFinite(Number(value))
    const positive = (value: unknown): boolean => finite(value) && Number(value) > 0
    const positiveInteger = (value: unknown): boolean => Number.isInteger(Number(value)) && Number(value) > 0
    const nonEmpty = (value: unknown): boolean => typeof value === 'string' && Boolean(value.trim())

    if (!Array.isArray(manifest.actors)) errors.push('actors doit être présent et être un tableau en format v4.')

    const validateCustom = (raw: unknown, prefix: string): void => {
      const definition = object(raw)
      const data = object(definition.data)
      if (data.mode !== 'statblock' && data.mode !== 'narrative') {
        errors.push(`${prefix}.data.mode doit valoir statblock ou narrative.`)
        return
      }
      if (data.mode === 'narrative') return

      if (!finite(data.level)) errors.push(`${prefix}.data.level est obligatoire pour un statblock.`)
      if (!positive(data.ac)) errors.push(`${prefix}.data.ac est obligatoire et doit être positif.`)
      if (!positive(data.hp)) errors.push(`${prefix}.data.hp est obligatoire et doit être positif.`)
      if (!finite(data.perception)) errors.push(`${prefix}.data.perception est obligatoire.`)
      const speed = typeof data.speed === 'object' && data.speed !== null ? object(data.speed).land : data.speed
      if (!finite(speed) || Number(speed) < 0) errors.push(`${prefix}.data.speed (ou speed.land) est obligatoire et doit être >= 0.`)

      const saves = object(data.saves)
      for (const save of ['fortitude', 'reflex', 'will']) if (!finite(saves[save])) errors.push(`${prefix}.data.saves.${save} est obligatoire.`)
      if (!data.skills || typeof data.skills !== 'object' || Array.isArray(data.skills)) errors.push(`${prefix}.data.skills doit être un objet, même vide.`)

      const attacks = Array.isArray(data.attacks) ? data.attacks : []
      for (const [index, rawAttack] of attacks.entries()) {
        const attack = object(rawAttack)
        const attackPrefix = `${prefix}.data.attacks[${index}]`
        if (!nonEmpty(attack.name)) errors.push(`${attackPrefix}.name est manquant.`)
        if (!finite(attack.bonus)) errors.push(`${attackPrefix}.bonus est manquant.`)
        if (!Array.isArray(attack.damage) || !attack.damage.length) errors.push(`${attackPrefix}.damage doit contenir au moins une ligne de dégâts.`)
        else for (const [damageIndex, rawDamage] of attack.damage.entries()) {
          const damage = object(rawDamage)
          if (!nonEmpty(damage.formula)) errors.push(`${attackPrefix}.damage[${damageIndex}].formula est manquant.`)
          if (!nonEmpty(damage.type ?? damage.damageType)) errors.push(`${attackPrefix}.damage[${damageIndex}].type est manquant.`)
        }
      }

      const abilities = Array.isArray(data.abilities) ? data.abilities : []
      for (const [index, rawAbility] of abilities.entries()) {
        const ability = object(rawAbility)
        const abilityPrefix = `${prefix}.data.abilities[${index}]`
        if (!nonEmpty(ability.name)) errors.push(`${abilityPrefix}.name est manquant.`)
        if (!nonEmpty(ability.description)) errors.push(`${abilityPrefix}.description est manquant.`)
      }

      if (!attacks.length && !abilities.length && !(Array.isArray(data.items) && data.items.length)) {
        errors.push(`${prefix} est un statblock mais ne contient ni attaque, ni capacité, ni item PF2. Un simple niveau/CA/PV n'est pas accepté.`)
      }
    }

    const validateActor = (raw: unknown, prefix: string, inherited: { key?: unknown; name?: unknown } = {}): void => {
      const definition = object(raw)
      if (!inherited.key && !nonEmpty(definition.key)) errors.push(`${prefix}.key est manquant.`)
      if (!inherited.name && !nonEmpty(definition.name)) errors.push(`${prefix}.name est manquant.`)
      if (definition.type === 'reference') {
        if (!nonEmpty(definition.uuid) && !nonEmpty(definition.lookup)) errors.push(`${prefix} doit avoir uuid ou lookup.`)
        return
      }
      if (definition.type === 'custom') {
        validateCustom(definition, prefix)
        return
      }
      if (definition.type === 'narrative') {
        if (!nonEmpty(definition.npcId)) errors.push(`${prefix}.npcId est manquant.`)
        const nested = object(definition.actor)
        if (nested.type !== 'reference' && nested.type !== 'custom') errors.push(`${prefix}.actor doit être une définition reference ou custom.`)
        else validateActor(nested, `${prefix}.actor`, { key: definition.key, name: definition.name })
        return
      }
      errors.push(`${prefix}.type doit valoir reference, custom ou narrative.`)
    }

    for (const [index, actor] of (Array.isArray(manifest.actors) ? manifest.actors : []).entries()) validateActor(actor, `actors[${index}]`)

    for (const [index, rawMap] of (Array.isArray(manifest.maps) ? manifest.maps : []).entries()) {
      const map = object(rawMap)
      const grid = object(map.grid)
      const type = typeof grid.type === 'string' ? grid.type.toLowerCase() : 'square'
      if (type === 'gridless') continue
      const prefix = `maps[${index}].grid`
      if (!positiveInteger(grid.columns)) errors.push(`${prefix}.columns doit être un entier positif.`)
      if (!positiveInteger(grid.rows)) errors.push(`${prefix}.rows doit être un entier positif.`)
      if (grid.paddingCells !== 1) errors.push(`${prefix}.paddingCells doit valoir 1 : une case de marge de chaque côté.`)
      const bounds = object(grid.bounds)
      if (!finite(bounds.x)) errors.push(`${prefix}.bounds.x doit être numérique.`)
      if (!finite(bounds.y)) errors.push(`${prefix}.bounds.y doit être numérique.`)
      if (!positive(bounds.width)) errors.push(`${prefix}.bounds.width doit être positif.`)
      if (!positive(bounds.height)) errors.push(`${prefix}.bounds.height doit être positif.`)
      if (positiveInteger(grid.columns) && positiveInteger(grid.rows) && positive(bounds.width) && positive(bounds.height)) {
        const cellWidth = Number(bounds.width) / Number(grid.columns)
        const cellHeight = Number(bounds.height) / Number(grid.rows)
        const average = (cellWidth + cellHeight) / 2
        if (average > 0 && Math.abs(cellWidth - cellHeight) / average > 0.02) errors.push(`${prefix} décrit des cases non carrées (${cellWidth.toFixed(2)} × ${cellHeight.toFixed(2)} px).`)
      }
    }

    if (errors.length) throw new Error(`Package v4 invalide : ${errors.join(' | ')}`)
  }

  private mergeNpcLinks(existing: ScenarioNpcLink[], incoming: ScenarioNpcLink[]): ScenarioNpcLink[] {
    return [...new Map([...existing, ...incoming].map((link) => [link.npcId, link])).values()]
  }

  private mergeRelations(existing: ScenarioRelation[], incoming: ScenarioRelation[], manifest: ScenarioManifest): ScenarioRelation[] {
    const replacedKinds = new Set<ScenarioRelationTargetKind>([
      ...(manifest.places === undefined ? [] : ['lieu', 'region'] as ScenarioRelationTargetKind[]),
      ...(manifest.factions === undefined ? [] : ['faction'] as ScenarioRelationTargetKind[]),
      ...(manifest.events === undefined ? [] : ['evenement'] as ScenarioRelationTargetKind[])
    ])
    const preserved = existing.filter((link) => replacedKinds.has(link.targetKind))
    return [...new Map([...preserved, ...incoming].map((link) => [`${link.targetKind}:${link.targetId}`, link])).values()]
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
