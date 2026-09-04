import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { DataSource, EntityManager } from 'typeorm'

export type Pf2RecordKind = 'pnj' | 'faction' | 'lieu' | 'region' | 'evenement' | 'scenario' | 'session' | 'catalogue' | 'curation' | 'foundry-actor-cache' | 'geography-config'
export type FoundryActorCacheEntry = { uuid: string; name: string }
export type ScenarioNpcLink = { scenarioId: string; npcId: string; role: string | null; importance: string | null; sourcePage: string | null; notes: string | null }
export type ScenarioRelationTargetKind = 'lieu' | 'region' | 'faction' | 'evenement'
export type ScenarioRelation = { scenarioId: string; targetKind: ScenarioRelationTargetKind; targetId: string; role: string | null; importance: string | null; sourcePage: string | null; notes: string | null }
export type ScenarioPackageImport = { records: Array<{ kind: Pf2RecordKind; item: Record<string, unknown> }>; npcLinks: ScenarioNpcLink[]; relations: ScenarioRelation[]; replaceRelationKinds: ScenarioRelationTargetKind[]; package: Omit<ScenarioPackage, 'importedAt' | 'updatedAt' | 'deployedVersion' | 'deployedAt'> }
export type ScenarioPackage = { scenarioId: string; packageVersion: number; status: 'available' | 'integrated' | 'deployed' | 'obsolete'; filename: string; manifest: Record<string, unknown>; deployedVersion: number | null; deployedAt: string | null; importedAt: string; updatedAt: string }
export type ScenarioDeploymentStatus = 'pending' | 'claimed' | 'success' | 'failed'
export type ScenarioDeployment = { id: string; scenarioId: string; packageVersion: number; status: ScenarioDeploymentStatus; worldId: string | null; claimedBy: string | null; claimToken: string | null; leaseExpiresAt: string | null; error: string | null; result: Record<string, unknown> | null; createdAt: string; updatedAt: string; completedAt: string | null }

export type CatalogueEntityKind = 'meta' | 'section' | 'collection' | 'entry' | 'arc' | 'thread'
export type CatalogueEntity = { entityKind: CatalogueEntityKind; id: string; parentId: string | null; subtype: string | null; name: string | null; sortOrder: number; payload: Record<string, unknown> }
export type LibraryAsset = { id: string; path: string; filename: string; assetType: string; targetId: string | null; targetKind: string | null; role: string | null; language: string | null; variant: string | null; completeness: string | null; translationOf: string | null; associationStatus: string; associationScore: number | null; evidence: string[]; metadata: Record<string, unknown>; present: boolean; lastSeenAt: string | null; sortOrder: number }

const referenceFiles = {
  pnj: 'old/pf2_personnages.json',
  factions: 'old/pf2_factions.json',
  lieux: 'old/pf2_lieux.json',
  regions: 'old/pf2_regions.json',
  evenements: 'old/pf2_evenements.json'
} as const

type ReferenceKind = keyof typeof referenceFiles
type RecordRow = { id: string; name: string | null; payload: string }
type SessionRow = { id: string; session_number: number; date: string; title: string; participants: string; long_summary_author: string | null; short_summary_author: string | null; session_xp: number; long_summary_xp: number; short_summary_xp: number; long_summary_url: string; short_summary: string; discord_message_id: string | null; created_at: string; updated_at: string }
export type Pf2Session = { id: string; sessionNumber: number; date: string; title: string; participants: string[]; longSummaryAuthor: string | null; shortSummaryAuthor: string | null; sessionXp: number; longSummaryXp: number; shortSummaryXp: number; longSummaryUrl: string; shortSummary: string; discordMessageId: string | null; createdAt: string; updatedAt: string }
export type Pf2SessionInput = { id?: unknown; sessionNumber?: unknown; date?: unknown; title?: unknown; participants?: unknown; longSummaryAuthor?: unknown; shortSummaryAuthor?: unknown; sessionXp?: unknown; longSummaryXp?: unknown; shortSummaryXp?: unknown; longSummaryUrl?: unknown; shortSummary?: unknown }

@Injectable()
export class Pf2PersistenceService implements OnModuleInit {
  readonly storageRoot = resolve(process.env['STORAGE_PATH'] ?? 'storage')
  private readonly seedRoot = resolve(process.env['PF2_DATA_ROOT'] ?? 'apps/web-misc/src/pf2-mj/data')

  constructor(@InjectDataSource('pf2-sqlite') private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    await this.migrate()
    await this.ensureStorageDirectories()
    await this.seedCurrentData()
  }

  async health(): Promise<{ sqlite: true; database: string }> {
    await this.dataSource.query('SELECT 1')
    return { sqlite: true, database: this.dataSource.options.database as string }
  }

  async readReference(kind: ReferenceKind): Promise<Record<string, unknown>[]> {
    return this.list(kind === 'factions' ? 'faction' : kind === 'lieux' ? 'lieu' : kind === 'regions' ? 'region' : kind === 'evenements' ? 'evenement' : 'pnj')
  }

  async replaceReference(kind: ReferenceKind, items: Record<string, unknown>[]): Promise<void> {
    const recordKind = kind === 'factions' ? 'faction' : kind === 'lieux' ? 'lieu' : kind === 'regions' ? 'region' : kind === 'evenements' ? 'evenement' : 'pnj'
    await this.dataSource.transaction(async (manager) => {
      await manager.query('DELETE FROM pf2_record WHERE kind = ?', [recordKind])
      for (const item of items) await this.upsert(recordKind, this.identifier(item), this.name(item), item, manager)
    })
  }

  async readCuration(): Promise<Record<string, unknown>> {
    return (await this.get('curation', 'user-curation')) ?? {}
  }

  async saveCuration(value: Record<string, unknown>): Promise<void> {
    await this.upsert('curation', 'user-curation', 'user-curation', value)
  }

  async saveFoundryActorCache(actors: FoundryActorCacheEntry[]): Promise<void> {
    await this.upsert('foundry-actor-cache', 'latest', 'Derniers Actors Foundry', {
      actors,
      cachedAt: new Date().toISOString()
    })
  }

  async readFoundryActorCache(): Promise<FoundryActorCacheEntry[]> {
    const cached = await this.get('foundry-actor-cache', 'latest')
    const actors = cached?.actors
    if (!Array.isArray(actors)) return []

    return actors.flatMap((actor) => {
      if (!this.isObject(actor)) return []
      const uuid = typeof actor.uuid === 'string' ? actor.uuid : ''
      const name = typeof actor.name === 'string' ? actor.name : ''
      return uuid && name ? [{ uuid, name }] : []
    })
  }

  async listRecords(kind: Pf2RecordKind): Promise<Record<string, unknown>[]> { return this.list(kind) }
  async getRecord(kind: Pf2RecordKind, id: string): Promise<Record<string, unknown> | null> { return this.get(kind, id) }
  async saveRecord(kind: Pf2RecordKind, item: Record<string, unknown>): Promise<void> { await this.upsert(kind, this.identifier(item), this.name(item), item) }

