import { Pf2JournalsService } from './Pf2JournalsService'

describe('Pf2JournalsService', () => {
  const persistence = () => ({ listJournalRevelations: jest.fn().mockResolvedValue([]), listJournalDefinitions: jest.fn().mockResolvedValue([]), saveJournalDefinition: jest.fn(), deleteJournalDefinition: jest.fn(), claimJournalReveal: jest.fn(), completeJournalReveal: jest.fn(), abandonJournalReveal: jest.fn() })
  const withCatalogue = (items: Array<{ number: number; title: string; content: string; dependencies: number[] }>, revealed: number[] = []) => {
    const store = persistence()
    store.listJournalRevelations.mockResolvedValue(revealed.map(journalNumber => ({ journalNumber, revealedAt: '2026-01-01', revealedBy: null, discordMessageId: null })))
    store.listJournalDefinitions.mockResolvedValue(items.map(item => ({ ...item, createdAt: '', updatedAt: '' })))
    return new Pf2JournalsService(store as never)
  }

  it('retourne le journal sans dépendance', async () => {
    const service = withCatalogue([{ number: 68, title: 'Thassilon', content: 'Secret', dependencies: [] }])
    await expect(service.resolveJournalToReveal(68)).resolves.toMatchObject({ number: 68 })
  })
  it('remonte récursivement au premier prérequis manquant', async () => {
    const items = [
      { number: 68, title: 'A', content: '', dependencies: [] },
      { number: 69, title: 'B', content: '', dependencies: [68] },
      { number: 70, title: 'C', content: '', dependencies: [69] },
    ]
    await expect(withCatalogue(items).resolveJournalToReveal(70)).resolves.toMatchObject({ number: 68 })
    await expect(withCatalogue(items, [68]).resolveJournalToReveal(70)).resolves.toMatchObject({ number: 69 })
    await expect(withCatalogue(items, [68, 69]).resolveJournalToReveal(70)).resolves.toMatchObject({ number: 70 })
  })
  it('ne retourne jamais un contenu non révélé dans la vue publique', async () => {
    const service = withCatalogue([{ number: 68, title: 'Thassilon', content: 'Secret réel', dependencies: [] }])
    await expect(service.view(68)).resolves.toEqual(expect.objectContaining({ number: 68, revealed: false }))
    await expect(service.view(68)).resolves.not.toHaveProperty('content')
    await expect(service.view(68, true)).resolves.toMatchObject({ content: 'Secret réel' })
  })
  it('détecte une dépendance circulaire pendant la résolution', async () => {
    const service = withCatalogue([{ number: 68, title: 'A', content: '', dependencies: [69] }, { number: 69, title: 'B', content: '', dependencies: [68] }])
    await expect(service.resolveJournalToReveal(68)).rejects.toThrow('circulaire')
  })
})
