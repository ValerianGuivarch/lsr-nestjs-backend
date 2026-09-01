import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Pf2MjService } from './Pf2MjService'

describe('Pf2MjService', () => {
  const pnj = { id: 'janira-gavix', nom: 'Janira Gavix', description: '', factions: [], tags: [], portrait: 'portraits/janira-gavix.webp' }

  function serviceFor(foundryOverrides: Record<string, jest.Mock> = {}, pnjValue: Record<string, unknown> = pnj, persistenceOverrides: Record<string, jest.Mock> = {}) {
    const persistence = {
      readReference: jest.fn().mockResolvedValue([pnjValue]),
      savePortrait: jest.fn().mockResolvedValue({ path: 'portraits/janira-gavix.webp' }),
      readPortrait: jest.fn().mockResolvedValue({ bytes: Buffer.from('portrait'), filename: 'janira-gavix.webp', mimeType: 'image/webp' }),
      replaceReference: jest.fn(),
      readCuration: jest.fn().mockResolvedValue({}),
      saveCuration: jest.fn(),
      ...persistenceOverrides
    }
    const foundry = {
      uploadPortrait: jest.fn().mockResolvedValue('assets/l7r/portraits/janira-gavix.webp'),
      syncActorPortrait: jest.fn().mockResolvedValue(undefined),
      getNpcSummary: jest.fn().mockResolvedValue({ uuid: 'Actor.janira', name: 'Janira Gavix', type: 'npc', level: 5, hp: 75, img: null }),
      createNpcPlaceholder: jest.fn().mockResolvedValue({ uuid: 'Actor.janira', name: 'Janira Gavix' }),
      ...foundryOverrides
    }
    return { service: new Pf2MjService(persistence as never, foundry as never), persistence, foundry }
  }

  describe('portraits Foundry', () => {
    it('stores a portrait locally without requiring Foundry when no Actor is linked', async () => {
      const { service, foundry } = serviceFor()
      jest.spyOn(service, 'savePnjPortrait').mockResolvedValue('portraits/janira-gavix.webp')
      await expect(service.saveAndSyncPnjPortrait(Buffer.from('image'), 'image/webp', 'janira-gavix')).resolves.toMatchObject({ portrait: 'portraits/janira-gavix.webp', local: 'success', foundry: 'not-linked' })
      expect(foundry.uploadPortrait).not.toHaveBeenCalled()
    })

    it('keeps local storage successful when Foundry is offline', async () => {
      const { service, foundry } = serviceFor({ uploadPortrait: jest.fn().mockRejectedValue(new Error('Relay offline')) }, { ...pnj, foundryActorUuid: 'Actor.janira' })
      jest.spyOn(service, 'savePnjPortrait').mockResolvedValue('portraits/janira-gavix.webp')
      await expect(service.saveAndSyncPnjPortrait(Buffer.from('image'), 'image/webp', 'janira-gavix')).resolves.toMatchObject({ local: 'success', foundry: 'unavailable', foundryMessage: 'Relay offline' })
      expect(foundry.syncActorPortrait).not.toHaveBeenCalled()
    })

    it('syncs the existing Actor UUID and never depends on the PNJ name', async () => {
      const { service, foundry } = serviceFor({}, { ...pnj, nom: 'Janira renommée', foundryActorUuid: 'Actor.janira' })
      await expect(service.resyncPnjPortrait('janira-gavix')).resolves.toMatchObject({ local: 'success', foundry: 'synchronized' })
      expect(foundry.syncActorPortrait).toHaveBeenCalledWith('Actor.janira', 'assets/l7r/portraits/janira-gavix.webp')
    })

    it('refuses creating a duplicate placeholder when an Actor is already linked', async () => {
      const { service, foundry } = serviceFor({}, { ...pnj, foundryActorUuid: 'Actor.janira' })
      await expect(service.createFoundryPlaceholder('janira-gavix')).rejects.toThrow('possède déjà un Actor')
      expect(foundry.createNpcPlaceholder).not.toHaveBeenCalled()
    })

    it('dissociates only the UUID and preserves the Foundry Actor', async () => {
      const { service, persistence, foundry } = serviceFor({}, { ...pnj, foundryActorUuid: 'Actor.janira' })
      await expect(service.detachFoundryActor('janira-gavix')).resolves.toMatchObject({ id: 'janira-gavix', foundryActorUuid: null })
      expect(persistence.replaceReference).toHaveBeenCalled()
      expect(foundry).not.toHaveProperty('deleteActor')
    })
  })

  describe('curation V3', () => {
    it('writes new overrides only in byId and keeps legacy maps intact', async () => {
      const legacy = { entries: { 'old-entry': { playability: 'Prêt' } }, levelsByCampaign: { 'age-of-ashes': '1–20' } }
      const { service, persistence } = serviceFor({}, pnj, { readCuration: jest.fn().mockResolvedValue(structuredClone(legacy)) })

      const result = await service.updateCuration({ id: 'age-of-ashes-volume-1', field: 'levels', value: '1–4' })

      expect(result).toMatchObject({
        schemaVersion: 3,
        byId: { 'age-of-ashes-volume-1': { levelsOverride: '1–4' } },
        entries: legacy.entries,
        levelsByCampaign: legacy.levelsByCampaign
      })
      expect(persistence.saveCuration).toHaveBeenCalledWith(result)
    })
  })

  describe('library scan V3', () => {
    it('detects info PDFs, resource ZIPs and campaign inheritance targets', async () => {
      const root = await mkdtemp(join(tmpdir(), 'pf2-mj-scan-'))
      const library = join(root, 'library')
      const dataRoot = join(root, 'data')
      const previousLibrary = process.env['PF2_LIBRARY_ROOT']
      const previousData = process.env['PF2_DATA_ROOT']

      try {
        await mkdir(join(library, 'Campagnes'), { recursive: true })
        await mkdir(join(library, 'PFS'), { recursive: true })
        await mkdir(dataRoot, { recursive: true })
        await writeFile(join(library, 'Campagnes', "Campagne - L'Âge des Cendres (ressources).zip"), 'zip')
        await writeFile(join(library, 'PFS', 'PFS 1-01 (ressources).zip'), 'zip')
        await writeFile(join(library, 'PFS', 'PFS 1-01 (info).pdf'), 'pdf')
        await writeFile(join(dataRoot, 'catalogue-pf2.json'), JSON.stringify({
          files: [],
          collections: [],
          entries: [
            {
              id: 'age-of-ashes', kind: 'campaign', titleFr: 'L’Âge des Cendres', titleOriginal: 'Age of Ashes', aliases: [], collectionId: null,
              parts: [{ id: 'age-of-ashes-volume-1', kind: 'volume_aventure', titleFr: 'La Colline du chevalier infernal', sequence: 1 }]
            },
            {
              id: 'pfs-season-1-1-01', kind: 'pfs-scenario', titleFr: null, titleOriginal: 'The Absalom Initiation', aliases: [], number: '1-01', collectionId: 'pfs-season-1', parts: []
            }
          ]
        }))

        process.env['PF2_LIBRARY_ROOT'] = library
        process.env['PF2_DATA_ROOT'] = dataRoot
        const { service } = serviceFor()
        const report = await service.scanLibrary() as {
          summary: { information: number; zips: number }
          addedInformationPdfs: string[]
          resourceInventory: { bundles: Array<{ targetId: string | null; scope: string; associationStatus: string }> }
        }

        expect(report.summary).toMatchObject({ information: 1, zips: 2 })
        expect(report.addedInformationPdfs).toEqual(['PFS/PFS 1-01 (info).pdf'])
        expect(report.resourceInventory.bundles).toEqual(expect.arrayContaining([
          expect.objectContaining({ targetId: 'age-of-ashes', scope: 'descendants', associationStatus: 'confirmed' }),
          expect.objectContaining({ targetId: 'pfs-season-1-1-01', scope: 'exact', associationStatus: 'confirmed' })
        ]))
      } finally {
        if (previousLibrary === undefined) delete process.env['PF2_LIBRARY_ROOT']; else process.env['PF2_LIBRARY_ROOT'] = previousLibrary
        if (previousData === undefined) delete process.env['PF2_DATA_ROOT']; else process.env['PF2_DATA_ROOT'] = previousData
        await rm(root, { recursive: true, force: true })
      }
    })
  })
})
