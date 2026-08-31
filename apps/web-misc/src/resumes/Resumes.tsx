import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './resumes.css'

type Actor = { id: string; name: string }
type Resume = { id: string; sessionNumber: number; date: string; title: string; participants: string[]; longSummaryAuthor: string | null; shortSummaryAuthor: string | null; sessionXp: number; longSummaryXp: number; shortSummaryXp: number; longSummaryUrl: string; shortSummary: string }
type Draft = Omit<Resume, 'id'>

// Le proxy historique /apil7r ajoute déjà le préfixe /api côté NestJS.
const endpoint = '/apil7r/pf2-mj'
const blank = (sessionNumber = 1): Draft => ({ sessionNumber, date: '', title: '', participants: [], longSummaryAuthor: null, shortSummaryAuthor: null, sessionXp: 0, longSummaryXp: 0, shortSummaryXp: 0, longSummaryUrl: '', shortSummary: '' })
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Une erreur est survenue.'

export default function Resumes() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [actors, setActors] = useState<Actor[]>([])
  const [draft, setDraft] = useState<Draft>(blank())
  const [editedId, setEditedId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const names = useMemo(() => new Map(actors.map((actor) => [actor.id, actor.name])), [actors])
  const nextNumber = useMemo(() => Math.max(0, ...resumes.map((resume) => resume.sessionNumber)) + 1, [resumes])
  const load = async () => {
    try {
      const [resumeResponse, actorResponse] = await Promise.all([fetch(`${endpoint}/sessions`), fetch(`${endpoint}/actors`)])
      const payload = await resumeResponse.json().catch(() => null)
      if (!resumeResponse.ok) throw new Error(payload?.message ?? 'Impossible de charger les résumés.')
      setResumes(payload)
      if (actorResponse.ok) setActors(await actorResponse.json())
      else setNotice('Les résumés sont disponibles ; Foundry est hors ligne, les noms de PJ ne peuvent pas être chargés.')
    } catch (error) { setNotice(errorText(error)) }
  }
  useEffect(() => { void load() }, [])

  const create = () => { setEditedId(null); setDraft(blank(nextNumber)); setOpen(true); setNotice('') }
  const edit = (resume: Resume) => { setEditedId(resume.id); setDraft({ ...resume }); setOpen(true); setNotice('') }
  const close = () => { setOpen(false); setEditedId(null) }
  const save = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const response = await fetch(editedId ? `${endpoint}/sessions/${encodeURIComponent(editedId)}` : `${endpoint}/sessions`, { method: editedId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.message ?? 'Impossible d’enregistrer le résumé.')
      await load()
      close()
    } catch (error) { setNotice(errorText(error)) }
  }

  return <main className="resumes-app">
    <header className="resumes-header"><Link to="/" className="resumes-brand"><span>✦</span><div><strong>PATHFINDER 2</strong><small>CHRONIQUES DE CAMPAGNE</small></div></Link><button onClick={create}>+ Nouveau résumé</button></header>
    <section className="resumes-hero"><div><small>JOURNAL DE CAMPAGNE</small><h1>Résumés</h1><p>Les traces de chaque partie, ordonnées par numéro de séance. Les textes longs restent dans le wiki ; ici, on garde leur lien et les attributions d’XP.</p></div><b>{resumes.length}<small>résumé{resumes.length > 1 ? 's' : ''}</small></b></section>
    {notice && <p className="resumes-notice">{notice}</p>}
    <section className="resume-timeline">{resumes.length ? resumes.map((resume) => <article className="resume-card" key={resume.id}><div className="resume-number">{String(resume.sessionNumber).padStart(2, '0')}</div><div className="resume-content"><div className="resume-heading"><div><small>{resume.date || 'Date non renseignée'}</small><h2>{resume.title || `Résumé n°${resume.sessionNumber}`}</h2></div><button onClick={() => edit(resume)}>Éditer</button></div><p className="resume-players">{resume.participants.length ? resume.participants.map((id) => names.get(id) ?? id).join(' · ') : 'Participants non renseignés'}</p>{resume.shortSummary ? <p className="resume-short">{resume.shortSummary}</p> : <p className="resume-empty">Résumé court à écrire.</p>}<footer><span>⚑ {resume.sessionXp} XP séance</span>{resume.shortSummaryAuthor && <span>✎ {names.get(resume.shortSummaryAuthor) ?? resume.shortSummaryAuthor} · {resume.shortSummaryXp} XP</span>}{resume.longSummaryAuthor && <span>⌁ {names.get(resume.longSummaryAuthor) ?? resume.longSummaryAuthor} · {resume.longSummaryXp} XP</span>}{resume.longSummaryUrl && <a href={resume.longSummaryUrl} target="_blank" rel="noreferrer">Lire le résumé long ↗</a>}</footer></div></article>) : <div className="resumes-empty"><h2>La chronique commence ici.</h2><p>Crée le premier résumé : seul son numéro est requis.</p><button onClick={create}>Créer le résumé n°1</button></div>}</section>
    {open && <div className="resume-editor-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}><form className="resume-editor" onSubmit={save}><header><div><small>{editedId ? 'MODIFIER' : 'CRÉER'}</small><h2>{editedId ? `Résumé n°${draft.sessionNumber}` : 'Nouveau résumé'}</h2></div><button type="button" onClick={close}>×</button></header><label>Numéro de résumé<input type="number" min="1" step="1" required value={draft.sessionNumber} onChange={(event) => setDraft({ ...draft, sessionNumber: Number(event.target.value) })}/></label><div className="resume-form-pair"><label>Date (optionnelle)<input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })}/></label><label>Titre (optionnel)<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })}/></label></div><label>Participants<select multiple value={draft.participants} onChange={(event) => setDraft({ ...draft, participants: [...event.target.selectedOptions].map((option) => option.value) })}>{actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.name}</option>)}</select><small>⌘/Ctrl-clic pour plusieurs PJ.</small></label><div className="resume-form-triple"><label>XP séance<input type="number" min="0" step="1" value={draft.sessionXp} onChange={(event) => setDraft({ ...draft, sessionXp: Number(event.target.value) })}/></label><label>XP court<input type="number" min="0" step="1" value={draft.shortSummaryXp} onChange={(event) => setDraft({ ...draft, shortSummaryXp: Number(event.target.value) })}/></label><label>XP long<input type="number" min="0" step="1" value={draft.longSummaryXp} onChange={(event) => setDraft({ ...draft, longSummaryXp: Number(event.target.value) })}/></label></div><div className="resume-form-pair"><label>Auteur court<select value={draft.shortSummaryAuthor ?? ''} onChange={(event) => setDraft({ ...draft, shortSummaryAuthor: event.target.value || null })}><option value="">Non attribué</option>{actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.name}</option>)}</select></label><label>Auteur long<select value={draft.longSummaryAuthor ?? ''} onChange={(event) => setDraft({ ...draft, longSummaryAuthor: event.target.value || null })}><option value="">Non attribué</option>{actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.name}</option>)}</select></label></div><label>Résumé court (optionnel)<textarea rows={6} value={draft.shortSummary} onChange={(event) => setDraft({ ...draft, shortSummary: event.target.value })}/></label><label>Lien du résumé long (optionnel)<input type="url" placeholder="https://wiki…" value={draft.longSummaryUrl} onChange={(event) => setDraft({ ...draft, longSummaryUrl: event.target.value })}/><small>Le contenu long appartient au wiki : cette page garde uniquement le lien.</small></label><button className="resume-save" type="submit">{editedId ? 'Enregistrer' : 'Créer le résumé'}</button></form></div>}
  </main>
}
