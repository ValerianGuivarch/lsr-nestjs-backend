import canonical from './data/catalogue-pf2.json'
import bundleInventory from './data/resource-bundles.json'

export type Playability = 'Prêt' | 'À adapter' | 'Simple inspiration'
export type Progress = 'Non spécifié' | 'À jouer' | 'En cours' | 'Joué'
export type Usage = 'CORE' | 'OPTION' | 'RÉSERVE' | 'ÉCARTÉ' | 'ENDGAME' | 'FUTUR'
export type Langue = 'FR' | 'EN' | 'INCONNUE'

export type LevelRangeType = 'fixed' | 'interval' | 'subtier' | 'variable' | 'unknown'
export type SourceKind = 'direct' | 'inherited' | 'aggregate' | 'curation' | 'migration'
export type SourceRef = { kind: SourceKind; entityId?: string; note?: string }

export type LevelRange = {
  min: number | null
  max: number | null
  rangeType: LevelRangeType
  subtiers: Array<{ min: number; max: number }>
  raw: string | null
  source: SourceRef
}

export type LocationFact = {
  id: string
  role: 'primary' | 'secondary'
  source: SourceRef
}

export type ContainerType = 'section' | 'collection' | 'series' | 'pfsSeason' | 'campaign' | 'subcampaign'
export type PlayableType =
  | 'campaignEpisode'
  | 'standaloneAdventure'
  | 'pfsScenario'
  | 'pfsIntro'
  | 'pfsSpecial'
  | 'quest'
  | 'bounty'
  | 'oneShot'
  | 'communityAdventure'
  | 'legacy'

export type ComponentType =
  | 'playerGuide'
  | 'campaignCompilation'
  | 'map'
  | 'companionGuide'
  | 'resource'
  | 'externalInfo'
  | 'translation'
  | 'other'

export type DocumentVariant = 'original' | 'officialFr' | 'french' | 'translationPartial' | 'translationUnofficial' | 'other'
export type DocumentRole = 'core' | 'optional' | 'information' | 'resource'
export type AssociationStatus = 'confirmed' | 'review' | 'unassociated'
export type AvailabilityState = 'complete' | 'partial' | 'informationOnly' | 'absent' | 'uncertain'
export type FrenchState = 'official' | 'translated' | 'mixed' | 'partial' | 'none' | 'uncertain'
export type ResourceBundleState = 'present' | 'missing' | 'unknown' | 'uncertain'

export type Titles = {
  fr: string | null
  original: string | null
  aliases: string[]
}

export type CatalogueSection = {
  id: string
  title: string
  order: number
  description: string
}

export type Container = {
  id: string
  entityKind: 'container'
  containerType: ContainerType
  sectionId: string
  parentId: string | null
  titles: Titles
  order: number
  season?: number
  synopsis: string | null
  gmDetails: string | null
  locations: LocationFact[]
  levels: LevelRange
  relevance: { value: string; source: SourceRef }
  editorialStatus: Usage | null
  chronology: { yearAR: number | null; estimated: boolean; period: string | null }
  arcIds: string[]
  legacyEntryId?: string
  migration: { status: 'ready' | 'needsReview'; issues: string[] }
}

export type PlayableUnit = {
  id: string
  entityKind: 'playable'
  playableType: PlayableType
  sectionId: string
  parentId: string | null
  legacyEntryId: string
  legacyEntryKind: string
  number: string | null
  titles: Titles
  levels: LevelRange
  locations: LocationFact[]
  synopsis: string | null
  contextSynopsis: string | null
  gmDetails: string | null
  relevance: { value: string; source: SourceRef }
  playability: Playability
  tracking: Progress
  editorialStatus: Usage | null
  chronology: { yearAR: number | null; estimated: boolean; period: string | null }
  arcIds: string[]
  narrativeThread: string | null
  characterHooks: Array<{ characterId: string; rationale: string }>
  organizedPlay?: { repeatable?: boolean; ruleAsOf?: string }
  migration: { status: 'ready' | 'needsReview'; issues: string[]; generatedFromPart?: boolean }
}

export type Component = {
  id: string
  entityKind: 'component'
  componentType: ComponentType
  ownerId: string
  titles: Titles
  order: number | null
  number: string | null
  levels: LevelRange
  requiredForCore: boolean
  notes: string
  legacyEntryId: string
  rawKind: string
}

export type CatalogueDocument = {
  id: string
  entityKind: 'document'
  filename: string
  path: string
  href: string
  pages: number | null
  language: Langue
  variant: DocumentVariant
  rawVariant: string
  role: DocumentRole
  completeness: 'complete' | 'partial' | 'unknown'
  targetId: string | null
  targetKind: 'playable' | 'container' | 'component' | null
  association: {
    status: AssociationStatus
    confidence: string | null
    evidence: string[]
  }
  isInformationFallback: boolean
  runtime?: boolean
}

export type ResourceBundle = {
  id: string
  filename: string
  path: string
  targetId: string | null
  scope: 'exact' | 'descendants'
  presence: 'present' | 'missing'
  associationStatus: AssociationStatus
  associationScore?: number | null
  evidence?: string[]
  contents?: string[]
}