  async replaceScenarioNpcLinks(scenarioId: string, links: ScenarioNpcLink[]): Promise<void> {
    await this.dataSource.transaction(async manager => {
      await manager.query('DELETE FROM pf2_scenario_npc WHERE scenario_id = ?', [scenarioId])
      for (const link of links) await manager.query(
        'INSERT INTO pf2_scenario_npc (scenario_id, npc_id, role, importance, source_page, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [scenarioId, link.npcId, link.role, link.importance, link.sourcePage, link.notes]
      )
    })
  }

  async listScenarioNpcLinks(scenarioId: string): Promise<ScenarioNpcLink[]> {
    return this.dataSource.query('SELECT scenario_id AS scenarioId, npc_id AS npcId, role, importance, source_page AS sourcePage, notes FROM pf2_scenario_npc WHERE scenario_id = ? ORDER BY importance DESC, npc_id', [scenarioId]) as Promise<ScenarioNpcLink[]>
  }

  async listNpcScenarioLinks(npcId: string): Promise<ScenarioNpcLink[]> {
    return this.dataSource.query('SELECT scenario_id AS scenarioId, npc_id AS npcId, role, importance, source_page AS sourcePage, notes FROM pf2_scenario_npc WHERE npc_id = ? ORDER BY scenario_id', [npcId]) as Promise<ScenarioNpcLink[]>
  }

  async replaceScenarioRelations(scenarioId: string, relations: ScenarioRelation[]): Promise<void> {
    await this.dataSource.transaction(async manager => {
      for (const relation of relations) {
        if (relation.scenarioId !== scenarioId) throw new Error('Relation de scénario incohérente.')
        const records = await manager.query('SELECT 1 FROM pf2_record WHERE kind = ? AND id = ?', [relation.targetKind, relation.targetId]) as Array<{ 1: number }>
        if (!records.length) throw new Error(`${relation.targetKind} inconnu : ${relation.targetId}.`)
      }
      await manager.query('DELETE FROM pf2_scenario_relation WHERE scenario_id = ?', [scenarioId])
      for (const relation of relations) await manager.query(
        'INSERT INTO pf2_scenario_relation (scenario_id, target_kind, target_id, role, importance, source_page, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [scenarioId, relation.targetKind, relation.targetId, relation.role, relation.importance, relation.sourcePage, relation.notes]
      )
    })
  }

  async importScenarioPackageAtomically(input: ScenarioPackageImport): Promise<void> {
    await this.dataSource.transaction(async manager => {
      for (const record of input.records) await this.upsert(record.kind, this.identifier(record.item), this.name(record.item), record.item, manager)
      for (const relation of input.relations) {
        const records = await manager.query('SELECT 1 FROM pf2_record WHERE kind = ? AND id = ?', [relation.targetKind, relation.targetId]) as Array<{ 1: number }>
        if (!records.length) throw new Error(`${relation.targetKind} inconnu : ${relation.targetId}.`)
      }
      await manager.query('DELETE FROM pf2_scenario_npc WHERE scenario_id = ?', [input.package.scenarioId])
      for (const link of input.npcLinks) await manager.query('INSERT INTO pf2_scenario_npc (scenario_id, npc_id, role, importance, source_page, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', [link.scenarioId, link.npcId, link.role, link.importance, link.sourcePage, link.notes])
      if (input.replaceRelationKinds.length) {
        await manager.query(`DELETE FROM pf2_scenario_relation WHERE scenario_id = ? AND target_kind IN (${input.replaceRelationKinds.map(() => '?').join(',')})`, [input.package.scenarioId, ...input.replaceRelationKinds])
        for (const relation of input.relations) await manager.query('INSERT INTO pf2_scenario_relation (scenario_id, target_kind, target_id, role, importance, source_page, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', [relation.scenarioId, relation.targetKind, relation.targetId, relation.role, relation.importance, relation.sourcePage, relation.notes])
      }
      await manager.query("INSERT INTO pf2_scenario_package (scenario_id, package_version, status, filename, manifest, imported_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(scenario_id) DO UPDATE SET package_version = excluded.package_version, status = CASE WHEN pf2_scenario_package.deployed_version IS NOT NULL AND pf2_scenario_package.deployed_version <> excluded.package_version THEN 'obsolete' ELSE excluded.status END, filename = excluded.filename, manifest = excluded.manifest, updated_at = CURRENT_TIMESTAMP", [input.package.scenarioId, input.package.packageVersion, input.package.status, input.package.filename, JSON.stringify(input.package.manifest)])
    })
  }

  async listScenarioRelations(scenarioId: string): Promise<ScenarioRelation[]> {
    return this.dataSource.query('SELECT scenario_id AS scenarioId, target_kind AS targetKind, target_id AS targetId, role, importance, source_page AS sourcePage, notes FROM pf2_scenario_relation WHERE scenario_id = ? ORDER BY target_kind, importance DESC, target_id', [scenarioId]) as Promise<ScenarioRelation[]>
  }

  async saveScenarioPackage(input: Omit<ScenarioPackage, 'importedAt' | 'updatedAt'>): Promise<void> {
    await this.dataSource.query(
      'INSERT INTO pf2_scenario_package (scenario_id, package_version, status, filename, manifest, deployed_version, deployed_at, imported_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(scenario_id) DO UPDATE SET package_version = excluded.package_version, status = excluded.status, filename = excluded.filename, manifest = excluded.manifest, deployed_version = excluded.deployed_version, deployed_at = excluded.deployed_at, updated_at = CURRENT_TIMESTAMP',
      [input.scenarioId, input.packageVersion, input.status, input.filename, JSON.stringify(input.manifest), input.deployedVersion, input.deployedAt]
    )
  }

  async getScenarioPackage(scenarioId: string): Promise<ScenarioPackage | null> {
    const rows = await this.dataSource.query('SELECT scenario_id, package_version, status, filename, manifest, deployed_version, deployed_at, imported_at, updated_at FROM pf2_scenario_package WHERE scenario_id = ?', [scenarioId]) as Array<{ scenario_id: string; package_version: number; status: ScenarioPackage['status']; filename: string; manifest: string; deployed_version: number | null; deployed_at: string | null; imported_at: string; updated_at: string }>
    const row = rows[0]
    return row ? { scenarioId: row.scenario_id, packageVersion: row.package_version, status: row.status, filename: row.filename, manifest: this.object(JSON.parse(row.manifest)), deployedVersion: row.deployed_version === null ? null : Number(row.deployed_version), deployedAt: row.deployed_at, importedAt: row.imported_at, updatedAt: row.updated_at } : null
  }

