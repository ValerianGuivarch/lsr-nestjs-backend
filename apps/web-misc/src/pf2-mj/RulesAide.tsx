import { useEffect, useMemo, useState } from 'react'
import './RulesAide.css'

type RuleOrigin = 'official' | 'house' | 'open'
type Rule = { id: string; title: string; category: string; summary: string; details: string; sourceUrl: string; origin: RuleOrigin }
type Aide = { chatgptUrl: string; entries: Rule[] }
const empty: Rule = { id: '', title: '', category: 'Général', summary: '', details: '', sourceUrl: '', origin: 'official' }
const categories = ['Général', 'Exploration', 'Pièges et dangers', 'Discrétion et initiative', 'Combat', 'États', 'Compétences', 'Dégâts et défenses', 'Rencontres et XP', 'Soins et repos', 'Autres situations']
const originLabels: Record<RuleOrigin, string> = { official: 'Règle officielle', house: 'Règle maison validée', open: 'Décision ouverte' }
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const slug = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70)

export default function RulesAidePage() {
  const [aide, setAide] = useState<Aide>({ chatgptUrl: '', entries: [] })
  const [urlDraft, setUrlDraft] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [origin, setOrigin] = useState<RuleOrigin | ''>('')
  const [draft, setDraft] = useState<Rule | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch('/apil7r/pf2-mj/rules-aide', { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('Chargement des règles impossible.')
      return response.json() as Promise<Aide>
    }).then(data => {
      if (!mounted) return
      setAide({ chatgptUrl: data.chatgptUrl || '', entries: Array.isArray(data.entries) ? data.entries : [] })
      setUrlDraft(data.chatgptUrl || '')
    }).catch(error => { if (mounted) setMessage(error instanceof Error ? error.message : String(error)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const save = async (next: Aide) => {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/apil7r/pf2-mj/rules-aide', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next)
      })
      const data = await response.json().catch(() => null) as (Aide & { message?: string }) | null
      if (!response.ok || !data) throw new Error(data?.message || 'Enregistrement impossible.')
      setAide({ chatgptUrl: data.chatgptUrl, entries: data.entries })
      setUrlDraft(data.chatgptUrl)
      setMessage('Modifications enregistrées dans SQLite.')
      return true
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
      return false
    } finally { setBusy(false) }
  }

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return aide.entries.filter(rule =>
      (!category || rule.category === category) && (!origin || rule.origin === origin) &&
      (!q || normalize([rule.title, rule.category, rule.summary, rule.details].join(' ')).includes(q))
    ).sort((a, b) => a.category.localeCompare(b.category, 'fr') || a.title.localeCompare(b.title, 'fr'))
  }, [aide.entries, query, category, origin])

  const saveRule = async () => {
    if (!draft) return
    const title = draft.title.trim()
    const id = editingId || slug(title) || 'regle'
    const newId = editingId ? id : (aide.entries.some(rule => rule.id === id) ? id + '-' + Date.now().toString(36) : id)
    if (!title || !draft.summary.trim() || !draft.category.trim()) { setMessage('Titre, catégorie et résumé sont obligatoires.'); return }
    const entry = { ...draft, id: newId, title, category: draft.category.trim() }
    const entries = editingId ? aide.entries.map(rule => rule.id === editingId ? entry : rule) : [...aide.entries, entry]
    if (await save({ ...aide, entries })) { setDraft(null); setEditingId(null); setExpanded(current => [...current, newId]) }
  }
  const deleteRule = async (rule: Rule) => {
    if (!window.confirm('Supprimer la fiche « ' + rule.title + ' » ?')) return
    await save({ ...aide, entries: aide.entries.filter(entry => entry.id !== rule.id) })
  }

  return <section className="rules-aide">
    <header className="rules-header">
      <div><small>PATHFINDER 2E · REMASTER · AIDE MJ</small><h1>Règles</h1><p>Le nécessaire pour trancher rapidement en séance. Les références officielles et adaptations personnelles sont distinguées.</p></div>
      <div className="rules-actions">{aide.chatgptUrl && <a className="rules-button primary" href={aide.chatgptUrl} target="_blank" rel="noopener noreferrer">ChatGPT ↗</a>}<button className="rules-button" disabled={busy || loading} onClick={() => { setEditingId(null); setDraft({ ...empty }) }}>+ Ajouter une fiche</button></div>
    </header>
    <div className="rules-chat-setting">
      <label htmlFor="rules-chat-link">Lien de cette discussion ChatGPT</label>
      <div><input id="rules-chat-link" type="url" value={urlDraft} onChange={event => setUrlDraft(event.target.value)} placeholder="https://chatgpt.com/…" /><button className="rules-button" disabled={busy || loading || urlDraft === aide.chatgptUrl} onClick={() => void save({ ...aide, chatgptUrl: urlDraft })}>Enregistrer le lien</button></div>
    </div>
    <div className="rules-filters"><input aria-label="Rechercher une règle" placeholder="Rechercher une situation, une action, un DD…" value={query} onChange={event => setQuery(event.target.value)} /><select aria-label="Catégorie" value={category} onChange={event => setCategory(event.target.value)}><option value="">Toutes les rubriques</option>{[...new Set([...categories, ...aide.entries.map(rule => rule.category)])].map(value => <option key={value} value={value}>{value}</option>)}</select><select aria-label="Statut de règle" value={origin} onChange={event => setOrigin(event.target.value as RuleOrigin | '')}><option value="">Tous les statuts</option>{(Object.keys(originLabels) as RuleOrigin[]).map(value => <option value={value} key={value}>{originLabels[value]}</option>)}</select></div>
    <p className="rules-feedback" role="status">{loading ? 'Chargement…' : message || (filtered.length + ' fiche(s) sur ' + aide.entries.length)}</p>
    {!loading && !filtered.length && <p className="rules-empty">{aide.entries.length ? 'Aucune fiche ne correspond à ces filtres.' : 'Aucune fiche pour le moment. Ajoute les règles vraiment utiles en séance, au fil des questions.'}</p>}
    <div className="rules-list">{filtered.map(rule => <article key={rule.id} className="rules-entry">
      <div className="rules-entry-header"><button className="rules-toggle" aria-expanded={expanded.includes(rule.id)} onClick={() => setExpanded(previous => previous.includes(rule.id) ? previous.filter(id => id !== rule.id) : [...previous, rule.id])}><small>{rule.category} · {originLabels[rule.origin]}</small><strong>{rule.title}</strong><span>{rule.summary}</span></button><div className="rules-entry-actions"><button className="rules-button" onClick={() => { setEditingId(rule.id); setDraft({ ...rule }) }}>Modifier</button><button className="rules-button" onClick={() => void deleteRule(rule)} disabled={busy}>Supprimer</button></div></div>
      {expanded.includes(rule.id) && <div className="rules-details"><div className="rules-detail-text">{rule.details || rule.summary}</div>{rule.sourceUrl && <a href={rule.sourceUrl} target="_blank" rel="noopener noreferrer">Consulter la source ↗</a>}</div>}
    </article>)}</div>
    {draft && <div className="rules-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setDraft(null) }}><section className="rules-editor" role="dialog" aria-modal="true" aria-label="Édition d’une fiche de règles"><h2>{editingId ? 'Modifier la fiche' : 'Nouvelle fiche'}</h2>
      <label>Titre<input value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
      <label>Catégorie<input list="rules-categories" value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })} /><datalist id="rules-categories">{categories.map(value => <option key={value} value={value} />)}</datalist></label>
      <label>Statut<select value={draft.origin} onChange={event => setDraft({ ...draft, origin: event.target.value as RuleOrigin })}>{(Object.keys(originLabels) as RuleOrigin[]).map(value => <option value={value} key={value}>{originLabels[value]}</option>)}</select></label>
      <label>Résumé immédiat<textarea rows={3} value={draft.summary} onChange={event => setDraft({ ...draft, summary: event.target.value })} /></label>
      <label>Détails opérationnels (texte, une ligne par instruction)<textarea rows={8} value={draft.details} onChange={event => setDraft({ ...draft, details: event.target.value })} /></label>
      <label>Source officielle / référence (URL HTTPS)<input type="url" value={draft.sourceUrl} onChange={event => setDraft({ ...draft, sourceUrl: event.target.value })} /></label>
      <div className="rules-editor-actions"><button className="rules-button" disabled={busy} onClick={() => setDraft(null)}>Annuler</button><button className="rules-button primary" disabled={busy} onClick={() => void saveRule()}>Enregistrer</button></div>
    </section></div>}
  </section>
}
