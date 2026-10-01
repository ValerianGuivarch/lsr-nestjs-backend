import { DiscordCommandsService } from './DiscordCommandsService'

describe('DiscordCommandsService', () => {
  it('replies Pong ! to /ping without a Discord connection', async () => {
    const reply = jest.fn().mockResolvedValue(undefined)
    const service = new DiscordCommandsService({ listSessions: jest.fn(), readFoundryActorCache: jest.fn(), saveFoundryActorCache: jest.fn() } as never, { listActors: jest.fn() } as never)
    await expect(service.handle({ commandName: 'ping', reply } as never)).resolves.toBe(true)
    expect(reply).toHaveBeenCalledWith({ content: 'Pong !', ephemeral: true })
  })

  it('renders /recap by player and character, without zero-session characters', async () => {
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    const persistence = {
      listSessions: jest.fn().mockResolvedValue([
        { sessionNumber: 1, published: true, participants: ['Actor.eos', 'Actor.pepin'] },
        { sessionNumber: 2, published: true, participants: ['Actor.eos', 'Actor.yaz'] },
        { sessionNumber: 3, published: false, participants: ['Actor.nora'] },
      ]),
      saveFoundryActorCache: jest.fn(), readFoundryActorCache: jest.fn(),
    }
    const service = new DiscordCommandsService(persistence as never, {
      listActors: jest.fn().mockResolvedValue([
        { uuid: 'Actor.eos', name: 'Éos (David)' },
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)' },
        { uuid: 'Actor.yaz', name: 'Yaz Lorok (Gus)' },
        { uuid: 'Actor.nora', name: 'Nora (Tom)' },
      ]),
      listPlayers: jest.fn().mockResolvedValue([
        { uuid: 'Actor.eos', name: 'Éos (David)', level: 3, foundryLevel: 2, xp: 0, xpc: 900 },
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)', level: 2, foundryLevel: 2, xp: 0, xpc: 300 },
        { uuid: 'Actor.yaz', name: 'Yaz Lorok (Gus)', level: 2, foundryLevel: 2, xp: 0, xpc: 300 },
        { uuid: 'Actor.nora', name: 'Nora (Tom)', level: 1, foundryLevel: 1, xp: 0, xpc: 0 },
      ]),
    } as never)

    await expect(service.handle({ commandName: 'recap', deferReply, editReply } as never)).resolves.toBe(true)
    const result = editReply.mock.calls[0][0].content
    expect(result).toContain('**David — 2 séances**')
    expect(result).toContain('Éos — niveau 2 (1 niveau à faire !) — 2 séances')
    expect(result).toContain('Pépin — niveau 2 — 1 séance')
    expect(result).not.toContain('Nora')
    expect(result).not.toContain('Séances communes')
  })

  it('rebuilds a planned-session message with historical progression rolls', async () => {
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    const sessions = [
      { sessionNumber: 1, published: true, participants: ['Actor.eos'], inGameStartDate: '4720-03-01', inGameEndDate: '4720-03-01', title: '' },
      { sessionNumber: 2, published: true, participants: ['Actor.pepin'], inGameStartDate: '4720-03-08', inGameEndDate: '4720-03-08', title: '' },
      { sessionNumber: 3, published: false, participants: ['Actor.eos', 'Actor.pepin'], inGameStartDate: '4720-03-15', inGameEndDate: '', title: '' },
    ]
    const service = new DiscordCommandsService({
      listSessions: jest.fn().mockResolvedValue(sessions),
      saveFoundryActorCache: jest.fn(), readFoundryActorCache: jest.fn(),
    } as never, {
      listActors: jest.fn().mockResolvedValue([
        { uuid: 'Actor.eos', name: 'Éos (David)' },
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)' },
      ]),
      listPlayers: jest.fn().mockResolvedValue([
        { uuid: 'Actor.eos', name: 'Éos (David)', level: 3, foundryLevel: 2, xp: 0, xpc: 900 },
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)', level: 2, foundryLevel: 2, xp: 0, xpc: 300 },
      ]),
    } as never)

    await expect(service.handle({
      commandName: 'recap-seance', deferReply, editReply,
      options: { getString: jest.fn().mockReturnValue('3') },
    } as never)).resolves.toBe(true)
    const result = editReply.mock.calls[0][0].content
    expect(result).toContain('Séance prévue — Résumé n°3')
    expect(result).toContain('Éos**, niveau 2 (1 niveau à faire !) : **1 lancer à faire**')
    expect(result).toContain('Pépin**, niveau 2 : **0 lancer à faire**')
    expect(result).toContain('15 Pharast 4720 AR')
  })

  it('turns missed published sessions into seven-day progression rolls', async () => {
    const persistence = {
      listSessions: jest.fn().mockResolvedValue([
        { sessionNumber: 1, published: true, participants: ['Actor.eos'], inGameStartDate: '4720-03-01', inGameEndDate: '4720-03-01' },
        { sessionNumber: 2, published: true, participants: ['Actor.pepin'], inGameStartDate: '4720-03-08', inGameEndDate: '4720-03-08' },
        { sessionNumber: 3, published: true, participants: ['Actor.pepin'], inGameStartDate: '4720-03-15', inGameEndDate: '4720-03-15' },
      ]),
    }
    const service = new DiscordCommandsService(persistence as never, {} as never)
    const plan = await (service as unknown as { plan: (actors: Array<{ uuid: string; name: string }>) => Promise<{ progressionRolls: string[] }> }).plan([
      { uuid: 'Actor.eos', name: 'Éos (David)' }, { uuid: 'Actor.pepin', name: 'Pépin (Eric)' }
    ])
    expect(plan.progressionRolls).toEqual(expect.arrayContaining([
      expect.stringContaining('Éos (David) : **2 jets de progression** (14 jours).'),
      expect.stringContaining('Pépin (Eric) : **0 jet de progression** (0 jour).'),
    ]))
  })

  it('offers the group availability and the day after the latest global mission', async () => {
    const persistence = {
      listSessions: jest.fn().mockResolvedValue([
        { sessionNumber: 1, published: true, participants: ['Actor.hero'], inGameStartDate: '4720-03-20', inGameEndDate: '4720-03-31' },
        { sessionNumber: 2, published: true, participants: ['Actor.other'], inGameStartDate: '4720-04-01', inGameEndDate: '4720-04-15' },
      ]),
    }
    const service = new DiscordCommandsService(persistence as never, {} as never)
    const plan = await (service as unknown as {
      plan: (actors: Array<{ uuid: string; name: string }>) => Promise<{ earliest: string; current: string }>
      addDays: (date: string, days: number) => string
    }).plan([{ uuid: 'Actor.hero', name: 'Héros (Joueur)' }])

    expect(plan.earliest).toBe('4720-04-01')
    expect(plan.current).toBe('4720-04-16')
    expect((service as unknown as { addDays: (date: string, days: number) => string }).addDays(plan.earliest, 5)).toBe('4720-04-06')
    expect((service as unknown as { addDays: (date: string, days: number) => string }).addDays(plan.current, 5)).toBe('4720-04-21')
  })

  it('uses the previous real-world day before 05:00 Europe/Paris for finish-game', () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const realDate = (value: string) => (service as unknown as { realDate: (date: Date) => string }).realDate(new Date(value))
    expect(realDate('2026-09-11T22:00:00.000Z')).toBe('2026-09-11') // 00:00 Paris : veille
    expect(realDate('2026-09-12T02:59:00.000Z')).toBe('2026-09-11') // 04:59 Paris
    expect(realDate('2026-09-12T03:00:00.000Z')).toBe('2026-09-12') // 05:00 Paris
    expect(realDate('2026-09-12T21:59:00.000Z')).toBe('2026-09-12') // 23:59 Paris
  })

  it('offers Voir la fiche + Publier after /resume save and publishes from the button', async () => {
    const session = {
      id: 'session-42',
      sessionNumber: 42,
      date: '2026-09-15',
      inGameStartDate: '',
      inGameEndDate: '',
      title: 'Test',
      participants: ['Actor.hero'],
      longSummaryAuthor: null,
      shortSummaryAuthor: 'Actor.hero',
      sessionXp: 100,
      longSummaryXp: 0,
      shortSummaryXp: 30,
      shortSummary: 'Avant',
      discordMessageId: null,
      published: false,
      content: [],
      createdAt: '',
      updatedAt: '',
    }
    const persistence = {
      getSession: jest.fn().mockResolvedValue(session),
      listSessions: jest.fn().mockResolvedValue([session]),
      updateSession: jest.fn().mockImplementation(async (_id: string, input: Record<string, unknown>) => ({ ...session, ...input })),
      saveSessionDiscordMessageId: jest.fn(),
    }
    const discord = {
      resumeMessageLength: jest.fn().mockResolvedValue(200),
      synchronizeResumeShortSummary: jest.fn(),
      setResumePublication: jest.fn().mockResolvedValue({
        resume: { ...session, published: true },
        discord: { status: 'created', messageId: 'message-42' },
      }),
    }
    const mediaWiki = {
      enabled: () => true,
      sessionsPageUrl: (number: number) => `https://wiki.l7r.fr/index.php?title=Seances#pf2-session-${number}`,
    }
    const service = new DiscordCommandsService(
      persistence as never,
      {} as never,
      undefined,
      mediaWiki as never,
      discord as never,
    )
    const saveEditReply = jest.fn().mockResolvedValue(undefined)

    await (service as unknown as {
      saveShortSummary: (
        interaction: unknown,
        pending: unknown,
        author: string,
        values: { title: string; date: string; summary: string },
      ) => Promise<boolean>
    }).saveShortSummary(
      { user: { id: 'user-1' }, editReply: saveEditReply },
      {
        sessionId: 'session-42',
        sessionNumber: 42,
        requesterId: 'user-1',
        selectedAuthor: 'Actor.hero',
        allowedAuthors: [{ uuid: 'Actor.hero', name: 'Héros (Joueur)' }],
      },
      'Actor.hero',
      { title: 'Test', date: '2026-09-15', summary: 'Résumé' },
    )

    const response = saveEditReply.mock.calls[0][0]
    const row = response.components[0].toJSON()
    expect(row.components.map((button: { label?: string }) => button.label)).toEqual(['Voir la fiche', 'Publier'])
    const publishButton = row.components.find((button: { label?: string }) => button.label === 'Publier') as { custom_id: string }

    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    await service.handleButton({
      customId: publishButton.custom_id,
      user: { id: 'user-1' },
      deferReply,
      editReply,
      reply: jest.fn(),
    } as never)

    expect(discord.setResumePublication).toHaveBeenCalledWith('session-42', true)
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('publiée') }))
  })

})
