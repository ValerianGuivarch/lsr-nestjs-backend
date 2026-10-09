import { LngLat, Popup, type MapGeoJSONFeature, type MapLayerMouseEvent, type MapMouseEvent } from 'maplibre-gl'
import { type MultiPoint, type Point } from 'geojson'
import { GolarionMap } from './GolarionMap'
import changeCursor from './ChangeCursor'

type SourceCuration = {
  sourceKey: string
  fid: number
  category: string
  kind: 'city' | 'location'
  label: string
  type: string
  sourceUrl: string | null
  automaticVisibility: 'visible' | 'hidden'
  visibility: 'automatic' | 'visible' | 'hidden'
  effectiveVisible: boolean
  publicLabel: string
  publicText: string
}

function clickableFeature(e: MapMouseEvent & {features?: MapGeoJSONFeature[]}) {
  for (const feature of e.features || []) {
    if (feature.properties?.fid !== undefined) return feature
  }
}

const loaded = Array<boolean>(10).fill(false)
const texts = new Map<number, string>()

async function getTextForFeature(feature: MapGeoJSONFeature) {
  const id = feature.properties?.fid as number | undefined
  if (id === undefined) return undefined
  const slice = id % 10
  if (!loaded[slice]) {
    const response = await fetch(`extra/${slice}.json?v=${BUILD_DATA_HASH}`)
    if (!response.ok) throw new Error(`Failed to load location texts: ${response.statusText}`)
    const extra = await response.json() as Record<number, string>
    for (const [rawId, text] of Object.entries(extra)) texts.set(parseInt(rawId), text)
    loaded[slice] = true
  }
  return texts.get(id)
}

async function loadCuration(fid: number, label: string): Promise<SourceCuration | null> {
  const base = window.GOLARION_MAP_CONFIG?.curationUrl ?? ''
  if (!base) return null
  try {
    const response = await fetch(`${base}/${fid}?label=${encodeURIComponent(label)}`, { credentials: 'omit', cache: 'no-store' })
    if (!response.ok) return null
    return await response.json() as SourceCuration
  } catch (error) {
    console.warn('Impossible de charger la curation PJ.', error)
    return null
  }
}

function curationPanel(data: SourceCuration): HTMLElement {
  const panel = document.createElement('section')
  panel.className = 'pf2-map-curation'

  const heading = document.createElement('strong')
  heading.textContent = 'Visibilité joueurs'
  panel.appendChild(heading)

  const status = document.createElement('div')
  status.className = `pf2-map-curation-status ${data.effectiveVisible ? 'visible' : 'hidden'}`
  const automatic = data.visibility === 'automatic' ? ` (automatique : ${data.automaticVisibility === 'visible' ? 'visible' : 'masqué'})` : ''
  status.textContent = `Actuellement : ${data.effectiveVisible ? 'visible' : 'masqué'}${automatic}`
  panel.appendChild(status)

  const visibilityLabel = document.createElement('label')
  visibilityLabel.textContent = 'Règle'
  const visibility = document.createElement('select')
  for (const [value, label] of [
    ['automatic', `Automatique (${data.automaticVisibility === 'visible' ? 'visible' : 'masqué'})`],
    ['visible', 'Visible pour les PJ'],
    ['hidden', 'Masqué aux PJ'],
  ] as const) {
    const option = document.createElement('option')
    option.value = value
    option.textContent = label
    visibility.appendChild(option)
  }
  visibility.value = data.visibility
  visibilityLabel.appendChild(visibility)
  panel.appendChild(visibilityLabel)

  const publicLabelWrapper = document.createElement('label')
  publicLabelWrapper.textContent = 'Nom PJ (facultatif)'
  const publicLabel = document.createElement('input')
  publicLabel.type = 'text'
  publicLabel.maxLength = 200
  publicLabel.placeholder = data.label
  publicLabel.value = data.publicLabel
  publicLabelWrapper.appendChild(publicLabel)
  panel.appendChild(publicLabelWrapper)

  const textWrapper = document.createElement('label')
  textWrapper.textContent = 'Description PJ locale'
  const publicText = document.createElement('textarea')
  publicText.rows = 4
  publicText.maxLength = 4000
  publicText.placeholder = 'Quelques informations que les joueurs peuvent connaître. Aucun texte PathfinderWiki n’est repris automatiquement.'
  publicText.value = data.publicText
  textWrapper.appendChild(publicText)
  panel.appendChild(textWrapper)

  const save = document.createElement('button')
  save.type = 'button'
  save.textContent = 'Enregistrer'
  save.className = 'pf2-map-curation-save'
  panel.appendChild(save)

  save.addEventListener('click', async () => {
    const url = window.GOLARION_MAP_CONFIG?.visibilityUrl ?? ''
    if (!url) return
    save.disabled = true
    try {
      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: data.fid,
          label: data.label,
          visibility: visibility.value,
          publicLabel: publicLabel.value,
          publicText: publicText.value,
        }),
      })
      if (!response.ok) throw new Error(await response.text())
      const updated = await response.json() as SourceCuration
      const replacement = curationPanel(updated)
      panel.replaceWith(replacement)
    } catch (error) {
      save.disabled = false
      status.textContent = `Erreur : ${error instanceof Error ? error.message : String(error)}`
      status.className = 'pf2-map-curation-status hidden'
    }
  })

  return panel
}

export function makeLocationsClickable(gmap: GolarionMap) {
  const map = gmap.map
  function showPointer(e: MapMouseEvent & {features?: MapGeoJSONFeature[]}) {
    if (gmap.mode !== 'view') return
    if (clickableFeature(e)) changeCursor(gmap, 'pointer')
  }
  function hidePointer() {
    if (gmap.mode === 'view') changeCursor(gmap, '')
  }

  map.on('mouseenter', 'location-icons', showPointer)
  map.on('mouseenter', 'location-labels', showPointer)
  map.on('mouseleave', 'location-icons', hidePointer)
  map.on('mouseleave', 'location-labels', hidePointer)

  const popup = new Popup({ maxWidth: '520px' })
  async function clickOnWikilink(e: MapLayerMouseEvent) {
    if (gmap.mode !== 'view') return
    const feature = clickableFeature(e)
    const fid = Number(feature?.properties?.fid)
    if (!feature || !Number.isInteger(fid)) return
    const sourceLabel = typeof feature.properties?.label === 'string' ? feature.properties.label : ''
    const [text, curation] = await Promise.all([getTextForFeature(feature), loadCuration(fid, sourceLabel)])
    if (!text && !curation) return

    const geom = feature.geometry as Point | MultiPoint
    let coordinates: [number, number]
    if (geom.type === 'MultiPoint') {
      coordinates = (geom.coordinates.slice() as [number, number][]).reduce((prev, curr) => {
        if (prev === undefined) return curr
        const prevDist = e.lngLat.distanceTo(new LngLat(...prev))
        const currDist = e.lngLat.distanceTo(new LngLat(...curr))
        return prevDist < currDist ? prev : curr
      })
    } else {
      coordinates = geom.coordinates.slice() as [number, number]
    }
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360

    const root = document.createElement('div')
    root.className = 'wiki-popup'
    if (text) {
      const official = document.createElement('div')
      official.className = 'pf2-map-official'
      official.innerHTML = text
      root.appendChild(official)
    }
    if (curation) root.appendChild(curationPanel(curation))

    popup.setLngLat(coordinates).setDOMContent(root).addTo(map)
  }

  map.on('click', 'location-icons', clickOnWikilink)
  map.on('click', 'location-labels', clickOnWikilink)
}
