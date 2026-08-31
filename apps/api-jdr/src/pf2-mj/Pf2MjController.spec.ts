import { FoundryRelayService } from '../foundry/FoundryRelayService'
import { Pf2MjController } from './Pf2MjController'
import { Pf2MjService } from './Pf2MjService'

describe('Pf2MjController', () => {
  it('reuses the lightweight Foundry actor list as sorted references', async () => {
    const foundry = { listActors: jest.fn().mockResolvedValue([
      { uuid: 'Actor.zara', name: 'Zara', type: 'Actor' },
      { uuid: 'Actor.aimee', name: 'Aimée', type: 'Actor' }
    ]) }
    const controller = new Pf2MjController({} as Pf2MjService, foundry as unknown as FoundryRelayService)

    await expect(controller.actors()).resolves.toEqual([
      { uuid: 'Actor.aimee', name: 'Aimée' },
      { uuid: 'Actor.zara', name: 'Zara' }
    ])
    expect(foundry.listActors).toHaveBeenCalledTimes(1)
  })
})
