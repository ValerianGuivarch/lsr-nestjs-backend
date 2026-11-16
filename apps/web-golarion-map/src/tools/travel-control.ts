import type { Map as GLMap, IControl, GeoJSONSource } from 'maplibre-gl'
import { calculateTravel, citySearch, defaultMilesPerDay, getTravelCity, travelModes, type TravelMode } from './travel-planner'
import './travel-control.css'

const SOURCE = 'mj-travel-route'
const LAYER = 'mj-travel-line'
const empty = (): GeoJSON.FeatureCollection<GeoJSON.LineString> => ({ type: 'FeatureCollection', features: [] })
function element<K extends keyof HTMLElementTagNameMap>(name: K, text = ''): HTMLElementTagNameMap[K] {
  const el = document.createElement(name); el.textContent = text; return el
}
export class TravelControl implements IControl {
  private map?: GLMap
  private container?: HTMLDivElement
  private cleanupLoad?: () => void
  onAdd(map: GLMap): HTMLElement {
    this.map = map
    const container = element('div'); container.className = 'maplibregl-ctrl maplibregl-ctrl-group travel-map-control'
    this.container = container
    const toggle = element('button', '↝'); toggle.title = 'Calculer un itinéraire'; toggle.setAttribute('aria-label', toggle.title); toggle.setAttribute('aria-expanded', 'false')
    const panel = element('div'); panel.className = 'travel-map-panel'; panel.hidden = true
    toggle.onclick = () => { panel.hidden = !panel.hidden; toggle.setAttribute('aria-expanded', String(!panel.hidden)) }
    const heading = element('h3', 'Itinéraire MJ')
    const mode = element('select')
    for (const [key, label] of Object.entries(travelModes)) { const op = element('option', label); op.value = key; mode.append(op) }
    mode.value = 'mixed'; mode.setAttribute('aria-label', 'Mode de transport')
    const searchPicker = (title: string) => {
      const label = element('label', title), query = element('input'), select = element('select')
      query.type = 'search'; query.placeholder = 'Chercher une ville…'; query.setAttribute('aria-label', 'Rechercher ' + title.toLowerCase())
      select.setAttribute('aria-label', title)
      const fill = (selected = select.value) => {
        select.replaceChildren()
        const placeholder = element('option', 'Choisir un lieu…'); placeholder.value = ''; select.append(placeholder)
        const matches = citySearch(query.value, mode.value === 'ship')
        const previous = getTravelCity(selected)
        if (previous && !matches.some(c => c.id === previous.id)) matches.unshift(previous)
        for (const c of matches) { const op = element('option', c.name + (c.name === c.original ? '' : ' (' + c.original + ')')); op.value = c.id; select.append(op) }
        select.value = selected
      }
      query.oninput = () => fill()
      label.append(query, select); fill()
      panel.append(label)
      return { select, fill }
    }
    panel.append(heading)
    const from = searchPicker('Départ'), to = searchPicker('Arrivée')
    const modeLabel = element('label', 'Transport'); modeLabel.append(mode); panel.append(modeLabel)
    const land = element('input'), sea = element('input')
    for (const [input, name] of [[land, 'Miles/jour à terre'], [sea, 'Miles/jour en mer']] as const) {
      const label = element('label', name); input.type = 'number'; input.min = '1'; input.max = '200'; input.setAttribute('aria-label', name); label.append(input); panel.append(label)
    }
    land.value = '20'; sea.value = '60'
    const result = element('p', 'Estimation géographique, ports côtiers non garantis.'); result.setAttribute('aria-live', 'polite')
    const calc = element('button', 'Calculer'), clear = element('button', 'Effacer')
    calc.className = 'travel-map-calc'
    const actions = element('div'); actions.className = 'travel-map-actions'; actions.append(calc, clear)
    panel.append(actions, result)
    container.append(toggle, panel)
    const setup = () => {
      if (!map.getSource(SOURCE)) map.addSource(SOURCE, { type: 'geojson', data: empty() })
      if (!map.getLayer(LAYER)) map.addLayer({ id: LAYER, type:'line', source: SOURCE, layout:{ 'line-cap':'round','line-join':'round' }, paint:{ 'line-width': 4, 'line-opacity': 0.9, 'line-color':['match',['get','mode'],'ship','#176cce','#b33128'] } })
    }
    const erase = () => (map.getSource(SOURCE) as GeoJSONSource | undefined)?.setData(empty())
    const reset = () => { erase(); result.textContent = 'Estimation géographique, ports côtiers non garantis.' }
    mode.onchange = () => {
      const m = mode.value as TravelMode
      land.value = String(defaultMilesPerDay[m === 'mixed' || m === 'ship' ? 'walk' : m])
      from.fill(); to.fill(); reset()
    }
    from.select.onchange = to.select.onchange = land.onchange = sea.onchange = reset
    clear.onclick = reset
    const run = () => {
      const a = getTravelCity(from.select.value), b = getTravelCity(to.select.value)
      if (!a || !b) { result.textContent = 'Sélectionne le départ et l’arrivée.'; return }
      if (!map.isStyleLoaded()) { result.textContent = 'La carte est en cours de chargement. Réessaie dans un instant.'; return }
      setup()
      const travel = calculateTravel(a, b, mode.value as TravelMode, { landMiles:Number(land.value), shipMiles:Number(sea.value) })
      if (!travel) { erase(); result.textContent = 'Aucun trajet trouvé avec ce transport.'; return }
      const data: GeoJSON.FeatureCollection<GeoJSON.LineString> = { type:'FeatureCollection', features: travel.legs.filter(l=>l.points.length >= 2).map(l=>({type:'Feature',geometry:{type:'LineString',coordinates:l.points},properties:{mode:l.mode}})) }
      ;(map.getSource(SOURCE) as GeoJSONSource).setData(data)
      const points = travel.legs.flatMap(l => l.points)
      if (points.length) {
        const lngs = points.map(p=>p[0]), lats=points.map(p=>p[1])
        map.fitBounds([[Math.min(...lngs),Math.min(...lats)],[Math.max(...lngs),Math.max(...lats)]],{padding:65,maxZoom:10})
      }
      result.textContent = Math.round(travel.km) + ' km · ' + travel.days.toLocaleString('fr-FR',{maximumFractionDigits:1}) + ' j · ' + (travel.fareCopper/100).toLocaleString('fr-FR',{maximumFractionDigits:2}) + ' po/personne (transport). Rouge : terre ; bleu : mer.'
    }
    calc.onclick = run
    const params = new URLSearchParams(window.location.search)
    const f = params.get('travelFrom'), t = params.get('travelTo'), m = params.get('travelMode')
    if (f && t && getTravelCity(f) && getTravelCity(t)) {
      if (m && Object.prototype.hasOwnProperty.call(travelModes, m)) mode.value = m
      mode.onchange?.(new Event('change'))
      const lm = Number(params.get('landMiles')), sm = Number(params.get('shipMiles'))
      if (lm > 0 && lm <= 200) land.value=String(lm)
      if (sm > 0 && sm <= 200) sea.value=String(sm)
      from.fill(f); to.fill(t); panel.hidden = false; toggle.setAttribute('aria-expanded','true')
      if (map.isStyleLoaded()) run()
      else { map.once('idle', run); this.cleanupLoad = () => { map.off('idle', run) } }
    }
    return container
  }
  onRemove() {
    this.cleanupLoad?.()
    if (this.map?.getLayer(LAYER)) this.map.removeLayer(LAYER)
    if (this.map?.getSource(SOURCE)) this.map.removeSource(SOURCE)
    this.container?.remove(); this.map = undefined
  }
}
