import { FoundryRelayService } from '../foundry/FoundryRelayService'
import { Pf2MjController } from './Pf2MjController'
import { Pf2MjService } from './Pf2MjService'

describe('Pf2MjController', () => {
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
    const controller = new Pf2MjController(service as unknown as Pf2MjService, foundry as unknown as FoundryRelayService)

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
    const controller = new Pf2MjController(service as unknown as Pf2MjService, foundry as unknown as FoundryRelayService)

    await expect(controller.actors()).resolves.toEqual([
      { uuid: 'Actor.yaz', name: 'Yaz Lorok (Gus)' }
    ])
    expect(service.saveResumeActorCache).not.toHaveBeenCalled()
    expect(service.readResumeActorCache).toHaveBeenCalledTimes(1)
  })
})
