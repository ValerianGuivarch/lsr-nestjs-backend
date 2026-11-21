import { describe, expect, it } from 'vitest'
import { matchingSceneFolders } from './foundryCoverage'

const folder = (path: string, sceneCount = 1) => ({ uuid: path, name: path.split(' / ').at(-1)!, path, sceneCount })
describe('Foundry coverage', () => {
  it('detects the same scenario inside MJ or the campaign root', () => {
    const old = folder('MJ / Campagnes transverses / La Route ouverte / pfs-season-1-1-21 - Mistress of the Maze', 8)
    const moved = folder('La Route ouverte / 1-21 — Mistress of the Maze', 8)
    for (const candidate of [old, moved]) expect(matchingSceneFolders([candidate], 'pfs-season-1-1-21', ['Mistress of the Maze'])).toEqual([candidate])
  })
  it('ignores empty folders, copies, archives and verification', () => {
    const valid = folder('Malveillance', 5)
    expect(matchingSceneFolders([valid, folder('MJ / Malveillance — Anciennes cartes (archive)',6), folder('Copies / Malveillance',5), folder('Vérification / Malveillance',1), folder('Malveillance / Vide',0)], 'malevolence',['Malveillance'])).toEqual([valid])
  })
})
