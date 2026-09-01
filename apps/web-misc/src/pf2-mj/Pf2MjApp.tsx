'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  allPlaces,
  applyLocalScanInventory,
  ancestorContainers,
  arcMap,
  arcs,
  availabilityLabel,
  availabilityOf,
  componentTypeLabel,
  componentsOf,
  containerMap,
  containerTypeLabel,
  containers,
  currentDocuments,
  documentPresence,
  documentsForTarget,
  frenchStateLabel,
  levelLabel,
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
  type PlayableUnit,
  type Progress,
  type ResourceBundleInventory,
} from './catalogue'
import PnjPage from './Pnj'
import FactionsPage from './Factions'
import LieuxPage from './Lieux'
import RegionsPage from './Regions'
import EvenementsPage from './Evenements'

type View = 'find' | 'library' | 'prepare' | 'documents' | 'chronology' | 'excluded' | 'settings' | 'pnj' | 'factions' | 'lieux' | 'regions' | 'evenements'
type PreparationTab = 'pdf' | 'translation' | 'zip' | 'info' | 'uncertain' | 'metadata'
type SelectedEntity = PlayableUnit | Container

type StructuredLocationOverride = {
  mode: 'replace' | 'merge'
  values?: string[]
  add?: string[]
  remove?: string[]
}

type EntryOverride = {
  excluded?: boolean
  inclusion?: 'default' | 'excluded' | 'reinstated'
  playability?: Playability
  progress?: Progress
  levelsOverride?: string
  placesOverride?: string[]
  relevance?: string
  locations?: StructuredLocationOverride
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
  progress: string
  type: string
  yearFrom: string
  yearTo: string
  arc: string
  thread: string
  bundle: string
}

const emptyFilters: Filters = {
  query: '', level: '', place: '', french: '', availability: '', relevance: '', playability: '', progress: '', type: '', yearFrom: '', yearTo: '', arc: '', thread: '', bundle: '',
}

const playabilityOptions: Playability[] = ['Prêt', 'À adapter', 'Simple inspiration']
const progressOptions: Progress[] = ['Non spécifié', 'À jouer', 'En cours', 'Joué']
const relevanceOrder: Record<string, number> = { 'Très haute': 0, Haute: 1, Moyenne: 2, Basse: 3, Aucune: 4, Variable: 5, 'À évaluer': 6 }
const preparationTabs: Array<[PreparationTab, string]> = [
  ['pdf', 'PDF requis'], ['translation', 'Traductions'], ['zip', 'ZIP Foundry'], ['info', 'Info seules'], ['uncertain', 'À vérifier'], ['metadata', 'Métadonnées'],
]

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

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const fn = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal modal-v3"><button className="modal-close" onClick={onClose}>×</button>{children}</section></div>
}

function genericOverride(curation: Curation, id: string): EntryOverride {
  return curation.byId?.[id] ?? curation.entries?.[id] ?? {}
}

