import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { containers, playableUnits, titleOf, type PlayableComponent } from './catalogue'

export type Pf2ResourceTargetKind = 'campaign' | 'scenario' | 'component'
export type Pf2ResourceLink = { targetKind: Pf2ResourceTargetKind; targetId: string; componentId: string | null; sortOrder: number }
export type Pf2ResourceFile = { id: string; resourceId: string; filename: string; label: string; mimeType: string; sizeBytes: number; sortOrder: number; createdAt: string; downloadUrl: string }
export type Pf2Resource = {
  id: string
  title: string
  description: string
  summary: string
  origin: string
  tags: string[]
  files: Pf2ResourceFile[]
  links: Pf2ResourceLink[]
  createdAt: string
  updatedAt: string
}

const suggestedTags = [
  'Quête', 'Donjon', 'Village', 'Ville', 'Ruines', 'Temple', 'Sanctuaire', 'Manoir', 'Auberge',
  'Région', 'Hexcrawl', 'Rencontre', 'Enquête', 'Mystère', 'Exploration', 'Combat', 'Social',
  'Horreur', 'Survie', 'Maritime', 'Souterrain', 'Urbain', 'Nature', 'Planaire',
  'Carte', 'Table aléatoire', 'Inspiration', 'One-shot',
]

const emptyDraft = { title: '', description: '', summary: '', origin: '', tags: [] as string[], links: [] as Pf2ResourceLink[] }

