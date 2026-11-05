import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { PlayerCodexService } from './PlayerCodexService'
import { PlayerCodexController } from './PlayerCodexController'

describe('Foundry player level snapshot push', () => {
  const originalKey = process.env['PF2_FOUNDRY_CHAT_SYNC_KEY']

  afterEach(() => {
    if (originalKey === undefined) delete process.env['PF2_FOUNDRY_CHAT_SYNC_KEY']
    else process.env['PF2_FOUNDRY_CHAT_SYNC_KEY'] = originalKey
  })

  const setup = () => {
    const persistence = { saveFoundryPlayerLevels: jest.fn().mockResolvedValue(undefined) }
    const service = new PlayerCodexService({} as never, persistence as never)
    const controller = new PlayerCodexController(service)
    return { persistence, service, controller }
  }

  it('authenticates the push, derives XPC levels on the API, and saves the real level', async () => {
    process.env['PF2_FOUNDRY_CHAT_SYNC_KEY'] = 'secret-test'
    const { controller, persistence } = setup()
    await expect(controller.saveFoundryLevelSnapshot('secret-test', {
      players: [
        { uuid: 'Actor.neyla', foundryLevel: 4, xpc: 6500, theoreticalLevel: 1 },
        { uuid: 'Actor.eryn', foundryLevel: 5, xpc: 6500 },
      ],
    })).resolves.toEqual({ cached: 2 })
    expect(persistence.saveFoundryPlayerLevels).toHaveBeenCalledWith([
      { uuid: 'Actor.neyla', foundryLevel: 4, theoreticalLevel: 5 },
      { uuid: 'Actor.eryn', foundryLevel: 5, theoreticalLevel: 5 },
    ])
  })

  it('rejects unauthenticated requests before touching the cache', async () => {
    process.env['PF2_FOUNDRY_CHAT_SYNC_KEY'] = 'secret-test'
    const { controller, persistence } = setup()
    await expect(() => controller.saveFoundryLevelSnapshot('bad', {
      players: [{ uuid: 'Actor.neyla', foundryLevel: 4, xpc: 6500 }],
    })).toThrow(UnauthorizedException)
    expect(persistence.saveFoundryPlayerLevels).not.toHaveBeenCalled()
  })

  it('rejects invalid actors, duplicate UUIDs and invalid numeric levels', async () => {
    const { service, persistence } = setup()
    for (const players of [
      [],
      [{ uuid: 'Compendium.pf2e.actors.Actor.bad', foundryLevel: 2, xpc: 1000 }],
      [{ uuid: 'Actor.neyla', foundryLevel: 0, xpc: 1000 }],
      [{ uuid: 'Actor.neyla', foundryLevel: 4, xpc: -10 }],
      [{ uuid: 'Actor.neyla', foundryLevel: '4', xpc: 1000 }],
      [
        { uuid: 'Actor.neyla', foundryLevel: 4, xpc: 1000 },
        { uuid: 'Actor.neyla', foundryLevel: 4, xpc: 1000 },
      ],
    ]) {
      await expect(service.storeFoundryPlayerLevelSnapshot(players)).rejects.toBeInstanceOf(BadRequestException)
    }
    expect(persistence.saveFoundryPlayerLevels).not.toHaveBeenCalled()
  })

  it('keeps existing cache when the batch is empty or invalid', async () => {
    const { service, persistence } = setup()
    await expect(service.storeFoundryPlayerLevelSnapshot(null)).rejects.toBeInstanceOf(BadRequestException)
    expect(persistence.saveFoundryPlayerLevels).not.toHaveBeenCalled()
  })
})