  async enqueueScenarioDeployment(scenarioId: string, packageVersion: number): Promise<ScenarioDeployment> {
    return this.dataSource.transaction(async (manager) => {
      const rows = await manager.query('SELECT * FROM pf2_scenario_deployment WHERE scenario_id = ? AND package_version = ?', [scenarioId, packageVersion]) as Array<Record<string, unknown>>
      const existing = rows[0]
      if (existing && String(existing.status) !== 'failed') return this.deployment(existing)
      if (existing) {
        await manager.query("UPDATE pf2_scenario_deployment SET status = 'pending', world_id = NULL, claimed_by = NULL, claim_token = NULL, lease_expires_at = NULL, error = NULL, result = NULL, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [existing.id])
        return this.deployment((await manager.query('SELECT * FROM pf2_scenario_deployment WHERE id = ?', [existing.id]) as Array<Record<string, unknown>>)[0])
      }
      const id = randomUUID()
      await manager.query("INSERT INTO pf2_scenario_deployment (id, scenario_id, package_version, status, created_at, updated_at) VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", [id, scenarioId, packageVersion])
      return this.deployment((await manager.query('SELECT * FROM pf2_scenario_deployment WHERE id = ?', [id]) as Array<Record<string, unknown>>)[0])
    })
  }

  async claimScenarioDeployment(worldId: string, claimedBy: string, leaseMs = 120_000): Promise<ScenarioDeployment | null> {
    const now = new Date().toISOString()
    await this.dataSource.query("UPDATE pf2_scenario_deployment SET status = 'pending', world_id = NULL, claimed_by = NULL, claim_token = NULL, lease_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE status = 'claimed' AND lease_expires_at IS NOT NULL AND lease_expires_at <= ?", [now])
    const token = randomUUID()
    const leaseExpiresAt = new Date(Date.now() + leaseMs).toISOString()
    // One UPDATE selects and claims the oldest pending row. The status guard
    // makes this safe when two GM clients poll the same SQLite database.
    await this.dataSource.query("UPDATE pf2_scenario_deployment SET status = 'claimed', world_id = ?, claimed_by = ?, claim_token = ?, lease_expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM pf2_scenario_deployment WHERE status = 'pending' ORDER BY created_at, id LIMIT 1) AND status = 'pending'", [worldId, claimedBy, token, leaseExpiresAt])
    const rows = await this.dataSource.query('SELECT * FROM pf2_scenario_deployment WHERE claim_token = ?', [token]) as Array<Record<string, unknown>>
    return rows[0] ? this.deployment(rows[0]) : null
  }

  async getScenarioDeployment(id: string): Promise<ScenarioDeployment | null> {
    const rows = await this.dataSource.query('SELECT * FROM pf2_scenario_deployment WHERE id = ?', [id]) as Array<Record<string, unknown>>
    return rows[0] ? this.deployment(rows[0]) : null
  }

  async finishScenarioDeployment(id: string, claimToken: string, result: Record<string, unknown>): Promise<ScenarioDeployment> {
    return this.dataSource.transaction(async (manager) => {
      const row = (await manager.query('SELECT * FROM pf2_scenario_deployment WHERE id = ?', [id]) as Array<Record<string, unknown>>)[0]
      if (!row || String(row.status) !== 'claimed' || String(row.claim_token) !== claimToken) throw new Error('Demande de déploiement introuvable ou lease expiré.')
      const success = result.success === true
      const error = success ? null : this.deploymentError(result)
      await manager.query("UPDATE pf2_scenario_deployment SET status = ?, error = ?, result = ?, completed_at = CURRENT_TIMESTAMP, lease_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [success ? 'success' : 'failed', error, JSON.stringify(result), id])
      if (success) await manager.query("UPDATE pf2_scenario_package SET deployed_version = ?, deployed_at = CURRENT_TIMESTAMP, status = CASE WHEN package_version = ? THEN 'deployed' ELSE 'obsolete' END, updated_at = CURRENT_TIMESTAMP WHERE scenario_id = ?", [Number(row.package_version), Number(row.package_version), String(row.scenario_id)])
      return this.deployment((await manager.query('SELECT * FROM pf2_scenario_deployment WHERE id = ?', [id]) as Array<Record<string, unknown>>)[0])
    })
  }

  async catalogueEntityCount(): Promise<number> {
    const rows = await this.dataSource.query('SELECT COUNT(*) AS count FROM pf2_catalogue_entity') as Array<{ count: number }>
    return Number(rows[0]?.count ?? 0)
  }

  async readCatalogueSnapshot(): Promise<Record<string, unknown>> {
    const rows = await this.dataSource.query('SELECT entity_kind, id, parent_id, subtype, name, sort_order, payload FROM pf2_catalogue_entity ORDER BY entity_kind, sort_order, id') as Array<{ entity_kind: CatalogueEntityKind; id: string; parent_id: string | null; subtype: string | null; name: string | null; sort_order: number; payload: string }>
    const metaRow = rows.find((row) => row.entity_kind === 'meta' && row.id === 'canonical')
    const metaPayload = metaRow ? this.object(JSON.parse(metaRow.payload)) : {}
    const byKind = (kind: CatalogueEntityKind) => rows.filter((row) => row.entity_kind === kind).sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id)).map((row) => this.object(JSON.parse(row.payload)))
    const assets = (await this.listLibraryAssets()).filter((asset) => asset.assetType !== 'zip')
    return {
      ...this.object(metaPayload.extras),
      schemaVersion: Number(metaPayload.schemaVersion ?? 2),
      meta: this.object(metaPayload.meta),
      files: assets.map((asset) => this.assetToCatalogueFile(asset)),
      entries: byKind('entry'),
      collections: byKind('collection'),
      arcs: byKind('arc'),
      sections: byKind('section'),
      narrativeThreads: byKind('thread'),
      ...(metaPayload.reconciliation ? { reconciliation: metaPayload.reconciliation } : {})
    }
  }

  async replaceCatalogueSnapshot(value: Record<string, unknown>): Promise<void> {
    const snapshot = this.object(value)
    const rows: CatalogueEntity[] = []
    const push = (entityKind: CatalogueEntityKind, raw: unknown, index: number, parentId: string | null = null, subtype: string | null = null) => {
      if (!this.isObject(raw)) return
      const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `${entityKind}-${index + 1}`
      const name = this.catalogueEntityName(raw)
      rows.push({ entityKind, id, parentId, subtype, name, sortOrder: index, payload: raw })
    }
    const managedKeys = new Set(['schemaVersion', 'meta', 'files', 'entries', 'collections', 'arcs', 'sections', 'narrativeThreads', 'reconciliation'])
    const extras = Object.fromEntries(Object.entries(snapshot).filter(([key]) => !managedKeys.has(key)))
    rows.push({ entityKind: 'meta', id: 'canonical', parentId: null, subtype: null, name: 'Catalogue PF2', sortOrder: 0, payload: { schemaVersion: Number(snapshot.schemaVersion ?? 2), meta: this.object(snapshot.meta), reconciliation: snapshot.reconciliation ?? null, extras } })
    const sections = Array.isArray(snapshot.sections) ? snapshot.sections : []
    sections.forEach((item, index) => push('section', item, index))
    const collections = Array.isArray(snapshot.collections) ? snapshot.collections : []
    collections.forEach((item, index) => {
      const row = this.isObject(item) ? item : {}
      push('collection', row, index, typeof row.parentId === 'string' ? row.parentId : null, typeof row.kind === 'string' ? row.kind : null)
    })
    const entries = Array.isArray(snapshot.entries) ? snapshot.entries : []
    entries.forEach((item, index) => {
      const row = this.isObject(item) ? item : {}
      push('entry', row, index, typeof row.collectionId === 'string' ? row.collectionId : null, typeof row.kind === 'string' ? row.kind : null)
    })
    const arcs = Array.isArray(snapshot.arcs) ? snapshot.arcs : []
    arcs.forEach((item, index) => push('arc', item, index))
    const threads = Array.isArray(snapshot.narrativeThreads) ? snapshot.narrativeThreads : []
    threads.forEach((item, index) => push('thread', item, index))
    const files = Array.isArray(snapshot.files) ? snapshot.files : []
    const assets = files.flatMap((item, index) => this.catalogueFileToAsset(item, index))

    await this.dataSource.transaction(async (manager) => {
      await manager.query('DELETE FROM pf2_catalogue_entity')
      await manager.query("DELETE FROM pf2_library_asset WHERE asset_type <> 'zip'")
      for (const row of rows) await manager.query(
        'INSERT INTO pf2_catalogue_entity (entity_kind, id, parent_id, subtype, name, sort_order, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [row.entityKind, row.id, row.parentId, row.subtype, row.name, row.sortOrder, JSON.stringify(row.payload)]
      )
      for (const asset of assets) await this.upsertLibraryAsset(asset, manager)
    })
  }

