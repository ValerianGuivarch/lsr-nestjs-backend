import { useEffect, useMemo, useState } from 'react'
import './RulesAide.css'

type RuleOrigin = 'official' | 'house' | 'open'
type Rule = { id: string; title: string; category: string; summary: string; details: string; examples: string; foundry: string; sourceUrl: string; origin: RuleOrigin; votesUp: number; votesDown: number }
type Aide = { chatgptUrl: string; entries: Rule[] }
const empty: Rule = { id: '', title: '', category: 'Général', summary: '', details: '', examples: '', foundry: '', sourceUrl: '', origin: 'official', votesUp: 0, votesDown: 0 }
const categories = ['Général', 'Exploration', 'Pièges et dangers', 'Discrétion et initiative', 'Combat', 'États', 'Compétences', 'Dégâts et défenses', 'Rencontres et XP', 'Soins et repos', 'Autres situations']
const originLabels: Record<RuleOrigin, string> = { official: 'Règle officielle', house: 'Règle maison validée', open: 'Décision ouverte' }
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const slug = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70)

export default function RulesAidePage() {
  const [aide, setAide] = useState<Aide>({ chatgptUrl: '', entries: [] })
  const [urlDraft, setUrlDraft] = useState('')
  const [editChatLink, setEditChatLink] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [origin, setOrigin] = useState<RuleOrigin | ''>('')
  const [draft, setDraft] = useState<Rule | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [votingId, setVotingId] = useState<string | null>(null)
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
      (!q || normalize([rule.title, rule.category, rule.summary, rule.details, rule.examples || '', rule.foundry || ''].join(' ')).includes(q))
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
    if (await save({ ...aide, entries })) { setDraft(null); setEditingId(null); setExpanded(current => [...new Set([...current, newId])]) }
  }
  const voteRule = async (id: string, direction: 'up' | 'down') => {
    setVotingId(id)
    setMessage('')
    try {
      const response = await fetch('/apil7r/pf2-mj/rules-aide/' + encodeURIComponent(id) + '/vote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ direction })
      })
      const data = await response.json().catch(() => null) as (Aide & { message?: string }) | null
      if (!response.ok || !data) throw new Error(data?.message || 'Vote non enregistré.')
      setAide({ chatgptUrl: data.chatgptUrl, entries: data.entries })
    } catch (error) { setMessage(error instanceof Error ? error.message : String(error)) }
    finally { setVotingId(null) }
  }
  const deleteRule = async (rule: Rule) => {
    if (!window.confirm('Supprimer la fiche « ' + rule.title + ' » ?')) return
    await save({ ...aide, entries: aide.entries.filter(entry => entry.id !== rule.id) })
  }

  return <section className="rules-aide">
    <header className="rules-header">
      <div><small>PATHFINDER 2E · REMASTER · AIDE MJ</small><h1>Règles</h1><p>Le nécessaire pour trancher rapidement en séance. Les références officielles et adaptations personnelles sont distinguées.</p></div>
      <div className="rules-actions">{aide.chatgptUrl && <a className="rules-button primary" href={aide.chatgptUrl} target="_blank" rel="noopener noreferrer">ChatGPT ↗</a>}<button className="rules-button" onClick={() => setEditChatLink(value => !value)} aria-expanded={editChatLink} disabled={busy || loading}>✎ Éditer le lien</button><button className="rules-button" disabled={busy || loading} onClick={() => { setEditingId(null); setDraft({ ...empty }) }}>+ Ajouter une fiche</button></div>
    </header>
    {editChatLink && <div className="rules-chat-setting">
      <label htmlFor="rules-chat-link">Lien de la discussion ChatGPT</label>
      <div><input id="rules-chat-link" type="url" value={urlDraft} onChange={event => setUrlDraft(event.target.value)} placeholder="https://chatgpt.com/…" /><button className="rules-button" disabled={busy || loading || urlDraft === aide.chatgptUrl} onClick={() => void save({ ...aide, chatgptUrl: urlDraft }).then(ok => { if (ok) setEditChatLink(false) })}>Enregistrer</button><button className="rules-button" onClick={() => { setUrlDraft(aide.chatgptUrl); setEditChatLink(false) }}>Annuler</button></div>
    </div>}
    <div className="rules-filters"><input aria-label="Rechercher une règle" placeholder="Rechercher une situation, une action, un DD…" value={query} onChange={event => setQuery(event.target.value)} /><select aria-label="Catégorie" value={category} onChange={event => setCategory(event.target.value)}><option value="">Toutes les rubriques</option>{[...new Set([...categories, ...aide.entries.map(rule => rule.category)])].map(value => <option key={value} value={value}>{value}</option>)}</select><select aria-label="Statut de règle" value={origin} onChange={event => setOrigin(event.target.value as RuleOrigin | '')}><option value="">Tous les statuts</option>{(Object.keys(originLabels) as RuleOrigin[]).map(value => <option value={value} key={value}>{originLabels[value]}</option>)}</select></div>
    <p className="rules-feedback" role="status">{loading ? 'Chargement…' : message || (filtered.length + ' fiche(s) sur ' + aide.entries.length)}</p>
    {!loading && !filtered.length && <p className="rules-empty">{aide.entries.length ? 'Aucune fiche ne correspond à ces filtres.' : 'Aucune fiche pour le moment. Ajoute les règles vraiment utiles en séance, au fil des questions.'}</p>}
    <div className="rules-list">{filtered.map(rule => <article key={rule.id} className="rules-entry">
      <div className="rules-entry-header"><button className="rules-toggle" aria-expanded={expanded.includes(rule.id)} onClick={() => setExpanded(previous => previous.includes(rule.id) ? previous.filter(id => id !== rule.id) : [...previous, rule.id])}><small>{rule.category} · {originLabels[rule.origin]}</small><strong>{rule.title}</strong><span>{rule.summary}</span></button><div className="rules-entry-actions"><button className="rules-button" onClick={() => { setEditingId(rule.id); setDraft({ ...rule }) }}>Modifier</button><button className="rules-button" onClick={() => void deleteRule(rule)} disabled={busy}>Supprimer</button></div></div>
      {expanded.includes(rule.id) && <div className="rules-details">
        <h4>Mode d’emploi détaillé</h4><div className="rules-detail-text">{rule.details || 'Détails à compléter : procédure, jets, DD et conséquences.'}</div>
        {rule.examples && <section className="rules-subsection"><h4>Exemple en séance</h4><div className="rules-detail-text">{rule.examples}</div></section>}
        {rule.foundry && <section className="rules-subsection rules-foundry"><h4>Foundry — comment faire ?</h4><div className="rules-detail-text">{rule.foundry}</div></section>}
        {rule.sourceUrl && <a href={rule.sourceUrl} target="_blank" rel="noopener noreferrer">Consulter la source ↗</a>}
        <div className="rules-votes" aria-label={'Utilité de ' + rule.title}>
          <span>Cette fiche t’a-t-elle servi ?</span>
          <button type="button" disabled={busy || votingId !== null} onClick={() => void voteRule(rule.id, 'up')} aria-label={'Utile : ' + rule.title}>👍 {rule.votesUp || 0}</button>
          <button type="button" disabled={busy || votingId !== null} onClick={() => void voteRule(rule.id, 'down')} aria-label={'À améliorer : ' + rule.title}>👎 {rule.votesDown || 0}</button>
          {(rule.votesDown || 0) > 0 && <small>À revoir en priorité</small>}
        </div>
      </div>}
    </article>)}</div>
    {draft && <div className="rules-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setDraft(null) }}><section className="rules-editor" role="dialog" aria-modal="true" aria-label="Édition d’une fiche de règles"><h2>{editingId ? 'Modifier la fiche' : 'Nouvelle fiche'}</h2>
      <label>Titre<input value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
      <label>Catégorie<input list="rules-categories" value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })} /><datalist id="rules-categories">{categories.map(value => <option key={value} value={value} />)}</datalist></label>
      <label>Statut<select value={draft.origin} onChange={event => setDraft({ ...draft, origin: event.target.value as RuleOrigin })}>{(Object.keys(originLabels) as RuleOrigin[]).map(value => <option value={value} key={value}>{originLabels[value]}</option>)}</select></label>
      <label>Résumé immédiat<textarea rows={3} value={draft.summary} onChange={event => setDraft({ ...draft, summary: event.target.value })} /></label>
      <label>Mode d’emploi détaillé — jets, DD, étapes, variantes<textarea rows={11} value={draft.details} onChange={event => setDraft({ ...draft, details: event.target.value })} /></label>
      <label>Exemple concret en séance<textarea rows={5} value={draft.examples || ''} onChange={event => setDraft({ ...draft, examples: event.target.value })} /></label>
      <label>Foundry — procédure ou différence avec la règle (si pertinent)<textarea rows={7} value={draft.foundry || ''} onChange={event => setDraft({ ...draft, foundry: event.target.value })} /></label>
      <small>Les compteurs de pouces sont remis à zéro automatiquement lors d’une vraie révision du texte explicatif, pas pour une correction minime ou une modification de classement.</small>
      <label>Source officielle / référence (URL HTTPS)<input type="url" value={draft.sourceUrl} onChange={event => setDraft({ ...draft, sourceUrl: event.target.value })} /></label>
      <div className="rules-editor-actions"><button className="rules-button" disabled={busy} onClick={() => setDraft(null)}>Annuler</button><button className="rules-button primary" disabled={busy} onClick={() => void saveRule()}>Enregistrer</button></div>
    </section></div>}
  </section>
}
