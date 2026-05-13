/**
 * Pré-conçus de drafts pour JdR Tribal
 * Deux pools de traits pour distribuer lors de la création du Conseil
 */

export const DRAFT_PRESET_NORMAL = {
  id: 'draft-normal-traits',
  name: 'Traits Normaux',
  description: 'Pool de traits positifs et neutres',
  traits: [
    'cartographe',
    'fils-ancien-chef',
    'capitaine',
    'voyageur',
    'beau-dieu',
    'guerrier-exception',
    'forestier',
    'soigneur-betes',
    'travailleur',
    'force-nature',
    'tellurge',
    'sauvage',
    'memoire-eideique',
    'forme-magie',
    'guerrier-heroique',
    'vif',
    'polyvalent',
    'volonte-forte',
    'main-verte',
    'empathie-nature',
    'berserker',
    'brasseur',
    'compagne-remarquable',
    'tatouages-shamaniques',
    'bagarreur'
  ]
}

export const DRAFT_PRESET_DISADVANTAGES = {
  id: 'draft-disadvantages-traits',
  name: 'Traits Pénalisants',
  description: 'Pool de traits avec désavantages',
  traits: [
    'impatient',
    'alcoolique',
    'depensier',
    'aveugle',
    'arrogant',
    'balafire',
    'temeraire',
    'violent',
    'analphabete',
    'boiteux',
    'venerable'
  ]
}

export const DRAFT_PRESET_COMPLETE = {
  id: 'draft-complete-traits',
  name: 'Tous les Traits',
  description: 'Pool complet mélangé (normaux + pénalisants)',
  traits: [
    ...DRAFT_PRESET_NORMAL.traits,
    ...DRAFT_PRESET_DISADVANTAGES.traits
  ]
}

/**
 * Fonction pour créer des données de test
 * Crée automatiquement les traits manquants dans la base de données
 */
export function getAllDraftPresetTraits(): string[] {
  return [
    ...DRAFT_PRESET_NORMAL.traits,
    ...DRAFT_PRESET_DISADVANTAGES.traits
  ]
}

export function getDraftPreset(type: 'normal' | 'disadvantages') {
  return type === 'normal' ? DRAFT_PRESET_NORMAL : DRAFT_PRESET_DISADVANTAGES
}
