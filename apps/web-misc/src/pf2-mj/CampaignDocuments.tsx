import { useEffect, useState } from 'react'
export type ScenarioPdf = { id: string; path: string; filename: string; assetType: string; role: string | null; language: string | null; variant: string | null; present: boolean; libraryCategory?: string | null; resourceTargetLabel?: string | null; resourceTargetId?: string | null }
export type PdfKind = 'original' | 'translation' | 'story' | 'other'
const labels: Record<PdfKind,string> = { original: 'PDF original', translation: 'Traduction', story: 'Récit de campagne', other: 'Autres documents' }
export function pdfKind(asset: ScenarioPdf): PdfKind {
  const normalized = [asset.role,asset.libraryCategory,asset.variant,asset.filename].filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  if (/\b(recit|chronique|story|recount|retelling)\b/.test(normalized)) return 'story'
  if (/traduct|translation|\btrad\b/.test(normalized)) return 'translation'
  if (/guide[_ ]joueur|playerguide|player guide|\bcarte\b|\bmap\b|information|\(info\)/.test(normalized)) return 'other'
  return 'original'
}
export function CampaignDocuments({id, compact = false, excludeTargets = []}: {id:string;compact?:boolean;excludeTargets?:string[]}) {
  const [state,setState] = useState<{assets:ScenarioPdf[]; error:boolean}|null>(null)
  useEffect(()=>{let cancelled=false;setState(null);fetch('/apil7r/pf2-mj/scenarios/'+encodeURIComponent(id)+'/resources',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error(String(r.status));return r.json()}).then((assets:ScenarioPdf[])=>{if(!cancelled)setState({assets: Array.isArray(assets)?assets:[],error:false})}).catch(()=>{if(!cancelled)setState({assets:[],error:true})});return()=>{cancelled=true}},[id])
  const assets = Array.from(new Map((state?.assets??[]).filter(a=>a.assetType==='pdf' && (!a.resourceTargetId || !excludeTargets.includes(a.resourceTargetId))).map(a=>[a.path,a])).values())
  return <section className={'detail-section campaign-documents'+(compact?' compact':'')}><h3>Documents PDF</h3>{!state?<p>Chargement…</p>:state.error?<p role="alert">Documents indisponibles.</p>:<div className="campaign-pdf-groups">{(Object.keys(labels) as PdfKind[]).filter(k=>k!=='other'||assets.some(a=>pdfKind(a)===k)).map(k=>{const list=assets.filter(a=>pdfKind(a)===k);return <div key={k}><strong>{labels[k]}</strong>{list.length?<ul>{list.map(a=><li key={a.path}>{a.present?<a href={'/apil7r/pf2-mj/bibliotheque/'+a.path.split('/').map(encodeURIComponent).join('/')} target="_blank" rel="noreferrer">{a.filename} ↗</a>:<span className="missing">{a.filename} · absent</span>}{a.language&&<small> · {a.language.toUpperCase()}</small>}{a.resourceTargetLabel&&<small> · {a.resourceTargetLabel}</small>}</li>)}</ul>:<small className="missing"> — Non associé</small>}</div>})}</div>}</section>
}