export type ResourceBundleInventory = {
  schemaVersion: number
  inventoryKnown: boolean
  scannedAt: string | null
  totalOnDisk?: number
  bundles: ResourceBundle[]
}

export type LocalScanInventory = {
  pdfPaths?: string[]
  classifiedNewPdfs?: Array<{
    path: string
    entryId: string
    campaignId: string | null
    association?: string
    score?: number | null
    informationOnly?: boolean
  }>
  resourceInventory?: ResourceBundleInventory
}

export type AvailabilitySummary = {
  coreMaterial: AvailabilityState
  original: AvailabilityState
  officialFr: AvailabilityState
  translation: AvailabilityState
  requiredDocuments: {
    status: AvailabilityState
    present: number
    informationOnly: number
    required: number
    missingTargetIds: string[]
  }
  optionalResources: { present: number; known: number }
  readyInFrench: boolean
  frenchState: FrenchState
}

export type ResourceBundleAvailability = {
  status: ResourceBundleState
  direct: boolean
  inheritedFromId: string | null
  bundles: ResourceBundle[]
}

export type Arc = { id: string; titleFr: string; season?: number; entryIds: string[]; order?: string; description?: string }
export type NarrativeThread = { id?: string; title?: string; name?: string; entryIds?: string[]; [key: string]: unknown }

// ---- Schéma V2 lu uniquement comme source de migration ----
type RawDocumentLink = { fileId: string; variant: string; completeness: string; evidence?: string[] }
type RawPart = {
  id: string
  titleFr?: string | null
  titleOriginal?: string | null
  kind: string
  sequence?: number | null
  number?: string | null
  levels?: string | null
  requiredForCore?: boolean
  notes?: string
  documents?: RawDocumentLink[]
}
type RawEntry = {
  id: string
  legacyIds?: string[]
  sectionId: string
  collectionId: string | null
  kind: string
  edition: string
  titleFr: string | null
  titleOriginal: string | null
  aliases: string[]
  number?: string | null
  levels: string | null
  regions: string[]
  locationStatus: string
  locationNote?: string
  tags: string[]
  arcIds: string[]
  synopsis: string | null
  gmDetails: string | null
  openTable: { rating: number; relevance?: string; rationale?: string; adaptation?: string; [key: string]: unknown }
  story: { thread?: string; usage?: Usage; period?: string; golarionDate?: string; acquisitionPriority?: string; [key: string]: unknown }
  characterHooks: Array<{ characterId: string; rationale: string }>
  documents: RawDocumentLink[]
  parts: RawPart[]
  coverage: { status: string; requiredItems: number; presentItems: number; missingItemIds: string[]; supplementItems: string[] }
  notes: string
  timeline?: { yearAR: number | null; estimated: boolean }
  organizedPlay?: { repeatable?: boolean; ruleAsOf?: string }
  researchStatus?: string
}
type RawCollection = {
  id: string
  sectionId: string
  parentId: string | null
  kind: string
  titleFr: string
  titleOriginal?: string
  season?: number
  order: number
  aggregateRegions?: string[]
  levels?: string
}
type RawFile = {
  id: string
  path: string
  filename: string
  extension?: string
  pages?: number | null
  roleHint?: string
  languageHint?: string
  translationVariant?: boolean
  association?: {
    status?: string
    campaignId?: string | null
    itemId?: string | null
    confidence?: string
    evidence?: string[]
  }
}

type RawCatalogue = {
  schemaVersion: number
  meta: { lastVerifiedAt?: string }
  files: RawFile[]
  entries: RawEntry[]
  collections: RawCollection[]
  arcs: Arc[]
  sections: CatalogueSection[]
  narrativeThreads?: NarrativeThread[]
}

const raw = canonical as unknown as RawCatalogue
const bundleRaw = bundleInventory as unknown as {
  schemaVersion: number
  inventoryKnown: boolean
  scannedAt: string | null
  bundles: ResourceBundle[]
}

const infoPattern = /(?:^|[\s._(\[-])(?:info|information)(?:[\s._)\]-]|$)/i
const playablePartKinds = new Set(['volume_aventure', 'aventure_autonome', 'one_shot', 'aventure_communautaire'])

const playableLabels: Record<PlayableType, string> = {
  campaignEpisode: 'Épisode de campagne',
  standaloneAdventure: 'Aventure autonome',
  pfsScenario: 'Scénario PFS',
  pfsIntro: 'Intro PFS',
  pfsSpecial: 'Spécial PFS',
  quest: 'Quest',
  bounty: 'Bounty',
  oneShot: 'One-shot',
  communityAdventure: 'Aventure communautaire',
  legacy: 'Legacy',
}

const containerLabels: Record<ContainerType, string> = {
  section: 'Section',
  collection: 'Collection',
  series: 'Série',
  pfsSeason: 'Saison PFS',
  campaign: 'Campagne',
  subcampaign: 'Sous-campagne',
}

const componentLabels: Record<ComponentType, string> = {
  playerGuide: 'Guide joueur',
  campaignCompilation: 'Compilation',
  map: 'Carte',
  companionGuide: 'Guide de compagnons',
  resource: 'Ressource',
  externalInfo: 'Information externe',
  translation: 'Traduction',
  other: 'Composant',
}

