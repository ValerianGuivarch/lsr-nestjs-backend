import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { DataSource, EntityManager } from 'typeorm'

export type Pf2RecordKind = 'pnj' | 'faction' | 'lieu' | 'region' | 'evenement' | 'scenario' | 'session' | 'catalogue' | 'curation'

const referenceFiles = {
  pnj: 'pf2_personnages.json',
  factions: 'pf2_factions.json',
  lieux: 'pf2_lieux.json',
  regions: 'pf2_regions.json',
  evenements: 'pf2_evenements.json'
} as const

type ReferenceKind = keyof typeof referenceFiles
type RecordRow = { id: string; name: string | null; payload: string }

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

  portraitPath(filename: string): string {
    if (basename(filename) !== filename) throw new Error('Chemin refusé')
    return resolve(this.storageRoot, 'portraits', filename)
  }

  private async migrate(): Promise<void> {
    await this.dataSource.query('CREATE TABLE IF NOT EXISTS pf2_schema_migration (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)')
    await this.dataSource.query('CREATE TABLE IF NOT EXISTS pf2_record (kind TEXT NOT NULL, id TEXT NOT NULL, name TEXT, payload TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (kind, id))')
    await this.dataSource.query('CREATE INDEX IF NOT EXISTS idx_pf2_record_kind_name ON pf2_record (kind, name)')
    await this.dataSource.query('CREATE TABLE IF NOT EXISTS pf2_media (id TEXT PRIMARY KEY, category TEXT NOT NULL, path TEXT NOT NULL UNIQUE, original_name TEXT, mime_type TEXT, size_bytes INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)')
    await this.dataSource.query("INSERT OR IGNORE INTO pf2_schema_migration (id) VALUES ('001-initial-pf2-storage')")
  }

  private async ensureStorageDirectories(): Promise<void> {
    await Promise.all(['portraits', 'illustrations', 'maps', 'documents'].map((directory) => mkdir(resolve(this.storageRoot, directory), { recursive: true })))
  }

  private async seedCurrentData(): Promise<void> {
    for (const kind of Object.keys(referenceFiles) as ReferenceKind[]) {
      const recordKind = kind === 'factions' ? 'faction' : kind === 'lieux' ? 'lieu' : kind === 'regions' ? 'region' : kind === 'evenements' ? 'evenement' : 'pnj'
      if (await this.count(recordKind)) continue
      const payload = await this.readJson(referenceFiles[kind])
      const items = Array.isArray(payload) ? payload : this.object(payload).items
      if (Array.isArray(items)) for (const item of items) if (this.isObject(item)) await this.upsert(recordKind, this.identifier(item), this.name(item), item)
    }

    if (!(await this.get('curation', 'user-curation'))) await this.saveCuration(this.object(await this.readJson('user-curation.json')))
    const catalogue = await this.readJson('catalogue-pf2.json')
    if (!(await this.get('catalogue', 'canonical'))) await this.upsert('catalogue', 'canonical', 'Catalogue PF2 canonique', this.object(catalogue))
    if (!(await this.count('scenario'))) {
      const entries = this.object(catalogue).entries
      if (Array.isArray(entries)) for (const entry of entries) if (this.isObject(entry)) await this.upsert('scenario', this.identifier(entry), this.title(entry), entry)
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

  private async readJson(filename: string): Promise<unknown> {
    return JSON.parse(await readFile(resolve(this.seedRoot, filename), 'utf8')) as unknown
  }

  private identifier(item: Record<string, unknown>): string {
    const id = typeof item.id === 'string' ? item.id.trim() : ''
    if (!id) throw new Error('Chaque entrée doit avoir un identifiant.')
    return id
  }

  private name(item: Record<string, unknown>): string { return typeof item.nom === 'string' ? item.nom.trim() : this.title(item) }
  private title(item: Record<string, unknown>): string { return typeof item.titleFr === 'string' ? item.titleFr : typeof item.titleOriginal === 'string' ? item.titleOriginal : typeof item.id === 'string' ? item.id : '' }
  private slug(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pnj' }
  private object(value: unknown): Record<string, unknown> { return this.isObject(value) ? value : {} }
  private isObject(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) }
}
