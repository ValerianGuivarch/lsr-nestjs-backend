export type MapVisibilityOverride = {
  sourceKey: string
  category: string
  label: string
  sourceFid: number | null
  visibility: 'visible' | 'hidden'
  publicLabel: string
  publicText: string
  mjText?: string
}

export type PublicSourcePoint = {
  fid: number
  label: string
  name: string
  text: string
  icon: string
  minZoom: number
  coordinates: Array<[number, number]>
}

export type MjLightSourcePoint = PublicSourcePoint & {
  sourceKey: string
  publicLabel: string
  mjText: string
}

export type MapVisibilitySnapshot = {
  autoVisibleCategories: string[]
  locationDefault: 'cities'
  overrides: MapVisibilityOverride[]
}

let snapshotPromise: Promise<MapVisibilitySnapshot> | undefined
let mjLightSnapshotPromise: Promise<MapVisibilitySnapshot> | undefined
let sourcePointsPromise: Promise<PublicSourcePoint[]> | undefined
let mjLightSourcePointsPromise: Promise<MjLightSourcePoint[]> | undefined

async function json<T>(url: string, fallback: T): Promise<T> {
  if (!url) return fallback
  try {
    const response = await fetch(url, { credentials: 'omit', cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json() as T
  } catch (error) {
    console.warn('Configuration de visibilité cartographique indisponible.', error)
    return fallback
  }
}

const fallbackVisibility: MapVisibilitySnapshot = {
  autoVisibleCategories: ['continents', 'deserts', 'forests', 'hills', 'ice', 'land', 'mountains', 'nations', 'provinces', 'regions', 'rivers', 'roads', 'subregions', 'swamps', 'waters'],
  locationDefault: 'cities',
  overrides: [],
}

export function getMapVisibility(mjLight = false): Promise<MapVisibilitySnapshot> {
  if (mjLight) {
    const url = window.GOLARION_MAP_CONFIG?.mjLightVisibilityUrl ?? window.GOLARION_MAP_CONFIG?.visibilityUrl ?? ''
    return mjLightSnapshotPromise ??= json<MapVisibilitySnapshot>(url, fallbackVisibility)
  }
  const url = window.GOLARION_MAP_CONFIG?.visibilityUrl ?? ''
  return snapshotPromise ??= json<MapVisibilitySnapshot>(url, fallbackVisibility)
}

export function getPublicSourcePoints(): Promise<PublicSourcePoint[]> {
  const url = window.GOLARION_MAP_CONFIG?.sourcePointsUrl ?? ''
  return sourcePointsPromise ??= json<PublicSourcePoint[]>(url, [])
}

export function getMjLightSourcePoints(): Promise<MjLightSourcePoint[]> {
  const url = window.GOLARION_MAP_CONFIG?.mjLightSourcePointsUrl ?? ''
  return mjLightSourcePointsPromise ??= json<MjLightSourcePoint[]>(url, [])
}

export function resetMapVisibilityCache(): void {
  snapshotPromise = undefined
  mjLightSnapshotPromise = undefined
  sourcePointsPromise = undefined
  mjLightSourcePointsPromise = undefined
}

export function overrideKey(category: string, label: string): string {
  return `${category}\u0000${label}`
}

export const playerCuratableLabelLayers = [
  'symbol_labels',
  'symbol_line-labels',
  'symbol_province-labels',
  'symbol_nation-labels',
  'symbol_subregion-labels',
  'symbol_region-labels',
] as const

export async function applyPlayerMapVisibilityFilters(map: import('maplibre-gl').Map, mjLight = false): Promise<void> {
  const visibility = await getMapVisibility(mjLight)
  const autoVisible = new Set(visibility.autoVisibleCategories)
  const hiddenLabels = visibility.overrides
    .filter(item => item.category !== 'locations' && (
      item.visibility === 'hidden'
      || (item.visibility === 'visible' && (!autoVisible.has(item.category) || Boolean(item.publicLabel.trim()) || Boolean(item.publicText.trim())))
    ))
    .map(item => item.label)
  if (!hiddenLabels.length) return
  const manualHidden = ['!', ['in', ['get', 'label'], ['literal', hiddenLabels]]]
  for (const layerId of playerCuratableLabelLayers) {
    if (!map.getLayer(layerId)) continue
    const current = map.getFilter(layerId)
    map.setFilter(layerId, current ? ['all', current, manualHidden] : manualHidden as never)
  }
}
