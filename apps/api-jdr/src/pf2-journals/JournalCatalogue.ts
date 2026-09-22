/**
 * Catalogue éditorial immuable des Journaux.
 *
 * Ajouter ici les ~250 entrées validées, une entrée par journal. Les états de
 * révélation ne sont volontairement pas dans ce fichier : ils sont en SQLite.
 */
export type JournalDefinition = {
  number: number
  title: string
  content: string
  dependencies: number[]
}

// Aucun contenu fictif n'est fourni. Coller la liste éditoriale définitive ici.
export const JOURNAL_CATALOGUE: readonly JournalDefinition[] = []