const normalizeText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function titles(fr: string | null | undefined, original: string | null | undefined, aliases: string[] = []): Titles {
  return { fr: fr ?? null, original: original ?? null, aliases }
}

export function titleOf(entity: { titles: Titles; id: string }): string {
  return entity.titles.fr || entity.titles.original || entity.id
}

export function originalTitleOf(entity: { titles: Titles }): string | null {
  return entity.titles.fr && entity.titles.original && entity.titles.fr !== entity.titles.original ? entity.titles.original : null
}

export function parseLevelRange(value: string | null | undefined, source: SourceRef = { kind: 'direct' }): LevelRange {
  const rawValue = value?.trim() || null
  if (!rawValue) return { min: null, max: null, rangeType: 'unknown', subtiers: [], raw: rawValue, source }
  const normalized = normalizeText(rawValue)
  if (normalized.includes('variable')) return { min: null, max: null, rangeType: 'variable', subtiers: [], raw: rawValue, source }

  const pairs = [...rawValue.matchAll(/(\d+)\s*[–—-]\s*(\d+)/g)].map((match) => ({ min: Number(match[1]), max: Number(match[2]) }))
  if (pairs.length > 1) {
    return {
      min: Math.min(...pairs.map((pair) => pair.min)),
      max: Math.max(...pairs.map((pair) => pair.max)),
      rangeType: 'subtier',
      subtiers: pairs,
      raw: rawValue,
      source,
    }
  }
  if (pairs.length === 1) {
    return { min: pairs[0].min, max: pairs[0].max, rangeType: 'interval', subtiers: [], raw: rawValue, source }
  }

  const numbers = rawValue.match(/\d+/g)?.map(Number) ?? []
  if (numbers.length === 1) {
    return { min: numbers[0], max: numbers[0], rangeType: 'fixed', subtiers: [], raw: rawValue, source }
  }
  return { min: null, max: null, rangeType: 'unknown', subtiers: [], raw: rawValue, source }
}

export function levelLabel(levels: LevelRange): string {
  if (levels.rangeType === 'variable') return levels.raw || 'Variable'
  if (levels.rangeType === 'unknown' || levels.min === null || levels.max === null) return levels.raw || 'À documenter'
  if (levels.rangeType === 'subtier' && levels.subtiers.length) return levels.subtiers.map((tier) => `${tier.min}–${tier.max}`).join(' / ')
  return levels.min === levels.max ? String(levels.min) : `${levels.min}–${levels.max}`
}

export function supportsLevel(levels: LevelRange, level: number): boolean {
  if (!Number.isFinite(level) || levels.min === null || levels.max === null) return false
  if (levels.rangeType === 'subtier' && levels.subtiers.length) return levels.subtiers.some((tier) => level >= tier.min && level <= tier.max)
  return level >= levels.min && level <= levels.max
}

function directLocations(entry: RawEntry): LocationFact[] {
  return entry.regions.map((id, index) => ({ id, role: index === 0 ? 'primary' : 'secondary', source: { kind: 'direct', entityId: entry.id } }))
}

function inheritedLocations(entry: RawEntry): LocationFact[] {
  return entry.regions.map((id, index) => ({ id, role: index === 0 ? 'primary' : 'secondary', source: { kind: 'inherited', entityId: entry.id } }))
}

function relevanceOfRaw(entry: RawEntry): string {
  return entry.openTable?.relevance || entry.story?.acquisitionPriority || 'À évaluer'
}

function defaultPlayability(entry: RawEntry): Playability {
  return entry.openTable.rating <= 1 ? 'Simple inspiration' : entry.openTable.rating === 2 ? 'À adapter' : 'Prêt'
}

function playableTypeFromEntry(entry: RawEntry): PlayableType {
  if (entry.sectionId === 'legacy' || entry.kind === 'pfs1e-special') return 'legacy'
  const map: Record<string, PlayableType> = {
    adventure: 'standaloneAdventure',
    'pfs-scenario': 'pfsScenario',
    'pfs-intro': 'pfsIntro',
    'pfs-special': 'pfsSpecial',
    quest: 'quest',
    bounty: 'bounty',
    'one-shot': 'oneShot',
    'community-adventure': 'communityAdventure',
  }
  return map[entry.kind] ?? 'standaloneAdventure'
}

function playableTypeFromPart(part: RawPart): PlayableType {
  if (part.kind === 'one_shot') return 'oneShot'
  if (part.kind === 'aventure_communautaire') return 'communityAdventure'
  if (part.kind === 'aventure_autonome') return 'standaloneAdventure'
  return 'campaignEpisode'
}

function componentType(part: RawPart): ComponentType {
  const map: Record<string, ComponentType> = {
    guide_joueurs: 'playerGuide',
    compilation_campagne: 'campaignCompilation',
    cartes_interactives: 'map',
    guide_compagnons: 'companionGuide',
    ressource: 'resource',
    information: 'externalInfo',
    traduction: 'translation',
  }
  return map[part.kind] ?? 'other'
}

function collectionType(collection: RawCollection): ContainerType {
  if (collection.kind === 'pfs-season') return 'pfsSeason'
  if (collection.kind === 'series') return 'series'
  return 'collection'
}

