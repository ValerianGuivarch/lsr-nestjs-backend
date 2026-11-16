// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import TravelsPage from './Travels'
import { resolvePf2Route, viewPaths } from './routing'
import { travelCities } from '../../../web-golarion-map/src/tools/travel-planner'

describe('Monde – Voyages', () => {
  it('calcule un trajet, affiche le budget et ouvre le tracé sur la carte MJ', async () => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    const node = document.createElement('div'); document.body.append(node)
    const root = createRoot(node)
    const destination = travelCities.find(c => c.original === 'Sandpoint')!
    try {
      await act(async () => root.render(<TravelsPage />))
      expect(resolvePf2Route(viewPaths.voyages)).toEqual({kind:'view',view:'voyages'})
      const select = node.querySelector<HTMLSelectElement>('select[aria-label="Arrivée"]')!
      await act(async () => { select.value = destination.id; select.dispatchEvent(new Event('change', { bubbles: true })) })
      const button = [...node.querySelectorAll('button')].find(b => b.textContent === 'Calculer l’itinéraire')!
      await act(async () => { button.click(); await new Promise(resolve => setTimeout(resolve, 10)) })
      expect(node.textContent).toContain('Distance estimée')
      expect(node.textContent).toContain('Total · 4 voyageurs')
      expect(node.querySelector('a[href*="map.l7r.fr/mj"]')?.getAttribute('href')).toContain('travelTo='+destination.id)
      expect(node.textContent).not.toContain('Aucun itinéraire')
      console.log('Exemple Absalom → Pointesable:', node.querySelector('.travel-metrics')?.textContent)
    } finally { await act(async () => root.unmount()); node.remove() }
  })
})
