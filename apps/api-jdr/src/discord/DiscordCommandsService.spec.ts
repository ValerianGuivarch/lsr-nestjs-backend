import { DiscordCommandsService } from './DiscordCommandsService'

describe('DiscordCommandsService', () => {
  it('replies Pong ! to /ping without a Discord connection', async () => {
    const reply = jest.fn().mockResolvedValue(undefined)
    const service = new DiscordCommandsService({ listSessions: jest.fn(), readFoundryActorCache: jest.fn(), saveFoundryActorCache: jest.fn() } as never, { listActors: jest.fn() } as never)
    await expect(service.handle({ commandName: 'ping', reply } as never)).resolves.toBe(true)
    expect(reply).toHaveBeenCalledWith({ content: 'Pong !', ephemeral: true })
  })

  it('offers a PJ picker for /recap and renders a named matrix only for the chosen characters', async () => {
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    const persistence = {
      listSessions: jest.fn().mockResolvedValue([
        { participants: ['Actor.eos', 'Actor.pepin'] },
        { participants: ['Actor.eos', 'Actor.pepin', 'Actor.yaz'] },
      ]),
      saveFoundryActorCache: jest.fn(), readFoundryActorCache: jest.fn(),
    }
    const service = new DiscordCommandsService(persistence as never, {
      listActors: jest.fn().mockResolvedValue([
        { uuid: 'Actor.eos', name: 'Éos (David)' },
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)' },
        { uuid: 'Actor.yaz', name: 'Yaz Lorok (Gus)' },
        { uuid: 'Actor.npc', name: 'Janira Gavix' },
      ])
    } as never)
    await expect(service.handle({ commandName: 'recap', id: 'recap-1', user: { id: 'user-1' }, deferReply, editReply } as never)).resolves.toBe(true)
    expect(editReply.mock.calls[0][0].components[0].toJSON().components[0].options).toHaveLength(3)

    const update = jest.fn().mockResolvedValue(undefined)
    const followUp = jest.fn().mockResolvedValue(undefined)
    await expect(service.handleComponent({ customId: 'pf2-recap:recap-1', user: { id: 'user-1' }, values: ['Actor.eos', 'Actor.pepin'], update, followUp, reply: jest.fn() } as never)).resolves.toBe(true)
    const result = update.mock.calls[0][0].content
    expect(result).toContain('| PJ | Éos | Pépin |')
    expect(result).toContain('| Éos | — | 2 |')
    expect(result).not.toContain('Yaz Lorok')
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
    const reply = jest.fn().mockResolvedValue(undefined)

    await (service as unknown as {
      saveShortSummary: (
        interaction: unknown,
        pending: unknown,
        author: string,
        values: { title: string; date: string; summary: string },
      ) => Promise<boolean>
    }).saveShortSummary(
      { user: { id: 'user-1' }, reply },
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

    const response = reply.mock.calls[0][0]
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
