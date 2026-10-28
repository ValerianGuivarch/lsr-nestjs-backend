import { questKeys, type HybridQuestPlace } from './hybrid-quest-grouping'

/** A link to a Discord thread, not a place id or a free-text quest title. */
export function questIdFromSearch(search: string): string | null {
  const value = new URLSearchParams(search).get('quest')
  return value && /^\d{15,22}$/.test(value) ? value : null
}

export function placesForDiscordQuest<T extends HybridQuestPlace>(
  places: readonly T[], threadId: string,
): T[] {
  return places.filter(place => place.questLinks?.some(link => link.id === threadId))
}

/**
 * A single mapped site gets a close zoom and popup; multiple sites get
 * a bounding rectangle so no attached site is silently omitted.
 */
export function questFocusCamera<T extends HybridQuestPlace>(places: readonly T[]):
  | { kind: 'single'; center: [number, number] }
  | { kind: 'multiple'; bounds: [[number, number], [number, number]] }
  | null {
  if (!places.length) return null
  if (places.length === 1) {
    return { kind: 'single', center: [places[0].longitude, places[0].latitude] }
  }
  return {
    kind: 'multiple',
    bounds: [
      [Math.min(...places.map(place => place.longitude)), Math.min(...places.map(place => place.latitude))],
      [Math.max(...places.map(place => place.longitude)), Math.max(...places.map(place => place.latitude))],
    ],
  }
}

/** Emoji chosen by a Discord reaction and stored at the beginning of a thread title. */
export function leadingQuestEmoji(title: string): string | null {
  const match = title.match(/^((?:\p{Regional_Indicator}{2}|[#*0-9]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?)*))(?=\s|$)/u)
  return match?.[1] ?? null
}

/**
 * One site remains one marker even when several quests share it.
 * Show up to three emojis side by side rather than arbitrarily selecting one;
 * its count badge still shows the complete number of visible quests.
 */
export function questPlaceEmojis(place: HybridQuestPlace, includeCompleted: boolean): string[] {
  const links = (place.questLinks ?? []).filter(link => includeCompleted || !link.completed)
  if (!links.length || questKeys(place, includeCompleted).length !== links.length) return []
  const emojis = links.map(link => leadingQuestEmoji(link.title))
  return emojis.every((emoji): emoji is string => Boolean(emoji)) ? emojis.slice(0, 3) as string[] : []
}

export function questPlaceEmoji(place: HybridQuestPlace, includeCompleted: boolean): string | null {
  const emojis = questPlaceEmojis(place, includeCompleted)
  return emojis.length === 1 ? emojis[0] : null
}

/** Several nearby sites can represent one single Discord quest. */
export function questClusterEmoji(places: readonly HybridQuestPlace[], includeCompleted: boolean): string | null {
  const keys = new Set(places.flatMap(place => questKeys(place, includeCompleted)))
  if (keys.size !== 1) return null
  const links = places.flatMap(place => (place.questLinks ?? [])
    .filter(link => includeCompleted || !link.completed))
  if (!links.length || new Set(links.map(link => link.id)).size !== 1) return null
  return leadingQuestEmoji(links[0].title)
}
