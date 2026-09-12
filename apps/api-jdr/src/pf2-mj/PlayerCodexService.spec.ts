import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DataSource } from 'typeorm'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'
import { PlayerCodexService } from './PlayerCodexService'

describe('PlayerCodexService', () => {
  let root = ''; let source: DataSource | undefined
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'player-codex-'))
    const seed = join(root, 'seed', 'old'); await mkdir(seed, { recursive: true })
    await Promise.all(['pf2_personnages.json', 'pf2_factions.json', 'pf2_lieux.json', 'pf2_regions.json', 'pf2_evenements.json', 'user-curation.json', 'geography-overrides.json', 'catalogue-pf2.json'].map(name => writeFile(join(seed, name), name === 'catalogue-pf2.json' ? '{"entries":[],"collections":[]}' : '[]')))
    process.env['PF2_DATA_ROOT'] = join(root, 'seed'); process.env['STORAGE_PATH'] = join(root, 'storage')
    source = new DataSource({ type: 'sqlite', database: join(root, 'pf2.sqlite') }); await source.initialize()
  })
  afterEach(async () => { if (source?.isInitialized) await source.destroy(); await rm(root, { recursive: true, force: true }) })
  async function open(): Promise<{ persistence: Pf2PersistenceService; codex: PlayerCodexService }> {
    const persistence = new Pf2PersistenceService(source!); await persistence.onModuleInit()
    await persistence.saveRecord('pnj', { id: 'janira', nom: 'Janira Gavix', factions: ['Secret MJ'] })
    return { persistence, codex: new PlayerCodexService(source!, persistence) }
  }
  it('keeps player factions distinct from MJ factions and prevents duplicates', async () => {
    const { codex } = await open()
    const faction = await codex.createFaction({ name: ' Consortium de  l’Aspis ' }) as { id: string }
    const duplicate = await codex.createFaction({ name: 'consortium de l’asPis' }) as { id: string }
    expect(duplicate.id).toBe(faction.id)
    await codex.createCharacter({ npcId: 'janira', displayName: 'Janira', wikiPageTitle: 'Personnage:Janira' })
    await codex.addCharacterFaction('janira', faction.id); await codex.addCharacterFaction('janira', faction.id)
    await expect(codex.character('janira')).resolves.toEqual(expect.objectContaining({ factions: [{ id: faction.id, name: 'Consortium de l’Aspis', wikiPageTitle: 'Faction:Consortium de l’Aspis' }] }))
  })
  it('rejects cyclic player faction parents', async () => {
    const { codex } = await open(); const a = await codex.createFaction({ name: 'A' }) as { id: string }; const b = await codex.createFaction({ name: 'B' }) as { id: string }; const c = await codex.createFaction({ name: 'C' }) as { id: string }
    await codex.updateFaction(b.id, { parentFactionId: a.id }); await codex.updateFaction(c.id, { parentFactionId: b.id })
    await expect(codex.updateFaction(a.id, { parentFactionId: c.id })).rejects.toThrow('cycle')
  })
  it('uses stable candidate IDs and keeps an improvised presentation separate until a profile is requested', async () => {
    const { persistence, codex } = await open()
    await expect(codex.characterCandidates('jani')).resolves.toEqual([{ id: 'janira', name: 'Janira Gavix', portrait: null }])
    const presentation = await codex.createPresentation({ name: 'Orc cicatrisé', portraitUrl: 'https://cdn.discord.test/orc.webp', channelId: 'channel-1', showName: false })
    expect(presentation.showName).toBe(false)
    await codex.savePresentationMessage(presentation.id, 'message-1', 'https://cdn.discord.test/published.webp')
    await expect(codex.presentation(presentation.id)).resolves.toMatchObject({ sourceNpcId: null, portraitUrl: 'https://cdn.discord.test/published.webp' })
    const profile = await codex.ensurePresentationCharacter(presentation.id, 'L’orc cicatrisé', 'Personnage:L’orc cicatrisé') as { npcId: string }
    await expect(persistence.getRecord('pnj', profile.npcId)).resolves.toMatchObject({ nom: 'Orc cicatrisé' })
    await expect(codex.character(profile.npcId)).resolves.toMatchObject({ displayName: 'L’orc cicatrisé' })
  })
  it('marks a normal player-codex character as PJ without introducing another entity type', async () => {
    const { codex } = await open()
    await codex.createCharacter({ npcId: 'janira', displayName: 'Janira', wikiPageTitle: 'Personnage:Janira', isPlayer: true })
    await expect(codex.listPlayers()).resolves.toEqual([expect.objectContaining({ npcId: 'janira', isPlayer: true })])
    await codex.updateCharacter('janira', { isPlayer: false })
    await expect(codex.listPlayers()).resolves.toEqual([])
  })
  it('removes only player-codex links and clears faction parents safely', async () => {
    const { persistence, codex } = await open()
    const parent = await codex.createFaction({ name: 'Parent' }) as { id: string }
    const child = await codex.createFaction({ name: 'Enfant' }) as { id: string }
    await codex.updateFaction(child.id, { parentFactionId: parent.id })
    await codex.createCharacter({ npcId: 'janira', displayName: 'Janira', wikiPageTitle: 'Personnage:Janira' })
    await codex.addCharacterFaction('janira', parent.id)
    await codex.deleteCharacter('janira')
    await expect(codex.character('janira')).rejects.toThrow('introuvable')
    await expect(persistence.getRecord('pnj', 'janira')).resolves.toMatchObject({ nom: 'Janira Gavix' })
    await codex.deleteFaction(parent.id)
    await expect(codex.faction(child.id)).resolves.toMatchObject({ parentFactionId: null })
  })
  it('deletes an MJ-only PNJ but refuses when a Wiki character profile exists', async () => {
    const { persistence, codex } = await open()
    await codex.deleteMjPnj('janira')
    await expect(persistence.getRecord('pnj', 'janira')).resolves.toBeNull()

    await persistence.saveRecord('pnj', { id: 'janira', nom: 'Janira Gavix' })
    await codex.createCharacter({ npcId: 'janira', displayName: 'Janira', wikiPageTitle: 'Personnage:Janira' })
    await expect(codex.deleteMjPnj('janira')).rejects.toThrow('Supprime-la d’abord depuis le Wiki')
    await expect(persistence.getRecord('pnj', 'janira')).resolves.toMatchObject({ nom: 'Janira Gavix' })
  })
})
