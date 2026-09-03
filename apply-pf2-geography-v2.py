#!/usr/bin/env python3
from __future__ import annotations
import json, shutil, sys, re, unicodedata
from pathlib import Path
from datetime import datetime

ROOT=Path.cwd(); BASE=ROOT/'apps/web-misc/src/pf2-mj'; DATA=BASE/'data'
req=[BASE/'Pf2MjApp.tsx', BASE/'Lieux.tsx', BASE/'Regions.tsx', DATA/'pf2_regions.json', DATA/'pf2_lieux.json', DATA/'catalogue-pf2.json']
miss=[str(x) for x in req if not x.exists()]
if miss:
 print('Erreur: lancer depuis la racine du dépôt.'); [print(' absent:',x) for x in miss]; sys.exit(2)

stamp=datetime.now().strftime('%Y%m%d-%H%M%S'); backup=ROOT/f'.pf2-geography-v2-backup-{stamp}'
for p in req:
 d=backup/p.relative_to(ROOT); d.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(p,d)
print('Backup :',backup)

regions=json.loads((DATA/'pf2_regions.json').read_text())
lieux=json.loads((DATA/'pf2_lieux.json').read_text())
cat=json.loads((DATA/'catalogue-pf2.json').read_text())

# Kortos is a real missing intermediate node in the current reference dataset.
if not any(r.get('id')=='region_kortos' for r in regions):
 regions.append({'id':'region_kortos','nom':'Île de Kortos','type':'Île / région','parent_id':'region_region_de_la_mer_interieure','capitale_lieu_id':'lieu_absalom','description':'Île de la Pierre-Étoile, comprenant Absalom, Otari, les Cairnlands et les environs.','histoire':'','gouvernement':'','culture':'','religions':[],'factions':[],'personnages_cles':[],'lieux_cles':['lieu_absalom'],'relations':[],'tags':['Kortos'],'image':'','aliases':['Kortos','Isle of Kortos','Starstone Isle','Île de la Pierre-Étoile'],'statut':'Actif','notes':'','source':'Lost Omens: Absalom','evenements':[]})
for r in regions:
 if r.get('id')=='region_absalom_et_l_ile_de_la_pierre_etoile': r['parent_id']='region_kortos'
(DATA/'pf2_regions.json').write_text(json.dumps(regions,ensure_ascii=False,indent=2)+'\n')

# Common aliases in catalogue/source material. This is deliberately separate from hierarchy.
ALIASES={
 'Cheliax':'Chéliax','Numeria':'Numérie','Mwangi Expanse':'Étendue du Mwangi','River Kingdoms':'Royaumes fluviaux',
 'Lands of the Linnorm Kings':'Terres des Rois des Linnorms','Gravelands':'Terres des Tombes','New Thassilon':'Nouvelle Thassilon',
 'Shadow Absalom':"Absalom de l'Ombre",'Isle of Kortos':'Île de Kortos','Île de la Pierre-Étoile':'Île de Kortos',
 'Grand Bazaar':'Grand Bazar','Grand Lodge':'Grande Loge','Heidmarch Manor':'Manoir Heidmarch','Citadel Altaerein':'Citadelle Altaerein',
 'Breachill':'Brèchemur','Eye of Abendego':'Œil d’Abendego','Forest of Spirits':'Forêt des Spectres',
 'Mana Wastes':'Désert de la Cicatrice magique','Thuvia':'Thuvie','Arcadia':'Arcadie','Arcadian Ocean':'Océan Arcadien',
 'Shadow Plane':'Plan de l’Ombre','Sarkoris Scar':'Sarkoris','Blackwood Swamp':'Marais de Blackwood','Tskikha':'Enclave iruxi de Tskikha',
 'Dacilane Academy':'Académie Dacilane',
}

