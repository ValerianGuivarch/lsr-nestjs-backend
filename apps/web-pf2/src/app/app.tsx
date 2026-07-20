import { useMemo, useState } from 'react'
import './app.css'
import pf2Data from './resources/pf2.json'
import ascendancesData from './resources/pf2-ascendances.json'
import classesData from './resources/pf2-classes.json'

type TabKey = 'historique' | 'ascendance' | 'classe' | 'dieu' | 'origine'

type Heritage = {
  nomHeritage: string
  descriptionHeritage: string
}

type Pf2Entry = {
  id: string
  name: string
  nameEn?: string
  urlImage?: string
  shortDescription?: string
  longDescription?: string
  rarity?: string
  difficulté?: string
  sourceUrl?: string
  region?: string
  continent?: string
  position?: string
  category?: string
  scope?: string
  originType?: string
  accessibility?: string
  areasOfConcern?: string[]
  roleTags?: string[]
  heritages?: Heritage[]
  status?: string
}

type Pf2Data = {
  title?: string
  notes?: string[]
  ascendances?: Pf2Entry[]
  classes?: Pf2Entry[]
  historiques?: Pf2Entry[]
  dieux?: Pf2Entry[]
  origines?: Pf2Entry[]
}

type TabDefinition = {
  id: TabKey
  label: string
  title: string
  jsonKey: keyof Pick<Pf2Data, 'historiques' | 'ascendances' | 'classes' | 'dieux' | 'origines'>
}

type EntryFilterState = {
  rarity: string
  difficulty: string
}

type TabFilterState = Record<'ascendance' | 'classe', EntryFilterState>

const tabs: TabDefinition[] = [
  { id: 'ascendance', label: 'Ascendance', title: 'Ascendances', jsonKey: 'ascendances' },
  { id: 'classe', label: 'Classe', title: 'Classes', jsonKey: 'classes' },
  { id: 'historique', label: 'Historique', title: 'Historiques', jsonKey: 'historiques' },
  { id: 'dieu', label: 'Dieu', title: 'Dieux', jsonKey: 'dieux' },
  { id: 'origine', label: 'Origine', title: 'Origines', jsonKey: 'origines' }
]

function buildEntryMeta(entry: Pf2Entry): string[] {
  const values = [entry.position, entry.region, entry.continent]
  return values.filter((value): value is string => Boolean(value && value.trim()))
}

const rarityOrder = ['commune', 'peu commune', 'rare', 'unique', 'non précisée']

function normalizeRarity(rarity?: string): string {
  if (!rarity || !rarity.trim()) return 'non précisée'
  return rarity.trim().toLowerCase()
}

function toLabel(rarity?: string): string {
  return normalizeRarity(rarity)
}

function getRarityRank(rarity?: string): number {
  const normalized = normalizeRarity(rarity)
  const index = rarityOrder.indexOf(normalized)
  return index === -1 ? rarityOrder.length : index
}

function getEntryTitle(entry: Pf2Entry): string {
  return entry.name || entry.nameEn || entry.id
}

function hasUsableImage(url?: string): boolean {
  if (!url) return false
  const normalized = url.trim().toLowerCase()
  return normalized.length > 0 && normalized !== 'todo'
}

