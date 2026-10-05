import { DiscordCommandsService } from './DiscordCommandsService'

describe('DiscordCommandsService', () => {
  it('registers the current command surface and keeps hidden commands unpublished', () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const definitions = service.definitions().map(command => command.name)
    expect(definitions).toEqual(expect.arrayContaining([
      'help', 'help-admin', 'random-perso', 'tirage-sort-joueur', 'recap-pjs', 'recap-seance',
      'debut-seance', 'fin-seance', 'personnage', 'faction', 'afficher-personnage', 'afficher-faction', 'wiki', 'wiki-admin',
      'proposer-date-seance', 'modifier-date-seance', 'analyse-date-seance',
    ]))
    expect(definitions).not.toEqual(expect.arrayContaining([
      'ping', 'export-full', 'resume', 'recap', 'new-game', 'finish-game',
      'planification', 'modifier-planification', 'programmer-seance',
    ]))
  })

  it('shows /help privately and protects /help-admin', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const helpReply = jest.fn().mockResolvedValue(undefined)
    await service.handle({ commandName: 'help', reply: helpReply } as never)
    expect(helpReply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('/recap-pjs'),
      ephemeral: true,
    }))
    const helpContent = helpReply.mock.calls[0][0].content
    expect(helpContent).toContain('/afficher-personnage')
    expect(helpContent).toContain('/afficher-faction')
    expect(helpContent).not.toContain('/personnage`')
    expect(helpContent).not.toContain('/debut-seance')

    const denied = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'help-admin', reply: denied, user: { id: 'player' },
      memberPermissions: { has: jest.fn().mockReturnValue(false) },
    } as never)
    expect(denied).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('réservée aux administrateurs'), ephemeral: true,
    }))
  })

  it('registers /random-perso and returns an admin-only random PF2 concept', async () => {
    const reply = jest.fn().mockResolvedValue(undefined)
    const random = jest.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.009)
    const service = new DiscordCommandsService({} as never, {} as never)

    expect(service.definitions().map(command => command.name)).toContain('random-perso')
    await expect(service.handle({
      commandName: 'random-perso',
      reply,
      user: { id: 'admin' },
      memberPermissions: { has: jest.fn().mockReturnValue(true) },
    } as never)).resolves.toBe(true)

    expect(reply).toHaveBeenCalledWith({
      content: ['🎲 **Personnage aléatoire**', 'Ascendance : **Androïde**', 'Classe : **Alchimiste**', 'Genre : **Non binaire**'].join('\n'),
      ephemeral: true,
    })
    random.mockRestore()
  })

  it('refuses /random-perso to non-admin users', async () => {
    const reply = jest.fn().mockResolvedValue(undefined)
    const service = new DiscordCommandsService({} as never, {} as never)
    await expect(service.handle({
      commandName: 'random-perso',
      reply,
      user: { id: 'player' },
      memberPermissions: { has: jest.fn().mockReturnValue(false) },
    } as never)).resolves.toBe(true)
    expect(reply).toHaveBeenCalledWith({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
  })

  it('selects Discord users, draws the requested number, and previews before publishing', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const reply = jest.fn().mockResolvedValue(undefined)

    await expect(service.handle({
      commandName: 'tirage-sort-joueur',
      id: 'draw-command',
      user: { id: 'admin' },
      memberPermissions: { has: jest.fn().mockReturnValue(true) },
      reply,
    } as never)).resolves.toBe(true)

    const commandPayload = reply.mock.calls[0][0]
    expect(commandPayload.ephemeral).toBe(true)
    expect(commandPayload.components).toHaveLength(1)
    const selectJson = commandPayload.components[0].toJSON().components[0]
    expect(selectJson.custom_id).toBe('pf2-player-draw:players:draw-command')
    expect(selectJson.min_values).toBe(1)
    expect(selectJson.max_values).toBe(25)

    const showModal = jest.fn().mockResolvedValue(undefined)
    await expect(service.handleUserSelect({
      customId: 'pf2-player-draw:players:draw-command',
      id: 'user-select',
      user: { id: 'admin' },
      values: ['tom', 'arcady', 'juby'],
      members: new Map(),
      users: new Map([
        ['tom', { username: 'Tom', globalName: null }],
        ['arcady', { username: 'Arcady', globalName: null }],
        ['juby', { username: 'Juby', globalName: null }],
      ]),
      showModal,
      reply: jest.fn(),
    } as never)).resolves.toBe(true)

    const modal = showModal.mock.calls[0][0].toJSON()
    expect(modal.custom_id).toBe('pf2-player-draw:count:user-select')
    expect(modal.components[0].components[0].label).toBe('Nombre à tirer (1-3)')

    const random = jest.spyOn(Math, 'random').mockReturnValue(0)
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    await expect(service.handleModal({
      customId: 'pf2-player-draw:count:user-select',
      id: 'draw-modal',
      user: { id: 'admin' },
      fields: { getTextInputValue: jest.fn().mockReturnValue('2') },
      deferReply,
      editReply,
      reply: jest.fn(),
    } as never)).resolves.toBe(true)
    random.mockRestore()

    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true })
    const preview = editReply.mock.calls[0][0]
    expect(preview.content).toBe([
      '🎲 **Tirage au sort joueur**',
      'Parmi : Tom, Arcady, Juby',
      '',
      '**Liste des tirages au sort :**',
      '- Tom',
      '- Arcady',
    ].join('\n'))
    expect(preview.components[0].toJSON().components[0].label).toBe('Publier')
  })

  it('refuses /tirage-sort-joueur to non-admin users', async () => {
    const reply = jest.fn().mockResolvedValue(undefined)
    const service = new DiscordCommandsService({} as never, {} as never)

    await expect(service.handle({
      commandName: 'tirage-sort-joueur',
      id: 'draw-command',
      user: { id: 'player' },
      memberPermissions: { has: jest.fn().mockReturnValue(false) },
      reply,
    } as never)).resolves.toBe(true)

    expect(reply).toHaveBeenCalledWith({
      content: 'Cette commande est réservée aux administrateurs du serveur.',
      ephemeral: true,
    })
  })

  it('previews /recap-pjs by player and character, without zero-session characters', async () => {
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

    await expect(service.handle({ commandName: 'recap-pjs', deferReply, editReply, user: { id: 'player-1' }, id: 'interaction-1' } as never)).resolves.toBe(true)
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true })
    const payload = editReply.mock.calls[0][0]
    const result = payload.content
    expect(payload.components).toHaveLength(1)
    expect(payload.components[0].toJSON().components[0].label).toBe('Publier')
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
      commandName: 'recap-seance', deferReply, editReply, user: { id: 'admin' }, id: 'interaction-2',
      memberPermissions: { has: jest.fn().mockReturnValue(true) },
      options: { getString: jest.fn().mockReturnValue('3') },
    } as never)).resolves.toBe(true)
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true })
    const preview = editReply.mock.calls[0][0]
    const result = preview.content
    expect(preview.components[0].toJSON().components[0].label).toBe('Publier')
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

  it('does not let a participant without session history delay a parallel mission', async () => {
    const persistence = {
      listSessions: jest.fn().mockResolvedValue([
        { sessionNumber: 1, published: true, participants: ['Actor.hero'], inGameStartDate: '4720-03-20', inGameEndDate: '4720-03-31' },
        { sessionNumber: 2, published: true, participants: ['Actor.other'], inGameStartDate: '4720-04-01', inGameEndDate: '4720-04-15' },
      ]),
    }
    const service = new DiscordCommandsService(persistence as never, {} as never)
    const plan = await (service as unknown as {
      plan: (actors: Array<{ uuid: string; name: string }>) => Promise<{ earliest: string; current: string }>
    }).plan([
      { uuid: 'Actor.hero', name: 'Héros (Joueur)' },
      { uuid: 'Actor.new', name: 'Nouveau (Joueur)' },
    ])

    expect(plan.earliest).toBe('4720-04-01')
    expect(plan.current).toBe('4720-04-16')
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


  it('restricts session administration and /personnage to admins', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    for (const commandName of ['debut-seance', 'recap-seance', 'fin-seance', 'personnage']) {
      const reply = jest.fn().mockResolvedValue(undefined)
      await service.handle({
        commandName,
        reply,
        user: { id: 'player' },
        memberPermissions: { has: jest.fn().mockReturnValue(false) },
        options: {
          getString: jest.fn(),
          getInteger: jest.fn(),
          getAttachment: jest.fn(),
          getBoolean: jest.fn(),
        },
      } as never)
      expect(reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('réservée aux administrateurs'),
        ephemeral: true,
      }))
    }
  })

  it('marks admin commands with Discord Manage Server permissions', () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const definitions = service.definitions()
    for (const name of [
      'random-perso', 'tirage-sort-joueur', 'help-admin', 'recap-seance', 'journaux', 'debut-seance', 'fin-seance',
      'personnage', 'faction', 'wiki-admin', 'proposer-date-seance', 'modifier-date-seance', 'analyse-date-seance',
    ]) {
      const command = definitions.find(item => item.name === name)
      expect(command?.default_member_permissions).toBeDefined()
    }
    for (const name of ['help', 'recap-pjs', 'afficher-personnage', 'afficher-faction', 'wiki']) {
      const command = definitions.find(item => item.name === name)
      expect(command?.default_member_permissions ?? null).toBeNull()
    }
  })

  it('shows a published character privately and offers sharing with its portrait', async () => {
    const playerCodex = {
      character: jest.fn().mockResolvedValue({
        displayName: 'Sheila Heidmarch',
        shortDescription: 'Responsable de la Loge de Magnimar.',
        wikiPageTitle: 'Personnage:Sheila Heidmarch',
        wikiPortraitFilename: 'Sheila.webp',
        published: true,
      }),
      characterCandidate: jest.fn().mockResolvedValue({ id: 'sheila', name: 'Sheila Heidmarch', portrait: null }),
    }
    const mediaWiki = {
      pageUrl: jest.fn().mockReturnValue('https://wiki.example/Sheila'),
      fileUrl: jest.fn().mockReturnValue('https://wiki.example/Special:Redirect/file/Sheila.webp'),
    }
    const service = new DiscordCommandsService({} as never, {} as never, playerCodex as never, mediaWiki as never)
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'afficher-personnage',
      id: 'display-character-1',
      user: { id: 'player' },
      deferReply,
      editReply,
      options: { getString: jest.fn().mockReturnValue('sheila') },
    } as never)
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true })
    const response = editReply.mock.calls[0][0]
    expect(response.content).toContain('**Sheila Heidmarch**')
    expect(response.content).toContain('https://wiki.example/Sheila')
    expect(response.files).toEqual(['https://wiki.example/Special:Redirect/file/Sheila.webp'])
    expect(response.components[0].toJSON().components[0].label).toBe('Partager')
  })

  it('shows only a published faction privately and offers sharing', async () => {
    const playerCodex = {
      factionForPublication: jest.fn().mockResolvedValue({
        id: 'watch', name: 'Veilleurs', description: 'Une faction connue.', parentName: null,
        wikiPageTitle: 'Faction:Veilleurs', published: true,
      }),
    }
    const mediaWiki = { pageUrl: jest.fn().mockReturnValue('https://wiki.example/Veilleurs') }
    const service = new DiscordCommandsService({} as never, {} as never, playerCodex as never, mediaWiki as never)
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'afficher-faction',
      id: 'display-faction-1',
      user: { id: 'player' },
      deferReply,
      editReply,
      options: { getString: jest.fn().mockReturnValue('watch') },
    } as never)
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true })
    const response = editReply.mock.calls[0][0]
    expect(response.content).toContain('**Veilleurs**')
    expect(response.components[0].toJSON().components[0].label).toBe('Partager')
  })


  it('registers /wiki and /wiki-admin with the expected admin subcommands', () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const definitions = service.definitions()
    const wiki = definitions.find(command => command.name === 'wiki')
    const admin = definitions.find(command => command.name === 'wiki-admin')
    expect(wiki).toBeDefined()
    expect(admin).toBeDefined()
    expect((admin?.options ?? []).map((option: { name: string }) => option.name)).toEqual([
      'help',
      'associer',
      'liste',
      'supprimer',
      'associer-personnage',
      'dissocier-personnage',
      'liste-personnages',
    ])
  })

  it('creates a private one-use wiki login link for the caller', async () => {
    const persistence = {
      wikiAccountLink: jest.fn().mockResolvedValue({
        discordUserId: '123456789012345678',
        wikiUsername: 'Valou',
      }),
      createWikiLoginGrant: jest.fn().mockResolvedValue('grant-test'),
    }
    const mediaWiki = {
      wikiLoginUrl: jest.fn().mockReturnValue(
        'https://wiki.l7r.fr/index.php?title=Special%3APF2DiscordLogin&grant=grant-test',
      ),
    }
    const service = new DiscordCommandsService(
      persistence as never,
      {} as never,
      undefined,
      mediaWiki as never,
    )
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)

    await service.handle({
      commandName: 'wiki',
      user: { id: '123456789012345678' },
      deferReply,
      editReply,
    } as never)

    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true })
    expect(persistence.createWikiLoginGrant).toHaveBeenCalledWith('123456789012345678', 180)
    const response = editReply.mock.calls[0][0]
    expect(response.content).toContain('Valou')
    expect(response.components[0].toJSON().components[0].url).toContain('Special%3APF2DiscordLogin')
  })

  it('shows /wiki-admin help only to administrators', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)

    const adminReply = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'wiki-admin',
      user: { id: 'admin' },
      memberPermissions: { has: jest.fn().mockReturnValue(true) },
      options: { getSubcommand: jest.fn().mockReturnValue('help') },
      reply: adminReply,
    } as never)
    expect(adminReply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('/wiki-admin associer'),
      ephemeral: true,
    }))

    const playerReply = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'wiki-admin',
      user: { id: 'player' },
      memberPermissions: { has: jest.fn().mockReturnValue(false) },
      options: { getSubcommand: jest.fn() },
      reply: playerReply,
    } as never)
    expect(playerReply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('réservée aux administrateurs'),
      ephemeral: true,
    }))
  })

  it('registers the planning commands and computes the strictly next Monday', () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const definitions = service.definitions().map(command => command.name)
    expect(definitions).toEqual(expect.arrayContaining(['proposer-date-seance', 'analyse-date-seance', 'modifier-date-seance']))
    expect(definitions).not.toContain('resume')
    const planning = service as unknown as {
      nextPlanningMonday: (date: Date) => string
      planningMessage: (monday: string, selectedDays: number[]) => string
      parsePlanningMessage: (content: string) => { monday: string; selectedDays: number[] } | null
    }
    expect(planning.nextPlanningMonday(new Date('2026-10-02T15:00:00.000Z'))).toBe('2026-10-05')
    expect(planning.nextPlanningMonday(new Date('2026-10-05T15:00:00.000Z'))).toBe('2026-10-12')
    const message = planning.planningMessage('2026-10-05', [0, 2, 6])
    expect(message).toContain('@everyone **Nouvelle séance ! La semaine du lundi 5 octobre 2026**')
    expect(message).toContain('🇱 Lundi 5 octobre')
    expect(message).toContain('🇹 Tercredi 7 octobre')
    expect(message).toContain('🇩 Dimanche 11 octobre')
    expect(message).toContain('❌ Pas dispo')
    expect(message).toContain('❓ Ne sais pas encore')
    expect(planning.parsePlanningMessage(message)).toEqual({ monday: '2026-10-05', selectedDays: [0, 2, 6] })
  })

  it('publishes a planning message with reactions and a thread after the day selection', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const react = jest.fn().mockResolvedValue(undefined)
    const startThread = jest.fn().mockResolvedValue({ id: 'thread-1' })
    const send = jest.fn().mockResolvedValue({ id: 'message-1', react, startThread })
    const deferUpdate = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)

    await service.handleComponent({
      customId: 'pf2-planification:create:2026-10-05',
      values: ['1', '2', '4'],
      channel: { isSendable: () => true, send },
      deferUpdate,
      editReply,
      reply: jest.fn(),
    } as never)

    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('🇹 Tercredi 7 octobre'),
      allowedMentions: { parse: ['everyone'] },
    }))
    expect(react.mock.calls.map(call => call[0])).toEqual(['🇲', '🇹', '🇻', '❌', '❓'])
    expect(startThread).toHaveBeenCalledWith({ name: 'Planification — semaine du 5 octobre' })
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Planification publiée') }))
  })

  it('refreshes the planning starter so a previously added day stays selected', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const freshContent = (service as unknown as { planningMessage: (monday: string, selectedDays: number[]) => string })
      .planningMessage('2026-10-05', [0, 4])
    const fetchStarterMessage = jest.fn().mockResolvedValue({ id: 'starter-1', content: freshContent })
    const reply = jest.fn().mockResolvedValue(undefined)

    await service.handle({
      commandName: 'modifier-date-seance',
      user: { id: 'admin' }, memberPermissions: { has: jest.fn().mockReturnValue(true) },
      channel: { isThread: () => true, fetchStarterMessage },
      reply,
    } as never)

    expect(fetchStarterMessage).toHaveBeenCalledWith({ force: true })
    const row = reply.mock.calls[0][0].components[0].toJSON()
    const friday = row.components[0].options.find((option: { value: string }) => option.value === '4')
    expect(friday.default).toBe(true)
  })

  it('refuses /modifier-date-seance outside the thread attached to the planning message', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const reply = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'modifier-date-seance',
      user: { id: 'admin' }, memberPermissions: { has: jest.fn().mockReturnValue(true) },
      channel: { isThread: () => false },
      reply,
    } as never)
    expect(reply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('dans le fil'),
      ephemeral: true,
    }))
  })


  it('restricts the date-planning commands to admins', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    for (const commandName of ['proposer-date-seance', 'modifier-date-seance', 'analyse-date-seance']) {
      const reply = jest.fn().mockResolvedValue(undefined)
      await service.handle({
        commandName, reply, user: { id: 'player' },
        memberPermissions: { has: jest.fn().mockReturnValue(false) },
      } as never)
      expect(reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('réservée aux administrateurs'), ephemeral: true,
      }))
    }
  })

  it('publishes a recap preview only after the requester clicks Publier', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const preview = service as unknown as {
      pendingPreviewPublications: Map<string, { requesterId: string; content: string; files?: string[] }>
    }
    preview.pendingPreviewPublications.set('pf2-preview:publish:test', { requesterId: 'user-1', content: 'Aperçu public' })
    const update = jest.fn().mockResolvedValue(undefined)
    const followUp = jest.fn().mockResolvedValue(undefined)
    await expect(service.handleButton({
      customId: 'pf2-preview:publish:test', user: { id: 'user-1' }, update, followUp, reply: jest.fn(),
    } as never)).resolves.toBe(true)
    expect(update).toHaveBeenCalledWith({ components: [] })
    expect(followUp).toHaveBeenCalledWith({ content: 'Aperçu public', ephemeral: false, allowedMentions: { parse: [] } })
  })


  it('solver maximizes groups, never reuses a player, and favors less-played players', () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const solver = service as unknown as {
      bestSessionGroupProposals: (
        days: readonly (readonly [string, string])[],
        availability: Map<string, Array<{ id: string; name: string; played: number }>>,
      ) => Array<Array<{ key: string; label: string; players: Array<{ id: string; name: string; played: number }> }>>
    }
    const p = (id: string, played: number) => ({ id, name: id, played })
    const proposals = solver.bestSessionGroupProposals(
      [['0', 'Lundi'], ['3', 'Jeudi']] as const,
      new Map([
        ['0', [p('A', 0), p('B', 0), p('C', 0), p('D', 0)]],
        ['3', [p('D', 0), p('E', 0), p('F', 0), p('G', 0), p('H', 5)]],
      ]),
    )
    expect(proposals[0]).toHaveLength(2)
    const ids = proposals[0].flatMap(group => group.players.map(player => player.id))
    expect(new Set(ids).size).toBe(8)
    expect(ids).toContain('H')

    const priority = solver.bestSessionGroupProposals(
      [['0', 'Lundi']] as const,
      new Map([['0', [p('A', 0), p('B', 1), p('C', 1), p('D', 2), p('E', 9)]]]),
    )
    expect(priority[0][0].players.map(player => player.id)).toEqual(['A', 'B', 'C', 'D'])
  })

  it('solver compacts perfect ties into a choose N/M pool', () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const solver = service as unknown as {
      bestSessionGroupProposals: (
        days: readonly (readonly [string, string])[],
        availability: Map<string, Array<{ id: string; name: string; played: number }>>,
      ) => Array<Array<{ key: string; label: string; players: Array<{ id: string; name: string; played: number }> }>>
      compactSessionGroupProposals: (
        proposals: Array<Array<{ key: string; label: string; players: Array<{ id: string; name: string; played: number }> }>>,
      ) => Array<{ fixed: Array<{ id: string }>; pool: Array<{ id: string }>; choose: number }> | null
    }
    const p = (id: string, played: number) => ({ id, name: id, played })
    const proposals = solver.bestSessionGroupProposals(
      [['0', 'Lundi']] as const,
      new Map([['0', [p('A', 0), p('B', 0), p('C', 0), p('D', 4), p('E', 4), p('F', 4)]]]),
    )
    const compact = solver.compactSessionGroupProposals(proposals)
    expect(compact).not.toBeNull()
    expect(compact?.[0].fixed.map(player => player.id)).toEqual(['A', 'B', 'C'])
    expect(compact?.[0].pool.map(player => player.id)).toEqual(['D', 'E', 'F'])
    expect(compact?.[0].choose).toBe(1)
  })

  it('counts draft sessions with XP as already played', async () => {
    const persistence = {
      listSessions: jest.fn().mockResolvedValue([
        { sessionNumber: 1, published: true, sessionXp: 0, participants: ['Actor.hero'] },
        { sessionNumber: 2, published: false, sessionXp: 120, participants: ['Actor.hero'] },
        { sessionNumber: 3, published: false, sessionXp: 0, participants: ['Actor.hero'] },
      ]),
      saveFoundryActorCache: jest.fn().mockResolvedValue(undefined),
      readFoundryActorCache: jest.fn().mockResolvedValue([]),
    }
    const foundry = {
      listActors: jest.fn().mockResolvedValue([{ uuid: 'Actor.hero', name: 'Héros (Eric)' }]),
    }
    const service = new DiscordCommandsService(persistence as never, foundry as never)
    const counts = await (service as unknown as { discordSessionCounts: () => Promise<Map<string, number>> }).discordSessionCounts()
    expect(counts.get('399621722158137346')).toBe(2)
  })

  it('publishes a private solver preview only after validation', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const publishId = 'pf2-schedule:publish:test'
    ;(service as unknown as { pendingSchedulePublications: Map<string, { requesterId: string; content: string }> }).pendingSchedulePublications
      .set(publishId, { requesterId: 'user-1', content: '**Planning**' })
    const update = jest.fn().mockResolvedValue(undefined)
    const followUp = jest.fn().mockResolvedValue(undefined)

    await service.handleButton({
      customId: publishId,
      user: { id: 'user-1' },
      update,
      followUp,
      reply: jest.fn(),
    } as never)

    expect(update).toHaveBeenCalledWith({ components: [] })
    expect(followUp).toHaveBeenCalledWith({ content: '**Planning**', ephemeral: false, allowedMentions: { parse: [] } })
  })

})
