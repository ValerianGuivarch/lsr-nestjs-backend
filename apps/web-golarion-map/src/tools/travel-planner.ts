import gridData from '../../resources/travel-grid.json'
import riverData from '../../resources/travel-rivers.json'
import sourcePoints from '../../resources/map-source-points.json'
import namesFr from '../../resources/place-names.fr.json'
import { defaultMilesPerDay, travelTariffs } from './travel-rates'
export { defaultMilesPerDay, travelTariffs } from './travel-rates'

export type Coord = [number, number]
export type TravelMode = 'walk' | 'horse' | 'caravan' | 'carriage' | 'ship' | 'riverboat' | 'mixed'
type LandMode = Exclude<TravelMode, 'ship' | 'riverboat' | 'mixed'>
export type TravelLeg = { mode: LandMode | 'ship' | 'riverboat'; km: number; days: number; points: Coord[] }
export type TravelResult = { legs: TravelLeg[]; km: number; days: number; fareCopper: number; transfers: number }
export type TravelCity = { id: string; name: string; original: string; coord: Coord; land: number; port: number | null }
export const travelModes: Record<TravelMode, string> = {
  walk: 'À pied', horse: 'À cheval', caravan: 'Caravane', carriage: 'Calèche', ship: 'Navire (mer + fleuve)', riverboat: 'Bateau fluvial', mixed: 'Mixte (marche + mer + rivière)'
}
export const KM_PER_MILE = 1.609344

