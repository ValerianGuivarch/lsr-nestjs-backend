const SEARCH_CATEGORY_FR: Readonly<Record<string, string>> = {
  buildings: 'Bâtiments',
  continents: 'Continents',
  deserts: 'Déserts',
  districts: 'Districts',
  forests: 'Forêts',
  generic: 'Autres',
  hills: 'Collines',
  ice: 'Glaces',
  land: 'Terres',
  locations: 'Lieux',
  mountains: 'Montagnes',
  nations: 'Nations',
  provinces: 'Provinces',
  regions: 'Régions',
  rivers: 'Rivières',
  roads: 'Routes',
  specials: 'Lieux spéciaux',
  subregions: 'Sous-régions',
  swamps: 'Marais',
  waters: 'Étendues d’eau',
};

export function translateSearchCategory(category: string): string {
  return SEARCH_CATEGORY_FR[category] ?? category;
}