# Parent relationships for catalogue labels that are not represented by pf2_regions/pf2_lieux.
# These edges augment, rather than replace, the canonical region/lieu hierarchy.
P={
 # Kortos / Absalom
 'Absalom':'Île de Kortos','Otari':'Île de Kortos','Cairnlands':'Île de Kortos','Grand Bazar':'Absalom','Grande Loge':'Absalom',
 'Académie Dacilane':'Absalom','Muse de la Rose':'Absalom','Quartier des Pétales':'Absalom','Foreign Quarter':'Absalom','Eastgate':'Absalom',
 'Sanctum d’Aroden':'Absalom','Citadelle du Néant':'Île de Kortos','Gauntlight':'Otari',
 # Avistan / nations
 'Chéliax':'Avistan','Andoran':'Avistan','Belkzen':'Avistan','Brevoy':'Avistan','Druma':'Avistan','Galt':'Avistan','Irrisen':'Avistan',
 'Isger':'Avistan','Kyonin':'Avistan','Mendev':'Avistan','Nidal':'Avistan','Numérie':'Avistan','Oprak':'Avistan','Ravounel':'Avistan',
 'Razmiran':'Avistan','Taldor':'Avistan','Varisie':'Avistan','Royaumes fluviaux':'Avistan','Terres des Rois des Linnorms':'Avistan',
 'Terres des Tombes':'Avistan','Nouvelle Thassilon':'Avistan','Ustalav':'Avistan','Nirmathas':'Avistan','Molthune':'Avistan',
 'Royaume des Seigneurs des Mammouths':'Avistan','Terres Volées':'Royaumes fluviaux','Sevenarches':'Royaumes fluviaux','Daggermark':'Royaumes fluviaux',
 'Artume':'Royaumes fluviaux','Tymon':'Royaumes fluviaux',
 # Varisia
 'Pointesable':'Varisie','Magnimar':'Varisie','Korvosa':'Varisie','Kaer Maga':'Varisie','Port-Énigme':'Varisie','Riddleport':'Varisie',
 'Manoir Heidmarch':'Magnimar','Vieux Phare':'Pointesable','Dragon Rouillé':'Pointesable','Cathédrale de Pointesable':'Pointesable',
 'Manoir Xarwin':'Varisie','Terres des Sagas':'Thassilon',
 # Isger/Cheliax/Ravounel
 'Brèchemur':'Isger','Citadelle Altaerein':'Brèchemur','Cercle d’Alseta':'Citadelle Altaerein','Chitterwood':'Isger','Logas':'Isger',
 'Kintargo':'Ravounel','Côte de Ravounel':'Ravounel','Corentyn':'Chéliax','Brastlewark':'Chéliax','Devil\'s Perch':'Chéliax',
 # Garund
 'Étendue du Mwangi':'Garund','Geb':'Garund','Katapesh':'Garund','Nex':'Garund','Osirion':'Garund','Thuvie':'Garund','Vidrian':'Garund',
 'Rahadoum':'Garund','Œil d’Abendego':'Garund','Terres Détrempées':'Œil d’Abendego','Shackles':'Garund',
 'Nantambu':'Étendue du Mwangi','Mzali':'Étendue du Mwangi','Kibwe':'Étendue du Mwangi','Anthusis':'Vidrian','Magaambya':'Nantambu',
 'Hyrantam':'Terres Détrempées','Lirgen':'Terres Détrempées','Yamasa':'Terres Détrempées','Mechitar':'Geb','Graydirge':'Geb',
 'Katapesh':'Garund','Sothis':'Osirion','Manaket':'Osirion','Merab':'Thuvie',
 # Casmaron / Qadira
 'Qadira':'Casmaron','Katheer':'Qadira','Sedeq':'Qadira','Empire keleshite':'Casmaron',
 # Tian Xia
 'Tian Xia':'Golarion','Minkai':'Tian Xia','Shenmen':'Tian Xia','Hwanggot':'Tian Xia','Goka':'Tian Xia','Minata':'Tian Xia',
 'Bonmu':'Tian Xia','Willowshore':'Shenmen','Forêt des Spectres':'Tian Xia','Kasai':'Minkai','Shanguang Desert':'Tian Xia',
 'Island of the Ancestors':'Tian Xia','Kayajima':'Tian Xia','Maecho':'Tian Xia','Hinji':'Tian Xia',
 # Other continents / oceans
 'Arcadie':'Golarion','Océan Arcadien':'Golarion','Azlant':'Golarion','Ruines d’Azlant':'Azlant','Ruines azlantiennes':'Azlant',
 'Talmandor’s Bounty':'Océan Arcadien','Segada':'Arcadie','Alkenstar':'Garund','Désert de la Cicatrice magique':'Garund',
 # Numeria / north
 'Starfall':'Numérie','Lake Starfall':'Numérie','Hajoth Hakados':'Numérie','Iobaria':'Casmaron','Lake of Mists and Veils':'Casmaron',
 'Iceferry':'Terres des Rois des Linnorms','Nerosyan':'Mendev','Sarkoris':'Avistan','Vallée perdue du Mammouth':'Royaume des Seigneurs des Mammouths',
 # Kyonin
 'Tanglebriar':'Kyonin','Forêt Verdoyante':'Kyonin','Iadara':'Kyonin',
 # Taldor/Andoran/Galt/Ustalav etc
 'Oppara':'Taldor','Almas':'Andoran','Creux du Faucon':'Andoran','Isarn':'Galt','Caliphas':'Ustalav','Lepidstadt':'Ustalav','Bastardhall':'Ustalav',
 # Jalmeray / Mediogalti / islands
 'Jalmeray':'Région de la mer Intérieure','Niswan':'Jalmeray','Île de Médiogalti':'Garund','Ilizmagorti':'Île de Médiogalti',
 'Private island off Mediogalti':'Île de Médiogalti','Iblydos':'Casmaron','Bailax':'Iblydos',
 # Darklands / Highhelm
 'Terres Sombres':'Golarion','Highhelm':'Montagnes des Cinq Rois','Kovlar':'Montagnes des Cinq Rois','Saggorak':'Montagnes des Cinq Rois',
 # Planar
 'Plans extérieurs':'Golarion','Plan de l’Ombre':'Plans extérieurs',"Absalom de l'Ombre":'Plan de l’Ombre','Premier Monde':'Plans extérieurs',
 'Enfer':'Plans extérieurs','Plane of Earth':'Plans extérieurs','Plane of Fire':'Plans extérieurs','Plane of Metal':'Plans extérieurs',
 'Plane of Water':'Plans extérieurs','Plane of Wood':'Plans extérieurs','Mindscape':'Plans extérieurs','Dustbound Isle (dreamscape)':'Mindscape',
 # Site-level obvious relationships
 'Quartier général d\'Edgewatch':'Quartier du Précipice','Terrains du Festival Radieux':'Quartier du Précipice','Quartier du Précipice':'Absalom',
 'Musée Blakros':'Absalom','Starwatch':'Absalom','Cochon Ventru':'Absalom','Fredon Blessé':'Absalom',
 'Flèche de Nex':'Cairnlands','Cimetière des Épaves':'Île de Kortos','Maison Nexus':'Quantium','Quantium':'Nex',
 'Eurythnia':'Nouvelle Thassilon','Xin-Edasseril':'Nouvelle Thassilon','Xer':'Razmiran','Thronestep':'Razmiran',
 'Port Peril':'Shackles','Promise':'Hermea','Hermea':'Garund','Oprak':'Avistan','Urgir':'Belkzen',
}