const { west, north, step, width, height } = gridData
const size = width * height
const cells = new Uint8Array(size)
for (let y = 0; y < height; y++) {
  let x = 0
  const row = gridData.rows[y]
  for (let i = 0; i < row.length; i += 2) {
    cells.fill(row[i + 1], y * width + x, y * width + x + row[i])
    x += row[i]
  }
  if (x !== width) throw new Error('Maillage de voyage invalide')
}
export const travelCoverage = { west, east: west + width * step, north, south: north - height * step, step }
export function cellCoord(i: number): Coord {
  return [west + (i % width + 0.5) * step, north - (Math.floor(i / width) + 0.5) * step]
}
function cellAt([lng, lat]: Coord): number {
  const x = Math.floor((lng - west) / step), y = Math.floor((north - lat) / step)
  return x >= 0 && x < width && y >= 0 && y < height ? y * width + x : -1
}
export function terrainAt(coord: Coord): number | undefined {
  const i = cellAt(coord)
  return i < 0 ? undefined : cells[i]
}
const isLand = (i: number) => i >= 0 && cells[i] >= 1 && cells[i] <= 4
const isSea = (i: number) => i >= 0 && cells[i] === 0
export function distanceKm(a: Coord, b: Coord): number {
  const r = Math.PI / 180
  const dlat = (b[1] - a[1]) * r, dlng = (b[0] - a[0]) * r
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dlng / 2) ** 2
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, h)))
}
function neighbors(i: number, diagonals = true): number[] {
  const x = i % width, y = Math.floor(i / width), out: number[] = []
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if ((!dx && !dy) || (!diagonals && dx && dy)) continue
    if (x + dx >= 0 && x + dx < width && y + dy >= 0 && y + dy < height) out.push(i + dx + dy * width)
  }
  return out
}
// Snap only within a short coastal/cartographic tolerance, never across a strait to a distant mainland.
function nearestLand(coord: Coord): number {
  const i = cellAt(coord)
  if (i < 0) return -1
  if (isLand(i)) return i
  let best = -1, bestKm = 16
  const candidates = new Set(neighbors(i))
  for (const j of [...candidates]) for (const k of neighbors(j)) candidates.add(k)
  for (const j of candidates) if (isLand(j)) {
    const d = distanceKm(coord, cellCoord(j))
    if (d < bestKm) { best = j; bestKm = d }
  }
  return best
}
// Only a coastal settlement with a land-side connection to a sea-adjacent cell is a transfer candidate.
// These ports are geographic approximations, not evidence of a regular ship service.
function nearbyPort(land: number): number | null {
  const queue: Array<[number, number]> = [[land, 0]], seen = new Set([land])
  for (const [i, depth] of queue) {
    if (neighbors(i, false).some(isSea)) return i
    if (depth < 2) for (const j of neighbors(i, false)) if (isLand(j) && !seen.has(j)) {
      seen.add(j); queue.push([j, depth + 1])
    }
  }
  return null
}
const translations = namesFr as Record<string, string>
export const travelCities: TravelCity[] = sourcePoints.points.flatMap(p => {
  if (p.kind !== 'city') return []
  return p.coordinates.flatMap((coord, index) => {
    const point = coord as Coord, land = nearestLand(point)
    if (land < 0) return []
    return [{ id: String(p.fid) + (p.coordinates.length > 1 ? '-' + index : ''), name: translations[p.label] || p.label,
      original: p.label, coord: point, land, port: nearbyPort(land) }]
  })
}).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
const ports = new Set(travelCities.flatMap(city => city.port === null ? [] : [city.port]))
const seaPorts = new Map<number, number[]>()
for (const p of ports) for (const s of neighbors(p, false).filter(isSea)) {
  const list = seaPorts.get(s) ?? []
  list.push(p); seaPorts.set(s, list)
}
export const getTravelCity = (id: string) => travelCities.find(city => city.id === id)
export const citySearch = (query: string, waterMode: boolean | 'riverboat' = false) => {
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const q = normalize(query)
  return travelCities.filter(c => (!waterMode || (waterMode === 'riverboat' ? riverAccess.has(c.land) : c.port !== null || riverAccess.has(c.land))) && (!q || normalize(c.name + ' ' + c.original).replace(/ /g, '').includes(q.replace(/ /g, ''))))
}
type HeapItem = [number, number]
class MinHeap {
  private items: HeapItem[] = []
  push(item: HeapItem) {
    let i = this.items.length
    this.items.push(item)
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this.items[parent][1] <= item[1]) break
      this.items[i] = this.items[parent]; i = parent
    }
    this.items[i] = item
  }
  pop(): HeapItem | undefined {
    const root = this.items[0], last = this.items.pop()
    if (!last || !this.items.length) return root
    let i = 0
    while (i * 2 + 1 < this.items.length) {
      let child = i * 2 + 1
      if (child + 1 < this.items.length && this.items[child + 1][1] < this.items[child][1]) child++
      if (last[1] <= this.items[child][1]) break
      this.items[i] = this.items[child]; i = child
    }
    this.items[i] = last
    return root
  }
}
// River states are separate from land and marine cells: a river never becomes
// a walkable shortcut or a fictitious sea corridor. Join actual endpoints only.
const riverCoords: Coord[] = []
const riverNeighbors: number[][] = []
const riverBuckets = new Map<string, number[]>()
const pointIds = new Map<string, number>()
const terminals = new Set<number>()
const bucket = (p: Coord) => [Math.floor(p[0] * 10), Math.floor(p[1] * 10)]
const key = (x: number, y: number) => x + ':' + y
function riverNode(p: Coord) {
  const k = p.join(',')
  const existing = pointIds.get(k)
  if (existing !== undefined) return existing
  const i = riverCoords.length
  riverCoords.push(p); riverNeighbors.push([]); pointIds.set(k, i)
  const [x,y] = bucket(p), b = key(x,y)
  const list = riverBuckets.get(b) ?? []; list.push(i); riverBuckets.set(b,list)
  return i
}
function joinRiver(a: number, b: number) {
  if (a === b || riverNeighbors[a].includes(b)) return
  riverNeighbors[a].push(b); riverNeighbors[b].push(a)
}
function closestRiver(p: Coord, maxKm: number, skip: (i: number) => boolean = () => false) {
  const [x,y] = bucket(p)
  const dx = Math.ceil(maxKm / (11 * Math.cos(p[1] * Math.PI / 180))) + 1
  const dy = Math.ceil(maxKm / 11) + 1
  let best = -1, bestKm = maxKm
  for (let u = x-dx; u <= x+dx; u++) for (let v = y-dy; v <= y+dy; v++)
    for (const i of riverBuckets.get(key(u,v)) ?? []) {
      if (skip(i)) continue
      const d = distanceKm(p, riverCoords[i])
      if (d < bestKm) { best = i; bestKm = d }
    }
  return best
}
for (const path of riverData.paths as Coord[][]) {
  const ids = path.map(riverNode)
  terminals.add(ids[0]); terminals.add(ids[ids.length-1])
  for (let j=1; j<ids.length; j++) joinRiver(ids[j-1],ids[j])
}
// A tiny tolerance accommodates junctions digitized on a separate line.
for (const i of terminals) {
  const j = closestRiver(riverCoords[i], 2.5, n => n === i || riverNeighbors[i].includes(n))
  if (j >= 0) joinRiver(i,j)
}
// A town can reach more than one river basin (e.g. Petitioner's Port).
const components = new Int32Array(riverCoords.length); components.fill(-1)
for (let r=0; r<riverCoords.length; r++) {
  if (components[r] >= 0) continue
  const queue=[r]; components[r]=r
  for (let i=0; i<queue.length; i++) for (const n of riverNeighbors[queue[i]]) {
    if (components[n] < 0) { components[n]=r; queue.push(n) }
  }
}
const riverAccess = new Map<number, number[]>()
const riverLand = new Map<number, number[]>()
const riverMouth = new Map<number, number>()
const seaRiver = new Map<number, number[]>()
function link(map: Map<number, number[]>, a: number, b: number) {
  const list = map.get(a) ?? []
  if (!list.includes(b)) list.push(b)
  map.set(a,list)
}
// Local settlement/river links are estimated boarding access, not proof of a port.
for (const city of travelCities) {
  const seen = new Set<number>()
  for (let k=0; k<4; k++) {
    const r = closestRiver(city.coord,22,n => seen.has(components[n]))
    if (r < 0) break
    seen.add(components[r])
    for (const i of new Set([city.land, ...(city.port === null ? [] : [city.port])])) {
      link(riverAccess,i,r); link(riverLand,r,i)
    }
  }
}
function nearestWater(p: Coord, maxKm: number, seaOnly = false) {
  const i = cellAt(p)
  if (i < 0) return -1
  const candidates = new Set([i,...neighbors(i)])
  for (const j of [...candidates]) for (const k of neighbors(j)) candidates.add(k)
  let best = -1, bestKm = maxKm
  for (const j of candidates) if (isSea(j) || (!seaOnly && cells[j] === 5)) {
    const d = distanceKm(p,cellCoord(j))
    if (d < bestKm) { best = j; bestKm = d }
  }
  return best
}
// Infer flow towards mapped water outlets. An inland lake supplies direction
// but never grants sea travel. Isolated networks use the conservative upstream pace.
const outletDistances = new Float64Array(riverCoords.length); outletDistances.fill(Infinity)
const flowHeap = new MinHeap()
for (const r of terminals) {
  if (riverNeighbors[r].length !== 1) continue
  // Almas is a canonical sea port; its estuary's water polygon is isolated
  // by the coarse mesh. Link the actual Andoshen mouth to the nearest sea cell.
  const almasEstuary = distanceKm(riverCoords[r],[-2.84373,33.49074]) < 1
  const water = nearestWater(riverCoords[r],16,almasEstuary)
  if (water < 0) continue
  outletDistances[r] = 0; flowHeap.push([r,0])
  if (isSea(water)) { riverMouth.set(r,water); link(seaRiver,water,r) }
}
for (let item = flowHeap.pop(); item; item = flowHeap.pop()) {
  const [r,d] = item
  if (d !== outletDistances[r]) continue
  for (const n of riverNeighbors[r]) {
    const next = d + distanceKm(riverCoords[r],riverCoords[n])
    if (next < outletDistances[n]) { outletDistances[n] = next; flowHeap.push([n,next]) }
  }
}

