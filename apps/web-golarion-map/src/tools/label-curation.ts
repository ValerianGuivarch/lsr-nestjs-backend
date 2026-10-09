import { Popup, type MapLayerMouseEvent } from 'maplibre-gl'
import { applyPlayerMapVisibilityFilters, getMapVisibility, overrideKey, playerCuratableLabelLayers, resetMapVisibilityCache, type MapVisibilityOverride } from '../utils/map-visibility'
import type { SearchCategory } from '../utils/fuzzy-search'
import type { GolarionMap } from './GolarionMap'
import { createMjLightCurationPanel } from './mj-light-curation'

const hiddenPreferred = new Set(['buildings', 'districts', 'generic', 'specials'])

async function categoryIndex(): Promise<Map<string, string[]>> {
  const response = await fetch(`./search.json?v=${BUILD_DATA_HASH}`)
  if (!response.ok) return new Map()
  const search = await response.json() as SearchCategory[]
  const result = new Map<string, string[]>()
  for (const category of search) {
    for (const entry of category.entries) {
      const values = result.get(entry.label) ?? []
      values.push(category.category)
      result.set(entry.label, values)
    }
  }
  return result
}

function bestCategory(label: string, explicitType: string, index: Map<string, string[]>): string | null {
  if (explicitType) return explicitType
  const categories = index.get(label) ?? []
  return categories.find(category => hiddenPreferred.has(category))
    ?? categories.find(category => category !== 'locations')
    ?? categories[0]
    ?? null
}

function panel(
  category: string,
  label: string,
  automaticVisible: boolean,
  existing: MapVisibilityOverride | undefined,
): HTMLElement {
  const root = document.createElement('section')
  root.className = 'pf2-map-curation'
  const heading = document.createElement('strong')
  heading.textContent = 'Visibilité joueurs'
  root.appendChild(heading)

  const effectiveVisible = existing ? existing.visibility === 'visible' : automaticVisible
  const status = document.createElement('div')
  status.className = `pf2-map-curation-status ${effectiveVisible ? 'visible' : 'hidden'}`
  status.textContent = `Actuellement : ${effectiveVisible ? 'visible' : 'masqué'}${existing ? '' : ` (automatique)`}`
  root.appendChild(status)

  const ruleLabel = document.createElement('label')
  ruleLabel.textContent = 'Règle'
  const rule = document.createElement('select')
  for (const [value, text] of [
    ['automatic', `Automatique (${automaticVisible ? 'visible' : 'masqué'})`],
    ['visible', 'Visible pour les PJ'],
    ['hidden', 'Masqué aux PJ'],
  ]) {
    const option = document.createElement('option')
    option.value = value
    option.textContent = text
    rule.appendChild(option)
  }
  rule.value = existing?.visibility ?? 'automatic'
  ruleLabel.appendChild(rule)
  root.appendChild(ruleLabel)

  const nameLabel = document.createElement('label')
  nameLabel.textContent = 'Nom PJ (facultatif)'
  const publicLabel = document.createElement('input')
  publicLabel.maxLength = 200
  publicLabel.placeholder = label
  publicLabel.value = existing?.publicLabel ?? ''
  nameLabel.appendChild(publicLabel)
  root.appendChild(nameLabel)

  const descriptionLabel = document.createElement('label')
  descriptionLabel.textContent = 'Description PJ locale'
  const publicText = document.createElement('textarea')
  publicText.rows = 4
  publicText.maxLength = 4000
  publicText.value = existing?.publicText ?? ''
  publicText.placeholder = 'Description courte visible par les joueurs.'
  descriptionLabel.appendChild(publicText)
  root.appendChild(descriptionLabel)

  const mjDescriptionLabel = document.createElement('label')
  mjDescriptionLabel.textContent = 'Détails MJ (optionnel)'
  const mjText = document.createElement('textarea')
  mjText.rows = 4
  mjText.maxLength = 6000
  mjText.value = existing?.mjText ?? ''
  mjText.placeholder = 'Informations utiles au MJ seulement.'
  mjDescriptionLabel.appendChild(mjText)
  root.appendChild(mjDescriptionLabel)

  const save = document.createElement('button')
  save.type = 'button'
  save.className = 'pf2-map-curation-save'
  save.textContent = 'Enregistrer'
  root.appendChild(save)
  save.onclick = async () => {
    const url = window.GOLARION_MAP_CONFIG?.visibilityUrl ?? ''
    if (!url) return
    save.disabled = true
    try {
      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          label,
          visibility: rule.value,
          publicLabel: publicLabel.value,
          publicText: publicText.value,
          mjText: mjText.value,
        }),
      })
      if (!response.ok) throw new Error(await response.text())
      resetMapVisibilityCache()
      status.textContent = 'Enregistré. Recharge la carte PJ pour voir le résultat.'
      status.className = 'pf2-map-curation-status visible'
      save.disabled = false
    } catch (error) {
      status.textContent = `Erreur : ${error instanceof Error ? error.message : String(error)}`
      status.className = 'pf2-map-curation-status hidden'
      save.disabled = false
    }
  }
  return root
}