function resourceHref(id: string): string { return `/pf2-mj/resources/${encodeURIComponent(id)}` }
function apiHref(path = ''): string { return `/apil7r/pf2-mj/resources${path}` }
function unique(values: string[]): string[] { return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')) }
function bytesLabel(value: number): string {
  if (value < 1024) return `${value} o`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} Ko`
  return `${(value / (1024 * 1024)).toFixed(1)} Mo`
}

function componentOf(targetId: string, componentId: string | null): PlayableComponent | null {
  if (!componentId) return null
  const unit = playableUnits.find((candidate) => candidate.id === targetId)
  if (unit) return unit.playableComponents.find((component) => component.id === componentId) ?? null
  const container = containers.find((candidate) => candidate.id === targetId)
  return container?.playableComponents.find((component) => component.id === componentId) ?? null
}

function targetLabel(link: Pf2ResourceLink): string {
  const owner = playableUnits.find((unit) => unit.id === link.targetId) ?? containers.find((container) => container.id === link.targetId)
  const ownerTitle = owner ? titleOf(owner) : link.targetId
  if (link.targetKind !== 'component') return ownerTitle
  const component = componentOf(link.targetId, link.componentId)
  return component ? `${ownerTitle} · ${component.title}` : `${ownerTitle} · ${link.componentId ?? 'composant'}`
}

async function jsonRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.message || payload?.error || `Erreur HTTP ${response.status}`)
  return payload as T
}

export function ResourceTargetPanel({ targetKind, targetId, componentId = null }: { targetKind: Pf2ResourceTargetKind; targetId: string; componentId?: string | null }) {
  const [linked, setLinked] = useState<Pf2Resource[]>([])
  const [all, setAll] = useState<Pf2Resource[]>([])
  const [selected, setSelected] = useState('')
  const [message, setMessage] = useState('')

  const reload = async () => {
    const params = new URLSearchParams({ targetKind, targetId })
    if (componentId) params.set('componentId', componentId)
    const [current, resources] = await Promise.all([
      jsonRequest<Pf2Resource[]>(`${apiHref()}?${params.toString()}`),
      jsonRequest<Pf2Resource[]>(apiHref()),
    ])
    setLinked(current)
    setAll(resources)
  }

  useEffect(() => { void reload().catch(() => setMessage('Ressources indisponibles.')) }, [targetKind, targetId, componentId])

  const attach = async () => {
    const resource = all.find((item) => item.id === selected)
    if (!resource) return
    const key = (link: Pf2ResourceLink) => `${link.targetKind}|${link.targetId}|${link.componentId ?? ''}`
    const next: Pf2ResourceLink = { targetKind, targetId, componentId: componentId || null, sortOrder: resource.links.length }
    const links = [...resource.links]
    if (!links.some((link) => key(link) === key(next))) links.push(next)
    await jsonRequest<Pf2Resource>(apiHref(`/${encodeURIComponent(resource.id)}`), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...resource, links }),
    })
    setSelected('')
    setMessage('Ressource associée.')
    await reload()
  }

  const detach = async (resource: Pf2Resource) => {
    const links = resource.links.filter((link) => !(link.targetKind === targetKind && link.targetId === targetId && (link.componentId ?? null) === (componentId ?? null)))
    await jsonRequest<Pf2Resource>(apiHref(`/${encodeURIComponent(resource.id)}`), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...resource, links }),
    })
    await reload()
  }

  const available = all.filter((resource) => !linked.some((item) => item.id === resource.id))
  return <section className="detail-section resource-target-panel">
    <div className="resource-section-head"><div><h3>Ressources</h3><p>Documents et idées réutilisables associés à ce contenu.</p></div><Link to="/pf2-mj/resources">Ouvrir le catalogue</Link></div>
    {linked.length ? <div className="resource-linked-list">{linked.map((resource) => <article key={resource.id}><Link to={resourceHref(resource.id)}><strong>{resource.title}</strong><span>{resource.description || resource.summary || 'Sans description.'}</span></Link><button type="button" onClick={() => void detach(resource)}>Délier</button></article>)}</div> : <p className="missing">Aucune ressource associée.</p>}
    <div className="resource-attach-row"><select value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">Associer une ressource existante…</option>{available.map((resource) => <option key={resource.id} value={resource.id}>{resource.title}</option>)}</select><button disabled={!selected} onClick={() => void attach()}>Associer</button></div>
    {message && <small className="resource-message">{message}</small>}
  </section>
}

function ResourceEditor({ resource, onSaved, onCancel }: { resource?: Pf2Resource; onSaved: (resource: Pf2Resource) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(() => resource ? { title: resource.title, description: resource.description, summary: resource.summary, origin: resource.origin, tags: resource.tags, links: resource.links } : emptyDraft)
  const [tagText, setTagText] = useState(resource?.tags.join(', ') ?? '')
  const [message, setMessage] = useState('')
  const [linkKind, setLinkKind] = useState<Pf2ResourceTargetKind>('scenario')
  const [linkTargetId, setLinkTargetId] = useState('')
  const [linkComponentId, setLinkComponentId] = useState('')

  const targetCandidates = useMemo(() => {
    if (linkKind === 'campaign') return containers.filter((container) => container.containerType === 'campaign').map((container) => ({ id: container.id, label: titleOf(container) }))
    return playableUnits.map((unit) => ({ id: unit.id, label: titleOf(unit) }))
  }, [linkKind])
  const componentCandidates = useMemo(() => {
    if (linkKind !== 'component' || !linkTargetId) return []
    const unit = playableUnits.find((candidate) => candidate.id === linkTargetId)
    return unit?.playableComponents ?? []
  }, [linkKind, linkTargetId])

  const save = async () => {
    try {
      const payload = {
        ...draft,
        tags: unique(tagText.split(',').map((tag) => tag.trim()).filter(Boolean)),
      }
      const saved = await jsonRequest<Pf2Resource>(resource ? apiHref(`/${encodeURIComponent(resource.id)}`) : apiHref(), {
        method: resource ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      onSaved(saved)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Enregistrement impossible.')
    }
  }

  const addLink = () => {
    if (!linkTargetId || (linkKind === 'component' && !linkComponentId)) return
    const next: Pf2ResourceLink = { targetKind: linkKind, targetId: linkTargetId, componentId: linkKind === 'component' ? linkComponentId : null, sortOrder: draft.links.length }
    const duplicate = draft.links.some((link) => link.targetKind === next.targetKind && link.targetId === next.targetId && (link.componentId ?? '') === (next.componentId ?? ''))
    if (!duplicate) setDraft((value) => ({ ...value, links: [...value.links, next] }))
  }

  return <section className="resource-editor">
    <div className="resource-editor-head"><div><small>{resource ? 'MODIFIER' : 'NOUVELLE RESSOURCE'}</small><h2>{resource?.title || 'Créer une ressource'}</h2></div><button onClick={onCancel}>×</button></div>
    <label>Titre<input value={draft.title} onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))} /></label>
    <label>Description courte<textarea rows={2} value={draft.description} onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))} placeholder="Une phrase pour comprendre immédiatement ce que contient la ressource." /></label>
    <label>Résumé détaillé<textarea rows={10} value={draft.summary} onChange={(event) => setDraft((value) => ({ ...value, summary: event.target.value }))} placeholder="Résumé complet, secrets compris, pour retrouver rapidement ce qui peut être réutilisé." /></label>
    <div className="resource-editor-grid"><label>Origine<input value={draft.origin} onChange={(event) => setDraft((value) => ({ ...value, origin: event.target.value }))} placeholder="Trilemma" /></label><label>Tags<input list="resource-tag-suggestions" value={tagText} onChange={(event) => setTagText(event.target.value)} placeholder="Quête, Ruines, Exploration…" /><datalist id="resource-tag-suggestions">{suggestedTags.map((tag) => <option key={tag} value={tag} />)}</datalist></label></div>
    <fieldset className="resource-links-editor"><legend>Rattachements</legend>{draft.links.length > 0 && <div className="resource-link-chips">{draft.links.map((link, index) => <button type="button" key={`${link.targetKind}-${link.targetId}-${link.componentId ?? ''}`} onClick={() => setDraft((value) => ({ ...value, links: value.links.filter((_, linkIndex) => linkIndex !== index) }))}>{targetLabel(link)} ×</button>)}</div>}<div className="resource-link-form"><select value={linkKind} onChange={(event) => { setLinkKind(event.target.value as Pf2ResourceTargetKind); setLinkTargetId(''); setLinkComponentId('') }}><option value="campaign">Campagne</option><option value="scenario">Scénario</option><option value="component">Module jouable</option></select><select value={linkTargetId} onChange={(event) => { setLinkTargetId(event.target.value); setLinkComponentId('') }}><option value="">Choisir…</option>{targetCandidates.map((target) => <option value={target.id} key={target.id}>{target.label}</option>)}</select>{linkKind === 'component' && <select value={linkComponentId} onChange={(event) => setLinkComponentId(event.target.value)}><option value="">Composant…</option>{componentCandidates.map((component) => <option value={component.id} key={component.id}>{component.title}</option>)}</select>}<button type="button" onClick={addLink}>Ajouter</button></div></fieldset>
    {message && <p className="resource-message">{message}</p>}
    <div className="resource-editor-actions"><button onClick={onCancel}>Annuler</button><button className="primary" onClick={() => void save()}>Enregistrer</button></div>
  </section>
}

function ResourceDetail({ resource, onChanged, onBack }: { resource: Pf2Resource; onChanged: (resource?: Pf2Resource) => void; onBack: () => void }) {
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')

  const upload = async (file?: File) => {
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    try {
      const response = await fetch(apiHref(`/${encodeURIComponent(resource.id)}/files`), { method: 'POST', body: form })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.message || `Erreur HTTP ${response.status}`)
      onChanged(await jsonRequest<Pf2Resource>(apiHref(`/${encodeURIComponent(resource.id)}`)))
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Import impossible.') }
  }

  const removeFile = async (fileId: string) => {
    if (!window.confirm('Supprimer ce PDF de la ressource ?')) return
    await jsonRequest<{ deleted: true }>(apiHref(`/${encodeURIComponent(resource.id)}/files/${encodeURIComponent(fileId)}`), { method: 'DELETE' })
    onChanged(await jsonRequest<Pf2Resource>(apiHref(`/${encodeURIComponent(resource.id)}`)))
  }

  const removeResource = async () => {
    if (!window.confirm(`Supprimer définitivement « ${resource.title} » et ses PDF ?`)) return
    await jsonRequest<{ deleted: true }>(apiHref(`/${encodeURIComponent(resource.id)}`), { method: 'DELETE' })
    onChanged(undefined)
  }

  if (editing) return <ResourceEditor resource={resource} onCancel={() => setEditing(false)} onSaved={(saved) => { setEditing(false); onChanged(saved) }} />
  return <section className="resource-detail">
    <div className="entity-page-toolbar"><button onClick={onBack}>← Retour aux ressources</button><span>Ressource réutilisable · indépendante du catalogue jouable</span></div>
    <article className="entity-page-card">
      <div className="resource-detail-head"><div><small>{resource.origin || 'ORIGINE NON RENSEIGNÉE'}</small><h2>{resource.title}</h2><p>{resource.description || 'Description courte non renseignée.'}</p></div><div><button onClick={() => setEditing(true)}>Modifier</button><button className="danger" onClick={() => void removeResource()}>Supprimer</button></div></div>
      {resource.tags.length > 0 && <div className="resource-tags">{resource.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
      <section className="detail-section synopsis-long"><h3>Résumé détaillé</h3><p>{resource.summary || 'Résumé détaillé non renseigné.'}</p></section>
      <section className="detail-section"><div className="resource-section-head"><div><h3>PDF</h3><p>Original, traduction, cartes ou autres variantes peuvent coexister.</p></div><label className="resource-upload">Ajouter un PDF<input type="file" accept="application/pdf,.pdf" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; void upload(file) }} /></label></div>{resource.files.length ? <div className="resource-files">{resource.files.map((file) => <article key={file.id}><a href={file.downloadUrl} target="_blank" rel="noreferrer"><strong>{file.label || file.filename}</strong><span>{file.filename} · {bytesLabel(file.sizeBytes)}</span></a><button onClick={() => void removeFile(file.id)}>Supprimer</button></article>)}</div> : <p className="missing">Aucun PDF ajouté.</p>}</section>
      <section className="detail-section"><h3>Utilisé dans</h3>{resource.links.length ? <div className="resource-link-chips static">{resource.links.map((link) => <span key={`${link.targetKind}-${link.targetId}-${link.componentId ?? ''}`}>{targetLabel(link)}</span>)}</div> : <p className="missing">Cette ressource n’est encore rattachée à aucun contenu jouable.</p>}</section>
      {message && <p className="resource-message">{message}</p>}
    </article>
  </section>
}

export default function ResourcesPage({ initialSelectedId }: { initialSelectedId?: string }) {
  const [resources, setResources] = useState<Pf2Resource[]>([])
  const [selectedId, setSelectedId] = useState(initialSelectedId ?? '')
  const [creating, setCreating] = useState(false)
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('')
  const [origin, setOrigin] = useState('')
  const [message, setMessage] = useState('')

  const reload = async () => {
    try { setResources(await jsonRequest<Pf2Resource[]>(apiHref())) }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Chargement impossible.') }
  }
  useEffect(() => { void reload() }, [])
  useEffect(() => { setSelectedId(initialSelectedId ?? '') }, [initialSelectedId])

  const tags = useMemo(() => unique(resources.flatMap((resource) => resource.tags)), [resources])
  const origins = useMemo(() => unique(resources.map((resource) => resource.origin)), [resources])
  const filtered = useMemo(() => {
    const folded = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr')
    return resources.filter((resource) => {
      if (tag && !resource.tags.includes(tag)) return false
      if (origin && resource.origin !== origin) return false
      if (!folded) return true
      const haystack = [resource.title, resource.description, resource.summary, resource.origin, ...resource.tags].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr')
      return haystack.includes(folded)
    })
  }, [resources, query, tag, origin])

  const selected = resources.find((resource) => resource.id === selectedId)
  const changed = async (resource?: Pf2Resource) => {
    await reload()
    if (!resource) { setSelectedId(''); history.pushState(null, '', '/pf2-mj/resources'); return }
    setSelectedId(resource.id)
    history.pushState(null, '', resourceHref(resource.id))
  }

  const exportJson = async () => {
    const payload = await jsonRequest<Record<string, unknown>>(apiHref('/export'))
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = `pf2-resources-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(href)
  }

  if (creating) return <ResourceEditor onCancel={() => setCreating(false)} onSaved={async (saved) => { setCreating(false); await reload(); setSelectedId(saved.id); history.pushState(null, '', resourceHref(saved.id)) }} />
  if (selected) return <ResourceDetail resource={selected} onChanged={(resource) => void changed(resource)} onBack={() => { setSelectedId(''); history.pushState(null, '', '/pf2-mj/resources') }} />

  return <section className="resources-view">
    <div className="resources-actions"><div><strong>{resources.length} ressource{resources.length > 1 ? 's' : ''}</strong><span>Bibliothèque de scénarios courts, lieux, cartes et idées réutilisables.</span></div><button onClick={() => void exportJson()}>Exporter JSON</button><button className="primary" onClick={() => setCreating(true)}>＋ Nouvelle ressource</button></div>
    <div className="resource-filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans titres, descriptions et résumés…" /><select value={tag} onChange={(event) => setTag(event.target.value)}><option value="">Tous les tags</option>{tags.map((value) => <option key={value}>{value}</option>)}</select><select value={origin} onChange={(event) => setOrigin(event.target.value)}><option value="">Toutes les origines</option>{origins.map((value) => <option key={value}>{value}</option>)}</select></div>
    {message && <p className="resource-message">{message}</p>}
    {filtered.length ? <div className="resource-cards">{filtered.map((resource) => <Link to={resourceHref(resource.id)} key={resource.id}><header><small>{resource.origin || 'Sans origine'}</small><strong>{resource.title}</strong></header><p>{resource.description || resource.summary || 'Sans description.'}</p><footer><span>{resource.files.length} PDF</span><div>{resource.tags.slice(0, 5).map((value) => <em key={value}>{value}</em>)}</div></footer></Link>)}</div> : <div className="resources-empty"><strong>Aucune ressource</strong><p>{resources.length ? 'Aucun résultat avec ces filtres.' : 'Crée la première ressource ; les PDF Trilemma pourront ensuite être ajoutés ici.'}</p></div>}
  </section>
}
