#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil, sys

ROOT=Path.cwd(); BASE=ROOT/'apps/web-misc/src/pf2-mj'
APP=BASE/'Pf2MjApp.tsx'; GEO=BASE/'geography.ts'; CSS=BASE/'globals.css'
for p in (APP,GEO,CSS):
    if not p.exists():
        print(f'Erreur: {p} absent. Lance ce script depuis la racine du dépôt après le patch géographie V2.')
        sys.exit(2)

stamp=datetime.now().strftime('%Y%m%d-%H%M%S')
backup=ROOT/f'.pf2-geography-picker-v3-backup-{stamp}'
for p in (APP,GEO,CSS):
    d=backup/p.relative_to(ROOT); d.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(p,d)
print('Backup :', backup)

# 1) Extend geography.ts with a deterministic DFS tree + exact-only grouping metadata.
g=GEO.read_text()
if 'export type GeographyTreeOption=' not in g:
    marker="export type PlaceFilterOption={value:string;label:string;depth:number;kind:GeographyNode['kind']}"
    replacement=marker+"\nexport type GeographyTreeOption=PlaceFilterOption & {parentValue:string|null;path:string[];hasChildren:boolean;unclassified:boolean}"
    if marker not in g:
        raise SystemExit('Type PlaceFilterOption introuvable dans geography.ts (patch V2 requis).')
    g=g.replace(marker,replacement,1)

if 'export function geographyTreeOptions(' not in g:
    g += r'''

/** Options de filtre ordonnées comme un arbre. Les feuilles catalogue sans parent
 * explicite sont marquées `unclassified` afin que l'UI puisse les isoler au lieu
 * de les mélanger aux continents/régions/villes. */
export function geographyTreeOptions(raws:string[]):GeographyTreeOption[]{
  const included=new Set<string>()
  for(const raw of raws){
    const k=resolveGeographyKey(raw); included.add(k)
    for(const a of geographyAncestors(k)) included.add(a.key)
  }
  const children=new Map<string,string[]>()
  const parentOf=new Map<string,string|null>()
  for(const key of included){
    const n=nodes.get(key); if(!n)continue
    const parent=n.parentKeys.find(p=>included.has(p))??null
    parentOf.set(key,parent)
    if(parent){const list=children.get(parent)??[];list.push(key);children.set(parent,list)}
  }
  const cmp=(a:string,b:string)=>(nodes.get(a)?.label??a).localeCompare(nodes.get(b)?.label??b,'fr',{sensitivity:'base'})
  for(const list of children.values()) list.sort(cmp)
  const roots=[...included].filter(k=>!parentOf.get(k)).sort(cmp)
  const out:GeographyTreeOption[]=[]; const seen=new Set<string>()
  const visit=(key:string,depth:number,path:string[])=>{
    if(seen.has(key))return; seen.add(key)
    const n=nodes.get(key); if(!n)return
    const kids=children.get(key)??[]
    const nextPath=[...path,n.label]
    const unclassified=n.kind==='catalogue'&&!parentOf.get(key)&&kids.length===0
    out.push({value:key,label:n.label,depth,kind:n.kind,parentValue:parentOf.get(key)??null,path:nextPath,hasChildren:kids.length>0,unclassified})
    for(const child of kids) visit(child,depth+1,nextPath)
  }
  for(const root of roots) visit(root,0,[])
  // Defensive fallback for accidental cycles/broken edges.
  for(const key of [...included].sort(cmp)) if(!seen.has(key)) visit(key,0,[])
  return out
}
'''
GEO.write_text(g)
print('Patché : geography.ts (ordre hiérarchique DFS + non classés)')

# 2) Add picker component.
picker=BASE/'GeographyPicker.tsx'
picker.write_text(r'''import { useEffect, useMemo, useRef, useState } from 'react'
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
''')
print('Écrit  : GeographyPicker.tsx')

# 3) Patch Pf2MjApp.tsx.
a=APP.read_text()
if "import GeographyPicker from './GeographyPicker'" not in a:
    # Insert after use import, robust against geography import already present.
    anchor="import { useEffect, useMemo, useState } from 'react'"
    if anchor not in a: raise SystemExit('Import React introuvable dans Pf2MjApp.tsx')
    a=a.replace(anchor,anchor+"\nimport GeographyPicker from './GeographyPicker'",1)

# Ensure geographyTreeOptions is imported alongside V2 helpers.
if 'geographyTreeOptions' not in a:
    if "from './geography'" in a:
        # Add into named import if single-line V2 import.
        a=a.replace('import { expandedPlaceLabels, matchesPlaceFilter, placeDisplay, placeFilterOptions } from \'./geography\'',
                    'import { expandedPlaceLabels, geographyTreeOptions, matchesPlaceFilter, placeDisplay } from \'./geography\'')
    else:
        # Geography V2 wasn't integrated in app for some reason.
        insert="import GeographyPicker from './GeographyPicker'"
        a=a.replace(insert,insert+"\nimport { expandedPlaceLabels, geographyTreeOptions, matchesPlaceFilter, placeDisplay } from './geography'",1)
else:
    a=a.replace('placeFilterOptions, ','').replace(', placeFilterOptions','')

# Replace V2 or original places useMemo.
patterns=[
"const places = useMemo(() => placeFilterOptions(unique([...allPlaces, ...units.flatMap((unit) => unit.locations.map((location) => location.id))])), [units])",
"const places = useMemo(() => unique([...allPlaces, ...units.flatMap((unit) => unit.locations.map((location) => location.id))]), [units])",
]
new="const places = useMemo(() => geographyTreeOptions(unique([...allPlaces, ...units.flatMap((unit) => unit.locations.map((location) => location.id))])), [units])"
if new not in a:
    for old in patterns:
        if old in a:
            a=a.replace(old,new,1);break
    else: raise SystemExit('Calcul des options de lieux introuvable dans FilterBar.')

