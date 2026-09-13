'use client'

import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom'
import GeographyPicker from './GeographyPicker'
import {
  allPlaces,
  applyLocalScanInventory,
  ancestorContainers,
  arcMap,
  arcs,
  availabilityOf,
  availabilityLabel,
  componentTypeLabel,
  componentsOf,
  containerMap,
  containerTypeLabel,
  containers,
  currentDocuments,
  documentHref,
  documentaryModeLabel,
  documentPresence,
  documentsForTarget,
  levelLabel,
  loadCatalogueFromApi,
  migrationIssues,
  parseLevelRange,
  playableMap,
  playableTypeLabel,
  playableUnits,
  playablesUnder,
  relevanceOf,
  resourceBundleAvailability,
  resourceBundleLabel,
  resourceInventoryKnown,
  sections,
  supportsLevel,
  titleOf,
  originalTitleOf,
  yearOf,
  type CatalogueDocument,
  type Component,
  type Container,
  type LevelRange,
  type LocationFact,
  type Playability,
  type PlayableComponent,
  type PlayableUnit,
  type Progress,
  type ResourceBundleInventory,
} from './catalogue'
import PnjPage from './Pnj'
import FactionsPage from './Factions'
import LieuxPage from './Lieux'
import RegionsPage from './Regions'
import EvenementsPage from './Evenements'
import { expandedPlaceLabels, geographyTreeOptions, loadGeographyFromApi, matchesPlaceFilter, placeDisplay } from './geography'
import { containerHref, playableHref, referenceHref, resolvePf2Route, viewPaths, type ReferenceView, type View } from './routing'

type PreparationTab = 'pdf' | 'translation' | 'zip' | 'components'
type MaintenanceTab = 'info' | 'description' | 'uncertain' | 'metadata'
type LifecycleStatus = 'untracked' | 'retained' | 'to_play' | 'in_progress' | 'played' | 'later' | 'rejected'
type SelectedEntity = PlayableUnit | Container
type PreparationStatus = 'untreated' | 'selected' | 'ready'
type PlayStatus = 'none' | 'to_play' | 'in_progress' | 'played'

type StructuredLocationOverride = {
  mode: 'replace' | 'merge'
  values?: string[]
  add?: string[]
  remove?: string[]
}

type EntryOverride = {
  excluded?: boolean
  excludedReason?: 'later' | 'rejected' | null
  inclusion?: 'default' | 'excluded' | 'reinstated'
  playability?: Playability
  /** Legacy V3, lecture de transition uniquement. */
  progress?: Progress
  preparationStatus?: PreparationStatus
  playStatus?: PlayStatus
  levelsOverride?: string
  placesOverride?: string[]
  relevance?: string
  locations?: StructuredLocationOverride
  playableComponentStatus?: Record<string, 'played'>
}

type Curation = {
  schemaVersion?: number
  byId?: Record<string, EntryOverride>
  entries?: Record<string, EntryOverride>
  excludedCampaignIds?: string[]
  includedCampaignIds?: string[]
  excludedScenarioIds?: string[]
  playabilityByCampaign?: Record<string, Playability>
  playabilityByScenario?: Record<string, Playability>
  progressByCampaign?: Record<string, Progress>
  progressByScenario?: Record<string, Progress>
  levelsByCampaign?: Record<string, string>
  levelsByScenario?: Record<string, string>
  placesByCampaign?: Record<string, string[]>
  placesByScenario?: Record<string, string[]>
  placeRenames?: Record<string, string>
  deletedPlaces?: string[]
  customPlaces?: string[]
}

type ResolvedOverride = EntryOverride & {
  sourceId: string
  inheritedFromParent: boolean
}

type ScanReport = {
  scannedAt: string
  totalOnDisk: number
  knownInCatalogue: number
  summary: {
    added: number
    translations: number
    translationsCertain: number
    removed: number
    relocated?: number
    ignoredMetadata?: number
    information?: number
    informationAdded?: number
    zips?: number
    zipsAssociated?: number
    zipsToReview?: number
  }
  translations: { path: string; originalPath: string | null; association: 'certaine' | 'à vérifier' }[]
  classifiedNewPdfs: { path: string; entryId: string; campaignId: string | null; association?: string; score?: number | null; informationOnly?: boolean }[]
  informationPdfs?: string[]
  addedInformationPdfs?: string[]
  pdfPaths?: string[]
  pdfAliases?: Record<string, string>
  relocations?: { cataloguePath: string; diskPath: string; reason: 'normalized-path' | 'unique-filename' }[]
  ignoredMetadataFiles?: number
  newPdfs: string[]
  removed: string[]
  resourceInventory?: ResourceBundleInventory
}

type Filters = {
  query: string
  level: string
  place: string
  french: string
  availability: string
  relevance: string
  playability: string
  lifecycleStatus: string
  type: string
  yearFrom: string
  yearTo: string
  arc: string
  thread: string
  bundle: string
  description: string
}

const emptyFilters: Filters = {
  query: '', level: '', place: '', french: '', availability: '', relevance: '', playability: '', lifecycleStatus: '', type: '', yearFrom: '', yearTo: '', arc: '', thread: '', bundle: '', description: '',
}

const playabilityOptions: Playability[] = ['Prêt', 'À adapter', 'Simple inspiration']
const relevanceOrder: Record<string, number> = { 'Très haute': 0, Haute: 1, Moyenne: 2, Basse: 3, Aucune: 4, Variable: 5, 'À évaluer': 6 }
const preparationTabs: Array<[PreparationTab, string]> = [
  ['pdf', 'PDF requis'], ['translation', 'Traductions'], ['zip', 'ZIP Foundry'], ['components', 'Découpage jouable'],
]
const maintenanceTabs: Array<[MaintenanceTab, string]> = [
  ['info', 'Info seules'], ['description', 'Descriptions'], ['uncertain', 'À vérifier'], ['metadata', 'Métadonnées'],
]
const lifecycleOptions: Array<[LifecycleStatus, string]> = [
  ['untracked', '—'], ['retained', 'Retenu'], ['to_play', 'À jouer'], ['in_progress', 'En cours'], ['played', 'Terminé'], ['later', 'Plus tard'], ['rejected', 'Écarté'],
]
const lifecycleLabels = Object.fromEntries(lifecycleOptions) as Record<LifecycleStatus, string>

const tone = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'))
const fileName = (path: string) => path.split('/').at(-1) || path

function Badge({ children }: { children: React.ReactNode }) {
  return <span className={`badge b-${tone(String(children))}`}>{children}</span>
}

function SourceBadge({ source }: { source: { kind: string; entityId?: string } }) {
  const labels: Record<string, string> = { direct: 'propre', inherited: 'hérité', aggregate: 'agrégé', curation: 'surcharge MJ', migration: 'migration' }
  return <small className={`source-badge source-${source.kind}`}>{labels[source.kind] ?? source.kind}{source.entityId ? ` · ${titleOf(containerMap.get(source.entityId) ?? playableMap.get(source.entityId) ?? { id: source.entityId, titles: { fr: source.entityId, original: null, aliases: [] } })}` : ''}</small>
}

function EntityPage({ backTo, children }: { backTo: string; children: React.ReactNode }) {
  return <section className="entity-page"><div className="entity-page-toolbar"><Link to={backTo}>← Retour au catalogue</Link><span>URL permanente · ouvrable dans un autre onglet</span></div><article className="entity-page-card">{children}</article></section>
}

function genericOverride(curation: Curation, id: string): EntryOverride {
  return curation.byId?.[id] ?? curation.entries?.[id] ?? {}
}

function legacyProgressStatus(progress?: Progress): Pick<EntryOverride, 'excluded' | 'preparationStatus' | 'playStatus'> {
  if (progress === 'Écarté') return { excluded: true }
  if (progress === 'Sélectionné') return { preparationStatus: 'selected', playStatus: 'none' }
  if (progress === 'À jouer') return { preparationStatus: 'selected', playStatus: 'to_play' }
  if (progress === 'En cours') return { preparationStatus: 'untreated', playStatus: 'in_progress' }
  if (progress === 'Joué') return { preparationStatus: 'untreated', playStatus: 'played' }
  return {}
}

function legacyOverride(curation: Curation, id: string, scenario: boolean): EntryOverride {
  const generic = genericOverride(curation, id)
  const excludedCampaignIds = curation.excludedCampaignIds ?? []
  const includedCampaignIds = curation.includedCampaignIds ?? []
  const excludedScenarioIds = curation.excludedScenarioIds ?? []
  const excludedLegacy = scenario ? excludedScenarioIds.includes(id) : excludedCampaignIds.includes(id)
  const reinstatedLegacy = !scenario && includedCampaignIds.includes(id)
  const progress = generic.progress ?? (scenario ? curation.progressByScenario?.[id] : curation.progressByCampaign?.[id])
  const migrated = legacyProgressStatus(progress)
  return {
    ...generic,
    excluded: generic.excluded ?? migrated.excluded ?? (generic.inclusion === 'excluded' ? true : generic.inclusion === 'reinstated' ? false : reinstatedLegacy ? false : excludedLegacy),
    playability: generic.playability ?? (scenario ? curation.playabilityByScenario?.[id] : curation.playabilityByCampaign?.[id]),
    preparationStatus: generic.preparationStatus ?? migrated.preparationStatus,
    playStatus: generic.playStatus ?? migrated.playStatus,
    levelsOverride: generic.levelsOverride ?? (scenario ? curation.levelsByScenario?.[id] : curation.levelsByCampaign?.[id]),
    placesOverride: generic.placesOverride ?? (scenario ? curation.placesByScenario?.[id] : curation.placesByCampaign?.[id]),
  }
}

function isLegacyScenario(unit: PlayableUnit): boolean {
  return ['pfsScenario', 'pfsIntro', 'pfsSpecial'].includes(unit.playableType)
}

function resolvePlayableOverride(curation: Curation, unit: PlayableUnit): ResolvedOverride {
  const direct = legacyOverride(curation, unit.id, isLegacyScenario(unit))
  if (unit.legacyEntryId === unit.id) return { ...direct, sourceId: unit.id, inheritedFromParent: false }

  const parent = legacyOverride(curation, unit.legacyEntryId, false)
  return {
    ...direct,
    excluded: direct.excluded ?? parent.excluded,
    excludedReason: direct.excludedReason ?? parent.excludedReason ?? null,
    playability: direct.playability ?? parent.playability,
    // Les niveaux et le suivi ne sont volontairement pas hérités d'une campagne globale.
    placesOverride: direct.placesOverride ?? parent.placesOverride,
    locations: direct.locations ?? parent.locations,
    relevance: direct.relevance ?? parent.relevance,
    sourceId: Object.keys(genericOverride(curation, unit.id)).length ? unit.id : unit.legacyEntryId,
    inheritedFromParent: !Object.keys(genericOverride(curation, unit.id)).length,
  }
}

function resolveContainerOverride(curation: Curation, container: Container): ResolvedOverride {
  const value = legacyOverride(curation, container.id, false)
  return { ...value, sourceId: container.id, inheritedFromParent: false }
}

function applyLocationOverride(base: LocationFact[], override: EntryOverride, sourceId: string): LocationFact[] {
  if (override.locations) {
    const current = new Set(base.map((location) => location.id))
    if (override.locations.mode === 'replace') {
      return (override.locations.values ?? []).map((id, index) => ({ id, role: index === 0 ? 'primary' : 'secondary', source: { kind: 'curation', entityId: sourceId } }))
    }
    for (const id of override.locations.remove ?? []) current.delete(id)
    for (const id of override.locations.add ?? []) current.add(id)
    return [...current].map((id, index) => ({ id, role: index === 0 ? 'primary' : 'secondary', source: { kind: 'curation', entityId: sourceId } }))
  }
  if (override.placesOverride) return override.placesOverride.map((id, index) => ({ id, role: index === 0 ? 'primary' : 'secondary', source: { kind: 'curation', entityId: sourceId } }))
  return base
}

function effectiveLevels(unit: PlayableUnit, override: ResolvedOverride): LevelRange {
  return override.levelsOverride ? parseLevelRange(override.levelsOverride, { kind: 'curation', entityId: unit.id }) : unit.levels
}

function effectiveLocations(unit: PlayableUnit, override: ResolvedOverride): LocationFact[] {
  return applyLocationOverride(unit.locations, override, override.sourceId)
}

function effectivePlayability(unit: PlayableUnit, override: ResolvedOverride): Playability { return override.playability ?? unit.playability }
function effectivePreparationStatus(override: ResolvedOverride): PreparationStatus { return override.preparationStatus ?? 'untreated' }
function effectivePlayStatus(override: ResolvedOverride): PlayStatus { return override.playStatus ?? 'none' }
function effectiveLifecycleStatus(override: ResolvedOverride, excluded = false): LifecycleStatus {
  if (excluded) return override.excludedReason === 'later' ? 'later' : 'rejected'
  const playStatus = effectivePlayStatus(override)
  if (playStatus === 'to_play' || playStatus === 'in_progress' || playStatus === 'played') return playStatus
  return effectivePreparationStatus(override) === 'selected' ? 'retained' : 'untracked'
}

async function applyLifecycleStatus(id: string, status: LifecycleStatus, override: ResolvedOverride, excluded: boolean, onUpdate: (id: string, field: string, value: unknown) => void) {
  if (status === 'later' || status === 'rejected') {
    await onUpdate(id, 'exclusionStatus', status)
    return
  }
  if (excluded) await onUpdate(id, 'exclusionStatus', 'active')
  const target: Record<Exclude<LifecycleStatus, 'later' | 'rejected'>, [PreparationStatus, PlayStatus]> = {
    untracked: ['untreated', 'none'], retained: ['selected', 'none'], to_play: ['selected', 'to_play'], in_progress: ['untreated', 'in_progress'], played: ['untreated', 'played'],
  }
  const [preparationStatus, playStatus] = target[status]
  if (effectivePreparationStatus(override) !== preparationStatus) await onUpdate(id, 'preparationStatus', preparationStatus)
  if (effectivePlayStatus(override) !== playStatus) await onUpdate(id, 'playStatus', playStatus)
}

