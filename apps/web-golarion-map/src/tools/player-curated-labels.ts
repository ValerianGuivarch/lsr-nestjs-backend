import { Popup, type GeoJSONSource, type MapLayerMouseEvent } from 'maplibre-gl'
import { getPlaceNamesFr, translatePlaceName } from '../i18n/place-names'
import { getMapVisibility, overrideKey } from '../utils/map-visibility'
import type { SearchCategory } from '../utils/fuzzy-search'
import type { GolarionMap } from './GolarionMap'
import { createMjLightCurationPanel } from './mj-light-curation'

const sourceId = 'pf2-player-curated-labels'
const layerId = 'pf2-player-curated-labels-layer'

async function styleReady(gmap: GolarionMap): Promise<void> {
  if (gmap.map.isStyleLoaded()) return
  await new Promise<void>(resolve => gmap.map.once('load', () => resolve()))
}

export async function addPlayerCuratedLabels(gmap: GolarionMap, mode: 'pj' | 'mj-light' = 'pj'): Promise<void> {
  const mjLight = mode === 'mj-light'
  const [visibility, dictionary, searchResponse] = await Promise.all([
    getMapVisibility(mjLight),
    getPlaceNamesFr(),
    fetch(`./search.json?v=${BUILD_DATA_HASH}`),
  ])
  if (!searchResponse.ok) return
  const search = await searchResponse.json() as SearchCategory[]
  const autoVisible = new Set(visibility.autoVisibleCategories)
  const visibleOverrides = new Map(
    visibility.overrides
      .filter(item => item.visibility === 'visible' && item.category !== 'locations' && (
        !autoVisible.has(item.category) || Boolean(item.publicLabel.trim()) || Boolean(item.publicText.trim()) || (mjLight && Boolean(item.mjText?.trim()))
      ))
      .map(item => [overrideKey(item.category, item.label), item])
  )
  if (!visibleOverrides.size) return

  let features: GeoJSON.Feature<GeoJSON.Point>[] = []
  for (const category of search) {
    for (const entry of category.entries) {
      const override = visibleOverrides.get(overrideKey(category.category, entry.label))
      if (!override) continue
      const timed = entry.timed[0]
      if (!timed) continue
      const bbox = timed.bbox
      const coordinates: [number, number] = bbox.length === 2
        ? [bbox[0], bbox[1]]
        : [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates },
        properties: {
          category: category.category,
          label: entry.label,
          name: override.publicLabel.trim() || translatePlaceName(entry.label, dictionary),
          publicLabel: override.publicLabel,
          text: override.publicText,
          mjText: override.mjText ?? '',
        },
      })
    }
  }
  if (!features.length) return
  await styleReady(gmap)
  if (gmap.map.getSource(sourceId)) return

  const collection = (): GeoJSON.FeatureCollection<GeoJSON.Point> => ({ type: 'FeatureCollection', features })
  gmap.map.addSource(sourceId, { type: 'geojson', data: collection() })
  gmap.map.addLayer({
    id: layerId,
    type: 'symbol',
    source: sourceId,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['NotoSans-Medium'],
      'text-size': 14,
      'text-variable-anchor': ['center', 'top', 'bottom'],
      'text-overlap': 'always',
    },
    paint: {
      'text-color': 'rgb(255,255,255)',
      'text-halo-color': 'rgb(10,10,10)',
      'text-halo-width': 1,
    },
  })

  const popup = new Popup({ offset: 10, closeButton: true })
  gmap.map.on('click', layerId, (event: MapLayerMouseEvent) => {
    const props = event.features?.[0]?.properties ?? {}
    const category = String(props.category ?? '')
    const label = String(props.label ?? '')
    const root = document.createElement('div')
    root.className = 'pf2-player-source-popup'
    const title = document.createElement('strong')
    title.textContent = String(props.name ?? '')
    root.appendChild(title)

    const text = String(props.text ?? '').trim()
    if (text) {
      const paragraph = document.createElement('p')
      paragraph.textContent = text
      root.appendChild(paragraph)
    }

    if (mjLight) {
      root.appendChild(createMjLightCurationPanel({
        category,
        label,
        publicLabel: String(props.publicLabel ?? ''),
        publicText: text,
        mjText: String(props.mjText ?? ''),
      }, {
        onHidden: () => {
          features = features.filter(item => !(String(item.properties?.category ?? '') === category && String(item.properties?.label ?? '') === label))
          ;(gmap.map.getSource(sourceId) as GeoJSONSource | undefined)?.setData(collection())
          popup.remove()
        },
        onSaved: next => {
          for (const item of features) {
            if (String(item.properties?.category ?? '') === category && String(item.properties?.label ?? '') === label) {
              item.properties = { ...item.properties, text: next.publicText, mjText: next.mjText }
            }
          }
          ;(gmap.map.getSource(sourceId) as GeoJSONSource | undefined)?.setData(collection())
        },
      }))
    }

    popup.setLngLat(event.lngLat).setDOMContent(root).addTo(gmap.map)
  })
  gmap.map.on('mouseenter', layerId, () => { gmap.map.getCanvas().style.cursor = 'pointer' })
  gmap.map.on('mouseleave', layerId, () => { gmap.map.getCanvas().style.cursor = '' })
}
