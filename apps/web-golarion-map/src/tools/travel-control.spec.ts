// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import type { Map as GLMap } from 'maplibre-gl'
import { TravelControl, travelPanelPlacement } from './travel-control'
import { travelCities } from './travel-planner'

describe('TravelControl', () => {
  it('fits below the button or opens upward when the map is short', () => {
    expect(travelPanelPlacement({top:200,bottom:230},{top:0,bottom:700},700)).toEqual({opensUp:false,maxHeight:438})
    expect(travelPanelPlacement({top:440,bottom:470},{top:0,bottom:520},520)).toEqual({opensUp:true,maxHeight:428})
    expect(travelPanelPlacement({top:200,bottom:230},{top:80,bottom:1000},600)).toEqual({opensUp:false,maxHeight:338})
  })
  it('loads the same route from an admin link, draws the line and clears it', () => {
    const a = travelCities.find(c => c.original === 'Absalom')!, b = travelCities.find(c => c.original === "Falcon's Hollow")!, via = travelCities.find(c => c.original === 'Almas')!
    window.history.replaceState(null, '', '/mj?travelFrom='+a.id+'&travelTo='+b.id+'&travelMode=ship&travelVia='+via.id+'&riverUpMiles=30')
    const source = { setData: vi.fn() }
    let hasSource = false, hasLayer = false
    const mapContainer = document.createElement('div'); document.body.append(mapContainer)
    vi.spyOn(mapContainer,'getBoundingClientRect').mockReturnValue(new DOMRect(0,0,900,700))
    const map = { getContainer: () => mapContainer, isStyleLoaded: () => true, getSource: () => hasSource ? source : undefined,
      addSource: vi.fn(() => { hasSource = true }), getLayer: () => hasLayer ? {} : undefined,
      addLayer: vi.fn(() => { hasLayer = true }), fitBounds: vi.fn(),
      removeLayer: vi.fn(), removeSource: vi.fn()
    }
    const control = new TravelControl()
    const el = control.onAdd(map as unknown as GLMap)
    mapContainer.append(el)
    vi.spyOn(el,'getBoundingClientRect').mockReturnValue(new DOMRect(850,200,30,30))
    window.dispatchEvent(new Event('resize'))
    const panel=el.querySelector<HTMLDivElement>('.travel-map-panel')!
    expect(panel.hidden).toBe(false)
    expect(panel.style.getPropertyValue('--travel-panel-height')).toBe('438px')
    expect(panel.querySelector('.travel-map-body input[aria-label="Miles/jour en rivière (aval)"]')).not.toBeNull()
    expect(panel.querySelector('.travel-map-footer .travel-map-calc')?.textContent).toBe('Calculer')
    expect(panel.querySelector('.travel-map-footer p')?.textContent).toContain('km')
    const outerWheel=vi.fn(); mapContainer.addEventListener('wheel',outerWheel)
    panel.querySelector('.travel-map-body')!.dispatchEvent(new WheelEvent('wheel',{bubbles:true}))
    expect(outerWheel).not.toHaveBeenCalled()
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
    mapContainer.remove()
  })
})
