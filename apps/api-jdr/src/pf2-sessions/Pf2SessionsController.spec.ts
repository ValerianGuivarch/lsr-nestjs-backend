import { Pf2SessionsController } from './Pf2SessionsController'
import type { Pf2Session } from '../pf2-storage/Pf2PersistenceService'

describe('Pf2SessionsController', () => {
  const resume: Pf2Session = { id: 'resume-1', sessionNumber: 1, date: '', inGameStartDate: '', inGameEndDate: '', title: '', participants: [], longSummaryAuthor: null, shortSummaryAuthor: null, sessionXp: 0, longSummaryXp: 0, shortSummaryXp: 0, shortSummary: 'Texte court', discordMessageId: null, published: false, createdAt: '', updatedAt: '' }

  it('keeps the SQLite save successful when Discord is unavailable', async () => {
    const persistence = {
      createSession: jest.fn().mockResolvedValue(resume),
      getSession: jest.fn().mockResolvedValue(resume),
      listSessions: jest.fn().mockResolvedValue([resume]),
      updateSession: jest.fn(),
      saveSessionDiscordMessageId: jest.fn(),
    }
    const discord = { synchronizeResumeShortSummary: jest.fn().mockResolvedValue({ status: 'failed', reason: 'Discord offline' }) }
    const controller = new Pf2SessionsController(persistence as never, discord as never)
    await expect(controller.create({ sessionNumber: 1, shortSummary: 'Texte court' })).resolves.toEqual({ resume, discord: { status: 'skipped', reason: 'Brouillon enregistré.' } })
    expect(persistence.createSession).toHaveBeenCalledTimes(1)
    expect(persistence.saveSessionDiscordMessageId).not.toHaveBeenCalled()
  })

  it('builds the co-participation matrix from session participants and cached Actor names', async () => {
    const persistence = {
      listSessions: jest.fn().mockResolvedValue([
        { participants: ['Actor.eos', 'Actor.pepin'] },
        { participants: ['Actor.eos', 'Actor.pepin', 'Actor.yaz'] },
        { participants: ['Actor.yaz'] },
      ]),
      readFoundryActorCache: jest.fn().mockResolvedValue([
        { uuid: 'Actor.eos', name: 'Éos (David)' },
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)' },
        { uuid: 'Actor.yaz', name: 'Yaz Lorok (Gus)' },
      ]),
    }
    const controller = new Pf2SessionsController(persistence as never, {} as never)
    await expect(controller.participationMatrix()).resolves.toEqual({
      characters: [
        { uuid: 'Actor.eos', name: 'Éos (David)', player: 'David', sessions: 2 },
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)', player: 'Eric', sessions: 2 },
        { uuid: 'Actor.yaz', name: 'Yaz Lorok (Gus)', player: 'Gus', sessions: 2 },
      ],
      matrix: [[0, 2, 1], [2, 0, 1], [1, 1, 0]],
    })
  })
})
