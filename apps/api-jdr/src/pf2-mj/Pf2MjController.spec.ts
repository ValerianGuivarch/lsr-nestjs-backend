import { FoundryRelayService } from '../foundry/FoundryRelayService'
import { Pf2MjController } from './Pf2MjController'
import { Pf2MjService } from './Pf2MjService'

describe('Pf2MjController', () => {
  it('reads a portrait multipart ID after consuming a file, avoiding the shared pnj.webp fallback', async () => {
    const savePnjPortrait = jest.fn().mockImplementation(async (_image: Uint8Array, _mime: string, id: string) => `assets/l7r/portraits/pnj/${id}.webp`)
    const controller = new Pf2MjController({ savePnjPortrait } as unknown as Pf2MjService, {} as never, {} as never, {} as never, {} as never, {} as never, {} as never)
    for (const blockId of ['prep-one-guard', 'prep-one-helba']) {
      const fields: Record<string, unknown> = {}
      const file = {
        fields, mimetype: 'image/png',
        toBuffer: async () => {
          // Multipart fields after the file aren't populated until its stream is consumed.
          fields['pnjId'] = { type: 'field', value: blockId }
          return Buffer.from('fake-image')
        },
      }
      const request = { file: async () => file }
      await expect(controller.uploadPnjPortrait(request as never)).resolves.toEqual({ portrait: `assets/l7r/portraits/pnj/${blockId}.webp` })
    }
    expect(savePnjPortrait.mock.calls.map(call => call[2])).toEqual(['prep-one-guard', 'prep-one-helba'])
  })

  it('refuses missing portrait multipart IDs instead of overwriting the shared filename', async () => {
    const savePnjPortrait = jest.fn()
    const controller = new Pf2MjController({ savePnjPortrait } as unknown as Pf2MjService, {} as never, {} as never, {} as never, {} as never, {} as never, {} as never)
    const request = { file: async () => ({ fields: {}, mimetype: 'image/png', toBuffer: async () => Buffer.from('fake-image') }) }
    await expect(controller.uploadPnjPortrait(request as never)).rejects.toThrow(/Identifiant de portrait manquant/)
    expect(savePnjPortrait).not.toHaveBeenCalled()
  })

  it('exposes the joined player identity directory for the admin settings', async () => {
    const directory = { snapshot: jest.fn().mockResolvedValue({ players: [{ playerName: 'Éric' }], wikiOnly: [], cachedActorCount: 12 }) }
    const controller = new Pf2MjController({} as never, {} as never, {} as never, {} as never, {} as never, {} as never, {} as never, directory as never)
    await expect(controller.playerIdentities()).resolves.toEqual(expect.objectContaining({ players: [{ playerName: 'Éric' }] }))
    expect(directory.snapshot).toHaveBeenCalledTimes(1)
  })

  it('reuses the lightweight Foundry actor list as sorted references', async () => {
    const actors = [
      { uuid: 'Actor.yaz', name: 'Yaz Lorok (Gus)', type: 'Actor' },
      { uuid: 'Actor.pepin', name: 'Pépin (Eric)', type: 'Actor' },
      { uuid: 'Actor.janira', name: 'Janira Gavix', type: 'Actor' },
      { uuid: 'Actor.oxi', name: 'Oxi', type: 'Actor' },
      { uuid: 'Actor.party', name: 'The Party', type: 'Actor' }
    ]
    const foundry = { listActors: jest.fn().mockResolvedValue(actors) }
    const service = { saveResumeActorCache: jest.fn(), readResumeActorCache: jest.fn() }
    const controller = new Pf2MjController(service as unknown as Pf2MjService, foundry as unknown as FoundryRelayService, {} as never, {} as never, {} as never, {} as never, {} as never)

    await expect(controller.actors()).resolves.toEqual([
      { uuid: 'Actor.pepin', name: 'Pépin (Eric)' },
      { uuid: 'Actor.yaz', name: 'Yaz Lorok (Gus)' }
    ])
    expect(foundry.listActors).toHaveBeenCalledTimes(1)
    expect(service.saveResumeActorCache).toHaveBeenCalledWith(actors)
  })

  it('uses the last cached actors when Foundry is offline', async () => {
    const foundry = { listActors: jest.fn().mockRejectedValue(new Error('Foundry offline')) }
    const service = {
      saveResumeActorCache: jest.fn(),
      readResumeActorCache: jest.fn().mockResolvedValue([
        { uuid: 'Actor.yaz', name: 'Yaz Lorok (Gus)' },
        { uuid: 'Actor.janira', name: 'Janira Gavix' }
      ])
    }
    const controller = new Pf2MjController(service as unknown as Pf2MjService, foundry as unknown as FoundryRelayService, {} as never, {} as never, {} as never, {} as never, {} as never)

    await expect(controller.actors()).resolves.toEqual([
      { uuid: 'Actor.yaz', name: 'Yaz Lorok (Gus)' }
    ])
    expect(service.saveResumeActorCache).not.toHaveBeenCalled()
    expect(service.readResumeActorCache).toHaveBeenCalledTimes(1)
  })
  it('exposes the live resource-bundle inventory', async () => {
    const foundry = { listActors: jest.fn() }
    const inventory = { schemaVersion: 1, inventoryKnown: true, scannedAt: '2026-09-01T00:00:00.000Z', totalOnDisk: 1, bundles: [] }
    const service = { resourceBundles: jest.fn().mockResolvedValue(inventory) }
    const controller = new Pf2MjController(service as unknown as Pf2MjService, foundry as unknown as FoundryRelayService, {} as never, {} as never, {} as never, {} as never, {} as never)

    await expect(controller.resourceBundles()).resolves.toEqual(inventory)
    expect(service.resourceBundles).toHaveBeenCalledTimes(1)
  })

})
