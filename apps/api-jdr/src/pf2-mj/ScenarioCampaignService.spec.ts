import { ScenarioCampaignService } from './ScenarioCampaignService'

describe('ScenarioCampaignService', () => {
  const persistence = {
    getCatalogueEntity: jest.fn(), getScenarioPackage: jest.fn(), getLatestScenarioDeployment: jest.fn(), getLatestSuccessfulScenarioDeployment: jest.fn(), previewScenarioApplicationReset: jest.fn(), sharedNpcIdsForScenarioReset: jest.fn(), clearScenarioPreparationStatus: jest.fn()
  }
  const packages = { scenarioRegistry: jest.fn(), requestDeployment: jest.fn(), requestReset: jest.fn(), resetApplicationScenario: jest.fn() }
  beforeEach(() => {
    jest.clearAllMocks()
    persistence.getCatalogueEntity.mockResolvedValue({ id: 'campaign-1', kind: 'campaign', titleFr: 'Campagne 1' })
    packages.scenarioRegistry.mockResolvedValue([{ id: 's1', name: 'Aventure 1', parentId: 'campaign-1', kind: 'volume_aventure', order: 1 }, { id: 's2', name: 'Aventure 2', parentId: 'campaign-1', kind: 'volume_aventure', order: 2 }])
    persistence.getScenarioPackage.mockImplementation(async (id: string) => id === 's1' ? { scenarioId: id, packageVersion: 2, status: 'obsolete', deployedVersion: 1 } : { scenarioId: id, packageVersion: 2, status: 'deployed', deployedVersion: 2 })
    persistence.getLatestScenarioDeployment.mockResolvedValue(null)
    persistence.getLatestSuccessfulScenarioDeployment.mockResolvedValue(null)
    persistence.previewScenarioApplicationReset.mockResolvedValue({ scenarioIds: ['s1','s2'], packages: 2, deployments: 4, scopedRecords: 3, scopedRecordsByKind: { pnj: 3 }, preservedNpcLinks: 5, preservedRelations: 2 })
    persistence.sharedNpcIdsForScenarioReset.mockResolvedValue(['npc-shared'])
    packages.requestDeployment.mockImplementation(async (scenarioId: string, options: any) => ({ id: `d-${scenarioId}`, scenarioId, packageVersion: 2, status: 'pending', ...options }))
    packages.requestReset.mockImplementation(async (scenarioId: string) => ({ id: `r-${scenarioId}`, scenarioId, packageVersion: 0, status: 'pending', operation: 'reset' }))
    packages.resetApplicationScenario.mockResolvedValue({})
    persistence.clearScenarioPreparationStatus.mockResolvedValue(undefined)
  })
  it('shows app and Foundry versions for every child', async () => {
    const service = new ScenarioCampaignService(persistence as never, packages as never)
    const status = await service.status('campaign-1') as any
    expect(status.summary).toMatchObject({ total: 2, integrated: 2, synchronized: 1 })
    expect(status.children[0]).toMatchObject({ scenarioId: 's1', appVersion: 2, foundryVersion: 1, upToDate: false })
  })
  it('queues only outdated children for a campaign sync', async () => {
    const service = new ScenarioCampaignService(persistence as never, packages as never)
    const result = await service.synchronize('campaign-1') as any
    expect(result.queued).toHaveLength(1)
    expect(packages.requestDeployment).toHaveBeenCalledWith('s1', expect.objectContaining({ operation: 'deploy', batchSequence: 1 }))
  })
  it('keeps Foundry history on an application-only reset and clears the campaign preparation state', async () => {
    const service = new ScenarioCampaignService(persistence as never, packages as never)
    const result = await service.reset('campaign-1', { mode: 'app', confirm: 'Réinitialiser Campagne 1' }) as any
    expect(result.state).toBe('done')
    expect(packages.resetApplicationScenario).toHaveBeenNthCalledWith(1, 's1', ['campaign-1', 's1', 's2'], false)
    expect(persistence.clearScenarioPreparationStatus).toHaveBeenCalledWith('campaign-1')
  })

  it('requires exact destructive confirmation and queues one reset per child', async () => {
    const service = new ScenarioCampaignService(persistence as never, packages as never)
    await expect(service.reset('campaign-1', { mode: 'all', confirm: 'non' })).rejects.toThrow('Confirmation invalide')
    const result = await service.reset('campaign-1', { mode: 'all', confirm: 'Réinitialiser Campagne 1' }) as any
    expect(result.queued).toHaveLength(2)
    expect(persistence.clearScenarioPreparationStatus).toHaveBeenCalledWith('campaign-1')
    expect(packages.requestReset).toHaveBeenNthCalledWith(1, 's1', expect.objectContaining({ cleanupApp: true, preserveNpcIds: ['npc-shared'], resetScopeIds: ['campaign-1', 's1', 's2'] }), expect.any(String), 1)
  })
})
