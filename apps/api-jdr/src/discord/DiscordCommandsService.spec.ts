import { DiscordCommandsService } from './DiscordCommandsService'

describe('DiscordCommandsService', () => {
  it('replies Pong ! to /ping without a Discord connection', async () => {
    const reply = jest.fn().mockResolvedValue(undefined)
    const service = new DiscordCommandsService({ listSessions: jest.fn(), readFoundryActorCache: jest.fn(), saveFoundryActorCache: jest.fn() } as never, { listActors: jest.fn() } as never)
    await expect(service.handle({ commandName: 'ping', reply } as never)).resolves.toBe(true)
    expect(reply).toHaveBeenCalledWith({ content: 'Pong !', ephemeral: true })
  })

  it('groups session participation by player and sorts the recap from least to most played', async () => {
    const reply = jest.fn().mockResolvedValue(undefined)
    const persistence = {
      listSessions: jest.fn().mockResolvedValue([
        { participants: ['Actor.arthur', 'Actor.kian'] },
        { participants: ['Actor.arthur'] },
        { participants: ['Actor.kian', 'Actor.kian'] },
      ]),
      saveFoundryActorCache: jest.fn(),
      readFoundryActorCache: jest.fn(),
    }
    const service = new DiscordCommandsService(persistence as never, { listActors: jest.fn().mockResolvedValue([{ uuid: 'Actor.arthur', name: 'Ayla (Arthur)' }, { uuid: 'Actor.kian', name: 'Kian le Brave (Kian)' }]) } as never)
    await expect(service.handle({ commandName: 'recap', reply } as never)).resolves.toBe(true)
    expect(reply).toHaveBeenCalledWith({ content: '**Récapitulatif des séances**\n• Arthur — 2 séances\n• Kian — 2 séances' })
    expect(persistence.saveFoundryActorCache).toHaveBeenCalled()
  })
})
