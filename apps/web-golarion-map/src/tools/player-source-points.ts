import { Popup, type GeoJSONSource, type MapLayerMouseEvent } from 'maplibre-gl'
import { getPlaceNamesFr, translatePlaceName } from '../i18n/place-names'
import { getMjLightSourcePoints, getPublicSourcePoints } from '../utils/map-visibility'
import { createMjLightCurationPanel } from './mj-light-curation'
import type { GolarionMap } from './GolarionMap'

const sourceId = 'pf2-player-source-points'
const iconLayerId = 'pf2-player-source-point-icons'
const labelLayerId = 'pf2-player-source-point-labels'

async function whenStyleReady(gmap: GolarionMap): Promise<void> {
  if (gmap.map.isStyleLoaded()) return
  await new Promise<void>(resolve => gmap.map.once('load', () => resolve()))
}

export async function addPlayerSourcePoints(gmap: GolarionMap, mode: 'pj' | 'mj-light' = 'pj'): Promise<void> {
  const mjLight = mode === 'mj-light'
  const [points, dictionary] = await Promise.all([
    mjLight ? getMjLightSourcePoints() : getPublicSourcePoints(),
    getPlaceNamesFr(),
  ])
  await whenStyleReady(gmap)
  if (gmap.map.getSource(sourceId)) return

  let features: GeoJSON.Feature<GeoJSON.Point>[] = points.flatMap(point => {
    const displayName = point.name === point.label ? translatePlaceName(point.label, dictionary) : point.name
    return point.coordinates.map(coordinate => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: coordinate },
      properties: {
        fid: point.fid,
        label: point.label,
        name: displayName,
        publicLabel: 'publicLabel' in point ? point.publicLabel : '',
        text: point.text,
        mjText: 'mjText' in point ? point.mjText : '',
        icon: point.icon,
        minZoom: point.minZoom,
      },
    }))
  })

  const collection = (): GeoJSON.FeatureCollection<GeoJSON.Point> => ({ type: 'FeatureCollection', features })
  gmap.map.addSource(sourceId, { type: 'geojson', data: collection() })

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

    if (mjLight) {
      const fid = Number(properties.fid)
      const label = String(properties.label ?? '')
      root.appendChild(createMjLightCurationPanel({
        fid: Number.isInteger(fid) ? fid : undefined,
        category: 'locations',
        label,
        publicLabel: String(properties.publicLabel ?? ''),
        publicText: text,
        mjText: String(properties.mjText ?? ''),
      }, {
        onHidden: () => {
          features = features.filter(item => !(Number(item.properties?.fid) === fid && String(item.properties?.label ?? '') === label))
          ;(gmap.map.getSource(sourceId) as GeoJSONSource | undefined)?.setData(collection())
          popup.remove()
        },
        onSaved: next => {
          for (const item of features) {
            if (Number(item.properties?.fid) === fid && String(item.properties?.label ?? '') === label) {
              item.properties = { ...item.properties, text: next.publicText, mjText: next.mjText }
            }
          }
          ;(gmap.map.getSource(sourceId) as GeoJSONSource | undefined)?.setData(collection())
        },
      }))
    }

    popup.setLngLat(event.lngLat).setDOMContent(root).addTo(gmap.map)
  }

  for (const layer of [iconLayerId, labelLayerId]) {
    gmap.map.on('click', layer, open)
    gmap.map.on('mouseenter', layer, () => { gmap.map.getCanvas().style.cursor = 'pointer' })
    gmap.map.on('mouseleave', layer, () => { gmap.map.getCanvas().style.cursor = '' })
  }
}
