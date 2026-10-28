/**
 * Group quest locations by on-screen proximity, not geographic distance.
 *
 * A place owns one marker regardless of how many Discord quests reference it.
 * Nearby *different* places collapse into one cluster when the map is zoomed out.
 * At zoom >= 9 every place marker is shown independently.
 * This file has no MapLibre/DOM dependency, so its logic is unit-testable.
 */
export type HybridQuestLink = {
  id: string
  title: string
  completed: boolean
  url: string
}

export type HybridQuestPlace = {
  id: string
  name: string
  latitude: number
  longitude: number
  questCompleted?: boolean
  questLinks?: HybridQuestLink[]
  questUnresolved?: string[]
  questNames?: string[]
  questName?: string
}

export type QuestCluster<T extends HybridQuestPlace> = {
  places: T[]
  x: number
  y: number
  questCount: number
}

export const QUEST_CLUSTER_MAX_ZOOM = 9
export const QUEST_CLUSTER_RADIUS_PX = 64

/** Unique Discord threads count once even when linked to several nearby places. */
export function questKeys(place: HybridQuestPlace, includeCompleted: boolean): string[] {
  const linked = (place.questLinks ?? [])
    .filter(quest => includeCompleted || !quest.completed)
    .map(quest => 'discord:' + quest.id)
  const unresolved = place.questUnresolved?.length
    ? place.questUnresolved
    : place.questLinks?.length ? [] : place.questNames?.length
      ? place.questNames : place.questName ? [place.questName] : []
  // Unknown historical names cannot be assumed to describe the same Discord quest.
  return [...new Set([...linked, ...unresolved.map(name => 'unknown:' + place.id + ':' + name)])]
}

export function groupQuestPlaces<T extends HybridQuestPlace>(
  places: readonly T[],
  project: (place: T) => { x: number; y: number },
  zoom: number,
  includeCompleted: boolean,
  clusterRadiusPx = QUEST_CLUSTER_RADIUS_PX,
): QuestCluster<T>[] {
  const visible = places.filter(place => includeCompleted || !place.questCompleted)
  const projected = visible.map(place => ({ place, pixel: project(place) }))
  const parent = projected.map((_, i) => i)
  const find = (i: number): number => {
    while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i] }
    return i
  }
  const merge = (a: number, b: number) => { parent[find(b)] = find(a) }
  if (zoom < QUEST_CLUSTER_MAX_ZOOM) {
    const radiusSquared = clusterRadiusPx * clusterRadiusPx
    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        const dx = projected[i].pixel.x - projected[j].pixel.x
        const dy = projected[i].pixel.y - projected[j].pixel.y
        if (dx * dx + dy * dy <= radiusSquared) merge(i, j)
      }
    }
  }
  const groups = new Map<number, typeof projected>()
  projected.forEach((item, index) => {
    const root = find(index)
    const group = groups.get(root) ?? []
    group.push(item)
    groups.set(root, group)
  })
  return [...groups.values()].map(group => ({
    places: group.map(item => item.place),
    x: group.reduce((sum, item) => sum + item.pixel.x, 0) / group.length,
    y: group.reduce((sum, item) => sum + item.pixel.y, 0) / group.length,
    questCount: new Set(group.flatMap(item => questKeys(item.place, includeCompleted))).size,
  }))
}
