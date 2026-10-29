"use client";

import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './SessionPreparations.css'

type BlockKind = 'personnage' | 'lore' | 'loot' | 'rencontre' | 'texte' | 'checklist'
type Block = {
  id: string; kind: BlockKind; title: string; text: string; done: boolean; npcId?: string;
  name?: string; portraitUrl?: string; showName?: boolean; quantity?: string;
  reference?: string; secret?: boolean;
}
type Stage = { id: string; title: string; time: string; notes: string; done: boolean; blocks: Block[] }
type Preparation = {
  id: string; title: string; campaignId: string | null; scenarioId: string | null;
  sessionId: string | null; revision: number; body: { summary: string; stages: Stage[] };
  updatedAt: string;
}
type Session = { id: string; number: number; title: string; channelId: string | null; channelName: string | null; ended: boolean }
type Npc = { id: string; nom: string; portrait?: string }
type Option = { id: string; title: string }
const URL = '/apil7r/pf2-mj/session-preparations'
const blockLabels: Record<BlockKind, string> = { personnage: 'Personnage', lore: 'Lore', loot: 'Loot', rencontre: 'Rencontre', texte: 'Texte libre', checklist: 'Checklist' }
const blockKinds = Object.keys(blockLabels) as BlockKind[]

function blankStage(): Stage { return { id: crypto.randomUUID(), title: 'Nouvelle étape', time: '', notes: '', done: false, blocks: [] } }
function blankBlock(kind: BlockKind): Block {
  return { id: crypto.randomUUID(), kind, title: kind === 'personnage' ? '' : blockLabels[kind], text: '', done: false, name: '', portraitUrl: '', showName: true, quantity: '', reference: '', secret: kind === 'lore' }
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${URL}${path}`, { cache: 'no-store', ...init, headers: init?.headers })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(Array.isArray(data?.message) ? data.message.join(', ') : data?.message || `Erreur HTTP ${response.status}`)
  return data as T
}
function bodyInit(data: unknown): RequestInit { return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) } }
function move<T>(items: T[], index: number, offset: number): T[] {
  const next = [...items]; const destination = index + offset
  if (destination < 0 || destination >= next.length) return next
  const [item] = next.splice(index, 1); next.splice(destination, 0, item)
  return next
}
function portraitUrl(value?: string): string {
  if (!value) return ''
  // Portraits added by the MJ app live in Foundry's assets directory and are
  // served through the existing image endpoint (not the PF2 public domain).
  const local = /^assets\/l7r\/portraits\/pnj\/([^/]+\.(?:webp|gif|png|jpe?g))$/i.exec(value)
  if (local) return `/apil7r/pf2-mj/portraits/${encodeURIComponent(local[1])}`
  return value.startsWith('assets/l7r/') ? `https://pf2.l7r.fr/${value}` : /^https:\/\//i.test(value) ? value : ''
}

