// Single source of truth for English -> French place-name translation, shared by the map style and search.

let placeNamesFrPromise: Promise<Record<string, string>> | undefined;

async function loadPlaceNamesFr(): Promise<Record<string, string>> {
  try {
    const response = await fetch(`./place-names.fr.json?v=${BUILD_DATA_HASH}`);
    if (!response.ok) {
      throw new Error(`Failed to load place names: ${response.statusText}`);
    }
    return await response.json() as Record<string, string>;
  } catch (error) {
    console.warn('Failed to load French place names, falling back to English names:', error);
    return {};
  }
}

/**
 * Loads the English -> French place-name dictionary, once, and caches the result.
 */
export function getPlaceNamesFr(): Promise<Record<string, string>> {
  return placeNamesFrPromise ??= loadPlaceNamesFr();
}

/**
 * Translates a place name using the given dictionary, falling back to the original English name.
 */
export function translatePlaceName(name: string, dictionary: Record<string, string>): string {
  return dictionary[name] ?? name;
}
