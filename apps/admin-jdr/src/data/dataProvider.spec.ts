import { beforeEach, describe, expect, it, vi } from 'vitest'
import { jdrAggregateStore } from './aggregateStore'
import { JdrAggregate } from './types'

vi.mock('./jdrApi', () => ({
  jdrApi: {
    updateCharacter: vi.fn(),
    addCharacterGroup: vi.fn(),
    removeCharacterGroup: vi.fn(),
    addCharacterTrait: vi.fn(),
    removeCharacterTrait: vi.fn(),
    addCharacterItem: vi.fn(),
    removeCharacterItem: vi.fn(),
    updateCharacterResource: vi.fn(),
    removeCharacterResource: vi.fn(),
    updateCharacterStat: vi.fn()
  }
}))

// Imported after the mock so the module under test picks up the mocked jdrApi.
const { jdrApi } = await import('./jdrApi')
const { dataProvider } = await import('./dataProvider')

function fakeAggregate(character: Partial<JdrAggregate['characters'][number]>): JdrAggregate {
  return {
    slug: 'vikingtest',
    name: 'Viking',
    text: '',
    stats: [],
    traits: [],
    resources: [],
    groupResources: [],
    items: [],
    groupItems: [],
    classes: [],
    groups: [],
    characters: [
      {
        slug: 'astrid',
        name: 'Astrid',
        classSlug: null,
        groupSlugs: [],
        classLevel: 1,
        isPlayable: true,
        text: '',
        stats: [],
        traitSlugs: [],
        items: [],
        resources: [],
        ...character
      }
    ]
  }
}

describe('dataProvider characters update - relation diffing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    jdrAggregateStore.setSelectedSlug('vikingtest')
    vi.mocked(jdrApi.updateCharacter).mockResolvedValue(fakeAggregate({}))
    vi.mocked(jdrApi.addCharacterGroup).mockResolvedValue(fakeAggregate({ groupSlugs: ['conseil'] }))
    vi.mocked(jdrApi.removeCharacterGroup).mockResolvedValue(fakeAggregate({}))
  })

  it('adds newly selected groups and removes deselected ones', async () => {
    await dataProvider.update('characters', {
      id: 'astrid',
      data: { name: 'Astrid', groupSlugs: ['conseil', 'garde'] },
      previousData: { id: 'astrid', name: 'Astrid', groupSlugs: ['garde', 'ancien'] }
    })

    expect(jdrApi.removeCharacterGroup).toHaveBeenCalledWith('vikingtest', 'astrid', 'ancien')
    expect(jdrApi.removeCharacterGroup).not.toHaveBeenCalledWith('vikingtest', 'astrid', 'garde')
    expect(jdrApi.addCharacterGroup).toHaveBeenCalledWith('vikingtest', 'astrid', 'conseil')
    expect(jdrApi.addCharacterGroup).not.toHaveBeenCalledWith('vikingtest', 'astrid', 'garde')
  })

  it('re-adds an owned item with a new quantity via remove-then-add', async () => {
    vi.mocked(jdrApi.removeCharacterItem).mockResolvedValue(fakeAggregate({}))
    vi.mocked(jdrApi.addCharacterItem).mockResolvedValue(fakeAggregate({}))

    await dataProvider.update('characters', {
      id: 'astrid',
      data: { name: 'Astrid', items: [{ itemSlug: 'hache', quantity: 3 }] },
      previousData: { id: 'astrid', name: 'Astrid', items: [{ itemSlug: 'hache', quantity: 1 }] }
    })

    expect(jdrApi.removeCharacterItem).toHaveBeenCalledWith('vikingtest', 'astrid', 'hache')
    expect(jdrApi.addCharacterItem).toHaveBeenCalledWith('vikingtest', 'astrid', 'hache', 3)
  })

  it('does not touch items whose quantity is unchanged', async () => {
    await dataProvider.update('characters', {
      id: 'astrid',
      data: { name: 'Astrid', items: [{ itemSlug: 'hache', quantity: 1 }] },
      previousData: { id: 'astrid', name: 'Astrid', items: [{ itemSlug: 'hache', quantity: 1 }] }
    })

    expect(jdrApi.removeCharacterItem).not.toHaveBeenCalled()
    expect(jdrApi.addCharacterItem).not.toHaveBeenCalled()
  })
})