function LifecycleSelect({ id, override, excluded, onUpdate }: { id: string; override: ResolvedOverride; excluded: boolean; onUpdate: (id: string, field: string, value: unknown) => void }) {
  const value = effectiveLifecycleStatus(override, excluded)
  return <select value={value} onChange={(event) => void applyLifecycleStatus(id, event.target.value as LifecycleStatus, override, excluded, onUpdate)}>{lifecycleOptions.map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select>
}

function effectiveRelevance(unit: PlayableUnit, override: ResolvedOverride): string { return override.relevance ?? relevanceOf(unit) }

// PF2_PREP_FILTERS_INFO_V1
function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function descriptionFacts(unit: PlayableUnit) {
  const ownSynopsis = hasText(unit.synopsis)
  const inheritedSynopsis = !ownSynopsis && hasText(unit.contextSynopsis)
  const gmDetails = hasText(unit.gmDetails)
  return {
    ownSynopsis,
    inheritedSynopsis,
    gmDetails,
    needsWork: !ownSynopsis || !gmDetails,
    complete: ownSynopsis && gmDetails,
  }
}

function matchesDescriptionFilter(unit: PlayableUnit, filter: string): boolean {
  if (!filter) return true
  const facts = descriptionFacts(unit)
  if (filter === 'needsWork') return facts.needsWork
  if (filter === 'complete') return facts.complete
  if (filter === 'inherited') return facts.inheritedSynopsis
  if (filter === 'missingSynopsis') return !facts.ownSynopsis
  if (filter === 'missingGmDetails') return !facts.gmDetails
  return true
}

function documentStatusLabel(unit: PlayableUnit): string {
  const availability = availabilityOf(unit)
  if (availability.coreMaterial === 'informationOnly') return 'INFO'
  if (availability.coreMaterial === 'complete' && availability.mode !== 'none') {
    return `COMPLET · ${documentaryModeLabel(availability.mode)}`
  }
  return availabilityLabel(availability.coreMaterial).toUpperCase()
}

function isContainerExcluded(container: Container, curation: Curation, seen = new Set<string>()): boolean {
  const override = resolveContainerOverride(curation, container)
  if (override.progress === 'Écarté') return true
  if (override.excluded !== undefined) return Boolean(override.excluded)
  if (container.editorialStatus === 'ÉCARTÉ') return true
  if (!container.parentId || seen.has(container.id)) return false
  const parent = containerMap.get(container.parentId)
  return parent ? isContainerExcluded(parent, curation, new Set([...seen, container.id])) : false
}

// PF2_EXCLUDED_REASON_LATER_V1
function exclusionUiValue(override: ResolvedOverride, excluded: boolean): 'active' | 'later' | 'rejected' {
  if (!excluded) return 'active'
  return override.excludedReason === 'later' ? 'later' : 'rejected'
}

function explicitContainerExclusion(container: Container, curation: Curation): boolean {
  const override = resolveContainerOverride(curation, container)
  return override.progress === 'Écarté' || override.excluded === true || container.editorialStatus === 'ÉCARTÉ'
}

function explicitPlayableExclusion(unit: PlayableUnit, curation: Curation): boolean {
  const override = resolvePlayableOverride(curation, unit)
  return override.progress === 'Écarté' || override.excluded === true || unit.playableType === 'legacy' || unit.editorialStatus === 'ÉCARTÉ'
}

function ExclusionSelect({ id, override, excluded, onUpdate }: {
  id: string
  override: ResolvedOverride
  excluded: boolean
  onUpdate: (id: string, field: string, value: unknown) => void
}) {
  return <select value={exclusionUiValue(override, excluded)} onChange={(event) => onUpdate(id, 'exclusionStatus', event.target.value)}>
    <option value="active">Actif</option>
    <option value="later">Plus tard</option>
    <option value="rejected">Écarté</option>
  </select>
}

function isExcluded(unit: PlayableUnit, override: ResolvedOverride, curation?: Curation): boolean {
  if (override.progress === 'Écarté') return true
  if (override.excluded !== undefined) return Boolean(override.excluded)
  if (unit.playableType === 'legacy' || unit.editorialStatus === 'ÉCARTÉ') return true
  const parent = unit.parentId ? containerMap.get(unit.parentId) : null
  return Boolean(curation && parent && isContainerExcluded(parent, curation))
}

function sortPlayables(items: PlayableUnit[], curation: Curation): PlayableUnit[] {
  return items.slice().sort((a, b) => {
    const oa = resolvePlayableOverride(curation, a)
    const ob = resolvePlayableOverride(curation, b)
    const ra = relevanceOrder[effectiveRelevance(a, oa)] ?? 99
    const rb = relevanceOrder[effectiveRelevance(b, ob)] ?? 99
    const la = effectiveLevels(a, oa).min ?? 99
    const lb = effectiveLevels(b, ob).min ?? 99
    return ra - rb || la - lb || titleOf(a).localeCompare(titleOf(b), 'fr')
  })
}

function matchesFilters(unit: PlayableUnit, filters: Filters, curation: Curation): boolean {
  const override = resolvePlayableOverride(curation, unit)
  const levels = effectiveLevels(unit, override)
  const locations = effectiveLocations(unit, override)
  const availability = availabilityOf(unit)
  const bundle = resourceBundleAvailability(unit)
  const relevance = effectiveRelevance(unit, override)
  const playability = effectivePlayability(unit, override)
  const lifecycleStatus = effectiveLifecycleStatus(override)
  const year = yearOf(unit)
  const parentNames = ancestorContainers(unit).map(titleOf)
  const haystack = [titleOf(unit), unit.titles.original ?? '', unit.synopsis ?? '', unit.contextSynopsis ?? '', unit.narrativeThread ?? '', ...locations.flatMap((location) => expandedPlaceLabels(location.id)), ...unit.arcIds.map((id) => arcMap.get(id)?.titleFr ?? id), ...parentNames].join(' ').toLowerCase()

  if (filters.query && !haystack.includes(filters.query.toLowerCase())) return false
  if (filters.level && !supportsLevel(levels, Number(filters.level))) return false
  if (filters.place && !matchesPlaceFilter(locations.map((location) => location.id), filters.place)) return false
  if (filters.type && unit.playableType !== filters.type) return false
  if (filters.relevance && relevance !== filters.relevance) return false
  if (filters.playability && playability !== filters.playability) return false
  if (filters.lifecycleStatus && lifecycleStatus !== filters.lifecycleStatus) return false
  if (filters.availability) {
    if (filters.availability === 'usable') {
      if (!['complete', 'informationOnly'].includes(availability.coreMaterial)) return false
    } else if (availability.coreMaterial !== filters.availability) return false
  }
  if (filters.bundle && bundle.status !== filters.bundle) return false
  if (!matchesDescriptionFilter(unit, filters.description)) return false
  if (filters.arc && !unit.arcIds.includes(filters.arc)) return false
  if (filters.thread && unit.narrativeThread !== filters.thread) return false
  if (filters.yearFrom && (year === null || year < Number(filters.yearFrom))) return false
  if (filters.yearTo && (year === null || year > Number(filters.yearTo))) return false

  if (filters.french && availability.mode !== filters.french) return false

  return true
}

function FilterBar({ filters, setFilters, units, showBundle = false }: { filters: Filters; setFilters: (filters: Filters) => void; units: PlayableUnit[]; showBundle?: boolean }) {
  const places = useMemo(() => geographyTreeOptions(unique([...allPlaces, ...units.flatMap((unit) => unit.locations.map((location) => location.id))])), [units])
  const relevances = useMemo(() => unique(units.map((unit) => relevanceOf(unit))), [units])
  const types = useMemo(() => unique(units.map((unit) => unit.playableType)), [units])
  const threads = useMemo(() => unique(units.map((unit) => unit.narrativeThread ?? '')), [units])
  const update = (field: keyof Filters, value: string) => setFilters({ ...filters, [field]: value })
  const activeCount = Object.values(filters).filter(Boolean).length

  return <div className="finder-tools">
    <label className="search finder-search">⌕<input value={filters.query} onChange={(event) => update('query', event.target.value)} placeholder="Titre, campagne, lieu, arc, fil narratif…" /></label>
    <select value={filters.level} onChange={(event) => update('level', event.target.value)}><option value="">Tous niveaux</option>{Array.from({ length: 20 }, (_, index) => <option key={index + 1}>{index + 1}</option>)}</select>
    <GeographyPicker value={filters.place} options={places} onChange={(value) => update('place', value)} />
    <select value={filters.french} onChange={(event) => update('french', event.target.value)}><option value="">Tous modes documentaires</option><option value="fr">FR</option><option value="en_trad">EN + traduction</option><option value="en">EN seul</option><option value="info">Info</option></select>
    <select value={filters.availability} onChange={(event) => update('availability', event.target.value)}><option value="">Tous documents</option><option value="usable">Utilisable (complet ou info)</option><option value="complete">Complet</option><option value="informationOnly">Info</option><option value="partial">Partiel</option><option value="absent">Absent</option><option value="uncertain">À vérifier</option></select>
    <select value={filters.relevance} onChange={(event) => update('relevance', event.target.value)}><option value="">Toute pertinence</option>{relevances.map((value) => <option key={value}>{value}</option>)}</select>
    <select value={filters.playability} onChange={(event) => update('playability', event.target.value)}><option value="">Toute jouabilité</option>{playabilityOptions.map((value) => <option key={value}>{value}</option>)}</select>
    <select value={filters.lifecycleStatus} onChange={(event) => update('lifecycleStatus', event.target.value)}><option value="">Tout suivi MJ</option>{lifecycleOptions.filter(([value]) => !['later', 'rejected'].includes(value)).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    <select value={filters.type} onChange={(event) => update('type', event.target.value)}><option value="">Tous types</option>{types.map((value) => <option key={value} value={value}>{playableTypeLabel(value as PlayableUnit['playableType'])}</option>)}</select>
    <select value={filters.arc} onChange={(event) => update('arc', event.target.value)}><option value="">Tous arcs</option>{arcs.map((arc) => <option key={arc.id} value={arc.id}>{arc.titleFr}</option>)}</select>
    <select value={filters.thread} onChange={(event) => update('thread', event.target.value)}><option value="">Tous fils narratifs</option>{threads.map((value) => <option key={value}>{value}</option>)}</select>
    {showBundle && <select value={filters.bundle} onChange={(event) => update('bundle', event.target.value)}><option value="">Tous ZIP</option><option value="present">ZIP disponible</option><option value="missing">ZIP manquant</option><option value="uncertain">ZIP à vérifier</option><option value="unknown">ZIP non inventorié</option></select>}
    <select value={filters.description} onChange={(event) => update('description', event.target.value)}><option value="">Toutes descriptions</option><option value="needsWork">À compléter</option><option value="complete">Complète</option><option value="inherited">Seulement héritée</option><option value="missingSynopsis">Synopsis propre manquant</option><option value="missingGmDetails">Détails MJ manquants</option></select>
    <label className="year-filter"><small>AR de</small><input type="number" value={filters.yearFrom} onChange={(event) => update('yearFrom', event.target.value)} placeholder="4700" /></label>
    <label className="year-filter"><small>à</small><input type="number" value={filters.yearTo} onChange={(event) => update('yearTo', event.target.value)} placeholder="4730" /></label>
    {activeCount > 0 && <button className="filter-reset" onClick={() => setFilters(emptyFilters)}>Effacer {activeCount} filtre{activeCount > 1 ? 's' : ''}</button>}
  </div>
}

function AvailabilityBadges({ unit }: { unit: PlayableUnit }) {
  const availability = availabilityOf(unit)
  const bundle = resourceBundleAvailability(unit)
  return <div className="availability-badges">
    <Badge>{documentStatusLabel(unit)}</Badge>
    <Badge>{resourceBundleLabel(bundle)}</Badge>
  </div>
}

function PlayableRow({ unit, curation, onOpen, onUpdate }: { unit: PlayableUnit; curation: Curation; onOpen: (unit: PlayableUnit) => void; onUpdate: (id: string, field: string, value: unknown) => void }) {
  const override = resolvePlayableOverride(curation, unit)
  const levels = effectiveLevels(unit, override)
  const locations = effectiveLocations(unit, override)
  const playability = effectivePlayability(unit, override)
  const lifecycleStatus = effectiveLifecycleStatus(override)
  const relevance = effectiveRelevance(unit, override)
  const parent = unit.parentId ? containerMap.get(unit.parentId) : null

  return <article className="entry-row playable-row">
    <div className="entry-main">
      <small>{playableTypeLabel(unit.playableType)}{parent ? ` · ${titleOf(parent)}` : ''}</small>
      <h3>{unit.number && <span className="number-inline">{unit.number}</span>}{titleOf(unit)}</h3>
      {originalTitleOf(unit) && <em>{originalTitleOf(unit)}</em>}
      <p>{unit.synopsis || unit.contextSynopsis || 'Synopsis propre à cette unité à documenter.'}</p>
      <AvailabilityBadges unit={unit} />
    </div>
    <div className="entry-facts">
      <div><small>Niveaux</small><strong>{levelLabel(levels)}</strong><SourceBadge source={levels.source} /></div>
      <div><small>Lieux</small><strong>{locations.length ? unique(locations.map((location) => placeDisplay(location.id))).join(', ') : 'À documenter'}</strong>{locations[0] && <SourceBadge source={locations[0].source} />}</div>
      <div><small>Pertinence</small><strong className={`relevance r-${tone(relevance)}`}>{relevance}</strong></div>
      <label><small>Jouabilité</small><select value={playability} onChange={(event) => onUpdate(unit.id, 'playability', event.target.value)}>{playabilityOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label><small>Statut MJ</small><LifecycleSelect id={unit.id} override={override} excluded={isExcluded(unit, override, curation)} onUpdate={onUpdate} /></label>
    </div>
    <div className="entry-actions"><Link to={playableHref(unit)}>Détails →</Link></div>
  </article>
}

function PlayableList({ units, curation, onOpen, onUpdate, empty = 'Aucune unité jouable.' }: { units: PlayableUnit[]; curation: Curation; onOpen: (unit: PlayableUnit) => void; onUpdate: (id: string, field: string, value: unknown) => void; empty?: string }) {
  return <div className="entry-list">{units.length ? units.map((unit) => <PlayableRow key={unit.id} unit={unit} curation={curation} onOpen={onOpen} onUpdate={onUpdate} />) : <p className="empty-state">{empty}</p>}</div>
}

function ExcludedView({ curation, onOpenContainer, onOpenPlayable, onUpdate }: {
  curation: Curation
  onOpenContainer: (container: Container) => void
  onOpenPlayable: (unit: PlayableUnit) => void
  onUpdate: (id: string, field: string, value: unknown) => void
}) {
  const explicitContainers = containers.filter((container) => explicitContainerExclusion(container, curation)).sort((a, b) => titleOf(a).localeCompare(titleOf(b), 'fr'))
  const explicitPlayables = playableUnits.filter((unit) => explicitPlayableExclusion(unit, curation)).sort((a, b) => titleOf(a).localeCompare(titleOf(b), 'fr'))
  const laterContainers = explicitContainers.filter((container) => resolveContainerOverride(curation, container).excludedReason === 'later')
  const rejectedContainers = explicitContainers.filter((container) => resolveContainerOverride(curation, container).excludedReason !== 'later')
  const laterPlayables = explicitPlayables.filter((unit) => resolvePlayableOverride(curation, unit).excludedReason === 'later')
  const rejectedPlayables = explicitPlayables.filter((unit) => resolvePlayableOverride(curation, unit).excludedReason !== 'later')

  const renderContainers = (items: Container[]) => items.length ? <div className="excluded-scenarios">
    {items.map((container) => {
      const override = resolveContainerOverride(curation, container)
      const count = playablesUnder(container.id).length
      return <article key={container.id}><div><small>{containerTypeLabel(container.containerType)}</small><strong>{titleOf(container)}</strong><span>{count} unité{count > 1 ? 's' : ''} jouable{count > 1 ? 's' : ''}</span></div><ExclusionSelect id={container.id} override={override} excluded={isContainerExcluded(container, curation)} onUpdate={onUpdate} /><Link to={containerHref(container)}>Détails →</Link></article>
    })}
  </div> : <p className="empty-state">Aucun conteneur.</p>

  const section = (title: string, cs: Container[], ps: PlayableUnit[]) => <section className="detail-section"><h3>{title} · {cs.length + ps.length}</h3>{cs.length > 0 && <><h4>Campagnes / collections</h4>{renderContainers(cs)}</>}{ps.length > 0 && <><h4>Unités jouables</h4><PlayableList units={ps} curation={curation} onOpen={onOpenPlayable} onUpdate={onUpdate} /></>}{cs.length === 0 && ps.length === 0 && <p className="empty-state">Rien ici.</p>}</section>

  return <div className="excluded-view">{section('Plus tard', laterContainers, laterPlayables)}{section('Écartés', rejectedContainers, rejectedPlayables)}</div>
}

function FinderView({ active, curation, onOpen, onUpdate, resourceVersion }: { active: PlayableUnit[]; curation: Curation; onOpen: (unit: PlayableUnit) => void; onUpdate: (id: string, field: string, value: unknown) => void; resourceVersion: number }) {
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const found = useMemo(() => sortPlayables(active.filter((unit) => matchesFilters(unit, filters, curation)), curation), [active, curation, filters, resourceVersion])
  return <div className="finder-view">
    <section className="finder-hero"><div><small>DÉCISION DE TABLE</small><h2>Que peut-on jouer maintenant ?</h2><p>Cette recherche ne contient que des unités réellement jouables. Les campagnes, saisons, guides, cartes et PDF restent hors des résultats.</p></div><b>{found.length}<small>résultat{found.length > 1 ? 's' : ''}</small></b></section>
    <FilterBar filters={filters} setFilters={setFilters} units={active} showBundle />
    <PlayableList units={found} curation={curation} onOpen={onOpen} onUpdate={onUpdate} />
  </div>
}

function ContainerTree({ container, curation, onOpen, onOpenPlayable, onUpdate, depth = 0 }: { container: Container; curation: Curation; onOpen: (container: Container) => void; onOpenPlayable: (unit: PlayableUnit) => void; onUpdate: (id: string, field: string, value: unknown) => void; depth?: number }) {
  if (isContainerExcluded(container, curation)) return null
  const childContainers = containers.filter((item) => item.parentId === container.id && !isContainerExcluded(item, curation)).sort((a, b) => a.order - b.order || titleOf(a).localeCompare(titleOf(b), 'fr'))
  const childPlayables = playableUnits.filter((unit) => unit.parentId === container.id && !isExcluded(unit, resolvePlayableOverride(curation, unit), curation))
  const components = componentsOf(container.id)
  const descendantCount = playablesUnder(container.id).length
  return <details className={`library-node library-depth-${Math.min(depth, 3)}`} open={depth === 0 && container.containerType === 'campaign'}>
    <summary><span className="library-icon">{container.containerType === 'campaign' ? '▣' : container.containerType === 'pfsSeason' ? '▤' : '⌁'}</span><div><small>{containerTypeLabel(container.containerType)}</small><strong>{titleOf(container)}</strong><em>{descendantCount} unité{descendantCount > 1 ? 's' : ''} jouable{descendantCount > 1 ? 's' : ''}{components.length ? ` · ${components.length} ressource${components.length > 1 ? 's' : ''}` : ''}</em></div><Link to={containerHref(container)} onClick={(event) => event.stopPropagation()}>Détails</Link></summary>
    <div className="library-children">
      {childContainers.map((child) => <ContainerTree key={child.id} container={child} curation={curation} onOpen={onOpen} onOpenPlayable={onOpenPlayable} onUpdate={onUpdate} depth={depth + 1} />)}
      {childPlayables.length > 0 && <PlayableList units={sortPlayables(childPlayables, curation)} curation={curation} onOpen={onOpenPlayable} onUpdate={onUpdate} />}
      {components.length > 0 && <div className="component-strip">{components.map((component) => <span key={component.id}><b>◇</b>{componentTypeLabel(component.componentType)} · {titleOf(component)}{component.requiredForCore && <em> requis</em>}</span>)}</div>}
    </div>
  </details>
}

function LibraryView({ curation, onOpen, onOpenPlayable, onUpdate }: { curation: Curation; onOpen: (container: Container) => void; onOpenPlayable: (unit: PlayableUnit) => void; onUpdate: (id: string, field: string, value: unknown) => void }) {
  return <div className="library-view">{sections.filter((section) => section.id !== 'legacy').map((section) => {
    const roots = containers.filter((container) => container.sectionId === section.id && !container.parentId && !isContainerExcluded(container, curation))
    const directPlayables = playableUnits.filter((unit) => unit.sectionId === section.id && !unit.parentId && !isExcluded(unit, resolvePlayableOverride(curation, unit), curation))
    const visibleCount = playableUnits.filter((unit) => unit.sectionId === section.id && !isExcluded(unit, resolvePlayableOverride(curation, unit), curation)).length
    return <section className="library-section" key={section.id}><div className="section-title"><div><small>SECTION</small><h2>{section.title}</h2><p>{section.description}</p></div><span>{visibleCount}</span></div>{roots.map((container) => <ContainerTree key={container.id} container={container} curation={curation} onOpen={onOpen} onOpenPlayable={onOpenPlayable} onUpdate={onUpdate} />)}{directPlayables.length > 0 && <PlayableList units={sortPlayables(directPlayables, curation)} curation={curation} onOpen={onOpenPlayable} onUpdate={onUpdate} />}</section>
  })}</div>
}

function preparationMatch(unit: PlayableUnit, tab: PreparationTab): boolean {
  const availability = availabilityOf(unit)
  const bundle = resourceBundleAvailability(unit)
  const hasInformationFallback = documentsForTarget(unit.id).some((document) => document.isInformationFallback)
  if (tab === 'pdf') return !hasInformationFallback && ['absent', 'partial'].includes(availability.coreMaterial)
  if (tab === 'translation') return availability.coreMaterial === 'complete' && availability.mode === 'en'
  if (tab === 'zip') return bundle.status === 'missing' && (hasInformationFallback || ['complete', 'informationOnly'].includes(availability.coreMaterial))
  return unit.playableComponents.length === 0
}

function maintenanceMatch(unit: PlayableUnit, tab: MaintenanceTab): boolean {
  const availability = availabilityOf(unit)
  const bundle = resourceBundleAvailability(unit)
  const hasInformationFallback = documentsForTarget(unit.id).some((document) => document.isInformationFallback)
  if (tab === 'info') return hasInformationFallback || availability.coreMaterial === 'informationOnly'
  if (tab === 'description') return descriptionFacts(unit).needsWork
  if (tab === 'uncertain') return bundle.status === 'uncertain' || availability.coreMaterial === 'uncertain' || documentsForTarget(unit.id).some((document) => document.association.status === 'review')
  return unit.migration.status === 'needsReview'
}

function isUpcoming(unit: PlayableUnit, curation: Curation): boolean {
  const override = resolvePlayableOverride(curation, unit)
  const playStatus = effectivePlayStatus(override)
  return !isExcluded(unit, override, curation) && (playStatus === 'to_play' || playStatus === 'in_progress')
}

function PreparationView({ active, curation, onOpen, onUpdate, resourceVersion }: { active: PlayableUnit[]; curation: Curation; onOpen: (unit: PlayableUnit) => void; onUpdate: (id: string, field: string, value: unknown) => void; resourceVersion: number }) {
  const [tab, setTab] = useState<PreparationTab>('pdf')
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const scope = useMemo(() => active.filter((unit) => isUpcoming(unit, curation)), [active, curation])
  const base = useMemo(() => scope.filter((unit) => preparationMatch(unit, tab)), [scope, tab, resourceVersion])
  const found = useMemo(() => sortPlayables(base.filter((unit) => matchesFilters(unit, filters, curation)), curation), [base, curation, filters, resourceVersion])
  return <div className="prepare-view">
    <div className="notice prepare-scope-notice"><strong>Seulement les prochaines parties</strong><p>Cette page ignore les œuvres simplement retenues, terminées ou mises de côté. Elle ne regarde que les scénarios « À jouer » et « En cours ».</p></div>
    <div className="prepare-tabs">{preparationTabs.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setFilters(emptyFilters) }}>{label}<b>{scope.filter((unit) => preparationMatch(unit, id)).length}</b></button>)}</div>
    {tab === 'zip' && !resourceInventoryKnown && <div className="notice"><strong>Inventaire ZIP en attente</strong><p>Le backend n’a pas encore répondu. Tant que le scan n’est pas disponible, aucun contenu n’est déclaré à tort comme « ZIP manquant ».</p></div>}
    {tab === 'components' && <div className="notice info-notice"><strong>Découpage narratif optionnel</strong><p>Seuls les scénarios actuellement à jouer ou en cours apparaissent ici. Un découpage n’est pas un prérequis absolu : importe des composants lorsqu’ils sont utiles au suivi de la partie.</p></div>}
    <FilterBar filters={filters} setFilters={setFilters} units={base} showBundle />
    <div className="section-title"><h2>{preparationTabs.find(([id]) => id === tab)?.[1]}</h2><span>{found.length}</span></div>
    <PlayableList units={found} curation={curation} onOpen={onOpen} onUpdate={onUpdate} empty="Rien à traiter dans cette catégorie pour les prochaines parties." />
  </div>
}

