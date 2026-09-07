import AdmZip from 'adm-zip'
import { Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { Pf2MjService, ScenarioLibraryAsset } from './Pf2MjService'
import { ScenarioPackageService } from './ScenarioPackageService'
import { FoundryReferenceLibraryService } from './FoundryReferenceLibraryService'

type ScenarioRegistryItem = {
  id: string
  name: string
  parentId: string | null
  kind: string | null
  order: number | null
}

type CampaignTarget = {
  id: string
  name: string
  kind: 'campaign'
  children: ScenarioRegistryItem[]
}

type CampaignResponsePackage = { scenarioId: string; file: string }
type CampaignDependencyProposal = { scenarioId: string; dependsOnScenarioId: string; relationType: 'required' | 'recommended'; source: string | null; sourcePage: string | null; notes: string | null }

// PF2_AI_SAFE_PROMPT_V6
const TASK_TEMPLATE_VERSION = 6

const FALLBACK_CONTRACT = `# Format minimal du package de retour — v4

Le ZIP de retour doit contenir \`scenario.json\` à sa racine.

Champs minimaux :
- \`packageFormatVersion = 4\` ;
- \`packageVersion\` : entier positif ;
- \`scenario.id\` : ID exact de la cible ;
- \`scenario.name\` : nom lisible ;
- \`actors\` : tableau ;
- \`npcs\` : tableau. Chaque PNJ narratif peut contenir \`roleplay\` (« Comment le jouer »).

Un Actor doit préférer \`reference\` dès qu'un UUID Foundry exact et fiable correspond à l'entité, y compris lorsqu'il s'agit d'un PNJ ou statblock propre au scénario déjà fourni par un compendium installé. Utiliser \`custom.data.mode = "statblock"\` seulement si aucune référence fiable n'existe ou si le PDF montre que la fiche nécessaire diffère réellement de la source Foundry. Dans ce cas, transcrire toute la mécanique utile : niveau, CA, PV, Perception, sauvegardes, vitesse, compétences et attaques/capacités/items. Un simple niveau, ou niveau+CA+PV, est invalide en v4.

Une carte carrée préquadrillée doit fournir \`grid.columns\`, \`grid.rows\`, \`grid.bounds\` et \`grid.paddingCells = 1\`.

Les PNJ existants doivent être réutilisés avec leur \`npcId\`.
Ne jamais fusionner deux PNJ sur leur seul nom.
`

const CAMPAIGN_RESPONSE_CONTRACT = `# Format du retour IA pour une campagne

Le ZIP de retour de campagne est une enveloppe. Il ne remplace pas les packages de scénarios unitaires.

Structure attendue :

\`\`\`text
campaign-response.json
packages/
  <scenario-id-1>.zip
  <scenario-id-2>.zip
  ...
analysis/
  scenario-dependencies.json   # facultatif mais recommandé
\`\`\`

Chaque fichier de \`packages/\` est un ZIP autonome conforme à \`SCENARIO_PACKAGE_FORMAT.md\`.
Il doit pouvoir être extrait de l'enveloppe puis importé avec l'importeur de scénario existant.

\`campaign-response.json\` doit contenir au minimum :

\`\`\`json
{
  "formatVersion": 1,
  "campaignId": "campaign-id",
  "packages": [
    { "scenarioId": "scenario-id-1", "file": "packages/scenario-id-1.zip" }
  ]
}
\`\`\`

L'ordre de \`packages\` doit suivre l'ordre de \`targets.json\`. Cet ordre est important quand une nouvelle entité narrative créée dans un premier scénario est réutilisée par un scénario suivant.
`

@Injectable()
export class ScenarioPreparationService {
  constructor(private readonly pf2: Pf2MjService, private readonly packages: ScenarioPackageService, private readonly references?: FoundryReferenceLibraryService) {}

  // PF2_AI_TWO_PASS_REFERENCE_LIBRARY_V1
  async exportPreflightZip(targetId: string): Promise<{ bytes: Buffer; filename: string }> {
    if (!this.references) throw new Error('Service de références Foundry indisponible.')
    const referenceStatus = await this.references.status()
    if (referenceStatus.available !== true) throw new Error('Importe d’abord la bibliothèque de références Foundry dans l’application.')
    const base = await this.exportTaskZip(targetId)
    const zip = new AdmZip(base.bytes)
    const target = this.object(JSON.parse(zip.readAsText('target.json')))
    const targetKind = target.taskKind === 'campaign' ? 'campaign' : 'scenario'
    const displayName = this.firstText(this.object(target.target).name, target.campaignId, target.scenarioId) ?? targetId
    zip.deleteFile('TASK.md')
    zip.addFile('TASK.md', Buffer.from(this.preflightTaskMarkdown(targetId, targetKind, displayName), 'utf8'))
    zip.addFile('foundry/reference-index.json', this.json(await this.references.lightIndex()))
    zip.addFile('contract/REQUIRED_DATA_FORMAT.md', Buffer.from(this.requiredDataContract(), 'utf8'))
    return { bytes: zip.toBuffer(), filename: `${this.safeSegment(targetId)}-ai-preflight.zip` }
  }

  async exportGenerationZip(targetId: string): Promise<{ bytes: Buffer; filename: string }> {
    if (!this.references) throw new Error('Service de références Foundry indisponible.')
    const required = await this.references.requiredData(targetId)
    const status = await this.references.requiredDataStatus(targetId)
    if (!status) throw new Error('Aucun required-data.json importé pour cette cible.')
    if (status.requiredMissing > 0) throw new Error(`${status.requiredMissing} donnée(s) Foundry requise(s) sont introuvables dans la bibliothèque importée.`)
    if (status.status === 'blocked') throw new Error('La phase 1 a marqué cette cible comme bloquée. Corrige les éléments unresolved avant la génération finale.')
    const base = await this.exportTaskZip(targetId)
    const zip = new AdmZip(base.bytes)
    const oldTask = zip.readAsText('TASK.md')
    const sources = await this.references.resolvedSources(targetId)
    zip.deleteFile('TASK.md')
    zip.addFile('TASK.md', Buffer.from(`${this.generationPreamble(targetId)}\n\n${oldTask}`, 'utf8'))
    zip.addFile('required-data.json', this.json(required))
    zip.addFile('foundry/reference-index.json', this.json(await this.references.lightIndex()))
    const sourceManifest = []
    for (const raw of sources) {
      const source = this.object(raw)
      const requestId = this.requiredText(source.requestId, 'requestId')
      const path = `foundry/sources/${this.safeSegment(requestId)}.json`
      zip.addFile(path, this.json(source))
      sourceManifest.push({ requestId, kind: source.kind, uuid: source.uuid, name: source.name, required: source.required, sourceType: source.sourceType, file: path })
    }
    zip.addFile('foundry/required-sources-manifest.json', this.json({ formatVersion: 1, targetId, generatedAt: new Date().toISOString(), sourceCount: sourceManifest.length, sources: sourceManifest }))
    zip.addFile('contract/REQUIRED_DATA_FORMAT.md', Buffer.from(this.requiredDataContract(), 'utf8'))
    return { bytes: zip.toBuffer(), filename: `${this.safeSegment(targetId)}-ai-generation.zip` }
  }

  async exportTaskZip(targetId: string): Promise<{ bytes: Buffer; filename: string }> {
    const [curation, registry, packageRegistry, catalogue, assets] = await Promise.all([
      this.pf2.readCuration(),
      this.packages.scenarioRegistry(),
      this.packages.packageRegistry(),
      this.pf2.catalogue(),
      this.pf2.libraryAssetsForScenario(targetId)
    ])

    const scenarioTarget = registry.find((item) => item.id === targetId) ?? null
    const campaignTarget = scenarioTarget ? null : this.campaignTarget(catalogue, registry, targetId)
    if (!scenarioTarget && !campaignTarget) throw new Error('Seules les unités jouables et les campagnes explicites peuvent être exportées pour préparation IA.')

    const preparationStatus = this.preparationStatus(curation, targetId)
    if (preparationStatus !== 'selected') throw new Error('Passe d’abord la cible en préparation « Sélectionné ».')

    const pdfAssets = this.uniquePdfAssets(assets)
    if (!pdfAssets.length) throw new Error('Aucun PDF présent et associé à cette cible.')

    const documents: Array<Record<string, unknown>> = []
    const zip = new AdmZip()

    for (const [index, asset] of pdfAssets.entries()) {
      const indexed = await this.pf2.readIndexedScenarioPdf(targetId, asset.id)
      const includedAs = `docs/${String(index + 1).padStart(2, '0')}-${this.safeFilename(asset.filename)}`
      zip.addFile(includedAs, indexed.bytes)
      documents.push({
        id: asset.id,
        filename: asset.filename,
        includedAs,
        sha256: createHash('sha256').update(indexed.bytes).digest('hex'),
        language: asset.language,
        variant: asset.variant,
        role: asset.role,
        completeness: asset.completeness,
        associationStatus: asset.associationStatus,
        resourceTargetId: asset.resourceTargetId,
        resourceTargetLabel: asset.resourceTargetLabel,
        resourceScope: asset.resourceScope,
        libraryCategory: asset.libraryCategory
      })
    }

    if (campaignTarget) {
      return this.finishCampaignTaskZip(zip, {
        campaign: campaignTarget,
        curation,
        registry,
        packageRegistry,
        catalogue,
        documents,
        preparationStatus
      })
    }

    return this.finishScenarioTaskZip(zip, {
      target: scenarioTarget!,
      curation,
      registry,
      packageRegistry,
      catalogue,
      documents,
      preparationStatus
    })
  }

  async importCampaignResponseZip(expectedCampaignId: string, bytes: Buffer, originalName: string): Promise<{
    campaignId: string
    packageCount: number
    imported: Array<{ scenarioId: string; packageVersion: number; state: string }>
    dependencyCount: number
    filename: string
  }> {
    if (!bytes.byteLength) throw new Error('Archive ZIP de campagne vide.')
    if (bytes.byteLength > 400 * 1024 * 1024) throw new Error('Archive ZIP de campagne trop volumineuse (400 Mo maximum).')

    const zip = new AdmZip(bytes)
    const responseEntry = zip.getEntries().find((entry) => this.cleanZipPath(entry.entryName).toLowerCase() === 'campaign-response.json')
    if (!responseEntry || responseEntry.isDirectory) throw new Error('Le ZIP de campagne doit contenir campaign-response.json à sa racine.')

    let response: Record<string, unknown>
    try { response = this.object(JSON.parse(responseEntry.getData().toString('utf8'))) } catch { throw new Error('campaign-response.json est invalide.') }
    if (response.formatVersion !== 1) throw new Error('campaign-response.json doit utiliser formatVersion = 1.')

    const campaignId = this.stableId(response.campaignId, 'campaignId')
    if (campaignId !== expectedCampaignId) throw new Error(`Ce ZIP concerne la campagne « ${campaignId} », pas « ${expectedCampaignId} ».`)

    const [catalogue, registry] = await Promise.all([this.pf2.catalogue(), this.packages.scenarioRegistry()])
    const campaign = this.campaignTarget(catalogue, registry, campaignId)
    if (!campaign) throw new Error(`Campagne inconnue : ${campaignId}.`)
    if (!campaign.children.length) throw new Error('Cette campagne ne contient aucune unité jouable explicite.')

    const refs = this.campaignResponsePackages(response.packages)
    const expectedOrder = campaign.children.map((child) => child.id)
    const actualOrder = refs.map((item) => item.scenarioId)
    if (JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) {
      throw new Error(`Les packages doivent couvrir toutes les unités dans l’ordre de la campagne : ${expectedOrder.join(', ')}.`)
    }

    const staged: Array<{ ref: CampaignResponsePackage; bytes: Buffer; packageVersion: number; manifest: Record<string, unknown> }> = []
    for (const ref of refs) {
      const path = this.cleanZipPath(ref.file)
      if (!path.startsWith('packages/') || path.includes('..') || !path.toLowerCase().endsWith('.zip')) throw new Error(`Chemin de package invalide : ${ref.file}.`)
      const entry = zip.getEntries().find((candidate) => this.cleanZipPath(candidate.entryName) === path)
      if (!entry || entry.isDirectory) throw new Error(`Package enfant absent : ${ref.file}.`)
      const childBytes = entry.getData()
      const inspected = this.packages.inspectZip(childBytes)
      if (inspected.scenarioId !== ref.scenarioId) throw new Error(`${ref.file} vise « ${inspected.scenarioId} » au lieu de « ${ref.scenarioId} ».`)
      await this.assertCampaignPackageVersion(ref.scenarioId, inspected.packageVersion, inspected.manifest)
      staged.push({ ref, bytes: childBytes, packageVersion: inspected.packageVersion, manifest: inspected.manifest })
    }

    const proposals = this.campaignDependencyProposals(zip, new Set(registry.map((item) => item.id)), new Set(expectedOrder))

    const imported: Array<{ scenarioId: string; packageVersion: number; state: string }> = []
    for (const item of staged) {
      try {
        const result = await this.packages.importZip(item.bytes, basename(item.ref.file), { preserveExistingBusinessLinks: true })
        imported.push({ scenarioId: result.scenarioId, packageVersion: result.packageVersion, state: result.state })
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'erreur inconnue'
        throw new Error(`Import campagne interrompu après ${imported.length}/${staged.length} package(s), sur « ${item.ref.scenarioId} » : ${detail}. Les packages déjà intégrés restent en place ; tu peux corriger puis réimporter la même enveloppe.`)
      }
    }

    const byScenario = new Map<string, CampaignDependencyProposal[]>()
    for (const proposal of proposals) byScenario.set(proposal.scenarioId, [...(byScenario.get(proposal.scenarioId) ?? []), proposal])
    for (const [scenarioId, incoming] of byScenario) {
      const current = await this.packages.dependenciesForScenario(scenarioId)
      const existing = Array.isArray(current.dependencies)
        ? current.dependencies.map((value) => this.dependencyFromExisting(value, scenarioId)).filter((value): value is CampaignDependencyProposal => Boolean(value))
        : []
      const merged = [...new Map([...existing, ...incoming].map((link) => [link.dependsOnScenarioId, link])).values()]
      await this.packages.replaceDependenciesForScenario(scenarioId, merged)
    }

    return {
      campaignId,
      packageCount: staged.length,
      imported,
      dependencyCount: proposals.length,
      filename: basename(originalName) || `${campaignId}-ai-response.zip`
    }
  }

  private async finishScenarioTaskZip(zip: AdmZip, input: {
    target: ScenarioRegistryItem
    curation: Record<string, unknown>
    registry: ScenarioRegistryItem[]
    packageRegistry: unknown
    catalogue: Record<string, unknown>
    documents: Array<Record<string, unknown>>
    preparationStatus: string
  }): Promise<{ bytes: Buffer; filename: string }> {
    const [scenarioExport, currentPackage] = await Promise.all([
      this.packages.scenarioExport(input.target.id),
      this.packages.packageForScenario(input.target.id)
    ])
    const generatedAt = new Date().toISOString()
    const nextPackageVersion = this.nextPackageVersion(currentPackage)

    zip.addFile('TASK.md', Buffer.from(this.scenarioTaskMarkdown(input.target, generatedAt, nextPackageVersion), 'utf8'))
    zip.addFile('target.json', this.json({
      taskFormatVersion: TASK_TEMPLATE_VERSION,
      taskKind: 'scenario',
      generatedAt,
      scenarioId: input.target.id,
      preparationStatus: input.preparationStatus,
      nextPackageVersion,
      target: input.target,
      currentPackage
    }))
    zip.addFile('documents.json', this.json(input.documents))
    zip.addFile('package-registry.json', this.json(input.packageRegistry))
    zip.addFile('scenario-registry.json', this.json(input.registry))
    zip.addFile('existing-relations.json', this.json(scenarioExport))
    zip.addFile('catalogue-context.json', this.json(this.catalogueContext(input.catalogue, input.target)))
    zip.addFile('contract/SCENARIO_PACKAGE_FORMAT.md', Buffer.from(await this.packageContract(), 'utf8'))

    return {
      bytes: zip.toBuffer(),
      filename: `${this.safeSegment(input.target.id)}-ai-task.zip`
    }
  }

  private async finishCampaignTaskZip(zip: AdmZip, input: {
    campaign: CampaignTarget
    curation: Record<string, unknown>
    registry: ScenarioRegistryItem[]
    packageRegistry: unknown
    catalogue: Record<string, unknown>
    documents: Array<Record<string, unknown>>
    preparationStatus: string
  }): Promise<{ bytes: Buffer; filename: string }> {
    if (!input.campaign.children.length) throw new Error('Cette campagne ne contient aucune unité jouable explicite.')

    const generatedAt = new Date().toISOString()
    const [campaignRelations, childData] = await Promise.all([
      this.packages.scenarioExport(input.campaign.id),
      Promise.all(input.campaign.children.map(async (child) => {
        const [existingRelations, currentPackage] = await Promise.all([
          this.packages.scenarioExport(child.id),
          this.packages.packageForScenario(child.id)
        ])
        return {
          target: child,
          preparationStatus: this.preparationStatus(input.curation, child.id),
          nextPackageVersion: this.nextPackageVersion(currentPackage),
          currentPackage,
          existingRelations
        }
      }))
    ])

    const targets = childData.map(({ existingRelations: _existingRelations, ...item }) => item)
    const relationsByScenario = Object.fromEntries(childData.map((item) => [item.target.id, item.existingRelations]))

    zip.addFile('TASK.md', Buffer.from(this.campaignTaskMarkdown(input.campaign, generatedAt, targets), 'utf8'))
    zip.addFile('target.json', this.json({
      taskFormatVersion: TASK_TEMPLATE_VERSION,
      taskKind: 'campaign',
      generatedAt,
      campaignId: input.campaign.id,
      preparationStatus: input.preparationStatus,
      target: {
        id: input.campaign.id,
        name: input.campaign.name,
        kind: input.campaign.kind
      },
      childCount: input.campaign.children.length
    }))
    zip.addFile('targets.json', this.json(targets))
    zip.addFile('documents.json', this.json(input.documents))
    zip.addFile('package-registry.json', this.json(input.packageRegistry))
    zip.addFile('scenario-registry.json', this.json(input.registry))
    zip.addFile('existing-relations.json', this.json({
      campaign: campaignRelations,
      scenarios: relationsByScenario
    }))
    zip.addFile('catalogue-context.json', this.json(this.campaignCatalogueContext(input.catalogue, input.campaign)))
    zip.addFile('contract/SCENARIO_PACKAGE_FORMAT.md', Buffer.from(await this.packageContract(), 'utf8'))
    zip.addFile('contract/CAMPAIGN_RESPONSE_FORMAT.md', Buffer.from(CAMPAIGN_RESPONSE_CONTRACT, 'utf8'))

    return {
      bytes: zip.toBuffer(),
      filename: `${this.safeSegment(input.campaign.id)}-ai-task.zip`
    }
  }

  private preparationStatus(curation: Record<string, unknown>, scenarioId: string): string {
    const byId = this.object(curation.byId)
    const entries = this.object(curation.entries)
    const override = this.object(byId[scenarioId] ?? entries[scenarioId])
    return typeof override.preparationStatus === 'string' ? override.preparationStatus : 'untreated'
  }

  private campaignTarget(catalogue: Record<string, unknown>, registry: ScenarioRegistryItem[], campaignId: string): CampaignTarget | null {
    const entries = Array.isArray(catalogue.entries) ? catalogue.entries : []
    const entry = entries
      .map((value) => this.object(value))
      .find((value) => value.id === campaignId && value.kind === 'campaign')
    if (!entry) return null

    const children = registry
      .filter((item) => item.parentId === campaignId)
      .sort((left, right) => (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) || left.name.localeCompare(right.name, 'fr'))

    return {
      id: campaignId,
      name: this.firstText(entry.titleFr, entry.title, entry.name, entry.titleOriginal) ?? campaignId,
      kind: 'campaign',
      children
    }
  }

  private campaignResponsePackages(value: unknown): CampaignResponsePackage[] {
    if (!Array.isArray(value) || !value.length) throw new Error('campaign-response.json doit contenir un tableau packages non vide.')
    const refs = value.map((raw, index) => {
      const item = this.object(raw)
      return {
        scenarioId: this.stableId(item.scenarioId, `packages[${index}].scenarioId`),
        file: this.requiredText(item.file, `packages[${index}].file`)
      }
    })
    const duplicateScenario = refs.find((item, index) => refs.findIndex((other) => other.scenarioId === item.scenarioId) !== index)
    if (duplicateScenario) throw new Error(`Scénario dupliqué dans campaign-response.json : ${duplicateScenario.scenarioId}.`)
    const duplicateFile = refs.find((item, index) => refs.findIndex((other) => other.file === item.file) !== index)
    if (duplicateFile) throw new Error(`Fichier dupliqué dans campaign-response.json : ${duplicateFile.file}.`)
    return refs
  }

  private campaignDependencyProposals(zip: AdmZip, knownScenarios: Set<string>, campaignChildren: Set<string>): CampaignDependencyProposal[] {
    const entry = zip.getEntries().find((candidate) => this.cleanZipPath(candidate.entryName).toLowerCase() === 'analysis/scenario-dependencies.json')
    if (!entry || entry.isDirectory) return []
    let parsed: unknown
    try { parsed = JSON.parse(entry.getData().toString('utf8')) } catch { throw new Error('analysis/scenario-dependencies.json est invalide.') }
    const list = Array.isArray(parsed) ? parsed : Array.isArray(this.object(parsed).dependencies) ? this.object(parsed).dependencies : null
    if (!list) throw new Error('scenario-dependencies.json doit être un tableau ou contenir { dependencies: [...] }.')

    const proposals = list.map((raw, index) => {
      const item = this.object(raw)
      const scenarioId = this.stableId(item.scenarioId, `dependencies[${index}].scenarioId`)
      const dependsOnScenarioId = this.stableId(item.dependsOnScenarioId, `dependencies[${index}].dependsOnScenarioId`)
      if (!campaignChildren.has(scenarioId)) throw new Error(`La dépendance ${index + 1} ne part pas d’une unité de la campagne : ${scenarioId}.`)
      if (!knownScenarios.has(dependsOnScenarioId)) throw new Error(`Scénario dépendance inconnu : ${dependsOnScenarioId}.`)
      if (scenarioId === dependsOnScenarioId) throw new Error('Un scénario ne peut pas dépendre de lui-même.')
      if (item.relationType !== 'required' && item.relationType !== 'recommended') throw new Error(`relationType invalide pour ${scenarioId} -> ${dependsOnScenarioId}.`)
      return {
        scenarioId,
        dependsOnScenarioId,
        relationType: item.relationType,
        source: this.optionalText(item.source),
        sourcePage: this.optionalText(item.sourcePage),
        notes: this.optionalText(item.notes)
      } as CampaignDependencyProposal
    })
    const seen = new Set<string>()
    for (const proposal of proposals) {
      const key = `${proposal.scenarioId}:${proposal.dependsOnScenarioId}`
      if (seen.has(key)) throw new Error(`Dépendance dupliquée : ${proposal.scenarioId} -> ${proposal.dependsOnScenarioId}.`)
      seen.add(key)
    }
    return proposals
  }

  private dependencyFromExisting(value: unknown, scenarioId: string): CampaignDependencyProposal | null {
    const item = this.object(value)
    if (typeof item.dependsOnScenarioId !== 'string' || (item.relationType !== 'required' && item.relationType !== 'recommended')) return null
    return {
      scenarioId,
      dependsOnScenarioId: item.dependsOnScenarioId,
      relationType: item.relationType,
      source: this.optionalText(item.source),
      sourcePage: this.optionalText(item.sourcePage),
      notes: this.optionalText(item.notes)
    }
  }

  private async assertCampaignPackageVersion(scenarioId: string, incomingVersion: number, incomingManifest: Record<string, unknown>): Promise<void> {
    const current = this.object(await this.packages.packageForScenario(scenarioId))
    const currentVersion = Number.isInteger(current.packageVersion) && Number(current.packageVersion) > 0 ? Number(current.packageVersion) : null
    if (currentVersion === null) {
      if (incomingVersion !== 1) throw new Error(`${scenarioId} attend un premier package v1, pas v${incomingVersion}.`)
      return
    }
    if (incomingVersion === currentVersion) {
      if (JSON.stringify(current.manifest ?? null) !== JSON.stringify(incomingManifest)) throw new Error(`${scenarioId} possède déjà une v${currentVersion} différente. Régénère la réponse avec une nouvelle version.`)
      return
    }
    if (incomingVersion !== currentVersion + 1) throw new Error(`${scenarioId} attend la v${currentVersion + 1}, pas v${incomingVersion}.`)
  }

  private stableId(value: unknown, label: string): string {
    const text = this.requiredText(value, label)
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(text)) throw new Error(`${label} doit être un identifiant stable sans espace.`)
    return text
  }

  private requiredText(value: unknown, label: string): string {
    if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} est obligatoire.`)
    return value.trim()
  }

  private optionalText(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null
  }

  private cleanZipPath(value: string): string {
    return value.replace(/\\/g, '/').replace(/^\.\//, '')
  }

  private uniquePdfAssets(assets: ScenarioLibraryAsset[]): ScenarioLibraryAsset[] {
    const seen = new Set<string>()
    return assets.filter((asset) => {
      if (asset.assetType !== 'pdf' || !asset.present || seen.has(asset.id)) return false
      seen.add(asset.id)
      return true
    })
  }

  private catalogueContext(catalogue: Record<string, unknown>, target: ScenarioRegistryItem): Record<string, unknown> {
    const entries = Array.isArray(catalogue.entries) ? catalogue.entries : []
    let owner: Record<string, unknown> | null = null
    let unit: Record<string, unknown> | null = null

    for (const raw of entries) {
      const entry = this.object(raw)
      if (entry.id === target.id) {
        owner = entry
        unit = entry
        break
      }
      const parts = Array.isArray(entry.parts) ? entry.parts : []
      const found = parts.map((part) => this.object(part)).find((part) => part.id === target.id)
      if (found) {
        owner = entry
        unit = found
        break
      }
    }

    const siblings = target.parentId && owner && Array.isArray(owner.parts)
      ? owner.parts
          .map((part: unknown) => this.object(part))
          .filter((part: Record<string, unknown>) => typeof part.id === 'string')
          .map((part: Record<string, unknown>) => ({
            id: part.id,
            kind: part.kind ?? null,
            titleFr: part.titleFr ?? null,
            titleOriginal: part.titleOriginal ?? null,
            number: part.number ?? null,
            sequence: part.sequence ?? null
          }))
      : []

    return {
      target: unit ?? target,
      parent: owner && owner !== unit ? owner : null,
      siblings
    }
  }

  private campaignCatalogueContext(catalogue: Record<string, unknown>, campaign: CampaignTarget): Record<string, unknown> {
    const entries = Array.isArray(catalogue.entries) ? catalogue.entries : []
    const entry = entries
      .map((value) => this.object(value))
      .find((value) => value.id === campaign.id) ?? null

    return {
      target: entry ?? { id: campaign.id, kind: campaign.kind, name: campaign.name },
      playableChildren: campaign.children
    }
  }

  private async packageContract(): Promise<string> {
    const candidates = [
      resolve(process.cwd(), 'pf2e-val-toolkit/SCENARIO_PACKAGE_FORMAT.md'),
      resolve(process.cwd(), 'apps/api-jdr/src/pf2-mj/SCENARIO_PACKAGE_FORMAT.md')
    ]
    for (const path of candidates) {
      try { return await readFile(path, 'utf8') } catch { /* fallback below */ }
    }
    return FALLBACK_CONTRACT
  }

  private preflightTaskMarkdown(targetId: string, targetKind: 'scenario' | 'campaign', displayName: string): string {
    return `# PF2 — Phase 1 IA : préanalyse des données requises

Cible : ${displayName}
ID exact : \`${targetId}\`
Type : \`${targetKind}\`

## But

NE GÉNÈRE PAS encore de package Foundry.

Analyse les PDF de \`docs/\`, les registres/contexte de l’application et \`foundry/reference-index.json\`.
Ta seule sortie doit être un fichier nommé exactement \`required-data.json\`, conforme à \`contract/REQUIRED_DATA_FORMAT.md\`.

## Vérité Foundry

Une entrée de compendium n’existe pour cette tâche que si son UUID est présent dans \`foundry/reference-index.json\`.
N’invente jamais un Actor/Item, un UUID ou un lookup de compendium.

Le niveau 1 suffit pour confirmer qu’un UUID existe et pour utiliser directement une référence si le match est suffisamment fiable.
Un compendium explicitement lié à la campagne ou au scénario est un signal fort : si le nom, le type, le niveau/slug lorsqu’ils existent et le contexte concordent, préfère l’UUID exact de ce compendium au lieu de recréer l’Actor.

Demande une source détaillée uniquement si elle est vraiment nécessaire pour la phase 2 : plusieurs candidats plausibles, doute sur une différence mécanique entre le PDF et l’Actor Foundry, Actor utilisé comme base/variante, sort/item/effet/hazard précis nécessaire à un acteur custom, etc.
Ne demande PAS la source détaillée d’un Actor simplement parce qu’il est propre au scénario si son UUID exact est déjà identifié de façon fiable.

Chaque demande doit viser un UUID exact déjà présent dans l’index. Ne demande jamais « tout le Bestiaire » ou une catégorie entière.

## Classification

Pour chaque créature ou PNJ mécanique :
1. match fiable dans l’index → futur Actor \`reference\`, y compris pour un PNJ/statblock propre au scénario déjà présent dans un compendium de cette aventure ;
2. statblock du PDF sans référence fiable, ou différence mécanique réellement établie avec la source Foundry → futur Actor \`custom\` ;
3. rôle narratif sans statblock et sans Actor mécanique nécessaire → futur Actor narratif ;
4. plusieurs candidats plausibles ou identité impossible à résoudre sans invention → \`unresolved\`.

RÈGLE PRIORITAIRE — PF2_AI_REFERENCE_REUSE_POLICY_V2 :
- « PNJ propre au scénario » n’implique jamais « Actor custom » ;
- « statblock publié dans le PDF » n’implique jamais « Actor custom » si ce même Actor existe déjà dans Foundry ;
- un UUID exact et cohérent d’un compendium dédié au scénario/campagne doit normalement être réutilisé ;
- ne crée jamais de doublon custom d’un Actor Foundry déjà identifié de façon fiable ;
- un nom propre ou un nom de groupe seul ne suffit pas : il faut une concordance d’identité raisonnable avec l’index.

## Sortie

Retourne uniquement \`required-data.json\`.
- \`status = "ready"\` si aucune donnée détaillée supplémentaire n’est nécessaire ;
- \`status = "needs_more_data"\` s’il faut des sources ciblées ;
- \`status = "blocked"\` si une information essentielle manque et ne peut pas être demandée via un UUID du snapshot.

Ne produis ni \`scenario.json\` ni ZIP final pendant cette phase.`
  }

  private requiredDataContract(): string {
    return `# REQUIRED_DATA_FORMAT — v1

\`required-data.json\` :

\`\`\`json
{
  "formatVersion": 1,
  "targetId": "id-exact",
  "targetKind": "scenario",
  "status": "needs_more_data",
  "requests": [
    {
      "requestId": "actor-leukodaemon",
      "kind": "foundry_actor_source",
      "subject": { "uuid": "Compendium.pf2e....Actor....", "name": "Leukodaemon" },
      "reason": "Pourquoi le niveau 1 ne suffit pas.",
      "required": true
    }
  ],
  "unresolved": []
}
\`\`\`

\`targetKind\` : \`scenario\` ou \`campaign\`.
\`status\` : \`ready\`, \`needs_more_data\` ou \`blocked\`.
\`kind\` autorisés :
- \`foundry_actor_source\`
- \`foundry_hazard_source\`
- \`foundry_item_source\`
- \`foundry_spell_source\`
- \`foundry_effect_source\`

Chaque \`requestId\` est unique. Chaque \`subject.uuid\` doit déjà exister dans \`foundry/reference-index.json\`.
Si une donnée ne peut pas être obtenue par l’un de ces UUID, place le problème dans \`unresolved\` au lieu de fabriquer une demande.`
  }

  private generationPreamble(targetId: string): string {
    return `# PF2 — Phase 2 IA : génération finale

La phase 1 est terminée pour \`${targetId}\`.
Ce ZIP est autonome : PDF + contexte app + index Foundry léger + \`required-data.json\` + uniquement les sources détaillées demandées dans \`foundry/sources/\`.

RÈGLE ABSOLUE :
- un Actor \`reference\` doit utiliser un \`uuid\` exact présent dans \`foundry/reference-index.json\` ;
- n’invente jamais un UUID ou un lookup ;
- si aucun UUID fiable n’existe, utilise custom/narrative selon le PDF ou signale le cas dans \`analysis/unresolved-actors.json\` ;
- les sources détaillées servent à vérifier/compléter, pas à autoriser des correspondances créatives.

Tu peux maintenant produire le package final demandé par les instructions ci-dessous.`
  }

  private scenarioTaskMarkdown(target: ScenarioRegistryItem, generatedAt: string, nextPackageVersion: number): string {
    return `# Tâche de préparation PF2 — ${target.name}

Version du format de tâche : ${TASK_TEMPLATE_VERSION}
Type de tâche : scénario
Généré le : ${generatedAt}
ID cible exact : \`${target.id}\`
Version de package attendue : ${nextPackageVersion}

## Objectif

Lire les PDF présents dans \`docs/\` et préparer un package de scénario compatible avec l’application MJ et le Toolkit Foundry.

## Sources et fiabilité

1. Les PDF de \`docs/\` sont la source principale pour le contenu de ce scénario.
2. \`package-registry.json\` contient les identités déjà connues : réutilise leurs IDs lorsqu’il s’agit de la même entité.
3. \`scenario-registry.json\` contient les unités jouables connues et leurs IDs stables.
4. \`existing-relations.json\` contient les relations déjà connues : ne les supprime pas sans preuve explicite.
5. \`catalogue-context.json\` fournit le contexte de campagne / série et les unités voisines.
6. N’invente pas une information absente ou incertaine. En cas de doute, omets-la ou signale-la clairement.

## PNJ et acteurs

- Un PNJ narratif déjà présent dans le registre doit utiliser son \`npcId\`.
- Ne crée jamais un doublon parce que l’orthographe diffère légèrement.
- Les créatures anonymes, variantes de monstres et adversaires purement mécaniques restent des \`actors\`, pas des PNJ globaux.
- Un nouveau PNJ narratif doit avoir un \`key\` stable et un nom explicitement soutenu par le PDF.
- Pour chaque PNJ narratif pertinent, renseigne \`roleplay\` (« Comment le jouer ») quand le texte fournit assez d'indices : tempérament, attitude, réactions, manière de parler ou de se comporter utiles à la table.
- \`roleplay\` ne doit pas répéter la biographie. N'invente pas de tic, accent ou trait précis sans appui suffisant ; laisse le champ vide si nécessaire.
- Si \`package-registry.json\` fournit déjà un \`roleplay\`, conserve-le : le package ne doit pas le réécrire arbitrairement.


### Contexte PJ et contacts

package-registry.json fournit, pour les PNJ existants, description, role, roleplay, tags, importance et statut.

Convention des tags :
- \`pj\` = fiche narrative d'un personnage joueur ;
- \`contact-pj\` = PNJ connu comme contact d'au moins un PJ ;
- \`contact:<slug-pj>\` = contact de ce PJ, par exemple \`contact:pen-pen\` ou \`contact:zab\`.

Ces tags sont du contexte narratif global et ne prouvent PAS qu'un PNJ apparaît dans ce scénario.
- Ne lie jamais automatiquement un contact au scénario à cause de son tag seul.
- Si une personne du PDF correspond clairement à une entrée existante, réutilise son \`npcId\`.
- Conserve les tags, description, role et roleplay déjà curatés.
- Si les sources apportent une contradiction importante, signale-la dans \`analysis/\` au lieu d'écraser silencieusement la fiche.

### Exigences mécaniques v4

Chaque package produit doit utiliser \`packageFormatVersion = 4\`.

Pour **chaque** créature/PNJ mécanique rencontré dans le PDF :
- cherche d’abord un UUID exact et fiable dans \`foundry/reference-index.json\` ; si l’identité concorde, utilise un Actor \`reference\` afin de réutiliser la vraie fiche Foundry, y compris pour un PNJ ou statblock propre à cette aventure ;
- un compendium dédié au scénario/campagne est un signal fort de correspondance, sans être une permission d’accepter un simple nom vaguement proche ;
- utilise \`custom.data.mode = "statblock"\` uniquement si aucune référence fiable n’existe, ou si les sources détaillées/PDF établissent que la mécanique requise diffère réellement de l’Actor Foundry ;
- dans ce cas custom, retranscris les données réellement présentes : niveau, CA, PV, Perception, trois sauvegardes, vitesse, compétences, attaques, capacités et autres éléments utiles ;
- un Actor \`statblock\` réduit à \`level\`, ou à \`level + ac + hp\`, est **interdit** ;
- \`custom.data.mode = "narrative"\` n’est autorisé que lorsqu’aucun bloc de statistiques n’existe et que l’Actor sert uniquement de support narratif/portrait ;
- pour les mécaniques complexes non couvertes par le schéma normalisé, utilise \`data.items\` avec des Item sources PF2 plutôt que d’omettre la mécanique.

Ne recrée jamais en custom un Actor déjà identifié de façon fiable par UUID dans le snapshot Foundry.

Avant de rendre le ZIP, fais une passe de contrôle sur tous les Actors : aucun statblock présent dans le PDF ne doit devenir un placeholder mécanique.

### Cartes préquadrillées v4

Pour toute carte où une grille carrée est visible dans la source, mesure la grille imprimée et fournis \`grid.columns\`, \`grid.rows\`, \`grid.bounds.{x,y,width,height}\` et \`grid.paddingCells = 1\`. \`columns\`/\`rows\` comptent uniquement les cases complètes ; \`bounds.x/y\` désignent la première intersection complète. Ne choisis pas \`gridless\` uniquement pour éviter cette mesure. Les cellules doivent être carrées à 2 % près.

## Lieux, factions et événements

Réutilise les IDs de \`package-registry.json\` lorsque l’entité existe déjà. Une nouvelle entité ne doit être créée que si le PDF la rend nécessaire et identifiable.

## Liens entre scénarios

Analyse aussi les références explicites à d’autres scénarios grâce à \`scenario-registry.json\`. Consigne les propositions dans un fichier séparé \`analysis/scenario-dependencies.json\` avec :
- \`dependsOnScenarioId\`
- \`relationType\` = \`required\` ou \`recommended\`
- \`sourcePage\`
- \`notes\`

Ne les invente pas dans \`scenario.json\` tant que le contrat fourni ne les définit pas.

## Contrôle final obligatoire avant rendu

Avant de fabriquer le ZIP final, ouvre \`scenario.json\` et fais une passe de validation.

### Actors
Chaque élément de \`actors[]\` doit avoir au niveau racine :
- \`key\` non vide ;
- \`name\` non vide ;
- \`type\` valide.

Ceci vaut aussi pour un Actor \`narrative\`.
Ne mets jamais dans \`actors[]\` un fragment de statblock, un simple renvoi de page, un participant de rencontre sans identité d'Actor, ou un objet partiel.

Si une mécanique ne peut pas être résolue sans invention :
1. suis d'abord les renvois explicites présents dans les PDF fournis ;
2. si elle reste non résolue, ne crée pas d'Actor mécanique incomplet ;
3. consigne le cas dans \`analysis/unresolved-actors.json\`.

### Cartes
Toute map \`square\` doit avoir :
- \`columns\` entier > 0 ;
- \`rows\` entier > 0 ;
- \`paddingCells = 1\` ;
- \`bounds.x\` et \`bounds.y\` numériques ;
- \`bounds.width\` et \`bounds.height\` > 0.

N'émets jamais un objet \`grid\` partiel avec des champs absents, nuls ou à zéro.
Si une planche contient plusieurs cartes indépendantes, découpe-les quand la séparation et la mesure sont fiables.
Si une carte quadrillée reste réellement impossible à mesurer, retire-la de \`maps[]\` et consigne-la dans \`analysis/unresolved-maps.json\`. Ne la marque pas \`gridless\` uniquement pour contourner la validation.

Une donnée non résolue va dans \`analysis/\`, pas dans un objet invalide.

## Livrable

Retourne un ZIP contenant au minimum \`scenario.json\` à sa racine, conforme à \`contract/SCENARIO_PACKAGE_FORMAT.md\`.

Utilise exactement :
- \`scenario.id = "${target.id}"\`
- \`packageVersion = ${nextPackageVersion}\`

Le ZIP de retour ne doit pas contenir les PDF sources.
`
  }

  private campaignTaskMarkdown(campaign: CampaignTarget, generatedAt: string, targets: Array<Record<string, unknown>>): string {
    const order = targets.map((item, index) => {
      const target = this.object(item.target)
      return `${index + 1}. \`${String(target.id ?? '')}\` — ${String(target.name ?? target.id ?? '')} — package v${String(item.nextPackageVersion ?? '?')}`
    }).join('\n')

    return `# Tâche de préparation PF2 — campagne ${campaign.name}

Version du format de tâche : ${TASK_TEMPLATE_VERSION}
Type de tâche : campagne
Généré le : ${generatedAt}
ID campagne exact : \`${campaign.id}\`
Unités jouables : ${campaign.children.length}

## Objectif

Analyser la campagne comme un tout afin de conserver la continuité des PNJ, lieux, factions, événements, cartes et dépendances, tout en produisant **un package autonome par unité jouable**.

Les PDF de \`docs/\` sont dédupliqués : un volume partagé par plusieurs aventures n’est présent qu’une fois. \`documents.json\` indique à quelle partie du catalogue chaque PDF est rattaché. \`catalogue-context.json\` contient notamment les notes de découpage/pages lorsqu’elles existent.

## Cibles et ordre d’import

${order}

L’ordre complet et les versions attendues sont aussi dans \`targets.json\`.

## Sources et fiabilité

1. Les PDF de \`docs/\` sont la source principale.
2. \`package-registry.json\` est le registre d’identités existantes. Réutilise ses IDs dès qu’une entité correspond.
3. \`existing-relations.json\` contient les relations déjà connues au niveau campagne et au niveau de chaque unité. Ne les supprime pas sans preuve explicite.
4. \`scenario-registry.json\` est la seule liste autorisée pour référencer d’autres scénarios.
5. N’invente pas une identité, un lien ou une dépendance en cas d’incertitude.

## Continuité des nouvelles entités

Une nouvelle entité narrative récurrente ne doit être créée qu’une seule fois.

- Choisis comme propriétaire le premier scénario, dans l’ordre de \`targets.json\`, où elle est réellement présente.
- Dans ce premier package, crée-la normalement avec un \`key\` stable.
- L’importeur crée alors l’ID déterministe \`<scenarioId>--<key>\`.
- Dans les packages suivants, réutilise exactement cet ID : \`npcId\` pour un PNJ, \`refId\` pour un lieu/région, \`factionId\` pour une faction, \`eventId\` pour un événement.
- Cette règle implique que les packages soient importés dans l’ordre fourni.

Les créatures anonymes et adversaires purement mécaniques restent des \`actors\` locaux au scénario.

Pour chaque PNJ narratif pertinent, remplis aussi \`roleplay\` (« Comment le jouer ») lorsque les sources donnent assez d'indices. Le texte doit être directement utile au MJ : tempérament, attitude, réactions et comportement à la table, sans inventer de tics précis. Un \`roleplay\` déjà présent dans \`package-registry.json\` doit être conservé.


### Contexte PJ et contacts

package-registry.json fournit aussi description, role, roleplay, tags, importance et statut pour les PNJ existants.

Convention :
- \`pj\` = fiche narrative d'un personnage joueur ;
- \`contact-pj\` = contact connu d'au moins un PJ ;
- \`contact:<slug-pj>\` = contact de ce PJ.

Ces tags servent à maintenir la continuité narrative entre les volumes, mais ne prouvent jamais la présence d'un PNJ dans une aventure.
Réutilise l'\`npcId\` existant lorsqu'un personnage du PDF correspond réellement à une fiche connue et n'écrase pas arbitrairement les données déjà curatées.

## Exigences mécaniques v4 — à appliquer à chacun des packages enfants

Chaque \`scenario.json\` doit utiliser \`packageFormatVersion = 4\`.

Pour **chaque** créature/PNJ mécanique rencontré dans les PDF :
- cherche d’abord un UUID exact et fiable dans \`foundry/reference-index.json\` ; si l’identité concorde, préfère \`reference\`, y compris pour un PNJ ou statblock propre à un volume de la campagne ;
- un compendium dédié à la campagne ou au scénario est un signal fort de correspondance ;
- utilise \`custom.data.mode = "statblock"\` uniquement si aucune référence fiable n’existe ou si une différence mécanique avec l’Actor Foundry est réellement établie ;
- dans ce cas custom, fais une retranscription complète des données réellement présentes : niveau, CA, PV, Perception, trois sauvegardes, vitesse, compétences, attaques, capacités et autres éléments utiles ;
- un simple \`level\`, ou \`level + ac + hp\`, est **interdit** ;
- \`custom.data.mode = "narrative"\` seulement si aucun statblock n’existe et qu’aucun Actor mécanique n’est nécessaire ;
- une mécanique complexe non couverte par le schéma peut être fournie via \`data.items\` avec des Item sources PF2.

Ne recrée jamais en custom un Actor déjà identifié de façon fiable par UUID dans le snapshot Foundry.

La taille de la campagne n’autorise pas à simplifier les statblocks. Avant de rendre l’enveloppe, contrôle tous les Actors de chacun des packages enfants et compare-les aux blocs de statistiques correspondants dans les PDF.

Pour toute carte préquadrillée, mesure la grille imprimée : \`grid.columns\`, \`grid.rows\`, \`grid.bounds.{x,y,width,height}\`, \`grid.paddingCells = 1\`. Les colonnes/lignes sont les cases complètes et la première intersection complète doit être identifiée. Ne passe pas une carte quadrillée en \`gridless\` pour contourner la mesure.

## Dépendances entre scénarios

Analyse les références explicites entre unités. Les IDs doivent venir de \`scenario-registry.json\` uniquement. Place les propositions dans \`analysis/scenario-dependencies.json\` avec, pour chaque lien :
- \`scenarioId\`
- \`dependsOnScenarioId\`
- \`relationType\` = \`required\` ou \`recommended\`
- \`sourcePage\`
- \`notes\`

Ne fabrique pas de dépendance sur la seule proximité des numéros.

## Contrôle final obligatoire avant rendu

Applique ce contrôle à chacun des packages enfants.

### Actors
Chaque élément de chaque \`actors[]\` doit avoir au niveau racine \`key + name + type\`.
Un Actor \`narrative\` n'échappe pas à cette règle.
Un fragment de statblock, un renvoi de page ou un objet partiel n'est pas un Actor valide.
Si la mécanique reste impossible à déterminer sans invention, omets l'Actor mécanique du tableau importable et consigne-le dans \`analysis/unresolved-actors.json\`.

### Cartes
Chaque map \`square\` doit avoir \`columns\`, \`rows\`, \`paddingCells = 1\` et des \`bounds\` complets et numériques.
Une grille partielle est interdite.
Une planche composite doit être découpée lorsque les sous-cartes peuvent être séparées et mesurées de façon fiable.
Une map quadrillée non mesurable doit être omise des tableaux importables et signalée dans \`analysis/unresolved-maps.json\`.

Crée \`analysis/preflight.json\` avec une entrée par \`scenarioId\`.
Chaque package annoncé comme prêt doit avoir \`errors: []\`.

## Livrable

Retourne **un seul ZIP de campagne**, conforme à \`contract/CAMPAIGN_RESPONSE_FORMAT.md\` :

\`\`\`text
campaign-response.json
packages/
  <scenario-id>.zip
analysis/
  scenario-dependencies.json
\`\`\`

Chaque \`packages/<scenario-id>.zip\` doit être un vrai package autonome conforme à \`contract/SCENARIO_PACKAGE_FORMAT.md\`, avec :
- l’ID exact indiqué dans \`targets.json\` ;
- la \`packageVersion\` exacte indiquée dans \`targets.json\` ;
- uniquement les assets nécessaires à cette unité jouable.

**Ne crée pas de package Foundry pour \`${campaign.id}\` lui-même.** La campagne sert ici d’enveloppe d’analyse ; les packages finaux restent unitaires.

Le ZIP de retour ne doit pas contenir les PDF sources.
`
  }

  private nextPackageVersion(value: unknown): number {
    const item = this.object(value)
    return typeof item.packageVersion === 'number' && Number.isInteger(item.packageVersion) && item.packageVersion > 0
      ? item.packageVersion + 1
      : 1
  }

  private json(value: unknown): Buffer {
    return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8')
  }

  private object(value: unknown): Record<string, any> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
  }

  private firstText(...values: unknown[]): string | null {
    const value = values.find((candidate) => typeof candidate === 'string' && candidate.trim())
    return typeof value === 'string' ? value.trim() : null
  }

  private safeFilename(value: string): string {
    const cleaned = value.replace(/[\\/]/g, '-').replace(/[\x00-\x1F\x7F]/g, '').trim()
    return cleaned || 'document.pdf'
  }

  private safeSegment(value: string): string {
    return value.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'scenario'
  }
}
