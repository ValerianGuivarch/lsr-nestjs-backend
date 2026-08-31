import { FormEvent, useEffect, useMemo, useState } from 'react'

type Actor = { id: string; name: string }
type Session = {
  id: string
  date: string
  title: string
  participants: string[]
  longSummaryAuthor: string | null
  shortSummaryAuthor: string | null
  sessionXp: number
  longSummaryXp: number
  shortSummaryXp: number
  longSummaryUrl: string
  shortSummary: string
}

type Draft = Omit<Session, 'id'>

const emptyDraft = (): Draft => ({ date: '', title: '', participants: [], longSummaryAuthor: null, shortSummaryAuthor: null, sessionXp: 0, longSummaryXp: 0, shortSummaryXp: 0, longSummaryUrl: '', shortSummary: '' })
const api = '/apil7r/api/pf2-mj'

function message(error: unknown): string { return error instanceof Error ? error.message : 'Une erreur est survenue.' }

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [actors, setActors] = useState<Actor[]>([])
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [editing, setEditing] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const actorNames = useMemo(() => new Map(actors.map((actor) => [actor.id, actor.name])), [actors])
  const load = async () => {
    setLoading(true)
    try {
      const [sessionResponse, actorResponse] = await Promise.all([fetch(`${api}/sessions`), fetch(`${api}/actors`)])
      const sessionPayload = await sessionResponse.json().catch(() => null)
      if (!sessionResponse.ok) throw new Error(sessionPayload?.message ?? 'Impossible de charger les séances.')
      setSessions(sessionPayload)
      if (actorResponse.ok) setActors(await actorResponse.json())
      else setStatus('Séances chargées, mais Foundry est indisponible : les noms de PJ ne sont pas résolus.')
    } catch (error) { setStatus(message(error)) }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const edit = (session: Session) => { setDraft({ ...session }); setEditing(session.id); setStatus('') }
  const cancel = () => { setDraft(emptyDraft()); setEditing(null); setStatus('') }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setStatus('')
    try {
      const response = await fetch(editing ? `${api}/sessions/${encodeURIComponent(editing)}` : `${api}/sessions`, {
        method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft)
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.message ?? 'Impossible d’enregistrer la séance.')
      await load()
      cancel()
    } catch (error) { setStatus(message(error)) }
  }

  return <section className="sessions-page">
    <div className="sessions-layout">
      <div className="session-list-panel">
        <div className="section-title"><div><small>CHRONOLOGIE</small><h2>Séances</h2></div><span>{sessions.length}</span></div>
        {loading ? <p className="empty-state">Chargement…</p> : sessions.length ? <ol className="session-list">{sessions.map((session) => <li key={session.id}><button onClick={() => edit(session)}><time>{session.date}</time><strong>{session.title}</strong><small>{session.participants.map((id) => actorNames.get(id) ?? id).join(' · ') || 'Aucun participant'}</small></button></li>)}</ol> : <p className="empty-state">Aucune séance enregistrée.</p>}
      </div>
      <form className="session-form" onSubmit={submit}>
        <div className="section-title"><div><small>{editing ? 'MODIFICATION' : 'NOUVELLE SÉANCE'}</small><h2>{editing ? 'Modifier la séance' : 'Ajouter une séance'}</h2></div>{editing && <button type="button" onClick={cancel}>Annuler</button>}</div>
        <label>Date<input type="date" required value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })}/></label>
        <label>Titre<input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })}/></label>
        <label>Participants<select multiple value={draft.participants} onChange={(event) => setDraft({ ...draft, participants: [...event.target.selectedOptions].map((option) => option.value) })}>{actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.name}</option>)}</select><small>Maintiens ⌘/Ctrl pour sélectionner plusieurs PJ.</small></label>
        <div className="session-grid"><label>XP de séance<input type="number" min="0" step="1" value={draft.sessionXp} onChange={(event) => setDraft({ ...draft, sessionXp: Number(event.target.value) })}/></label><label>XP résumé court<input type="number" min="0" step="1" value={draft.shortSummaryXp} onChange={(event) => setDraft({ ...draft, shortSummaryXp: Number(event.target.value) })}/></label><label>XP résumé long<input type="number" min="0" step="1" value={draft.longSummaryXp} onChange={(event) => setDraft({ ...draft, longSummaryXp: Number(event.target.value) })}/></label></div>
        <label>Auteur résumé court<select value={draft.shortSummaryAuthor ?? ''} onChange={(event) => setDraft({ ...draft, shortSummaryAuthor: event.target.value || null })}><option value="">Non attribué</option>{actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.name}</option>)}</select></label>
        <label>Auteur résumé long<select value={draft.longSummaryAuthor ?? ''} onChange={(event) => setDraft({ ...draft, longSummaryAuthor: event.target.value || null })}><option value="">Non attribué</option>{actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.name}</option>)}</select></label>
        <label>Lien du résumé long<input type="url" placeholder="https://wiki…" value={draft.longSummaryUrl} onChange={(event) => setDraft({ ...draft, longSummaryUrl: event.target.value })}/><small>Le texte long vit dans le wiki : l’application ne conserve ici que son lien.</small></label>
        <label>Résumé court<textarea rows={7} value={draft.shortSummary} onChange={(event) => setDraft({ ...draft, shortSummary: event.target.value })}/></label>
        {status && <p className="session-status">{status}</p>}
        <button className="pnj-button" type="submit">{editing ? 'Enregistrer les modifications' : 'Créer la séance'}</button>
      </form>
    </div>
    {sessions.some((session) => session.longSummaryUrl) && <section className="session-links"><h3>Résumés longs</h3>{sessions.filter((session) => session.longSummaryUrl).map((session) => <a key={session.id} href={session.longSummaryUrl} target="_blank" rel="noreferrer">{session.date} · {session.title} ↗</a>)}</section>}
  </section>
}