function MaintenanceView({ active, curation, onOpen, onUpdate, resourceVersion }: { active: PlayableUnit[]; curation: Curation; onOpen: (unit: PlayableUnit) => void; onUpdate: (id: string, field: string, value: unknown) => void; resourceVersion: number }) {
  const [tab, setTab] = useState<MaintenanceTab>('description')
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const base = useMemo(() => active.filter((unit) => maintenanceMatch(unit, tab)), [active, tab, resourceVersion])
  const found = useMemo(() => sortPlayables(base.filter((unit) => matchesFilters(unit, filters, curation)), curation), [base, curation, filters, resourceVersion])
  return <div className="prepare-view maintenance-view">
    <div className="notice info-notice"><strong>Entretien du catalogue</strong><p>Ces écarts améliorent la qualité des données mais ne sont pas présentés comme des tâches nécessaires à ta prochaine partie.</p></div>
    <div className="prepare-tabs">{maintenanceTabs.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setFilters(emptyFilters) }}>{label}<b>{active.filter((unit) => maintenanceMatch(unit, id)).length}</b></button>)}</div>
    {tab === 'info' && <div className="notice info-notice"><strong>« Info seule » est un état distinct</strong><p>Un PDF nommé avec « (info) » reste un substitut documentaire : il n’est ni le scénario complet, ni une absence totale.</p></div>}
    {tab === 'description' && <div className="notice info-notice"><strong>Descriptions à compléter</strong><p>Une description héritée d’une campagne ne compte pas comme synopsis propre au scénario.</p></div>}
    <FilterBar filters={filters} setFilters={setFilters} units={base} showBundle />
    <div className="section-title"><h2>{maintenanceTabs.find(([id]) => id === tab)?.[1]}</h2><span>{found.length}</span></div>
    <PlayableList units={found} curation={curation} onOpen={onOpen} onUpdate={onUpdate} empty="Aucun écart de maintenance dans cette catégorie." />
  </div>
}

function DocumentsView({ resourceVersion }: { resourceVersion: number }) {
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('')
  const [variant, setVariant] = useState('')
  const [role, setRole] = useState('')
  const [association, setAssociation] = useState('')
  const [presence, setPresence] = useState('')
  const all = currentDocuments()
  const found = useMemo(() => all.filter((document) => {
    const target = document.targetId ? playableMap.get(document.targetId) ?? containerMap.get(document.targetId) : null
    const haystack = [document.filename, document.path, document.targetId ?? '', target ? titleOf(target) : ''].join(' ').toLowerCase()
    return (!query || haystack.includes(query.toLowerCase()))
      && (!language || document.language === language)
      && (!variant || document.variant === variant)
      && (!role || document.role === role)
      && (!association || document.association.status === association)
      && (!presence || documentPresence(document) === presence)
  }), [query, language, variant, role, association, presence, resourceVersion])

  return <div className="documents-view">
    <div className="finder-tools document-filters"><label className="search finder-search">⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom du PDF, chemin, œuvre…" /></label><select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="">Toutes langues</option><option value="FR">FR</option><option value="EN">EN</option><option value="INCONNUE">Inconnue</option></select><select value={variant} onChange={(event) => setVariant(event.target.value)}><option value="">Toutes variantes</option>{unique(all.map((document) => document.variant)).map((value) => <option key={value}>{value}</option>)}</select><select value={role} onChange={(event) => setRole(event.target.value)}><option value="">Tous rôles</option><option value="core">Cœur de l’œuvre</option><option value="information">Info de remplacement</option><option value="resource">Ressource</option><option value="optional">Optionnel</option></select><select value={presence} onChange={(event) => setPresence(event.target.value)}><option value="">Toute présence</option><option value="present">Présents sur disque</option><option value="missing">Absents du disque</option><option value="unknown">Présence non scannée</option></select><select value={association} onChange={(event) => setAssociation(event.target.value)}><option value="">Toutes associations</option><option value="confirmed">Confirmées</option><option value="review">À vérifier</option><option value="unassociated">Non associées</option></select></div>
    <div className="section-title"><h2>Documents physiques</h2><span>{found.length}</span></div>
    <div className="document-list">{found.map((document) => <DocumentRow key={document.id} document={document} />)}</div>
  </div>
}

function DocumentRow({ document }: { document: CatalogueDocument }) {
  const target = document.targetId ? playableMap.get(document.targetId) ?? containerMap.get(document.targetId) : null
  const presence = documentPresence(document)
  return <article className={`document-row association-${document.association.status} presence-${presence}`}><div><small>{document.role === 'information' ? 'ⓘ INFO DE REMPLACEMENT' : document.role.toUpperCase()}</small><a href={documentHref(document)} target="_blank" rel="noreferrer">{document.filename}</a><span>{document.pages ? `${document.pages} pages · ` : ''}{document.language} · {document.rawVariant}</span></div><div><small>Association</small><strong>{target ? titleOf(target) : document.targetId || 'Non associée'}</strong><em>{document.association.status === 'confirmed' ? 'confirmée' : document.association.status === 'review' ? 'à vérifier' : 'non associée'} · {presence === 'present' ? 'présent' : presence === 'missing' ? 'absent du disque' : 'non scanné'}</em></div></article>
}

function ChronologyView({ units, onOpen }: { units: PlayableUnit[]; onOpen: (unit: PlayableUnit) => void }) {
  const eligible = units.filter((unit) => yearOf(unit) !== null)
  const years = unique(eligible.map((unit) => String(yearOf(unit)))).map(Number).sort((a, b) => a - b)
  return <div className="year-timeline">{years.map((year) => <section key={year}><div className="year-marker"><strong>{year}</strong><span>AR</span></div><div className="year-works">{eligible.filter((unit) => yearOf(unit) === year).map((unit) => <Link key={unit.id} to={playableHref(unit)}><small>{playableTypeLabel(unit.playableType)}</small><strong>{titleOf(unit)}</strong><em>{unit.narrativeThread}</em></Link>)}</div></section>)}</div>
}

function Stats({ active }: { active: PlayableUnit[] }) {
  const complete = active.filter((unit) => availabilityOf(unit).coverage === 'complete').length
  const infoOnly = active.filter((unit) => availabilityOf(unit).mode === 'info').length
  const readyFr = active.filter((unit) => availabilityOf(unit).ready).length
  const zipMissing = resourceInventoryKnown ? active.filter((unit) => resourceBundleAvailability(unit).status === 'missing').length : null
  const review = active.filter((unit) => unit.migration.status === 'needsReview').length
  return <section className="stats stats-v3"><div><b>▶</b><p><strong>{active.length}</strong><small>UNITÉS JOUABLES</small></p></div><div><b>✓</b><p><strong>{complete}</strong><small>PDF COMPLETS</small></p></div><div><b>文</b><p><strong>{readyFr}</strong><small>PRÊTES EN FR</small></p></div><div><b>ⓘ</b><p><strong>{infoOnly}</strong><small>INFO SEULES</small></p></div><div><b>▣</b><p><strong>{zipMissing ?? '—'}</strong><small>ZIP MANQUANTS</small></p></div><div><b>!</b><p><strong>{review}</strong><small>MÉTADONNÉES À VOIR</small></p></div></section>
}

type ScenarioPackageStatus = { scenarioId: string; packageVersion: number; status: string; filename: string; deployedVersion: number | null; deployedAt: string | null; importedAt: string; updatedAt: string; manifest?: { actors?: unknown[] } } | null
type ScenarioDeployment = { id: string; scenarioId: string; packageVersion: number; status: 'pending' | 'claimed' | 'success' | 'failed'; operation?: 'deploy' | 'reset'; error: string | null; result: Record<string, unknown> | null } | null
type LinkedNpc = { id?: string; npcId: string; nom?: string; name?: string; portrait?: string; role?: string | null; importance?: string | null; factions?: Array<{ faction_id?: string; role?: string }>; regions?: string[] }
type ScenarioAsset = { id: string; path: string; filename: string; assetType: string; role: string | null; language: string | null; variant: string | null; present: boolean; associationStatus: string; resourceScope?: 'direct' | 'component'; resourceTargetLabel?: string | null; libraryCategory?: string | null }
type ScenarioRelations = { npcs: LinkedNpc[]; places: Array<{ targetId: string; targetKind: 'lieu' | 'region'; nom?: string; name?: string; role?: string | null }>; factions: Array<{ targetId: string; nom?: string; name?: string; role?: string | null }>; events: Array<{ targetId: string; nom?: string; name?: string; role?: string | null }> }
type LinkedScenarioDependency = { scenarioId: string; dependsOnScenarioId: string; relationType: 'required' | 'recommended'; source?: string | null; sourcePage?: string | null; notes?: string | null; scenario?: { id?: string; name?: string; titleFr?: string; titleOriginal?: string } }
type ScenarioDependencies = { dependencies: LinkedScenarioDependency[]; dependents: LinkedScenarioDependency[] }
type AvailableScenarioPackage = { asset: ScenarioAsset; packageVersion: number | null; scenarioName?: string; error?: string } | null
type PackageActor = { key?: string; name?: string; type?: 'reference' | 'custom' | 'narrative'; uuid?: string; lookup?: unknown; npcId?: string; actor?: { type?: string; uuid?: string; lookup?: unknown } }
type PackageRegistry = { factions: Array<{ id: string; name: string }>; places: Array<{ id: string; name: string; kind?: string }> }
type FoundryReferenceLibraryStatus = { available: boolean; actorCount: number; itemCount: number; actorSourceCount: number; itemSourceCount: number; size: number; updatedAt: string | null; metadata?: { foundryVersion?: string | null; systemVersion?: string | null } }
type AiRequiredRequest = { requestId: string; kind: string; subject: { uuid: string; name: string | null }; reason: string; required: boolean; available: boolean; indexName: string | null; sourceType: 'Actor' | 'Item' }
type AiRequiredDataStatus = { targetId: string; targetKind: 'scenario' | 'campaign'; status: 'ready' | 'needs_more_data' | 'blocked'; requests: AiRequiredRequest[]; unresolved: unknown[]; requiredMissing: number; availableCount: number; importedAt: string | null } | null

type CampaignChildPackageState = { scenarioId: string; name: string; order: number | null; appVersion: number | null; foundryVersion: number | null; upToDate: boolean; package: ScenarioPackageStatus; latestDeployment: (NonNullable<ScenarioDeployment> & { operation?: 'deploy' | 'reset' }) | null }
type CampaignState = { campaignId: string; name: string; children: CampaignChildPackageState[]; summary: { total: number; integrated: number; synchronized: number; pending: number; failed: number } }
type CampaignResetPreview = { campaignId: string; name: string; confirmationText: string; application: { packages: number; deployments: number; scopedRecords: number; preservedNpcLinks: number; preservedRelations: number }; foundryKnown: { actors: number; scenes: number; journals: number; note: string }; preserveNpcIds: string[] }

type ScenarioResetPreview = { scenarioId: string; name: string; confirmationText: string; application: { packages: number; deployments: number; scopedRecords: number; preservedNpcLinks: number; preservedRelations: number }; foundryKnown: { version: number | null; actors: number; scenes: number; journals: number; state: 'present' | 'reset' | 'unknown'; note: string }; preserveNpcIds: string[] }

const pnjPortraitUrl = (portrait?: string) => {
  const filename = /^assets\/l7r\/portraits\/pnj\/([^/]+\.(?:webp|gif|png|jpe?g))$/i.exec(portrait?.trim() ?? '')?.[1]
  return filename ? `/apil7r/pf2-mj/portraits/${encodeURIComponent(filename)}` : ''
}

