import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DataSource } from 'typeorm'
import { Pf2PersistenceService } from './Pf2PersistenceService'

describe('Pf2PersistenceService', () => {
  let root: string
  let database: string
  let dataSource: DataSource | undefined
  const originalDataRoot = process.env['PF2_DATA_ROOT']
  const originalStorageRoot = process.env['STORAGE_PATH']

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'pf2-persistence-'))
    const dataRoot = join(root, 'seed')
    await mkdir(dataRoot, { recursive: true })
    await Promise.all([
      ...['pf2_personnages.json', 'pf2_factions.json', 'pf2_lieux.json', 'pf2_regions.json', 'pf2_evenements.json'].map((filename) => writeFile(join(dataRoot, filename), '[]')),
      writeFile(join(dataRoot, 'user-curation.json'), '{}'),
      writeFile(join(dataRoot, 'catalogue-pf2.json'), '{"entries":[]}')
    ])
    database = join(root, 'data', 'pf2.sqlite')
    process.env['PF2_DATA_ROOT'] = dataRoot
    process.env['STORAGE_PATH'] = join(root, 'storage')
  })

  afterEach(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy()
    process.env['PF2_DATA_ROOT'] = originalDataRoot
    process.env['STORAGE_PATH'] = originalStorageRoot
    await rm(root, { recursive: true, force: true })
  })

  async function open(): Promise<Pf2PersistenceService> {
    dataSource = new DataSource({ type: 'sqlite', database })
    await dataSource.initialize()
    const service = new Pf2PersistenceService(dataSource)
    await service.onModuleInit()
    return service
  }

  function currentDataSource(): DataSource {
    if (!dataSource) throw new Error('La source SQLite est fermée.')
    return dataSource
  }

  it('creates, updates, migrates and preserves complete sessions', async () => {
    const first = await open()
    const created = await first.createSession({
      id: 'seance-001',
      sessionNumber: 1,
      date: '2026-08-28',
      title: 'Premier test',
      participants: ['Actor.yaz', 'Actor.pepin'],
      longSummaryAuthor: 'Actor.pepin',
      shortSummaryAuthor: 'Actor.yaz',
      sessionXp: 400,
      longSummaryXp: 60,
      shortSummaryXp: 30,
      longSummaryUrl: 'https://wiki.example.test/seances/001',
      shortSummary: 'Résumé court'
    })
    expect(created).toMatchObject({ id: 'seance-001', sessionNumber: 1, date: '2026-08-28', title: 'Premier test', participants: ['Actor.yaz', 'Actor.pepin'], longSummaryAuthor: 'Actor.pepin', shortSummaryAuthor: 'Actor.yaz', sessionXp: 400, longSummaryXp: 60, shortSummaryXp: 30, longSummaryUrl: 'https://wiki.example.test/seances/001', shortSummary: 'Résumé court' })
    await expect(first.getSession('seance-001')).resolves.toEqual(expect.objectContaining({ title: 'Premier test' }))

    await expect(first.updateSession('seance-001', { title: 'Premier test corrigé', sessionXp: 450, shortSummary: 'Résumé court corrigé' })).resolves.toEqual(expect.objectContaining({ title: 'Premier test corrigé', sessionXp: 450, shortSummary: 'Résumé court corrigé', longSummaryUrl: 'https://wiki.example.test/seances/001' }))
    await expect(first.createSession({ title: 'Sans numéro' })).rejects.toThrow('numéro de résumé est obligatoire')
    await expect(first.createSession({ sessionNumber: 2 })).resolves.toEqual(expect.objectContaining({ sessionNumber: 2, title: '', date: '' }))
    await expect(first.createSession({ sessionNumber: 1 })).rejects.toThrow('existe déjà')
    expect((await first.listSessions()).map((session) => session.sessionNumber)).toEqual([1, 2])

    await first.onModuleInit()
    expect(await currentDataSource().query('SELECT id FROM pf2_schema_migration ORDER BY id')).toEqual([
      { id: '001-initial-pf2-storage' },
      { id: '002-pf2-sessions' },
      { id: '003-normalize-pf2-sessions' },
      { id: '004-session-long-summary-link' },
      { id: '005-session-number' },
      { id: '006-session-discord-message' }
    ])

    await currentDataSource().destroy()
    dataSource = undefined

    const reopened = await open()
    expect(await reopened.listSessions()).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'seance-001', sessionNumber: 1, date: '2026-08-28', title: 'Premier test corrigé', sessionXp: 450, shortSummary: 'Résumé court corrigé' }), expect.objectContaining({ sessionNumber: 2, title: '', date: '' })]))
    expect(await currentDataSource().query('SELECT id FROM pf2_schema_migration ORDER BY id')).toEqual([
      { id: '001-initial-pf2-storage' },
      { id: '002-pf2-sessions' },
      { id: '003-normalize-pf2-sessions' },
      { id: '004-session-long-summary-link' },
      { id: '005-session-number' },
      { id: '006-session-discord-message' }
    ])
  })

  it('upgrades the previously generated generic session schema without losing its row', async () => {
    dataSource = new DataSource({ type: 'sqlite', database })
    await dataSource.initialize()
    await dataSource.query('CREATE TABLE pf2_schema_migration (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)')
    await dataSource.query('CREATE TABLE pf2_record (kind TEXT NOT NULL, id TEXT NOT NULL, name TEXT, payload TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (kind, id))')
    await dataSource.query('CREATE TABLE pf2_media (id TEXT PRIMARY KEY, category TEXT NOT NULL, path TEXT NOT NULL UNIQUE, original_name TEXT, mime_type TEXT, size_bytes INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)')
    await dataSource.query('CREATE TABLE pf2_session (id TEXT PRIMARY KEY, occurred_on TEXT, metadata TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)')
    await dataSource.query("INSERT INTO pf2_schema_migration (id) VALUES ('001-initial-pf2-storage'), ('002-pf2-sessions')")
    await dataSource.query('INSERT INTO pf2_session (id, occurred_on, metadata) VALUES (?, ?, ?)', ['seance-legacy', '2026-08-27', JSON.stringify({ title: 'Séance existante', participants: ['Actor.yaz'], sessionXp: 300, longSummary: 'https://wiki.example.test/seances/legacy' })])

    const service = new Pf2PersistenceService(dataSource)
    await service.onModuleInit()

    await expect(service.getSession('seance-legacy')).resolves.toEqual(expect.objectContaining({ id: 'seance-legacy', sessionNumber: 1, date: '2026-08-27', title: 'Séance existante', participants: ['Actor.yaz'], sessionXp: 300, longSummaryUrl: 'https://wiki.example.test/seances/legacy' }))
    expect(await currentDataSource().query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'pf2_session_legacy_002'")).toEqual([{ name: 'pf2_session_legacy_002' }])
  })
})
