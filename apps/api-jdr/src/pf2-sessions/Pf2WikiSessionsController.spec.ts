import { Pf2WikiSessionsController } from './Pf2WikiSessionsController'
import type { Pf2Session } from '../pf2-storage/Pf2PersistenceService'

describe('Pf2WikiSessionsController', () => {
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
    shortSummaryXp: 10,
    longSummaryUrl: 'https://wiki.example.test/index.php/Test',
    shortSummary: 'Avant',
    discordMessageId: 'discord-1',
    published: true,
    createdAt: '',
    updatedAt: '',
  }

  it('only exposes published sessions and resolves cached actor names', async () => {
    const draft = { ...published, id: 'draft', published: false }
    const persistence = {
      listSessions: jest.fn().mockResolvedValue([published, draft]),
      readFoundryActorCache: jest
        .fn()
        .mockResolvedValue([{ uuid: 'Actor.hero', name: 'Héros (Joueur)' }]),
    }
    const controller = new Pf2WikiSessionsController(
      persistence as never,
      {} as never,
    )

    await expect(controller.list()).resolves.toEqual([
      expect.objectContaining({
        id: 'resume-1',
        participantNames: ['Héros (Joueur)'],
        shortSummaryAuthorName: 'Héros (Joueur)',
      }),
    ])
  })

  it('updates only the short summary and resynchronizes Discord', async () => {
    const updated = { ...published, shortSummary: 'Après' }
    const persistence = {
      getSession: jest.fn().mockResolvedValue(published),
      updateSession: jest.fn().mockResolvedValue(updated),
      saveSessionDiscordMessageId: jest.fn(),
    }
    const discord = {
      synchronizeResumeShortSummary: jest
        .fn()
        .mockResolvedValue({ status: 'updated', messageId: 'discord-1' }),
    }
    const controller = new Pf2WikiSessionsController(
      persistence as never,
      discord as never,
    )

    await expect(
      controller.updateShortSummary('resume-1', { shortSummary: ' Après ' }),
    ).resolves.toEqual(
      expect.objectContaining({ resume: updated }),
    )
    expect(persistence.updateSession).toHaveBeenCalledWith('resume-1', {
      shortSummary: 'Après',
    })
  })
})
