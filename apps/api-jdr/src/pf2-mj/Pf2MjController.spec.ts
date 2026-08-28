import { FoundryRelayService } from '../foundry/FoundryRelayService'
import { Pf2MjController } from './Pf2MjController'
import { Pf2MjService } from './Pf2MjService'

describe('Pf2MjController', () => {
  it('exposes Foundry players as sorted actor references', async () => {
    const foundry = { listPlayers: jest.fn().mockResolvedValue([
      { uuid: 'Actor.zara', name: 'Zara', level: 1, xp: 0, xpc: 0 },
      { uuid: 'Actor.aimee', name: 'Aimée', level: 1, xp: 0, xpc: 0 }
    ]) }
    const controller = new Pf2MjController({} as Pf2MjService, foundry as unknown as FoundryRelayService)

    await expect(controller.actors()).resolves.toEqual([
      { id: 'Actor.aimee', name: 'Aimée' },
      { id: 'Actor.zara', name: 'Zara' }
    ])
  })
})
