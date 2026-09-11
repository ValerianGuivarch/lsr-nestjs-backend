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
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
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
    await expect(service.handle({ commandName: 'recap', reply, deferReply, editReply } as never)).resolves.toBe(true)
    expect(deferReply).toHaveBeenCalledWith()
    expect(editReply).toHaveBeenCalledWith({ content: '**Récapitulatif des séances**\n• Arthur — 2 séances\n• Kian — 2 séances' })
    expect(persistence.saveFoundryActorCache).toHaveBeenCalled()
  })

  it('uses the previous real-world day before 05:00 Europe/Paris for finish-game', () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const realDate = (value: string) => (service as unknown as { realDate: (date: Date) => string }).realDate(new Date(value))
    expect(realDate('2026-09-11T22:00:00.000Z')).toBe('2026-09-11') // 00:00 Paris : veille
    expect(realDate('2026-09-12T02:59:00.000Z')).toBe('2026-09-11') // 04:59 Paris
    expect(realDate('2026-09-12T03:00:00.000Z')).toBe('2026-09-12') // 05:00 Paris
    expect(realDate('2026-09-12T21:59:00.000Z')).toBe('2026-09-12') // 23:59 Paris
  })
})