export async function makeLabelsCuratable(gmap: GolarionMap): Promise<void> {
  const [index, visibility] = await Promise.all([categoryIndex(), getMapVisibility()])
  if (!gmap.map.isStyleLoaded()) {
    await new Promise<void>(resolve => gmap.map.once('load', () => resolve()))
  }
  const autoVisible = new Set(visibility.autoVisibleCategories)
  const overrideMap = new Map(visibility.overrides.map(item => [overrideKey(item.category, item.label), item]))
  const popup = new Popup({ maxWidth: '420px' })

  const open = (event: MapLayerMouseEvent) => {
    const properties = event.features?.[0]?.properties ?? {}
    const label = typeof properties.label === 'string' ? properties.label : ''
    if (!label) return
    const category = bestCategory(label, typeof properties.type === 'string' ? properties.type : '', index)
    if (!category || category === 'locations') return
    const container = document.createElement('div')
    container.className = 'wiki-popup'
    const title = document.createElement('h3')
    title.textContent = label
    container.appendChild(title)
    container.appendChild(panel(category, label, autoVisible.has(category), overrideMap.get(overrideKey(category, label))))
    popup.setLngLat(event.lngLat).setDOMContent(container).addTo(gmap.map)
  }

  for (const layerId of playerCuratableLabelLayers) {
    if (!gmap.map.getLayer(layerId)) continue
    gmap.map.on('click', layerId, open)
  }
}

export async function makeMjLightLabelsCuratable(gmap: GolarionMap): Promise<void> {
  const [index, visibility] = await Promise.all([categoryIndex(), getMapVisibility(true)])
  if (!gmap.map.isStyleLoaded()) {
    await new Promise<void>(resolve => gmap.map.once('load', () => resolve()))
  }
  const autoVisible = new Set(visibility.autoVisibleCategories)
  const overrideMap = new Map(visibility.overrides.map(item => [overrideKey(item.category, item.label), item]))
  const popup = new Popup({ maxWidth: '420px' })

  const open = (event: MapLayerMouseEvent) => {
    const properties = event.features?.[0]?.properties ?? {}
    const label = typeof properties.label === 'string' ? properties.label : ''
    if (!label) return
    const category = bestCategory(label, typeof properties.type === 'string' ? properties.type : '', index)
    if (!category || category === 'locations') return
    const existing = overrideMap.get(overrideKey(category, label))
    const effectiveVisible = existing ? existing.visibility === 'visible' : autoVisible.has(category)
    if (!effectiveVisible) return

    const root = document.createElement('div')
    root.className = 'pf2-player-source-popup'
    const title = document.createElement('strong')
    title.textContent = existing?.publicLabel?.trim() || label
    root.appendChild(title)

    const publicText = existing?.publicText ?? ''
    if (publicText.trim()) {
      const paragraph = document.createElement('p')
      paragraph.textContent = publicText
      root.appendChild(paragraph)
    }

    root.appendChild(createMjLightCurationPanel({
      category,
      label,
      publicLabel: existing?.publicLabel ?? '',
      publicText,
      mjText: existing?.mjText ?? '',
    }, {
      onHidden: () => {
        popup.remove()
        void applyPlayerMapVisibilityFilters(gmap.map, true)
      },
      onSaved: next => {
        overrideMap.set(overrideKey(category, label), {
          sourceKey: existing?.sourceKey ?? `search:${category}:${label}`,
          category,
          label,
          sourceFid: existing?.sourceFid ?? null,
          visibility: 'visible',
          publicLabel: existing?.publicLabel ?? '',
          publicText: next.publicText,
          mjText: next.mjText,
        })
      },
    }))

    popup.setLngLat(event.lngLat).setDOMContent(root).addTo(gmap.map)
  }

  for (const layerId of playerCuratableLabelLayers) {
    if (!gmap.map.getLayer(layerId)) continue
    gmap.map.on('click', layerId, open)
  }
}
