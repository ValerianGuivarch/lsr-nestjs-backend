import { jdrApi } from './jdrApi'
import { JdrAggregate } from './types'

const SELECTED_JDR_STORAGE_KEY = 'jdr-admin:selected-jdr-slug'

type Listener = () => void

// Single in-memory cache of "the currently selected Jdr's full aggregate". All nested resources
// (characters, groups, items, ...) read from this cache; every mutation replaces it wholesale
// since every backend mutation endpoint returns the freshly recomposed aggregate.
class JdrAggregateStore {
  private selectedSlug: string | null = localStorage.getItem(SELECTED_JDR_STORAGE_KEY)
  private aggregate: JdrAggregate | null = null
  private pendingLoad: Promise<JdrAggregate> | null = null
  private listeners = new Set<Listener>()

  getSelectedSlug(): string | null {
    return this.selectedSlug
  }

  setSelectedSlug(slug: string | null): void {
    if (slug === this.selectedSlug) {
      return
    }

    this.selectedSlug = slug
    this.aggregate = null
    this.pendingLoad = null

    if (slug) {
      localStorage.setItem(SELECTED_JDR_STORAGE_KEY, slug)
    } else {
      localStorage.removeItem(SELECTED_JDR_STORAGE_KEY)
    }

    this.notify()
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener())
  }

  setAggregate(aggregate: JdrAggregate): void {
    this.aggregate = aggregate
    this.notify()
  }

  /** Returns the cached aggregate for the selected Jdr, fetching it once if not already cached. */
  async getAggregate(): Promise<JdrAggregate> {
    if (!this.selectedSlug) {
      throw new Error('No JdR selected')
    }

    if (this.aggregate) {
      return this.aggregate
    }

    if (!this.pendingLoad) {
      this.pendingLoad = jdrApi.findOne(this.selectedSlug).then((aggregate) => {
        this.aggregate = aggregate
        this.pendingLoad = null
        return aggregate
      })
    }

    return this.pendingLoad
  }

  async refresh(): Promise<JdrAggregate> {
    if (!this.selectedSlug) {
      throw new Error('No JdR selected')
    }

    const aggregate = await jdrApi.findOne(this.selectedSlug)
    this.setAggregate(aggregate)
    return aggregate
  }
}

export const jdrAggregateStore = new JdrAggregateStore()
