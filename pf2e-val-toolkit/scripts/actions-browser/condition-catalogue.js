/**
 * Semantic grouping for PF2e conditions.
 *
 * The catalogue itself is NOT hard-coded: conditions are loaded from the
 * system's `pf2e.conditionitems` compendium. This map only decides where a
 * known condition is displayed. Anything new added by PF2e automatically
 * falls back to "Autres états".
 */
export const CONDITION_CATEGORIES = [
  {
    id: "perception",
    label: "Visibilité & sens",
    icon: "fa-solid fa-eye",
    slugs: [
      "blinded",
      "concealed",
      "dazzled",
      "deafened",
      "hidden",
      "invisible",
      "observed",
      "undetected",
      "unnoticed"
    ]
  },
  {
    id: "position",
    label: "Position & entraves",
    icon: "fa-solid fa-person-falling",
    slugs: [
      "grabbed",
      "immobilized",
      "off-guard",
      "paralyzed",
      "prone",
      "restrained"
    ]
  },
  {
    id: "actions",
    label: "Économie d’actions",
    icon: "fa-solid fa-hourglass-half",
    slugs: [
      "quickened",
      "slowed",
      "stunned"
    ]
  },
  {
    id: "mental",
    label: "Mental & comportement",
    icon: "fa-solid fa-brain",
    slugs: [
      "confused",
      "controlled",
      "fascinated",
      "fleeing",
      "frightened"
    ]
  },
  {
    id: "impairments",
    label: "Affaiblissements",
    icon: "fa-solid fa-arrow-trend-down",
    slugs: [
      "clumsy",
      "drained",
      "enfeebled",
      "encumbered",
      "fatigued",
      "sickened",
      "stupefied"
    ]
  },
  {
    id: "survival",
    label: "Survie & blessures",
    icon: "fa-solid fa-heart-pulse",
    slugs: [
      "doomed",
      "dying",
      "unconscious",
      "wounded"
    ]
  },
  {
    id: "attitudes",
    label: "Attitudes sociales",
    icon: "fa-solid fa-comments",
    slugs: [
      "helpful",
      "friendly",
      "indifferent",
      "unfriendly",
      "hostile"
    ]
  }
];

export const FALLBACK_CONDITION_CATEGORY = {
  id: "other",
  label: "Autres états",
  icon: "fa-solid fa-circle-info",
  slugs: []
};

export function conditionCategoryFor(slug) {
  return (
    CONDITION_CATEGORIES.find(category =>
      category.slugs.includes(slug)
    ) ??
    FALLBACK_CONDITION_CATEGORY
  );
}