function CampaignOperationsPanel({ campaignId, onOpenPlayable }: { campaignId: string; onOpenPlayable: (unit: PlayableUnit) => void }) {
  const [state, setState] = useState<CampaignState | null>(null)
  const [preview, setPreview] = useState<CampaignResetPreview | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const load = async () => {
    try {
      const [statusResponse, previewResponse] = await Promise.all([
        fetch(`/apil7r/pf2-mj/campaigns/${encodeURIComponent(campaignId)}/status`, { cache: 'no-store' }),
        fetch(`/apil7r/pf2-mj/campaigns/${encodeURIComponent(campaignId)}/reset-preview`, { cache: 'no-store' })
      ])
      if (statusResponse.ok) setState(await statusResponse.json())
      if (previewResponse.ok) setPreview(await previewResponse.json())
    } catch { }
  }
  useEffect(() => { void load(); const timer = window.setInterval(() => { void load() }, 4_000); return () => window.clearInterval(timer) }, [campaignId])
  const synchronize = async () => {
    setBusy(true); setMessage('')
    try {
      const response = await fetch(`/apil7r/pf2-mj/campaigns/${encodeURIComponent(campaignId)}/deployments`, { method: 'POST' })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.message ?? 'Synchronisation de campagne impossible.')
      setMessage(payload.state === 'up-to-date' ? 'Toute la campagne est déjà à jour dans Foundry.' : `${payload.queued?.length ?? 0} aventure(s) placée(s) dans la file Foundry. Le lot s’arrête au premier échec.`)
      await load()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Synchronisation impossible.') } finally { setBusy(false) }
  }
  const reset = async (mode: 'app' | 'foundry' | 'all') => {
    if (!preview) return
    const confirmation = window.prompt(`Cette action est destructive.\n\nTape exactement :\n${preview.confirmationText}`)
    if (confirmation === null) return
    if (confirmation !== preview.confirmationText) { setMessage('Confirmation incorrecte : aucune suppression effectuée.'); return }
    setBusy(true); setMessage('')
    try {
      const response = await fetch(`/apil7r/pf2-mj/campaigns/${encodeURIComponent(campaignId)}/reset`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode, confirm: confirmation }) })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.message ?? 'Réinitialisation impossible.')
      setMessage(mode === 'app' ? 'État de préparation de l’application réinitialisé. Les liens globaux et dépendances sont conservés.' : mode === 'foundry' ? 'Nettoyage Foundry placé dans la file.' : 'Reset complet placé dans la file Foundry ; chaque aventure sera nettoyée côté application après son reset Foundry réussi.')
      await load()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Réinitialisation impossible.') } finally { setBusy(false) }
  }
  const attemptLabel = (child: CampaignChildPackageState) => {
    const deployment = child.latestDeployment
    if (!deployment) return 'aucune tentative'
    if (deployment.operation === 'reset') return deployment.status === 'success' ? 'reset terminé' : deployment.status === 'failed' ? 'reset en échec' : 'reset en cours'
    return `dernier essai v${deployment.packageVersion} · ${deployment.status === 'success' ? 'succès' : deployment.status === 'failed' ? 'échec' : deployment.status === 'claimed' ? 'import en cours' : 'en attente'}`
  }
  return <section className="detail-section campaign-operations"><h3>État & synchronisation de la campagne</h3>
    {state ? <><div className="campaign-summary"><strong>{state.summary.synchronized}/{state.summary.total} à jour dans Foundry</strong><span>{state.summary.integrated}/{state.summary.total} packages intégrés{state.summary.failed ? ` · ${state.summary.failed} échec(s)` : ''}</span></div>
      <div className="campaign-child-status">{state.children.map((child) => { const unit = playableMap.get(child.scenarioId); const content = <><span className={child.upToDate ? 'ok' : child.latestDeployment?.status === 'failed' ? 'failed' : ''}>{child.upToDate ? '✓' : child.latestDeployment?.status === 'failed' ? '!' : '•'}</span><strong>{child.name}</strong><small>App {child.appVersion === null ? '—' : `v${child.appVersion}`} · Foundry {child.foundryVersion === null ? '—' : `v${child.foundryVersion}`}</small><em>{attemptLabel(child)}</em></>; return unit ? <Link key={child.scenarioId} to={playableHref(unit)}>{content}</Link> : <div key={child.scenarioId}>{content}</div> })}</div>
      <button className="package-integrate package-deploy" disabled={busy || state.summary.integrated === 0} onClick={() => void synchronize()}>{busy ? 'Traitement…' : 'Synchroniser toute la campagne avec Foundry'}</button></> : <p className="missing">État de campagne indisponible.</p>}
    {preview && <div className="campaign-reset-box"><h4>Réinitialiser</h4><p><strong>Application :</strong> {preview.application.packages} package(s), {preview.application.deployments} historique(s) de déploiement actuellement connu(s) et jusqu’à {preview.application.scopedRecords} donnée(s) propres aux scénarios. Les liens vers des fiches globales restent conservés ; une fiche créée par la campagne mais réutilisée hors de celle-ci est protégée.</p><p><strong>Foundry connu :</strong> ≈ {preview.foundryKnown.actors} Actor(s), {preview.foundryKnown.scenes} scène(s), {preview.foundryKnown.journals} journal(aux). {preview.preserveNpcIds.length ? `${preview.preserveNpcIds.length} PNJ partagé(s) hors campagne seront protégés.` : ''}</p><div className="campaign-reset-actions"><button disabled={busy} onClick={() => void reset('app')}>Application uniquement</button><button disabled={busy} onClick={() => void reset('foundry')}>Foundry uniquement</button><button className="danger" disabled={busy} onClick={() => void reset('all')}>Tout recommencer</button></div><small>{preview.foundryKnown.note}</small></div>}
    {message && <p className="package-message">{message}</p>}
  </section>
}

