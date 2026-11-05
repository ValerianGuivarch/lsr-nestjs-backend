import { ChannelType } from 'discord.js'
import { Pf2RequestService, REQUEST_STATES, RequestStatus } from './Pf2RequestService'
import { Pf2RequestController } from './Pf2RequestController'

describe('PF2 request Kanban and Discord status updates', () => {
  const current = () => ({
    id: 8, title: 'Récap sans niveau', description: 'Corriger les niveaux',
    requester_id: '123456789012345678', requester_name: 'Valérian',
    created_by: '123456789012345678', status: 'in_progress' as RequestStatus,
    channel_id: 'bot-and-app', message_id: 'status-message', thread_id: 'request-thread',
    image_url: null,
  })

  function setup() {
    let row = current()
    const db = {
      query: jest.fn().mockImplementation(async (sql: string, params: unknown[] = []) => {
        if (sql.startsWith('SELECT * FROM pf2_request WHERE id')) return row && row.id === params[0] ? [row] : []
        if (sql.startsWith('SELECT * FROM pf2_request ORDER')) return row ? [row] : []
        if (sql.startsWith('UPDATE pf2_request SET status')) {
          row = { ...row, status: params[0] as RequestStatus }
          return []
        }
        return []
      }),
    }
    const edit = jest.fn().mockResolvedValue(undefined)
    const pin = jest.fn().mockResolvedValue(undefined)
    const unpin = jest.fn().mockResolvedValue(undefined)
    const send = jest.fn().mockResolvedValue(undefined)
    const setArchived = jest.fn().mockResolvedValue(undefined)
    const message = { pinned: true, edit, pin, unpin }
    const thread = { isThread: () => true, archived: true, setArchived, send }
    const channel = {
      type: ChannelType.GuildText,
      messages: { fetch: jest.fn().mockResolvedValue(message) },
    }
    const channels = {
      fetch: jest.fn().mockImplementation(async (id: string) =>
        id === 'request-thread' ? thread : id === 'bot-and-app' ? channel : null),
    }
    const client = { channels }
    const service = new Pf2RequestService(db as never)
    return {
      service, db, client, channel, message, thread,
      edit, pin, unpin, send, setArchived, channels,
      row: () => row,
    }
  }

  it('supports all four states, including review', () => {
    expect(REQUEST_STATES).toEqual({
      requested: 'Demandé', in_progress: 'En cours', review: 'À valider', done: 'Terminé',
    })
  })

  it('stores Terminé even when Discord refuses to unpin, without duplicates on retry', async () => {
    const ctx = setup()
    ctx.unpin.mockRejectedValue(new Error('DiscordAPIError[50013]: Missing Permissions'))
    await expect(ctx.service.change(ctx.client as never, 8, 'done'))
      .resolves.toEqual(expect.objectContaining({ id: 8, status: 'done' }))
    expect(ctx.row().status).toBe('done')
    expect(ctx.db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE pf2_request SET status'),
      ['done', 8],
    )
    expect(ctx.edit).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('Requête #8 — Terminé'),
      allowedMentions: { parse: [] },
    }))
    expect(ctx.unpin).toHaveBeenCalledTimes(1)
    expect(ctx.send).toHaveBeenCalledWith(expect.objectContaining({
      content: 'Requête #8 : **Terminé**.',
      allowedMentions: { parse: [] },
    }))
    await ctx.service.change(ctx.client as never, 8, 'done')
    expect(ctx.send).toHaveBeenCalledTimes(1)
  })

  it('persists À valider when Discord refuses a pin or edit', async () => {
    const ctx = setup()
    ctx.message.pinned = false
    ctx.edit.mockRejectedValueOnce(new Error('message inaccessible'))
    const result = await ctx.service.change(ctx.client as never, 8, 'review')
    expect(result.status).toBe('review')
    expect(ctx.row().status).toBe('review')
    expect(ctx.send).toHaveBeenCalledWith(expect.objectContaining({
      content: 'Requête #8 : **À valider**.',
    }))
    // Retry after a transient edit failure; no second thread announcement.
    await ctx.service.change(ctx.client as never, 8, 'review')
    expect(ctx.pin).toHaveBeenCalledTimes(1)
    expect(ctx.send).toHaveBeenCalledTimes(1)
  })

  it('persists every change when the bot is unavailable', async () => {
    const ctx = setup()
    const result = await ctx.service.change(null, 8, 'done')
    expect(result.status).toBe('done')
    expect(ctx.row().status).toBe('done')
    expect(ctx.channels.fetch).not.toHaveBeenCalled()
  })

  it('does not lose a status if the thread cannot be reopened or updated', async () => {
    const ctx = setup()
    ctx.setArchived.mockRejectedValue(new Error('Missing Permissions'))
    const result = await ctx.service.change(ctx.client as never, 8, 'review')
    expect(result.status).toBe('review')
    expect(ctx.row().status).toBe('review')
    expect(ctx.send).not.toHaveBeenCalled()
  })

  it('rejects unsupported statuses and unknown request IDs', async () => {
    const ctx = setup()
    await expect(ctx.service.change(ctx.client as never, 8, 'unknown' as RequestStatus))
      .rejects.toThrow('État inconnu')
    await expect(ctx.service.change(ctx.client as never, 9, 'done'))
      .rejects.toThrow('Requête inconnue')
  })

  it('the API accepts review and completes updates with no Discord bot connection', async () => {
    const ctx = setup()
    const previous = process.env['PF2_JOURNALS_INTERNAL_KEY']
    process.env['PF2_JOURNALS_INTERNAL_KEY'] = 'test-secret'
    try {
      const controller = new Pf2RequestController(ctx.service, { requestClient: () => null } as never)
      await expect(controller.change('test-secret', '8', { status: 'review' }))
        .resolves.toEqual(expect.objectContaining({ status: 'review' }))
      expect(ctx.row().status).toBe('review')
      await expect(controller.change('invalid', '8', { status: 'done' })).rejects.toThrow()
      await expect(controller.change('test-secret', '8', { status: 'invalid' as RequestStatus })).rejects.toThrow('Statut invalide')
      await expect(controller.change('test-secret', '0', { status: 'done' })).rejects.toThrow('Requête invalide')
    } finally {
      if (previous === undefined) delete process.env['PF2_JOURNALS_INTERNAL_KEY']
      else process.env['PF2_JOURNALS_INTERNAL_KEY'] = previous
    }
  })
})