export type TravelOptions = { landMiles?: number; shipMiles?: number; riverUpMiles?: number; riverDownMiles?: number }
function terrainRate(terrain: number, mode: LandMode) {
  if (terrain === 3) return mode === 'carriage' ? 0 : 1 / 3
  if (terrain === 2) return mode === 'carriage' ? 0 : 1 / 2
  if (terrain === 1 && mode === 'carriage') return 0.75
  return 1
}
export function travelFareCopper(legs: TravelLeg[]): number {
  let total = 0
  for (const mode of ['caravan', 'carriage', 'ship', 'riverboat'] as const) {
    const km = legs.filter(l => l.mode === mode).reduce((sum, l) => sum + l.km, 0)
    total += Math.ceil(km / KM_PER_MILE / 5 * travelTariffs[mode])
  }
  total += Math.ceil(legs.filter(l => l.mode === 'horse').reduce((s, l) => s + l.days, 0)) * travelTariffs.horsePerDay
  return total
}
export function calculateTravel(from: TravelCity, to: TravelCity, mode: TravelMode, options: TravelOptions = {}): TravelResult | null {
  if (from.id === to.id) return { legs: [], km: 0, days: 0, fareCopper: 0, transfers: 0 }
  const aquaticOnly = mode === 'ship' || mode === 'riverboat'
  const canSea = mode === 'ship' || mode === 'mixed'
  const canRiver = canSea || mode === 'riverboat'
  const terrestrial: LandMode = aquaticOnly || mode === 'mixed' ? 'walk' : mode
  const positive = (n: number | undefined, fallback: number) => n && Number.isFinite(n) && n > 0 ? Math.min(n, 200) : fallback
  const landSpeed = positive(options.landMiles, defaultMilesPerDay[terrestrial]) * KM_PER_MILE
  const seaSpeed = positive(options.shipMiles, defaultMilesPerDay.ship) * KM_PER_MILE
  const riverUp = positive(options.riverUpMiles, defaultMilesPerDay.riverUp) * KM_PER_MILE
  const riverDown = positive(options.riverDownMiles, defaultMilesPerDay.riverDown) * KM_PER_MILE
  if (mode === 'ship' && [from,to].some(c => c.port === null && !riverAccess.has(c.land))) return null
  if (mode === 'riverboat' && [from,to].some(c => !riverAccess.has(c.land))) return null
  const start = mode === 'ship' ? from.port ?? from.land : from.land
  const goal = mode === 'ship' ? to.port ?? to.land : to.land
  // Sea and rivers are independent state spaces, not terrain types.
  const riverBase = 2 * size
  const limit = canRiver ? riverBase + riverCoords.length : size
  const isRiverState = (s: number) => s >= riverBase
  const isSeaState = (s: number) => s >= size && s < riverBase
  const stateCoord = (s: number): Coord => isRiverState(s) ? riverCoords[s-riverBase] : cellCoord(s % size)
  const canTransfer = (i: number) => aquaticOnly ? i === start || i === goal : true
  const allowedLand = (i: number) => isLand(i) && terrainRate(cells[i], terrestrial) > 0
  if (!aquaticOnly && (!allowedLand(start) || !allowedLand(goal))) return null
  const g = new Float64Array(limit); g.fill(Infinity)
  const previous = new Int32Array(limit); previous.fill(-1)
  const done = new Uint8Array(limit)
  const heap = new MinHeap()
  const targetCoord = cellCoord(goal)
  const fastest = Math.max(landSpeed, canSea ? seaSpeed : 0, canRiver ? riverUp : 0, canRiver ? riverDown : 0)
  const heuristic = (i: number) => distanceKm(stateCoord(i), targetCoord) / fastest
  g[start] = 0; heap.push([start, heuristic(start)])
  const update = (a: number, b: number, days: number) => {
    const next = g[a] + days
    if (!done[b] && next < g[b]) { g[b] = next; previous[b] = a; heap.push([b, next + heuristic(b)]) }
  }
  for (let item = heap.pop(); item; item = heap.pop()) {
    const state = item[0]
    if (done[state]) continue
    done[state] = 1
    if (state === goal) break
    const point = stateCoord(state)
    if (isRiverState(state)) {
      const r = state-riverBase
      for (const n of riverNeighbors[r]) {
        const speed = outletDistances[n] < outletDistances[r] ? riverDown : riverUp
        update(state,riverBase+n,distanceKm(point,riverCoords[n])/speed)
      }
      for (const l of riverLand.get(r) ?? []) if (canTransfer(l))
        update(state,l,distanceKm(point,cellCoord(l))/landSpeed+0.25)
      const mouth = riverMouth.get(r)
      if (canSea && mouth !== undefined) update(state,size+mouth,distanceKm(point,cellCoord(mouth))/Math.min(seaSpeed,riverDown)+0.25)
      continue
    }
    const sea = isSeaState(state), i = state % size
    const permitted = sea ? isSea : allowedLand
    if (sea || !aquaticOnly) for (const j of neighbors(i)) {
      if (!permitted(j)) continue
      if (i % width !== j % width && Math.floor(i / width) !== Math.floor(j / width)) {
        if (!permitted(Math.floor(i / width) * width + j % width) || !permitted(Math.floor(j / width) * width + i % width)) continue
      }
      const km = distanceKm(point, cellCoord(j))
      const rate = sea ? 1 : Math.min(terrainRate(cells[i], terrestrial), terrainRate(cells[j], terrestrial))
      update(state, j + (sea ? size : 0), km / ((sea ? seaSpeed : landSpeed) * rate))
    }
    if (canSea) {
      if (!sea && ports.has(i) && canTransfer(i)) {
        for (const j of neighbors(i, false).filter(isSea)) update(state, j + size, distanceKm(point, cellCoord(j)) / seaSpeed + 0.25)
      } else if (sea) {
        for (const j of seaPorts.get(i) ?? []) if (canTransfer(j)) update(state, j, distanceKm(point, cellCoord(j)) / seaSpeed + 0.25)
        for (const r of seaRiver.get(i) ?? []) update(state,riverBase+r,distanceKm(point,riverCoords[r])/Math.min(seaSpeed,riverUp)+0.25)
      }
    }
    if (canRiver && !sea && canTransfer(i)) for (const r of riverAccess.get(i) ?? [])
      update(state,riverBase+r,distanceKm(point,riverCoords[r])/landSpeed+0.25)
  }
  if (!Number.isFinite(g[goal])) return null
  const path: number[] = []
  for (let i = goal; i >= 0; i = previous[i]) { path.push(i); if (i === start) break }
  path.reverse()
  const legs: TravelLeg[] = []
  let transfers = 0
  function append(kind: TravelLeg['mode'], a: Coord, b: Coord, days: number) {
    const km = distanceKm(a, b)
    if (km < 1e-8 && days === 0) return
    let leg = legs.at(-1)
    if (!leg || leg.mode !== kind) { leg = { mode: kind, km: 0, days: 0, points: [a] }; legs.push(leg) }
    leg.points.push(b); leg.km += km; leg.days += days
  }
  const first = cellCoord(start), end = cellCoord(goal)
  append(terrestrial, from.coord, first, distanceKm(from.coord, first) / landSpeed)
  for (let i = 1; i < path.length; i++) {
    const a = path[i-1], b = path[i]
    const aKind = isRiverState(a) ? 'riverboat' : isSeaState(a) ? 'ship' : terrestrial
    const bKind = isRiverState(b) ? 'riverboat' : isSeaState(b) ? 'ship' : terrestrial
    if (aKind !== bKind) transfers++
    // Land-to-river access is on foot; maritime transitions retain blue.
    const kind = aKind === bKind ? aKind : aKind === 'ship' || bKind === 'ship' ? 'ship' : terrestrial
    append(kind,stateCoord(a),stateCoord(b),g[b]-g[a])
  }
  append(terrestrial, end, to.coord, distanceKm(end, to.coord) / landSpeed)
  return { legs, km: legs.reduce((s, l) => s + l.km, 0), days: legs.reduce((s, l) => s + l.days, 0), fareCopper: travelFareCopper(legs), transfers }
}
export function calculateItinerary(stops: TravelCity[], mode: TravelMode, options: TravelOptions = {}): TravelResult | null {
  if (stops.length < 2 || stops.length > 8) return null
  const legs: TravelLeg[] = []
  let transfers = 0
  for (let i=1;i<stops.length;i++) {
    const segment = calculateTravel(stops[i-1],stops[i],mode,options)
    if (!segment) return null
    legs.push(...segment.legs); transfers += segment.transfers
  }
  return { legs, transfers, km:legs.reduce((s,l)=>s+l.km,0), days:legs.reduce((s,l)=>s+l.days,0), fareCopper:travelFareCopper(legs) }
}
export function travelMapUrl(from: TravelCity, to: TravelCity, mode: TravelMode, options: TravelOptions = {}, via: TravelCity[] = []) {
  const url = new URL('https://map.l7r.fr/mj')
  url.searchParams.set('travelFrom', from.id); url.searchParams.set('travelTo', to.id); url.searchParams.set('travelMode', mode)
  for (const stop of via.slice(0,6)) url.searchParams.append('travelVia',stop.id)
  for (const field of ['landMiles','shipMiles','riverUpMiles','riverDownMiles'] as const)
    if (options[field]) url.searchParams.set(field,String(options[field]))
  return url.toString()
}