function legacyOverride(curation: Curation, id: string, scenario: boolean): EntryOverride {
  const generic = genericOverride(curation, id)
  const excludedCampaignIds = curation.excludedCampaignIds ?? []
  const includedCampaignIds = curation.includedCampaignIds ?? []
  const excludedScenarioIds = curation.excludedScenarioIds ?? []
  const excludedLegacy = scenario ? excludedScenarioIds.includes(id) : excludedCampaignIds.includes(id)
  const reinstatedLegacy = !scenario && includedCampaignIds.includes(id)
  return {
    ...generic,
    excluded: generic.excluded ?? (generic.inclusion === 'excluded' ? true : generic.inclusion === 'reinstated' ? false : reinstatedLegacy ? false : excludedLegacy),
    playability: generic.playability ?? (scenario ? curation.playabilityByScenario?.[id] : curation.playabilityByCampaign?.[id]),
    progress: generic.progress ?? (scenario ? curation.progressByScenario?.[id] : curation.progressByCampaign?.[id]),
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
function effectiveProgress(unit: PlayableUnit, override: ResolvedOverride): Progress { return override.progress ?? unit.tracking }
function effectiveRelevance(unit: PlayableUnit, override: ResolvedOverride): string { return override.relevance ?? relevanceOf(unit) }
function isExcluded(unit: PlayableUnit, override: ResolvedOverride): boolean { return Boolean(override.excluded) || unit.playableType === 'legacy' || unit.editorialStatus === 'ÉCARTÉ' }

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
  const progress = effectiveProgress(unit, override)
  const year = yearOf(unit)
  const parentNames = ancestorContainers(unit).map(titleOf)
  const haystack = [titleOf(unit), unit.titles.original ?? '', unit.synopsis ?? '', unit.contextSynopsis ?? '', unit.narrativeThread ?? '', ...locations.map((location) => location.id), ...unit.arcIds.map((id) => arcMap.get(id)?.titleFr ?? id), ...parentNames].join(' ').toLowerCase()

  if (filters.query && !haystack.includes(filters.query.toLowerCase())) return false
  if (filters.level && !supportsLevel(levels, Number(filters.level))) return false
  if (filters.place && !locations.some((location) => location.id === filters.place)) return false
  if (filters.type && unit.playableType !== filters.type) return false
  if (filters.relevance && relevance !== filters.relevance) return false
  if (filters.playability && playability !== filters.playability) return false
  if (filters.progress && progress !== filters.progress) return false
  if (filters.availability && availability.coreMaterial !== filters.availability) return false
  if (filters.bundle && bundle.status !== filters.bundle) return false
  if (filters.arc && !unit.arcIds.includes(filters.arc)) return false
  if (filters.thread && unit.narrativeThread !== filters.thread) return false
  if (filters.yearFrom && (year === null || year < Number(filters.yearFrom))) return false
  if (filters.yearTo && (year === null || year > Number(filters.yearTo))) return false

  if (filters.french === 'ready' && !availability.readyInFrench) return false
  if (filters.french === 'official' && availability.frenchState !== 'official') return false
  if (filters.french === 'translated' && !['translated', 'mixed'].includes(availability.frenchState)) return false
  if (filters.french === 'partial' && availability.frenchState !== 'partial') return false
  if (filters.french === 'none' && availability.frenchState !== 'none') return false

  return true
}

function FilterBar({ filters, setFilters, units, showBundle = false }: { filters: Filters; setFilters: (filters: Filters) => void; units: PlayableUnit[]; showBundle?: boolean }) {
  const places = useMemo(() => unique([...allPlaces, ...units.flatMap((unit) => unit.locations.map((location) => location.id))]), [units])
  const relevances = useMemo(() => unique(units.map((unit) => relevanceOf(unit))), [units])
  const types = useMemo(() => unique(units.map((unit) => unit.playableType)), [units])
  const threads = useMemo(() => unique(units.map((unit) => unit.narrativeThread ?? '')), [units])
  const update = (field: keyof Filters, value: string) => setFilters({ ...filters, [field]: value })
  const activeCount = Object.values(filters).filter(Boolean).length

  return <div className="finder-tools">
    <label className="search finder-search">⌕<input value={filters.query} onChange={(event) => update('query', event.target.value)} placeholder="Titre, campagne, lieu, arc, fil narratif…" /></label>
    <select value={filters.level} onChange={(event) => update('level', event.target.value)}><option value="">Tous niveaux</option>{Array.from({ length: 20 }, (_, index) => <option key={index + 1}>{index + 1}</option>)}</select>
    <select value={filters.place} onChange={(event) => update('place', event.target.value)}><option value="">Tous lieux</option>{places.map((place) => <option key={place}>{place}</option>)}</select>
    <select value={filters.french} onChange={(event) => update('french', event.target.value)}><option value="">Toutes langues</option><option value="ready">Prêt en français</option><option value="official">FR officiel</option><option value="translated">Traduit FR</option><option value="partial">FR partiel</option><option value="none">Pas de FR</option></select>
    <select value={filters.availability} onChange={(event) => update('availability', event.target.value)}><option value="">Toute disponibilité</option><option value="complete">Complet</option><option value="informationOnly">Info seule</option><option value="partial">Partiel</option><option value="absent">Absent</option><option value="uncertain">Incertain</option></select>
    <select value={filters.relevance} onChange={(event) => update('relevance', event.target.value)}><option value="">Toute pertinence</option>{relevances.map((value) => <option key={value}>{value}</option>)}</select>
    <select value={filters.playability} onChange={(event) => update('playability', event.target.value)}><option value="">Toute jouabilité</option>{playabilityOptions.map((value) => <option key={value}>{value}</option>)}</select>
    <select value={filters.progress} onChange={(event) => update('progress', event.target.value)}><option value="">Tous suivis</option>{progressOptions.map((value) => <option key={value}>{value}</option>)}</select>
    <select value={filters.type} onChange={(event) => update('type', event.target.value)}><option value="">Tous types</option>{types.map((value) => <option key={value} value={value}>{playableTypeLabel(value as PlayableUnit['playableType'])}</option>)}</select>
    <select value={filters.arc} onChange={(event) => update('arc', event.target.value)}><option value="">Tous arcs</option>{arcs.map((arc) => <option key={arc.id} value={arc.id}>{arc.titleFr}</option>)}</select>
    <select value={filters.thread} onChange={(event) => update('thread', event.target.value)}><option value="">Tous fils narratifs</option>{threads.map((value) => <option key={value}>{value}</option>)}</select>
    {showBundle && <select value={filters.bundle} onChange={(event) => update('bundle', event.target.value)}><option value="">Tous ZIP</option><option value="present">ZIP disponible</option><option value="missing">ZIP manquant</option><option value="uncertain">ZIP à vérifier</option><option value="unknown">ZIP non inventorié</option></select>}
    <label className="year-filter"><small>AR de</small><input type="number" value={filters.yearFrom} onChange={(event) => update('yearFrom', event.target.value)} placeholder="4700" /></label>
    <label className="year-filter"><small>à</small><input type="number" value={filters.yearTo} onChange={(event) => update('yearTo', event.target.value)} placeholder="4730" /></label>
    {activeCount > 0 && <button className="filter-reset" onClick={() => setFilters(emptyFilters)}>Effacer {activeCount} filtre{activeCount > 1 ? 's' : ''}</button>}
  </div>
}

function AvailabilityBadges({ unit }: { unit: PlayableUnit }) {
  const availability = availabilityOf(unit)
  const bundle = resourceBundleAvailability(unit)
  return <div className="availability-badges">
    <Badge>{availabilityLabel(availability.coreMaterial)}</Badge>
    <Badge>{frenchStateLabel(availability.frenchState)}</Badge>
    <Badge>{resourceBundleLabel(bundle)}</Badge>
  </div>
}

function PlayableRow({ unit, curation, onOpen, onUpdate }: { unit: PlayableUnit; curation: Curation; onOpen: (unit: PlayableUnit) => void; onUpdate: (id: string, field: string, value: unknown) => void }) {
  const override = resolvePlayableOverride(curation, unit)
  const levels = effectiveLevels(unit, override)
  const locations = effectiveLocations(unit, override)
  const playability = effectivePlayability(unit, override)
  const progress = effectiveProgress(unit, override)
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
      <div><small>Lieux</small><strong>{locations.length ? unique(locations.map((location) => location.id)).join(', ') : 'À documenter'}</strong>{locations[0] && <SourceBadge source={locations[0].source} />}</div>
      <div><small>Pertinence</small><strong className={`relevance r-${tone(relevance)}`}>{relevance}</strong></div>
      <label><small>Jouabilité</small><select value={playability} onChange={(event) => onUpdate(unit.id, 'playability', event.target.value)}>{playabilityOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label><small>Suivi</small><select value={progress} onChange={(event) => onUpdate(unit.id, 'progress', event.target.value)}>{progressOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
    </div>
    <div className="entry-actions"><button onClick={() => onOpen(unit)}>Détails →</button></div>
  </article>
}

function PlayableList({ units, curation, onOpen, onUpdate, empty = 'Aucune unité jouable.' }: { units: PlayableUnit[]; curation: Curation; onOpen: (unit: PlayableUnit) => void; onUpdate: (id: string, field: string, value: unknown) => void; empty?: string }) {
  return <div className="entry-list">{units.length ? units.map((unit) => <PlayableRow key={unit.id} unit={unit} curation={curation} onOpen={onOpen} onUpdate={onUpdate} />) : <p className="empty-state">{empty}</p>}</div>
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
  const childContainers = containers.filter((item) => item.parentId === container.id).sort((a, b) => a.order - b.order || titleOf(a).localeCompare(titleOf(b), 'fr'))
  const childPlayables = playableUnits.filter((unit) => unit.parentId === container.id)
  const components = componentsOf(container.id)
  const descendantCount = playablesUnder(container.id).length
  return <details className={`library-node library-depth-${Math.min(depth, 3)}`} open={depth === 0 && container.containerType === 'campaign'}>
    <summary><span className="library-icon">{container.containerType === 'campaign' ? '▣' : container.containerType === 'pfsSeason' ? '▤' : '⌁'}</span><div><small>{containerTypeLabel(container.containerType)}</small><strong>{titleOf(container)}</strong><em>{descendantCount} unité{descendantCount > 1 ? 's' : ''} jouable{descendantCount > 1 ? 's' : ''}{components.length ? ` · ${components.length} ressource${components.length > 1 ? 's' : ''}` : ''}</em></div><button type="button" onClick={(event) => { event.preventDefault(); onOpen(container) }}>Détails</button></summary>
    <div className="library-children">
      {childContainers.map((child) => <ContainerTree key={child.id} container={child} curation={curation} onOpen={onOpen} onOpenPlayable={onOpenPlayable} onUpdate={onUpdate} depth={depth + 1} />)}
      {childPlayables.length > 0 && <PlayableList units={sortPlayables(childPlayables, curation)} curation={curation} onOpen={onOpenPlayable} onUpdate={onUpdate} />}
      {components.length > 0 && <div className="component-strip">{components.map((component) => <span key={component.id}><b>◇</b>{componentTypeLabel(component.componentType)} · {titleOf(component)}{component.requiredForCore && <em> requis</em>}</span>)}</div>}
    </div>
  </details>
}

function LibraryView({ curation, onOpen, onOpenPlayable, onUpdate }: { curation: Curation; onOpen: (container: Container) => void; onOpenPlayable: (unit: PlayableUnit) => void; onUpdate: (id: string, field: string, value: unknown) => void }) {
  return <div className="library-view">{sections.filter((section) => section.id !== 'legacy').map((section) => {
    const roots = containers.filter((container) => container.sectionId === section.id && !container.parentId)
    const directPlayables = playableUnits.filter((unit) => unit.sectionId === section.id && !unit.parentId)
    return <section className="library-section" key={section.id}><div className="section-title"><div><small>SECTION</small><h2>{section.title}</h2><p>{section.description}</p></div><span>{playableUnits.filter((unit) => unit.sectionId === section.id).length}</span></div>{roots.map((container) => <ContainerTree key={container.id} container={container} curation={curation} onOpen={onOpen} onOpenPlayable={onOpenPlayable} onUpdate={onUpdate} />)}{directPlayables.length > 0 && <PlayableList units={sortPlayables(directPlayables, curation)} curation={curation} onOpen={onOpenPlayable} onUpdate={onUpdate} />}</section>
  })}</div>
}

function preparationMatch(unit: PlayableUnit, tab: PreparationTab): boolean {
  const availability = availabilityOf(unit)
  const bundle = resourceBundleAvailability(unit)
  if (tab === 'pdf') return ['absent', 'partial'].includes(availability.coreMaterial)
  if (tab === 'translation') return availability.original === 'complete' && !availability.readyInFrench
  if (tab === 'zip') return bundle.status === 'missing' && ['complete', 'informationOnly'].includes(availability.coreMaterial)
  if (tab === 'info') return availability.coreMaterial === 'informationOnly' || documentsForTarget(unit.id).some((document) => document.isInformationFallback)
  if (tab === 'uncertain') return availability.coreMaterial === 'uncertain' || bundle.status === 'uncertain' || documentsForTarget(unit.id).some((document) => document.association.status === 'review')
  return unit.migration.status === 'needsReview'
}

function PreparationView({ active, curation, onOpen, onUpdate, resourceVersion }: { active: PlayableUnit[]; curation: Curation; onOpen: (unit: PlayableUnit) => void; onUpdate: (id: string, field: string, value: unknown) => void; resourceVersion: number }) {
  const [tab, setTab] = useState<PreparationTab>('pdf')
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const base = useMemo(() => active.filter((unit) => preparationMatch(unit, tab)), [active, tab, resourceVersion])
  const found = useMemo(() => sortPlayables(base.filter((unit) => matchesFilters(unit, filters, curation)), curation), [base, curation, filters, resourceVersion])
  return <div className="prepare-view">
    <div className="prepare-tabs">{preparationTabs.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setFilters(emptyFilters) }}>{label}<b>{active.filter((unit) => preparationMatch(unit, id)).length}</b></button>)}</div>
    {tab === 'zip' && !resourceInventoryKnown && <div className="notice"><strong>Inventaire ZIP en attente</strong><p>Le backend n’a pas encore répondu. Tant que le scan n’est pas disponible, aucun contenu n’est déclaré à tort comme « ZIP manquant ».</p></div>}
    {tab === 'info' && <div className="notice info-notice"><strong>« Info seule » est un état distinct</strong><p>Un PDF nommé avec « (info) » est traité comme substitut documentaire : il n’est ni considéré comme le scénario complet, ni comme une absence totale.</p></div>}
    <FilterBar filters={filters} setFilters={setFilters} units={base} showBundle={tab === 'zip'} />
    <div className="section-title"><h2>{preparationTabs.find(([id]) => id === tab)?.[1]}</h2><span>{found.length}</span></div>
    <PlayableList units={found} curation={curation} onOpen={onOpen} onUpdate={onUpdate} empty="Rien à traiter dans cette catégorie." />
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
  return <article className={`document-row association-${document.association.status} presence-${presence}`}><div><small>{document.role === 'information' ? 'ⓘ INFO DE REMPLACEMENT' : document.role.toUpperCase()}</small><a href={document.href} target="_blank" rel="noreferrer">{document.filename}</a><span>{document.pages ? `${document.pages} pages · ` : ''}{document.language} · {document.rawVariant}</span></div><div><small>Association</small><strong>{target ? titleOf(target) : document.targetId || 'Non associée'}</strong><em>{document.association.status === 'confirmed' ? 'confirmée' : document.association.status === 'review' ? 'à vérifier' : 'non associée'} · {presence === 'present' ? 'présent' : presence === 'missing' ? 'absent du disque' : 'non scanné'}</em></div></article>
}