function ScenarioPackagePanel({ scenarioId, onOpenReference, preparationStatus, allowAiExport = false, aiExportKind = 'scenario' }: { scenarioId: string; onOpenReference: (view: ReferenceView, id: string) => void; preparationStatus: PreparationStatus; allowAiExport?: boolean; aiExportKind?: 'scenario' | 'campaign' }) {
  const [status, setStatus] = useState<ScenarioPackageStatus>(null)
  const [assets, setAssets] = useState<ScenarioAsset[]>([])
  const [relations, setRelations] = useState<ScenarioRelations>({ npcs: [], places: [], factions: [], events: [] })
  const [dependencies, setDependencies] = useState<ScenarioDependencies>({ dependencies: [], dependents: [] })
  const [available, setAvailable] = useState<AvailableScenarioPackage>(null)
  const [deployment, setDeployment] = useState<ScenarioDeployment>(null)
  const [resetPreview, setResetPreview] = useState<ScenarioResetPreview | null>(null)
  const [registry, setRegistry] = useState<PackageRegistry>({ factions: [], places: [] })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [referenceLibrary, setReferenceLibrary] = useState<FoundryReferenceLibraryStatus | null>(null)
  const [requiredData, setRequiredData] = useState<AiRequiredDataStatus>(null)
  const load = () => Promise.all([
    fetch(`/apil7r/pf2-mj/scenario-packages/${encodeURIComponent(scenarioId)}`, { cache: 'no-store' }).then((response) => response.ok ? response.json() : null),
    fetch(`/apil7r/pf2-mj/scenarios/${encodeURIComponent(scenarioId)}/resources`, { cache: 'no-store' }).then((response) => response.ok ? response.json() : []),
    fetch(`/apil7r/pf2-mj/scenarios/${encodeURIComponent(scenarioId)}/relations`, { cache: 'no-store' }).then((response) => response.ok ? response.json() : { npcs: [], places: [], factions: [], events: [] }),
    fetch(`/apil7r/pf2-mj/scenarios/${encodeURIComponent(scenarioId)}/dependencies`, { cache: 'no-store' }).then((response) => response.ok ? response.json() : { dependencies: [], dependents: [] }),
    fetch(`/apil7r/pf2-mj/scenario-packages/${encodeURIComponent(scenarioId)}/available`, { cache: 'no-store' }).then((response) => response.ok ? response.json() : null),
    fetch(`/apil7r/pf2-mj/scenario-packages/${encodeURIComponent(scenarioId)}/deployments/latest`, { cache: 'no-store' }).then((response) => response.ok ? response.json() : null),
    fetch(`/apil7r/pf2-mj/scenario-packages/${encodeURIComponent(scenarioId)}/reset-preview`, { cache: 'no-store' }).then((response) => response.ok ? response.json() : null),
    fetch('/apil7r/pf2-mj/package-registry', { cache: 'no-store' }).then((response) => response.ok ? response.json() : null)
  ]).then(([packageStatus, scenarioAssets, scenarioRelations, scenarioDependencies, availablePackage, latestDeployment, scenarioResetPreview, packageRegistry]) => {
    setStatus(packageStatus); setAssets(Array.isArray(scenarioAssets) ? scenarioAssets : [])
    setRelations(scenarioRelations && typeof scenarioRelations === 'object' ? scenarioRelations : { npcs: [], places: [], factions: [], events: [] })
    setDependencies(scenarioDependencies && typeof scenarioDependencies === 'object' ? scenarioDependencies : { dependencies: [], dependents: [] })
    setAvailable(availablePackage)
    setDeployment(latestDeployment)
    setResetPreview(scenarioResetPreview && typeof scenarioResetPreview === 'object' ? scenarioResetPreview : null)
    setRegistry({ factions: Array.isArray(packageRegistry?.factions) ? packageRegistry.factions : [], places: Array.isArray(packageRegistry?.places) ? packageRegistry.places : [] })
  }).catch(() => setMessage('État du package indisponible.'))
  useEffect(() => { void load() }, [scenarioId])
  const loadAiSupport = async () => {
    try {
      const [libraryResponse, requiredResponse] = await Promise.all([
        fetch('/apil7r/pf2-mj/foundry-reference-library/status', { cache: 'no-store' }),
        fetch(`/apil7r/pf2-mj/scenarios/${encodeURIComponent(scenarioId)}/ai-required-data`, { cache: 'no-store' })
      ])
      setReferenceLibrary(libraryResponse.ok ? await libraryResponse.json() : null)
      setRequiredData(requiredResponse.ok ? await requiredResponse.json() : null)
    } catch { setReferenceLibrary(null); setRequiredData(null) }
  }
  useEffect(() => { void loadAiSupport() }, [scenarioId])
  useEffect(() => {
    if (!deployment || !['pending', 'claimed'].includes(deployment.status)) return
    let stopped = false
    const refreshDeployment = async () => {
      try {
        const response = await fetch(`/apil7r/pf2-mj/scenario-packages/${encodeURIComponent(scenarioId)}/deployments/latest`, { cache: 'no-store' })
        const next = response.ok ? await response.json() : null
        if (stopped) return
        setDeployment(next)
        if (next?.status === 'success' || next?.status === 'failed') await load()
      } catch { /* Le prochain intervalle réessaiera sans masquer l’état connu. */ }
    }
    const timer = window.setInterval(() => { void refreshDeployment() }, 3_000)
    return () => { stopped = true; window.clearInterval(timer) }
  }, [scenarioId, deployment?.id, deployment?.status])
  const importPackage = async (file: File | undefined) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.zip')) { setMessage('Sélectionne un fichier ZIP.'); return }
    setBusy(true); setMessage('')
    try {
      const body = new FormData(); body.set('file', file)
      const endpoint = aiExportKind === 'campaign'
        ? `/apil7r/pf2-mj/campaigns/${encodeURIComponent(scenarioId)}/ai-response`
        : '/apil7r/pf2-mj/scenario-packages/import'
      const response = await fetch(endpoint, { method: 'POST', body })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.message ?? payload?.error ?? 'Import impossible.')
      if (aiExportKind === 'campaign') {
        if (payload.campaignId !== scenarioId) throw new Error(`Ce ZIP concerne « ${payload.campaignId} », pas cette campagne.`)
        const count = Array.isArray(payload.imported) ? payload.imported.length : Number(payload.packageCount ?? 0)
        const dependencies = Number(payload.dependencyCount ?? 0)
        setMessage(`${count} package(s) enfant(s) intégré(s)${dependencies ? ` · ${dependencies} dépendance(s) fusionnée(s)` : ''}.`)
      } else {
        if (payload.scenarioId !== scenarioId) throw new Error(`Ce ZIP concerne « ${payload.scenarioId} », pas ce scénario.`)
        setMessage(payload.state === 'unchanged' ? 'Version déjà intégrée.' : `Package v${payload.packageVersion} intégré.`)
      }
      await load()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Import impossible.') } finally { setBusy(false) }
  }
  // PF2_AI_TWO_PASS_REFERENCE_LIBRARY_V1
  // PF2_ROBUST_DOWNLOADS_V2
  const prepareLargeDownload = async (kind: 'ai-preflight' | 'ai-generation') => {
    setBusy(true)
    setMessage(kind === 'ai-preflight' ? 'Préparation de la préanalyse…' : 'Préparation du ZIP final…')
    try {
      const response = await fetch(`/apil7r/pf2-mj/downloads/prepare/${kind}/${encodeURIComponent(scenarioId)}`, { method: 'POST' })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.message ?? payload?.error ?? 'Préparation du téléchargement impossible.')
      if (!payload?.token) throw new Error('Le serveur n’a pas renvoyé de token de téléchargement.')
      const sizeMb = Number(payload.size ?? 0) / 1024 / 1024
      setMessage(`Export prêt${sizeMb ? ` · ${sizeMb.toFixed(1)} Mio` : ''}. Le téléchargement démarre…`)
      window.location.assign(`/apil7r/pf2-mj/downloads/${encodeURIComponent(payload.token)}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Préparation du téléchargement impossible.')
    } finally {
      setBusy(false)
    }
  }

  const importReferenceLibrary = async (file: File | undefined) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.json')) { setMessage('Sélectionne le JSON PF2e Reference Library exporté depuis Foundry.'); return }
    setBusy(true); setMessage('')
    try {
      const body = new FormData(); body.set('file', file)
      const response = await fetch('/apil7r/pf2-mj/foundry-reference-library/import', { method: 'POST', body })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.message ?? payload?.error ?? 'Import de la bibliothèque Foundry impossible.')
      setMessage(`Bibliothèque Foundry importée · ${Number(payload.actorCount ?? 0)} Actors · ${Number(payload.itemCount ?? 0)} Items.`)
      await loadAiSupport()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Import de la bibliothèque Foundry impossible.') } finally { setBusy(false) }
  }

  const importRequiredData = async (file: File | undefined) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.json')) { setMessage('Sélectionne required-data.json.'); return }
    setBusy(true); setMessage('')
    try {
      const body = new FormData(); body.set('file', file)
      const response = await fetch(`/apil7r/pf2-mj/scenarios/${encodeURIComponent(scenarioId)}/ai-required-data`, { method: 'POST', body })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.message ?? payload?.error ?? 'Import de required-data.json impossible.')
      setRequiredData(payload)
      setMessage(`${Number(payload.requests?.length ?? 0)} demande(s) IA importée(s) · ${Number(payload.requiredMissing ?? 0)} requise(s) introuvable(s).`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Import de required-data.json impossible.') } finally { setBusy(false) }
  }

  const integrateIndexed = async () => {
    if (!available) return
    setBusy(true); setMessage('')
    try {
      const response = await fetch(`/apil7r/pf2-mj/scenario-packages/${encodeURIComponent(scenarioId)}/integrate-library`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ assetId: available.asset.id }) })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.message ?? payload?.error ?? 'Intégration impossible.')
      setMessage(payload.state === 'unchanged' ? 'Cette version est déjà intégrée.' : `Package v${payload.packageVersion} intégré.`)
      await load()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Intégration impossible.') } finally { setBusy(false) }
  }
  const requestDeployment = async () => {
    if (!status) return
    setBusy(true); setMessage('')
    try {
      const response = await fetch(`/apil7r/pf2-mj/scenario-packages/${encodeURIComponent(scenarioId)}/deployments`, { method: 'POST' })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.message ?? payload?.error ?? 'Création de la demande impossible.')
      setDeployment(payload)
      setMessage('Demande envoyée à Foundry.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Création de la demande impossible.') } finally { setBusy(false) }
  }
  // PF2_SCENARIO_RESET_V1
  const resetScenario = async (mode: 'app' | 'foundry' | 'all') => {
    if (!resetPreview) return
    const confirmation = window.prompt(`Cette action est destructive.\n\nTape exactement :\n${resetPreview.confirmationText}`)
    if (confirmation === null) return
    if (confirmation !== resetPreview.confirmationText) {
      setMessage('Confirmation incorrecte : aucune suppression effectuée.')
      return
    }

    setBusy(true); setMessage('')
    try {
      const response = await fetch(`/apil7r/pf2-mj/scenario-packages/${encodeURIComponent(scenarioId)}/reset`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode, confirm: confirmation })
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.message ?? payload?.error ?? 'Réinitialisation impossible.')

      if (mode === 'app') {
        setMessage('Application réinitialisée. Le contenu Foundry éventuel est conservé.')
      } else if (mode === 'foundry') {
        setDeployment(payload?.deployment ?? null)
        setMessage('Nettoyage de ce scénario placé dans la file Foundry.')
      } else {
        setDeployment(payload?.deployment ?? null)
        setMessage('Reset complet placé dans la file Foundry. Les données propres au scénario seront nettoyées dans l’application après le reset Foundry réussi.')
      }
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Réinitialisation impossible.')
    } finally {
      setBusy(false)
    }
  }
  const assetLabel = (asset: ScenarioAsset) => {
    const category = asset.libraryCategory?.toLowerCase()
    const component = asset.resourceTargetLabel?.toLowerCase() ?? ''
    if (asset.assetType === 'zip') return 'Package ZIP'
    if (asset.variant?.toLowerCase().includes('translation')) return 'Traduction'
    if (asset.role === 'information' || category === 'information') return 'Document d’information'
    if (category === 'map' || /\bcarte|\bmap\b/.test(component)) return 'Carte'
    if (category === 'playerguide' || /guide des joueurs/.test(component)) return 'Guide joueur'
    if (asset.resourceScope === 'component' && /volume|tome|épisode|partie/.test(component)) return 'Volume / partie'
    return asset.language?.toUpperCase() === 'FR' ? 'PDF français' : 'PDF principal'
  }
  const referenceBadges = (items: Array<{ targetId?: string; npcId?: string; nom?: string; name?: string; role?: string | null; targetKind?: string }>, view: ReferenceView) => items.length ? <div className="badges relation-badges">{items.map((item) => { const id = item.targetId ?? item.npcId; const targetView: ReferenceView = item.targetKind === 'region' ? 'regions' : view; return id ? <Link key={id} to={referenceHref(targetView, id)}>{item.nom || item.name || id}{item.role ? ` · ${item.role}` : ''}</Link> : null })}</div> : <p className="missing">Aucun lien renseigné.</p>
  const currentStatus = !status ? (available ? 'available' : '—') : available?.packageVersion !== null && available?.packageVersion !== undefined && available.packageVersion > status.packageVersion ? 'obsolete' : status.status
  const deploymentActive = deployment?.status === 'pending' || deployment?.status === 'claimed'
  const deploymentOperation = deployment?.operation ?? 'deploy'
  const deploymentLabel = deploymentOperation === 'reset'
    ? deployment?.status === 'pending' ? 'Reset en attente de Foundry'
      : deployment?.status === 'claimed' ? 'Reset Foundry en cours'
        : deployment?.status === 'success' ? 'Reset Foundry terminé'
          : deployment?.status === 'failed' ? 'Échec du reset Foundry'
            : null
    : deployment?.status === 'pending' ? 'En attente de Foundry'
      : deployment?.status === 'claimed' ? 'En cours d’import'
        : deployment?.status === 'success' ? (status ? 'Synchronisé' : 'Présent dans Foundry')
          : deployment?.status === 'failed' ? 'Échec'
            : null
  const factionNames = new Map(registry.factions.map((faction) => [faction.id, faction.name]))
  const placeNames = new Map(registry.places.map((place) => [place.id, place.name]))
  const actors = Array.isArray(status?.manifest?.actors) ? status.manifest.actors.filter((value): value is PackageActor => Boolean(value && typeof value === 'object' && !Array.isArray(value))) : []
  const bestiary = [...actors.filter((actor) => actor.type === 'reference' || actor.type === 'custom').reduce((groups, actor) => {
    const source = actor.type === 'reference' ? (actor.uuid || (typeof actor.lookup === 'string' ? actor.lookup : 'Référence PF2')) : 'Acteur mécanique du package'
    const key = `${actor.type}:${source}:${actor.name ?? actor.key ?? ''}`
    const current = groups.get(key)
    groups.set(key, current ? { ...current, quantity: current.quantity + 1 } : { name: actor.name || actor.key || 'Acteur sans nom', type: actor.type, source, quantity: 1 })
    return groups
  }, new Map<string, { name: string; type: 'reference' | 'custom'; source: string; quantity: number }>()).values()]
  return <>
    {allowAiExport && <section className="detail-section scenario-ai-preparation"><h3>Préparation IA · 2 phases</h3>
      <div className="package-status"><small>BIBLIOTHÈQUE DE RÉFÉRENCES FOUNDRY</small><strong>{referenceLibrary?.available ? `${referenceLibrary.actorCount} Actors · ${referenceLibrary.itemCount} Items` : 'Absente'}</strong><em>{referenceLibrary?.available ? `sources détaillées : ${referenceLibrary.actorSourceCount} Actors · ${referenceLibrary.itemSourceCount} Items${referenceLibrary.metadata?.systemVersion ? ` · PF2e ${referenceLibrary.metadata.systemVersion}` : ''}` : 'Exporte « PF2e Reference Library » depuis Foundry puis importe le JSON ici.'}</em></div>
      <label className="package-upload"><span>{busy ? 'Import en cours…' : referenceLibrary?.available ? 'Remplacer la bibliothèque Foundry' : 'Importer la bibliothèque Foundry'}</span><input type="file" accept=".json,application/json" disabled={busy} onChange={(event) => { void importReferenceLibrary(event.target.files?.[0]); event.currentTarget.value = '' }} /></label>
      {preparationStatus === 'selected'
        ? referenceLibrary?.available
          ? <><p><strong>Phase 1 :</strong> PDF + données de l’app + index Foundry léger. L’IA ne génère rien encore ; elle rend uniquement <code>required-data.json</code>.</p><button className="package-integrate" disabled={busy} onClick={() => void prepareLargeDownload('ai-preflight')}>{busy ? 'Préparation…' : 'Exporter la préanalyse IA'}</button></>
          : <p className="missing">Importe d’abord la bibliothèque de références Foundry pour empêcher l’IA d’inventer des références de compendium.</p>
        : preparationStatus === 'ready'
          ? <p>{aiExportKind === 'campaign' ? 'Cette campagne est déjà marquée Prête. Un nouvel export nécessitera d’abord une nouvelle sélection explicite.' : 'Ce scénario est déjà marqué Prêt. Un nouvel export nécessitera d’abord une nouvelle sélection explicite.'}</p>
          : <p className="missing">Passe le statut MJ à « Retenu » ou « À jouer » pour commencer la préanalyse IA.</p>}
      <div className="package-status"><small>RETOUR DE PHASE 1</small><strong>{requiredData ? `${requiredData.requests.length} demande(s) · ${requiredData.availableCount} résolue(s)` : 'Aucun required-data.json'}</strong><em>{requiredData ? `${requiredData.status}${requiredData.requiredMissing ? ` · ${requiredData.requiredMissing} requise(s) introuvable(s)` : ''}` : 'Importe ici le JSON produit par l’IA.'}</em></div>
      <label className="package-upload"><span>{busy ? 'Import en cours…' : 'Importer required-data.json'}</span><input type="file" accept=".json,application/json" disabled={busy} onChange={(event) => { void importRequiredData(event.target.files?.[0]); event.currentTarget.value = '' }} /></label>
      {requiredData?.requests?.length ? <div className="resource-list">{requiredData.requests.map((request) => <div key={request.requestId} className={request.available ? '' : 'missing'}><small>{request.sourceType} · {request.kind}{request.required ? ' · requis' : ' · facultatif'}</small><strong>{request.subject.name || request.indexName || request.subject.uuid}</strong><em>{request.available ? 'source disponible dans le snapshot' : 'SOURCE INTROUVABLE'} · {request.reason}</em></div>)}</div> : null}
      {requiredData && requiredData.status !== 'blocked' && requiredData.requiredMissing === 0 && preparationStatus === 'selected' && <><p><strong>Phase 2 :</strong> l’application reconstruit un ZIP autonome avec les mêmes PDF/contexte et seulement les sources Foundry détaillées demandées.</p><button className="package-integrate" disabled={busy} onClick={() => void prepareLargeDownload('ai-generation')}>{busy ? 'Préparation…' : 'Exporter le ZIP de génération finale'}</button></>}
      {requiredData?.status === 'blocked' && <p className="missing">La préanalyse a déclaré cette cible bloquée. Examine les éléments unresolved avant de générer le package final.</p>}
    </section>}
    <section className="detail-section scenario-resources"><h3>Ressources associées</h3>
      {assets.length ? <div className="resource-list">{assets.map((asset) => {
        const openablePdf = asset.present && asset.assetType === 'pdf'
        const href = openablePdf ? `/apil7r/pf2-mj/bibliotheque/${asset.path.split('/').map(encodeURIComponent).join('/')}` : null
        return <div key={asset.id} className={asset.present ? '' : 'missing'}><small>{assetLabel(asset)}{asset.language ? ` · ${asset.language}` : ''}{asset.resourceScope === 'component' && asset.resourceTargetLabel ? ` · ${asset.resourceTargetLabel}` : ''}</small><strong>{asset.filename}</strong><em>{asset.present ? 'disponible' : 'absent'} · {asset.associationStatus === 'confirmed' ? 'association confirmée' : asset.associationStatus}</em>{href && <a className="resource-open" href={href} target="_blank" rel="noreferrer">Ouvrir le PDF ↗</a>}</div>
      })}</div> : <p className="missing">Aucune ressource indexée pour ce scénario.</p>}
    </section>
    {aiExportKind === 'campaign' ? <section className="detail-section scenario-package-panel"><h3>Réponse IA de campagne</h3>
      <p>L’enveloppe de campagne sera contrôlée puis ses packages enfants seront intégrés dans l’ordre. Les liens métier déjà présents sont conservés ; les dépendances proposées sont fusionnées avec les dépendances existantes.</p>
      <label className="package-upload"><span>{busy ? 'Import en cours…' : 'Importer le ZIP réponse IA de campagne'}</span><input type="file" accept=".zip,application/zip" disabled={busy} onChange={(event) => { void importPackage(event.target.files?.[0]); event.currentTarget.value = '' }} /></label>
      {message && <p className="package-message">{message}</p>}
    </section> : <section className="detail-section scenario-package-panel"><h3>Package Foundry</h3>
      {available ? <div className="package-status"><small>PACKAGE ZIP DISPONIBLE</small><strong>{available.packageVersion === null ? 'Version illisible' : `v${available.packageVersion}`} · {available.asset.filename}</strong><em>{available.error || 'disponible dans la bibliothèque'}</em></div> : <p className="missing">Aucun ZIP associé et présent dans la bibliothèque.</p>}
      {status ? <><div className="package-status"><small>VERSION INTÉGRÉE DANS L’APPLICATION</small><strong>v{status.packageVersion} · {status.filename}</strong><em>statut : {currentStatus}</em></div><div className="package-status"><small>VERSION DÉPLOYÉE DANS FOUNDRY</small><strong>{status.deployedVersion === null ? 'Aucune' : `v${status.deployedVersion}`}</strong><em>{status.deployedVersion !== null && status.deployedVersion < status.packageVersion ? 'Foundry obsolète' : status.deployedVersion === status.packageVersion ? 'à jour' : 'non synchronisée'}</em></div></> : <div className="package-status"><small>VERSION INTÉGRÉE DANS L’APPLICATION</small><strong>Aucune</strong><em>statut : {currentStatus}</em></div>}
      {available && available.packageVersion !== null && <button className="package-integrate" disabled={busy} onClick={() => void integrateIndexed()}>{busy ? 'Intégration…' : status ? 'Mettre à jour depuis la bibliothèque' : 'Intégrer depuis la bibliothèque'}</button>}
      <label className="package-upload"><span>{busy ? 'Import en cours…' : 'Ou importer un ZIP manuellement'}</span><input type="file" accept=".zip,application/zip" disabled={busy} onChange={(event) => { void importPackage(event.target.files?.[0]); event.currentTarget.value = '' }} /></label>
      {status && <button className="package-integrate package-deploy" disabled={busy || deploymentActive} onClick={() => void requestDeployment()}>{deploymentActive ? 'Synchronisation en cours…' : 'Synchroniser avec Foundry'}</button>}
      {deploymentLabel && <div className={`deployment-state ${deployment?.status}`}><strong>{deploymentLabel}</strong>{deployment?.status === 'failed' && deployment.error && <em>{deployment.error}</em>}{deployment?.status && deployment.status !== 'failed' && <em>{deploymentOperation === 'reset' ? 'Nettoyage du scénario' : `Package v${deployment?.packageVersion}`}</em>}</div>}
      {resetPreview && <div className="campaign-reset-box scenario-reset-box">
        <h4>Réinitialiser le scénario</h4>
        <p><strong>Application :</strong> {resetPreview.application.packages} package(s), {resetPreview.application.deployments} historique(s) de déploiement connu(s) et jusqu’à {resetPreview.application.scopedRecords} donnée(s) propres à ce scénario.</p>
        <p><strong>Foundry connu :</strong> {resetPreview.foundryKnown.version === null ? (resetPreview.foundryKnown.state === 'reset' ? 'retiré' : 'version inconnue') : `v${resetPreview.foundryKnown.version}`} · ≈ {resetPreview.foundryKnown.actors} Actor(s), {resetPreview.foundryKnown.scenes} scène(s), {resetPreview.foundryKnown.journals} journal(aux). {resetPreview.preserveNpcIds.length ? `${resetPreview.preserveNpcIds.length} PNJ réutilisé(s) ailleurs seront protégés.` : ''}</p>
        <div className="campaign-reset-actions">
          <button disabled={busy || deploymentActive} onClick={() => void resetScenario('app')}>Application uniquement</button>
          <button disabled={busy || deploymentActive} onClick={() => void resetScenario('foundry')}>Foundry uniquement</button>
          <button className="danger" disabled={busy || deploymentActive} onClick={() => void resetScenario('all')}>Tout recommencer</button>
        </div>
        <small>{resetPreview.foundryKnown.note}</small>
      </div>}
    {message && <p className="package-message">{message}</p>}
    </section>}
    <section className="detail-section scenario-npcs"><h3>PNJ du scénario</h3>{relations.npcs.length ? <div className="scenario-npc-grid">{relations.npcs.map((npc) => { const id = npc.id ?? npc.npcId; const portrait = pnjPortraitUrl(npc.portrait); const faction = npc.factions?.[0]; const region = npc.regions?.[0]; return <Link className="scenario-npc-card" key={id} to={referenceHref('pnj', id)}><span className={`scenario-npc-portrait${portrait ? '' : ' placeholder'}`}>{portrait ? <img src={portrait} alt="" /> : '◆'}</span><span className="scenario-npc-copy"><strong>{npc.nom || npc.name || id}</strong><em>{npc.role || 'Rôle à préciser'}{npc.importance ? ` · ${npc.importance}` : ''}</em>{faction && <small>Faction · {factionNames.get(faction.faction_id ?? '') ?? faction.faction_id}</small>}{region && <small>Région · {placeNames.get(region) ?? region}</small>}</span></Link> })}</div> : <p className="missing">Aucun PNJ narratif lié à ce scénario.</p>}</section>
    <section className="detail-section scenario-bestiary"><h3>Bestiaire / acteurs du scénario</h3>{!status ? <p className="missing">Aucun package intégré : le bestiaire sera disponible après son intégration.</p> : bestiary.length ? <div className="scenario-bestiary-list">{bestiary.map((actor) => <article key={`${actor.type}-${actor.source}-${actor.name}`}><span className={`actor-kind ${actor.type}`}>{actor.type === 'reference' ? 'Référence' : 'Personnalisé'}</span><strong>{actor.name}</strong><em>{actor.type === 'reference' ? `Compendium PF2 · ${actor.source}` : actor.source}</em>{actor.quantity > 1 && <small>×{actor.quantity}</small>}</article>)}</div> : <p className="missing">Aucun acteur de bestiaire déclaré dans ce package.{actors.some((actor) => actor.type === 'narrative') ? ' Les acteurs narratifs sont présentés dans les PNJ ci-dessus.' : ''}</p>}</section>
    <section className="detail-section scenario-dependencies"><h3>Dépendances entre scénarios</h3>
      <div className="relation-groups">
        <div><small>À jouer avant / contexte préalable</small>{dependencies.dependencies.length ? <div className="badges relation-badges">{dependencies.dependencies.map((link) => <span key={link.dependsOnScenarioId} className="dependency-badge"><strong>{link.scenario?.name || link.scenario?.titleFr || link.dependsOnScenarioId}</strong> · {link.relationType === 'required' ? 'requis' : 'recommandé'}{link.sourcePage ? ` · p. ${link.sourcePage}` : ''}{link.source ? ` · ${link.source}` : ''}</span>)}</div> : <p className="missing">Aucune dépendance renseignée.</p>}</div>
        <div><small>Scénarios qui dépendent de celui-ci</small>{dependencies.dependents.length ? <div className="badges relation-badges">{dependencies.dependents.map((link) => <span key={link.scenarioId} className="dependency-badge"><strong>{link.scenario?.name || link.scenario?.titleFr || link.scenarioId}</strong> · {link.relationType === 'required' ? 'requis' : 'recommandé'}</span>)}</div> : <p className="missing">Aucune suite liée.</p>}</div>
      </div>
    </section>
    <section className="detail-section scenario-relations"><h3>Relations métier</h3><div className="relation-groups"><div><small>Lieux et régions</small>{referenceBadges(relations.places, 'lieux')}</div><div><small>Factions</small>{referenceBadges(relations.factions, 'factions')}</div><div><small>Événements</small>{referenceBadges(relations.events, 'evenements')}</div></div></section>
  </>
}

function PlayableDetail({ unit, curation, onUpdate, placeOptions, onOpenReference }: { unit: PlayableUnit; curation: Curation; onUpdate: (id: string, field: string, value: unknown) => void; placeOptions: string[]; onOpenReference: (view: ReferenceView, id: string) => void }) {
  const override = resolvePlayableOverride(curation, unit)
  const levels = effectiveLevels(unit, override)
  const locations = effectiveLocations(unit, override)
  const availability = availabilityOf(unit)
  const bundle = resourceBundleAvailability(unit)
  const [levelsDraft, setLevelsDraft] = useState(levelLabel(levels) === 'À documenter' ? '' : levelLabel(levels))
  const [placesDraft, setPlacesDraft] = useState(unique(locations.map((location) => placeDisplay(location.id))).join(', '))
  const components = componentsOf(unit.id)
  const ancestors = ancestorContainers(unit)

  return <EntityPage backTo={viewPaths.library}>
    <div className="detail-head"><small>{playableTypeLabel(unit.playableType)}{ancestors[0] ? ` · ${ancestors.map(titleOf).join(' · ')}` : ''}</small><h2>{unit.number && `${unit.number} · `}{titleOf(unit)}</h2>{originalTitleOf(unit) && <em>{originalTitleOf(unit)}</em>}<AvailabilityBadges unit={unit} /></div>
    <div className="availability-grid"><div><small>Document</small><strong>{documentStatusLabel(unit)}</strong></div><div><small>Mode</small><strong>{documentaryModeLabel(availability.mode) || (availability.coreMaterial === 'informationOnly' ? 'INFO' : '—')}</strong></div><div><small>Prêt</small><strong>{availability.ready ? 'OK' : 'Non'}</strong></div><div><small>Documents requis</small><strong>{availability.requiredDocuments.present}/{availability.requiredDocuments.required}</strong>{availability.requiredDocuments.informationOnly > 0 && <em> + {availability.requiredDocuments.informationOnly} info</em>}</div><div><small>ZIP Foundry</small><strong>{resourceBundleLabel(bundle)}</strong>{bundle.inheritedFromId && <em>hérité de {titleOf(containerMap.get(bundle.inheritedFromId)!)}</em>}</div></div>
    <dl className="detail-grid"><div><dt>Niveaux</dt><dd><input value={levelsDraft} onChange={(event) => setLevelsDraft(event.target.value)} /><button onClick={() => onUpdate(unit.id, 'levelsOverride', levelsDraft)}>Enregistrer</button><SourceBadge source={levels.source} /></dd></div><div><dt>Lieux</dt><dd><input list="all-places" value={placesDraft} onChange={(event) => setPlacesDraft(event.target.value)} /><datalist id="all-places">{placeOptions.map((place) => <option key={place}>{place}</option>)}</datalist><button onClick={() => onUpdate(unit.id, 'placesOverride', placesDraft.split(',').map((value) => value.trim()).filter(Boolean))}>Remplacer</button>{locations.map((location) => <span className="location-provenance" key={`${location.id}-${location.source.kind}`}>{location.id}<SourceBadge source={location.source} /></span>)}</dd></div><div><dt>Statut MJ</dt><dd><LifecycleSelect id={unit.id} override={override} excluded={isExcluded(unit, override, curation)} onUpdate={onUpdate} /></dd></div><div><dt>Chronologie</dt><dd>{yearOf(unit) ? `${unit.chronology.estimated ? '≈ ' : ''}${yearOf(unit)} AR` : unit.chronology.period || 'À documenter'}</dd></div><div><dt>Fil narratif</dt><dd>{unit.narrativeThread || '—'}</dd></div></dl>
    {unit.arcIds.length > 0 && <section className="detail-section"><h3>Arcs PFS / transversaux</h3><div className="badges">{unit.arcIds.map((id) => <Badge key={id}>{arcMap.get(id)?.titleFr || id}</Badge>)}</div></section>}
    <section className="detail-section synopsis-long"><h3>Synopsis de l’unité</h3><p>{unit.synopsis || 'Description propre de ce scénario non renseignée.'}</p></section>
    <PlayableComponentsSection components={unit.playableComponents} />
    {unit.gmDetails && <section className="detail-section gm-details"><h3>Détails MJ</h3><p>{unit.gmDetails}</p></section>}
    {unit.migration.issues.length > 0 && <section className="detail-section migration-warning"><h3>À revoir après migration</h3><ul>{unit.migration.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></section>}
    {components.length > 0 && <section className="detail-section"><h3>Composants de l’œuvre</h3><div className="part-list">{components.map((component) => <article key={component.id}><strong>{componentTypeLabel(component.componentType)} · {titleOf(component)}</strong><span>{component.notes}</span><Badge>{component.requiredForCore ? 'Requis' : 'Facultatif'}</Badge></article>)}</div></section>}
    <ScenarioPackagePanel scenarioId={unit.id} onOpenReference={onOpenReference} preparationStatus={effectivePreparationStatus(override)} allowAiExport />
  </EntityPage>
}

function ContainerDetail({ container, curation, onOpenPlayable, onUpdate, onOpenReference }: { container: Container; curation: Curation; onOpenPlayable: (unit: PlayableUnit) => void; onUpdate: (id: string, field: string, value: unknown) => void; onOpenReference: (view: ReferenceView, id: string) => void }) {
  const children = playablesUnder(container.id)
  const components = componentsOf(container.id)
  const documentedChildren = children.filter((unit) => unit.playableComponents.length > 0)
  const componentTotal = container.playableComponents.length + documentedChildren.reduce((total, unit) => total + unit.playableComponents.length, 0)
  const override = resolveContainerOverride(curation, container)
  return <EntityPage backTo={viewPaths.library}>
    <div className="detail-head"><small>{containerTypeLabel(container.containerType)} · CONTENEUR NON JOUABLE</small><h2>{titleOf(container)}</h2>{originalTitleOf(container) && <em>{originalTitleOf(container)}</em>}<div className="badges"><Badge>{levelLabel(container.levels)}</Badge><Badge>{children.length} unités jouables</Badge><Badge>{container.migration.status === 'ready' ? 'Structure prête' : 'À revoir'}</Badge></div></div>
    <section className="detail-section synopsis-long"><h3>Synthèse</h3><p>{container.synopsis || 'Synopsis de collection non renseigné.'}</p></section>
    <dl className="detail-grid"><div><dt>Niveaux affichés</dt><dd>{levelLabel(container.levels)}<SourceBadge source={container.levels.source} /></dd></div><div><dt>Lieux</dt><dd>{container.locations.length ? unique(container.locations.map((location) => placeDisplay(location.id))).join(', ') : 'Agrégés depuis les enfants / à documenter'}{container.locations[0] && <SourceBadge source={container.locations[0].source} />}</dd></div><div><dt>Statut MJ</dt><dd><LifecycleSelect id={container.id} override={override} excluded={isContainerExcluded(container, curation)} onUpdate={onUpdate} /></dd></div></dl>
    {container.migration.issues.length > 0 && <section className="detail-section migration-warning"><h3>Décisions de migration</h3><ul>{container.migration.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></section>}
    <section className="detail-section"><h3>Unités jouables</h3>{children.length ? <div className="compact-playables">{children.map((unit) => { const status = availabilityOf(unit); return <Link key={unit.id} to={playableHref(unit)}><span>▶</span><strong>{titleOf(unit)}</strong><small>{levelLabel(unit.levels)} · {documentStatusLabel(unit)}</small></Link> })}</div> : <p className="missing">Aucune unité jouable explicite : cette campagne doit être découpée avant d’être fiable dans « Trouver une partie ».</p>}</section>
    {container.containerType === 'campaign' && <section className="detail-section playable-components-summary"><h3>Composants jouables</h3><p>{documentedChildren.length}/{children.length} scénario{children.length > 1 ? 's' : ''} documenté{documentedChildren.length > 1 ? 's' : ''} · {componentTotal} composant{componentTotal > 1 ? 's' : ''} narratif{componentTotal > 1 ? 's' : ''}.</p>{container.playableComponents.length > 0 && <PlayableComponentsSection components={container.playableComponents} />}{documentedChildren.length > 0 && <div className="campaign-component-list">{documentedChildren.map((unit) => <article key={unit.id}><strong>{titleOf(unit)}</strong><ol>{unit.playableComponents.map((component) => <li key={component.id}>#{component.order} · {component.title}</li>)}</ol></article>)}</div>}{!componentTotal && <p className="missing">Découpage narratif non renseigné : aucune partie n’est inventée automatiquement.</p>}</section>}
    {components.length > 0 && <section className="detail-section"><h3>Composants / ressources</h3><div className="part-list">{components.map((component) => <ComponentCard component={component} key={component.id} />)}</div></section>}
    {container.containerType === 'campaign' && <CampaignOperationsPanel campaignId={container.id} onOpenPlayable={onOpenPlayable} />}
    <ScenarioPackagePanel scenarioId={container.id} onOpenReference={onOpenReference} preparationStatus={override.preparationStatus ?? 'untreated'} allowAiExport={container.containerType === 'campaign'} aiExportKind="campaign" />
  </EntityPage>
}

function ComponentCard({ component }: { component: Component }) {
  const linked = documentsForTarget(component.id)
  return <article><strong>{componentTypeLabel(component.componentType)} · {titleOf(component)}</strong><span>{component.notes || `${linked.length} document${linked.length > 1 ? 's' : ''}`}</span><Badge>{component.requiredForCore ? 'Requis' : 'Facultatif'}</Badge></article>
}

type PlayableComponentsWork = { id: string; title: string; description: string | null; units: PlayableUnit[]; campaign: boolean; status: LifecycleStatus }

function JournalView({ curation, onUpdate, onImported }: { curation: Curation; onUpdate: (id: string, field: string, value: unknown) => void; onImported: () => Promise<void> }) {
  const [message, setMessage] = useState('')
  const [importing, setImporting] = useState<string | null>(null)
  const [expandedCampaignIds, setExpandedCampaignIds] = useState<Set<string>>(() => new Set())
  const [expandedComponentKey, setExpandedComponentKey] = useState<string | null>(null)
  const selectedCampaigns = containers
    .filter((container) => {
      const override = resolveContainerOverride(curation, container)
      return container.containerType === 'campaign' && effectiveLifecycleStatus(override, isContainerExcluded(container, curation)) !== 'untracked' && !isContainerExcluded(container, curation)
    })
    .map((container): PlayableComponentsWork => { const override = resolveContainerOverride(curation, container); return { id: container.id, title: titleOf(container), description: container.synopsis, units: playablesUnder(container.id).filter((unit) => !isExcluded(unit, resolvePlayableOverride(curation, unit), curation)), campaign: true, status: effectiveLifecycleStatus(override) } })
  const coveredUnitIds = new Set(selectedCampaigns.flatMap((campaign) => campaign.units.map((unit) => unit.id)))
  const selectedStandalone = playableUnits
    .filter((unit) => {
      const override = resolvePlayableOverride(curation, unit)
      return !coveredUnitIds.has(unit.id) && effectiveLifecycleStatus(override, isExcluded(unit, override, curation)) !== 'untracked' && !isExcluded(unit, override, curation)
    })
  const statusRank: Record<LifecycleStatus, number> = { in_progress: 0, to_play: 1, retained: 2, played: 3, untracked: 4, later: 5, rejected: 6 }
  const works: PlayableComponentsWork[] = [...selectedCampaigns, ...selectedStandalone.map((unit) => ({ id: unit.id, title: titleOf(unit), description: unit.synopsis, units: [unit], campaign: false, status: effectiveLifecycleStatus(resolvePlayableOverride(curation, unit)) }))].sort((a, b) => statusRank[a.status] - statusRank[b.status] || a.title.localeCompare(b.title, 'fr'))

  const componentExample = { id: 'exemple-ouverture', title: 'Ouverture', description: 'Résumé factuel de cette unité narrative.', estimatedSessions: { min: 1, max: 2 }, continuity: { mode: 'free', returnToHubPossible: true, recommendedSameParty: false, notes: '' }, order: 1 }
  const scenarioPrompt = (work: PlayableComponentsWork, unit: PlayableUnit) => `Tu aides à documenter un scénario Pathfinder 2. Je joins son PDF et/ou son extrait de catalogue. Produis UNIQUEMENT le JSON valide ci-dessous.\n\nScénario : ${work.title}\nscenarioId : ${unit.id}\nDescription actuelle : ${unit.synopsis || 'non renseignée'}\n\nRègles : ne crée jamais de « Partie 1/2 » générique ; si le PDF ne permet pas une décomposition narrative fiable, retourne playableComponents: []. Chaque composant a un id en kebab-case, title, description, order, estimatedSessions facultatif et continuity.\n\n${JSON.stringify({ scenarioId: unit.id, playableComponents: [componentExample] }, null, 2)}`
  const legacyCampaignPrompt = (sourceWork: PlayableComponentsWork) => {
    const campaignDescription = sourceWork.description ?? ''
    const context = {
      campaign: {
        id: sourceWork.id,
        title: sourceWork.title,
        descriptionCurrent: campaignDescription,
        attachedPdfInstruction: 'Tous les PDF de cette campagne sont fournis séparément avec ce prompt. Leur contenu est la source de vérité.'
      },
      scenarios: sourceWork.units.map((unit) => ({
        scenarioId: unit.id,
        order: unit.number,
        title: titleOf(unit),
        originalTitle: originalTitleOf(unit),
        levels: levelLabel(unit.levels),
        locations: unique(unit.locations.map((location) => placeDisplay(location.id))),
        documentsKnown: documentsForTarget(unit.id).map((document) => ({ filename: document.filename, language: document.language, role: document.role, variant: document.variant })),
        descriptionCurrent: unit.synopsis ?? '',
        componentsCurrent: unit.playableComponents
      }))
    }
    const instructions = `\n\nCONTEXTE DE RÉFÉRENCE (ne pas le retourner tel quel)\n${JSON.stringify(context, null, 2)}\n\nDÉFINITIONS OBLIGATOIRES\n- Un composant est une séquence jouable cohérente : mission, enquête, site, confrontation ou transition. Ce n’est ni un chapitre, ni une page, ni une « Partie 1 » générique.\n- description de campagne : 1 à 3 phrases factuelles sur l’arc entier. description de scénario : 1 à 3 phrases sur cet épisode uniquement, sans répéter la campagne. description de composant : ce que les PJ y font et son enjeu.\n- continuity.mode: free = abordable sans enchaînement strict ; soft_lock = l’épisode précédent est fortement recommandé pour comprendre l’intrigue ; hard_lock = suit directement le précédent et ne doit pas être sauté.\n- continuity.returnToHubPossible est true seulement si les PJ peuvent raisonnablement retourner à leur base/Absalom avant la suite.\n- continuity.recommendedSameParty est true seulement si changer de groupe ferait perdre un contexte narratif important.\n- continuity.notes est une contrainte courte, ou une chaîne vide. estimatedSessions est facultatif et seulement estimé prudemment depuis le PDF, sous la forme { "min": nombre, "max": nombre }.\n- Les PDF priment sur ce brouillon. Conserve toute information déjà correcte ; n’invente aucune information non établie.\n- Conserve tous les scenarioId et leur ordre. Pour une découpe impossible à établir, retourne playableComponents: [].\n\nFORMAT : retourne uniquement le JSON final, sans Markdown, commentaire ni clé supplémentaire.`
    const work = { ...sourceWork, description: `${campaignDescription || 'non renseignée'}${instructions}` }
    const draft = {
      campaignId: work.id,
      description: campaignDescription,
      scenarios: work.units.map((unit) => ({
        scenarioId: unit.id,
        description: unit.synopsis ?? '',
        playableComponents: unit.playableComponents
      }))
    }
    return `Tu aides à documenter une campagne Pathfinder 2. Je joins tous les PDF de la campagne et/ou l’extrait de catalogue. Produis UNIQUEMENT le JSON valide pour l’import global de la campagne.\n\nLa campagne a sa propre description courte. Chaque sous-scénario a aussi sa propre description courte, différente de celle de la campagne. Chaque composant jouable a sa description courte.\n\nRègles impératives :\n- Pars du brouillon ci-dessous : conserve les descriptions déjà correctes et complète/corrige seulement selon les PDF.\n- Renseigne description pour la campagne et pour CHAQUE sous-scénario, en français, de façon courte et factuelle (1 à 3 phrases).\n- Ne répète jamais la description de la campagne dans les sous-scénarios.\n- Conserve tous les scenarioId fournis, même lorsqu’un sous-scénario n’a aucun composant.\n- Ne crée jamais de « Partie 1/2 » générique. Si aucune décomposition narrative fiable n’est possible, retourne playableComponents: [].\n- Chaque composant doit garder id, title, description, order, estimatedSessions facultatif et continuity.\n\nBrouillon canonique à compléter :\n${JSON.stringify(draft, null, 2)}`
  }

  const campaignPrompt = (work: PlayableComponentsWork) => {
    const context = work.units.map((unit) => ({
      scenarioId: unit.id,
      order: unit.number,
      title: titleOf(unit),
      originalTitle: originalTitleOf(unit),
      levels: levelLabel(unit.levels),
      locations: unique(unit.locations.map((location) => placeDisplay(location.id))),
      documentsKnown: documentsForTarget(unit.id).map((document) => ({ filename: document.filename, language: document.language, role: document.role, variant: document.variant })),
      descriptionCurrent: unit.synopsis ?? '',
      playableComponentsCurrent: unit.playableComponents
    }))
    const draft = {
      campaignId: work.id,
      description: work.description ?? '',
      scenarios: work.units.map((unit) => ({ scenarioId: unit.id, description: unit.synopsis ?? '', playableComponents: unit.playableComponents }))
    }
    return `PF2 — IMPORT CAMPAGNE\n\nTu documentes une campagne Pathfinder 2 pour un outil MJ. Tous les PDF de cette campagne sont joints à ce message. Ils sont la source de vérité.\n\nRéponds UNIQUEMENT avec le JSON final valide : pas de Markdown, pas de commentaire, pas de texte avant ou après.\n\nOBJECTIF\n- Décrire brièvement la campagne entière.\n- Décrire brièvement chacun de ses sous-scénarios.\n- Découper chaque sous-scénario en composants réellement jouables lorsque le PDF permet de le faire de manière fiable.\n\nRÈGLES\n- Description de campagne : 1 à 3 phrases françaises, factuelles, sur l’arc entier.\n- Description de scénario : 1 à 3 phrases françaises, uniquement sur cet épisode ; ne répète jamais le synopsis de campagne.\n- Un composant est une séquence jouable cohérente (mission, enquête, site, confrontation ou transition), jamais une page, un chapitre ou une « Partie 1/2 » artificielle.\n- Sa description indique ce que font les PJ et l’enjeu narratif.\n- Conserve les valeurs actuelles quand elles sont correctes ; les PDF priment. N’invente aucune information non établie.\n- Conserve TOUS les scenarioId, dans le même ordre. Si une découpe n’est pas établie par les PDF, laisse playableComponents: [].\n\nCONTINUITÉ\n- free : abordable sans enchaînement strict.\n- soft_lock : l’épisode précédent est fortement recommandé pour comprendre l’intrigue.\n- hard_lock : suit directement le précédent ; ne doit pas être sauté.\n- returnToHubPossible : true seulement si les PJ peuvent raisonnablement retourner à leur base/Absalom avant la suite.\n- recommendedSameParty : true seulement si changer de groupe ferait perdre un contexte narratif important.\n- notes : contrainte courte ou chaîne vide.\n- estimatedSessions : facultatif, seulement si les PDF permettent une estimation prudente : { "min": 1, "max": 2 }.\n\nCAMPAGNE\n${JSON.stringify({ id: work.id, title: work.title, descriptionCurrent: work.description ?? '' }, null, 2)}\n\nSOUS-SCÉNARIOS ET DOCUMENTS CONNUS\n${JSON.stringify(context, null, 2)}\n\nFORMAT DE SORTIE OBLIGATOIRE\nRetourne exactement cette structure et aucune clé supplémentaire :\n${JSON.stringify(draft, null, 2)}`
  }

  const unitProgress = (unit: PlayableUnit) => {
    const componentIds = new Set(unit.playableComponents.map((component) => component.id))
    const status = resolvePlayableOverride(curation, unit).playableComponentStatus ?? {}
    const played = Object.entries(status).filter(([id, value]) => componentIds.has(id) && value === 'played').length
    const total = unit.playableComponents.length
    return { played, total, completed: total > 0 && played === total }
  }
  const workProgress = (work: PlayableComponentsWork) => {
    const units = work.units.map(unitProgress)
    return { played: units.reduce((total, unit) => total + unit.played, 0), total: units.reduce((total, unit) => total + unit.total, 0), completedScenarios: units.filter((unit) => unit.completed).length }
  }
  const toggleCampaign = (campaignId: string) => setExpandedCampaignIds((current) => {
    const next = new Set(current)
    if (next.has(campaignId)) next.delete(campaignId)
    else next.add(campaignId)
    return next
  })
  const copyText = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(text); return }
      catch { /* Fallback for browsers or embedded pages that deny Clipboard API. */ }
    }
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.append(area)
    area.select()
    const copied = document.execCommand('copy')
    area.remove()
    if (!copied) throw new Error('Copie refusée par le navigateur.')
  }

  const copyPrompt = async (work: PlayableComponentsWork, unit?: PlayableUnit) => {
    try {
      const scenarioUnit = unit ?? work.units[0]
      if (!work.campaign && !scenarioUnit) throw new Error('Scénario introuvable.')
      await copyText(work.campaign ? campaignPrompt(work) : scenarioPrompt(work, scenarioUnit!))
      setMessage(`Prompt copié pour « ${work.title} ».`)
    } catch { setMessage('Copie impossible : autorise le presse-papier dans le navigateur.') }
  }

  const copySelectionPrompt = async () => {
    const targets = works.map((work) => `- ${work.campaign ? 'Campagne' : 'Scénario'} : ${work.title} (${work.id})`).join('\n') || '- Aucune œuvre suivie.'
    const text = `Tu aides à documenter des œuvres Pathfinder 2. Je joins les PDF associés et/ou un export du catalogue. Selon le type :\n- scénario autonome : retourne { scenarioId, playableComponents };\n- campagne : retourne { campaignId, scenarios: [{ scenarioId, description, playableComponents }] }.\nNe crée jamais de découpage générique et ne répète jamais la description de campagne dans ses sous-scénarios. En cas de doute, utilise playableComponents: [].\n\nŒuvres suivies dans le Journal MJ :\n${targets}`
    try { await copyText(text); setMessage('Prompt général copié dans le presse-papier.') }
    catch { setMessage('Copie impossible : autorise le presse-papier dans le navigateur.') }
  }

  const importComponents = async (unit: PlayableUnit, file?: File) => {
    if (!file) return
    setImporting(unit.id)
    setMessage(`Lecture de ${file.name}…`)
    try {
      const parsed: unknown = JSON.parse(await file.text())
      const data = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
      if (typeof data.scenarioId === 'string' && data.scenarioId !== unit.id) throw new Error(`Ce JSON vise « ${data.scenarioId} », pas « ${unit.id} ».`)
      const response = await fetch('/apil7r/pf2-mj/playable-components/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenarioId: unit.id, playableComponents: data.playableComponents ?? parsed }) })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.message ?? payload?.error ?? 'Import impossible.')
      await onImported()
      setMessage(`Composants jouables importés pour « ${titleOf(unit)} ».`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Import impossible.') } finally { setImporting(null) }
  }

  const importCampaign = async (work: PlayableComponentsWork, file?: File) => {
    if (!file) return
    setImporting(work.id)
    setMessage(`Lecture de ${file.name}…`)
    try {
      const parsed: unknown = JSON.parse(await file.text())
      const data = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
      if (typeof data.campaignId === 'string' && data.campaignId !== work.id) throw new Error(`Ce JSON vise « ${data.campaignId} », pas « ${work.id} ».`)
      const response = await fetch(`/apil7r/pf2-mj/campaigns/${encodeURIComponent(work.id)}/playable-components/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.message ?? payload?.error ?? 'Import de campagne impossible.')
      await onImported()
      setMessage(`Descriptions et composants importés pour « ${work.title} ».`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Import de campagne impossible.') } finally { setImporting(null) }
  }

  const togglePlayed = (unit: PlayableUnit, componentId: string) => {
    const current = resolvePlayableOverride(curation, unit).playableComponentStatus ?? {}
    const next = { ...current }
    if (next[componentId] === 'played') delete next[componentId]
    else next[componentId] = 'played'
    onUpdate(unit.id, 'playableComponentStatus', next)
  }

  return <section className="playable-components-view">
    <div className="playable-components-intro"><div><small>JOURNAL DE QUÊTE MJ</small><h2>En cours, à jouer, retenus et terminés</h2><p>Le statut MJ décide ce qui entre dans ton journal. Les composants servent uniquement à suivre la progression narrative quand un découpage existe.</p></div><button className="component-prompt" onClick={() => void copySelectionPrompt()}>Prompt composants</button></div>
    <div className="journal-status-board">{(['in_progress', 'to_play', 'retained', 'played'] as LifecycleStatus[]).map((status) => { const count = playableUnits.filter((unit) => { const override = resolvePlayableOverride(curation, unit); return !isExcluded(unit, override, curation) && effectiveLifecycleStatus(override) === status }).length; return <div key={status}><small>{lifecycleLabels[status]}</small><strong>{count}</strong></div> })}</div>
    {!works.length && <div className="empty-components"><strong>Journal vide.</strong><p>Depuis une fiche ou le catalogue, passe une aventure à « Retenu », « À jouer », « En cours » ou « Terminé ».</p></div>}
    {works.map((work) => {
      const progress = workProgress(work)
      const expanded = !work.campaign || expandedCampaignIds.has(work.id)
      return <section className={`component-work${work.campaign && !expanded ? ' is-collapsed' : ''}`} key={work.id}>
        <header>
          <div><small>{work.campaign ? 'CAMPAGNE' : 'SCÉNARIO'} · {lifecycleLabels[work.status]}</small><h3>{work.title}</h3>{work.description && <p>{work.description}</p>}</div>
          <div className="component-work-actions">
            {work.campaign && <button className="component-toggle" onClick={() => toggleCampaign(work.id)} aria-expanded={expanded}>{expanded ? 'Réduire' : `Développer · ${work.units.length} scénario${work.units.length > 1 ? 's' : ''}`}</button>}
            <button className="component-prompt" onClick={() => void copyPrompt(work)}>{work.campaign ? 'Prompt campagne' : 'Prompt'}</button>
            {work.campaign && <label className={`component-import${importing === work.id ? ' disabled' : ''}`}>Importer la campagne<input type="file" accept="application/json,.json" disabled={importing !== null} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; void importCampaign(work, file) }} /></label>}
            <span>{work.campaign && `${progress.completedScenarios}/${work.units.length} scénario${work.units.length > 1 ? 's' : ''} terminé${progress.completedScenarios > 1 ? 's' : ''} · `}{progress.played}/{progress.total} composant{progress.total > 1 ? 's' : ''} joué{progress.played > 1 ? 's' : ''}</span>
          </div>
        </header>
        {expanded && <div className="component-work-units">{work.units.map((unit) => {
          const status = resolvePlayableOverride(curation, unit).playableComponentStatus ?? {}
          const unitState = unitProgress(unit)
          return <article key={unit.id}>
            <div className="component-unit-head"><div><small>{unit.number ? `${unit.number} · ` : ''}{playableTypeLabel(unit.playableType)} · {lifecycleLabels[effectiveLifecycleStatus(resolvePlayableOverride(curation, unit))]}</small><strong>{titleOf(unit)}</strong><p>{unit.synopsis || 'Description propre de ce scénario non renseignée.'}</p><em className="component-progress">{unitState.played}/{unitState.total} composant{unitState.total > 1 ? 's' : ''} joué{unitState.played > 1 ? 's' : ''}{unitState.completed ? ' · Scénario terminé' : ''}</em></div>{!work.campaign && <div><label className={`component-import${importing === unit.id ? ' disabled' : ''}`}>Importer<input type="file" accept="application/json,.json" disabled={importing !== null} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; void importComponents(unit, file) }} /></label></div>}</div>
            {unit.playableComponents.length ? <ul>{unit.playableComponents.map((component) => {
              const componentKey = `${unit.id}:${component.id}`
              const detailsExpanded = expandedComponentKey === componentKey
              const continuityLabel = component.continuity.mode === 'free' ? 'Libre' : component.continuity.mode === 'soft_lock' ? 'Transition nécessaire' : 'Effet tunnel'
              return <li className="component-checklist-item" key={component.id}>
                <div className="component-checklist-row">
                  <input aria-label={`Marquer ${component.title} comme joué`} type="checkbox" checked={status[component.id] === 'played'} onChange={() => togglePlayed(unit, component.id)} />
                  <button className="component-details-button" type="button" onClick={() => setExpandedComponentKey(detailsExpanded ? null : componentKey)} aria-expanded={detailsExpanded}>
                    <strong>#{component.order} · {component.title}</strong>
                    <small>{component.estimatedSessions ? `${component.estimatedSessions.min}${component.estimatedSessions.min !== component.estimatedSessions.max ? `–${component.estimatedSessions.max}` : ''} séance${component.estimatedSessions.max > 1 ? 's' : ''} · ` : ''}{continuityLabel} · {status[component.id] === 'played' ? 'Joué' : 'À jouer'}</small>
                  </button>
                </div>
                {detailsExpanded && <div className="component-detail-panel">
                  <p>{component.description || 'Description non renseignée.'}</p>
                  <dl>
                    <div><dt>Statut</dt><dd>{status[component.id] === 'played' ? 'Joué' : 'À jouer'}</dd></div>
                    {component.estimatedSessions && <div><dt>Durée estimée</dt><dd>{component.estimatedSessions.min === component.estimatedSessions.max ? `${component.estimatedSessions.min} séance${component.estimatedSessions.min > 1 ? 's' : ''}` : `${component.estimatedSessions.min}–${component.estimatedSessions.max} séances`}</dd></div>}
                    <div><dt>Continuité</dt><dd>{continuityLabel}</dd></div>
                    <div><dt>Retour à la base</dt><dd>{component.continuity.returnToHubPossible ? 'Possible' : 'Non prévu'}</dd></div>
                    {component.continuity.recommendedSameParty && <div><dt>Groupe</dt><dd>Même groupe recommandé</dd></div>}
                    {component.continuity.notes && <div><dt>Note</dt><dd>{component.continuity.notes}</dd></div>}
                  </dl>
                </div>}
              </li>
            })}</ul> : <p className="missing">Aucun composant renseigné. {work.campaign ? 'Utilise « Prompt campagne » puis importe un seul JSON pour la campagne.' : 'Utilise « Prompt » puis importe le JSON produit.'}</p>}
          </article>
        })}</div>}
      </section>
    })}
    {message && <p className="playable-components-message">{message}</p>}
  </section>
}

