import type { Map } from 'maplibre-gl'
import bundledMapUrl from '../../assets/absalom-overlay.jpg?url'

const SOURCE_ID = 'pf2-absalom-illustrated-map'
const LAYER_ID = 'pf2-absalom-illustrated-map-layer'

// Georeferencing of Master NI's city plan on the Golarion basemap.
// Clockwise: northwest, northeast, southeast, southwest.
// These corners are independent of the image URL: a replacement plan with
// different margins can be recalibrated here.
const CORNERS: [[number, number], [number, number], [number, number], [number, number]] = [
  [-0.301, 30.935],
  [-0.185, 30.935],
  [-0.185, 30.782],
  [-0.301, 30.782],
]

/**
 * Add a true georeferenced image layer, not a fixed screen overlay.
 * MapLibre handles panning, zooming, projection and the gradual fade-in.
 * Existing PF2 markers and popups remain above the image.
 */
export function addAbsalomOverlay(map: Map, withToggle = true): void {
  let enabled = true
  const configuredUrl = window.GOLARION_MAP_CONFIG?.absalomOverlayUrl?.trim()
  const url = configuredUrl || bundledMapUrl

  const add = () => {
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'image',
        url,
        coordinates: CORNERS,
      })
    }

    if (!map.getLayer(LAYER_ID)) {
      map.addLayer({
        id: LAYER_ID,
        type: 'raster',
        source: SOURCE_ID,
        minzoom: 7.5,
        layout: { visibility: enabled ? 'visible' : 'none' },
        paint: {
          'raster-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7.5, 0,
            8.0, 0.3,
            9.0, 0.85,
            10.0, 0.96,
          ],
          'raster-fade-duration': 0,
        },
      })

      // The illustrated map covers the generic basemap labels; interactive
      // source POIs stay on top. Curated PF2 marker layers are added later.
      for (const layer of ['location-icons', 'location-labels']) {
        if (map.getLayer(layer)) map.moveLayer(layer)
      }
    }
  }

  map.on('style.load', add)
  if (map.isStyleLoaded()) add()

  if (!withToggle) return

  // Compare the illustrated plan against the original basemap without
  // changing any PJ/MJ visibility settings.
  const control = document.createElement('div')
  control.className = 'maplibregl-ctrl maplibregl-ctrl-group'
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'A'
  button.setAttribute('aria-label', 'Afficher ou masquer le plan illustré d’Absalom')
  button.setAttribute('aria-pressed', 'true')
  button.title = 'Masquer le plan illustré d’Absalom'
  button.addEventListener('click', () => {
    enabled = !enabled
    if (map.getLayer(LAYER_ID)) {
      map.setLayoutProperty(LAYER_ID, 'visibility', enabled ? 'visible' : 'none')
    }
    button.setAttribute('aria-pressed', String(enabled))
    button.title = enabled ? 'Masquer le plan illustré d’Absalom' : 'Afficher le plan illustré d’Absalom'
  })
  control.appendChild(button)

  const updateControlVisibility = () => {
    const { lng, lat } = map.getCenter()
    const nearAbsalom = lng > -0.65 && lng < 0.15 && lat > 30.5 && lat < 31.2
    control.style.display = nearAbsalom && map.getZoom() >= 7 ? '' : 'none'
  }

  map.addControl({
    onAdd: () => control,
    onRemove: () => {
      map.off('moveend', updateControlVisibility)
      control.remove()
    },
  }, 'top-right')
  map.on('moveend', updateControlVisibility)
  updateControlVisibility()
}