export const sections: CatalogueSection[] = raw.sections.slice().sort((a, b) => a.order - b.order)
export const arcs: Arc[] = raw.arcs
export const arcMap = new Map(arcs.map((arc) => [arc.id, arc]))
export const narrativeThreads: NarrativeThread[] = raw.narrativeThreads ?? []

const campaignEntries = raw.entries.filter((entry) => entry.kind === 'campaign')
const campaignIds = new Set(campaignEntries.map((entry) => entry.id))

const collectionContainers: Container[] = raw.collections.map((collection) => ({
  id: collection.id,
  entityKind: 'container',
  containerType: collectionType(collection),
  sectionId: collection.sectionId,
  parentId: collection.parentId,
  titles: titles(collection.titleFr, collection.titleOriginal ?? null),
  order: collection.order,
  season: collection.season,
  synopsis: null,
  gmDetails: null,
  locations: (collection.aggregateRegions ?? []).map((id) => ({ id, role: 'secondary', source: { kind: 'aggregate', entityId: collection.id } })),
  levels: parseLevelRange(collection.levels ?? null, { kind: 'aggregate', entityId: collection.id }),
  relevance: { value: 'À évaluer', source: { kind: 'aggregate', entityId: collection.id } },
  editorialStatus: null,
  chronology: { yearAR: null, estimated: true, period: null },
  arcIds: [],
  migration: { status: 'ready', issues: [] },
}))

const campaignContainers: Container[] = campaignEntries.map((entry) => {
  const playableChildren = entry.parts.filter((part) => playablePartKinds.has(part.kind))
  const issues: string[] = []
  if (!playableChildren.length) issues.push('Découpage en unités jouables à créer : aucune part jouable explicite dans le schéma V2.')
  if (playableChildren.some((part) => !part.levels)) issues.push('Niveaux d’un ou plusieurs épisodes à documenter.')
  return {
    id: entry.id,
    entityKind: 'container',
    containerType: 'campaign',
    sectionId: entry.sectionId,
    parentId: entry.collectionId,
    titles: titles(entry.titleFr, entry.titleOriginal, entry.aliases),
    order: 0,
    synopsis: entry.synopsis,
    gmDetails: entry.gmDetails,
    locations: directLocations(entry),
    levels: parseLevelRange(entry.levels, { kind: 'aggregate', entityId: entry.id, note: 'Plage globale de la campagne, non héritée automatiquement par les épisodes.' }),
    relevance: { value: relevanceOfRaw(entry), source: { kind: 'direct', entityId: entry.id } },
    editorialStatus: entry.story.usage ?? null,
    chronology: { yearAR: entry.timeline?.yearAR ?? null, estimated: entry.timeline?.estimated ?? true, period: entry.story.period ?? null },
    arcIds: entry.arcIds,
    legacyEntryId: entry.id,
    migration: { status: issues.length ? 'needsReview' : 'ready', issues },
  }
})

export const containers: Container[] = [...collectionContainers, ...campaignContainers]
export const containerMap = new Map(containers.map((container) => [container.id, container]))

const directPlayableUnits: PlayableUnit[] = raw.entries.filter((entry) => entry.kind !== 'campaign').map((entry) => {
  const levels = parseLevelRange(entry.levels, { kind: 'direct', entityId: entry.id })
  const issues: string[] = []
  if (levels.rangeType === 'unknown') issues.push('Niveaux à documenter ou à vérifier.')
  if (!entry.regions.length && entry.locationStatus !== 'variable') issues.push('Lieux à documenter.')
  return {
    id: entry.id,
    entityKind: 'playable',
    playableType: playableTypeFromEntry(entry),
    sectionId: entry.sectionId,
    parentId: entry.collectionId,
    legacyEntryId: entry.id,
    legacyEntryKind: entry.kind,
    number: entry.number ?? null,
    titles: titles(entry.titleFr, entry.titleOriginal, entry.aliases),
    levels,
    locations: directLocations(entry),
    synopsis: entry.synopsis,
    contextSynopsis: null,
    gmDetails: entry.gmDetails,
    relevance: { value: relevanceOfRaw(entry), source: { kind: 'direct', entityId: entry.id } },
    playability: defaultPlayability(entry),
    tracking: 'Non spécifié',
    editorialStatus: entry.story.usage ?? null,
    chronology: { yearAR: entry.timeline?.yearAR ?? null, estimated: entry.timeline?.estimated ?? true, period: entry.story.period ?? null },
    arcIds: entry.arcIds,
    narrativeThread: entry.story.thread ?? null,
    characterHooks: entry.characterHooks,
    organizedPlay: entry.organizedPlay,
    migration: { status: issues.length ? 'needsReview' : 'ready', issues },
  }
})

