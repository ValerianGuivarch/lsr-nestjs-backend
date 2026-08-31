import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
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
type SessionRow = { id: string; date: string; title: string; participants: string; long_summary_author: string | null; short_summary_author: string | null; session_xp: number; long_summary_xp: number; short_summary_xp: number; long_summary_url: string; short_summary: string; created_at: string; updated_at: string }
export type Pf2Session = { id: string; date: string; title: string; participants: string[]; longSummaryAuthor: string | null; shortSummaryAuthor: string | null; sessionXp: number; longSummaryXp: number; shortSummaryXp: number; longSummaryUrl: string; shortSummary: string; createdAt: string; updatedAt: string }
export type Pf2SessionInput = { id?: unknown; date?: unknown; title?: unknown; participants?: unknown; longSummaryAuthor?: unknown; shortSummaryAuthor?: unknown; sessionXp?: unknown; longSummaryXp?: unknown; shortSummaryXp?: unknown; longSummaryUrl?: unknown; shortSummary?: unknown }

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

  async listSessions(): Promise<Pf2Session[]> {
    const rows = await this.dataSource.query('SELECT id, date, title, participants, long_summary_author, short_summary_author, session_xp, long_summary_xp, short_summary_xp, long_summary_url, short_summary, created_at, updated_at FROM pf2_session ORDER BY date ASC, created_at ASC') as SessionRow[]
    return rows.map((row) => this.session(row))
  }

  async getSession(id: string): Promise<Pf2Session | null> {
    const rows = await this.dataSource.query('SELECT id, date, title, participants, long_summary_author, short_summary_author, session_xp, long_summary_xp, short_summary_xp, long_summary_url, short_summary, created_at, updated_at FROM pf2_session WHERE id = ?', [id]) as SessionRow[]
    return rows[0] ? this.session(rows[0]) : null
  }

  async createSession(input: Pf2SessionInput): Promise<Pf2Session> {
    const id = input.id === undefined ? randomUUID() : this.requiredSessionId(input.id)
    const session = this.sessionInput(input)
    await this.dataSource.query('INSERT INTO pf2_session (id, date, title, participants, long_summary_author, short_summary_author, session_xp, long_summary_xp, short_summary_xp, long_summary_url, short_summary, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', [id, session.date, session.title, JSON.stringify(session.participants), session.longSummaryAuthor, session.shortSummaryAuthor, session.sessionXp, session.longSummaryXp, session.shortSummaryXp, session.longSummaryUrl, session.shortSummary])
    const created = await this.getSession(id)
    if (!created) throw new Error('La séance créée est introuvable.')
    return created
  }

  async updateSession(id: string, input: Pf2SessionInput): Promise<Pf2Session | null> {
    const current = await this.getSession(this.requiredSessionId(id))
    if (!current) return null
    const session = this.sessionInput(input, current)
    await this.dataSource.query('UPDATE pf2_session SET date = ?, title = ?, participants = ?, long_summary_author = ?, short_summary_author = ?, session_xp = ?, long_summary_xp = ?, short_summary_xp = ?, long_summary_url = ?, short_summary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [session.date, session.title, JSON.stringify(session.participants), session.longSummaryAuthor, session.shortSummaryAuthor, session.sessionXp, session.longSummaryXp, session.shortSummaryXp, session.longSummaryUrl, session.shortSummary, current.id])
    return this.getSession(current.id)
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
  private session(row: SessionRow): Pf2Session { return { id: row.id, date: row.date, title: row.title, participants: this.participants(JSON.parse(row.participants), []), longSummaryAuthor: row.long_summary_author, shortSummaryAuthor: row.short_summary_author, sessionXp: row.session_xp, longSummaryXp: row.long_summary_xp, shortSummaryXp: row.short_summary_xp, longSummaryUrl: row.long_summary_url, shortSummary: row.short_summary, createdAt: row.created_at, updatedAt: row.updated_at } }
  private sessionInput(input: Pf2SessionInput, current?: Pf2Session): Omit<Pf2Session, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      date: this.date(input.date, current?.date),
      title: this.text(input.title, 'title', current?.title, true),
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
  private date(value: unknown, fallback?: string): string { const date = value === undefined ? fallback : value; if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Date de séance obligatoire et invalide (YYYY-MM-DD attendu).'); return date }
  private legacyDate(...values: unknown[]): string { for (const value of values) if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value; return '1970-01-01' }
  private legacyTitle(value: unknown, id: string): string { return typeof value === 'string' && value.trim() ? value.trim() : `Séance migrée ${id}` }
  private text(value: unknown, label: string, fallback: string, required = false): string { const text = value === undefined ? fallback : value; if (typeof text !== 'string' || (required && !text.trim())) throw new Error(`${label} est obligatoire.`); return text.trim() }
  private link(value: unknown, fallback: string): string { const link = this.text(value, 'longSummaryUrl', fallback); if (link && !/^https?:\/\//i.test(link)) throw new Error('longSummaryUrl doit être un lien HTTP(S) valide.'); return link }
  private participants(value: unknown, fallback: string[]): string[] { const items = value === undefined ? fallback : value; if (!Array.isArray(items) || items.some((item) => typeof item !== 'string' || !item.trim())) throw new Error('participants doit être une liste d’identifiants de PJ.') ; return [...new Set(items.map((item) => item.trim()))] }
  private playerId(value: unknown, fallback: string | null): string | null { const id = value === undefined ? fallback : value; if (id === null || id === '') return null; if (typeof id !== 'string' || !id.trim()) throw new Error('Identifiant de PJ invalide.'); return id.trim() }
  private experience(value: unknown, label: string, fallback: number): number { const xp = value === undefined ? fallback : value; if (typeof xp !== 'number' || !Number.isInteger(xp) || xp < 0) throw new Error(`${label} doit être un entier positif ou nul.`); return xp }
  private legacyMetadata(value: unknown): Record<string, unknown> { if (typeof value !== 'string') return {}; try { return this.object(JSON.parse(value)) } catch { return {} } }
  private slug(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pnj' }
  private object(value: unknown): Record<string, unknown> { return this.isObject(value) ? value : {} }
  private isObject(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) }
}
