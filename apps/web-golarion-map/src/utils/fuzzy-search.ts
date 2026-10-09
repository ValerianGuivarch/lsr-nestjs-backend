import Fuse from 'fuse.js';
import { debug } from './debug';
import { getPlaceNamesFr, translatePlaceName } from '../i18n/place-names';

/**
 * Search index structure from search.json
 */
export interface SearchCategory {
  category: string;
  entries: SearchEntry[];
}

export interface SearchEntry {
  label: string;
  timed: TimedSearchEntry[];
}

export interface TimedSearchEntry {
  timeYear: TimeRange;
  timeIndex: TimeRange;
  bbox: [number, number]|[number, number, number, number]; // [minLng, minLat, maxLng, maxLat] or [lng, lat]
  areaM2?: number;
}

export interface TimeRange {
  timeStart?: number;
  timeEnd?: number;
}

export interface SearchResult extends TimedSearchEntry {
  category: string;
  label: string;
  labelFr: string;
  score?: number;
}

/**
 * FuzzySearch class handles loading, caching, and searching the location index
 */
export class FuzzySearch {
  private searchIndex: SearchCategory[] = [];
  private fuse: Fuse<SearchResult>;
  private flattenedEntries: SearchResult[] = [];

  constructor(searchIndex: SearchCategory[], fuse: Fuse<SearchResult>, flattenedEntries: SearchResult[]) {
    this.searchIndex = searchIndex;
    this.fuse = fuse;
    this.flattenedEntries = flattenedEntries;
  }

  static lazyInit = (fn: () => Promise<any>): (() => Promise<any>) => {
    let prom: Promise<any> | undefined = undefined;
    return (): Promise<any> => prom = (prom || fn());
  }

  /**
   * Load and initialize the search index
   */
  static get: ()=>Promise<FuzzySearch> = FuzzySearch.lazyInit(async () => {
    try {
      const audience = window.location.pathname.split('/').filter(Boolean)[0]?.toLowerCase();
      const playerMode = audience === 'pj' || audience === 'mj-light';
      const customPlacesPromise = (async () => {
        const url = window.GOLARION_MAP_CONFIG?.placesUrl ?? '';
        if (!url) return [] as Array<{ name: string; latitude: number; longitude: number }>;
        try {
          const response = await fetch(url, { credentials: 'omit', cache: 'no-store' });
          if (!response.ok) return [];
          const raw = await response.json();
          return (Array.isArray(raw) ? raw : []).flatMap((item): Array<{ name: string; latitude: number; longitude: number }> => {
            if (!item || typeof item !== 'object') return [];
            const value = item as Record<string, unknown>;
            const name = typeof value.name === 'string' ? value.name.trim() : '';
            const latitude = Number(value.latitude);
            const longitude = Number(value.longitude);
            return name && Number.isFinite(latitude) && Number.isFinite(longitude) ? [{ name, latitude, longitude }] : [];
          });
        } catch {
          return [];
        }
      })();

      const searchUrl = playerMode
        ? (window.GOLARION_MAP_CONFIG?.searchUrl ?? '')
        : `./search.json?v=${BUILD_DATA_HASH}`;
      if (!searchUrl) throw new Error('Player search URL is not configured.');
      let [response, placeNamesFr, customPlaces] = await Promise.all([
        fetch(searchUrl, { credentials: 'omit', cache: playerMode ? 'no-store' : 'default' }),
        getPlaceNamesFr(),
        customPlacesPromise
      ]);

      if (!response.ok) {
        throw new Error(`Failed to load search index: ${response.statusText}`);
      }
      
      let searchIndex = await response.json() as SearchCategory[];

      // In PJ mode the API has already removed every hidden entry. In MJ mode
      // this is the original full search index.
      let flattenedEntries:SearchResult[] = searchIndex.flatMap(cat =>
        cat.entries.flatMap(entry => entry.timed.map(timed => ({
          ...timed,
          label: entry.label,
          labelFr: translatePlaceName(entry.label, placeNamesFr),
          category: cat.category
        })))
      );

      flattenedEntries.push(...customPlaces.map(place => ({
        label: place.name,
        labelFr: place.name,
        category: 'locations',
        bbox: [place.longitude, place.latitude] as [number, number],
        timeYear: {},
        timeIndex: {}
      })));

      // Initialize Fuse.js for fuzzy matching (search both English and French names)
      let fuse = new Fuse<SearchResult>(flattenedEntries, {
        keys: [
          {
            name: 'label',
            weight: 2
          },
          {
            name: 'labelFr',
            weight: 2
          },
          {
            name: 'category',
            weight: 0.5
          }
        ],
        threshold: 0.4,
        distance: 100,
        minMatchCharLength: 2,
        includeScore: true,
        useExtendedSearch: false,
        ignoreLocation: true
      });
      if(debug)
        console.log(`Search index loaded: ${flattenedEntries.length} entries`);
      return new FuzzySearch(searchIndex, fuse, flattenedEntries);
    } catch (error) {
      console.error('Failed to load search index:', error);
      throw error;
    }
  });

  /**
   * Search for locations matching the query
   * @param query Search string
   * @param options Search options
   * @returns Array of search results sorted by relevance
   */
  search(
    query: string,
    options: {
      timeIndex?: number;
      categories?: string[];
      limit?: number;
    } = {}
  ): SearchResult[] {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Perform fuzzy search
    let results = this.fuse.search(query);

    // Filter by categories if specified
    if (options.categories && options.categories.length > 0) {
      results = results.filter(result =>
        options.categories!.includes(result.item.category)
      );
    }
    if (options.timeIndex !== undefined) {
      results = results.filter(result =>
        (result.item.timeIndex.timeStart === undefined || result.item.timeIndex.timeStart <= options.timeIndex!)
        &&
        (result.item.timeIndex.timeEnd === undefined || result.item.timeIndex.timeEnd > options.timeIndex!)
      );
    }

    // Apply limit
    const limit = options.limit || 10;
    const limitedResults = results.slice(0, limit);

    // Return results with scores
    return limitedResults.map(result => ({
      ...result.item,
      score: result.score
    }));
  }

  /**
   * Get all categories in the search index
   */
  getCategories(): string[] {
    return this.searchIndex.map(cat => cat.category);
  }

  /**
   * Get entries for a specific category
   */
  getCategory(category: string): SearchEntry[] {
    const cat = this.searchIndex.find(c => c.category === category);
    return cat ? cat.entries : [];
  }

  /**
   * Get total number of searchable entries
   */
  getEntryCount(): number {
    return this.flattenedEntries.length;
  }
}