function getInitials(text: string): string {
  const parts = text.split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function getGroupKey(entry: Pf2Entry, tabId: TabKey): string {
  if (tabId === 'dieu') return entry.category ?? 'autre'
  if (tabId === 'origine') return entry.originType ?? 'autre'
  return normalizeRarity(entry.rarity)
}

function getEntryBadge(entry: Pf2Entry, tabId: TabKey): string {
  if (tabId === 'dieu') return entry.category ?? ''
  if (tabId === 'origine') return entry.accessibility ?? ''
  if (tabId === 'classe') return entry.difficulté ?? ''
  return toLabel(entry.rarity)
}

function getDifficultyLabel(value?: string): string {
  if (!value || !value.trim()) return 'non précisée'
  return value.trim().toLowerCase()
}

function getDifficultySortRank(value?: string): number {
  const normalized = getDifficultyLabel(value)
  const order = ['simple', 'intermédiaire', 'difficile', 'non précisée']
  const index = order.indexOf(normalized)
  return index === -1 ? order.length : index
}

function getPdfUrl(entry: Pf2Entry): string {
  const pdfName = encodeURIComponent(entry.name || entry.nameEn || entry.id)
  return `https://l7r.fr/l7r/${pdfName}.pf`
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('ascendance')
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)
  const [filtersByTab, setFiltersByTab] = useState<TabFilterState>({
    ascendance: { rarity: '', difficulty: '' },
    classe: { rarity: '', difficulty: '' }
  })

  const data = useMemo<Pf2Data>(() => ({
    ...(pf2Data as Pf2Data),
    ascendances: ascendancesData as Pf2Entry[],
    classes: classesData as Pf2Entry[],
  }), [])

  const currentTab = useMemo(() => tabs.find(tab => tab.id === activeTab) ?? tabs[0], [activeTab])
  const currentEntries = useMemo(() => {
    return data[currentTab.jsonKey] ?? []
  }, [currentTab, data])

  const filterTabId = activeTab === 'ascendance' || activeTab === 'classe' ? activeTab : null

  const activeFilters = filterTabId ? filtersByTab[filterTabId] : null

  const rarityOptions = useMemo(() => {
    if (!activeFilters) return []
    return [...new Set(currentEntries.map(entry => normalizeRarity(entry.rarity)))]
      .sort((rarityA, rarityB) => getRarityRank(rarityA) - getRarityRank(rarityB))
  }, [activeFilters, currentEntries])

  const difficultyOptions = useMemo(() => {
    if (!activeFilters) return []
    return [...new Set(currentEntries.map(entry => getDifficultyLabel(entry.difficulté)))]
      .sort((difficultyA, difficultyB) => getDifficultySortRank(difficultyA) - getDifficultySortRank(difficultyB))
  }, [activeFilters, currentEntries])

  const filteredEntries = useMemo(() => {
    if (!activeFilters) return currentEntries

    return currentEntries.filter((entry) => {
      const matchesRarity = !activeFilters.rarity || normalizeRarity(entry.rarity) === activeFilters.rarity
      const matchesDifficulty = !activeFilters.difficulty || getDifficultyLabel(entry.difficulté) === activeFilters.difficulty
      return matchesRarity && matchesDifficulty
    })
  }, [activeFilters, currentEntries])

  const groupedEntries = useMemo(() => {
    const grouped = new Map<string, Pf2Entry[]>()

    filteredEntries.forEach((entry) => {
      const key = getGroupKey(entry, activeTab)
      const existing = grouped.get(key) ?? []
      existing.push(entry)
      grouped.set(key, existing)
    })

    return [...grouped.entries()]
      .sort(([keyA], [keyB]) => {
        if (activeTab === 'dieu' || activeTab === 'origine') return keyA.localeCompare(keyB, 'fr')
        return getRarityRank(keyA) - getRarityRank(keyB)
      })
      .map(([groupKey, entries]) => ({
        groupKey,
        entries: entries.sort((entryA, entryB) => getEntryTitle(entryA).localeCompare(getEntryTitle(entryB), 'fr'))
      }))
  }, [filteredEntries, activeTab])

  const expandedEntry = useMemo(() => {
    if (!expandedEntryId) return null
    return filteredEntries.find(entry => entry.id === expandedEntryId) ?? null
  }, [filteredEntries, expandedEntryId])

  return (
    <main className="pf2-page">
      <header className="pf2-hero">
        <p className="pf2-eyebrow">PF2 helper</p>
        <h1>Helper Pathfinder</h1>
        <p>
          Données chargées depuis la ressource locale
          {' '}
          <strong>apps/web-pf2/src/app/resources/pf2.json</strong>,
          <strong>pf2-ascendances.json</strong> et <strong>pf2-classes.json</strong>.
        </p>
      </header>

      <nav className="pf2-tabs" aria-label="Sections Pathfinder">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`pf2-tab ${tab.id === activeTab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="pf2-card" aria-live="polite">
        <h2>
          {currentTab.title}
          {' '}
          <span className="pf2-count">({filteredEntries.length})</span>
        </h2>

        {activeFilters && (
          <div className="pf2-filters" aria-label="Filtres de liste">
            <label className="pf2-filter">
              <span>Rareté</span>
              <select
                value={activeFilters.rarity}
                onChange={(event) => {
                  const rarity = event.target.value
                  if (!filterTabId) return
                  setFiltersByTab((current) => ({
                    ...current,
                    [filterTabId]: {
                      ...current[filterTabId],
                      rarity
                    }
                  }))
                }}
              >
                <option value="">Tous</option>
                {rarityOptions.map(rarity => (
                  <option key={rarity} value={rarity}>{rarity}</option>
                ))}
              </select>
            </label>

            <label className="pf2-filter">
              <span>Difficulté</span>
              <select
                value={activeFilters.difficulty}
                onChange={(event) => {
                  const difficulty = event.target.value
                  if (!filterTabId) return
                  setFiltersByTab((current) => ({
                    ...current,
                    [filterTabId]: {
                      ...current[filterTabId],
                      difficulty
                    }
                  }))
                }}
              >
                <option value="">Tous</option>
                {difficultyOptions.map(difficulty => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {filteredEntries.length === 0 && (
          <p>Aucune entrée disponible pour cet onglet dans la ressource actuelle.</p>
        )}

        <div className="pf2-list">
          {groupedEntries.map((group) => (
            <section key={group.groupKey} className="pf2-rarity-group">
              <h3>
                {group.groupKey}
                {' '}
                <span className="pf2-count">({group.entries.length})</span>
              </h3>
              <div className="pf2-compact-grid">
                {group.entries.map((entry, index) => {
                  const title = getEntryTitle(entry)
                  const imageUrl = hasUsableImage(entry.urlImage) ? entry.urlImage : undefined
                  const isExpanded = expandedEntry?.id === entry.id
                  const entryKey = entry.id || `${currentTab.id}-${title}-${index}`
                  const badge = getEntryBadge(entry, activeTab)
                  const meta = buildEntryMeta(entry)

                  return (
                    <article
                      key={entryKey}
                      className={`pf2-compact-item ${isExpanded ? 'is-expanded' : ''}`}
                    >
                      <button
                        type="button"
                        className="pf2-compact-trigger"
                        onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                        aria-expanded={isExpanded}
                      >
                        <div className={`pf2-compact-thumb ${activeTab === 'ascendance' ? 'pf2-compact-thumb--large' : ''}`} aria-hidden="true">
                          {imageUrl ? (
                            <>
                              <img
                                src={imageUrl}
                                alt=""
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.hidden = true;
                                  const sibling = e.currentTarget.nextSibling as HTMLElement | null;
                                  if (sibling) sibling.hidden = false;
                                }}
                              />
                              <span hidden>{getInitials(title)}</span>
                            </>
                          ) : (
                            <span>{getInitials(title)}</span>
                          )}
                        </div>

                        <div className="pf2-compact-content">
                          <p className="pf2-compact-title">{title}</p>
                          <p className="pf2-compact-short">{entry.shortDescription || 'Pas de résumé disponible.'}</p>
                          {activeTab === 'dieu' && entry.areasOfConcern && entry.areasOfConcern.length > 0 && (
                            <p className="pf2-compact-extra">{entry.areasOfConcern.slice(0, 4).join(' · ')}</p>
                          )}
                          {activeTab === 'classe' && entry.roleTags && entry.roleTags.length > 0 && (
                            <p className="pf2-compact-extra">{entry.roleTags.join(' · ')}</p>
                          )}                          {activeTab === 'ascendance' && entry.difficulté && (
                            <p className="pf2-compact-extra">{entry.difficulté}</p>
                          )}                          {activeTab === 'origine' && entry.continent && (
                            <p className="pf2-compact-extra">{entry.continent}</p>
                          )}
                        </div>
                        {badge && <span className="pf2-compact-rarity">{badge}</span>}
                      </button>

                      {isExpanded && (
                        <div className="pf2-inline-detail">
                          {meta.length > 0 && (
                            <p className="pf2-detail-meta">{meta.join(' · ')}</p>
                          )}
                          {activeTab === 'dieu' && entry.areasOfConcern && entry.areasOfConcern.length > 0 && (
                            <div className="pf2-tags">
                              {entry.areasOfConcern.map(concern => (
                                <span key={concern} className="pf2-tag">{concern}</span>
                              ))}
                            </div>
                          )}
                          {activeTab === 'classe' && entry.roleTags && entry.roleTags.length > 0 && (
                            <div className="pf2-tags">
                              {entry.roleTags.map(tag => (
                                <span key={tag} className="pf2-tag">{tag}</span>
                              ))}
                            </div>
                          )}
                          {(activeTab === 'ascendance' || activeTab === 'classe') && entry.difficulté && (
                            <div className="pf2-tags">
                              <span className="pf2-tag pf2-tag--difficulty">difficulté : {entry.difficulté}</span>
                            </div>
                          )}
                          {(activeTab === 'ascendance' || activeTab === 'classe') && (
                            <a className="pf2-pdf-link" href={getPdfUrl(entry)} target="_blank" rel="noreferrer">
                              PDF
                            </a>
                          )}
                          {activeTab === 'origine' && (entry.originType ?? entry.continent ?? entry.accessibility) && (
                            <p className="pf2-detail-meta">
                              {[entry.originType, entry.continent, entry.accessibility].filter(Boolean).join(' · ')}
                            </p>
                          )}
                          {entry.longDescription && <p>{entry.longDescription}</p>}
                          {activeTab === 'ascendance' && entry.heritages && entry.heritages.length > 0 && (
                            <div className="pf2-heritages">
                              <p className="pf2-heritages-title">Héritages</p>
                              <ul className="pf2-heritage-list">
                                {entry.heritages.map(h => (
                                  <li key={h.nomHeritage} className="pf2-heritage-item">
                                    <span className="pf2-heritage-name">{h.nomHeritage}</span>
                                    <span className="pf2-heritage-desc">{h.descriptionHeritage}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
