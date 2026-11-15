import { describe, expect, it } from 'vitest'
import { calculateTravel, citySearch, travelCities, distanceKm, terrainAt, travelModes, travelMapUrl } from './travel-planner'

const city = (name: string) => {
  const found = travelCities.find(c => c.original === name)
  if (!found) throw Error('Missing city ' + name)
  return found
}
describe('Golarion travel mesh', () => {
  it('retains the real city catalogue and French aliases', () => {
    expect(travelCities.length).toBeGreaterThan(400)
    expect(citySearch('pointe sable').some(c => c.original === 'Sandpoint')).toBe(true)
    expect(new Set(travelCities.map(c => c.id)).size).toBe(travelCities.length)
  })
  it('does not permit walking across the sea from Kortos', () => {
    expect(calculateTravel(city('Absalom'), city('Almas'), 'walk')).toBeNull()
  })
  it('routes Absalom to Sandpoint by sea', () => {
    const result = calculateTravel(city('Absalom'), city('Sandpoint'), 'ship')!
    expect(result).not.toBeNull()
    expect(result.transfers).toBe(2)
    expect(result.legs.some(l => l.mode === 'ship')).toBe(true)
    expect(result.km).toBeGreaterThanOrEqual(distanceKm(city('Absalom').coord, city('Sandpoint').coord) - 0.1)
    expect(result.days).toBeGreaterThan(1)
    expect(result.fareCopper).toBeGreaterThan(0)
    const points = result.legs.find(l => l.mode === 'ship')!.points
    expect(points.slice(1, -1).every(p => terrainAt(p) === 0)).toBe(true)
  })
  it('routes two Varisian cities by land, respecting terrain', () => {
    const result = calculateTravel(city('Sandpoint'), city('Magnimar'), 'walk')!
    expect(result).not.toBeNull()
    expect(result.fareCopper).toBe(0)
    expect(result.legs.every(l => l.mode === 'walk')).toBe(true)
    expect(result.days).toBeGreaterThan(0)
    expect(result.km).toBeGreaterThanOrEqual(distanceKm(city('Sandpoint').coord, city('Magnimar').coord) - 0.1)
  })
  it('supports mixed routes and changes time with travel speed', () => {
    const result = calculateTravel(city('Absalom'), city('Almas'), 'mixed')!
    expect(result).not.toBeNull()
    expect(result.legs.some(l => l.mode === 'ship')).toBe(true)
    const normal = calculateTravel(city('Sandpoint'), city('Magnimar'), 'walk')!
    const fast = calculateTravel(city('Sandpoint'), city('Magnimar'), 'walk', {landMiles: 40})!
    expect(fast.days).toBeCloseTo(normal.days / 2, 5)
  })
  it('handles identical locations and deep links', () => {
    const a = city('Absalom')
    expect(calculateTravel(a, a, 'walk')?.days).toBe(0)
    const url = new URL(travelMapUrl(a, city('Sandpoint'), 'ship'))
    expect(url.searchParams.get('travelFrom')).toBe(a.id)
    expect(url.searchParams.get('travelMode')).toBe('ship')
    expect(Object.keys(travelModes)).toHaveLength(6)
  })
})