  async getCatalogueEntity(id: string): Promise<Record<string, unknown> | null> {
    const rows = await this.dataSource.query("SELECT payload FROM pf2_catalogue_entity WHERE id = ? AND entity_kind IN ('entry','collection') ORDER BY CASE entity_kind WHEN 'entry' THEN 0 ELSE 1 END LIMIT 1", [id]) as Array<{ payload: string }>
    return rows[0] ? this.object(JSON.parse(rows[0].payload)) : null
  }

  async listCatalogueEntries(): Promise<Record<string, unknown>[]> {
    const rows = await this.dataSource.query("SELECT payload FROM pf2_catalogue_entity WHERE entity_kind = 'entry' ORDER BY sort_order, id") as Array<{ payload: string }>
    return rows.map((row) => this.object(JSON.parse(row.payload)))
  }

  async readGeographyConfig(): Promise<Record<string, unknown>> {
    return (await this.get('geography-config', 'canonical')) ?? { aliases: {}, parents: {} }
  }

  async saveGeographyConfig(value: Record<string, unknown>): Promise<void> {
    await this.upsert('geography-config', 'canonical', 'Géographie PF2', value)
  }

  async replaceScannedZipAssets(bundles: Array<{ id: string; filename: string; path: string; targetId: string | null; scope: string; associationStatus: string; associationScore: number | null; evidence: string[] }>, scannedAt: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.query("UPDATE pf2_library_asset SET present = 0, updated_at = CURRENT_TIMESTAMP WHERE asset_type = 'zip'")
      for (const [index, bundle] of bundles.entries()) await this.upsertLibraryAsset({
        id: bundle.id, path: bundle.path, filename: bundle.filename, assetType: 'zip', targetId: bundle.targetId, targetKind: null,
        role: 'resource', language: null, variant: null, completeness: null, translationOf: null,
        associationStatus: bundle.associationStatus, associationScore: bundle.associationScore, evidence: bundle.evidence,
        metadata: { scope: bundle.scope }, present: true, lastSeenAt: scannedAt, sortOrder: index
      }, manager)
    })
  }

  async listLibraryAssets(): Promise<LibraryAsset[]> {
    const rows = await this.dataSource.query('SELECT id, path, filename, asset_type, target_id, target_kind, role, language, variant, completeness, translation_of, association_status, association_score, evidence, metadata, present, last_seen_at, sort_order FROM pf2_library_asset ORDER BY sort_order, path') as Array<Record<string, unknown>>
    return rows.map((row) => ({
      id: String(row.id), path: String(row.path), filename: String(row.filename), assetType: String(row.asset_type),
      targetId: typeof row.target_id === 'string' ? row.target_id : null, targetKind: typeof row.target_kind === 'string' ? row.target_kind : null,
      role: typeof row.role === 'string' ? row.role : null, language: typeof row.language === 'string' ? row.language : null,
      variant: typeof row.variant === 'string' ? row.variant : null, completeness: typeof row.completeness === 'string' ? row.completeness : null,
      translationOf: typeof row.translation_of === 'string' ? row.translation_of : null, associationStatus: String(row.association_status ?? 'unassociated'),
      associationScore: typeof row.association_score === 'number' ? row.association_score : row.association_score === null || row.association_score === undefined ? null : Number(row.association_score),
      evidence: this.stringArrayJson(row.evidence), metadata: this.objectJson(row.metadata), present: Number(row.present) !== 0,
      lastSeenAt: typeof row.last_seen_at === 'string' ? row.last_seen_at : null, sortOrder: Number(row.sort_order ?? 0)
    }))
  }

  async listSessions(): Promise<Pf2Session[]> {
    const rows = await this.dataSource.query('SELECT id, session_number, date, title, participants, long_summary_author, short_summary_author, session_xp, long_summary_xp, short_summary_xp, long_summary_url, short_summary, discord_message_id, created_at, updated_at FROM pf2_session ORDER BY session_number ASC') as SessionRow[]
    return rows.map((row) => this.session(row))
  }

  async getSession(id: string): Promise<Pf2Session | null> {
    const rows = await this.dataSource.query('SELECT id, session_number, date, title, participants, long_summary_author, short_summary_author, session_xp, long_summary_xp, short_summary_xp, long_summary_url, short_summary, discord_message_id, created_at, updated_at FROM pf2_session WHERE id = ?', [id]) as SessionRow[]
    return rows[0] ? this.session(rows[0]) : null
  }

  async createSession(input: Pf2SessionInput): Promise<Pf2Session> {
    const id = input.id === undefined ? randomUUID() : this.requiredSessionId(input.id)
    const session = this.sessionInput(input)
    await this.assertAvailableSessionNumber(session.sessionNumber)
    await this.dataSource.query('INSERT INTO pf2_session (id, session_number, date, title, participants, long_summary_author, short_summary_author, session_xp, long_summary_xp, short_summary_xp, long_summary_url, short_summary, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', [id, session.sessionNumber, session.date, session.title, JSON.stringify(session.participants), session.longSummaryAuthor, session.shortSummaryAuthor, session.sessionXp, session.longSummaryXp, session.shortSummaryXp, session.longSummaryUrl, session.shortSummary])
    const created = await this.getSession(id)
    if (!created) throw new Error('La séance créée est introuvable.')
    return created
  }

  async updateSession(id: string, input: Pf2SessionInput): Promise<Pf2Session | null> {
    const current = await this.getSession(this.requiredSessionId(id))
    if (!current) return null
    const session = this.sessionInput(input, current)
    await this.assertAvailableSessionNumber(session.sessionNumber, current.id)
    await this.dataSource.query('UPDATE pf2_session SET session_number = ?, date = ?, title = ?, participants = ?, long_summary_author = ?, short_summary_author = ?, session_xp = ?, long_summary_xp = ?, short_summary_xp = ?, long_summary_url = ?, short_summary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [session.sessionNumber, session.date, session.title, JSON.stringify(session.participants), session.longSummaryAuthor, session.shortSummaryAuthor, session.sessionXp, session.longSummaryXp, session.shortSummaryXp, session.longSummaryUrl, session.shortSummary, current.id])
    return this.getSession(current.id)
  }
  async deleteSession(id: string): Promise<void> {
  const sessionId = this.requiredSessionId(id)

  await this.dataSource.query(
    'DELETE FROM pf2_session WHERE id = ?',
    [sessionId],
  )
}

  async savePortrait(bytes: Uint8Array, extension: 'webp' | 'gif', pnjId: string, mimeType: string): Promise<{ path: string; absolutePath: string }> {
    const filename = `${this.slug(pnjId)}.${extension}`
    const relativePath = `portraits/${filename}`
    const absolutePath = resolve(this.storageRoot, relativePath)
    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, bytes)
    await this.dataSource.query(
      'INSERT INTO pf2_media (id, category, path, original_name, mime_type, size_bytes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET path = excluded.path, mime_type = excluded.mime_type, size_bytes = excluded.size_bytes, updated_at = CURRENT_TIMESTAMP',
      [`portrait:${this.slug(pnjId)}`, 'portrait', relativePath, filename, mimeType, bytes.byteLength]
    )
    return { path: relativePath, absolutePath }
  }

  async readPortrait(relativePath: string): Promise<{ bytes: Uint8Array; filename: string; mimeType: string }> {
    const filename = basename(relativePath)
    if (relativePath !== `portraits/${filename}` || !/\.(?:webp|gif)$/i.test(filename)) throw new Error('Chemin de portrait invalide.')
    const bytes = await readFile(this.portraitPath(filename))
    return { bytes, filename, mimeType: filename.endsWith('.gif') ? 'image/gif' : 'image/webp' }
  }

  portraitPath(filename: string): string {
    if (basename(filename) !== filename) throw new Error('Chemin refusé')
    return resolve(this.storageRoot, 'portraits', filename)
  }

  private async migrate(): Promise<void> {
    await this.dataSource.query('CREATE TABLE IF NOT EXISTS pf2_schema_migration (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)')
    await this.applyMigration('001-initial-pf2-storage', async (manager) => {
      await manager.query('CREATE TABLE IF NOT EXISTS pf2_record (kind TEXT NOT NULL, id TEXT NOT NULL, name TEXT, payload TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (kind, id))')
      await manager.query('CREATE INDEX IF NOT EXISTS idx_pf2_record_kind_name ON pf2_record (kind, name)')
      await manager.query('CREATE TABLE IF NOT EXISTS pf2_media (id TEXT PRIMARY KEY, category TEXT NOT NULL, path TEXT NOT NULL UNIQUE, original_name TEXT, mime_type TEXT, size_bytes INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)')
    })
    await this.applyMigration('002-pf2-sessions', async (manager) => {
      await this.createSessionTable(manager)
    })
    await this.applyMigration('003-normalize-pf2-sessions', async (manager) => {
      const columns = await manager.query('PRAGMA table_info(pf2_session)') as Array<{ name: string }>
      if (columns.some((column) => column.name === 'date') && columns.some((column) => column.name === 'title')) return
      const legacyRows = await manager.query('SELECT * FROM pf2_session') as Array<Record<string, unknown>>
      await manager.query('ALTER TABLE pf2_session RENAME TO pf2_session_legacy_002')
      await this.createSessionTable(manager)
      for (const row of legacyRows) {
        const metadata = this.legacyMetadata(row.metadata)
        const id = this.requiredSessionId(row.id)
        const date = this.legacyDate(row.occurred_on, metadata.date ?? metadata.occurredOn)
        const title = this.legacyTitle(metadata.title, id)
        const participants = this.participants(metadata.participants, [])
        const longSummaryAuthor = this.playerId(metadata.longSummaryAuthor ?? metadata.long_summary_author, null)
        const shortSummaryAuthor = this.playerId(metadata.shortSummaryAuthor ?? metadata.short_summary_author, null)
        const sessionXp = this.experience(metadata.sessionXp ?? metadata.session_xp, 'sessionXp', 0)
        const longSummaryXp = this.experience(metadata.longSummaryXp ?? metadata.long_summary_xp, 'longSummaryXp', 0)
        const shortSummaryXp = this.experience(metadata.shortSummaryXp ?? metadata.short_summary_xp, 'shortSummaryXp', 0)
        const longSummary = this.text(metadata.longSummary ?? metadata.long_summary, 'longSummary', '')
        const shortSummary = this.text(metadata.shortSummary ?? metadata.short_summary, 'shortSummary', '')
        await manager.query('INSERT INTO pf2_session (id, date, title, participants, long_summary_author, short_summary_author, session_xp, long_summary_xp, short_summary_xp, long_summary, short_summary, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))', [id, date, title, JSON.stringify(participants), longSummaryAuthor, shortSummaryAuthor, sessionXp, longSummaryXp, shortSummaryXp, longSummary, shortSummary, row.created_at, row.updated_at])
      }
    })
    await this.applyMigration('004-session-long-summary-link', async (manager) => {
      const columns = await manager.query('PRAGMA table_info(pf2_session)') as Array<{ name: string }>
      if (!columns.some((column) => column.name === 'long_summary_url')) {
        await manager.query("ALTER TABLE pf2_session ADD COLUMN long_summary_url TEXT NOT NULL DEFAULT ''")
      }
      // Preserve existing prose in its historical column. Only values that are
      // already links become the new explicit link field.
      await manager.query("UPDATE pf2_session SET long_summary_url = long_summary WHERE long_summary_url = '' AND (long_summary LIKE 'http://%' OR long_summary LIKE 'https://%')")
    })
    await this.applyMigration('005-session-number', async (manager) => {
      const columns = await manager.query('PRAGMA table_info(pf2_session)') as Array<{ name: string }>
      if (!columns.some((column) => column.name === 'session_number')) {
        await manager.query('ALTER TABLE pf2_session ADD COLUMN session_number INTEGER NOT NULL DEFAULT 0')
      }
      const unnumbered = await manager.query('SELECT id FROM pf2_session WHERE session_number = 0 ORDER BY date ASC, created_at ASC') as Array<{ id: string }>
      const current = await manager.query('SELECT MAX(session_number) AS maximum FROM pf2_session') as Array<{ maximum: number | null }>
      let next = Number(current[0]?.maximum ?? 0)
      for (const row of unnumbered) {
        next += 1
        await manager.query('UPDATE pf2_session SET session_number = ? WHERE id = ?', [next, row.id])
      }
      await manager.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_pf2_session_number ON pf2_session (session_number)')
    })
    await this.applyMigration('006-session-discord-message', async (manager) => {
      const columns = await manager.query('PRAGMA table_info(pf2_session)') as Array<{ name: string }>
      if (!columns.some((column) => column.name === 'discord_message_id')) {
        await manager.query('ALTER TABLE pf2_session ADD COLUMN discord_message_id TEXT')
      }
    })
    await this.applyMigration('007-scenario-packages-and-npcs', async (manager) => {
      await manager.query("CREATE TABLE IF NOT EXISTS pf2_scenario_package (scenario_id TEXT PRIMARY KEY, package_version INTEGER NOT NULL, status TEXT NOT NULL, filename TEXT NOT NULL, manifest TEXT NOT NULL, imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)")
      // pf2_record has the composite key (kind, id), therefore `id` alone
      // cannot be a SQLite foreign key. Existence is checked by the service.
      await manager.query("CREATE TABLE IF NOT EXISTS pf2_scenario_npc (scenario_id TEXT NOT NULL, npc_id TEXT NOT NULL, role TEXT, importance TEXT, source_page TEXT, notes TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (scenario_id, npc_id))")
      await manager.query('CREATE INDEX IF NOT EXISTS idx_pf2_scenario_npc_npc ON pf2_scenario_npc (npc_id)')
    })
    await this.applyMigration('008-catalogue-and-library-assets', async (manager) => {
      await manager.query("CREATE TABLE IF NOT EXISTS pf2_catalogue_entity (entity_kind TEXT NOT NULL, id TEXT NOT NULL, parent_id TEXT, subtype TEXT, name TEXT, sort_order INTEGER NOT NULL DEFAULT 0, payload TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (entity_kind, id))")
      await manager.query('CREATE INDEX IF NOT EXISTS idx_pf2_catalogue_entity_parent ON pf2_catalogue_entity (parent_id)')
      await manager.query('CREATE INDEX IF NOT EXISTS idx_pf2_catalogue_entity_kind_subtype ON pf2_catalogue_entity (entity_kind, subtype)')
      await manager.query("CREATE TABLE IF NOT EXISTS pf2_library_asset (id TEXT PRIMARY KEY, path TEXT NOT NULL UNIQUE, filename TEXT NOT NULL, asset_type TEXT NOT NULL, target_id TEXT, target_kind TEXT, role TEXT, language TEXT, variant TEXT, completeness TEXT, translation_of TEXT, association_status TEXT NOT NULL DEFAULT 'unassociated', association_score REAL, evidence TEXT NOT NULL DEFAULT '[]', metadata TEXT NOT NULL DEFAULT '{}', present INTEGER NOT NULL DEFAULT 1, last_seen_at TEXT, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)")
      await manager.query('CREATE INDEX IF NOT EXISTS idx_pf2_library_asset_target ON pf2_library_asset (target_id, target_kind)')
      await manager.query('CREATE INDEX IF NOT EXISTS idx_pf2_library_asset_type ON pf2_library_asset (asset_type)')
    })
    await this.applyMigration('009-scenario-business-relations', async (manager) => {
      await manager.query("CREATE TABLE IF NOT EXISTS pf2_scenario_relation (scenario_id TEXT NOT NULL, target_kind TEXT NOT NULL CHECK (target_kind IN ('lieu','region','faction','evenement')), target_id TEXT NOT NULL, role TEXT, importance TEXT, source_page TEXT, notes TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (scenario_id, target_kind, target_id))")
      await manager.query('CREATE INDEX IF NOT EXISTS idx_pf2_scenario_relation_target ON pf2_scenario_relation (target_kind, target_id)')
    })
    await this.applyMigration('010-scenario-deployment-queue', async (manager) => {
      const columns = await manager.query('PRAGMA table_info(pf2_scenario_package)') as Array<{ name: string }>
      if (!columns.some((column) => column.name === 'deployed_version')) await manager.query('ALTER TABLE pf2_scenario_package ADD COLUMN deployed_version INTEGER')
      if (!columns.some((column) => column.name === 'deployed_at')) await manager.query('ALTER TABLE pf2_scenario_package ADD COLUMN deployed_at TEXT')
      await manager.query("CREATE TABLE IF NOT EXISTS pf2_scenario_deployment (id TEXT PRIMARY KEY, scenario_id TEXT NOT NULL, package_version INTEGER NOT NULL, status TEXT NOT NULL CHECK (status IN ('pending','claimed','success','failed')), world_id TEXT, claimed_by TEXT, claim_token TEXT, lease_expires_at TEXT, error TEXT, result TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TEXT, UNIQUE (scenario_id, package_version))")
      await manager.query("CREATE INDEX IF NOT EXISTS idx_pf2_scenario_deployment_claim ON pf2_scenario_deployment (status, lease_expires_at, created_at)")
    })
  }

  private async createSessionTable(manager: EntityManager): Promise<void> {
    await manager.query("CREATE TABLE IF NOT EXISTS pf2_session (id TEXT PRIMARY KEY, date TEXT NOT NULL, title TEXT NOT NULL, participants TEXT NOT NULL DEFAULT '[]', long_summary_author TEXT, short_summary_author TEXT, session_xp INTEGER NOT NULL DEFAULT 0, long_summary_xp INTEGER NOT NULL DEFAULT 0, short_summary_xp INTEGER NOT NULL DEFAULT 0, long_summary TEXT NOT NULL DEFAULT '', short_summary TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)")
    await manager.query('CREATE INDEX IF NOT EXISTS idx_pf2_session_date ON pf2_session (date)')
  }

  private async applyMigration(id: string, apply: (manager: EntityManager) => Promise<void>): Promise<void> {
    const rows = await this.dataSource.query('SELECT id FROM pf2_schema_migration WHERE id = ?', [id]) as Array<{ id: string }>
    if (rows.length) return
    await this.dataSource.transaction(async (manager) => {
      const applied = await manager.query('SELECT id FROM pf2_schema_migration WHERE id = ?', [id]) as Array<{ id: string }>
      if (applied.length) return
      await apply(manager)
      await manager.query('INSERT INTO pf2_schema_migration (id) VALUES (?)', [id])
    })
  }

  private async ensureStorageDirectories(): Promise<void> {
    await Promise.all(['portraits', 'illustrations', 'maps', 'documents', 'documents/scenario-packages'].map((directory) => mkdir(resolve(this.storageRoot, directory), { recursive: true })))
  }

  private async seedCurrentData(): Promise<void> {
    for (const kind of Object.keys(referenceFiles) as ReferenceKind[]) {
      const recordKind = kind === 'factions' ? 'faction' : kind === 'lieux' ? 'lieu' : kind === 'regions' ? 'region' : kind === 'evenements' ? 'evenement' : 'pnj'
      if (await this.count(recordKind)) continue
      const payload = await this.readJson(referenceFiles[kind])
      const items = Array.isArray(payload) ? payload : this.object(payload).items
      if (Array.isArray(items)) for (const item of items) if (this.isObject(item)) await this.upsert(recordKind, this.identifier(item), this.name(item), item)
    }

    const previousCatalogueMarker = await this.get('catalogue', 'canonical')
    const referencesAlreadyReconciled = previousCatalogueMarker?.legacyReferencesReconciled === true
    if (!referencesAlreadyReconciled) {
      for (const kind of Object.keys(referenceFiles) as ReferenceKind[]) {
        const recordKind = kind === 'factions' ? 'faction' : kind === 'lieux' ? 'lieu' : kind === 'regions' ? 'region' : kind === 'evenements' ? 'evenement' : 'pnj'
        const payload = await this.readJson(referenceFiles[kind])
        const items = Array.isArray(payload) ? payload : this.object(payload).items
        if (!Array.isArray(items)) continue
        for (const item of items) {
          if (!this.isObject(item)) continue
          const id = this.identifier(item)
          if (!(await this.get(recordKind, id))) await this.upsert(recordKind, id, this.name(item), item)
        }
      }
    }

    if (!(await this.get('curation', 'user-curation'))) await this.saveCuration(this.object(await this.readJson('old/user-curation.json')))
    if (!(await this.get('geography-config', 'canonical'))) await this.saveGeographyConfig(this.object(await this.readJson('old/geography-overrides.json')))

    if (!(await this.catalogueEntityCount())) {
      const legacyCatalogue = this.object(await this.readJson('old/catalogue-pf2.json'))
      await this.replaceCatalogueSnapshot(legacyCatalogue)
    }
    const catalogue = await this.readCatalogueSnapshot()
    await this.upsert('catalogue', 'canonical', 'Catalogue PF2 migré vers SQLite', { migratedTo: 'pf2_catalogue_entity', assetsTable: 'pf2_library_asset', schemaVersion: catalogue.schemaVersion ?? 2, legacyReferencesReconciled: true })

    const entries = Array.isArray(catalogue.entries) ? catalogue.entries : []
    for (const entry of entries) {
      if (!this.isObject(entry)) continue
      const id = this.identifier(entry)
      if (!(await this.get('scenario', id))) await this.upsert('scenario', id, this.title(entry), entry)
    }
  }

  private async list(kind: Pf2RecordKind): Promise<Record<string, unknown>[]> {
    const rows = await this.dataSource.query('SELECT id, name, payload FROM pf2_record WHERE kind = ? ORDER BY name COLLATE NOCASE, id', [kind]) as RecordRow[]
    return rows.map((row) => this.object(JSON.parse(row.payload)))
  }

  private async get(kind: Pf2RecordKind, id: string): Promise<Record<string, unknown> | null> {
    const rows = await this.dataSource.query('SELECT payload FROM pf2_record WHERE kind = ? AND id = ?', [kind, id]) as Array<{ payload: string }>
    return rows[0] ? this.object(JSON.parse(rows[0].payload)) : null
  }

  private async count(kind: Pf2RecordKind): Promise<number> {
    const rows = await this.dataSource.query('SELECT COUNT(*) AS count FROM pf2_record WHERE kind = ?', [kind]) as Array<{ count: number }>
    return Number(rows[0]?.count ?? 0)
  }

  private async upsert(kind: Pf2RecordKind, id: string, name: string, payload: Record<string, unknown>, manager: DataSource | EntityManager = this.dataSource): Promise<void> {
    await manager.query('INSERT INTO pf2_record (kind, id, name, payload, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(kind, id) DO UPDATE SET name = excluded.name, payload = excluded.payload, updated_at = CURRENT_TIMESTAMP', [kind, id, name, JSON.stringify(payload)])
  }

  private catalogueEntityName(item: Record<string, unknown>): string | null {
    const titles = this.object(item.titles)
    const candidates = [item.titleFr, item.titleOriginal, item.title, item.nom, titles.fr, titles.original, item.id]
    const value = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim())
    return typeof value === 'string' ? value.trim() : null
  }

  private catalogueFileToAsset(value: unknown, sortOrder: number): LibraryAsset[] {
    if (!this.isObject(value)) return []
    const id = typeof value.id === 'string' && value.id.trim() ? value.id.trim() : `asset-${sortOrder + 1}`
    const path = typeof value.path === 'string' ? value.path.trim() : ''
    if (!path) return []
    const filename = typeof value.filename === 'string' && value.filename.trim() ? value.filename.trim() : path.split('/').at(-1) ?? path
    const association = this.object(value.association)
    const language = typeof value.languageHint === 'string' ? value.languageHint : null
    const variant = value.translationVariant === true ? 'translationUnofficial' : null
    const targetId = typeof association.itemId === 'string' ? association.itemId : typeof association.campaignId === 'string' ? association.campaignId : null
    const targetKind = typeof association.itemId === 'string' ? 'item' : typeof association.campaignId === 'string' ? 'container' : null
    return [{
      id, path, filename, assetType: path.toLowerCase().endsWith('.zip') ? 'zip' : 'pdf', targetId, targetKind,
      role: typeof value.roleHint === 'string' ? value.roleHint : null, language, variant, completeness: null, translationOf: typeof value.translationOf === 'string' ? value.translationOf : null,
      associationStatus: typeof association.status === 'string' ? association.status : 'unassociated', associationScore: null,
      evidence: Array.isArray(association.evidence) ? association.evidence.filter((item): item is string => typeof item === 'string') : [],
      metadata: value, present: true, lastSeenAt: null, sortOrder
    }]
  }

  private assetToCatalogueFile(asset: LibraryAsset): Record<string, unknown> {
    // `metadata` conserve le fichier catalogue original. Les colonnes dédiées
    // servent aux recherches/indexations sans réécrire silencieusement le JSON
    // lors d'un export : un aller-retour DB doit rester sans perte.
    return { ...asset.metadata, id: asset.id, path: asset.path, filename: asset.filename }
  }

  private async upsertLibraryAsset(asset: LibraryAsset, manager: DataSource | EntityManager = this.dataSource): Promise<void> {
    await manager.query(
      'INSERT INTO pf2_library_asset (id, path, filename, asset_type, target_id, target_kind, role, language, variant, completeness, translation_of, association_status, association_score, evidence, metadata, present, last_seen_at, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET path = excluded.path, filename = excluded.filename, asset_type = excluded.asset_type, target_id = excluded.target_id, target_kind = excluded.target_kind, role = excluded.role, language = excluded.language, variant = excluded.variant, completeness = excluded.completeness, translation_of = excluded.translation_of, association_status = excluded.association_status, association_score = excluded.association_score, evidence = excluded.evidence, metadata = excluded.metadata, present = excluded.present, last_seen_at = excluded.last_seen_at, sort_order = excluded.sort_order, updated_at = CURRENT_TIMESTAMP',
      [asset.id, asset.path, asset.filename, asset.assetType, asset.targetId, asset.targetKind, asset.role, asset.language, asset.variant, asset.completeness, asset.translationOf, asset.associationStatus, asset.associationScore, JSON.stringify(asset.evidence), JSON.stringify(asset.metadata), asset.present ? 1 : 0, asset.lastSeenAt, asset.sortOrder]
    )
  }

  private stringArrayJson(value: unknown): string[] {
    try { const parsed = typeof value === 'string' ? JSON.parse(value) : value; return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [] } catch { return [] }
  }

  private objectJson(value: unknown): Record<string, unknown> {
    try { return this.object(typeof value === 'string' ? JSON.parse(value) : value) } catch { return {} }
  }

  private async assertAvailableSessionNumber(sessionNumber: number, exceptId?: string): Promise<void> {
    const rows = await this.dataSource.query('SELECT id FROM pf2_session WHERE session_number = ? AND id <> ?', [sessionNumber, exceptId ?? '']) as Array<{ id: string }>
    if (rows.length) throw new Error(`Le numéro de résumé ${sessionNumber} existe déjà.`)
  }

  async saveSessionDiscordMessageId(id: string, messageId: string): Promise<void> {
    await this.dataSource.query('UPDATE pf2_session SET discord_message_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [messageId, this.requiredSessionId(id)])
  }

  private async readJson(filename: string): Promise<unknown> {
    try {
      return JSON.parse(await readFile(resolve(this.seedRoot, filename), 'utf8')) as unknown
    } catch (error) {
      // Compatibilité de déploiement : pendant la première bascule, les seeds
      // peuvent encore être à la racine de data/. Le runtime n'en dépend plus
      // une fois SQLite initialisé, mais on évite qu'un simple overlay de code
      // rende le redémarrage impossible avant le déplacement vers data/old/.
      if (filename.startsWith('old/') && error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        return JSON.parse(await readFile(resolve(this.seedRoot, filename.slice(4)), 'utf8')) as unknown
      }
      throw error
    }
  }

  private identifier(item: Record<string, unknown>): string {
    const id = typeof item.id === 'string' ? item.id.trim() : ''
    if (!id) throw new Error('Chaque entrée doit avoir un identifiant.')
    return id
  }

  private name(item: Record<string, unknown>): string { return typeof item.nom === 'string' ? item.nom.trim() : this.title(item) }
  private title(item: Record<string, unknown>): string { return typeof item.titleFr === 'string' ? item.titleFr : typeof item.titleOriginal === 'string' ? item.titleOriginal : typeof item.id === 'string' ? item.id : '' }
  private session(row: SessionRow): Pf2Session { return { id: row.id, sessionNumber: row.session_number, date: row.date, title: row.title, participants: this.participants(JSON.parse(row.participants), []), longSummaryAuthor: row.long_summary_author, shortSummaryAuthor: row.short_summary_author, sessionXp: row.session_xp, longSummaryXp: row.long_summary_xp, shortSummaryXp: row.short_summary_xp, longSummaryUrl: row.long_summary_url, shortSummary: row.short_summary, discordMessageId: row.discord_message_id, createdAt: row.created_at, updatedAt: row.updated_at } }
  private sessionInput(input: Pf2SessionInput, current?: Pf2Session): Omit<Pf2Session, 'id' | 'discordMessageId' | 'createdAt' | 'updatedAt'> {
    return {
      sessionNumber: this.sessionNumber(input.sessionNumber, current?.sessionNumber),
      date: this.optionalDate(input.date, current?.date ?? ''),
      title: this.text(input.title, 'title', current?.title ?? ''),
      participants: this.participants(input.participants, current?.participants ?? []),
      longSummaryAuthor: this.playerId(input.longSummaryAuthor, current?.longSummaryAuthor ?? null),
      shortSummaryAuthor: this.playerId(input.shortSummaryAuthor, current?.shortSummaryAuthor ?? null),
      sessionXp: this.experience(input.sessionXp, 'sessionXp', current?.sessionXp ?? 0),
      longSummaryXp: this.experience(input.longSummaryXp, 'longSummaryXp', current?.longSummaryXp ?? 0),
      shortSummaryXp: this.experience(input.shortSummaryXp, 'shortSummaryXp', current?.shortSummaryXp ?? 0),
      longSummaryUrl: this.link(input.longSummaryUrl, current?.longSummaryUrl ?? ''),
      shortSummary: this.text(input.shortSummary, 'shortSummary', current?.shortSummary ?? '')
    }
  }
  private sessionId(value: unknown): string | null { return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value) ? value : null }
  private requiredSessionId(value: unknown): string { const id = this.sessionId(value); if (!id) throw new Error('Identifiant de séance invalide.'); return id }
  private optionalDate(value: unknown, fallback: string): string { const date = value === undefined ? fallback : value; if (typeof date !== 'string' || (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))) throw new Error('date doit être vide ou au format YYYY-MM-DD.'); return date }
  private sessionNumber(value: unknown, fallback?: number): number { const number = value === undefined ? fallback : value; if (typeof number !== 'number' || !Number.isInteger(number) || number < 1) throw new Error('Le numéro de résumé est obligatoire et doit être un entier positif.'); return number }
  private legacyDate(...values: unknown[]): string { for (const value of values) if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value; return '1970-01-01' }
  private legacyTitle(value: unknown, id: string): string { return typeof value === 'string' && value.trim() ? value.trim() : `Séance migrée ${id}` }
  private text(value: unknown, label: string, fallback: string, required = false): string { const text = value === undefined ? fallback : value; if (typeof text !== 'string' || (required && !text.trim())) throw new Error(`${label} est obligatoire.`); return text.trim() }
  private link(value: unknown, fallback: string): string { const link = this.text(value, 'longSummaryUrl', fallback); if (link && !/^https?:\/\//i.test(link)) throw new Error('longSummaryUrl doit être un lien HTTP(S) valide.'); return link }
  private participants(value: unknown, fallback: string[]): string[] { const items = value === undefined ? fallback : value; if (!Array.isArray(items) || items.some((item) => typeof item !== 'string' || !item.trim())) throw new Error('participants doit être une liste d’identifiants de PJ.') ; return [...new Set(items.map((item) => item.trim()))] }
  private playerId(value: unknown, fallback: string | null): string | null { const id = value === undefined ? fallback : value; if (id === null || id === '') return null; if (typeof id !== 'string' || !id.trim()) throw new Error('Identifiant de PJ invalide.'); return id.trim() }
  private experience(value: unknown, label: string, fallback: number): number { const xp = value === undefined ? fallback : value; if (typeof xp !== 'number' || !Number.isInteger(xp) || xp < 0) throw new Error(`${label} doit être un entier positif ou nul.`); return xp }
  private deployment(row: Record<string, unknown>): ScenarioDeployment {
    return {
      id: String(row.id), scenarioId: String(row.scenario_id), packageVersion: Number(row.package_version), status: String(row.status) as ScenarioDeploymentStatus,
      worldId: typeof row.world_id === 'string' ? row.world_id : null, claimedBy: typeof row.claimed_by === 'string' ? row.claimed_by : null, claimToken: typeof row.claim_token === 'string' ? row.claim_token : null,
      leaseExpiresAt: typeof row.lease_expires_at === 'string' ? row.lease_expires_at : null, error: typeof row.error === 'string' ? row.error : null,
      result: row.result === null || row.result === undefined ? null : this.objectJson(row.result), createdAt: String(row.created_at), updatedAt: String(row.updated_at), completedAt: typeof row.completed_at === 'string' ? row.completed_at : null
    }
  }
  private deploymentError(result: Record<string, unknown>): string {
    if (typeof result.error === 'string' && result.error.trim()) return result.error.trim()
    if (Array.isArray(result.errors) && result.errors.length) return result.errors.map(String).join(' | ')
    return 'Le Toolkit Foundry a signalé un échec de déploiement.'
  }
  private legacyMetadata(value: unknown): Record<string, unknown> { if (typeof value !== 'string') return {}; try { return this.object(JSON.parse(value)) } catch { return {} } }
  private slug(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pnj' }
  private object(value: unknown): Record<string, unknown> { return this.isObject(value) ? value : {} }
  private isObject(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) }
}