const campaignEpisodeUnits: PlayableUnit[] = campaignEntries.flatMap((entry) =>
  entry.parts.filter((part) => playablePartKinds.has(part.kind)).map((part) => {
    const levels = parseLevelRange(part.levels, { kind: 'direct', entityId: part.id })
    const issues: string[] = []
    if (levels.rangeType === 'unknown') issues.push('Niveaux de l’épisode inconnus : la plage globale de campagne n’est volontairement pas héritée.')
    if (!part.titleFr && !part.titleOriginal) issues.push('Titre propre de l’épisode à documenter.')
    return {
      id: part.id,
      entityKind: 'playable',
      playableType: playableTypeFromPart(part),
      sectionId: entry.sectionId,
      parentId: entry.id,
      legacyEntryId: entry.id,
      legacyEntryKind: entry.kind,
      number: part.number ?? (part.sequence ? String(part.sequence) : null),
      titles: titles(part.titleFr, part.titleOriginal),
      levels,
      locations: inheritedLocations(entry),
      synopsis: null,
      contextSynopsis: entry.synopsis,
      gmDetails: null,
      relevance: { value: relevanceOfRaw(entry), source: { kind: 'inherited', entityId: entry.id } },
      playability: defaultPlayability(entry),
      tracking: 'Non spécifié',
      editorialStatus: entry.story.usage ?? null,
      chronology: { yearAR: entry.timeline?.yearAR ?? null, estimated: entry.timeline?.estimated ?? true, period: entry.story.period ?? null },
      arcIds: entry.arcIds,
      narrativeThread: entry.story.thread ?? null,
      characterHooks: entry.characterHooks,
      migration: { status: issues.length ? 'needsReview' : 'ready', issues, generatedFromPart: true },
    }
  }),
)

export const playableUnits: PlayableUnit[] = [...directPlayableUnits, ...campaignEpisodeUnits]
export const playableMap = new Map(playableUnits.map((unit) => [unit.id, unit]))

export const components: Component[] = raw.entries.flatMap((entry) =>
  entry.parts.filter((part) => !(entry.kind === 'campaign' && playablePartKinds.has(part.kind))).map((part) => ({
    id: part.id,
    entityKind: 'component' as const,
    componentType: componentType(part),
    ownerId: entry.id,
    titles: titles(part.titleFr, part.titleOriginal),
    order: part.sequence ?? null,
    number: part.number ?? null,
    levels: parseLevelRange(part.levels, { kind: 'direct', entityId: part.id }),
    requiredForCore: Boolean(part.requiredForCore),
    notes: part.notes ?? '',
    legacyEntryId: entry.id,
    rawKind: part.kind,
  })),
)
export const componentMap = new Map(components.map((component) => [component.id, component]))

const rawEntryMap = new Map(raw.entries.map((entry) => [entry.id, entry]))
const rawPartMap = new Map(raw.entries.flatMap((entry) => entry.parts.map((part) => [part.id, { entry, part }] as const)))
const rawFileMap = new Map(raw.files.map((file) => [file.id, file]))

function variantOf(rawVariant: string | undefined, file: RawFile): DocumentVariant {
  if (rawVariant === 'fr_officiel') return 'officialFr'
  if (rawVariant === 'français') return 'french'
  if (rawVariant === 'traduction_partielle') return 'translationPartial'
  if (rawVariant === 'traduction_non_officielle') return 'translationUnofficial'
  if (rawVariant === 'anglais') return 'original'
  if (file.translationVariant) return 'translationUnofficial'
  return 'other'
}

function languageOfFile(file: RawFile): Langue {
  if (file.languageHint === 'fr') return 'FR'
  if (file.languageHint === 'en') return 'EN'
  return 'INCONNUE'
}

function targetKindOf(targetId: string | null): CatalogueDocument['targetKind'] {
  if (!targetId) return null
  if (playableMap.has(targetId)) return 'playable'
  if (containerMap.has(targetId)) return 'container'
  if (componentMap.has(targetId)) return 'component'
  return null
}

function associationStatus(file: RawFile): AssociationStatus {
  if (!file.association?.itemId || file.association.status === 'non_associé') return 'unassociated'
  const confidence = normalizeText(file.association.confidence ?? '')
  if (confidence.includes('confirm') || confidence.includes('certain')) return 'confirmed'
  return 'review'
}

function linkedVariant(fileId: string): { variant: string; completeness: string; evidence: string[] } | null {
  for (const entry of raw.entries) {
    const direct = entry.documents.find((document) => document.fileId === fileId)
    if (direct) return { variant: direct.variant, completeness: direct.completeness, evidence: direct.evidence ?? [] }
    for (const part of entry.parts) {
      const linked = part.documents?.find((document) => document.fileId === fileId)
      if (linked) return { variant: linked.variant, completeness: linked.completeness, evidence: linked.evidence ?? [] }
    }
  }
  return null
}

function targetForFile(file: RawFile): string | null {
  const itemId = file.association?.itemId ?? null
  if (itemId && (playableMap.has(itemId) || componentMap.has(itemId) || containerMap.has(itemId))) return itemId
  const campaignId = file.association?.campaignId ?? null
  if (campaignId && containerMap.has(campaignId)) return campaignId
  return null
}

function roleForTarget(targetId: string | null, isInfo: boolean): DocumentRole {
  if (isInfo) return 'information'
  if (!targetId) return 'resource'
  const component = componentMap.get(targetId)
  if (component) return component.requiredForCore ? 'core' : 'resource'
  return playableMap.has(targetId) ? 'core' : 'optional'
}

