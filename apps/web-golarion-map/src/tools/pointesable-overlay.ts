import { Marker, type ImageSource, type Map as MapLibreMap } from 'maplibre-gl'
import bundledMapUrl from '../../assets/pointesable-overlay.webp?url'
// Only the town name is hidden when it is already printed on the inset plan.
const POINTESABLE_BASE_LABELS = ['Sandpoint', 'Pointesable']

// The four geographic corners always stay fixed in map coordinates when the
// viewer pans, changes zoom, or switches between the PJ/MJ modes.
type Point = [number, number]
type Corners = [Point, Point, Point, Point]
type Settings = { corners: Corners; hideLabels: boolean }
const SOURCE_ID = 'pf2-pointesable-illustrated-map'
const LAYER_ID = 'pf2-pointesable-illustrated-map-layer'
const DEFAULT: Settings = {
  corners: [[-27.1835, 44.115], [-27.1445, 44.115], [-27.1445, 44.079], [-27.1835, 44.079]],
  hideLabels: true,
}
const clone = (input: Corners): Corners => input.map(([lng, lat]) => [lng, lat]) as Corners
const api = () => (window.GOLARION_MAP_CONFIG?.placesUrl ?? '').replace(/\/places\/?$/, '/pointesable-overlay')

export function addPointesableOverlay(map: MapLibreMap, withToggle = true, allowCalibration = false): void {
  const url = window.GOLARION_MAP_CONFIG?.pointesableOverlayUrl?.trim() || bundledMapUrl
  let corners = clone(DEFAULT.corners)
  let hideLabels = DEFAULT.hideLabels
  let enabled = true
  let editing = false
  let saved: Settings = { corners: clone(corners), hideLabels }
  let handles: Marker[] = []
  let originalTextOpacity: import('maplibre-gl').DataDrivenPropertyValueSpecification<number> | undefined
  let townLabelHidden = false
  const panel = document.createElement('div')
  panel.className = 'pf2-absalom-calibration'
  panel.hidden = true

  const onMapStyle = () => {
    if (!map.getSource(SOURCE_ID)) map.addSource(SOURCE_ID, { type: 'image', url, coordinates: corners })
    if (!map.getLayer(LAYER_ID)) {
      // Keep all vector POI icons and place names ABOVE the illustrated plan.
      // Overlay labels must not mask the existing cartographic POIs.
      const firstSymbolId = map.getStyle().layers?.find(layer => layer.type === 'symbol')?.id
      map.addLayer({
        id: LAYER_ID, type: 'raster', source: SOURCE_ID, minzoom: 8.5,
        layout: { visibility: enabled ? 'visible' : 'none' },
        paint: {
          'raster-opacity': editing ? 0.65 : [
            'interpolate', ['linear'], ['zoom'],
            8.5, 0, 9, 0.3, 10, 0.85, 11, 0.96,
          ],
          'raster-fade-duration': 0,
        },
      }, firstSymbolId)
    }
    updateCoordinates(false)
    syncLabels()
  }

  const updateCoordinates = (moveHandles = true) => {
    const source = map.getSource(SOURCE_ID) as ImageSource | undefined
    source?.setCoordinates(corners)
    if (moveHandles) handles.forEach((handle, i) => handle.setLngLat(corners[i]))
  }
  const nearPointesable = () => {
    const { lng, lat } = map.getCenter()
    return lng > -27.75 && lng < -26.6 && lat > 43.6 && lat < 44.6 && map.getZoom() >= 8.5
  }

  // Never disable entire label layers: that used to make every place name
  // vanish when zooming into Pointesable. Only the Sandpoint city label already printed
  // on the illustrated map is muted, while POIs and published labels remain.
  const syncLabels = () => {
    if (!map.getLayer('symbol_labels')) return
    const shouldHide = enabled && hideLabels && nearPointesable()
    if (shouldHide === townLabelHidden) return
    if (shouldHide) {
      originalTextOpacity = map.getPaintProperty('symbol_labels', 'text-opacity') as import('maplibre-gl').DataDrivenPropertyValueSpecification<number> | undefined
      map.setPaintProperty('symbol_labels', 'text-opacity', [
        'case',
        ['in', ['get', 'label'], ['literal', POINTESABLE_BASE_LABELS]],
        0,
        // Legacy MapLibre stop objects cannot be nested inside a style
        // expression. Use a numeric fallback while masking the town name,
        // then restore the exact original paint property below.
        typeof originalTextOpacity === 'number' ? originalTextOpacity : 1,
      ])
    } else {
      map.setPaintProperty('symbol_labels', 'text-opacity', originalTextOpacity ?? 1)
      originalTextOpacity = undefined
    }
    townLabelHidden = shouldHide
  }

  // Changing any one corner preserves that geographic anchor at all zooms.
  const move = (dx: number, dy: number) => {
    corners = corners.map(([x, y]) => [x + dx, y + dy]) as Corners
    updateCoordinates()
  }
  const resize = (xFactor: number, yFactor: number) => {
    const cx = corners.reduce((sum, [x]) => sum + x, 0) / 4
    const cy = corners.reduce((sum, [, y]) => sum + y, 0) / 4
    corners = corners.map(([x, y]) => [
      cx + (x - cx) * xFactor, cy + (y - cy) * yFactor,
    ]) as Corners
    updateCoordinates()
  }
  const increment = () => {
    const longs = corners.map(p => p[0])
    const lats = corners.map(p => p[1])
    return { dx: (Math.max(...longs) - Math.min(...longs)) / 80, dy: (Math.max(...lats) - Math.min(...lats)) / 80 }
  }

  const removeHandles = () => { handles.forEach(handle => handle.remove()); handles = [] }
  const createHandles = () => {
    removeHandles()
    corners.forEach((coordinate, index) => {
      const dot = document.createElement('div')
      dot.className = 'pf2-absalom-corner'
      dot.textContent = String(index + 1)
      dot.title = ['Nord-ouest', 'Nord-est', 'Sud-est', 'Sud-ouest'][index]
      const handle = new Marker({ element: dot, draggable: true, anchor: 'center' })
        .setLngLat(coordinate).addTo(map)
      handle.on('drag', () => {
        const { lng, lat } = handle.getLngLat()
        corners[index] = [lng, lat]
        updateCoordinates(false)
      })
      handles.push(handle)
    })
  }

  const note = document.createElement('div')
  note.className = 'pf2-absalom-calibration-note'
  note.textContent = "Aligne le littoral, les quais et les routes de Pointe-Sable. Déplace les quatre coins pour corriger l’orientation et la perspective."
  panel.appendChild(note)
  const controls = document.createElement('div')
  controls.className = 'pf2-absalom-calibration-grid'
  const action = (name: string, tooltip: string, callback: () => void) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = name
    button.title = tooltip
    button.addEventListener('click', callback)
    controls.appendChild(button)
  }
  action('←', 'Déplacer à gauche', () => move(-increment().dx, 0))
  action('↑', 'Déplacer vers le nord', () => move(0, increment().dy))
  action('↓', 'Déplacer vers le sud', () => move(0, -increment().dy))
  action('→', 'Déplacer à droite', () => move(increment().dx, 0))
  action('L −', 'Réduire la largeur', () => resize(0.98, 1))
  action('L +', 'Agrandir la largeur', () => resize(1.02, 1))
  action('H −', 'Réduire la hauteur', () => resize(1, 0.98))
  action('H +', 'Agrandir la hauteur', () => resize(1, 1.02))
  panel.appendChild(controls)
  const checkboxLabel = document.createElement('label')
  checkboxLabel.className = 'pf2-absalom-label-toggle'
  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.checked = hideLabels
  checkbox.addEventListener('change', () => { hideLabels = checkbox.checked; syncLabels() })
  checkboxLabel.append(checkbox, document.createTextNode('Masquer le nom de la ville sur l’ancien fond'))
  panel.appendChild(checkboxLabel)

  const status = document.createElement('div')
  status.className = 'pf2-absalom-calibration-status'
  panel.appendChild(status)
  const footer = document.createElement('div')
  footer.className = 'pf2-absalom-calibration-footer'
  const footerButton = (label: string, fn: () => void) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = label
    button.addEventListener('click', fn)
    footer.appendChild(button)
    return button
  }
  const leave = () => {
    editing = false
    panel.hidden = true
    removeHandles()
    map.setPaintProperty(LAYER_ID, 'raster-opacity', [
      'interpolate', ['linear'], ['zoom'],
      8.5, 0, 9, 0.3, 10, 0.85, 11, 0.96,
    ])
    syncLabels()
  }
  footerButton('Annuler', () => {
    corners = clone(saved.corners)
    hideLabels = saved.hideLabels
    checkbox.checked = hideLabels
    updateCoordinates()
    leave()
  })
  footerButton('Défaut', () => {
    corners = clone(DEFAULT.corners)
    hideLabels = DEFAULT.hideLabels
    checkbox.checked = hideLabels
    updateCoordinates()
    syncLabels()
  })
  const save = footerButton('Enregistrer pour tous', async () => {
    const endpoint = api()
    if (!endpoint) { status.textContent = 'API non configurée'; return }
    save.disabled = true
    status.textContent = 'Enregistrement…'
    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corners, hideLabels }),
      })
      if (!response.ok) throw new Error(await response.text())
      const result = await response.json() as Settings
      corners = clone(result.corners)
      hideLabels = result.hideLabels
      saved = { corners: clone(corners), hideLabels }
      status.textContent = 'Calage enregistré pour MJ et PJ.'
      leave()
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : String(error)
    } finally {
      save.disabled = false
    }
  })
  panel.appendChild(footer)

  // Loading is shared between all browsers; do not rely on browser-local state.
  const load = async () => {
    if (!api()) return
    try {
      const response = await fetch(api(), { cache: 'no-store' })
      if (!response.ok) return
      const result = await response.json() as Settings
      if (editing || !Array.isArray(result.corners) || result.corners.length !== 4) return
      corners = clone(result.corners)
      hideLabels = result.hideLabels !== false
      checkbox.checked = hideLabels
      saved = { corners: clone(corners), hideLabels }
      updateCoordinates()
      syncLabels()
    } catch (error) {
      console.warn('Calage Pointe-Sable indisponible, utilisation des coordonnées par défaut.', error)
    }
  }

  map.on('style.load', () => {
    townLabelHidden = false
    originalTextOpacity = undefined
    onMapStyle()
  })
  // Curated layers are added asynchronously; also hide any late-added labels.
  map.on('idle', syncLabels)
  if (map.isStyleLoaded()) onMapStyle()
  void load()

  if (!withToggle) return

  const control = document.createElement('div')
  control.className = 'maplibregl-ctrl pf2-absalom-map-control'
  const top = document.createElement('div')
  top.className = 'maplibregl-ctrl-group'
  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.textContent = 'P'
  toggle.title = 'Afficher/masquer le plan illustré'
  toggle.setAttribute('aria-pressed', 'true')
  toggle.addEventListener('click', () => {
    enabled = !enabled
    map.setLayoutProperty(LAYER_ID, 'visibility', enabled ? 'visible' : 'none')
    toggle.setAttribute('aria-pressed', String(enabled))
    syncLabels()
  })
  top.appendChild(toggle)
  if (allowCalibration) {
    const edit = document.createElement('button')
    edit.type = 'button'
    edit.textContent = 'Caler'
    edit.title = 'Régler le calage de la carte de Pointe-Sable pour tous les joueurs'
    edit.className = 'pf2-absalom-open-editor'
    edit.addEventListener('click', () => {
      if (editing) return
      enabled = true
      map.setLayoutProperty(LAYER_ID, 'visibility', 'visible')
      toggle.setAttribute('aria-pressed', 'true')
      editing = true
      panel.hidden = false
      status.textContent = ''
      map.setPaintProperty(LAYER_ID, 'raster-opacity', 0.65)
      createHandles()
      syncLabels()
    })
    top.appendChild(edit)
  }
  control.append(top, panel)
  const updateControlVisibility = () => {
    const { lng, lat } = map.getCenter()
    control.style.display = (lng > -27.75 && lng < -26.6 && lat > 43.6 && lat < 44.6 && map.getZoom() >= 8.5) || editing ? '' : 'none'
    syncLabels()
  }
  map.addControl({
    onAdd: () => control,
    onRemove: () => {
      map.off('moveend', updateControlVisibility)
      removeHandles()
      control.remove()
    },
  }, 'top-right')
  map.on('moveend', updateControlVisibility)
  updateControlVisibility()
}
