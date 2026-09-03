#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path.cwd()
BASE = ROOT / 'apps/web-misc/src/pf2-mj'
DATA = BASE / 'data'

required = [BASE/'Pf2MjApp.tsx', BASE/'Lieux.tsx', BASE/'Regions.tsx', DATA/'pf2_regions.json', DATA/'pf2_lieux.json']
missing = [str(p) for p in required if not p.exists()]
if missing:
    print('Erreur: exécuter ce script depuis la racine du dépôt.')
    for p in missing: print('  absent:', p)
    sys.exit(2)

stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
backup = ROOT / f'.pf2-geography-backup-{stamp}'
backup.mkdir()
for p in required:
    rel = p.relative_to(ROOT)
    dest = backup / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(p, dest)
print('Backup :', backup)

GEOGRAPHY = r'''import lieuxData from './data/pf2_lieux.json'
import regionsData from './data/pf2_regions.json'

type RegionRecord = { id: string; nom: string; type?: string; parent_id?: string | null; aliases?: string[] }
type LieuRecord = { id: string; nom: string; type?: string; region_id?: string | null; parent_id?: string | null; aliases?: string[] }

export type GeographyKind = 'region' | 'place' | 'unknown'
export type GeographyNode = {
  key: string
  sourceId: string
  label: string
  kind: GeographyKind
  type: string
  parentKeys: string[]
  aliases: string[]
}
export type PlaceFilterOption = { value: string; label: string; kind: GeographyKind; depth: number }

const regions = regionsData as RegionRecord[]
const lieux = lieuxData as LieuRecord[]

export const normalizePlace = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[’‘`´]/g, "'")
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase()

const regionKey = (id: string) => `region:${id}`
const lieuKey = (id: string) => `place:${id}`

const nodes = new Map<string, GeographyNode>()
for (const region of regions) {
  nodes.set(regionKey(region.id), {
    key: regionKey(region.id), sourceId: region.id, label: region.nom, kind: 'region', type: region.type ?? 'Région',
    parentKeys: region.parent_id ? [regionKey(region.parent_id)] : [], aliases: region.aliases ?? [],
  })
}
for (const lieu of lieux) {
  const parents: string[] = []
  if (lieu.parent_id) parents.push(lieuKey(lieu.parent_id))
  if (lieu.region_id) parents.push(regionKey(lieu.region_id))
  nodes.set(lieuKey(lieu.id), {
    key: lieuKey(lieu.id), sourceId: lieu.id, label: lieu.nom, kind: 'place', type: lieu.type ?? 'Lieu',
    parentKeys: parents, aliases: lieu.aliases ?? [],
  })
}

const explicitAliases: Record<string, string> = {
  'kortos': regionKey('region_kortos'),
  'ile de kortos': regionKey('region_kortos'),
  'isle of kortos': regionKey('region_kortos'),
  'starstone isle': regionKey('region_kortos'),
  'ile de la pierre-etoile': regionKey('region_kortos'),
  'absalom': lieuKey('lieu_absalom'),
  'city at the center of the world': lieuKey('lieu_absalom'),
  'cite au centre du monde': lieuKey('lieu_absalom'),
  'shadow absalom': lieuKey('lieu_absalom_de_l_ombre'),
  "absalom de l'ombre": lieuKey('lieu_absalom_de_l_ombre'),
}

const aliasIndex = new Map<string, string>()
const ambiguousAliases = new Set<string>()
function addAlias(raw: string, key: string) {
  const alias = normalizePlace(raw)
  if (!alias) return
  const previous = aliasIndex.get(alias)
  if (previous && previous !== key) { aliasIndex.delete(alias); ambiguousAliases.add(alias); return }
  if (!ambiguousAliases.has(alias)) aliasIndex.set(alias, key)
}
for (const node of nodes.values()) { addAlias(node.label, node.key); for (const alias of node.aliases) addAlias(alias, node.key) }
for (const [alias, key] of Object.entries(explicitAliases)) addAlias(alias, key)

export function geographyNode(key: string): GeographyNode | null { return nodes.get(key) ?? null }
export function resolveGeographyKey(raw: string): string | null { if (nodes.has(raw)) return raw; return aliasIndex.get(normalizePlace(raw)) ?? null }

export function geographyAncestors(key: string): GeographyNode[] {
  const result: GeographyNode[] = []
  const queue = [...(nodes.get(key)?.parentKeys ?? [])]
  const seen = new Set<string>()
  while (queue.length) {
    const currentKey = queue.shift()!
    if (seen.has(currentKey)) continue
    seen.add(currentKey)
    const current = nodes.get(currentKey)
    if (!current) continue
    result.push(current)
    queue.push(...current.parentKeys)
  }
  return result
}

export function geographyContains(parentKey: string, childKey: string): boolean {
  return parentKey === childKey || geographyAncestors(childKey).some((node) => node.key === parentKey)
}

export function matchesPlaceFilter(locationIds: string[], filterValue: string): boolean {
  if (!filterValue) return true
  const filterKey = resolveGeographyKey(filterValue)
  const filterNormalized = normalizePlace(filterValue)
  for (const rawLocation of locationIds) {
    const locationKey = resolveGeographyKey(rawLocation)
    if (filterKey && locationKey && geographyContains(filterKey, locationKey)) return true
    if (!filterKey && normalizePlace(rawLocation) === filterNormalized) return true
  }
  return false
}

export function expandedPlaceLabels(rawLocation: string): string[] {
  const key = resolveGeographyKey(rawLocation)
  if (!key) return [rawLocation]
  const node = nodes.get(key)!
  return [node.label, ...node.aliases, ...geographyAncestors(key).flatMap((parent) => [parent.label, ...parent.aliases])]
}

export function placePath(rawLocation: string, maxAncestors = 2): string[] {
  const key = resolveGeographyKey(rawLocation)
  if (!key) return [rawLocation]
  const node = nodes.get(key)!
  return [node.label, ...geographyAncestors(key).slice(0, maxAncestors).map((parent) => parent.label)]
}
export function placeDisplay(rawLocation: string): string { return placePath(rawLocation, 1).join(' · ') }

export function placeFilterOptions(rawLocations: string[]): PlaceFilterOption[] {
  const canonicalKeys = new Set<string>()
  const unknown = new Set<string>()
  for (const raw of rawLocations) {
    const key = resolveGeographyKey(raw)
    if (!key) { unknown.add(raw); continue }
    canonicalKeys.add(key)
    for (const parent of geographyAncestors(key)) canonicalKeys.add(parent.key)
  }
  const known = [...canonicalKeys].map((key): PlaceFilterOption => {
    const node = nodes.get(key)!
    return { value: key, label: node.label, kind: node.kind, depth: geographyAncestors(key).length }
  })
  const other = [...unknown].map((label): PlaceFilterOption => ({ value: label, label, kind: 'unknown', depth: 0 }))
  return [...known, ...other].sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }) || a.kind.localeCompare(b.kind))
}

export function regionContains(selectedRegionId: string, candidateRegionId?: string | null): boolean {
  if (!selectedRegionId) return true
  if (!candidateRegionId) return false
  return geographyContains(regionKey(selectedRegionId), regionKey(candidateRegionId))
}
'''
(BASE/'geography.ts').write_text(GEOGRAPHY)
print('Écrit  : apps/web-misc/src/pf2-mj/geography.ts')

