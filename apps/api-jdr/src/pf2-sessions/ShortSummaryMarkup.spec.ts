import { shortSummaryDefaultLabel, shortSummaryForDiscord } from './ShortSummaryMarkup'

describe('ShortSummaryMarkup', () => {
  it('turns wiki-lite links into bold Discord labels without URLs', () => {
    expect(shortSummaryForDiscord('Bise à [[Personnage:Sheila_Heidmarch]] puis aux [[Faction:Veilleurs_de_la_Côte_Perdue|Veilleurs]].'))
      .toBe('Bise à **Sheila Heidmarch** puis aux **Veilleurs**.')
  })

  it('keeps ordinary text and strips only the namespace from default labels', () => {
    expect(shortSummaryDefaultLabel('Absalom')).toBe('Absalom')
    expect(shortSummaryDefaultLabel('Personnage:Sheila Heidmarch')).toBe('Sheila Heidmarch')
    expect(shortSummaryForDiscord('[[Absalom]]')).toBe('**Absalom**')
  })
})