# Add aliases and explicit parent edges to a JSON resource so the TS engine is data driven.
overrides={'schemaVersion':2,'aliases':ALIASES,'parents':P}
(DATA/'geography-overrides.json').write_text(json.dumps(overrides,ensure_ascii=False,indent=2)+'\n')
print('Écrit  : data/geography-overrides.json')

GEOGRAPHY=r'''import lieuxData from './data/pf2_lieux.json'
import regionsData from './data/pf2_regions.json'
import overridesData from './data/geography-overrides.json'

type RegionRecord={id:string;nom:string;type?:string;parent_id?:string|null;aliases?:string[]}
type LieuRecord={id:string;nom:string;type?:string;region_id?:string|null;parent_id?:string|null;aliases?:string[]}
type Overrides={aliases:Record<string,string>;parents:Record<string,string>}
export type GeographyNode={key:string;label:string;kind:'region'|'place'|'catalogue';sourceId?:string;type?:string;parentKeys:string[];aliases:string[]}
export type PlaceFilterOption={value:string;label:string;depth:number;kind:GeographyNode['kind']}
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
'''
(BASE/'geography.ts').write_text(GEOGRAPHY)
print('Écrit  : geography.ts')

def patch(path,old,new,label,optional=False):
 s=path.read_text()
 if new in s: print('Déjà OK:',label); return
 if old not in s:
  if optional: print('Ignoré :',label); return
  raise RuntimeError(f'Motif introuvable {label}: {old!r}')
 path.write_text(s.replace(old,new,1)); print('Patché :',label)

