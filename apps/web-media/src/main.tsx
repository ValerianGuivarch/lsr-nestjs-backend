import { ChangeEvent, ClipboardEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

type MediaType = 'portrait' | 'image'
type Media = { id: string; name: string; slug: string; type: MediaType; filename: string; mimeType: string; bytes?: number | null; url: string }

const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

function MediaApp() {
  const [items, setItems] = useState<Media[]>([])
  const [type, setType] = useState<'all' | MediaType>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Media | null>(null)
  const [dialog, setDialog] = useState(false)
  const [name, setName] = useState('')
  const [newType, setNewType] = useState<MediaType>('portrait')
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [replaceId, setReplaceId] = useState<string | undefined>()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const query = new URLSearchParams()
    if (type !== 'all') query.set('type', type)
    if (search.trim()) query.set('search', search.trim())
    const response = await fetch(`/api/v1/media?${query}`)
    if (!response.ok) throw new Error('Impossible de charger la médiathèque.')
    setItems(await response.json())
  }
  useEffect(() => { void load().catch((error) => setMessage(error.message)) }, [type, search])

  const preview = useMemo(() => file ? URL.createObjectURL(file) : '', [file])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const acceptFile = (candidate: File | null) => {
    if (!candidate) return
    if (!allowedTypes.includes(candidate.type)) return setMessage('Format non supporté. Utilise PNG, JPEG, WebP ou GIF.')
    if (candidate.size > 10 * 1024 * 1024) return setMessage('Image trop volumineuse (maximum 10 Mo).')
    setFile(candidate); setMessage('')
  }
  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const image = [...event.clipboardData.items].find((item) => item.type.startsWith('image/'))?.getAsFile()
    if (!image) return setMessage('Aucune image trouvée dans le presse-papiers.')
    event.preventDefault(); acceptFile(image)
  }
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); acceptFile([...event.dataTransfer.files].find((item) => item.type.startsWith('image/')) ?? null) }

  const resetDialog = () => { setDialog(false); setName(''); setNewType('portrait'); setFile(null); setUrl(''); setReplaceId(undefined) }
  const create = async (replaceId?: string) => {
    if (!name.trim()) return setMessage('Nom obligatoire.')
    if (!file && !url.trim()) return setMessage('Choisis, dépose, colle ou importe une image.')
    setBusy(true); setMessage('')
    try {
      let response: Response
      if (replaceId && file) {
        const form = new FormData(); form.set('file', file)
        response = await fetch(`/api/v1/media/${replaceId}/image`, { method: 'POST', body: form })
      } else if (file) {
        const form = new FormData(); form.set('name', name.trim()); form.set('type', newType); form.set('file', file)
        response = await fetch('/api/v1/media', { method: 'POST', body: form })
      } else {
        response = await fetch('/api/v1/media/import-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), type: newType, url: url.trim() }) })
      }
      const payload = await response.json().catch(() => null)
      if (response.status === 409 && payload?.existing?.id && newType === 'portrait') {
        if (window.confirm(`${payload.message}\n\nRemplacer ce portrait ?`)) return await create(payload.existing.id)
        return
      }
      if (!response.ok) throw new Error(payload?.message ?? 'Impossible d’ajouter le média.')
      setMessage(replaceId ? 'Portrait remplacé.' : newType === 'portrait' ? 'Portrait ajouté.' : 'Image ajoutée.')
      resetDialog(); await load()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Impossible d’ajouter le média.') } finally { setBusy(false) }
  }
  const remove = async (item: Media) => {
    if (!window.confirm(`Supprimer « ${item.name} » ?`)) return
    const response = await fetch(`/api/v1/media/${item.id}`, { method: 'DELETE' })
    if (!response.ok) return setMessage('Impossible de supprimer le média.')
    setSelected(null); setMessage('Média supprimé.'); await load()
  }
  const copyUrl = async (item: Media) => { await navigator.clipboard.writeText(new URL(item.url, window.location.origin).href); setMessage('URL copiée.') }

  return <main className="media-app">
    <header><div><p>MÉDIATHÈQUE</p><h1>Images et portraits</h1></div><button className="primary" onClick={() => setDialog(true)}>+ Ajouter</button></header>
    <p className="message" aria-live="polite">{message}</p>
    <section className="filters"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Recherche…" /><div>{(['all', 'portrait', 'image'] as const).map((value) => <button key={value} className={type === value ? 'active' : ''} onClick={() => setType(value)}>{value === 'all' ? 'Tous' : value === 'portrait' ? 'Portraits' : 'Images'}</button>)}</div></section>
    {items.length ? <section className="gallery">{items.map((item) => <button className="card" key={item.id} onClick={() => setSelected(item)}><img src={item.url} alt="" /><span>{item.name}</span><small>{item.type === 'portrait' ? 'Portrait' : 'Image'}</small></button>)}</section> : <p className="empty">Aucune image trouvée.</p>}
    {(dialog || selected) && <div className="backdrop" onMouseDown={(event) => event.target === event.currentTarget && (dialog ? resetDialog() : setSelected(null))}><section className="dialog">
      {selected && !dialog ? <><button className="close" onClick={() => setSelected(null)}>×</button><img className="large" src={selected.url} alt={selected.name}/><h2>{selected.name}</h2><p>{selected.type === 'portrait' ? 'Portrait' : 'Image'} · <code>{selected.filename}</code></p><div className="actions"><button onClick={() => copyUrl(selected)}>Copier l’URL</button><label>Remplacer<input hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event: ChangeEvent<HTMLInputElement>) => { const chosen = event.target.files?.[0]; if (chosen) { setName(selected.name); setNewType(selected.type); setReplaceId(selected.id); acceptFile(chosen); setSelected(null); setDialog(true) } }}/></label><button className="danger" onClick={() => void remove(selected)}>Supprimer</button></div></> : <><button className="close" onClick={resetDialog}>×</button><h2>{replaceId ? 'Remplacer le média' : 'Ajouter un média'}</h2><label>Nom<input value={name} onChange={(event) => setName(event.target.value)} disabled={Boolean(replaceId)} /></label><fieldset><label><input type="radio" checked={newType === 'portrait'} onChange={() => setNewType('portrait')} disabled={Boolean(replaceId)}/> Portrait</label><label><input type="radio" checked={newType === 'image'} onChange={() => setNewType('image')} disabled={Boolean(replaceId)}/> Image</label></fieldset><div className="drop" tabIndex={0} onPaste={onPaste} onDragOver={(event) => event.preventDefault()} onDrop={onDrop} onClick={() => inputRef.current?.click()}>{preview ? <img src={preview} alt="Aperçu"/> : <><strong>Dépose, choisis ou colle une image ici</strong><small>Cmd/Ctrl+V pris en charge</small></>}</div><input ref={inputRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => acceptFile(event.target.files?.[0] ?? null)} /><div className="url">{!replaceId && <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…"/>}<button onClick={() => void create(replaceId)} disabled={busy}>{busy ? 'Import…' : replaceId ? 'Remplacer' : 'Importer / Ajouter'}</button></div></>}
    </section></div>}
  </main>
}

createRoot(document.getElementById('root')!).render(<MediaApp />)