export default function SessionPreparations({ campaigns, scenarios }: { campaigns: Option[]; scenarios: Option[] }) {
  const location = useLocation()
  const [items, setItems] = useState<Preparation[]>([])
  const [draft, setDraft] = useState<Preparation | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [npcs, setNpcs] = useState<Npc[]>([])
  const [mode, setMode] = useState<'edit' | 'view'>('edit')
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploadingPortrait, setUploadingPortrait] = useState<string | null>(null)
  const [portraitFeedback, setPortraitFeedback] = useState<Record<string, string>>({})
  const [portraitRefresh, setPortraitRefresh] = useState<Record<string, number>>({})
  const [notice, setNotice] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [addKind, setAddKind] = useState<Record<string, BlockKind>>({})
  const params = new URLSearchParams(location.search)

  const refresh = async () => {
    const [list, sessionList] = await Promise.all([request<Preparation[]>(''), request<Session[]>('/sessions')])
    setItems(list); setSessions(sessionList)
    return list
  }
  useEffect(() => {
    void refresh().then(list => { if (list.length) {
      const selected = list.find(item => item.id === new URLSearchParams(location.search).get('preparationId')) ?? list[0]
      setDraft(current => current ?? selected)
    } }).catch(error => {
      setNotice(error.message)
    })
    fetch('/apil7r/pf2-mj/pnj-directory').then(r => r.ok ? r.json() : null)
      .then(data => setNpcs(Array.isArray(data?.items) ? data.items : []))
      .catch(() => undefined)
  }, [location.search])

  function set(patch: Partial<Preparation>) {
    setDraft(current => current ? { ...current, ...patch } : current)
    setDirty(true)
  }
  function updateStages(transform: (stages: Stage[]) => Stage[]) {
    // Functional state protects edits typed while an image upload is in flight.
    setDraft(current => current ? {
      ...current, body: { ...current.body, stages: transform(current.body.stages) }
    } : current)
    setDirty(true)
  }
  function updateStage(id: string, patch: Partial<Stage>) { updateStages(stages => stages.map(stage => stage.id === id ? { ...stage, ...patch } : stage)) }
  function updateBlock(stageId: string, blockId: string, patch: Partial<Block>) {
    updateStages(stages => stages.map(stage => stage.id === stageId ? { ...stage, blocks: stage.blocks.map(block => block.id === blockId ? { ...block, ...patch } : block) } : stage))
  }
  async function uploadPortrait(stageId: string, blockId: string, file?: File) {
    if (!file || uploadingPortrait) return
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      setPortraitFeedback(previous => ({ ...previous, [blockId]: 'Format non supporté : PNG, JPEG, WebP ou GIF.' }))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setPortraitFeedback(previous => ({ ...previous, [blockId]: 'Image trop volumineuse (10 Mo maximum).' }))
      return
    }
    setUploadingPortrait(blockId)
    setPortraitFeedback(previous => ({ ...previous, [blockId]: 'Envoi du portrait…' }))
    try {
      const form = new FormData()
      form.set('file', file)
      // Stable, prep-specific identifier: upload does not create or modify a PNJ.
      form.set('pnjId', `prep-${draft?.id ?? 'nouvelle'}-${blockId}`)
      const response = await fetch('/apil7r/pf2-mj/pnj/portrait', { method: 'POST', body: form })
      const result = await response.json().catch(() => null)
      if (!response.ok || typeof result?.portrait !== 'string' || !/^assets\/l7r\/portraits\/pnj\/[^/]+\.(?:webp|gif)$/.test(result.portrait)) {
        throw new Error(result?.message || result?.error || 'Impossible d’envoyer le portrait.')
      }
      updateBlock(stageId, blockId, { portraitUrl: result.portrait })
      // Force the image element to refresh when a file replaces the same asset path.
      setPortraitRefresh(previous => ({ ...previous, [blockId]: (previous[blockId] ?? 0) + 1 }))
      setPortraitFeedback(previous => ({ ...previous, [blockId]: 'Portrait enregistré dans Foundry. Enregistre la préparation pour conserver le lien.' }))
    } catch (error) {
      setPortraitFeedback(previous => ({ ...previous, [blockId]: error instanceof Error ? error.message : String(error) }))
    } finally {
      setUploadingPortrait(null)
    }
  }
  function select(item: Preparation) {
    if (uploadingPortrait) return
    if (dirty && !window.confirm('Modifications non enregistrées : les abandonner ?')) return
    setDraft(item); setDirty(false); setMode('edit'); setNotice('')
  }
  async function create() {
    const title = newTitle.trim() || 'Préparation sans titre'
    setBusy(true); setNotice('')
    try {
      const created = await request<Preparation>('', bodyInit({ title, campaignId: params.get('campaignId'), scenarioId: params.get('scenarioId'), body: { summary: '', stages: [blankStage()] } }))
      await refresh(); setDraft(created); setMode('edit'); setDirty(false); setNewTitle(''); setNotice('Préparation créée.')
    } catch (error) { setNotice((error as Error).message) }
    finally { setBusy(false) }
  }
  async function save(value: Preparation = draft!): Promise<Preparation> {
    if (!value) throw new Error('Aucune préparation sélectionnée.')
    setBusy(true); setNotice('')
    try {
      const updated = await request<Preparation>(`/${encodeURIComponent(value.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) })
      setDraft(updated); setDirty(false); await refresh(); setNotice('Préparation enregistrée.'); return updated
    } catch (error) { setNotice((error as Error).message); throw error }
    finally { setBusy(false) }
  }
  async function remove() {
    if (!draft || !window.confirm(`Supprimer définitivement « ${draft.title} » ?`)) return
    setBusy(true)
    try {
      await request(`/${encodeURIComponent(draft.id)}`, { method: 'DELETE' })
      const list = await refresh(); setDraft(list[0] ?? null); setDirty(false); setNotice('Préparation supprimée.')
    } catch (error) { setNotice((error as Error).message) }
    finally { setBusy(false) }
  }
  async function share(block: Block) {
    if (!draft) return
    if (!window.confirm(`Partager « ${block.name || block.title || 'ce personnage'} » dans le salon Discord de la séance et dans Foundry ?`)) return
    setBusy(true); setNotice('')
    try {
      let prep = draft
      if (dirty) prep = await save(draft)
      const result = await request<{ discordUrl: string; foundry: string }>(`/${encodeURIComponent(prep.id)}/share/${encodeURIComponent(block.id)}`, { method: 'POST' })
      setNotice(`Publié sur Discord (${result.discordUrl}). Transmission à Foundry en attente de synchronisation.`)
    } catch (error) { setNotice(`Partage non confirmé : ${(error as Error).message}`) }
    finally { setBusy(false) }
  }
  async function toggleDone(stageId: string, blockId?: string) {
    if (!draft) return
    const next = { ...draft, body: { ...draft.body, stages: draft.body.stages.map(stage => stage.id !== stageId ? stage : blockId
      ? { ...stage, blocks: stage.blocks.map(block => block.id === blockId ? { ...block, done: !block.done } : block) }
      : { ...stage, done: !stage.done }) } }
    try { await save(next) } catch { /* Notice already shown. */ }
  }
  const currentSession = sessions.find(s => s.id === draft?.sessionId)
  const unambiguousActive = sessions.filter(s => s.channelId && !s.ended)
  const canShare = Boolean(currentSession?.channelId && !currentSession.ended) || (!draft?.sessionId && unambiguousActive.length === 1)

  return <div className="session-prep">
    <header className="session-prep-header"><div><small>JOURNAL MJ · AIDE EN PARTIE</small><h2>Préparation séance</h2><p>Crée ton conducteur à la main. Les fiches liées restent dans le référentiel MJ ; les figurants peuvent rester temporaires.</p></div></header>
    <div className="session-prep-layout">
      <aside className="session-prep-list">
        <h3>Mes préparations</h3>
        <label htmlFor="new-prep-title">Nouvelle préparation</label>
        <input id="new-prep-title" value={newTitle} placeholder="Titre de la séance" onChange={event => setNewTitle(event.target.value)} />
        <button disabled={busy || uploadingPortrait !== null} type="button" onClick={() => void create()}>+ Créer</button>
        {items.map(item => <button key={item.id} type="button" className={draft?.id === item.id ? 'selected' : ''} disabled={uploadingPortrait !== null} onClick={() => select(item)}><strong>{item.title}</strong><small>{item.body.stages.length} étape(s) · {item.campaignId ? (campaigns.find(c => c.id === item.campaignId)?.title ?? item.campaignId) : item.scenarioId ? (scenarios.find(s => s.id === item.scenarioId)?.title ?? item.scenarioId) : 'Sans campagne'} · v{item.revision}</small></button>)}
      </aside>
      <section className="session-prep-editor">
        {notice && <p role="status" className="session-prep-notice">{notice}</p>}
        {!draft ? <div className="session-prep-empty"><h3>Commence par créer une préparation.</h3><p>Tu pourras la rattacher à une campagne, un scénario et une séance Discord, puis organiser librement les étapes.</p></div> : <>
          <div className="session-prep-toolbar">
            <div><strong>{draft.title}</strong><small>{dirty ? 'Modifications non enregistrées' : 'Enregistrée'}</small></div>
            <div className="session-prep-actions"><button type="button" className={mode === 'edit' ? 'selected' : ''} onClick={() => setMode('edit')}>Édition</button><button type="button" className={mode === 'view' ? 'selected' : ''} onClick={() => setMode('view')}>Vue</button>{mode === 'edit' && <button type="button" className="primary" disabled={busy || uploadingPortrait !== null || !dirty} onClick={() => void save().catch(() => undefined)}>Enregistrer</button>}</div>
          </div>
          {mode === 'edit' ? <div className="session-prep-fields">
            <label>Titre<input value={draft.title} onChange={e => set({ title: e.target.value })} /></label>
            <label>Campagne<select value={draft.campaignId ?? ''} onChange={e => set({ campaignId: e.target.value || null })}><option value="">— Sans campagne —</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
            <label>Scénario<select value={draft.scenarioId ?? ''} onChange={e => set({ scenarioId: e.target.value || null })}><option value="">— Sans scénario —</option>{scenarios.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
            <label>Séance Discord<select value={draft.sessionId ?? ''} onChange={e => set({ sessionId: e.target.value || null })}><option value="">Automatique si une seule séance active</option>{sessions.map(s => <option key={s.id} value={s.id}>Séance n°{s.number}{s.channelName ? ` · #${s.channelName}` : ''}{s.ended ? ' (terminée)' : !s.channelId ? ' (sans canal)' : ''}</option>)}</select></label>
            <label className="session-prep-full">Introduction / objectif général<textarea rows={3} value={draft.body.summary} onChange={e => set({ body: { ...draft.body, summary: e.target.value } })}/></label>
          </div> : <div className="session-prep-summary">{draft.body.summary || 'Aucun objectif général renseigné.'}</div>}
          <div className="session-prep-channel">Salon de partage : {currentSession?.channelId ? `#${currentSession.channelName || currentSession.channelId}${currentSession.ended ? ' · séance terminée' : ''}` : !draft.sessionId && unambiguousActive.length === 1 ? `#${unambiguousActive[0].channelName || unambiguousActive[0].channelId} (séance active)` : 'à associer via /debut-seance'} · Les partages sont envoyés sur Discord puis relayés dans Foundry.</div>
          <div className="session-prep-stages">{draft.body.stages.map((stage, index) => <article className={`session-prep-stage${stage.done ? ' is-done' : ''}`} key={stage.id}>
            <div className="session-prep-stage-head"><span className="session-prep-step-number">{index + 1}</span>{mode === 'edit' ? <><input aria-label="Nom de l’étape" value={stage.title} onChange={e => updateStage(stage.id, { title: e.target.value })}/><input className="session-prep-time" aria-label="Horaire indicatif" placeholder="Horaire" value={stage.time} onChange={e => updateStage(stage.id, { time: e.target.value })}/><button type="button" title="Monter l’étape" onClick={() => updateStages(stages => move(stages, index, -1))}>↑</button><button type="button" title="Descendre l’étape" onClick={() => updateStages(stages => move(stages, index, 1))}>↓</button><button type="button" className="danger" onClick={() => updateStages(stages => stages.filter(s => s.id !== stage.id))}>×</button></> : <><h3>{stage.title}</h3><small>{stage.time}</small><button type="button" onClick={() => void toggleDone(stage.id)}>{stage.done ? '✓ Jouée' : 'Marquer jouée'}</button></>}</div>
            {mode === 'edit' ? <textarea className="session-prep-stage-notes" rows={2} placeholder="Déroulé, objectifs, points d’attention..." value={stage.notes} onChange={e => updateStage(stage.id, { notes: e.target.value })}/> : stage.notes && <p className="session-prep-stage-notes">{stage.notes}</p>}
            <div className="session-prep-blocks">{stage.blocks.map((block, blockIndex) => {
              const npc = npcs.find(n => n.id === block.npcId)
              const portrait = portraitUrl(block.npcId ? npc?.portrait : block.portraitUrl)
              return <div key={block.id} className={`session-prep-block ${block.done ? 'is-done' : ''}`}>
                <div className="session-prep-block-head"><span className="session-prep-kind">{blockLabels[block.kind]}</span>{mode === 'edit' ? <div className="session-prep-block-tools"><button type="button" onClick={() => updateStage(stage.id, { blocks: move(stage.blocks, blockIndex, -1) })}>↑</button><button type="button" onClick={() => updateStage(stage.id, { blocks: move(stage.blocks, blockIndex, 1) })}>↓</button><button type="button" className="danger" onClick={() => updateStage(stage.id, { blocks: stage.blocks.filter(b => b.id !== block.id) })}>Supprimer</button></div> : <button type="button" onClick={() => void toggleDone(stage.id, block.id)}>{block.done ? '✓ Terminé' : 'Marquer fait'}</button>}</div>
                {block.kind === 'personnage' && <div className="session-prep-character">
                  <div className={`session-prep-portrait${mode === 'edit' && !block.npcId ? ' can-upload' : ''}`}
                    onDragOver={event => { if (mode === 'edit' && !block.npcId) event.preventDefault() }}
                    onDrop={event => { if (mode !== 'edit' || block.npcId) return; event.preventDefault(); void uploadPortrait(stage.id, block.id, [...event.dataTransfer.files].find(file => file.type.startsWith('image/'))) }}
                    onPaste={event => { if (mode !== 'edit' || block.npcId) return; const file = [...event.clipboardData.items].find(item => item.type.startsWith('image/'))?.getAsFile(); if (!file) return; event.preventDefault(); void uploadPortrait(stage.id, block.id, file) }}
                    tabIndex={mode === 'edit' && !block.npcId ? 0 : undefined}
                    aria-label={mode === 'edit' && !block.npcId ? 'Portrait : glisser-déposer ou coller une image' : 'Portrait du personnage'}>
                    {portrait ? <img src={portrait.startsWith('/apil7r/pf2-mj/portraits/') ? `${portrait}?v=${portraitRefresh[block.id] ?? 0}` : portrait} alt="Portrait"/> : <span className="session-prep-avatar">♙</span>}
                  </div>
                  <div className="session-prep-character-fields">
                    {mode === 'edit' ? <><label>Source du personnage<select value={block.npcId ?? ''} onChange={e => updateBlock(stage.id, block.id, { npcId: e.target.value || undefined })}><option value="">Personnage temporaire</option>{npcs.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}</select></label>{!block.npcId && <><label>Nom<input value={block.name ?? ''} onChange={e => updateBlock(stage.id, block.id, { name: e.target.value })}/></label><label className="session-prep-portrait-upload">
                      <span>{uploadingPortrait === block.id ? 'Envoi en cours…' : portrait ? 'Remplacer le portrait' : 'Choisir un portrait'}</span>
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={busy || uploadingPortrait !== null}
                        onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void uploadPortrait(stage.id, block.id, file) }}/>
                    </label>
                    <small>Image PNG, JPEG, WebP ou GIF (10 Mo maximum). Glisser-déposer ou coller aussi possible sur le portrait.</small>
                    {portraitFeedback[block.id] && <small role="status" className="session-prep-portrait-feedback">{portraitFeedback[block.id]}</small>}
                    <label>Ou URL du portrait (HTTPS ou asset Foundry)<input value={block.portraitUrl ?? ''} disabled={uploadingPortrait === block.id} onChange={e => updateBlock(stage.id, block.id, { portraitUrl: e.target.value })}/></label></>}<label className="session-prep-checkbox"><input type="checkbox" checked={block.showName !== false} onChange={e => updateBlock(stage.id, block.id, { showName: e.target.checked })}/> Afficher le nom aux joueurs</label></> : <><strong>{npc?.nom ?? block.name ?? 'Personnage temporaire'}</strong><small>{block.npcId ? 'Fiche MJ' : 'Temporaire · sans fiche MJ'}</small></>}
                    <div className="session-prep-actions">{block.npcId && <Link to={`/pf2-mj/npcs/${encodeURIComponent(block.npcId)}`}>Ouvrir la fiche MJ</Link>}<button disabled={busy || uploadingPortrait !== null || !canShare} type="button" className="primary" onClick={() => void share(block)}>Partager · Discord + Foundry</button></div>
                  </div>
                </div>}
                {mode === 'edit' ? <div className="session-prep-block-fields">{block.kind !== 'personnage' && <label>Titre<input value={block.title} onChange={e => updateBlock(stage.id, block.id, { title: e.target.value })}/></label>}{block.kind === 'loot' && <label>Quantité<input value={block.quantity ?? ''} onChange={e => updateBlock(stage.id, block.id, { quantity: e.target.value })}/></label>}{block.kind === 'rencontre' && <label>Référence Foundry / scène<input value={block.reference ?? ''} onChange={e => updateBlock(stage.id, block.id, { reference: e.target.value })}/></label>}<label className="session-prep-full">{block.kind === 'personnage' ? 'Notes / rôle dans cette scène' : 'Contenu'}<textarea rows={3} value={block.text} onChange={e => updateBlock(stage.id, block.id, { text: e.target.value })}/></label>{block.kind === 'lore' && <label className="session-prep-checkbox"><input type="checkbox" checked={block.secret === true} onChange={e => updateBlock(stage.id, block.id, { secret: e.target.checked })}/> Secret MJ</label>}</div> : <><h4>{block.kind !== 'personnage' ? block.title : ''}{block.kind === 'loot' && block.quantity ? ` · ${block.quantity}` : ''}</h4>{block.kind === 'lore' && block.secret && <small className="session-prep-secret">🔒 Secret MJ</small>}{block.text && <p className="session-prep-block-text">{block.text}</p>}{block.reference && <small>{block.reference}</small>}</>}
              </div>
            })}</div>
            {mode === 'edit' && <div className="session-prep-add"><select aria-label="Type de bloc" value={addKind[stage.id] ?? 'texte'} onChange={e => setAddKind(current => ({ ...current, [stage.id]: e.target.value as BlockKind }))}>{blockKinds.map(kind => <option key={kind} value={kind}>{blockLabels[kind]}</option>)}</select><button type="button" onClick={() => updateStage(stage.id, { blocks: [...stage.blocks, blankBlock(addKind[stage.id] ?? 'texte')] })}>+ Ajouter un bloc</button></div>}
          </article>)}</div>
          {mode === 'edit' && <div className="session-prep-footer"><button type="button" onClick={() => updateStages(stages => [...stages, blankStage()])}>+ Ajouter une étape</button><button type="button" className="danger" disabled={busy} onClick={() => void remove()}>Supprimer la préparation</button></div>}
        </>}
      </section>
    </div>
  </div>
}
