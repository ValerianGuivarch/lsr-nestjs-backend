import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DataSource } from 'typeorm'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'
import { PlayerCodexService } from '../pf2-mj/PlayerCodexService'
import { SessionPreparationService } from './SessionPreparationService'
import { DiscordService } from './DiscordService'
import { DiscordCommandsService } from './DiscordCommandsService'

describe('SessionPreparationService', () => {
  let root = ''
  let source: DataSource
  let persistence: Pf2PersistenceService
  let service: SessionPreparationService
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'pf2-prep-'))
    const seed = join(root, 'seed', 'old')
    await mkdir(seed, { recursive: true })
    await Promise.all(['pf2_personnages.json', 'pf2_factions.json', 'pf2_lieux.json', 'pf2_regions.json', 'pf2_evenements.json', 'user-curation.json', 'geography-overrides.json', 'catalogue-pf2.json'].map(name => writeFile(join(seed, name), name === 'catalogue-pf2.json' ? '{"entries":[],"collections":[]}' : '[]')))
    process.env['PF2_DATA_ROOT'] = join(root, 'seed'); process.env['STORAGE_PATH'] = join(root, 'storage')
    source = new DataSource({ type: 'sqlite', database: join(root, 'pf2.sqlite') }); await source.initialize()
    persistence = new Pf2PersistenceService(source); await persistence.onModuleInit()
    const codex = new PlayerCodexService(source, persistence)
    service = new SessionPreparationService(source, codex, { requestClient: () => null } as unknown as DiscordService, {} as DiscordCommandsService)
  })
  afterEach(async () => { if (source.isInitialized) await source.destroy(); await rm(root, { recursive: true, force: true }) })

  it('creates, edits, lists and removes a preparation without creating permanent PNJs', async () => {
    const created = await service.create({ title: 'La citadelle', body: { summary: 'Des gobelins disparus', stages: [
      { id: 'stage-1', title: 'A10 — Alak', time: '21h10', notes: 'Entrée', done: false, blocks: [
        { id: 'npc-1', kind: 'personnage', name: 'Garde de Brèchemur', portraitUrl: 'https://example.org/guard.png', text: '', done: false },
      ] },
    ] } }) as { id: string; revision: number; body: { stages: unknown[] } }
    expect(created.revision).toBe(1)
    expect(created.body.stages).toHaveLength(1)
    expect(await persistence.listRecords('pnj')).toEqual([])
    const updated = await service.update(created.id, { ...(created as object), title: 'Citadelle Altaerein' }) as { title: string; revision: number }
    expect(updated.title).toBe('Citadelle Altaerein')
    expect(updated.revision).toBe(2)
    await expect(service.update(created.id, { ...created, title: 'Version obsolète' })).rejects.toThrow()
    expect(await service.list()).toHaveLength(1)
    await service.remove(created.id)
    expect(await service.list()).toHaveLength(0)
  })

  it('memorizes the command channel with the created session and closes it at session end', async () => {
    const session = await persistence.createSession({ sessionNumber: 1, inGameStartDate: '4720-01-01' })
    await persistence.rememberSessionDiscordChannel(session.id, 'channel-xyz', 'guild-123')
    const prep = await service.create({ title: 'Séance 1', sessionId: session.id, body: { stages: [], summary: '' } }) as { sessionId: string }
    expect(prep.sessionId).toBe(session.id)
    const sessions = await service.sessions() as Array<{ channelId: string; ended: boolean }>
    expect(sessions[0].channelId).toBe('channel-xyz')
    expect(sessions[0].ended).toBe(false)
    await persistence.closeSessionDiscordChannel(session.id)
    expect((await service.sessions() as Array<{ ended: boolean }>)[0].ended).toBe(true)
  })

  it('publishes the Discord presentation in the remembered session channel and queues Foundry', async () => {
    const session = await persistence.createSession({ sessionNumber: 2, inGameStartDate: '4720-01-03' })
    await persistence.rememberSessionDiscordChannel(session.id, 'session-thread', 'campaign-guild')
    const prep = await service.create({ title: 'Partage', sessionId: session.id, body: { summary: '', stages: [{ id: 'stage', title: 'Scène', blocks: [
      { id: 'guard', kind: 'personnage', name: 'Garde temporaire', portraitUrl: 'https://example.org/garde.png', showName: false },
    ] }] } }) as { id: string }
    const send = jest.fn(async (_payload: { content: string }) => ({ id: 'discord-message-42', url: 'https://discord.com/channels/campaign-guild/session-thread/discord-message-42', attachments: { first: () => ({ url: 'https://cdn.discordapp.com/garde.png' }) } }))
    ;(service as unknown as { discord: unknown }).discord = { requestClient: () => ({ isReady: () => true, channels: { fetch: async () => ({ send }), cache: new Map() } }) }
    const result = await service.share(prep.id, 'guard')
    expect(result).toEqual(expect.objectContaining({ discord: 'sent', foundry: 'queued', channelId: 'session-thread' }))
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][0]).toEqual(expect.objectContaining({ content: '\u200b' }))
    const presentations = await new PlayerCodexService(source, persistence).foundryPresentations()
    expect(presentations.presentations).toEqual(expect.arrayContaining([expect.objectContaining({ showName: false, portraitUrl: 'https://cdn.discordapp.com/garde.png' })]))
    expect(await persistence.listRecords('pnj')).toEqual([])
  })

  it('refuses an invalid or duplicated stage and rejects share without an active session channel', async () => {
    await expect(service.create({ title: 'X', body: { stages: [{ id: '1', title: 'A', blocks: [] }, { id: '1', title: 'B', blocks: [] }] } })).rejects.toThrow()
    const prep = await service.create({ title: 'Sans canal', body: { summary: '', stages: [{ id: 's', title: 'A', blocks: [{ id: 'b', kind: 'personnage', name: 'Figurant' }] }] } }) as { id: string }
    await expect(service.share(prep.id, 'b')).rejects.toThrow(/séance Discord active/)
  })
})