export const documents: CatalogueDocument[] = raw.files.map((file) => {
  const link = linkedVariant(file.id)
  const targetId = targetForFile(file)
  const isInfo = infoPattern.test(file.filename)
  const rawVariant = link?.variant ?? (file.translationVariant ? 'traduction_non_officielle' : file.languageHint === 'en' ? 'anglais' : 'français')
  const completeness = link?.completeness === 'complet' ? 'complete' : link?.completeness === 'partiel' ? 'partial' : 'unknown'
  return {
    id: file.id,
    entityKind: 'document',
    filename: file.filename,
    path: file.path,
    href: `/bibliotheque/${file.path.split('/').map(encodeURIComponent).join('/')}`,
    pages: file.pages ?? null,
    language: languageOfFile(file),
    variant: variantOf(rawVariant, file),
    rawVariant,
    role: roleForTarget(targetId, isInfo),
    completeness,
    targetId,
    targetKind: targetKindOf(targetId),
    association: {
      status: associationStatus(file),
      confidence: file.association?.confidence ?? null,
      evidence: [...new Set([...(file.association?.evidence ?? []), ...(link?.evidence ?? [])])],
    },
    isInformationFallback: isInfo,
  }
})

export const documentMap = new Map(documents.map((document) => [document.id, document]))

export let resourceInventoryKnown = bundleRaw.inventoryKnown
export let resourceBundles: ResourceBundle[] = bundleRaw.bundles ?? []

let runtimePdfPaths: Set<string> | null = null
let runtimeInformationDocuments: CatalogueDocument[] = []

export function applyResourceBundleInventory(inventory: ResourceBundleInventory | null | undefined): void {
  if (!inventory) return
  resourceInventoryKnown = Boolean(inventory.inventoryKnown)
  resourceBundles = Array.isArray(inventory.bundles) ? inventory.bundles : []
}

export function applyLocalScanInventory(scan: LocalScanInventory | null | undefined): void {
  if (!scan) return
  if (Array.isArray(scan.pdfPaths)) runtimePdfPaths = new Set(scan.pdfPaths.map((path) => path.replace(/\\/g, '/')))
  if (scan.resourceInventory) applyResourceBundleInventory(scan.resourceInventory)

  runtimeInformationDocuments = (scan.classifiedNewPdfs ?? [])
    .filter((item) => item.informationOnly && item.entryId)
    .map((item, index): CatalogueDocument => {
      const path = item.path.replace(/\\/g, '/')
      const filename = path.split('/').at(-1) ?? path
      const targetId = item.entryId
      return {
        id: `runtime-info-${index}-${normalizeText(path).replace(/[^a-z0-9]+/g, '-')}`,
        entityKind: 'document',
        filename,
        path,
        href: `/bibliotheque/${path.split('/').map(encodeURIComponent).join('/')}`,
        pages: null,
        language: 'INCONNUE',
        variant: 'other',
        rawVariant: 'information',
        role: 'information',
        completeness: 'unknown',
        targetId,
        targetKind: targetKindOf(targetId),
        association: {
          status: item.association === 'confirmed' ? 'confirmed' : item.association === 'review' ? 'review' : 'review',
          confidence: item.score === null || item.score === undefined ? null : String(item.score),
          evidence: ['scan local', 'nom de fichier (info)']
        },
        isInformationFallback: true,
        runtime: true
      }
    })
}

export function currentDocuments(): CatalogueDocument[] {
  const staticPaths = new Set(documents.map((document) => document.path))
  return [...documents, ...runtimeInformationDocuments.filter((document) => !staticPaths.has(document.path))]
}

export function documentPresence(document: CatalogueDocument): 'present' | 'missing' | 'unknown' {
  if (document.runtime) return 'present'
  if (!runtimePdfPaths) return 'unknown'
  return runtimePdfPaths.has(document.path.replace(/\\/g, '/')) ? 'present' : 'missing'
}

export function playableTypeLabel(type: PlayableType): string { return playableLabels[type] }
export function containerTypeLabel(type: ContainerType): string { return containerLabels[type] }
export function componentTypeLabel(type: ComponentType): string { return componentLabels[type] }

export function parentContainer(entity: PlayableUnit | Container): Container | null {
  return entity.parentId ? containerMap.get(entity.parentId) ?? null : null
}

export function ancestorContainers(entity: PlayableUnit | Container): Container[] {
  const result: Container[] = []
  let current = parentContainer(entity)
  const seen = new Set<string>()
  while (current && !seen.has(current.id)) {
    result.push(current)
    seen.add(current.id)
    current = current.parentId ? containerMap.get(current.parentId) ?? null : null
  }
  return result
}

export function childrenOf(containerId: string): Array<Container | PlayableUnit> {
  return [
    ...containers.filter((container) => container.parentId === containerId),
    ...playableUnits.filter((unit) => unit.parentId === containerId),
  ]
}

export function playablesUnder(containerId: string): PlayableUnit[] {
  const result: PlayableUnit[] = []
  const queue = [containerId]
  const seen = new Set<string>()
  while (queue.length) {
    const id = queue.shift()!
    if (seen.has(id)) continue
    seen.add(id)
    result.push(...playableUnits.filter((unit) => unit.parentId === id))
    queue.push(...containers.filter((container) => container.parentId === id).map((container) => container.id))
  }
  return result
}

