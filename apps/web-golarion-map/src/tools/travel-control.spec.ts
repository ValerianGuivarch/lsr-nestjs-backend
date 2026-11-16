// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import type { Map as GLMap } from 'maplibre-gl'
import { TravelControl } from './travel-control'
import { travelCities } from './travel-planner'

describe('TravelControl', () => {
  it('loads the same route from an admin link, draws the line and clears it', () => {
    const a = travelCities.find(c => c.original === 'Absalom')!, b = travelCities.find(c => c.original === "Falcon's Hollow")!, via = travelCities.find(c => c.original === 'Almas')!
    window.history.replaceState(null, '', '/mj?travelFrom='+a.id+'&travelTo='+b.id+'&travelMode=ship&travelVia='+via.id+'&riverUpMiles=30')
    const source = { setData: vi.fn() }
    let hasSource = false, hasLayer = false
    const map = { isStyleLoaded: () => true, getSource: () => hasSource ? source : undefined,
      addSource: vi.fn(() => { hasSource = true }), getLayer: () => hasLayer ? {} : undefined,
      addLayer: vi.fn(() => { hasLayer = true }), fitBounds: vi.fn(),
      removeLayer: vi.fn(), removeSource: vi.fn()
    }
    const control = new TravelControl()
    const el = control.onAdd(map as unknown as GLMap)
    expect(el.querySelector<HTMLDivElement>('.travel-map-panel')?.hidden).toBe(false)
    expect(map.fitBounds).toHaveBeenCalled()
    const collection = source.setData.mock.calls.at(-1)?.[0]
    expect(collection.features.some((f: {properties:{mode:string}}) => f.properties.mode === 'ship')).toBe(true)
    expect(collection.features.some((f: {properties:{mode:string}}) => f.properties.mode === 'riverboat')).toBe(true)
    expect(el.querySelector<HTMLSelectElement>('select[aria-label="Étape 1"]')?.value).toBe(via.id)
    expect(el.querySelector<HTMLInputElement>('input[aria-label="Miles/jour en rivière (amont)"]')?.value).toBe('30')
    expect(el.textContent).toContain('km')
    ;[...el.querySelectorAll('button')].find(b => b.textContent === 'Effacer')!.click()
    expect(source.setData).toHaveBeenLastCalledWith({type:'FeatureCollection', features:[]})
    control.onRemove()
  })
})