select_patterns=[
'''<select value={filters.place} onChange={(event) => update('place', event.target.value)}><option value="">Tous lieux</option>{places.map((place) => <option key={place.value} value={place.value}>{place.label}</option>)}</select>''',
'''<select value={filters.place} onChange={(event) => update('place', event.target.value)}><option value="">Tous lieux</option>{places.map((place) => <option key={place}>{place}</option>)}</select>'''
]
new_select="<GeographyPicker value={filters.place} options={places} onChange={(value) => update('place', value)} />"
if new_select not in a:
    for old in select_patterns:
        if old in a:
            a=a.replace(old,new_select,1);break
    else: raise SystemExit('Select de lieu introuvable dans FilterBar.')
APP.write_text(a)
print('Patché : Pf2MjApp.tsx (combobox hiérarchique)')

# 4) Styles.
c=CSS.read_text()
if '/* PF2 geography picker V3 */' not in c:
    c += r'''

/* PF2 geography picker V3 */
.pf2-mj-v3 .geo-picker{position:relative;min-width:0;height:40px;z-index:8}
.pf2-mj-v3 .geo-picker-trigger{width:100%;height:40px;display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid var(--line);border-radius:5px;background:var(--panel);color:var(--text);padding:0 10px;font-size:9px;text-align:left}
.pf2-mj-v3 .geo-picker-trigger span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pf2-mj-v3 .geo-picker-trigger b{color:var(--muted);font-size:9px}
.pf2-mj-v3 .geo-picker-trigger.active{border-color:#c8ac6e;background:#fffaf0}
.pf2-mj-v3 .geo-picker-popover{position:absolute;top:calc(100% + 5px);left:0;width:min(440px,calc(100vw - 32px));border:1px solid var(--line);border-radius:8px;background:var(--panel);box-shadow:0 14px 38px rgba(35,31,24,.18);overflow:hidden;z-index:100}
.pf2-mj-v3 .geo-picker-search{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:7px;padding:9px;border-bottom:1px solid var(--line);background:#faf8f2}.pf2-mj-v3 .geo-picker-search span{color:var(--muted)}
.pf2-mj-v3 .geo-picker-search input{width:100%;border:1px solid var(--line);border-radius:5px;background:var(--panel);color:var(--text);padding:8px 9px;outline:0;font-size:10px}.pf2-mj-v3 .geo-picker-search input:focus{border-color:#b89b5e}
.pf2-mj-v3 .geo-picker-scroll{max-height:440px;overflow:auto;padding:6px}
.pf2-mj-v3 .geo-picker-all,.pf2-mj-v3 .geo-picker-orphan,.pf2-mj-v3 .geo-picker-search-result{width:100%;border:0;border-radius:5px;background:transparent;color:var(--text);padding:8px 9px;text-align:left;font-size:9px}.pf2-mj-v3 .geo-picker-all:hover,.pf2-mj-v3 .geo-picker-orphan:hover,.pf2-mj-v3 .geo-picker-search-result:hover{background:#f4efe3}
.pf2-mj-v3 .geo-picker-row{display:grid;grid-template-columns:22px 1fr;align-items:stretch;padding-left:calc(var(--geo-depth) * 15px);border-radius:5px}.pf2-mj-v3 .geo-picker-row:hover{background:#f4efe3}.pf2-mj-v3 .geo-picker-row.selected{background:#f5e9c9}
.pf2-mj-v3 .geo-picker-chevron{border:0;background:transparent;color:var(--muted);padding:0;cursor:pointer}.pf2-mj-v3 .geo-picker-spacer{width:22px}
.pf2-mj-v3 .geo-picker-choice{border:0;background:transparent;color:var(--text);padding:8px 7px;text-align:left;display:grid;gap:2px;cursor:pointer;font-size:9px}.pf2-mj-v3 .geo-picker-choice small,.pf2-mj-v3 .geo-picker-search-result small{display:block;color:var(--muted);font-size:7px;margin-top:2px}
.pf2-mj-v3 .geo-picker-unclassified{margin-top:6px;padding-top:6px;border-top:1px solid var(--line)}.pf2-mj-v3 .geo-picker-unclassified-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;border:0;background:transparent;color:var(--muted);padding:7px 9px;text-align:left;font-size:8px;font-weight:700}.pf2-mj-v3 .geo-picker-unclassified-toggle b{min-width:22px;border-radius:999px;background:#ebe6da;padding:2px 5px;text-align:center;font-size:7px}
.pf2-mj-v3 .geo-picker-orphan{padding-left:31px}.pf2-mj-v3 .geo-picker-empty{padding:14px 10px;color:var(--muted);font-size:9px;text-align:center}
.pf2-mj-v3 .geo-picker .selected{font-weight:700;color:#765719}
@media(max-width:760px){.pf2-mj-v3 .geo-picker-popover{position:fixed;left:16px;right:16px;top:18vh;width:auto;max-height:68vh}.pf2-mj-v3 .geo-picker-scroll{max-height:54vh}}
'''
CSS.write_text(c)
print('Patché : globals.css')
print('\nTerminé. Le filtre Lieu est maintenant un arbre repliable, avec recherche et groupe « Autres / non classés ».')
print('Exemple attendu : Avistan ▸ Varisie ▸ Pointesable, au lieu d’une liste alphabétique plate.')
