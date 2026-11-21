export type SceneFolder = { uuid: string; name: string; path: string; sceneCount: number }

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const archived = (segment: string) => /(?:^| )(?:copies?|archives?|old|verification)(?: |$)/.test(segment)

/** Folder names are a discovery hint, not proof of readiness or Toolkit ownership. */
export function matchingSceneFolders(folders: SceneFolder[], scenarioId: string, titles: string[]): SceneFolder[] {
  const names = [...new Set([scenarioId, ...titles].map(normalize).filter(value => value.length >= 6))]
  return folders.filter(folder => {
    const segments = folder.path.split(' / ').map(normalize)
    if (folder.sceneCount <= 0 || segments.some(archived)) return false
    return segments.some(segment => names.some(name => (' ' + segment + ' ').includes(' ' + name + ' ')))
  })
}
