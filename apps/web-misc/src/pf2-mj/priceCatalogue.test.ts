import { describe, expect, it } from 'vitest'
import { filterPrices, formatCoins, formatPrice, priceEntries } from './priceCatalogue'
import { resolvePf2Route, viewPaths } from './routing'

describe('Catalogue de prix MJ', () => {
  it('contient des prix cohérents, des unités explicites et des sources pour les tarifs officiels', () => {
    expect(priceEntries.length).toBeGreaterThan(250)
    const keys = priceEntries.map(entry => [entry.category, entry.name, entry.unit].join(':'))
    expect(new Set(keys).size).toBe(keys.length)
    for (const entry of priceEntries) {
      expect(Number.isInteger(entry.min) && Number.isInteger(entry.max)).toBe(true)
      expect(entry.min).toBeGreaterThanOrEqual(0)
      expect(entry.max).toBeGreaterThanOrEqual(entry.min)
      expect(entry.unit).not.toBe('')
      expect(Boolean(entry.source)).toBe(entry.origin === 'official')
    }
  })
  it('retrouve les variantes de bière et les armes sans accents ni articles', () => {
    expect(filterPrices('une biere').map(entry => entry.name)).toContain('Bière ordinaire')
    expect(filterPrices('bonne biere').map(entry => entry.name)).toContain('Bonne bière artisanale')
    expect(filterPrices('epees').map(entry => entry.name)).toContain('Épée longue')
    expect(filterPrices('voyage en bateau').map(entry => entry.name)).toContain('Navire à voiles (passager)')
  })
  it('distingue les règles et les estimations et applique les catégories', () => {
    const boats = filterPrices('navire', 'Transport & voyage', 'official')
    expect(boats).toHaveLength(1)
    expect(boats[0].min).toBe(6)
    expect(filterPrices('navire', 'Transport & voyage', 'estimate').some(entry => entry.min === 72)).toBe(true)
    expect(filterPrices('bière', 'Armes ordinaires')).toEqual([])
  })
  it('convertit et multiplie les montants en cuivre, argent et or', () => {
    expect(formatCoins(0)).toBe('Gratuit')
    expect(formatCoins(1234)).toBe('12 po 3 pa 4 pc')
    expect(formatCoins(10)).toBe('1 pa')
    const shipDay = priceEntries.find(entry => entry.name === 'Navire à voiles — journée type')!
    expect(formatPrice(shipDay, 4)).toBe('2 po 8 pa 8 pc')
    const beer = priceEntries.find(entry => entry.name === 'Bonne bière artisanale')!
    expect(formatPrice(beer, 3)).toBe('6 pc – 1 pa 2 pc')
  })
  it('expose un lien direct vers les prix dans Monde', () => {
    expect(resolvePf2Route(viewPaths.prix)).toEqual({ kind: 'view', view: 'prix' })
  })
})