app=BASE/'Pf2MjApp.tsx'
patch(app,"import EvenementsPage from './Evenements'","import EvenementsPage from './Evenements'\nimport { expandedPlaceLabels, matchesPlaceFilter, placeDisplay, placeFilterOptions } from './geography'",'import géographie',True)
patch(app,"...locations.map((location) => location.id), ...unit.arcIds","...locations.flatMap((location) => expandedPlaceLabels(location.id)), ...unit.arcIds",'recherche ancêtres',True)
patch(app,"if (filters.place && !locations.some((location) => location.id === filters.place)) return false","if (filters.place && !matchesPlaceFilter(locations.map((location) => location.id), filters.place)) return false",'filtre hiérarchique',True)
patch(app,"const places = useMemo(() => unique([...allPlaces, ...units.flatMap((unit) => unit.locations.map((location) => location.id))]), [units])","const places = useMemo(() => placeFilterOptions(unique([...allPlaces, ...units.flatMap((unit) => unit.locations.map((location) => location.id))])), [units])",'options hiérarchiques',True)
patch(app,"{places.map((place) => <option key={place}>{place}</option>)}","{places.map((place) => <option key={place.value} value={place.value}>{place.label}</option>)}",'select hiérarchique',True)
# V1 may already have some patches: normalize them if present.
s=app.read_text(); s=s.replace("unique(locations.map((location) => location.id)).join(', ')","unique(locations.map((location) => placeDisplay(location.id))).join(', ')"); s=s.replace("unique(container.locations.map((location) => location.id)).join(', ')","unique(container.locations.map((location) => placeDisplay(location.id))).join(', ')"); app.write_text(s)

for f in ['Lieux.tsx','Regions.tsx']:
 p=BASE/f; s=p.read_text()
 if 'regionContains' not in s:
  s=s.replace('import {ChangeEvent,useEffect,useMemo,useState} from "react";','import {ChangeEvent,useEffect,useMemo,useState} from "react";\nimport {regionContains} from "./geography";')
 if f=='Lieux.tsx': s=s.replace('&&(!region||x.region_id===region)&&','&&(!region||regionContains(region,x.region_id))&&')
 else: s=s.replace('&&(!parent||x.parent_id===parent)}','&&(!parent||regionContains(parent,x.id))}')
 p.write_text(s)

# Audit catalogue vocabulary.
raw=[]
for e in cat.get('entries',[]):
 raw += [x for x in (e.get('regions') or []) if isinstance(x,str)]
 for part in e.get('parts') or []: raw += [x for x in (part.get('regions') or []) if isinstance(x,str)]
uniq=sorted(set(raw),key=str.casefold)
linked=set(P)|set(ALIASES)|set(ALIASES.values())|{r['nom'] for r in regions}|{l['nom'] for l in lieux}
unresolved=[x for x in uniq if x not in linked]
audit={'schemaVersion':1,'cataloguePlaceLabels':len(uniq),'hierarchyOverrides':len(P),'aliases':len(ALIASES),'unresolvedExactOnly':unresolved}
(DATA/'geography-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
print(f'Audit  : {len(uniq)} libellés catalogue · {len(P)} relations explicites · {len(unresolved)} restent exact-only')
print('Terminé: le moteur hiérarchique s’applique à TOUTES les régions/lieux existants; les libellés sans parent connu restent utilisables sans fausse inférence.')
