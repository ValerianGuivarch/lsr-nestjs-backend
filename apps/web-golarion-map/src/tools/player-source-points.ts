import { Popup, type GeoJSONSource, type MapLayerMouseEvent } from 'maplibre-gl'
import { getPlaceNamesFr, translatePlaceName } from '../i18n/place-names'
import { getPublicSourcePoints } from '../utils/map-visibility'
import type { GolarionMap } from './GolarionMap'

const sourceId = 'pf2-player-source-points'
const iconLayerId = 'pf2-player-source-point-icons'
const labelLayerId = 'pf2-player-source-point-labels'

async function whenStyleReady(gmap: GolarionMap): Promise<void> {
  if (gmap.map.isStyleLoaded()) return
  await new Promise<void>(resolve => gmap.map.once('load', () => resolve()))
}

export async function addPlayerSourcePoints(gmap: GolarionMap): Promise<void> {
  const [points, dictionary] = await Promise.all([getPublicSourcePoints(), getPlaceNamesFr()])
  await whenStyleReady(gmap)
  if (gmap.map.getSource(sourceId)) return

  const features: GeoJSON.Feature<GeoJSON.Point>[] = points.flatMap(point => {
    const displayName = point.name === point.label ? translatePlaceName(point.label, dictionary) : point.name
    return point.coordinates.map(coordinate => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: coordinate },
      properties: {
        fid: point.fid,
        label: point.label,
        name: displayName,
        text: point.text,
        icon: point.icon,
        minZoom: point.minZoom,
      },
    }))
  })

  gmap.map.addSource(sourceId, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features },
  })

  gmap.map.addLayer({
    id: iconLayerId,
    type: 'symbol',
    source: sourceId,
    filter: ['>=', ['zoom'], ['get', 'minZoom']],
    layout: {
      'icon-image': ['get', 'icon'],
      'icon-pitch-alignment': 'map',
      'icon-overlap': 'always',
      'icon-ignore-placement': true,
      'icon-size': 0.85,
    },
  })

  gmap.map.addLayer({
    id: labelLayerId,
    type: 'symbol',
    source: sourceId,
    filter: ['>=', ['zoom'], ['+', ['get', 'minZoom'], 5]],
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['NotoSans-Medium'],
      'text-size': 14,
      'text-variable-anchor': ['left', 'right'],
      'text-radial-offset': 0.5,
    },
    paint: {
      'text-color': 'rgb(255,255,255)',
      'text-halo-color': 'rgb(10,10,10)',
      'text-halo-width': 0.8,
    },
  })

  const popup = new Popup({ offset: 16, closeButton: true })
  const open = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0]
    if (!feature) return
    const properties = feature.properties ?? {}
    const root = document.createElement('div')
    root.className = 'pf2-player-source-popup'
    const title = document.createElement('strong')
    title.textContent = String(properties.name ?? properties.label ?? '')
    root.appendChild(title)
    const text = String(properties.text ?? '').trim()
    if (text) {
      const paragraph = document.createElement('p')
      paragraph.textContent = text
      root.appendChild(paragraph)
    }
    popup.setLngLat(event.lngLat).setDOMContent(root).addTo(gmap.map)
  }
  for (const layer of [iconLayerId, labelLayerId]) {
    gmap.map.on('click', layer, open)
    gmap.map.on('mouseenter', layer, () => { gmap.map.getCanvas().style.cursor = 'pointer' })
    gmap.map.on('mouseleave', layer, () => { gmap.map.getCanvas().style.cursor = '' })
  }
}