function ChronologyView({ units, onOpen }: { units: PlayableUnit[]; onOpen: (unit: PlayableUnit) => void }) {
  const eligible = units.filter((unit) => yearOf(unit) !== null)
  const years = unique(eligible.map((unit) => String(yearOf(unit)))).map(Number).sort((a, b) => a - b)
  return <div className="year-timeline">{years.map((year) => <section key={year}><div className="year-marker"><strong>{year}</strong><span>AR</span></div><div className="year-works">{eligible.filter((unit) => yearOf(unit) === year).map((unit) => <button key={unit.id} onClick={() => onOpen(unit)}><small>{playableTypeLabel(unit.playableType)}</small><strong>{titleOf(unit)}</strong><em>{unit.narrativeThread}</em></button>)}</div></section>)}</div>
}

function Stats({ active }: { active: PlayableUnit[] }) {
  const complete = active.filter((unit) => availabilityOf(unit).coreMaterial === 'complete').length
  const infoOnly = active.filter((unit) => availabilityOf(unit).coreMaterial === 'informationOnly').length
  const readyFr = active.filter((unit) => availabilityOf(unit).readyInFrench).length
  const zipMissing = resourceInventoryKnown ? active.filter((unit) => resourceBundleAvailability(unit).status === 'missing').length : null
  const review = active.filter((unit) => unit.migration.status === 'needsReview').length
  return <section className="stats stats-v3"><div><b>▶</b><p><strong>{active.length}</strong><small>UNITÉS JOUABLES</small></p></div><div><b>✓</b><p><strong>{complete}</strong><small>PDF COMPLETS</small></p></div><div><b>文</b><p><strong>{readyFr}</strong><small>PRÊTES EN FR</small></p></div><div><b>ⓘ</b><p><strong>{infoOnly}</strong><small>INFO SEULES</small></p></div><div><b>▣</b><p><strong>{zipMissing ?? '—'}</strong><small>ZIP MANQUANTS</small></p></div><div><b>!</b><p><strong>{review}</strong><small>MÉTADONNÉES À VOIR</small></p></div></section>
}

