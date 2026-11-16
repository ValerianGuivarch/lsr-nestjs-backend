import { describe, expect, it } from 'vitest'
import { calculateTravel, calculateItinerary, citySearch, travelCities, distanceKm, terrainAt, travelModes, travelMapUrl } from './travel-planner'

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
  it('connects the Almas estuary to the sea without an inland walking detour', () => {
    const route=calculateTravel(city('Absalom'),city('Almas'),'ship')!
    expect(route).not.toBeNull()
    expect(route.legs.some(l=>l.mode==='ship')).toBe(true)
    expect(route.legs.some(l=>l.mode==='riverboat')).toBe(true)
    expect(route.legs.filter(l=>l.mode==='walk').reduce((s,l)=>s+l.km,0)).toBeLessThan(25)
    expect(citySearch('Almas',true).some(c=>c.original==='Almas')).toBe(true)
  })
  it('follows the Foam upstream and downstream at different speeds', () => {
    const a=city('Almas'), b=city("Falcon's Hollow")
    const up=calculateTravel(a,b,'riverboat')!, down=calculateTravel(b,a,'riverboat')!
    expect(up).not.toBeNull()
    expect(up.legs.some(l=>l.mode==='riverboat')).toBe(true)
    expect(down.days).toBeLessThan(up.days)
    expect(calculateTravel(b,city('Davarn'),'riverboat')?.legs.some(l=>l.mode==='riverboat')).toBe(true)
    expect(calculateTravel(city('Absalom'),b,'riverboat')).toBeNull()
    expect(calculateTravel(city('Absalom'),city('Almas'),'walk')).toBeNull()
  })
  it('uses the Foam corridor for a mixed route from Absalom to Breachill', () => {
    const r=calculateTravel(city('Absalom'),city('Breachill'),'mixed')!
    expect(r).not.toBeNull()
    expect(r.legs.some(l=>l.mode==='riverboat')).toBe(true)
    expect(r.legs.filter(l=>l.mode==='walk').reduce((s,l)=>s+l.km,0)).toBeLessThan(300)
  })
  it('connects Druma ports along the Profit’s Flow', () => {
    const r=calculateTravel(city("Petitioner's Port"),city('Macridi'),'riverboat')!
    expect(r).not.toBeNull()
    expect(r.legs.some(l=>l.mode==='riverboat')).toBe(true)
    expect(calculateTravel(city('Alabastrine'),city('Macridi'),'riverboat')?.days).toBeLessThan(5)
  })
  it('honors all ordered waypoints and preserves them in the map URL', () => {
    const stops=['Absalom','Almas',"Falcon's Hollow",'Davarn','Breachill'].map(city)
    const route=calculateItinerary(stops,'mixed')!
    expect(route).not.toBeNull()
    expect(route.legs.some(l=>l.mode==='riverboat')).toBe(true)
    const parts=stops.slice(1).map((c,i)=>calculateTravel(stops[i],c,'mixed')!)
    expect(route.days).toBeCloseTo(parts.reduce((s,r)=>s+r.days,0),5)
    expect(route.km).toBeCloseTo(parts.reduce((s,r)=>s+r.km,0),5)
    const url=new URL(travelMapUrl(stops[0],stops.at(-1)!,'mixed',{riverUpMiles:30,riverDownMiles:50},stops.slice(1,-1)))
    expect(url.searchParams.getAll('travelVia')).toEqual(stops.slice(1,-1).map(c=>c.id))
    expect(url.searchParams.get('riverUpMiles')).toBe('30')
    expect(calculateItinerary(stops,'walk')).toBeNull()
  })
  it('handles identical locations and deep links', () => {
    const a = city('Absalom')
    expect(calculateTravel(a, a, 'walk')?.days).toBe(0)
    const url = new URL(travelMapUrl(a, city('Sandpoint'), 'ship'))
    expect(url.searchParams.get('travelFrom')).toBe(a.id)
    expect(url.searchParams.get('travelMode')).toBe('ship')
    expect(Object.keys(travelModes)).toHaveLength(7)
  })
})
