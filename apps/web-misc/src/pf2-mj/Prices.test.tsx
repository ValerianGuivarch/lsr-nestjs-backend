// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import PricesPage from './Prices'

describe('Page des prix', () => {
  it('affiche puis filtre les prix avec ses raccourcis et multiplie la quantité', async () => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    const element = document.createElement('div')
    document.body.append(element)
    const root = createRoot(element)
    try {
      await act(async () => root.render(<PricesPage />))
      expect(element.querySelector('h1')?.textContent).toBe('Prix & services')
      expect(element.textContent).toContain('Épée longue')
      const beer = [...element.querySelectorAll('button')].find(button => button.textContent === 'Bière')!
      await act(async () => beer.click())
      expect(element.textContent).toContain('Bonne bière artisanale')
      expect(element.textContent).not.toContain('Épée longue')
      expect(element.textContent).toContain('Officiel')
      expect(element.textContent).toContain('Estimation MJ')
      const qty = element.querySelector<HTMLInputElement>('input[type=number]')!
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(qty, '4')
        qty.dispatchEvent(new Event('input', { bubbles: true }))
      })
      expect(element.textContent).toContain('Total × 4')
      expect(element.textContent).toContain('4 pc')
      await act(async () => [...element.querySelectorAll('button')].find(button => button.textContent === 'Réinitialiser')!.click())
      expect(element.textContent).toContain('Épée longue')
      expect(element.textContent).not.toContain('Total × 4')
    } finally {
      await act(async () => root.unmount())
      element.remove()
    }
  })
})
