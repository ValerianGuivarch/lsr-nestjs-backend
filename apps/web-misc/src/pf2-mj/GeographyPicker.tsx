import { useEffect, useMemo, useRef, useState } from 'react'
import type { GeographyTreeOption } from './geography'

type Props={
  value:string
  options:GeographyTreeOption[]
  onChange:(value:string)=>void
}

const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()

export default function GeographyPicker({value,options,onChange}:Props){
  const [open,setOpen]=useState(false)
  const [query,setQuery]=useState('')
  const [expanded,setExpanded]=useState<Set<string>>(()=>new Set())
  const [showUnclassified,setShowUnclassified]=useState(false)
  const box=useRef<HTMLDivElement>(null)

  const selected=options.find(o=>o.value===value)
  const children=useMemo(()=>new Map(options.map(o=>[o.value,options.filter(x=>x.parentValue===o.value).map(x=>x.value)])),[options])
  const classified=options.filter(o=>!o.unclassified)
  const unclassified=options.filter(o=>o.unclassified)
  const q=norm(query.trim())

  useEffect(()=>{
    const close=(e:MouseEvent)=>{if(box.current&&!box.current.contains(e.target as Node))setOpen(false)}
    document.addEventListener('mousedown',close); return()=>document.removeEventListener('mousedown',close)
  },[])

  useEffect(()=>{
    if(!selected)return
    const ancestors=new Set<string>(); let p=selected.parentValue
    while(p){ancestors.add(p);p=options.find(o=>o.value===p)?.parentValue??null}
    if(ancestors.size)setExpanded(old=>new Set([...old,...ancestors]))
  },[value,options])

  const visible=classified.filter(o=>{
    if(q)return norm(o.path.join(' ')).includes(q)
    let p=o.parentValue
    while(p){if(!expanded.has(p))return false;p=options.find(x=>x.value===p)?.parentValue??null}
    return true
  })

  const toggle=(v:string)=>setExpanded(old=>{const next=new Set(old);next.has(v)?next.delete(v):next.add(v);return next})
  const choose=(v:string)=>{onChange(v);setOpen(false);setQuery('')}

  return <div className="geo-picker" ref={box}>
    <button type="button" className={`geo-picker-trigger ${value?'active':''}`} onClick={()=>setOpen(v=>!v)} aria-expanded={open}>
      <span>{selected?.label||'Tous lieux'}</span><b>{open?'▴':'▾'}</b>
    </button>
    {open&&<div className="geo-picker-popover">
      <div className="geo-picker-search"><span>⌕</span><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher un lieu…" /></div>
      <div className="geo-picker-scroll">
        <button type="button" className={`geo-picker-all ${!value?'selected':''}`} onClick={()=>choose('')}>Tous les lieux</button>
        {visible.map(o=><div className={`geo-picker-row ${o.value===value?'selected':''}`} key={o.value} style={{'--geo-depth':o.depth} as React.CSSProperties}>
          {o.hasChildren&&!q?<button type="button" className="geo-picker-chevron" onClick={()=>toggle(o.value)} aria-label={expanded.has(o.value)?'Replier':'Déplier'}>{expanded.has(o.value)?'▾':'▸'}</button>:<span className="geo-picker-spacer"/>}
          <button type="button" className="geo-picker-choice" onClick={()=>choose(o.value)}>
            <span>{o.label}</span>{q&&o.path.length>1&&<small>{o.path.slice(0,-1).join(' › ')}</small>}
          </button>
        </div>)}
        {!q&&unclassified.length>0&&<div className="geo-picker-unclassified">
          <button type="button" className="geo-picker-unclassified-toggle" onClick={()=>setShowUnclassified(v=>!v)}><span>{showUnclassified?'▾':'▸'} Autres / non classés</span><b>{unclassified.length}</b></button>
          {showUnclassified&&unclassified.map(o=><button type="button" key={o.value} className={`geo-picker-orphan ${o.value===value?'selected':''}`} onClick={()=>choose(o.value)}>{o.label}</button>)}
        </div>}
        {q&&unclassified.filter(o=>norm(o.label).includes(q)).map(o=><button type="button" key={o.value} className={`geo-picker-search-result ${o.value===value?'selected':''}`} onClick={()=>choose(o.value)}><span>{o.label}</span><small>Non classé</small></button>)}
        {q&&visible.length===0&&unclassified.every(o=>!norm(o.label).includes(q))&&<p className="geo-picker-empty">Aucun lieu correspondant.</p>}
      </div>
    </div>}
  </div>
}
