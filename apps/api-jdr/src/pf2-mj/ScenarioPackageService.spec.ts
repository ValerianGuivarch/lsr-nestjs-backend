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
    listRecords: jest.fn(async () => [])
  }

  beforeEach(async () => { root = await mkdtemp(join(tmpdir(), 'pf2-package-')); persistence.storageRoot = root; records.clear(); packages.clear(); relations = []; jest.clearAllMocks() })
  afterEach(async () => { await rm(root, { recursive: true, force: true }) })

  const zip = (manifest: Record<string, unknown>) => { const archive = new AdmZip(); archive.addFile('scenario.json', Buffer.from(JSON.stringify(manifest))); return archive.toBuffer() }

  it('accepts an old package and resolves new and existing business entities without duplicates', async () => {
    const service = new ScenarioPackageService(persistence)
    records.set('faction:faction-aspis', { id: 'faction-aspis', nom: 'Aspis' })
    await service.importZip(zip({ scenario: { id: 'pfs-s01-01', name: 'Test' }, actors: [], npcs: [] }), 'old.zip')
    expect(relations).toEqual([])
    const body = { packageVersion: 2, scenario: { id: 'pfs-s01-01', name: 'Test' }, actors: [], npcs: [], places: [{ key: 'quantium', kind: 'lieu', name: 'Quantium', type: 'Cité', parent_id: 'region-nex', region_id: 'region-nex', role: 'Lieu principal' }], factions: [{ key: 'aspis', factionId: 'faction-aspis' }], events: [] }
    await service.importZip(zip(body), 'v2.zip')
    expect(records.get('lieu:pfs-s01-01--quantium')).toEqual(expect.objectContaining({ nom: 'Quantium', type: 'Cité', parent_id: 'region-nex', region_id: 'region-nex' }))
    expect(relations).toHaveLength(2)
    await service.importZip(zip(body), 'v2.zip')
    expect([...records.keys()].filter(key => key === 'lieu:pfs-s01-01--quantium')).toHaveLength(1)
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
})