function PlayableComponentsSection({ components }: { components: PlayableComponent[] }) {
  const continuityLabel = (mode: PlayableComponent['continuity']['mode']) => mode === 'free' ? 'Libre' : mode === 'soft_lock' ? 'Transition nécessaire' : 'Effet tunnel'
  if (!components.length) return <section className="detail-section playable-components"><h3>Composants jouables</h3><p className="missing">Découpage narratif non renseigné.</p></section>
  return <section className="detail-section playable-components"><h3>Composants jouables</h3><div className="playable-component-list">{components.map((component) => <article key={component.id}><header><span>#{component.order}</span><strong>{component.title}</strong><em>{continuityLabel(component.continuity.mode)}</em></header><p>{component.description}</p><footer>{component.estimatedSessions && <span>{component.estimatedSessions.min === component.estimatedSessions.max ? `${component.estimatedSessions.min} séance${component.estimatedSessions.min > 1 ? 's' : ''}` : `${component.estimatedSessions.min}–${component.estimatedSessions.max} séances`}</span>}<span>{component.continuity.returnToHubPossible ? 'Retour à Absalom possible' : 'Retour à Absalom non prévu'}</span>{component.continuity.recommendedSameParty && <span>Même groupe recommandé</span>}{component.continuity.notes && <small>{component.continuity.notes}</small>}</footer></article>)}</div></section>
}

function ScanPanel({ report, onClose, onApply }: { report: ScanReport; onClose: () => void; onApply: () => void }) {
  const changes = report.summary.added + report.summary.removed
  const relocated = report.summary.relocated ?? report.relocations?.length ?? 0
  const ignoredMetadata = report.summary.ignoredMetadata ?? report.ignoredMetadataFiles ?? 0
  const zips = report.summary.zips ?? report.resourceInventory?.totalOnDisk ?? 0
  const zipsAssociated = report.summary.zipsAssociated ?? report.resourceInventory?.bundles.filter((bundle) => bundle.associationStatus !== 'unassociated').length ?? 0
  const zipsToReview = report.summary.zipsToReview ?? report.resourceInventory?.bundles.filter((bundle) => bundle.associationStatus === 'review').length ?? 0
  const infoCount = report.summary.information ?? report.informationPdfs?.length ?? 0

  return <section className={`scan-report ${changes ? '' : 'empty'}`}>
    <div className="scan-report-head"><div><small>SCAN BIBLIOTHÈQUE</small><h2>{changes ? `${report.summary.added} ajout${report.summary.added > 1 ? 's' : ''} · ${report.summary.removed} absence${report.summary.removed > 1 ? 's' : ''}` : 'Bibliothèque synchronisée avec le catalogue connu'}</h2><p>{report.totalOnDisk} PDF · {zips} ZIP ressources · {infoCount} PDF « info ». {zipsAssociated}/{zips} ZIP associés{zipsToReview ? `, dont ${zipsToReview} à vérifier` : ''}.{relocated ? ` ${relocated} chemin${relocated > 1 ? 's' : ''} retrouvé${relocated > 1 ? 's' : ''} automatiquement.` : ''}{ignoredMetadata ? ` ${ignoredMetadata} fichier${ignoredMetadata > 1 ? 's' : ''} macOS ignoré${ignoredMetadata > 1 ? 's' : ''}.` : ''}</p></div><button onClick={onClose}>×</button></div>
    {(changes > 0 || (report.addedInformationPdfs?.length ?? 0) > 0 || zipsToReview > 0) && <div className="scan-report-groups">
      {(report.addedInformationPdfs?.length ?? 0) > 0 && <section><h3>Nouveaux PDF « info »</h3><ul>{report.addedInformationPdfs!.map((path) => <li key={path}><strong>{fileName(path)}</strong><span>Substitut documentaire à associer / vérifier.</span></li>)}</ul></section>}
      {report.newPdfs.length > 0 && <section><h3>Nouveaux PDF à classer</h3><ul>{report.newPdfs.map((path) => <li key={path}><strong>{fileName(path)}</strong><span>{path}</span></li>)}</ul></section>}
      {(report.relocations?.length ?? 0) > 0 && <section><h3>Chemins retrouvés automatiquement</h3><ul>{report.relocations?.map((item) => <li key={`${item.cataloguePath}->${item.diskPath}`}><strong>{fileName(item.diskPath)}</strong><span>{item.cataloguePath} → {item.diskPath}</span></li>)}</ul></section>}
      {report.removed.length > 0 && <section><h3>PDF réellement absents du dossier MJ</h3><ul>{report.removed.map((path) => <li key={path}><strong>{fileName(path)}</strong><span>{path}</span></li>)}</ul></section>}
      {zipsToReview > 0 && <section><h3>ZIP à vérifier</h3><ul>{report.resourceInventory?.bundles.filter((bundle) => bundle.associationStatus === 'review').map((bundle) => <li key={bundle.id}><strong>{bundle.filename}</strong><span>{bundle.targetId ? `Association probable : ${bundle.targetId}` : bundle.path}</span></li>)}</ul></section>}
    </div>}
    {(changes > 0 || relocated > 0 || zips > 0) && <div className="scan-apply"><button onClick={onApply}>Appliquer ce scan dans SQLite</button><span>Les associations incertaines restent marquées « à vérifier ».</span></div>}
  </section>
}

type DataTransferDomain = 'geography' | 'catalogue' | 'pnj' | 'factions' | 'lieux' | 'regions' | 'evenements' | 'curation'

const transferDomains: Array<{ id: DataTransferDomain; label: string; note: string }> = [
  { id: 'geography', label: 'Géographie complète', note: 'Lieux + régions + alias + hiérarchie.' },
  { id: 'catalogue', label: 'Catalogue', note: 'Campagnes, scénarios, composants et documents.' },
  { id: 'pnj', label: 'PNJ', note: 'Toutes les fiches PNJ.' },
  { id: 'factions', label: 'Factions', note: 'Toutes les factions.' },
  { id: 'evenements', label: 'Événements', note: 'Tous les événements.' },
  { id: 'lieux', label: 'Lieux seuls', note: 'Sous-ensemble de la géographie, utile pour une retouche ciblée.' },
  { id: 'regions', label: 'Régions seules', note: 'Sous-ensemble de la géographie, utile pour une retouche ciblée.' },
  { id: 'curation', label: 'Curation', note: 'Inclusions, exclusions et ajustements utilisateur.' },
]

function transferDiffText(result: Record<string, unknown>): string {
  const value = result.summary ?? result
  if (!value || typeof value !== 'object') return JSON.stringify(result, null, 2)
  const summary = value as Record<string, unknown>
  const lines: string[] = []
  Object.entries(summary).forEach(([key, raw]) => {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const item = raw as Record<string, unknown>
      const parts = ['current', 'next', 'added', 'updated', 'removed'].filter((field) => typeof item[field] === 'number').map((field) => `${field}: ${item[field]}`)
      lines.push(`${key}: ${parts.length ? parts.join(' · ') : JSON.stringify(raw)}`)
    } else lines.push(`${key}: ${String(raw)}`)
  })
  return lines.join('\n') || JSON.stringify(result, null, 2)
}

function Settings({ places, onOperation }: { places: string[]; onOperation: (operation: string, from?: string, to?: string) => void }) {
  const [draft, setDraft] = useState('')
  const [transferMessage, setTransferMessage] = useState('')
  const [transferBusy, setTransferBusy] = useState<DataTransferDomain | null>(null)

  const exportData = async (domain: DataTransferDomain) => {
    setTransferBusy(domain)
    setTransferMessage(`Export ${domain} depuis pf2.sqlite…`)
    try {
      const response = await fetch(`/apil7r/pf2-mj/data-export/${domain}`)
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.message || payload?.error || `Erreur HTTP ${response.status}`)
      const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json;charset=utf-8' })
      const href = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      anchor.href = href
      anchor.download = `pf2-${domain}-${date}.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(href)
      setTransferMessage(`Export ${domain} généré depuis pf2.sqlite.`)
    } catch (caught) {
      setTransferMessage(caught instanceof Error ? caught.message : 'Export impossible.')
    } finally {
      setTransferBusy(null)
    }
  }

  const importData = async (domain: DataTransferDomain, file?: File) => {
    if (!file) return
    setTransferBusy(domain)
    setTransferMessage(`Validation de ${file.name}…`)
    try {
      const payload = JSON.parse(await file.text())
      const dryResponse = await fetch(`/apil7r/pf2-mj/data-import/${domain}?dryRun=true`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const dry = await dryResponse.json().catch(() => null)
      if (!dryResponse.ok) throw new Error(dry?.message || dry?.error || `Erreur HTTP ${dryResponse.status}`)
      const diff = transferDiffText(dry ?? {})
      const warning = domain === 'catalogue' ? 'Un export catalogue ciblé est fusionné ; un export complet remplace le catalogue complet.' : domain === 'curation' ? 'La curation importée devient la nouvelle curation active.' : 'Un export complet de ce domaine devient le nouvel état du domaine : les éléments absents du fichier peuvent être supprimés.'
      if (!window.confirm(`Validation réussie pour ${domain}.\n\n${diff}\n\n${warning}\n\nAppliquer maintenant dans pf2.sqlite ?`)) { setTransferMessage('Import annulé après validation.'); return }
      const response = await fetch(`/apil7r/pf2-mj/data-import/${domain}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.message || result?.error || `Erreur HTTP ${response.status}`)
      setTransferMessage(`Import ${domain} appliqué dans pf2.sqlite. Rechargement…`)
      window.location.reload()
    } catch (caught) {
      setTransferMessage(caught instanceof Error ? caught.message : 'Import impossible.')
    } finally {
      setTransferBusy(null)
    }
  }

  return <section className="settings-view">
    <div className="settings-intro"><small>RÉFÉRENTIEL LOCAL</small><h2>Données & migration</h2><p>SQLite est la source de vérité. Les exports JSON sont des formats d’échange éditables : ils ne modifient la base qu’après réimport.</p></div>
    <div className="settings-card"><div className="add-place"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ajouter un lieu…" /><button onClick={() => { if (draft.trim()) { onOperation('place-add', undefined, draft.trim()); setDraft('') } }}>Ajouter</button></div><div className="place-cloud">{places.map((place) => <Badge key={place}>{place}</Badge>)}</div></div>
    <div className="settings-card migration-summary"><h3>Catalogue SQLite</h3><p>Le catalogue est chargé depuis <code>pf2.sqlite</code> puis normalisé à l’exécution en conteneurs, unités jouables, composants et documents. Les anciens JSON sont conservés uniquement comme archives de migration.</p><dl><div><dt>Conteneurs</dt><dd>{containers.length}</dd></div><div><dt>Unités jouables</dt><dd>{playableUnits.length}</dd></div><div><dt>Documents</dt><dd>{currentDocuments().length}</dd></div><div><dt>Points à revoir</dt><dd>{migrationIssues.length}</dd></div><div><dt>Inventaire ZIP</dt><dd>{resourceInventoryKnown ? 'actif' : 'en attente du scan'}</dd></div></dl></div>
    <div className="settings-card"><h3>Import / export JSON</h3><p>Chaque bouton exporte l’état actuel de <code>pf2.sqlite</code>. Tu peux modifier le JSON ou me l’envoyer, puis le réimporter. L’application montre toujours le diff en simulation avant de demander confirmation.</p><div className="data-transfer-grid">{transferDomains.map((domain) => <div className="data-transfer-domain" key={domain.id}><div><strong>{domain.label}</strong><span>{domain.note}</span></div><div className="data-transfer-actions"><button className="refresh" disabled={transferBusy !== null} onClick={() => void exportData(domain.id)}>{transferBusy === domain.id ? 'Traitement…' : 'Exporter'}</button><label className={transferBusy !== null ? 'disabled' : ''}>Importer<input type="file" disabled={transferBusy !== null} accept="application/json,.json" onChange={(event) => { const file=event.target.files?.[0]; event.target.value=''; void importData(domain.id, file) }} /></label></div></div>)}</div>{transferMessage && <p className="data-transfer-message">{transferMessage}</p>}</div>
  </section>
}

