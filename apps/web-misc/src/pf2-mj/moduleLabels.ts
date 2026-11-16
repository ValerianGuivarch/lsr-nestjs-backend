export type WorkOption = { id: string; title: string }
type NamedModule = { title: string; group?: string; campaignIds: string[]; scenarioId?: string }

export function sortedWorks(works: WorkOption[]) {
  return [...new Map(works.map(work => [work.id, work])).values()].sort((a, b) => a.title.localeCompare(b.title, 'fr'))
}

export function moduleInWork(module: NamedModule, id: string) {
  return module.campaignIds.includes(id) || module.scenarioId === id
}

export function moduleDisplayTitle(module: NamedModule, works: WorkOption[], selectedId?: string) {
  const work = works.find(w => w.id === selectedId && moduleInWork(module, w.id))
    ?? works.find(w => moduleInWork(module, w.id))
  const parts = [work?.title, module.group, module.title].filter((part): part is string => Boolean(part))
  return [...new Set(parts)].join(' — ')
}
