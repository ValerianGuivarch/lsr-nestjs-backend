import { Pf2SessionsController } from './Pf2SessionsController'
import type { Pf2Session } from '../pf2-storage/Pf2PersistenceService'

describe('Pf2SessionsController', () => {
  const resume: Pf2Session = { id: 'resume-1', sessionNumber: 1, date: '', title: '', participants: [], longSummaryAuthor: null, shortSummaryAuthor: null, sessionXp: 0, longSummaryXp: 0, shortSummaryXp: 0, longSummaryUrl: '', shortSummary: 'Texte court', discordMessageId: null, createdAt: '', updatedAt: '' }

  it('keeps the SQLite save successful when Discord is unavailable', async () => {
    const persistence = { createSession: jest.fn().mockResolvedValue(resume), saveSessionDiscordMessageId: jest.fn() }
    const discord = { synchronizeResumeShortSummary: jest.fn().mockResolvedValue({ status: 'failed', reason: 'Discord offline' }) }
    const controller = new Pf2SessionsController(persistence as never, discord as never)
    await expect(controller.create({ sessionNumber: 1, shortSummary: 'Texte court' })).resolves.toEqual({ resume, discord: { status: 'failed', reason: 'Discord offline' } })
    expect(persistence.createSession).toHaveBeenCalledTimes(1)
    expect(persistence.saveSessionDiscordMessageId).not.toHaveBeenCalled()
  })
})
