// District names printed directly on Master NI's illustrated Absalom map.
// Based on the 'districts' entries situated inside Absalom in map-search-index.json.
// Do not hide other labels, POIs or similarly named places elsewhere on Golarion.
export const ABSALOM_DISTRICT_LABELS: readonly string[] = [
  'Ascendant Court',
  'Azlanti Keep',
  'Copperwood',
  'Dawnfoot',
  'Eastgate',
  'Foreign Quarter',
  'Fort Tempest',
  'Ivy District',
  'Petal District',
  'Precipice Quarter',
  'Shoreline',
  'Starwatch Keep',
  'The Coins',
  'The Docks',
  'The Puddles',
  'Westerhold',
  'Westgate',
  'Wise Quarter',
]
export const absalomDistrictLabelSet = new Set(ABSALOM_DISTRICT_LABELS)

export function isAbsalomDistrict(category: string, label: string): boolean {
  return category === 'districts' && absalomDistrictLabelSet.has(label)
}
