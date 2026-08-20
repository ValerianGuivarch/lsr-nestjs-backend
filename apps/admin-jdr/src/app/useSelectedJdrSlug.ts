import { useSyncExternalStore } from 'react'
import { jdrAggregateStore } from '../data/aggregateStore'

export function useSelectedJdrSlug(): string | null {
  return useSyncExternalStore(
    (listener) => jdrAggregateStore.subscribe(listener),
    () => jdrAggregateStore.getSelectedSlug()
  )
}