export function componentsOf(ownerId: string): Component[] {
  return components.filter((component) => component.ownerId === ownerId).sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || titleOf(a).localeCompare(titleOf(b), 'fr'))
}

export function documentsForTarget(targetId: string): CatalogueDocument[] {
  return currentDocuments().filter((document) => document.targetId === targetId)
}

function requirementTargetIds(unit: PlayableUnit): string[] {
  const requiredComponents = componentsOf(unit.id).filter((component) => component.requiredForCore)
  const directDocuments = documentsForTarget(unit.id)
  if (requiredComponents.length) {
    const targets = requiredComponents.map((component) => component.id)
    if (directDocuments.length) targets.unshift(unit.id)
    return targets
  }
  return [unit.id]
}

function fullDocument(document: CatalogueDocument): boolean {
  return documentPresence(document) !== 'missing' && !document.isInformationFallback && document.completeness === 'complete' && document.association.status !== 'unassociated'
}

function statusAcrossTargets(targetIds: string[], predicate: (document: CatalogueDocument) => boolean): AvailabilityState {
  if (!targetIds.length) return 'uncertain'
  let complete = 0
  let partial = 0
  let uncertain = 0
  for (const targetId of targetIds) {
    const targetDocuments = documentsForTarget(targetId).filter((document) => documentPresence(document) !== 'missing').filter(predicate)
    if (targetDocuments.some(fullDocument)) complete += 1
    else if (targetDocuments.some((document) => document.completeness === 'partial')) partial += 1
    else if (targetDocuments.some((document) => document.association.status === 'review' || document.completeness === 'unknown')) uncertain += 1
  }
  if (complete === targetIds.length) return 'complete'
  if (complete || partial) return 'partial'
  if (uncertain) return 'uncertain'
  return 'absent'
}

function targetFrenchMode(targetId: string): 'official' | 'translated' | 'frenchOriginal' | 'partial' | 'none' | 'uncertain' {
  const targetDocuments = documentsForTarget(targetId).filter((document) => documentPresence(document) !== 'missing' && !document.isInformationFallback)
  if (targetDocuments.some((document) => fullDocument(document) && document.variant === 'officialFr')) return 'official'
  if (targetDocuments.some((document) => fullDocument(document) && document.language === 'FR' && document.variant === 'french')) return 'frenchOriginal'
  if (targetDocuments.some((document) => fullDocument(document) && document.variant === 'translationUnofficial')) return 'translated'
  if (targetDocuments.some((document) => document.language === 'FR' || document.variant === 'translationPartial')) return 'partial'
  if (targetDocuments.some((document) => document.association.status === 'review')) return 'uncertain'
  return 'none'
}

export function availabilityOf(unit: PlayableUnit): AvailabilitySummary {
  const targets = requirementTargetIds(unit)
  let present = 0
  let informationOnly = 0
  const missingTargetIds: string[] = []

  for (const targetId of targets) {
    const targetDocuments = documentsForTarget(targetId)
    if (targetDocuments.some(fullDocument)) present += 1
    else if (targetDocuments.some((document) => documentPresence(document) !== 'missing' && document.isInformationFallback && document.association.status !== 'unassociated')) informationOnly += 1
    else missingTargetIds.push(targetId)
  }

  let coreMaterial: AvailabilityState
  if (present === targets.length) coreMaterial = 'complete'
  else if (missingTargetIds.length === 0 && informationOnly > 0) coreMaterial = 'informationOnly'
  else if (present > 0 || informationOnly > 0 || targets.some((id) => documentsForTarget(id).some((document) => documentPresence(document) !== 'missing' && document.completeness === 'partial'))) coreMaterial = 'partial'
  else if (targets.some((id) => documentsForTarget(id).some((document) => documentPresence(document) !== 'missing' && document.association.status === 'review'))) coreMaterial = 'uncertain'
  else coreMaterial = 'absent'

  const frenchModes = targets.map(targetFrenchMode)
  const readyInFrench = frenchModes.every((mode) => ['official', 'translated', 'frenchOriginal'].includes(mode))
  let frenchState: FrenchState
  if (readyInFrench) {
    const onlyOfficial = frenchModes.every((mode) => mode === 'official' || mode === 'frenchOriginal')
    const onlyTranslated = frenchModes.every((mode) => mode === 'translated')
    frenchState = onlyOfficial ? 'official' : onlyTranslated ? 'translated' : 'mixed'
  } else if (frenchModes.some((mode) => mode === 'partial' || mode === 'official' || mode === 'translated' || mode === 'frenchOriginal')) frenchState = 'partial'
  else if (frenchModes.some((mode) => mode === 'uncertain')) frenchState = 'uncertain'
  else frenchState = 'none'

  const optionalTargets = componentsOf(unit.id).filter((component) => !component.requiredForCore)
  const optionalPresent = optionalTargets.filter((component) => documentsForTarget(component.id).some((document) => documentPresence(document) !== 'missing' && document.association.status !== 'unassociated')).length

  return {
    coreMaterial,
    original: statusAcrossTargets(targets, (document) => document.variant === 'original' || document.variant === 'french'),
    officialFr: statusAcrossTargets(targets, (document) => document.variant === 'officialFr' || (document.variant === 'french' && document.language === 'FR')),
    translation: statusAcrossTargets(targets, (document) => document.variant === 'translationPartial' || document.variant === 'translationUnofficial'),
    requiredDocuments: { status: coreMaterial, present, informationOnly, required: targets.length, missingTargetIds },
    optionalResources: { present: optionalPresent, known: optionalTargets.length },
    readyInFrench,
    frenchState,
  }
}

