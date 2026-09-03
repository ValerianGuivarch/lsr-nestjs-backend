import lieuxData from './data/pf2_lieux.json'
import regionsData from './data/pf2_regions.json'
import overridesData from './data/geography-overrides.json'

type RegionRecord={id:string;nom:string;type?:string;parent_id?:string|null;aliases?:string[]}
type LieuRecord={id:string;nom:string;type?:string;region_id?:string|null;parent_id?:string|null;aliases?:string[]}
type Overrides={aliases:Record<string,string>;parents:Record<string,string>}
export type GeographyNode={key:string;label:string;kind:'region'|'place'|'catalogue';sourceId?:string;type?:string;parentKeys:string[];aliases:string[]}
export type PlaceFilterOption={value:string;label:string;depth:number;kind:GeographyNode['kind']}
export type GeographyTreeOption=PlaceFilterOption & {parentValue:string|null;path:string[];hasChildren:boolean;unclassified:boolean}
const regions=regionsData as RegionRecord[], lieux=lieuxData as LieuRecord[], overrides=overridesData as Overrides
export const normalizePlace=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘`´]/g,"'").replace(/\s+/g,' ').trim().toLowerCase()
const rk=(id:string)=>`region:${id}`, lk=(id:string)=>`place:${id}`
const nodes=new Map<string,GeographyNode>(), aliases=new Map<string,string>(), ambiguous=new Set<string>()
function addAlias(raw:string,key:string){const n=normalizePlace(raw);if(!n)return;const old=aliases.get(n);if(old&&old!==key){aliases.delete(n);ambiguous.add(n);return}if(!ambiguous.has(n))aliases.set(n,key)}
for(const r of regions) nodes.set(rk(r.id),{key:rk(r.id),label:r.nom,kind:'region',sourceId:r.id,type:r.type,parentKeys:r.parent_id?[rk(r.parent_id)]:[],aliases:r.aliases??[]})
for(const l of lieux){const ps:string[]=[];if(l.parent_id)ps.push(lk(l.parent_id));if(l.region_id)ps.push(rk(l.region_id));nodes.set(lk(l.id),{key:lk(l.id),label:l.nom,kind:'place',sourceId:l.id,type:l.type,parentKeys:ps,aliases:l.aliases??[]})}
for(const n of nodes.values()){addAlias(n.label,n.key);for(const a of n.aliases)addAlias(a,n.key)}
function ensureCatalogue(label:string){const n=normalizePlace(label);const existing=aliases.get(n);if(existing)return existing;const key=`catalogue:${n}`;if(!nodes.has(key)){nodes.set(key,{key,label,kind:'catalogue',parentKeys:[],aliases:[]});addAlias(label,key)}return key}
for(const [alias,target] of Object.entries(overrides.aliases)){const tk=ensureCatalogue(target);addAlias(alias,tk)}
for(const [child,parent] of Object.entries(overrides.parents)){const ck=ensureCatalogue(child), pk=ensureCatalogue(parent);const node=nodes.get(ck)!;if(!node.parentKeys.includes(pk))node.parentKeys.push(pk)}
export function resolveGeographyKey(raw:string){if(nodes.has(raw))return raw;return aliases.get(normalizePlace(raw))??ensureCatalogue(raw)}
export function geographyAncestors(key:string){const out:GeographyNode[]=[];const q=[...(nodes.get(key)?.parentKeys??[])],seen=new Set<string>();while(q.length){const k=q.shift()!;if(seen.has(k))continue;seen.add(k);const n=nodes.get(k);if(!n)continue;out.push(n);q.push(...n.parentKeys)}return out}
export function geographyContains(parent:string,child:string){return parent===child||geographyAncestors(child).some(n=>n.key===parent)}
export function matchesPlaceFilter(raws:string[],filter:string){if(!filter)return true;const fk=resolveGeographyKey(filter);return raws.some(r=>geographyContains(fk,resolveGeographyKey(r)))}
export function expandedPlaceLabels(raw:string){const k=resolveGeographyKey(raw),n=nodes.get(k)!;return [n.label,...n.aliases,...geographyAncestors(k).flatMap(a=>[a.label,...a.aliases])]}
export function placeDisplay(raw:string){const k=resolveGeographyKey(raw),n=nodes.get(k)!;const a=geographyAncestors(k)[0];return a&&normalizePlace(a.label)!==normalizePlace(n.label)?`${n.label} · ${a.label}`:n.label}
export function placeFilterOptions(raws:string[]):PlaceFilterOption[]{const keys=new Set<string>();for(const raw of raws){const k=resolveGeographyKey(raw);keys.add(k);for(const a of geographyAncestors(k))keys.add(a.key)}return [...keys].map(k=>{const n=nodes.get(k)!;return {value:k,label:n.label,depth:geographyAncestors(k).length,kind:n.kind}}).sort((a,b)=>a.label.localeCompare(b.label,'fr',{sensitivity:'base'}))}
export function regionContains(selected:string,candidate?:string|null){if(!selected)return true;if(!candidate)return false;return geographyContains(rk(selected),rk(candidate))}


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