# Data migration: Kortos becomes an explicit geography node and parent of the Absalom region.
regions_path = DATA/'pf2_regions.json'
regions = json.loads(regions_path.read_text())
if not any(x.get('id') == 'region_kortos' for x in regions):
    regions.append({
      'id':'region_kortos','nom':'Île de Kortos','type':'Île / région','parent_id':'region_region_de_la_mer_interieure','capitale_lieu_id':'lieu_absalom',
      'description':'Île de la Pierre-Étoile au centre de la mer Intérieure. Absalom se trouve sur l’île et constitue son principal centre urbain.',
      'histoire':'','gouvernement':'','culture':'','religions':[],'factions':[],'personnages_cles':[],'lieux_cles':['lieu_absalom'],'relations':[],
      'tags':['Kortos','Pierre-Étoile'],'image':'','aliases':['Kortos','Isle of Kortos','Starstone Isle','Île de la Pierre-Étoile'],'statut':'Actif','notes':'','source':'Lost Omens: Absalom','evenements':[]
    })
for x in regions:
    if x.get('id') == 'region_absalom_et_l_ile_de_la_pierre_etoile':
        x['parent_id'] = 'region_kortos'
regions_path.write_text(json.dumps(regions, ensure_ascii=False, indent=2) + '\n')
print('Migré  : pf2_regions.json (Kortos > Absalom)')


