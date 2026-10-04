import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { regionContains } from './geography'

type Lieu = {
  id: string
  nom: string
  type: string
  region_id?: string | null
  parent_id?: string | null
  description: string
  histoire?: string
  factions: string[]
  personnages_cles: string[]
  tags: string[]
  image: string
  aliases: string[]
  statut: string
  notes?: string
  source?: string
  evenements: string[]
  map_visible?: boolean
  map_latitude?: number | null
  map_longitude?: number | null
  map_text?: string
  map_icon?: string
  [key: string]: unknown
}

type RefItem = { id: string; nom: string }
type Draft = {
  nom: string
  type: string
  region_id: string
  parent_id: string
  description: string
  histoire: string
  factions: string
  personnages_cles: string
  tags: string
  image: string
  aliases: string
  statut: string
  notes: string
  source: string
  evenements: string
  map_visible: boolean
  map_latitude: string
  map_longitude: string
  map_text: string
  map_icon: string
}

const mapIcons = [
  ['pin', '● Repère'],
  ['city', '◆ Ville'],
  ['lodge', '⌂ Loge / bâtiment'],
  ['ruins', '✦ Ruines'],
  ['camp', '▲ Camp'],
  ['danger', '⚠ Danger'],
  ['portal', '✧ Portail / magie'],
] as const

const emptyDraft: Draft = {
  nom: '', type: 'Site', region_id: '', parent_id: '', description: '', histoire: '', factions: '', personnages_cles: '', tags: '', image: '', aliases: '', statut: 'Actif', notes: '', source: '', evenements: '',
  map_visible: false, map_latitude: '', map_longitude: '', map_text: '', map_icon: 'pin',
}

const jsonTemplate: Lieu = {
  id: 'lieu_exemple', nom: 'Lieu exemple', type: 'Site', region_id: null, parent_id: null, description: 'Description courte.', histoire: '', factions: [], personnages_cles: [], tags: [], image: '', aliases: [], statut: 'Actif', notes: '', source: '', evenements: [],
  map_visible: false, map_latitude: null, map_longitude: null, map_text: '', map_icon: 'pin',
}

