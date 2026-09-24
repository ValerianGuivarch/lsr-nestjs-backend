import { Pf2WikiSessionsController } from './Pf2WikiSessionsController'
import type { Pf2Session } from '../pf2-storage/Pf2PersistenceService'

const published: Pf2Session = {
  id: 'resume-1',
  sessionNumber: 1,
  date: '2026-07-28',
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
  discordMessageId: 'discord-1',
  published: true,
  content: [{ scenarioId: 'scenario-test', componentId: 'intro', sortOrder: 0 }],
  createdAt: '2026-07-28T20:00:00Z',
  updatedAt: '',
}

describe('Pf2WikiSessionsController', () => {
  it('exposes only Journal MJ scenarios and flattens campaign episodes with their playable components', async () => {
    const draft = { ...published, id: 'draft', sessionNumber: 2, published: false }
    const persistence = {
      listSessions: jest.fn().mockResolvedValue([published, draft]),
      readFoundryActorCache: jest
        .fn()
        .mockResolvedValue([{ uuid: 'Actor.hero', name: 'Héros (Joueur)' }]),
      readCatalogueSnapshot: jest.fn().mockResolvedValue({
        collections: [{ id: 'saison-test', titleFr: 'Saison test' }],
        entries: [
          {
            id: 'scenario-test',
            titleFr: 'Scénario test',
            kind: 'adventure',
            collectionId: 'saison-test',
            playableComponents: [{ id: 'intro', title: 'Introduction', order: 1 }],
          },
          {
            id: 'scenario-cache',
            titleFr: 'Scénario hors Journal',
            kind: 'adventure',
            collectionId: 'saison-test',
            playableComponents: [{ id: 'cache', title: 'Caché', order: 1 }],
          },
          {
            id: 'campagne-test',
            titleFr: 'Campagne test',
            kind: 'campaign',
            collectionId: null,
            playableComponents: [],
            parts: [
              {
                id: 'campagne-test-volume-1',
                titleFr: 'Tome 1',
                kind: 'volume_aventure',
                playableComponents: [
                  { id: 'ouverture', title: 'Ouverture', order: 1 },
                  { id: 'finale', title: 'Finale', order: 2 },
                ],
              },
              {
                id: 'campagne-test-guide',
                titleFr: 'Guide des joueurs',
                kind: 'guide_joueurs',
                playableComponents: [],
              },
            ],
          },
        ],
      }),
      readCuration: jest.fn().mockResolvedValue({
        byId: {
          'scenario-test': { preparationStatus: 'selected', playStatus: 'to_play' },
          'scenario-cache': { preparationStatus: 'selected', playStatus: 'none' },
          'campagne-test': { preparationStatus: 'selected', playStatus: 'in_progress' },
        },
      }),
    }
    const controller = new Pf2WikiSessionsController(persistence as never, {} as never)

    const result = await controller.list()
    expect(result.sessions).toEqual([
      expect.objectContaining({
        id: 'resume-1',
        participantNames: ['Héros (Joueur)'],
        shortSummaryAuthorName: 'Héros (Joueur)',
        shortSummaryLevelAtStart: 1,
        longSummaryLevelAtStart: null,
      }),
    ])
    expect(result.scenarios).toEqual([
      {
        id: 'campagne-test-volume-1',
        title: 'Tome 1',
        kind: 'volume_aventure',
        campaignId: 'campagne-test',
        campaignTitle: 'Campagne test',
        playableComponents: [
          { id: 'ouverture', title: 'Ouverture', order: 1 },
          { id: 'finale', title: 'Finale', order: 2 },
        ],
      },
      {
        id: 'scenario-test',
        title: 'Scénario test',
        kind: 'adventure',
        campaignId: 'saison-test',
        campaignTitle: 'Saison test',
        playableComponents: [{ id: 'intro', title: 'Introduction', order: 1 }],
      },
    ])
    expect(result.scenarios.map((scenario) => scenario.id)).not.toContain('scenario-cache')
    expect(result.scenarios.map((scenario) => scenario.id)).not.toContain('campagne-test')
    expect(result.scenarios.map((scenario) => scenario.id)).not.toContain('campagne-test-guide')
  })

  it('persists wiki title/date/session XP and recalculates both summary XP server-side', async () => {
    let stored: Pf2Session = {
      ...published,
      published: false,
      longSummaryAuthor: 'Actor.hero',
      longSummaryXp: 999,
    }
    const persistence = {
      getSession: jest.fn().mockImplementation(async () => ({ ...stored })),
      listSessions: jest.fn().mockImplementation(async () => [{ ...stored }]),
      updateSession: jest.fn().mockImplementation(async (_id: string, input: Record<string, unknown>) => {
        stored = { ...stored, ...input, updatedAt: 'changed' } as Pf2Session
        return { ...stored }
      }),
      saveSessionDiscordMessageId: jest.fn(),
    }
    const controller = new Pf2WikiSessionsController(persistence as never, {} as never)

    const result = await controller.update('resume-1', {
      title: 'Titre modifié',
      date: '2026-09-15',
      sessionXp: 321,
      shortSummaryXp: 999999,
      longSummaryXp: 999999,
    })

    expect(result.resume).toMatchObject({
      title: 'Titre modifié',
      date: '2026-09-15',
      sessionXp: 321,
      shortSummaryXp: 30,
      longSummaryXp: 30,
    })
    expect(persistence.updateSession).not.toHaveBeenCalledWith(
      'resume-1',
      expect.objectContaining({ shortSummaryXp: 999999 }),
    )
    expect(persistence.updateSession).not.toHaveBeenCalledWith(
      'resume-1',
      expect.objectContaining({ longSummaryXp: 999999 }),
    )
  })

  it('accepts session-to-scenario component updates from the wiki editor', async () => {
    let stored: Pf2Session = {
      ...published,
      published: false,
      shortSummaryXp: 30,
      content: [{ scenarioId: 'scenario-test', componentId: 'intro', sortOrder: 0 }],
    }
    const persistence = {
      getSession: jest.fn().mockImplementation(async () => ({ ...stored })),
      listSessions: jest.fn().mockImplementation(async () => [{ ...stored }]),
      updateSession: jest.fn().mockImplementation(async (_id: string, input: Record<string, unknown>) => {
        stored = { ...stored, ...input } as Pf2Session
        return { ...stored }
      }),
      saveSessionDiscordMessageId: jest.fn(),
    }
    const controller = new Pf2WikiSessionsController(persistence as never, {} as never)

    await expect(
      controller.update('resume-1', {
        content: [{ scenarioId: 'scenario-test', componentId: 'finale' }],
      }),
    ).resolves.toEqual(expect.objectContaining({ resume: expect.objectContaining({ id: 'resume-1' }) }))

    expect(persistence.updateSession).toHaveBeenCalledWith('resume-1', {
      content: [{ scenarioId: 'scenario-test', componentId: 'finale' }],
    })
  })

  it('delegates publication to the shared Discord publication path', async () => {
    const discord = {
      setResumePublication: jest.fn().mockResolvedValue({
        resume: { ...published, published: true },
        discord: { status: 'updated', messageId: 'discord-1' },
      }),
    }
    const controller = new Pf2WikiSessionsController({} as never, discord as never)

    await expect(controller.setPublication('resume-1', { published: '1' })).resolves.toEqual(
      expect.objectContaining({ resume: expect.objectContaining({ published: true }) }),
    )
    expect(discord.setResumePublication).toHaveBeenCalledWith('resume-1', true)
  })

})
