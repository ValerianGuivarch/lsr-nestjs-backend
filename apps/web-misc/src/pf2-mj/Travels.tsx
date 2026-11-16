import { useRef, useState } from 'react'
import { calculateItinerary, citySearch, getTravelCity, defaultMilesPerDay, travelModes, travelMapUrl, travelCities, type TravelMode, type TravelResult, type TravelCity, type TravelOptions } from '../../../web-golarion-map/src/tools/travel-planner'
import { formatCoins } from './priceCatalogue'
import { journeyExtras } from '../../../web-golarion-map/src/tools/travel-rates'
import './Travels.css'

const dayLabel = (n: number) => n === 0 ? '0' : n < 1 ? '< 1' : n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
function CityPicker({ title, id, change, waterMode }: { title: string; id: string; change: (id: string) => void; waterMode: boolean | 'riverboat' }) {
  const [query, setQuery] = useState('')
  const matches = citySearch(query, waterMode)
  const selected = getTravelCity(id)
  return <label className="travel-city"><span>{title}</span>
    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Chercher en français ou anglais…" aria-label={'Rechercher ' + title.toLowerCase()} />
    <select aria-label={title} value={id} onChange={e => change(e.target.value)}>
      <option value="">Choisir un lieu…</option>
      {selected && !matches.some(c => c.id === selected.id) && <option value={selected.id}>{selected.name}</option>}
      {matches.map(c => <option key={c.id} value={c.id}>{c.name}{c.name !== c.original ? ' (' + c.original + ')' : ''}</option>)}
    </select>
    <small>{matches.length} lieux{waterMode ? ' accessibles par eau (estimés)' : ''}</small>
  </label>
}
export default function TravelsPage() {
  const [from, setFrom] = useState(travelCities.find(c => c.original === 'Absalom')?.id ?? '')
  const [to, setTo] = useState('')
  const [mode, setMode] = useState<TravelMode>('mixed')
  const [landMiles, setLandMiles] = useState('20')
  const [shipMiles, setShipMiles] = useState('60')
  const [riverUpMiles, setRiverUpMiles] = useState(String(defaultMilesPerDay.riverUp))
  const [riverDownMiles, setRiverDownMiles] = useState(String(defaultMilesPerDay.riverDown))
  const [stops, setStops] = useState<Array<{ key: number; city: string }>>([])
  const nextStop = useRef(0)
  const waterMode = mode === 'riverboat' ? 'riverboat' : mode === 'ship'
  const [people, setPeople] = useState('4')
  const [food, setFood] = useState(false)
  const [lodging, setLodging] = useState(false)
  const [output, setOutput] = useState<{ from: TravelCity; to: TravelCity; mode: TravelMode; result: TravelResult | null; options: TravelOptions; via: TravelCity[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const participants = Math.max(1, Math.min(100, Math.trunc(Number(people) || 1)))
  const resetResult = () => setOutput(null)
  const changeMode = (value: TravelMode) => {
    setMode(value); setLandMiles(String(defaultMilesPerDay[value === 'mixed' || value === 'ship' || value === 'riverboat' ? 'walk' : value])); resetResult()
  }
  const go = () => {
    const a = getTravelCity(from), b = getTravelCity(to)
    const via = stops.map(s=>getTravelCity(s.city))
    if (!a || !b || via.some(s=>!s)) return
    const waypoints = via as TravelCity[]
    const miles = Math.max(1, Math.min(200, Number(landMiles) || 20))
    const sea = Math.max(1, Math.min(200, Number(shipMiles) || 60))
    const options: TravelOptions = {landMiles:miles, shipMiles:sea, riverUpMiles:Math.max(1,Math.min(200,Number(riverUpMiles)||defaultMilesPerDay.riverUp)), riverDownMiles:Math.max(1,Math.min(200,Number(riverDownMiles)||defaultMilesPerDay.riverDown))}
    setBusy(true); resetResult()
    // Yield once so the busy state is visible before the synchronous search.
    setTimeout(() => {
      try { setOutput({ from: a, to: b, mode, options, via:waypoints, result: calculateItinerary([a,...waypoints,b],mode,options) }) }
      finally { setBusy(false) }
    }, 0)
  }
  const result = output?.result
  const days = result ? Math.ceil(result.days) : 0
  const perPerson = result ? result.fareCopper + (food ? days * journeyExtras.mealsPerDay : 0) + (lodging ? days * journeyExtras.bedPerDay : 0) : 0
  return <section className="mj-travel">
    <header><small>GOLARION · AIDE À L’IMPROVISATION</small><h1>Voyages & itinéraires</h1><p>Estime les distances, la durée et le budget d’un déplacement à partir de la géographie de la carte.</p></header>
    <div className="travel-form">
      <div className={'travel-pickers'+(stops.length?' has-stops':'')}>
        <CityPicker title="Départ" id={from} change={id => { setFrom(id); resetResult() }} waterMode={waterMode} />
        <button type="button" className="travel-swap" disabled={busy} onClick={() => { setFrom(to); setTo(from); setStops(prev=>[...prev].reverse()); resetResult() }} aria-label="Inverser le départ et l’arrivée">⇄</button>
        <div className="travel-stops">
        {stops.map((stop,i)=><div className="travel-stop" key={stop.key}>
          <CityPicker title={'Étape '+(i+1)} id={stop.city} waterMode={waterMode} change={city=>{setStops(prev=>prev.map(s=>s.key===stop.key?{...s,city}:s));resetResult()}} />
          <button type="button" aria-label={'Supprimer étape '+(i+1)} onClick={()=>{setStops(prev=>prev.filter(s=>s.key!==stop.key));resetResult()}}>×</button>
        </div>)}
        <button type="button" className="travel-add-stop" disabled={stops.length>=6 || busy} onClick={()=>{const key=nextStop.current++;setStops(prev=>[...prev,{key,city:''}]);resetResult()}}>+ Ajouter une étape</button>
          {stops.length>0 && <small>Départ → étapes dans cet ordre → arrivée</small>}
        </div>
        <CityPicker title="Arrivée" id={to} change={id => { setTo(id); resetResult() }} waterMode={waterMode} />
      </div>
      <div className="travel-fields">
        <label>Transport<select value={mode} onChange={e => changeMode(e.target.value as TravelMode)}>{Object.entries(travelModes).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>
        {mode !== 'ship' && mode !== 'riverboat' && <label>Rythme terrestre (miles/jour)<input min="1" max="200" type="number" value={landMiles} onChange={e => { setLandMiles(e.target.value); resetResult() }} /></label>}
        {(mode === 'ship' || mode === 'mixed') && <label>Rythme maritime (miles/jour)<input min="1" max="200" type="number" value={shipMiles} onChange={e => { setShipMiles(e.target.value); resetResult() }} /></label>}
        {(mode === 'ship' || mode === 'mixed' || mode === 'riverboat') && <>
          <label>Rivière amont (miles/jour)<input min="1" max="200" type="number" value={riverUpMiles} onChange={e=>{setRiverUpMiles(e.target.value);resetResult()}} /></label>
          <label>Rivière aval (miles/jour)<input min="1" max="200" type="number" value={riverDownMiles} onChange={e=>{setRiverDownMiles(e.target.value);resetResult()}} /></label>
        </>}
        <label>Voyageurs<input type="number" min="1" max="100" value={people} onChange={e => setPeople(e.target.value)} /></label>
      </div>
      <div className="travel-extras"><label><input type="checkbox" checked={food} onChange={e => setFood(e.target.checked)} /> 3 repas ordinaires/jour (+9 pc)</label>
        <label><input type="checkbox" checked={lodging} onChange={e => setLodging(e.target.checked)} /> Lit chaque jour (+1 pa, optionnel)</label></div>
      <button type="button" className="travel-primary" disabled={busy || !from || !to || stops.some(s=>!s.city)} onClick={go}>{busy ? 'Calcul en cours…' : 'Calculer l’itinéraire'}</button>
    </div>
    {output && !result && <div className="travel-notice" role="status">Aucun itinéraire trouvé avec ce mode dans la zone cartographiée. Essaie un transport mixte ou une autre destination ; un passage ou une route non cartographiés peuvent manquer.</div>}
    {result && output && <article className="travel-result">
      <h2>{[output.from,...output.via,output.to].map(c=>c.name).join(' → ')}</h2>
      <div className="travel-metrics">
        <div><small>Distance estimée</small><strong>{Math.round(result.km).toLocaleString('fr-FR')} km</strong><span>{Math.round(result.km / 1.609344)} miles</span></div>
        <div><small>Durée estimée</small><strong>{dayLabel(result.days)} j</strong><span>{days} jour{days === 1 ? '' : 's'} à prévoir</span></div>
        <div><small>Coût par personne</small><strong>{formatCoins(perPerson)}</strong><span>Transport : {formatCoins(result.fareCopper)}</span></div>
        <div><small>Total · {participants} voyageurs</small><strong>{formatCoins(perPerson * participants)}</strong><span>Options incluses</span></div>
      </div>
      <h3>Étapes estimées</h3>
      <div className="travel-table"><table><thead><tr><th>Mode</th><th>Distance</th><th>Durée (jours)</th></tr></thead><tbody>{result.legs.map((leg, i) => <tr key={i}><td>{travelModes[leg.mode]}</td><td>{Math.round(leg.km)} km</td><td>{dayLabel(leg.days)}</td></tr>)}</tbody></table></div>
      {result.transfers > 0 && <p>{result.transfers} transfert{result.transfers > 1 ? 's' : ''} de transport (6 h chacun incluses).</p>}
      <a className="travel-primary" href={travelMapUrl(output.from, output.to, output.mode, output.options, output.via)} target="_blank" rel="noopener noreferrer">Voir le trajet sur la carte MJ ↗</a>
    </article>}
    <div className="travel-notice"><b>Repères MJ, pas des horaires officiels.</b> Maillage d’environ 11 km de latitude, mer Intérieure et régions voisines. La carte ne garantit pas les ponts, les cols, les ports ni la disponibilité des navires. Les forêts, collines et déserts ralentissent de moitié, marais, montagnes et glace au tiers ; une calèche évite les terrains difficiles. Les routes sont estimées à partir des tracés existants. Les grands cours d’eau sont estimés navigables ; le courant (amont/aval) est approximé selon les exutoires cartographiés. Les tarifs de transport sont calculés par distance, la monture louée par jour, les transferts par approximation. Changer le rythme pour la météo, la sécurité ou la vitesse du groupe.</div>
  </section>
}