export function Pf2MjApp() {
  const location = useLocation()
  const navigate = useNavigate()
  const route = useMemo(() => resolvePf2Route(location.pathname), [location.pathname])
  const [scan, setScan] = useState<ScanReport | null>(null)
  const [scanStatus, setScanStatus] = useState('idle')
  const [error, setError] = useState('')
  const [curation, setCuration] = useState<Curation>({})
  const [resourceRevision, setResourceRevision] = useState(0)
  const [catalogueRevision, setCatalogueRevision] = useState(0)

  useEffect(() => {
    Promise.all([
      loadCatalogueFromApi(),
      loadGeographyFromApi(),
      fetch('/apil7r/pf2-mj/curation').then((response) => response.ok ? response.json() : Promise.reject()).then(setCuration),
    ]).then(() => setCatalogueRevision((value) => value + 1)).catch(() => setError('Impossible de charger les données PF2 depuis SQLite.'))
  }, [])

  useEffect(() => {
    if (!catalogueRevision) return
    fetch('/apil7r/pf2-mj/local-scan', { method: 'POST' })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((inventory: ScanReport) => {
        applyLocalScanInventory(inventory)
        setResourceRevision((value) => value + 1)
      })
      .catch(() => {
        // Un scan indisponible reste « inconnu » : on ne fabrique ni PDF ni ZIP manquants.
      })
  }, [catalogueRevision])

  const active = useMemo(() => playableUnits.filter((unit) => !isExcluded(unit, resolvePlayableOverride(curation, unit), curation)), [curation, catalogueRevision])
  const excludedContainerCount = useMemo(() => containers.filter((container) => explicitContainerExclusion(container, curation)).length, [curation, catalogueRevision])
  const explicitExcludedPlayableCount = useMemo(() => playableUnits.filter((unit) => explicitPlayableExclusion(unit, curation)).length, [curation, catalogueRevision])
  const placeOptions = useMemo(() => unique([...allPlaces, ...(curation.customPlaces ?? [])]), [curation, catalogueRevision])
  const upcoming = active.filter((unit) => isUpcoming(unit, curation))
  const missingTranslations = upcoming.filter((unit) => availabilityOf(unit).coverage === 'complete' && availabilityOf(unit).mode === 'en').length
  const missingZips = resourceInventoryKnown ? upcoming.filter((unit) => resourceBundleAvailability(unit).status === 'missing').length : null
  const documentCount = currentDocuments().length
  const journalCampaignCount = containers.filter((container) => container.containerType === 'campaign' && !isContainerExcluded(container, curation) && effectiveLifecycleStatus(resolveContainerOverride(curation, container)) !== 'untracked').length

  const update = async (id: string, field: string, value: unknown) => {
    setError('')
    try {
      const response = await fetch('/apil7r/pf2-mj/curation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetType: 'entry', id, field, value }) })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(typeof payload?.error === 'string' ? payload.error : 'Impossible d’enregistrer la modification.')
      const confirmed = await fetch('/apil7r/pf2-mj/curation', { cache: 'no-store' })
      setCuration(confirmed.ok ? await confirmed.json() : payload)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Impossible d’enregistrer la modification.')
    }
  }

  const placeOperation = async (operation: string, from?: string, to?: string) => {
    setError('')
    try {
      const response = await fetch('/apil7r/pf2-mj/curation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operation, from, to }) })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(typeof payload?.error === 'string' ? payload.error : 'Impossible d’enregistrer le lieu.')
      setCuration(payload)
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Impossible d’enregistrer le lieu.') }
  }

  const applyScan = async () => {
    setScanStatus('scanning')
    try {
      const response = await fetch('/apil7r/pf2-mj/local-scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apply: true }) })
      if (!response.ok) throw new Error('Synchronisation SQLite impossible.')
      const payload = await response.json() as ScanReport
      await loadCatalogueFromApi()
      applyLocalScanInventory(payload)
      setCatalogueRevision((value) => value + 1)
      setResourceRevision((value) => value + 1)
      setScan(payload)
      setScanStatus('done')
    } catch (caught) {
      setScanStatus('error')
      setError(caught instanceof Error ? caught.message : 'Synchronisation SQLite impossible.')
    }
  }

  const refresh = async () => {
    setScanStatus('scanning')
    try {
      const response = await fetch('/apil7r/pf2-mj/local-scan', { method: 'POST' })
      if (!response.ok) throw new Error()
      const payload = await response.json() as ScanReport
      applyLocalScanInventory(payload)
      setResourceRevision((value) => value + 1)
      setScan(payload)
      setScanStatus('done')
    } catch { setScanStatus('error') }
  }

  const reloadCatalogue = async () => {
    await loadCatalogueFromApi()
    setCatalogueRevision((value) => value + 1)
  }

  const headings: Record<View, [string, string]> = {
    find: ['Trouver une partie', 'Recherche opérationnelle : uniquement des unités jouables.'],
    library: ['Catalogue', 'Campagnes, saisons, séries et ressources structurent le catalogue sans polluer la recherche jouable.'],
    journal: ['Journal MJ', 'Ton journal de quête : ce que tu as retenu, prévu, commencé ou terminé.'],
    prepare: ['À faire pour jouer', 'Uniquement les actions utiles aux scénarios « À jouer » et « En cours ».'],
    maintenance: ['Maintenance du catalogue', 'Qualité des données, descriptions et associations à revoir sans polluer la préparation de partie.'],
    documents: ['Ressources PDF', 'Inventaire physique séparé des œuvres et de leur jouabilité.'],
    chronology: ['Chronologie', 'Unités jouables replacées dans le calendrier de Golarion.'],
    excluded: ['Mis de côté', '« Plus tard » et « Écarté » ont le même effet : ils sortent entièrement du catalogue actif, mais restent faciles à récupérer ici.'],
    settings: ['Paramètres', 'Référentiel local, curation et état de migration.'],
    pnj: ['PNJ', ''], factions: ['Factions', ''], lieux: ['Lieux', ''], regions: ['Régions', ''], evenements: ['Événements', ''],
  }

  const nav: Array<[View, string, string, number | string]> = [
    ['journal', '☑', 'Journal MJ', journalCampaignCount + active.filter((unit) => effectiveLifecycleStatus(resolvePlayableOverride(curation, unit)) !== 'untracked').length],
    ['find', '▶', 'Trouver une partie', active.length],
    ['prepare', '◒', 'À faire pour jouer', active.filter((unit) => isUpcoming(unit, curation) && preparationTabs.some(([tab]) => preparationMatch(unit, tab))).length],
    ['library', '▦', 'Catalogue', containers.length],
    ['documents', '⌁', 'Ressources PDF', documentCount],
    ['chronology', '◷', 'Chronologie', ''],
    ['excluded', '×', 'Mis de côté', excludedContainerCount + explicitExcludedPlayableCount],
    ['maintenance', '⌁', 'Maintenance', active.filter((unit) => maintenanceTabs.some(([tab]) => maintenanceMatch(unit, tab))).length],
    ['pnj', '♙', 'PNJ', ''], ['factions', '⚑', 'Factions', ''], ['lieux', '⌂', 'Lieux', ''], ['regions', '◉', 'Régions', ''], ['evenements', '◇', 'Événements', ''], ['settings', '⚙', 'Paramètres', ''],
  ]

  if (route.kind === 'redirect') return <Navigate to={route.to ?? viewPaths.journal} replace />

  const routedView: View = route.kind === 'view' ? route.view
    : route.kind === 'reference' ? route.view
      : route.kind === 'playable' || route.kind === 'container' ? 'library'
        : 'find'
  const isReferenceView = ['pnj', 'factions', 'lieux', 'regions', 'evenements'].includes(routedView)
  const selectedPlayable = route.kind === 'playable' ? playableMap.get(route.id) ?? null : null
  const selectedContainer = route.kind === 'container' ? containerMap.get(route.id) ?? null : null
  const openPlayable = (unit: PlayableUnit) => navigate(playableHref(unit))
  const openContainer = (container: Container) => navigate(containerHref(container))
  const openReference = (referenceView: ReferenceView, id: string) => navigate(referenceHref(referenceView, id))

  const routeMissing = (kind: string, id?: string) => <section className="route-not-found"><small>LIEN DIRECT</small><h2>{kind} introuvable</h2><p>{catalogueRevision ? `Aucune entrée ne correspond à « ${id ?? ''} » dans le catalogue SQLite courant.` : 'Chargement du catalogue SQLite…'}</p><Link to={viewPaths.library}>Retour au catalogue</Link></section>

  return <main className="pf2-mj pf2-mj-v3">
    <header><Link className="brand brand-button" to={viewPaths.find}><b>✦</b><span><strong>PATHFINDER 2</strong><small>GESTION MJ · JOURNAL</small></span></Link><div className="header-right"><span><i />Prochaines parties · {missingTranslations} trad. manquante{missingTranslations > 1 ? 's' : ''} · {missingZips === null ? 'ZIP à inventorier' : `${missingZips} ZIP manquant${missingZips > 1 ? 's' : ''}`} · {documentCount} PDF</span><em>MJ</em></div></header>
    <div className="layout"><aside><nav>{nav.map(([id, icon, label, count]) => <NavLink key={id} to={viewPaths[id]} className={() => routedView === id ? 'active' : ''}><span>{icon}</span>{label}<b>{count}</b></NavLink>)}</nav><section><p>REPÈRES MJ</p><span className="aside-rule">☑ Journal = ce que tu suis</span><span className="aside-rule">◒ Préparation = prochaines parties</span><span className="aside-rule">▣ Campagne = conteneur</span><span className="aside-rule">◇ Maintenance = qualité catalogue</span></section><div className="scan-note"><b>V3</b><strong>SQLite comme source</strong><p>Le catalogue est chargé depuis SQLite puis normalisé sans perte pour l’interface V3.</p></div></aside>
      <section className="content">
        {route.kind === 'not-found' ? routeMissing('Page') : null}
        {route.kind === 'playable' ? (selectedPlayable ? <PlayableDetail unit={selectedPlayable} curation={curation} onUpdate={update} placeOptions={placeOptions} onOpenReference={openReference} /> : routeMissing('Scénario', route.id)) : null}
        {route.kind === 'container' ? (selectedContainer ? <ContainerDetail container={selectedContainer} curation={curation} onOpenPlayable={openPlayable} onUpdate={update} onOpenReference={openReference} /> : routeMissing('Campagne / collection', route.id)) : null}
        {(route.kind === 'view' || route.kind === 'reference') && <>
          {!isReferenceView && <><div className="page-title"><div><small>TABLE OUVERTE · GOLARION PERSISTANT</small><h1>{headings[routedView][0]}</h1><p>{headings[routedView][1]}</p></div><button className="refresh" onClick={refresh}>{scanStatus === 'scanning' ? '↻ Détection…' : scanStatus === 'done' ? '✓ Rapport prêt' : scanStatus === 'error' ? '! Réessayer' : '↻ Scanner PDF & ZIP'}</button></div>{error && <div className="notice"><strong>Attention</strong><p>{error}</p></div>}{scan && <ScanPanel report={scan} onClose={() => setScan(null)} onApply={applyScan} />}{!['excluded', 'settings', 'documents', 'journal', 'prepare', 'maintenance'].includes(routedView) && <Stats active={active} />}{routedView === 'find' && <FinderView active={active} curation={curation} onOpen={openPlayable} onUpdate={update} resourceVersion={resourceRevision} />}{routedView === 'library' && <LibraryView curation={curation} onOpen={openContainer} onOpenPlayable={openPlayable} onUpdate={update} />}{routedView === 'journal' && <JournalView curation={curation} onUpdate={update} onImported={reloadCatalogue} />}{routedView === 'prepare' && <PreparationView active={active} curation={curation} onOpen={openPlayable} onUpdate={update} resourceVersion={resourceRevision} />}{routedView === 'maintenance' && <MaintenanceView active={active} curation={curation} onOpen={openPlayable} onUpdate={update} resourceVersion={resourceRevision} />}{routedView === 'documents' && <DocumentsView resourceVersion={resourceRevision} />}{routedView === 'chronology' && <ChronologyView units={active} onOpen={openPlayable} />}{routedView === 'excluded' && <ExcludedView curation={curation} onOpenContainer={openContainer} onOpenPlayable={openPlayable} onUpdate={update} />}{routedView === 'settings' && <Settings places={placeOptions} onOperation={placeOperation} />}</>}
          {routedView === 'pnj' && <PnjPage initialSelectedId={route.kind === 'reference' && route.view === 'pnj' ? route.id : undefined} />}
          {routedView === 'factions' && <FactionsPage initialSelectedId={route.kind === 'reference' && route.view === 'factions' ? route.id : undefined} />}
          {routedView === 'lieux' && <LieuxPage initialSelectedId={route.kind === 'reference' && route.view === 'lieux' ? route.id : undefined} />}
          {routedView === 'regions' && <RegionsPage initialSelectedId={route.kind === 'reference' && route.view === 'regions' ? route.id : undefined} />}
          {routedView === 'evenements' && <EvenementsPage initialSelectedId={route.kind === 'reference' && route.view === 'evenements' ? route.id : undefined} />}
        </>}
      </section>
    </div>
  </main>
}