def patch(path: Path, old: str, new: str, label: str, optional=False):
    text = path.read_text()
    if new in text:
        print('Déjà OK:', label)
        return
    if old not in text:
        if optional:
            print('Ignoré :', label, '(motif non trouvé)')
            return
        raise RuntimeError(f'Motif introuvable pour {label}: {old[:100]!r}')
    path.write_text(text.replace(old, new, 1))
    print('Patché :', label)

app = BASE/'Pf2MjApp.tsx'
patch(app, "import EvenementsPage from './Evenements'", "import EvenementsPage from './Evenements'\nimport { expandedPlaceLabels, matchesPlaceFilter, placeDisplay, placeFilterOptions } from './geography'", 'import géographie')
patch(app, "...locations.map((location) => location.id), ...unit.arcIds", "...locations.flatMap((location) => expandedPlaceLabels(location.id)), ...unit.arcIds", 'recherche textuelle avec ancêtres')
patch(app, "if (filters.place && !locations.some((location) => location.id === filters.place)) return false", "if (filters.place && !matchesPlaceFilter(locations.map((location) => location.id), filters.place)) return false", 'filtre parent → descendants')
patch(app, "const places = useMemo(() => unique([...allPlaces, ...units.flatMap((unit) => unit.locations.map((location) => location.id))]), [units])", "const places = useMemo(() => placeFilterOptions(unique([...allPlaces, ...units.flatMap((unit) => unit.locations.map((location) => location.id))])), [units])", 'options de lieux canoniques')
patch(app, "{places.map((place) => <option key={place}>{place}</option>)}", "{places.map((place) => <option key={place.value} value={place.value}>{place.label}</option>)}", 'select géographique')
# Only display fields; never alter curation drafts.
text = app.read_text()
text = text.replace("unique(locations.map((location) => location.id)).join(', ')", "unique(locations.map((location) => placeDisplay(location.id))).join(', ')", 1)
text = text.replace("unique(container.locations.map((location) => location.id)).join(', ')", "unique(container.locations.map((location) => placeDisplay(location.id))).join(', ')", 1)
app.write_text(text)
print('Patché : affichage lieu + parent')

lieux = BASE/'Lieux.tsx'
patch(lieux, 'import {ChangeEvent,useEffect,useMemo,useState} from "react";', 'import {ChangeEvent,useEffect,useMemo,useState} from "react";\nimport {regionContains} from "./geography";', 'Lieux import hiérarchie')
patch(lieux, '&&(!region||x.region_id===region)&&', '&&(!region||regionContains(region,x.region_id))&&', 'Lieux: région inclut sous-régions')

regions_tsx = BASE/'Regions.tsx'
patch(regions_tsx, 'import {ChangeEvent,useEffect,useMemo,useState} from "react";', 'import {ChangeEvent,useEffect,useMemo,useState} from "react";\nimport {regionContains} from "./geography";', 'Régions import hiérarchie')
patch(regions_tsx, '&&(!parent||x.parent_id===parent)}', '&&(!parent||regionContains(parent,x.id))}', 'Régions: parent inclut descendants')

print('\nTerminé.')
print('Comportement attendu: filtrer « Île de Kortos » inclut les contenus directement localisés à Absalom.')
print('Les lieux non reconnus restent filtrables par égalité exacte; aucune association incertaine n’est inventée.')
