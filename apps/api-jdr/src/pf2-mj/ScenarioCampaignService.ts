import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { Pf2PersistenceService, ScenarioDeployment, ScenarioResetPreview } from '../pf2-storage/Pf2PersistenceService'
import { ScenarioPackageService } from './ScenarioPackageService'

type CampaignChild = { id: string; name: string; order: number | null }
type CampaignResetPreview = {
  campaignId: string
  name: string
  confirmationText: string
  children: CampaignChild[]
  application: ScenarioResetPreview
  foundryKnown: { actors: number; scenes: number; journals: number; note: string }
  preserveNpcIds: string[]
}

@Injectable()
export class ScenarioCampaignService {
  constructor(private readonly persistence: Pf2PersistenceService, private readonly packages: ScenarioPackageService) {}

  private async campaign(campaignId: string): Promise<{ id: string; name: string; children: CampaignChild[] }> {
    const [entry, registry] = await Promise.all([this.persistence.getCatalogueEntity(campaignId), this.packages.scenarioRegistry()])
    if (!entry || entry.kind !== 'campaign') throw new Error(`Campagne inconnue : ${campaignId}.`)
    const children = registry.filter((item) => item.parentId === campaignId).sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, 'fr')).map((item) => ({ id: item.id, name: item.name, order: item.order }))
    if (!children.length) throw new Error('Cette campagne ne contient aucune unité jouable explicite.')
    const name = [entry.titleFr, entry.title, entry.name, entry.titleOriginal, campaignId].find((value) => typeof value === 'string' && value.trim())
    return { id: campaignId, name: typeof name === 'string' ? name.trim() : campaignId, children }
  }

  async status(campaignId: string): Promise<Record<string, unknown>> {
    const campaign = await this.campaign(campaignId)
    const children = await Promise.all(campaign.children.map(async (child) => {
      const [packageStatus, deployment, lastSuccessfulDeploy] = await Promise.all([this.persistence.getScenarioPackage(child.id), this.persistence.getLatestScenarioDeployment(child.id), this.persistence.getLatestSuccessfulScenarioDeployment(child.id)])
      const appVersion = packageStatus?.packageVersion ?? null
      const resetCompletedAfterDeploy = deployment?.operation === 'reset' && deployment.status === 'success'
      const foundryVersion = resetCompletedAfterDeploy ? null : packageStatus?.deployedVersion ?? lastSuccessfulDeploy?.packageVersion ?? null
      return { scenarioId: child.id, name: child.name, order: child.order, package: packageStatus, latestDeployment: deployment, appVersion, foundryVersion, upToDate: appVersion !== null && foundryVersion === appVersion && packageStatus?.status === 'deployed' }
    }))
    return { campaignId: campaign.id, name: campaign.name, children, summary: { total: children.length, integrated: children.filter((child) => child.appVersion !== null).length, synchronized: children.filter((child) => child.upToDate).length, pending: children.filter((child) => ['pending','claimed'].includes(child.latestDeployment?.status ?? '')).length, failed: children.filter((child) => child.latestDeployment?.status === 'failed').length } }
  }

  async synchronize(campaignId: string): Promise<Record<string, unknown>> {
    const campaign = await this.campaign(campaignId)
    const batchId = randomUUID()
    const queued: ScenarioDeployment[] = []
    const skipped: Array<{ scenarioId: string; reason: string }> = []
    let sequence = 0
    for (const child of campaign.children) {
      const packageStatus = await this.persistence.getScenarioPackage(child.id)
      if (!packageStatus) { skipped.push({ scenarioId: child.id, reason: 'Aucun package intégré.' }); continue }
      if (packageStatus.deployedVersion === packageStatus.packageVersion && packageStatus.status === 'deployed') { skipped.push({ scenarioId: child.id, reason: `Foundry est déjà à jour en v${packageStatus.packageVersion}.` }); continue }
      sequence += 1
      queued.push(await this.packages.requestDeployment(child.id, { operation: 'deploy', batchId, batchSequence: sequence, payload: { campaignId } }))
    }
    if (!queued.length && skipped.every((item) => /déjà à jour/.test(item.reason))) return { campaignId, batchId: null, queued, skipped, state: 'up-to-date' }
    if (!queued.length) throw new Error('Aucun package de cette campagne ne peut être synchronisé.')
    return { campaignId, batchId, queued, skipped, state: 'queued' }
  }

  async resetPreview(campaignId: string): Promise<CampaignResetPreview> {
    const campaign = await this.campaign(campaignId)
    const ids = campaign.children.map((child) => child.id)
    const [application, preserveNpcIds, knownFoundry] = await Promise.all([this.persistence.previewScenarioApplicationReset(ids), this.persistence.sharedNpcIdsForScenarioReset(ids, [campaign.id, ...ids]), Promise.all(ids.map(async (scenarioId) => this.persistence.getLatestSuccessfulScenarioDeployment(scenarioId)))])
    const sum = (field: 'actors' | 'scenes') => knownFoundry.reduce((total, deployment) => {
      const section = deployment?.result?.[field]
      return total + (section && typeof section === 'object' && typeof (section as Record<string, unknown>).total === 'number' ? Number((section as Record<string, unknown>).total) : 0)
    }, 0)
    const journals = knownFoundry.filter((deployment) => { const value = deployment?.result?.journals; return value && typeof value === 'object' && (value as Record<string, unknown>).imported === true }).length
    return { campaignId, name: campaign.name, confirmationText: `Réinitialiser ${campaign.name}`, children: campaign.children, application, foundryKnown: { actors: sum('actors'), scenes: sum('scenes'), journals, note: 'Comptage issu des derniers déploiements réussis ; le reset Foundry recomptera les documents réellement présents.' }, preserveNpcIds }
  }

  async reset(campaignId: string, body: unknown): Promise<Record<string, unknown>> {
    const input = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {}
    const mode = String(input.mode ?? '')
    if (!['app','foundry','all'].includes(mode)) throw new Error('Mode de reset invalide.')
    const preview = await this.resetPreview(campaignId)
    if (input.confirm !== preview.confirmationText) throw new Error(`Confirmation invalide. Tape exactement : ${preview.confirmationText}`)
    const campaign = await this.campaign(campaignId)
    const ids = campaign.children.map((child) => child.id)
    const resetScopeIds = [campaign.id, ...ids]
    const preserveNpcIds = Array.isArray(preview.preserveNpcIds) ? preview.preserveNpcIds : []
    if (mode === 'app') {
      const results = []
      for (const scenarioId of ids) results.push(await this.packages.resetApplicationScenario(scenarioId, resetScopeIds, false))
      await this.persistence.clearScenarioPreparationStatus(campaign.id)
      return { campaignId, mode, state: 'done', results }
    }
    if (mode === 'all') await this.persistence.clearScenarioPreparationStatus(campaign.id)
    const batchId = randomUUID()
    const queued: ScenarioDeployment[] = []
    for (const [index, scenarioId] of ids.entries()) queued.push(await this.packages.requestReset(scenarioId, { campaignId, cleanupApp: mode === 'all', preserveNpcIds, resetScopeIds }, batchId, index + 1))
    return { campaignId, mode, batchId, state: 'queued', queued }
  }
}
