import AdmZip from 'adm-zip'
import { ScenarioPreparationService } from './ScenarioPreparationService'

describe('ScenarioPreparationService', () => {
  const pdfAsset = {
    id: 'pdf-1',
    filename: 'Scenario.pdf',
    path: 'PFS/Scenario.pdf',
    assetType: 'pdf',
    targetId: 'scenario-1',
    targetKind: 'item',
    role: 'scenario_pfs',
    language: 'en',
    variant: null,
    completeness: 'complete',
    translationOf: null,
    associationStatus: 'associé',
    associationScore: null,
    evidence: [],
    metadata: {},
    present: true,
    lastSeenAt: null,
    sortOrder: 1,
    resourceTargetId: 'scenario-1',
    resourceScope: 'direct',
    resourceTargetLabel: 'Scenario',
    libraryCategory: null
  }

  const defaultCuration = { schemaVersion: 4, byId: { 'scenario-1': { preparationStatus: 'selected' } } }
  const defaultRegistry = [{ id: 'scenario-1', name: 'Scenario', parentId: null, kind: 'pfs-scenario', order: 1 }]
  const defaultCatalogue = { entries: [{ id: 'scenario-1', kind: 'pfs-scenario', titleOriginal: 'Scenario' }] }

  const pf2: any = {
    readCuration: jest.fn(async () => defaultCuration),
    libraryAssetsForScenario: jest.fn(async () => [pdfAsset]),
    readIndexedScenarioPdf: jest.fn(async () => ({ asset: pdfAsset, bytes: Buffer.from('%PDF-test') })),
    catalogue: jest.fn(async () => defaultCatalogue)
  }

  const packages: any = {
    scenarioRegistry: jest.fn(async () => defaultRegistry),
    scenarioExport: jest.fn(async (id: string) => ({ scenario: { id }, npcs: [], places: [], factions: [], events: [], scenarioDependencies: { dependencies: [], dependents: [] } })),
    packageRegistry: jest.fn(async () => ({ npcs: [], places: [], factions: [], events: [] })),
    packageForScenario: jest.fn(async () => null),
    importZip: jest.fn(async (_bytes: Buffer, name: string) => ({ scenarioId: name.replace(/\.zip$/i, ''), packageVersion: 1, state: 'integrated', npcs: [] })),
    dependenciesForScenario: jest.fn(async () => ({ dependencies: [], dependents: [] })),
    replaceDependenciesForScenario: jest.fn(async () => ({ dependencies: [], dependents: [] }))
  }

  beforeEach(() => {
    jest.clearAllMocks()
    pf2.readCuration.mockResolvedValue(defaultCuration)
    pf2.libraryAssetsForScenario.mockResolvedValue([pdfAsset])
    pf2.readIndexedScenarioPdf.mockResolvedValue({ asset: pdfAsset, bytes: Buffer.from('%PDF-test') })
    pf2.catalogue.mockResolvedValue(defaultCatalogue)
    packages.scenarioRegistry.mockResolvedValue(defaultRegistry)
    packages.scenarioExport.mockImplementation(async (id: string) => ({ scenario: { id }, npcs: [], places: [], factions: [], events: [], scenarioDependencies: { dependencies: [], dependents: [] } }))
    packages.packageRegistry.mockResolvedValue({ npcs: [], places: [], factions: [], events: [] })
    packages.packageForScenario.mockResolvedValue(null)
    packages.importZip.mockImplementation(async (_bytes: Buffer, name: string) => ({ scenarioId: name.replace(/\.zip$/i, ''), packageVersion: 1, state: 'integrated', npcs: [] }))
    packages.dependenciesForScenario.mockResolvedValue({ dependencies: [], dependents: [] })
    packages.replaceDependenciesForScenario.mockResolvedValue({ dependencies: [], dependents: [] })
  })

  it('builds a selected scenario AI task ZIP with the real PDF and registries', async () => {
    const service = new ScenarioPreparationService(pf2, packages)
    const output = await service.exportTaskZip('scenario-1')
    const zip = new AdmZip(output.bytes)
    const names = zip.getEntries().map((entry) => entry.entryName)

    expect(output.filename).toBe('scenario-1-ai-task.zip')
    expect(names).toEqual(expect.arrayContaining([
      'TASK.md',
      'target.json',
      'documents.json',
      'package-registry.json',
      'scenario-registry.json',
      'existing-relations.json',
      'catalogue-context.json',
      'contract/SCENARIO_PACKAGE_FORMAT.md',
      'docs/01-Scenario.pdf'
    ]))

    expect(zip.readAsText('TASK.md')).toContain('scenario.id = "scenario-1"')
    expect(zip.readAsText('TASK.md')).toContain('packageFormatVersion = 4')
    expect(zip.readAsText('TASK.md')).toContain('level + ac + hp')
    expect(zip.readAsText('TASK.md')).toContain('grid.paddingCells = 1')
    expect(zip.readAsText('TASK.md')).toContain('contact:pen-pen')
    expect(zip.readAsText('TASK.md')).toContain('unresolved-actors.json')
    expect(zip.readAsText('TASK.md')).toContain('unresolved-maps.json')
    expect(JSON.parse(zip.readAsText('target.json'))).toMatchObject({ taskFormatVersion: 6, taskKind: 'scenario', scenarioId: 'scenario-1', preparationStatus: 'selected', nextPackageVersion: 1 })
    expect(JSON.parse(zip.readAsText('documents.json'))[0]).toMatchObject({ id: 'pdf-1', includedAs: 'docs/01-Scenario.pdf' })
    expect(pf2.readIndexedScenarioPdf).toHaveBeenCalledWith('scenario-1', 'pdf-1')
  })

  it('builds a campaign AI task ZIP with all child targets but one deduplicated PDF copy', async () => {
    pf2.readCuration.mockResolvedValue({ schemaVersion: 4, byId: { 'campaign-1': { preparationStatus: 'selected' } } })
    pf2.catalogue.mockResolvedValue({ entries: [{ id: 'campaign-1', kind: 'campaign', titleFr: 'Campagne 1', parts: [{ id: 'scenario-1' }, { id: 'scenario-2' }] }] })
    packages.scenarioRegistry.mockResolvedValue([
      { id: 'scenario-1', name: 'Scénario 1', parentId: 'campaign-1', kind: 'volume_aventure', order: 1 },
      { id: 'scenario-2', name: 'Scénario 2', parentId: 'campaign-1', kind: 'volume_aventure', order: 2 }
    ])
    packages.packageForScenario.mockImplementation(async (id: string) => id === 'scenario-1' ? { packageVersion: 2 } : null)

    const service = new ScenarioPreparationService(pf2, packages)
    const output = await service.exportTaskZip('campaign-1')
    const zip = new AdmZip(output.bytes)
    const names = zip.getEntries().map((entry) => entry.entryName)

    expect(output.filename).toBe('campaign-1-ai-task.zip')
    expect(names).toEqual(expect.arrayContaining([
      'TASK.md',
      'target.json',
      'targets.json',
      'documents.json',
      'package-registry.json',
      'scenario-registry.json',
      'existing-relations.json',
      'catalogue-context.json',
      'contract/SCENARIO_PACKAGE_FORMAT.md',
      'contract/CAMPAIGN_RESPONSE_FORMAT.md',
      'docs/01-Scenario.pdf'
    ]))
    expect(names.filter((name) => name.startsWith('docs/'))).toHaveLength(1)

    expect(JSON.parse(zip.readAsText('target.json'))).toMatchObject({ taskFormatVersion: 6, taskKind: 'campaign', campaignId: 'campaign-1', preparationStatus: 'selected', childCount: 2 })
    expect(JSON.parse(zip.readAsText('targets.json'))).toEqual([
      expect.objectContaining({ target: expect.objectContaining({ id: 'scenario-1' }), nextPackageVersion: 3 }),
      expect.objectContaining({ target: expect.objectContaining({ id: 'scenario-2' }), nextPackageVersion: 1 })
    ])
    expect(zip.readAsText('TASK.md')).toContain('packages/<scenario-id>.zip')
    expect(zip.readAsText('TASK.md')).toContain('packageFormatVersion = 4')
    expect(zip.readAsText('TASK.md')).toContain('La taille de la campagne n’autorise pas à simplifier les statblocks')
    expect(zip.readAsText('TASK.md')).toContain('Ne crée pas de package Foundry pour `campaign-1` lui-même')
    expect(packages.scenarioExport).toHaveBeenCalledWith('campaign-1')
    expect(packages.scenarioExport).toHaveBeenCalledWith('scenario-1')
    expect(packages.scenarioExport).toHaveBeenCalledWith('scenario-2')
    expect(pf2.readIndexedScenarioPdf).toHaveBeenCalledWith('campaign-1', 'pdf-1')
  })

  it('imports a campaign AI response in child order, preserves package links and merges dependency proposals', async () => {
    pf2.catalogue.mockResolvedValue({ entries: [{ id: 'campaign-1', kind: 'campaign', titleFr: 'Campagne 1', parts: [{ id: 'scenario-1' }, { id: 'scenario-2' }] }] })
    packages.scenarioRegistry.mockResolvedValue([
      { id: 'scenario-1', name: 'Scénario 1', parentId: 'campaign-1', kind: 'volume_aventure', order: 1 },
      { id: 'scenario-2', name: 'Scénario 2', parentId: 'campaign-1', kind: 'volume_aventure', order: 2 },
      { id: 'outside', name: 'Hors campagne', parentId: null, kind: 'pfs-scenario', order: 3 }
    ])
    packages.inspectZip = jest.fn((bytes: Buffer) => {
      const child = new AdmZip(bytes)
      const manifest = JSON.parse(child.readAsText('scenario.json'))
      return { zip: child, manifest, scenarioId: manifest.scenario.id, scenarioName: manifest.scenario.name, packageVersion: manifest.packageVersion }
    })
    packages.importZip.mockImplementation(async (_bytes: Buffer, name: string, options: unknown) => ({ scenarioId: name.replace(/\.zip$/i, ''), packageVersion: 1, state: options ? 'integrated' : 'unchanged', npcs: [] }))
    packages.dependenciesForScenario.mockImplementation(async (id: string) => id === 'scenario-2' ? { dependencies: [{ scenarioId: 'scenario-2', dependsOnScenarioId: 'outside', relationType: 'recommended', source: 'existant' }], dependents: [] } : { dependencies: [], dependents: [] })

    const childZip = (id: string) => { const child = new AdmZip(); child.addFile('scenario.json', Buffer.from(JSON.stringify({ packageVersion: 1, scenario: { id, name: id }, npcs: [], actors: [] }))); return child.toBuffer() }
    const response = new AdmZip()
    response.addFile('campaign-response.json', Buffer.from(JSON.stringify({ formatVersion: 1, campaignId: 'campaign-1', packages: [{ scenarioId: 'scenario-1', file: 'packages/scenario-1.zip' }, { scenarioId: 'scenario-2', file: 'packages/scenario-2.zip' }] })))
    response.addFile('packages/scenario-1.zip', childZip('scenario-1'))
    response.addFile('packages/scenario-2.zip', childZip('scenario-2'))
    response.addFile('analysis/scenario-dependencies.json', Buffer.from(JSON.stringify([{ scenarioId: 'scenario-2', dependsOnScenarioId: 'scenario-1', relationType: 'required', sourcePage: '12', notes: 'Suite explicite' }])))

    const service = new ScenarioPreparationService(pf2, packages)
    const result = await service.importCampaignResponseZip('campaign-1', response.toBuffer(), 'campaign-response.zip')

    expect(result).toMatchObject({ campaignId: 'campaign-1', packageCount: 2, dependencyCount: 1 })
    expect(packages.importZip).toHaveBeenNthCalledWith(1, expect.any(Buffer), 'scenario-1.zip', { preserveExistingBusinessLinks: true })
    expect(packages.importZip).toHaveBeenNthCalledWith(2, expect.any(Buffer), 'scenario-2.zip', { preserveExistingBusinessLinks: true })
    expect(packages.replaceDependenciesForScenario).toHaveBeenCalledWith('scenario-2', expect.arrayContaining([
      expect.objectContaining({ dependsOnScenarioId: 'outside', relationType: 'recommended' }),
      expect.objectContaining({ dependsOnScenarioId: 'scenario-1', relationType: 'required' })
    ]))
  })

  it('refuses an unselected target', async () => {
    pf2.readCuration.mockResolvedValueOnce({ schemaVersion: 4, byId: {} })
    const service = new ScenarioPreparationService(pf2, packages)
    await expect(service.exportTaskZip('scenario-1')).rejects.toThrow('Sélectionné')
  })
})
