import { Marker, Popup } from 'maplibre-gl'
import { GolarionMap } from './GolarionMap'

type PublicPlace = {
  id: string
  name: string
  latitude: number
  longitude: number
  text: string
  mjText?: string
  icon: string
}

const glyphs: Record<string, string> = {
  pin: '●',
  city: '◆',
  lodge: '⌂',
  ruins: '✦',
  camp: '▲',
  danger: '⚠',
  portal: '✧',
}

function markerElement(place: PublicPlace): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'pf2-public-place-marker'
  button.title = place.name
  button.setAttribute('aria-label', place.name)

  const icon = document.createElement('span')
  icon.className = 'pf2-public-place-icon'
  icon.textContent = glyphs[place.icon] ?? glyphs.pin

  const label = document.createElement('span')
  label.className = 'pf2-public-place-label'
  label.textContent = place.name

  button.append(icon, label)
  return button
}

function basicPopupContent(place: PublicPlace): HTMLElement {
  const root = document.createElement('div')
  root.className = 'pf2-public-place-popup'
  const title = document.createElement('strong')
  title.textContent = place.name
  root.appendChild(title)
  if (place.text) {
    const text = document.createElement('p')
    text.textContent = place.text
    root.appendChild(text)
  }
  return root
}

function mjLightPopupContent(place: PublicPlace, onHidden: () => void): HTMLElement {
  const root = basicPopupContent(place)
  root.classList.add('pf2-mj-light-popup')

  const publicLabel = document.createElement('label')
  publicLabel.textContent = 'Description visible par les PJ'
  const publicText = document.createElement('textarea')
  publicText.rows = 4
  publicText.maxLength = 4000
  publicText.value = place.text
  publicLabel.appendChild(publicText)
  root.appendChild(publicLabel)

  const mjLabel = document.createElement('label')
  mjLabel.textContent = 'Détails MJ (optionnel)'
  const mjText = document.createElement('textarea')
  mjText.rows = 4
  mjText.maxLength = 6000
  mjText.value = place.mjText ?? ''
  mjLabel.appendChild(mjText)
  root.appendChild(mjLabel)

  const status = document.createElement('div')
  status.className = 'pf2-mj-light-status'
  root.appendChild(status)

  const actions = document.createElement('div')
  actions.className = 'pf2-mj-light-actions'
  const save = document.createElement('button')
  save.type = 'button'
  save.className = 'pf2-map-curation-save'
  save.textContent = 'Enregistrer'
  const hide = document.createElement('button')
  hide.type = 'button'
  hide.className = 'pf2-map-curation-hide'
  hide.textContent = 'Cacher aux PJ'
  actions.append(save, hide)
  root.appendChild(actions)

  const update = async (visible: boolean) => {
    const base = window.GOLARION_MAP_CONFIG?.placesUrl ?? ''
    if (!base) throw new Error('API des lieux PF2 non configurée.')
    const response = await fetch(`${base}/${encodeURIComponent(place.id)}`, {
      method: 'PUT',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visible,
        publicText: publicText.value.trim(),
        mjText: mjText.value.trim(),
      }),
    })
    if (!response.ok) throw new Error(await response.text())
    place.text = publicText.value.trim()
    place.mjText = mjText.value.trim()
  }

  save.onclick = async () => {
    save.disabled = true
    hide.disabled = true
    try {
      await update(true)
      status.textContent = 'Descriptions enregistrées.'
      status.className = 'pf2-mj-light-status saved'
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : String(error)
      status.className = 'pf2-mj-light-status error'
    } finally {
      save.disabled = false
      hide.disabled = false
    }
  }

  hide.onclick = async () => {
    save.disabled = true
    hide.disabled = true
    try {
      await update(false)
      status.textContent = 'Lieu caché aux PJ.'
      status.className = 'pf2-mj-light-status saved'
      onHidden()
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : String(error)
      status.className = 'pf2-mj-light-status error'
      save.disabled = false
      hide.disabled = false
    }
  }

  return root
}

export async function addPublicPlaceMarkers(gmap: GolarionMap, placesUrl: string, mode: 'pj' | 'mj-light' | 'mj' = 'pj'): Promise<void> {
  if (!placesUrl) return
  try {
    const response = await fetch(placesUrl, { credentials: 'omit', cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const raw = await response.json()
    const places = (Array.isArray(raw) ? raw : []).filter((value): value is PublicPlace => {
      if (!value || typeof value !== 'object') return false
      const item = value as Partial<PublicPlace>
      return typeof item.id === 'string' && typeof item.name === 'string' && Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
    })

    const entries = places.map((place) => {
      const element = markerElement(place)
      let marker: Marker
      const popup = new Popup({ offset: 18, closeButton: true })
      const popupContent = mode === 'mj-light'
        ? mjLightPopupContent(place, () => {
            popup.remove()
            marker.remove()
          })
        : basicPopupContent(place)
      popup.setDOMContent(popupContent)
      marker = new Marker({ element, anchor: 'bottom' })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(popup)
        .addTo(gmap.map)
      return { marker, element }
    })

    const updateLabelDensity = () => {
      const showLabels = gmap.map.getZoom() >= 5.5
      for (const { element } of entries) element.classList.toggle('labels-hidden', !showLabels)
    }
    updateLabelDensity()
    gmap.map.on('zoomend', updateLabelDensity)
  } catch (error) {
    console.warn('Impossible de charger les lieux PF2 de la carte.', error)
  }
}
