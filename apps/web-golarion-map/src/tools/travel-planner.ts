import gridData from '../../resources/travel-grid.json'
import sourcePoints from '../../resources/map-source-points.json'
import namesFr from '../../resources/place-names.fr.json'
import { defaultMilesPerDay, travelTariffs } from './travel-rates'
export { defaultMilesPerDay, travelTariffs } from './travel-rates'

export type Coord = [number, number]
export type TravelMode = 'walk' | 'horse' | 'caravan' | 'carriage' | 'ship' | 'mixed'
type LandMode = Exclude<TravelMode, 'ship' | 'mixed'>
export type TravelLeg = { mode: LandMode | 'ship'; km: number; days: number; points: Coord[] }
export type TravelResult = { legs: TravelLeg[]; km: number; days: number; fareCopper: number; transfers: number }
export type TravelCity = { id: string; name: string; original: string; coord: Coord; land: number; port: number | null }
export const travelModes: Record<TravelMode, string> = {
  walk: 'À pied', horse: 'À cheval', caravan: 'Caravane', carriage: 'Calèche', ship: 'Navire', mixed: 'Mixte (marche + navire)'
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
export const citySearch = (query: string, coastal = false) => {
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const q = normalize(query)
  return travelCities.filter(c => (!coastal || c.port !== null) && (!q || normalize(c.name + ' ' + c.original).replace(/ /g, '').includes(q.replace(/ /g, ''))))
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
type Options = { landMiles?: number; shipMiles?: number }
function terrainRate(terrain: number, mode: LandMode) {
  if (terrain === 3) return mode === 'carriage' ? 0 : 1 / 3
  if (terrain === 2) return mode === 'carriage' ? 0 : 1 / 2
  if (terrain === 1 && mode === 'carriage') return 0.75
  return 1
}
export function travelFareCopper(legs: TravelLeg[]): number {
  let total = 0
  for (const mode of ['caravan', 'carriage', 'ship'] as const) {
    const km = legs.filter(l => l.mode === mode).reduce((sum, l) => sum + l.km, 0)
    total += Math.ceil(km / KM_PER_MILE / 5 * travelTariffs[mode])
  }
  total += Math.ceil(legs.filter(l => l.mode === 'horse').reduce((s, l) => s + l.days, 0)) * travelTariffs.horsePerDay
  return total
}
export function calculateTravel(from: TravelCity, to: TravelCity, mode: TravelMode, options: Options = {}): TravelResult | null {
  if (from.id === to.id) return { legs: [], km: 0, days: 0, fareCopper: 0, transfers: 0 }
  if (mode === 'ship' && (from.port === null || to.port === null)) return null
  const terrestrial: LandMode = mode === 'mixed' || mode === 'ship' ? 'walk' : mode
  const positive = (n: number | undefined, fallback: number) => n && Number.isFinite(n) && n > 0 ? Math.min(n, 200) : fallback
  const landSpeed = positive(options.landMiles, defaultMilesPerDay[terrestrial]) * KM_PER_MILE
  const seaSpeed = positive(options.shipMiles, defaultMilesPerDay.ship) * KM_PER_MILE
  const marineOnly = mode === 'ship'
  const multimodal = mode === 'mixed' || marineOnly
  const limit = multimodal ? size * 2 : size
  const start = marineOnly ? from.port! : from.land
  const goal = marineOnly ? to.port! : to.land
  // Sea-only routes may enter/leave only at their two endpoints.
  const canTransfer = (i: number) => marineOnly ? i === start || i === goal : ports.has(i)
  const allowedLand = (i: number) => isLand(i) && terrainRate(cells[i], terrestrial) > 0
  if (!marineOnly && (!allowedLand(start) || !allowedLand(goal))) return null
  const g = new Float64Array(limit); g.fill(Infinity)
  const previous = new Int32Array(limit); previous.fill(-1)
  const done = new Uint8Array(limit)
  const heap = new MinHeap()
  const targetCoord = cellCoord(goal)
  const fastest = multimodal ? Math.max(landSpeed, seaSpeed) : landSpeed
  const heuristic = (i: number) => distanceKm(cellCoord(i % size), targetCoord) / fastest
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
    const sea = state >= size, i = state % size, point = cellCoord(i)
    const permitted = sea ? isSea : allowedLand
    if (sea || !marineOnly) for (const j of neighbors(i)) {
      if (!permitted(j)) continue
      // Diagonal moves must not cut across land/water corners.
      if (i % width !== j % width && Math.floor(i / width) !== Math.floor(j / width)) {
        if (!permitted(Math.floor(i / width) * width + j % width) || !permitted(Math.floor(j / width) * width + i % width)) continue
      }
      const km = distanceKm(point, cellCoord(j))
      const rate = sea ? 1 : Math.min(terrainRate(cells[i], terrestrial), terrainRate(cells[j], terrestrial))
      update(state, j + (sea ? size : 0), km / ((sea ? seaSpeed : landSpeed) * rate))
    }
    if (multimodal) {
      if (!sea && canTransfer(i)) {
        for (const j of neighbors(i, false).filter(isSea)) update(state, j + size, distanceKm(point, cellCoord(j)) / seaSpeed + 0.25)
      } else if (sea) {
        for (const j of seaPorts.get(i) ?? []) if (canTransfer(j)) update(state, j, distanceKm(point, cellCoord(j)) / seaSpeed + 0.25)
      }
    }
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
  // The first/last connector accounts for the city position and mesh approximation.
  // For maritime-only routes, access to the harbor is a short local walking leg.
  append(marineOnly ? 'walk' : terrestrial, from.coord, first, distanceKm(from.coord, first) / landSpeed)
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i], sea = a >= size || b >= size
    if ((a >= size) !== (b >= size)) transfers++
    append(sea ? 'ship' : terrestrial, cellCoord(a % size), cellCoord(b % size), g[b] - g[a])
  }
  append(marineOnly ? 'walk' : terrestrial, end, to.coord, distanceKm(end, to.coord) / landSpeed)
  return { legs, km: legs.reduce((s, l) => s + l.km, 0), days: legs.reduce((s, l) => s + l.days, 0), fareCopper: travelFareCopper(legs), transfers }
}
export function travelMapUrl(from: TravelCity, to: TravelCity, mode: TravelMode, options: Options = {}) {
  const url = new URL('https://map.l7r.fr/mj')
  url.searchParams.set('travelFrom', from.id); url.searchParams.set('travelTo', to.id); url.searchParams.set('travelMode', mode)
  if (options.landMiles) url.searchParams.set('landMiles', String(options.landMiles))
  if (options.shipMiles) url.searchParams.set('shipMiles', String(options.shipMiles))
  return url.toString()
}