function PlayableDetail({ unit, curation, onClose, onUpdate, placeOptions }: { unit: PlayableUnit; curation: Curation; onClose: () => void; onUpdate: (id: string, field: string, value: unknown) => void; placeOptions: string[] }) {
  const override = resolvePlayableOverride(curation, unit)
  const levels = effectiveLevels(unit, override)
  const locations = effectiveLocations(unit, override)
  const availability = availabilityOf(unit)
  const bundle = resourceBundleAvailability(unit)
  const [levelsDraft, setLevelsDraft] = useState(levelLabel(levels) === 'À documenter' ? '' : levelLabel(levels))
  const [placesDraft, setPlacesDraft] = useState(unique(locations.map((location) => location.id)).join(', '))
  const components = componentsOf(unit.id)
  const targetIds = [unit.id, ...components.map((component) => component.id)]
  const unitDocuments = currentDocuments().filter((document) => document.targetId && targetIds.includes(document.targetId))
  const ancestors = ancestorContainers(unit)

  return <Modal onClose={onClose}>
    <div className="detail-head"><small>{playableTypeLabel(unit.playableType)}{ancestors[0] ? ` · ${ancestors.map(titleOf).join(' · ')}` : ''}</small><h2>{unit.number && `${unit.number} · `}{titleOf(unit)}</h2>{originalTitleOf(unit) && <em>{originalTitleOf(unit)}</em>}<AvailabilityBadges unit={unit} /></div>
    <div className="availability-grid"><div><small>Original</small><strong>{availabilityLabel(availability.original)}</strong></div><div><small>FR officiel</small><strong>{availabilityLabel(availability.officialFr)}</strong></div><div><small>Traduction</small><strong>{availabilityLabel(availability.translation)}</strong></div><div><small>Documents requis</small><strong>{availability.requiredDocuments.present}/{availability.requiredDocuments.required}</strong>{availability.requiredDocuments.informationOnly > 0 && <em> + {availability.requiredDocuments.informationOnly} info</em>}</div><div><small>ZIP Foundry</small><strong>{resourceBundleLabel(bundle)}</strong>{bundle.inheritedFromId && <em>hérité de {titleOf(containerMap.get(bundle.inheritedFromId)!)}</em>}</div></div>
    <dl className="detail-grid"><div><dt>Niveaux</dt><dd><input value={levelsDraft} onChange={(event) => setLevelsDraft(event.target.value)} /><button onClick={() => onUpdate(unit.id, 'levelsOverride', levelsDraft)}>Enregistrer</button><SourceBadge source={levels.source} /></dd></div><div><dt>Lieux</dt><dd><input list="all-places" value={placesDraft} onChange={(event) => setPlacesDraft(event.target.value)} /><datalist id="all-places">{placeOptions.map((place) => <option key={place}>{place}</option>)}</datalist><button onClick={() => onUpdate(unit.id, 'placesOverride', placesDraft.split(',').map((value) => value.trim()).filter(Boolean))}>Remplacer</button>{locations.map((location) => <span className="location-provenance" key={`${location.id}-${location.source.kind}`}>{location.id}<SourceBadge source={location.source} /></span>)}</dd></div><div><dt>Chronologie</dt><dd>{yearOf(unit) ? `${unit.chronology.estimated ? '≈ ' : ''}${yearOf(unit)} AR` : unit.chronology.period || 'À documenter'}</dd></div><div><dt>Fil narratif</dt><dd>{unit.narrativeThread || '—'}</dd></div></dl>
    {unit.arcIds.length > 0 && <section className="detail-section"><h3>Arcs PFS / transversaux</h3><div className="badges">{unit.arcIds.map((id) => <Badge key={id}>{arcMap.get(id)?.titleFr || id}</Badge>)}</div></section>}
    <section className="detail-section synopsis-long"><h3>Synopsis de l’unité</h3><p>{unit.synopsis || 'À documenter.'}</p>{!unit.synopsis && unit.contextSynopsis && <div className="inherited-context"><small>CONTEXTE HÉRITÉ DE LA CAMPAGNE</small><p>{unit.contextSynopsis}</p></div>}</section>
    {unit.gmDetails && <section className="detail-section gm-details"><h3>Détails MJ</h3><p>{unit.gmDetails}</p></section>}
    {unit.migration.issues.length > 0 && <section className="detail-section migration-warning"><h3>À revoir après migration</h3><ul>{unit.migration.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></section>}
    {components.length > 0 && <section className="detail-section"><h3>Composants de l’œuvre</h3><div className="part-list">{components.map((component) => <article key={component.id}><strong>{componentTypeLabel(component.componentType)} · {titleOf(component)}</strong><span>{component.notes}</span><Badge>{component.requiredForCore ? 'Requis' : 'Facultatif'}</Badge></article>)}</div></section>}
    <section className="detail-section"><h3>Documents</h3><div className="pdfs">{unitDocuments.length ? unitDocuments.map((document) => <a className={document.isInformationFallback ? 'info-document' : ''} key={document.id} href={document.href} target="_blank" rel="noreferrer">{document.isInformationFallback ? 'ⓘ' : '📖'} {document.filename} · {document.rawVariant}</a>) : <span className="missing">× Aucun document associé</span>}</div></section>
    <button className={`curation-button ${isExcluded(unit, override) ? 'restore' : 'exclude'}`} onClick={() => onUpdate(unit.id, 'excluded', !isExcluded(unit, override))}>{isExcluded(unit, override) ? '↩ Réintégrer' : '× Écarter cette unité'}</button>
  </Modal>
}

function ContainerDetail({ container, curation, onClose, onOpenPlayable, onUpdate }: { container: Container; curation: Curation; onClose: () => void; onOpenPlayable: (unit: PlayableUnit) => void; onUpdate: (id: string, field: string, value: unknown) => void }) {
  const children = playablesUnder(container.id)
  const components = componentsOf(container.id)
  const override = resolveContainerOverride(curation, container)
  return <Modal onClose={onClose}>
    <div className="detail-head"><small>{containerTypeLabel(container.containerType)} · CONTENEUR NON JOUABLE</small><h2>{titleOf(container)}</h2>{originalTitleOf(container) && <em>{originalTitleOf(container)}</em>}<div className="badges"><Badge>{levelLabel(container.levels)}</Badge><Badge>{children.length} unités jouables</Badge><Badge>{container.migration.status === 'ready' ? 'Structure prête' : 'À revoir'}</Badge></div></div>
    <section className="detail-section synopsis-long"><h3>Synthèse</h3><p>{container.synopsis || 'Synopsis de collection non renseigné.'}</p></section>
    <dl className="detail-grid"><div><dt>Niveaux affichés</dt><dd>{levelLabel(container.levels)}<SourceBadge source={container.levels.source} /></dd></div><div><dt>Lieux</dt><dd>{container.locations.length ? unique(container.locations.map((location) => location.id)).join(', ') : 'Agrégés depuis les enfants / à documenter'}{container.locations[0] && <SourceBadge source={container.locations[0].source} />}</dd></div></dl>
    {container.migration.issues.length > 0 && <section className="detail-section migration-warning"><h3>Décisions de migration</h3><ul>{container.migration.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></section>}
    <section className="detail-section"><h3>Unités jouables</h3>{children.length ? <div className="compact-playables">{children.map((unit) => <button key={unit.id} onClick={() => onOpenPlayable(unit)}><span>▶</span><strong>{titleOf(unit)}</strong><small>{levelLabel(unit.levels)} · {availabilityLabel(availabilityOf(unit).coreMaterial)}</small></button>)}</div> : <p className="missing">Aucune unité jouable explicite : cette campagne doit être découpée avant d’être fiable dans « Trouver une partie ».</p>}</section>
    {components.length > 0 && <section className="detail-section"><h3>Composants / ressources</h3><div className="part-list">{components.map((component) => <ComponentCard component={component} key={component.id} />)}</div></section>}
    {container.legacyEntryId && <button className={`curation-button ${override.excluded ? 'restore' : 'exclude'}`} onClick={() => onUpdate(container.id, 'excluded', !override.excluded)}>{override.excluded ? '↩ Réintégrer la campagne' : '× Écarter la campagne'}</button>}
  </Modal>
}

function ComponentCard({ component }: { component: Component }) {
  const linked = documentsForTarget(component.id)
  return <article><strong>{componentTypeLabel(component.componentType)} · {titleOf(component)}</strong><span>{component.notes || `${linked.length} document${linked.length > 1 ? 's' : ''}`}</span><Badge>{component.requiredForCore ? 'Requis' : 'Facultatif'}</Badge></article>
}

function ScanPanel({ report, onClose }: { report: ScanReport; onClose: () => void }) {
  const changes = report.summary.added + report.summary.removed
  const zips = report.summary.zips ?? report.resourceInventory?.totalOnDisk ?? 0
  const zipsAssociated = report.summary.zipsAssociated ?? report.resourceInventory?.bundles.filter((bundle) => bundle.associationStatus !== 'unassociated').length ?? 0
  const zipsToReview = report.summary.zipsToReview ?? report.resourceInventory?.bundles.filter((bundle) => bundle.associationStatus === 'review').length ?? 0
  const infoCount = report.summary.information ?? report.informationPdfs?.length ?? 0

  return <section className={`scan-report ${changes ? '' : 'empty'}`}>
    <div className="scan-report-head"><div><small>SCAN BIBLIOTHÈQUE</small><h2>{changes ? `${report.summary.added} ajout${report.summary.added > 1 ? 's' : ''} · ${report.summary.removed} absence${report.summary.removed > 1 ? 's' : ''}` : 'Bibliothèque synchronisée avec le catalogue connu'}</h2><p>{report.totalOnDisk} PDF · {zips} ZIP ressources · {infoCount} PDF « info ». {zipsAssociated}/{zips} ZIP associés{zipsToReview ? `, dont ${zipsToReview} à vérifier` : ''}.</p></div><button onClick={onClose}>×</button></div>
    {(changes > 0 || (report.addedInformationPdfs?.length ?? 0) > 0 || zipsToReview > 0) && <div className="scan-report-groups">
      {(report.addedInformationPdfs?.length ?? 0) > 0 && <section><h3>Nouveaux PDF « info »</h3><ul>{report.addedInformationPdfs!.map((path) => <li key={path}><strong>{fileName(path)}</strong><span>Substitut documentaire à associer / vérifier.</span></li>)}</ul></section>}
      {report.newPdfs.length > 0 && <section><h3>Nouveaux PDF à classer</h3><ul>{report.newPdfs.map((path) => <li key={path}><strong>{fileName(path)}</strong><span>{path}</span></li>)}</ul></section>}
      {report.removed.length > 0 && <section><h3>PDF absents du dossier MJ</h3><ul>{report.removed.map((path) => <li key={path}><strong>{fileName(path)}</strong><span>{path}</span></li>)}</ul></section>}
      {zipsToReview > 0 && <section><h3>ZIP à vérifier</h3><ul>{report.resourceInventory?.bundles.filter((bundle) => bundle.associationStatus === 'review').map((bundle) => <li key={bundle.id}><strong>{bundle.filename}</strong><span>{bundle.targetId ? `Association probable : ${bundle.targetId}` : bundle.path}</span></li>)}</ul></section>}
    </div>}
  </section>
}

function Settings({ places, onOperation }: { places: string[]; onOperation: (operation: string, from?: string, to?: string) => void }) {
  const [draft, setDraft] = useState('')
  return <section className="settings-view"><div className="settings-intro"><small>RÉFÉRENTIEL LOCAL</small><h2>Lieux & migration</h2><p>La cible V3 centralise la curation par id. La lecture reste compatible avec les anciennes maps campagne/scénario.</p></div><div className="settings-card"><div className="add-place"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ajouter un lieu…" /><button onClick={() => { if (draft.trim()) { onOperation('place-add', undefined, draft.trim()); setDraft('') } }}>Ajouter</button></div><div className="place-cloud">{places.map((place) => <Badge key={place}>{place}</Badge>)}</div></div><div className="settings-card migration-summary"><h3>Migration runtime V2 → V3</h3><p>Le JSON canonique V2 n’est pas détruit : <code>catalogue.ts</code> le normalise à l’exécution en conteneurs, unités jouables, composants et documents.</p><dl><div><dt>Conteneurs</dt><dd>{containers.length}</dd></div><div><dt>Unités jouables</dt><dd>{playableUnits.length}</dd></div><div><dt>Documents</dt><dd>{currentDocuments().length}</dd></div><div><dt>Points à revoir</dt><dd>{migrationIssues.length}</dd></div><div><dt>Inventaire ZIP</dt><dd>{resourceInventoryKnown ? 'actif' : 'en attente du scan'}</dd></div></dl></div></section>
}

export function Pf2MjApp() {
  const [view, setView] = useState<View>('find')
  const [selected, setSelected] = useState<SelectedEntity | null>(null)
  const [scan, setScan] = useState<ScanReport | null>(null)
  const [scanStatus, setScanStatus] = useState('idle')
  const [error, setError] = useState('')
  const [curation, setCuration] = useState<Curation>({})
  const [resourceRevision, setResourceRevision] = useState(0)

  useEffect(() => {
    fetch('/apil7r/pf2-mj/curation').then((response) => response.ok ? response.json() : Promise.reject()).then(setCuration).catch(() => setError('Impossible de charger la curation MJ.'))
  }, [])

  useEffect(() => {
    fetch('/apil7r/pf2-mj/local-scan', { method: 'POST' })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((inventory: ScanReport) => {
        applyLocalScanInventory(inventory)
        setResourceRevision((value) => value + 1)
      })
      .catch(() => {
        // Un scan indisponible reste « inconnu » : on ne fabrique ni PDF ni ZIP manquants.
      })
  }, [])

  const active = useMemo(() => playableUnits.filter((unit) => !isExcluded(unit, resolvePlayableOverride(curation, unit))), [curation])
  const excluded = useMemo(() => playableUnits.filter((unit) => isExcluded(unit, resolvePlayableOverride(curation, unit))), [curation])
  const placeOptions = useMemo(() => unique([...allPlaces, ...(curation.customPlaces ?? [])]), [curation])
  const missingTranslations = active.filter((unit) => availabilityOf(unit).original === 'complete' && !availabilityOf(unit).readyInFrench).length
  const missingZips = resourceInventoryKnown ? active.filter((unit) => resourceBundleAvailability(unit).status === 'missing').length : null
  const documentCount = currentDocuments().length

  const update = async (id: string, field: string, value: unknown) => {
    setError('')
    try {
      const response = await fetch('/apil7r/pf2-mj/curation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetType: 'entry', id, field, value }) })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(typeof payload?.error === 'string' ? payload.error : 'Impossible d’enregistrer la modification.')
      setCuration(payload)
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

  const headings: Record<View, [string, string]> = {
    find: ['Trouver une partie', 'Recherche opérationnelle : uniquement des unités jouables.'],
    library: ['Bibliothèque / collections', 'Campagnes, saisons, séries et ressources structurent le catalogue sans polluer la recherche jouable.'],
    prepare: ['À préparer', 'Repère les PDF, traductions, ZIP Foundry et métadonnées encore à compléter.'],
    documents: ['Ressources PDF', 'Inventaire physique séparé des œuvres et de leur jouabilité.'],
    chronology: ['Chronologie', 'Unités jouables replacées dans le calendrier de Golarion.'],
    excluded: ['Écartés / archive', 'Contenus exclus, legacy ou volontairement sortis de la campagne active.'],
    settings: ['Paramètres', 'Référentiel local, curation et état de migration.'],
    pnj: ['PNJ', ''], factions: ['Factions', ''], lieux: ['Lieux', ''], regions: ['Régions', ''], evenements: ['Événements', ''],
  }

  const nav: Array<[View, string, string, number | string]> = [
    ['find', '▶', 'Trouver une partie', active.length],
    ['library', '▦', 'Bibliothèque', containers.length],
    ['prepare', '◒', 'À préparer', active.filter((unit) => availabilityOf(unit).coreMaterial !== 'complete' || (resourceInventoryKnown && resourceBundleAvailability(unit).status === 'missing')).length],
    ['documents', '⌁', 'Ressources PDF', documentCount],
    ['chronology', '◷', 'Chronologie', ''],
    ['excluded', '×', 'Écartés', excluded.length],
    ['pnj', '♙', 'PNJ', ''], ['factions', '⚑', 'Factions', ''], ['lieux', '⌂', 'Lieux', ''], ['regions', '◉', 'Régions', ''], ['evenements', '◇', 'Événements', ''], ['settings', '⚙', 'Paramètres', ''],
  ]

  const isReferenceView = ['pnj', 'factions', 'lieux', 'regions', 'evenements'].includes(view)

  return <main className="pf2-mj pf2-mj-v3">
    <header><button className="brand brand-button" onClick={() => setView('find')}><b>✦</b><span><strong>PATHFINDER 2</strong><small>GESTION MJ · MODÈLE V3</small></span></button><div className="header-right"><span><i />{missingTranslations} trad. manquante{missingTranslations > 1 ? 's' : ''} · {missingZips === null ? 'ZIP à inventorier' : `${missingZips} ZIP manquant${missingZips > 1 ? 's' : ''}`} · {documentCount} PDF</span><em>MJ</em></div></header>
    <div className="layout"><aside><nav>{nav.map(([id, icon, label, count]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}><span>{icon}</span>{label}<b>{count}</b></button>)}</nav><section><p>PRINCIPES V3</p><span className="aside-rule">▶ Unité jouable = seule recherche</span><span className="aside-rule">▣ Campagne = conteneur</span><span className="aside-rule">◇ Guide/carte = ressource</span><span className="aside-rule">ⓘ Info = substitut distinct</span></section><div className="scan-note"><b>V3</b><strong>Adaptateur sans perte</strong><p>Le catalogue V2 reste la source pendant la migration. Les nouvelles entités sont normalisées à l’exécution.</p></div></aside>
      <section className="content">{!isReferenceView && <><div className="page-title"><div><small>TABLE OUVERTE · GOLARION PERSISTANT</small><h1>{headings[view][0]}</h1><p>{headings[view][1]}</p></div><button className="refresh" onClick={refresh}>{scanStatus === 'scanning' ? '↻ Détection…' : scanStatus === 'done' ? '✓ Rapport prêt' : scanStatus === 'error' ? '! Réessayer' : '↻ Scanner PDF & ZIP'}</button></div>{error && <div className="notice"><strong>Attention</strong><p>{error}</p></div>}{scan && <ScanPanel report={scan} onClose={() => setScan(null)} />}{!['excluded', 'settings', 'documents'].includes(view) && <Stats active={active} />}{view === 'find' && <FinderView active={active} curation={curation} onOpen={setSelected} onUpdate={update} resourceVersion={resourceRevision} />}{view === 'library' && <LibraryView curation={curation} onOpen={setSelected} onOpenPlayable={setSelected} onUpdate={update} />}{view === 'prepare' && <PreparationView active={active} curation={curation} onOpen={setSelected} onUpdate={update} resourceVersion={resourceRevision} />}{view === 'documents' && <DocumentsView resourceVersion={resourceRevision} />}{view === 'chronology' && <ChronologyView units={active} onOpen={setSelected} />}{view === 'excluded' && <PlayableList units={sortPlayables(excluded, curation)} curation={curation} onOpen={setSelected} onUpdate={update} />}{view === 'settings' && <Settings places={placeOptions} onOperation={placeOperation} />}</>}{view === 'pnj' && <PnjPage />}{view === 'factions' && <FactionsPage />}{view === 'lieux' && <LieuxPage />}{view === 'regions' && <RegionsPage />}{view === 'evenements' && <EvenementsPage />}</section>
    </div>
    {selected?.entityKind === 'playable' && <PlayableDetail unit={selected} curation={curation} onClose={() => setSelected(null)} onUpdate={update} placeOptions={placeOptions} />}
    {selected?.entityKind === 'container' && <ContainerDetail container={selected} curation={curation} onClose={() => setSelected(null)} onOpenPlayable={(unit) => setSelected(unit)} onUpdate={update} />}
  </main>
}
