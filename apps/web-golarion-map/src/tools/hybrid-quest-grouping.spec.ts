import { groupQuestPlaces, questKeys, QUEST_CLUSTER_MAX_ZOOM, type HybridQuestPlace } from './hybrid-quest-grouping'

const site = (
  id: string, x: number, y: number,
  quests: Array<{ id: string; title: string; completed: boolean }>,
  extra: Partial<HybridQuestPlace> = {},
): HybridQuestPlace & { x: number; y: number } => ({
  id, name: id, latitude: y, longitude: x, x, y,
  questCompleted: quests.length > 0 && quests.every(q => q.completed),
  questLinks: quests.map(q => ({ ...q, url: 'https://discord.com/channels/1/' + q.id })),
  ...extra,
})
const q = (id: string, completed = false) => ({ id, title: 'Quest ' + id, completed })
const project = (p: HybridQuestPlace) => ({ x: p.longitude, y: p.latitude })

describe('hybrid quest map grouping', () => {
  it('one site with several Discord quests remains one marker', () => {
    const lodge = site('Grande Loge', 100, 100, [q('a'), q('b')])
    expect(questKeys(lodge, false)).toEqual(['discord:a', 'discord:b'])
    expect(groupQuestPlaces([lodge], project, 4, false)).toMatchObject([{ places: [lodge], questCount: 2 }])
  })
  it('clusters nearby Absalom sites, counting a shared quest only once, but not distant sites', () => {
    const agents = site('Agents Absalom', 105, 100, [q('a'), q('c')])
    const lodge = site('Grande Loge', 100, 115, [q('a'), q('b')])
    const sandpoint = site('Pointe-Sable', 850, 440, [q('d')])
    const groups = groupQuestPlaces([agents, lodge, sandpoint], project, 4, false)
    expect(groups).toHaveLength(2)
    const cluster = groups.find(g => g.places.length === 2)
    expect(cluster?.questCount).toBe(3)
    expect(cluster?.places.map(p => p.id)).toContain('Grande Loge')
    expect(groups.find(g => g.places.length === 1)?.places[0].id).toBe('Pointe-Sable')
  })
  it('separates nearby sites at the maximum clustering zoom', () => {
    const a = site('A', 120, 300, [q('a')])
    const b = site('B', 120, 300, [q('b')])
    expect(groupQuestPlaces([a, b], project, QUEST_CLUSTER_MAX_ZOOM - 0.1, true)).toHaveLength(1)
    expect(groupQuestPlaces([a, b], project, QUEST_CLUSTER_MAX_ZOOM, true)).toHaveLength(2)
  })
  it('filters fully completed sites and ignores completed quests in mixed sites', () => {
    const first = site('Mixed', 100, 100, [q('active'), q('done', true)])
    const done = site('Completed', 105, 105, [q('done', true)])
    expect(questKeys(first, false)).toEqual(['discord:active'])
    expect(groupQuestPlaces([first, done], project, 5, false)).toMatchObject([
      { places: [first], questCount: 1 },
    ])
    expect(groupQuestPlaces([first, done], project, 5, true)).toMatchObject([
      { places: [first, done], questCount: 2 },
    ])
  })
  it('preserves unresolved historical quest names without inventing Discord references', () => {
    const unresolved = site('Old site', 80, 80, [], { questUnresolved: ['Unknown quest'] })
    expect(questKeys(unresolved, false)).toEqual(['unknown:Old site:Unknown quest'])
    expect(groupQuestPlaces([unresolved], project, 2, false)[0].questCount).toBe(1)
  })
  it('groups transitively and does not mutate source entries', () => {
    const a = site('A', 0, 0, [q('a')])
    const b = site('B', 60, 0, [q('b')])
    const c = site('C', 120, 0, [q('c')])
    const arr = [a, b, c]
    const groups = groupQuestPlaces(arr, project, 4, false)
    expect(groups).toHaveLength(1)
    expect(groups[0].questCount).toBe(3)
    expect(groups[0].x).toBe(60)
    expect(arr.map(p => p.id)).toEqual(['A', 'B', 'C'])
  })
})
