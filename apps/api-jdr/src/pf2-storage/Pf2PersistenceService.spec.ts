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
    await mkdir(join(dataRoot, 'old'), { recursive: true })
    await Promise.all([
      ...['pf2_personnages.json', 'pf2_factions.json', 'pf2_lieux.json', 'pf2_regions.json', 'pf2_evenements.json'].map((filename) => writeFile(join(dataRoot, 'old', filename), '[]')),
      writeFile(join(dataRoot, 'old', 'user-curation.json'), '{}'),
      writeFile(join(dataRoot, 'old', 'geography-overrides.json'), '{"aliases":{},"parents":{}}'),
      writeFile(join(dataRoot, 'old', 'catalogue-pf2.json'), '{"schemaVersion":2,"meta":{},"files":[],"entries":[],"collections":[],"arcs":[],"sections":[],"narrativeThreads":[]}')
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

  it('preserves the latest Foundry actor cache across SQLite reopen', async () => {
    const first = await open()
    await first.saveFoundryActorCache([
      { uuid: 'Actor.yaz', name: 'Yaz Lorok (Gus)' },
      { uuid: 'Actor.pepin', name: 'Pépin (Eric)' }
    ])

    await currentDataSource().destroy()
    dataSource = undefined

    const reopened = await open()
    await expect(reopened.readFoundryActorCache()).resolves.toEqual([
      { uuid: 'Actor.yaz', name: 'Yaz Lorok (Gus)' },
      { uuid: 'Actor.pepin', name: 'Pépin (Eric)' }
    ])
  })

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
      { id: '006-session-discord-message' },
      { id: '007-scenario-packages-and-npcs' },
      { id: '008-catalogue-and-library-assets' },
      { id: '009-scenario-business-relations' },
      { id: '010-scenario-deployment-queue' }
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
      { id: '006-session-discord-message' },
      { id: '007-scenario-packages-and-npcs' },
      { id: '008-catalogue-and-library-assets' },
      { id: '009-scenario-business-relations' },
      { id: '010-scenario-deployment-queue' }
    ])
  })

  it('stores the catalogue and geography in SQLite and preserves edits across reopen', async () => {
    const first = await open()
    await first.replaceCatalogueSnapshot({
      schemaVersion: 2,
      meta: { title: 'Test' },
      sections: [{ id: 'campaigns', title: 'Campagnes', order: 1, description: '' }],
      collections: [{ id: 'pfs-s1', sectionId: 'campaigns', parentId: null, kind: 'pfs-season', titleFr: 'Saison 1', order: 1 }],
      entries: [{ id: 'pfs-s01-01', sectionId: 'campaigns', collectionId: 'pfs-s1', kind: 'pfs-scenario', titleFr: 'Initiation', titleOriginal: 'Initiation', aliases: [], regions: [], arcIds: [], documents: [], parts: [], openTable: { rating: 3 }, story: {}, characterHooks: [] }],
      files: [{ id: 'pdf-1', path: 'Campagnes/test.pdf', filename: 'test.pdf', languageHint: 'en', association: { status: 'associé', itemId: 'pfs-s01-01', confidence: 'confirmé' } }],
      arcs: [], narrativeThreads: []
    })
    await first.saveGeographyConfig({ aliases: { Absalom: 'Absalom' }, parents: {} })

    const snapshot = await first.readCatalogueSnapshot()
    expect((snapshot.entries as Array<Record<string, unknown>>).map((entry) => entry.id)).toEqual(['pfs-s01-01'])
    expect((snapshot.files as Array<Record<string, unknown>>)[0]).toEqual(expect.objectContaining({ id: 'pdf-1', path: 'Campagnes/test.pdf' }))

    await currentDataSource().destroy()
    dataSource = undefined
    const reopened = await open()
    await expect(reopened.readGeographyConfig()).resolves.toEqual({ aliases: { Absalom: 'Absalom' }, parents: {} })
    expect(((await reopened.readCatalogueSnapshot()).entries as Array<Record<string, unknown>>)[0]).toEqual(expect.objectContaining({ id: 'pfs-s01-01' }))
  })

  it('keeps explicit scenario-to-PNJ relations across a reopen', async () => {
    const first = await open()
    await first.saveRecord('pnj', { id: 'captain-vara', nom: 'Capitaine Vara', description: '' })
    await first.replaceScenarioNpcLinks('pfs-s01-01', [{ scenarioId: 'pfs-s01-01', npcId: 'captain-vara', role: 'alliée', importance: 'Récurrente', sourcePage: '8', notes: null }])
    await currentDataSource().destroy()
    dataSource = undefined
    const reopened = await open()
    await expect(reopened.listScenarioNpcLinks('pfs-s01-01')).resolves.toEqual([expect.objectContaining({ npcId: 'captain-vara', role: 'alliée' })])
    await expect(reopened.listNpcScenarioLinks('captain-vara')).resolves.toEqual([expect.objectContaining({ scenarioId: 'pfs-s01-01' })])
  })

  it('replaces scenario business relations and rejects an unknown target', async () => {
    const service = await open()
    await service.saveRecord('lieu', { id: 'lieu-quantium', nom: 'Quantium' })
    await service.saveRecord('region', { id: 'region-nex', nom: 'Nex' })
    await service.replaceScenarioRelations('pfs-s01-01', [
      { scenarioId: 'pfs-s01-01', targetKind: 'lieu', targetId: 'lieu-quantium', role: 'Lieu principal', importance: 'Majeure', sourcePage: '12', notes: null },
      { scenarioId: 'pfs-s01-01', targetKind: 'region', targetId: 'region-nex', role: null, importance: null, sourcePage: null, notes: null }
    ])
    await expect(service.listScenarioRelations('pfs-s01-01')).resolves.toHaveLength(2)
    await service.replaceScenarioRelations('pfs-s01-01', [{ scenarioId: 'pfs-s01-01', targetKind: 'lieu', targetId: 'lieu-quantium', role: null, importance: null, sourcePage: null, notes: 'Mis à jour' }])
    await expect(service.listScenarioRelations('pfs-s01-01')).resolves.toEqual([expect.objectContaining({ targetId: 'lieu-quantium', notes: 'Mis à jour' })])
    await expect(service.replaceScenarioRelations('pfs-s01-01', [{ scenarioId: 'pfs-s01-01', targetKind: 'faction', targetId: 'inconnue', role: null, importance: null, sourcePage: null, notes: null }])).rejects.toThrow('faction inconnu')
  })

  it('keeps omitted relation families and clears an explicitly empty family atomically', async () => {
    const service = await open()
    await service.saveRecord('lieu', { id: 'lieu-quantium', nom: 'Quantium' })
    await service.replaceScenarioRelations('pfs-s01-01', [{ scenarioId: 'pfs-s01-01', targetKind: 'lieu', targetId: 'lieu-quantium', role: null, importance: null, sourcePage: null, notes: null }])
    const packageInput = { scenarioId: 'pfs-s01-01', packageVersion: 1, status: 'integrated' as const, filename: 'test.zip', manifest: {} }
    await service.importScenarioPackageAtomically({ records: [], npcLinks: [], relations: [], replaceRelationKinds: [], package: packageInput })
    await expect(service.listScenarioRelations('pfs-s01-01')).resolves.toHaveLength(1)
    await service.importScenarioPackageAtomically({ records: [], npcLinks: [], relations: [], replaceRelationKinds: ['lieu', 'region'], package: packageInput })
    await expect(service.listScenarioRelations('pfs-s01-01')).resolves.toEqual([])
  })

  it('claims one scenario deployment atomically and records only a successful deployed version', async () => {
    const service = await open()
    const packageInput = { scenarioId: 'pfs-s01-09', packageVersion: 3, status: 'integrated' as const, filename: 'pfs-s01-09.zip', manifest: {} }
    await service.importScenarioPackageAtomically({ records: [], npcLinks: [], relations: [], replaceRelationKinds: [], package: packageInput })
    const queued = await service.enqueueScenarioDeployment('pfs-s01-09', 3)
    expect(queued.status).toBe('pending')
    const [first, second] = await Promise.all([service.claimScenarioDeployment('world-a', 'gm-a'), service.claimScenarioDeployment('world-b', 'gm-b')])
    const claimed = first ?? second
    expect(claimed).toEqual(expect.objectContaining({ id: queued.id, status: 'claimed', scenarioId: 'pfs-s01-09', packageVersion: 3 }))
    expect(first && second).toBeNull()
    await service.finishScenarioDeployment(queued.id, claimed!.claimToken!, { deploymentId: queued.id, scenarioId: 'pfs-s01-09', packageVersion: 3, success: true, actors: {}, scenes: {}, journals: {}, errors: [] })
    await expect(service.getScenarioPackage('pfs-s01-09')).resolves.toEqual(expect.objectContaining({ status: 'deployed', deployedVersion: 3 }))
    const repeat = await service.enqueueScenarioDeployment('pfs-s01-09', 3)
    expect(repeat).toEqual(expect.objectContaining({ id: queued.id, status: 'success' }))
  })

  it('reclaims an expired lease and keeps the prior package state after a failure', async () => {
    const service = await open()
    const packageInput = { scenarioId: 'pfs-s01-10', packageVersion: 2, status: 'integrated' as const, filename: 'pfs-s01-10.zip', manifest: {} }
    await service.importScenarioPackageAtomically({ records: [], npcLinks: [], relations: [], replaceRelationKinds: [], package: packageInput })
    const queued = await service.enqueueScenarioDeployment('pfs-s01-10', 2)
    const abandoned = await service.claimScenarioDeployment('world-a', 'gm-a', -1)
    const reclaimed = await service.claimScenarioDeployment('world-b', 'gm-b')
    expect(reclaimed).toEqual(expect.objectContaining({ id: queued.id, status: 'claimed', claimedBy: 'gm-b' }))
    expect(reclaimed!.claimToken).not.toBe(abandoned!.claimToken)
    await service.finishScenarioDeployment(queued.id, reclaimed!.claimToken!, { deploymentId: queued.id, scenarioId: 'pfs-s01-10', packageVersion: 2, success: false, actors: {}, scenes: {}, journals: {}, errors: ['Foundry hors ligne'] })
    await expect(service.getScenarioPackage('pfs-s01-10')).resolves.toEqual(expect.objectContaining({ status: 'integrated', deployedVersion: null }))
    await expect(service.getScenarioDeployment(queued.id)).resolves.toEqual(expect.objectContaining({ status: 'failed', error: 'Foundry hors ligne' }))
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