const csv = (v: string) => [...new Set(v.split(',').map(x => x.trim()).filter(Boolean))]
const slugId = (v: string) => 'lieu_' + v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const unique = (v: string[]) => [...new Set(v.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'))
const numberOrNull = (value: string): number | null => value.trim() === '' ? null : Number(value)

const coordinateOrNull = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : typeof value === 'string' && value.trim() && Number.isFinite(Number(value)) ? Number(value) : null

const normalizeLieu = (x: any): Lieu => ({
  ...x,
  id: typeof x?.id === 'string' ? x.id : '',
  nom: typeof x?.nom === 'string' ? x.nom : '',
  type: typeof x?.type === 'string' ? x.type : 'Site',
  region_id: x?.region_id ?? null,
  parent_id: x?.parent_id ?? null,
  description: typeof x?.description === 'string' ? x.description : '',
  histoire: typeof x?.histoire === 'string' ? x.histoire : '',
  factions: Array.isArray(x?.factions) ? x.factions : [],
  personnages_cles: Array.isArray(x?.personnages_cles) ? x.personnages_cles : [],
  tags: Array.isArray(x?.tags) ? x.tags : [],
  image: typeof x?.image === 'string' ? x.image : '',
  aliases: Array.isArray(x?.aliases) ? x.aliases : [],
  statut: typeof x?.statut === 'string' ? x.statut : 'Actif',
  notes: typeof x?.notes === 'string' ? x.notes : '',
  source: typeof x?.source === 'string' ? x.source : '',
  evenements: Array.isArray(x?.evenements) ? x.evenements : [],
  map_visible: x?.map_visible === true,
  map_latitude: coordinateOrNull(x?.map_latitude),
  map_longitude: coordinateOrNull(x?.map_longitude),
  map_text: typeof x?.map_text === 'string' ? x.map_text : '',
  map_icon: typeof x?.map_icon === 'string' && x.map_icon ? x.map_icon : 'pin',
})

const draftFromLieu = (x: Lieu): Draft => ({
  nom: x.nom,
  type: x.type,
  region_id: x.region_id ?? '',
  parent_id: x.parent_id ?? '',
  description: x.description,
  histoire: x.histoire ?? '',
  factions: x.factions.join(', '),
  personnages_cles: x.personnages_cles.join(', '),
  tags: x.tags.join(', '),
  image: x.image,
  aliases: x.aliases.join(', '),
  statut: x.statut,
  notes: x.notes ?? '',
  source: x.source ?? '',
  evenements: x.evenements.join(', '),
  map_visible: x.map_visible === true,
  map_latitude: x.map_latitude == null ? '' : String(x.map_latitude),
  map_longitude: x.map_longitude == null ? '' : String(x.map_longitude),
  map_text: x.map_text ?? '',
  map_icon: x.map_icon ?? 'pin',
})

function isLieu(v: unknown): v is Lieu {
  if (!v || typeof v !== 'object') return false
  const x = v as Partial<Lieu>
  return typeof x.nom === 'string' && typeof x.description === 'string' && Array.isArray(x.factions) && Array.isArray(x.personnages_cles) && Array.isArray(x.tags) && typeof x.image === 'string'
}

const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function LieuxPage({ initialSelectedId }: { initialSelectedId?: string }) {
  const [items, setItems] = useState<Lieu[]>([])
  const [pnjs, setPnjs] = useState<RefItem[]>([])
  const [factions, setFactions] = useState<RefItem[]>([])
  const [regions, setRegions] = useState<RefItem[]>([])
  const [events, setEvents] = useState<RefItem[]>([])
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [region, setRegion] = useState('')
  const [statut, setStatut] = useState('')
  const [selected, setSelected] = useState<Lieu | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const get = async (url: string) => {
    try {
      const r = await fetch(url, { cache: 'no-store' })
      if (!r.ok) return []
      const p = await r.json()
      return Array.isArray(p) ? p : p.items ?? []
    } catch { return [] }
  }

  const load = async () => {
    const r = await fetch('/apil7r/pf2-mj/lieux', { cache: 'no-store' })
    if (!r.ok) throw new Error('Impossible de charger les lieux.')
    const p = await r.json()
    const rawItems = Array.isArray(p) ? p : p.items ?? []
    setItems(rawItems.map(normalizeLieu))
    const [a, b, c, d] = await Promise.all([
      get('/apil7r/pf2-mj/pnj'), get('/apil7r/pf2-mj/factions'), get('/apil7r/pf2-mj/regions'), get('/apil7r/pf2-mj/evenements'),
    ])
    setPnjs(a); setFactions(b); setRegions(c); setEvents(d)
  }

  useEffect(() => { load().catch(e => setMessage(e instanceof Error ? e.message : String(e))) }, [])
  useEffect(() => {
    if (!initialSelectedId) return
    const target = items.find(item => item.id === initialSelectedId)
    if (target) setSelected(target)
  }, [initialSelectedId, items])

  const maps = useMemo(() => ({
    lieux: new Map(items.map(x => [x.id, x.nom])),
    pnjs: new Map(pnjs.map(x => [x.id, x.nom])),
    factions: new Map(factions.map(x => [x.id, x.nom])),
    regions: new Map(regions.map(x => [x.id, x.nom])),
    events: new Map(events.map(x => [x.id, x.nom])),
  }), [items, pnjs, factions, regions, events])
  const name = (k: keyof typeof maps, id?: string | null) => id ? (maps[k].get(id) ?? id) : '—'
  const types = useMemo(() => unique(items.map(x => x.type)), [items])
  const statuts = useMemo(() => unique(items.map(x => x.statut)), [items])
  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return items.filter(x => {
      const h = normalize([x.nom, x.type, x.description, x.histoire, x.source, x.map_text, ...x.tags, ...x.aliases].filter(Boolean).join(' '))
      return (!q || h.includes(q)) && (!type || x.type === type) && (!region || regionContains(region, x.region_id)) && (!statut || x.statut === statut)
    }).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  }, [items, query, type, region, statut])

  const openAdd = () => { setEditingId(null); setDraft(emptyDraft); setShowForm(true) }
  const openEdit = (item: Lieu) => { setEditingId(item.id); setDraft(draftFromLieu(item)); setSelected(null); setShowForm(true) }

  const save = async () => {
    if (!draft.nom.trim()) { setMessage('Le nom est obligatoire.'); return }
    const latitude = numberOrNull(draft.map_latitude)
    const longitude = numberOrNull(draft.map_longitude)
    if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) { setMessage('Latitude invalide : valeur attendue entre -90 et 90.'); return }
    if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) { setMessage('Longitude invalide : valeur attendue entre -180 et 180.'); return }
    setBusy(true)
    try {
      const base = editingId ? items.find(item => item.id === editingId) : undefined
      const item: Lieu = {
        ...(base ?? {}),
        id: base?.id ?? slugId(draft.nom),
        nom: draft.nom.trim(), type: draft.type || 'Site', region_id: draft.region_id || null, parent_id: draft.parent_id || null,
        description: draft.description.trim(), histoire: draft.histoire.trim(), factions: csv(draft.factions), personnages_cles: csv(draft.personnages_cles), tags: csv(draft.tags), image: draft.image.trim(), aliases: csv(draft.aliases), statut: draft.statut || 'Actif', notes: draft.notes.trim(), source: draft.source.trim(), evenements: csv(draft.evenements),
        map_visible: draft.map_visible, map_latitude: latitude, map_longitude: longitude, map_text: draft.map_text.trim(), map_icon: draft.map_icon || 'pin',
      }
      const r = await fetch('/apil7r/pf2-mj/lieux', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'upsert', item }) })
      const p = await r.json().catch(() => null)
      if (!r.ok) throw new Error(p?.error || `Erreur HTTP ${r.status}`)
      const next = (Array.isArray(p.items) ? p.items : []).map(normalizeLieu)
      setItems(next)
      const saved = next.find((candidate: Lieu) => candidate.id === item.id) ?? item
      setShowForm(false); setEditingId(null); setDraft(emptyDraft); setSelected(saved)
      setMessage(`${item.nom} enregistré.`)
    } catch (e) { setMessage(e instanceof Error ? e.message : String(e)) }
    finally { setBusy(false) }
  }

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const parsed = JSON.parse(await file.text())
      const raw = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.items) ? parsed.items : [parsed]
      const imported: Lieu[] = raw.map((x: any) => normalizeLieu({ ...x, id: x.id || slugId(x.nom || '') }))
      if (imported.some(x => !isLieu(x))) throw new Error('Le JSON contient au moins un lieu invalide.')
      const r = await fetch('/apil7r/pf2-mj/lieux', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'import', items: imported }) })
      const p = await r.json().catch(() => null)
      if (!r.ok) throw new Error(p?.error || `Erreur HTTP ${r.status}`)
      setItems((Array.isArray(p.items) ? p.items : []).map(normalizeLieu))
      setMessage(`${imported.length} lieu${imported.length > 1 ? 'x' : ''} importé${imported.length > 1 ? 's' : ''}.`)
    } catch (e) { setMessage(e instanceof Error ? e.message : String(e)) }
    finally { setBusy(false) }
  }

  return <main className="lp"><style>{`
    .lp{max-width:1500px;margin:auto;padding:24px;color:#252a25}.bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.bar h1{margin-right:auto}.btn,.file{border:1px solid #c9b98f;background:#fffaf0;color:#6e5319;border-radius:8px;padding:9px 12px;font-weight:700;cursor:pointer}.btn.primary{background:#765719;color:white}.file input{display:none}.msg{min-height:24px;font-size:13px;color:#5d614f}.filters{display:grid;grid-template-columns:2fr repeat(3,1fr);gap:9px;margin:10px 0 18px}.filters input,.filters select,.form input,.form textarea,.form select{width:100%;box-sizing:border-box;border:1px solid #d6cdbd;border-radius:8px;background:#fffdf8;padding:9px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}.card{border:1px solid #ded7cb;background:#fffdf9;border-radius:12px;overflow:hidden}.body{padding:13px}.card h2{margin:0 0 5px;font-size:17px}.meta{font-size:12px;color:#777}.desc{font-size:13px;line-height:1.45}.chips{display:flex;gap:5px;flex-wrap:wrap}.chip{border:1px solid #d9cfba;border-radius:999px;padding:3px 7px;font-size:10px;background:#faf5e9}.chip.map{border-color:#8fa986;background:#eef8eb;color:#31562c}.chip.map-missing{border-color:#c9a36a;background:#fff5df;color:#765719}.card-actions{display:grid;grid-template-columns:1fr 1fr}.more{border:0;border-top:1px solid #eee7da;background:#faf7f0;padding:8px;font-weight:700;color:#66542b;cursor:pointer}.more+.more{border-left:1px solid #eee7da}.back{position:fixed;inset:0;background:#0006;display:grid;place-items:center;padding:20px;z-index:50}.dialog{width:min(850px,100%);max-height:90vh;overflow:auto;background:#fffdf9;border-radius:14px;padding:18px}.head{display:flex;gap:10px;align-items:center}.head h2{margin-right:auto}.form{display:grid;grid-template-columns:1fr 1fr;gap:10px}.form .wide{grid-column:1/-1}.form label{font-size:12px;font-weight:700;display:grid;gap:5px}.map-fields{grid-column:1/-1;border:1px solid #d9cfba;border-radius:10px;padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#faf7f0}.map-fields h3{grid-column:1/-1;margin:0;font-size:14px}.map-fields .wide{grid-column:1/-1}.check{display:flex!important;grid-column:1/-1;grid-template-columns:none!important;align-items:center;gap:8px}.check input{width:auto}.hint{font-size:11px;color:#777;font-weight:400}.actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}.detail dl{display:grid;grid-template-columns:140px 1fr;gap:7px 10px;font-size:13px}.detail dd{margin:0}.count{font-size:12px;color:#777}@media(max-width:650px){.filters,.form,.map-fields{grid-template-columns:1fr}.form .wide,.map-fields .wide,.map-fields h3{grid-column:auto}.card-actions{grid-template-columns:1fr}}
  `}</style>
    <div className="bar"><h1>Lieux</h1><button className="btn primary" onClick={openAdd}>+ Ajouter</button><label className="file">Importer JSON<input type="file" accept=".json,application/json" onChange={importJson}/></label><button className="btn" onClick={() => downloadJson('lieu-modele.json', jsonTemplate)}>Modèle JSON</button><button className="btn" onClick={() => downloadJson('lieux-export.json', items)}>Exporter</button></div>
    <div className="msg">{busy ? 'Enregistrement…' : message}</div>
    <section className="filters"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un lieu…"/><select value={type} onChange={e => setType(e.target.value)}><option value="">Tous les types</option>{types.map(v => <option key={v}>{v}</option>)}</select><select value={region} onChange={e => setRegion(e.target.value)}><option value="">Toutes les régions</option>{regions.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}</select><select value={statut} onChange={e => setStatut(e.target.value)}><option value="">Tous les statuts</option>{statuts.map(v => <option key={v}>{v}</option>)}</select></section>
    <p className="count">{filtered.length} lieu{filtered.length > 1 ? 'x' : ''} sur {items.length}</p>
    <section className="grid">{filtered.map(x => {
      const positioned = x.map_latitude != null && x.map_longitude != null
      return <article className="card" key={x.id}><div className="body"><h2>{x.nom}</h2><div className="meta">{x.type} · {name('regions', x.region_id)} · {x.statut}</div><p className="desc">{x.description}</p><div className="chips">{x.map_visible && <span className={`chip map${positioned ? '' : ' map-missing'}`}>{positioned ? 'Carte visible' : 'Carte : coordonnées manquantes'}</span>}{x.tags.slice(0, 4).map(t => <span className="chip" key={t}>{t}</span>)}</div></div><div className="card-actions"><button className="more" onClick={() => setSelected(x)}>Voir la fiche</button><button className="more" onClick={() => openEdit(x)}>Éditer</button></div></article>
    })}</section>

    {showForm && <div className="back" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false) }}><section className="dialog"><div className="head"><h2>{editingId ? 'Modifier le lieu' : 'Ajouter un lieu'}</h2><button className="btn" onClick={() => setShowForm(false)}>Fermer</button></div><div className="form">
      <label>Nom<input value={draft.nom} onChange={e => setDraft({ ...draft, nom: e.target.value })}/></label><label>Type<input value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })}/></label><label>Région<select value={draft.region_id} onChange={e => setDraft({ ...draft, region_id: e.target.value })}><option value="">Aucune</option>{regions.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}</select></label><label>Lieu parent<select value={draft.parent_id} onChange={e => setDraft({ ...draft, parent_id: e.target.value })}><option value="">Aucun</option>{items.filter(v => v.id !== editingId).map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}</select></label>
      <label className="wide">Description<textarea rows={3} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })}/></label><label className="wide">Histoire<textarea rows={4} value={draft.histoire} onChange={e => setDraft({ ...draft, histoire: e.target.value })}/></label><label>Factions (IDs)<input value={draft.factions} onChange={e => setDraft({ ...draft, factions: e.target.value })}/></label><label>PNJ clés (IDs)<input value={draft.personnages_cles} onChange={e => setDraft({ ...draft, personnages_cles: e.target.value })}/></label><label>Tags<input value={draft.tags} onChange={e => setDraft({ ...draft, tags: e.target.value })}/></label><label>Alias<input value={draft.aliases} onChange={e => setDraft({ ...draft, aliases: e.target.value })}/></label><label>Statut<input value={draft.statut} onChange={e => setDraft({ ...draft, statut: e.target.value })}/></label><label>Événements (IDs)<input value={draft.evenements} onChange={e => setDraft({ ...draft, evenements: e.target.value })}/></label><label>Image<input value={draft.image} onChange={e => setDraft({ ...draft, image: e.target.value })}/></label><label>Source<input value={draft.source} onChange={e => setDraft({ ...draft, source: e.target.value })}/></label><label className="wide">Notes<textarea rows={3} value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })}/></label>
      <section className="map-fields"><h3>Carte de Golarion</h3><label className="check"><input type="checkbox" checked={draft.map_visible} onChange={e => setDraft({ ...draft, map_visible: e.target.checked })}/>Afficher ce lieu sur la carte publique</label><label>Latitude<input type="number" step="any" min="-90" max="90" value={draft.map_latitude} onChange={e => setDraft({ ...draft, map_latitude: e.target.value })}/><span className="hint">Ex. 12.3456</span></label><label>Longitude<input type="number" step="any" min="-180" max="180" value={draft.map_longitude} onChange={e => setDraft({ ...draft, map_longitude: e.target.value })}/><span className="hint">Ex. -45.6789</span></label><label>Icône<select value={draft.map_icon} onChange={e => setDraft({ ...draft, map_icon: e.target.value })}>{mapIcons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="wide">Texte affiché sur la carte<textarea rows={3} value={draft.map_text} onChange={e => setDraft({ ...draft, map_text: e.target.value })} placeholder="Texte public affiché quand on clique sur le repère."/></label></section>
    </div><div className="actions"><button className="btn" onClick={() => setShowForm(false)}>Annuler</button><button className="btn primary" onClick={save}>Enregistrer</button></div></section></div>}

    {selected && <div className="back" onMouseDown={e => { if (e.target === e.currentTarget) setSelected(null) }}><article className="dialog detail"><div className="head"><h2>{selected.nom}</h2><button className="btn" onClick={() => openEdit(selected)}>Éditer</button><button className="btn" onClick={() => setSelected(null)}>Fermer</button></div><p>{selected.description}</p><dl><dt>Type</dt><dd>{selected.type}</dd><dt>Région</dt><dd>{name('regions', selected.region_id)}</dd><dt>Parent</dt><dd>{name('lieux', selected.parent_id)}</dd><dt>Histoire</dt><dd>{selected.histoire || '—'}</dd><dt>Factions</dt><dd>{selected.factions.map(id => name('factions', id)).join(' · ') || '—'}</dd><dt>PNJ clés</dt><dd>{selected.personnages_cles.map(id => name('pnjs', id)).join(' · ') || '—'}</dd><dt>Événements</dt><dd>{selected.evenements.map(id => name('events', id)).join(' · ') || '—'}</dd><dt>Tags</dt><dd>{selected.tags.join(' · ') || '—'}</dd><dt>Statut</dt><dd>{selected.statut}</dd><dt>Carte</dt><dd>{selected.map_visible ? 'Visible' : 'Masqué'}{selected.map_latitude != null && selected.map_longitude != null ? ` · ${selected.map_latitude}, ${selected.map_longitude}` : ' · coordonnées non définies'}</dd><dt>Texte carte</dt><dd>{selected.map_text || '—'}</dd><dt>Source</dt><dd>{selected.source || '—'}</dd><dt>Notes</dt><dd>{selected.notes || '—'}</dd></dl></article></div>}
  </main>
}
