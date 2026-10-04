import { Marker, Popup } from 'maplibre-gl'
import { GolarionMap } from './GolarionMap'

type PublicPlace = {
  id: string
  name: string
  latitude: number
  longitude: number
  text: string
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

function popupContent(place: PublicPlace): HTMLElement {
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

export async function addPublicPlaceMarkers(gmap: GolarionMap, placesUrl: string): Promise<void> {
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
      const popup = new Popup({ offset: 18, closeButton: true }).setDOMContent(popupContent(place))
      const marker = new Marker({ element, anchor: 'bottom' })
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
