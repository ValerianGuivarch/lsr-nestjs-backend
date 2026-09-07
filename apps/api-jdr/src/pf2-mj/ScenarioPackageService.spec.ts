import AdmZip from 'adm-zip'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ScenarioPackageService } from './ScenarioPackageService'

describe('ScenarioPackageService', () => {
  let root: string
  const records = new Map<string, Record<string, unknown>>()
  const packages = new Map<string, Record<string, unknown>>()
  let relations: Array<Record<string, unknown>> = []
  const persistence: any = {
    storageRoot: '',
    getRecord: jest.fn(async (kind: string, id: string) => records.get(`${kind}:${id}`) ?? null),
    getScenarioPackage: jest.fn(async (id: string) => packages.get(id) ?? null),
    saveScenarioPackage: jest.fn(async (value: Record<string, unknown>) => { packages.set(String(value.scenarioId), { ...value, importedAt: '', updatedAt: '' }) }),
    importScenarioPackageAtomically: jest.fn(async (input: any) => {
      for (const record of input.records) records.set(`${record.kind}:${record.item.id}`, record.item)
      relations = input.relations
      packages.set(String(input.package.scenarioId), { ...input.package, importedAt: '', updatedAt: '' })
    }),
    listScenarioNpcLinks: jest.fn(async () => []),
    listScenarioRelations: jest.fn(async () => relations),
    listRecords: jest.fn(async () => []),
    listCatalogueEntries: jest.fn(async () => []),
    getCatalogueEntity: jest.fn(async (id: string) => ({ id, kind: 'scenario', titleFr: 'Scénario test' })),
    previewScenarioApplicationReset: jest.fn(async (ids: string[]) => ({ scenarioIds: ids, packages: 1, deployments: 2, scopedRecords: 3, scopedRecordsByKind: { pnj: 3 }, preservedNpcLinks: 2, preservedRelations: 1 })),
    sharedNpcIdsForScenarioReset: jest.fn(async () => ['npc-shared']),
    getLatestScenarioDeployment: jest.fn(async () => null),
    getLatestSuccessfulScenarioDeployment: jest.fn(async () => null),
    resetScenarioApplicationState: jest.fn(async (scenarioId: string) => ({ scenarioIds: [scenarioId], packages: 1, deployments: 2, scopedRecords: 3, scopedRecordsByKind: { pnj: 3 }, preservedNpcLinks: 2, preservedRelations: 1 })),
    enqueueScenarioDeployment: jest.fn(async (scenarioId: string, packageVersion: number, options: any) => ({ id: 'reset-1', scenarioId, packageVersion, status: 'pending', operation: options?.operation ?? 'deploy', payload: options?.payload ?? null, batchId: options?.batchId ?? null, batchSequence: options?.batchSequence ?? null }))
  }

  beforeEach(async () => { root = await mkdtemp(join(tmpdir(), 'pf2-package-')); persistence.storageRoot = root; records.clear(); packages.clear(); relations = []; jest.clearAllMocks() })
  afterEach(async () => { await rm(root, { recursive: true, force: true }) })

  const zip = (manifest: Record<string, unknown>) => { const archive = new AdmZip(); archive.addFile('scenario.json', Buffer.from(JSON.stringify(manifest))); return archive.toBuffer() }

  it('accepts an old package and resolves new and existing business entities without duplicates', async () => {
    const service = new ScenarioPackageService(persistence)
    records.set('faction:faction-aspis', { id: 'faction-aspis', nom: 'Aspis' })
    await service.importZip(zip({ scenario: { id: 'pfs-s01-01', name: 'Test' }, actors: [], npcs: [] }), 'old.zip')
    expect(relations).toEqual([])
    const body = { packageVersion: 2, scenario: { id: 'pfs-s01-01', name: 'Test' }, actors: [], npcs: [{ key: 'vara', name: 'Capitaine Vara' }], places: [{ key: 'quantium', kind: 'lieu', name: 'Quantium', type: 'Cité', parent_id: 'region-nex', region_id: 'region-nex', role: 'Lieu principal' }], factions: [{ key: 'aspis', factionId: 'faction-aspis' }], events: [] }
    await service.importZip(zip(body), 'v2.zip')
    expect(records.get('lieu:pfs-s01-01--quantium')).toEqual(expect.objectContaining({ nom: 'Quantium', type: 'Cité', parent_id: 'region-nex', region_id: 'region-nex', scope: 'scenario', ownerScenarioId: 'pfs-s01-01' }))
    expect(records.get('pnj:pfs-s01-01--vara')).toEqual(expect.objectContaining({ nom: 'Capitaine Vara', scope: 'scenario', ownerScenarioId: 'pfs-s01-01' }))
    expect(records.get('faction:faction-aspis')).toEqual({ id: 'faction-aspis', nom: 'Aspis' })
    expect(relations).toHaveLength(2)
    await service.importZip(zip(body), 'v2.zip')
    expect([...records.keys()].filter(key => key === 'lieu:pfs-s01-01--quantium')).toHaveLength(1)
  })

  it('exposes only playable units in the scenario registry', async () => {
    const service = new ScenarioPackageService(persistence)

    persistence.listCatalogueEntries.mockResolvedValueOnce([
      {
        id: 'campaign',
        kind: 'campaign',
        titleFr: 'Campagne',
        parts: [
          {
            id: 'campaign-guide',
            kind: 'guide_joueurs',
            titleFr: 'Guide'
          },
          {
            id: 'campaign-volume',
            kind: 'compilation_campagne',
            titleFr: 'Compilation'
          },
          {
            id: 'campaign-adventure-1',
            kind: 'volume_aventure',
            titleFr: 'Aventure 1',
            sequence: 1
          },
          {
            id: 'campaign-adventure-2',
            kind: 'volume_aventure',
            titleFr: 'Aventure 2',
            sequence: 2
          },
          {
            id: 'campaign-map',
            kind: 'cartes_interactives',
            titleFr: 'Cartes'
          }
        ]
      },
      {
        id: 'pfs-scenario',
        kind: 'pfs-scenario',
        titleFr: 'Scénario PFS'
      }
    ])

    const registry = await service.scenarioRegistry()

    expect(registry.map(item => item.id)).toEqual([
      'campaign-adventure-1',
      'campaign-adventure-2',
      'pfs-scenario'
    ])

    expect(registry).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'campaign-guide' }),
        expect.objectContaining({ id: 'campaign-volume' }),
        expect.objectContaining({ id: 'campaign-map' })
      ])
    )
  })

  it('stores roleplay for new PNJs and fills only an empty roleplay on existing PNJs', async () => {
    const service = new ScenarioPackageService(persistence)
    records.set('pnj:npc-empty', { id: 'npc-empty', nom: 'Vide', roleplay: '' })
    records.set('pnj:npc-curated', { id: 'npc-curated', nom: 'Curaté', roleplay: 'Texte MJ à conserver.' })

    await service.importZip(zip({
      packageVersion: 1,
      scenario: { id: 'scenario-roleplay', name: 'Roleplay' },
      actors: [],
      npcs: [
        { key: 'new', name: 'Nouveau', roleplay: 'Jovial mais méfiant quand on parle travail.' },
        { key: 'empty', npcId: 'npc-empty', roleplay: 'Prudent et posé.' },
        { key: 'curated', npcId: 'npc-curated', roleplay: 'Ne doit pas remplacer.' }
      ]
    }), 'roleplay.zip')

    expect(records.get('pnj:scenario-roleplay--new')).toEqual(expect.objectContaining({ roleplay: 'Jovial mais méfiant quand on parle travail.' }))
    expect(records.get('pnj:npc-empty')).toEqual(expect.objectContaining({ roleplay: 'Prudent et posé.' }))
    expect(records.get('pnj:npc-curated')).toEqual(expect.objectContaining({ roleplay: 'Texte MJ à conserver.' }))
  })

  it('can preserve existing business links during a campaign response import', async () => {
    const service = new ScenarioPackageService(persistence)
    records.set('pnj:npc-old', { id: 'npc-old', nom: 'Ancien PNJ' })
    records.set('lieu:lieu-old', { id: 'lieu-old', nom: 'Ancien lieu' })
    persistence.listScenarioNpcLinks.mockResolvedValueOnce([{ scenarioId: 'scenario-merge', npcId: 'npc-old', role: 'Existant', importance: null, sourcePage: null, notes: null }])
    relations = [{ scenarioId: 'scenario-merge', targetKind: 'lieu', targetId: 'lieu-old', role: 'Existant', importance: null, sourcePage: null, notes: null }]

    await service.importZip(zip({ packageVersion: 1, scenario: { id: 'scenario-merge', name: 'Fusion' }, npcs: [{ key: 'new', name: 'Nouveau PNJ' }], places: [{ key: 'new-place', kind: 'lieu', name: 'Nouveau lieu' }], actors: [] }), 'merge.zip', { preserveExistingBusinessLinks: true })

    const call = persistence.importScenarioPackageAtomically.mock.calls.at(-1)?.[0]
    expect(call.npcLinks).toEqual(expect.arrayContaining([
      expect.objectContaining({ npcId: 'npc-old' }),
      expect.objectContaining({ npcId: 'scenario-merge--new' })
    ]))
    expect(call.relations).toEqual(expect.arrayContaining([
      expect.objectContaining({ targetId: 'lieu-old' }),
      expect.objectContaining({ targetId: 'scenario-merge--new-place' })
    ]))
  })

  it('rejects an unknown explicit id', async () => {
    const service = new ScenarioPackageService(persistence)
    await expect(service.importZip(zip({ scenario: { id: 'pfs-s01-02', name: 'Test' }, actors: [], npcs: [], places: [{ key: 'x', refId: 'lieu-inconnu' }] }), 'bad.zip')).rejects.toThrow('lieu inconnu')
  })

  it('inspects an indexed ZIP without importing it', () => {
    const service = new ScenarioPackageService(persistence)
    const info = service.inspectZip(zip({ packageVersion: 4, scenario: { id: 'pfs-s01-03', name: 'Package trouvé' }, npcs: [] }))
    expect(info).toMatchObject({ scenarioId: 'pfs-s01-03', scenarioName: 'Package trouvé', packageVersion: 4 })
    expect(persistence.importScenarioPackageAtomically).not.toHaveBeenCalled()
  })

  it('rejects a v4 custom statblock reduced to a level placeholder', () => {
    const service = new ScenarioPackageService(persistence)
    expect(() => service.inspectZip(zip({
      packageFormatVersion: 4,
      packageVersion: 1,
      scenario: { id: 'v4-bad-actor', name: 'Bad actor' },
      npcs: [],
      actors: [{ key: 'boss', name: 'Boss', type: 'custom', data: { mode: 'statblock', level: 5 } }]
    }))).toThrow(/Package v4 invalide[\s\S]*data\.ac[\s\S]*niveau\/CA\/PV/)
  })

  it('accepts a minimally complete v4 custom statblock', () => {
    const service = new ScenarioPackageService(persistence)
    const info = service.inspectZip(zip({
      packageFormatVersion: 4,
      packageVersion: 1,
      scenario: { id: 'v4-good-actor', name: 'Good actor' },
      npcs: [],
      actors: [{
        key: 'boss', name: 'Boss', type: 'custom', data: {
          mode: 'statblock', level: 5, ac: 22, hp: 70, perception: 12,
          saves: { fortitude: 13, reflex: 10, will: 11 }, speed: 25, skills: {},
          attacks: [{ name: 'Strike', bonus: 14, damage: [{ formula: '1d8+6', type: 'slashing' }] }]
        }
      }]
    }))
    expect(info).toMatchObject({ scenarioId: 'v4-good-actor', packageVersion: 1 })
  })

  it('rejects a v4 square map without measured complete-cell bounds', () => {
    const service = new ScenarioPackageService(persistence)
    expect(() => service.inspectZip(zip({
      packageFormatVersion: 4,
      packageVersion: 1,
      scenario: { id: 'v4-bad-map', name: 'Bad map' },
      npcs: [], actors: [],
      maps: [{ key: 'map', name: 'Map', image: 'assets/maps/map.webp', grid: { type: 'square', size: 100, distance: 5 } }]
    }))).toThrow(/Package v4 invalide[\s\S]*columns[\s\S]*rows[\s\S]*paddingCells/)
  })

  it('keeps legacy level-only packages readable when packageFormatVersion is absent', () => {
    const service = new ScenarioPackageService(persistence)
    const info = service.inspectZip(zip({
      packageVersion: 2,
      scenario: { id: 'legacy-placeholder', name: 'Legacy' },
      npcs: [],
      actors: [{ key: 'boss', name: 'Boss', type: 'custom', data: { level: 5 } }]
    }))
    expect(info).toMatchObject({ scenarioId: 'legacy-placeholder', packageVersion: 2 })
  })


  // PF2_SCENARIO_RESET_V1
  it('previews an individual scenario reset and protects NPCs reused elsewhere', async () => {
    const service = new ScenarioPackageService(persistence)
    persistence.getLatestSuccessfulScenarioDeployment.mockResolvedValueOnce({
      id: 'deploy-1',
      scenarioId: 'scenario-reset',
      packageVersion: 4,
      status: 'success',
      operation: 'deploy',
      completedAt: '2026-09-05T08:00:00.000Z',
      result: {
        actors: { total: 6 },
        scenes: { total: 2 },
        journals: { imported: true }
      }
    })

    const preview = await service.scenarioResetPreview('scenario-reset')
    expect(preview).toMatchObject({
      scenarioId: 'scenario-reset',
      name: 'Scénario test',
      confirmationText: 'Réinitialiser Scénario test',
      foundryKnown: { version: 4, actors: 6, scenes: 2, journals: 1, state: 'present' },
      preserveNpcIds: ['npc-shared']
    })
  })

  it('resets only the application while keeping Foundry deployment history', async () => {
    const service = new ScenarioPackageService(persistence)
    const result = await service.resetScenario('scenario-reset', {
      mode: 'app',
      confirm: 'Réinitialiser Scénario test'
    })

    expect(result).toMatchObject({ scenarioId: 'scenario-reset', mode: 'app', state: 'done' })
    expect(persistence.resetScenarioApplicationState).toHaveBeenCalledWith('scenario-reset', ['scenario-reset'], false)
    expect(persistence.enqueueScenarioDeployment).not.toHaveBeenCalled()
  })

  it('queues a full individual reset with shared-NPC protection', async () => {
    const service = new ScenarioPackageService(persistence)
    const result = await service.resetScenario('scenario-reset', {
      mode: 'all',
      confirm: 'Réinitialiser Scénario test'
    })

    expect(result).toMatchObject({ scenarioId: 'scenario-reset', mode: 'all', state: 'queued' })
    expect(persistence.enqueueScenarioDeployment).toHaveBeenCalledWith(
      'scenario-reset',
      0,
      expect.objectContaining({
        operation: 'reset',
        payload: {
          cleanupApp: true,
          preserveNpcIds: ['npc-shared'],
          resetScopeIds: ['scenario-reset']
        },
        batchSequence: 1
      })
    )
  })

})