export function resourceBundleAvailability(unit: PlayableUnit): ResourceBundleAvailability {
  if (!resourceInventoryKnown) return { status: 'unknown', direct: false, inheritedFromId: null, bundles: [] }

  const directConfirmed = resourceBundles.filter((bundle) => bundle.associationStatus === 'confirmed' && bundle.targetId === unit.id && bundle.presence === 'present')
  if (directConfirmed.length) return { status: 'present', direct: true, inheritedFromId: null, bundles: directConfirmed }

  const directReview = resourceBundles.filter((bundle) => bundle.associationStatus === 'review' && bundle.targetId === unit.id && bundle.presence === 'present')
  if (directReview.length) return { status: 'uncertain', direct: true, inheritedFromId: null, bundles: directReview }

  let inheritedReview: ResourceBundleAvailability | null = null
  for (const ancestor of ancestorContainers(unit)) {
    const inheritedConfirmed = resourceBundles.filter((bundle) => bundle.associationStatus === 'confirmed' && bundle.targetId === ancestor.id && bundle.scope === 'descendants' && bundle.presence === 'present')
    if (inheritedConfirmed.length) return { status: 'present', direct: false, inheritedFromId: ancestor.id, bundles: inheritedConfirmed }

    const review = resourceBundles.filter((bundle) => bundle.associationStatus === 'review' && bundle.targetId === ancestor.id && bundle.scope === 'descendants' && bundle.presence === 'present')
    if (review.length && !inheritedReview) inheritedReview = { status: 'uncertain', direct: false, inheritedFromId: ancestor.id, bundles: review }
  }

  return inheritedReview ?? { status: 'missing', direct: false, inheritedFromId: null, bundles: [] }
}

export function availabilityLabel(status: AvailabilityState): string {
  return status === 'complete' ? 'Complet' : status === 'partial' ? 'Partiel' : status === 'informationOnly' ? 'Info seule' : status === 'absent' ? 'Absent' : 'Incertain'
}

export function frenchStateLabel(state: FrenchState): string {
  return state === 'official' ? 'FR officiel' : state === 'translated' ? 'Traduit FR' : state === 'mixed' ? 'FR mixte' : state === 'partial' ? 'FR partiel' : state === 'none' ? 'Pas de FR' : 'FR incertain'
}

export function resourceBundleLabel(value: ResourceBundleAvailability): string {
  if (value.status === 'unknown') return 'ZIP non inventorié'
  if (value.status === 'missing') return 'ZIP manquant'
  if (value.status === 'uncertain') return value.inheritedFromId ? `ZIP hérité à vérifier` : 'ZIP à vérifier'
  if (value.direct) return 'ZIP disponible'
  return `ZIP hérité de ${value.inheritedFromId ?? 'un parent'}`
}

export function locationLabel(locations: LocationFact[]): string {
  if (!locations.length) return 'À documenter'
  return [...new Set(locations.map((location) => location.id))].join(', ')
}

export function relevanceOf(entity: PlayableUnit | Container): string { return entity.relevance.value }
export function yearOf(entity: PlayableUnit | Container): number | null { return entity.chronology.yearAR }
export function isPfsPlayable(unit: PlayableUnit): boolean { return ['pfsScenario', 'pfsIntro', 'pfsSpecial', 'quest', 'bounty'].includes(unit.playableType) }

export const migrationIssues = [
  ...containers.flatMap((container) => container.migration.issues.map((message) => ({ entityId: container.id, entityKind: 'container' as const, message }))),
  ...playableUnits.flatMap((unit) => unit.migration.issues.map((message) => ({ entityId: unit.id, entityKind: 'playable' as const, message }))),
  ...documents.filter((document) => document.association.status !== 'confirmed').map((document) => ({ entityId: document.id, entityKind: 'document' as const, message: document.association.status === 'unassociated' ? 'Document non associé.' : 'Association documentaire à vérifier.' })),
]

export const allPlaces = [...new Set(playableUnits.flatMap((unit) => unit.locations.map((location) => location.id)))].sort((a, b) => a.localeCompare(b, 'fr'))

export const scanMeta = {
  total: raw.files.length,
  verifiedAt: raw.meta.lastVerifiedAt ?? null,
  sourceSchemaVersion: raw.schemaVersion,
  runtimeSchemaVersion: 3,
  resourceInventoryKnown,
  resourceBundles: resourceBundles.length,
}

// Export du V2 pour les écrans/diagnostics de migration uniquement.
export const legacy = {
  entries: raw.entries,
  collections: raw.collections,
  files: raw.files,
  rawEntryMap,
  rawPartMap,
  rawFileMap,
  campaignIds,
}
