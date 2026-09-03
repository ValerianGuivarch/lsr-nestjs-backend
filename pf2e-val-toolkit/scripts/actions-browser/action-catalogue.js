export const BASIC_ACTION_SLUGS = [
  "aid",
  "arrest-a-fall",
  "leap",
  "seek",
  "avert-gaze",
  "sense-motive",
  "step",
  "affix-a-fulu",
  "affix-a-talisman",
  "strike",
  "interact",
  "invest-an-item",
  "cast-a-spell",
  "raise-a-shield",
  "sustain",
  "take-cover",
  "ready",
  "crawl",
  "release",
  "delay",
  "dismiss",
  "escape",
  "drop-prone",
  "mount",
  "grab-an-edge",
  "stand",
  "point-out",

  // Actions transversales, affichées une seule fois hors des compétences.
  "recall-knowledge",
  "identify-magic",
  "decipher-writing",
  "learn-a-spell",
  "subsist",
  "earn-income"
];

export const BASIC_ACTION_FREQUENCY = {
  frequent: [
    "aid",
    "leap",
    "seek",
    "sense-motive",
    "recall-knowledge",
    "identify-magic",
    "step",
    "strike",
    "interact",
    "cast-a-spell",
    "raise-a-shield",
    "take-cover",
    "ready",
    "release",
    "delay",
    "escape",
    "drop-prone",
    "stand",
    "point-out"
  ],
  situational: [
    "arrest-a-fall",
    "avert-gaze",
    "affix-a-fulu",
    "affix-a-talisman",
    "invest-an-item",
    "sustain",
    "crawl",
    "dismiss",
    "mount",
    "grab-an-edge",

    // Actions multi-compétences : une seule entrée, puis choix du jet.
    "decipher-writing",
    "learn-a-spell",
    "subsist",
    "earn-income"
  ]
};

export const SKILL_ACTION_SLUGS = {
  "Acrobaties": [
    "balance",
    "tumble-through",
    "maneuver-in-flight",
    "squeeze",
    "plummeting-roll"
  ],
  "Arcanes": [
    "borrow-an-arcane-spell"
  ],
  "Athlétisme": [
    "climb",
    "force-open",
    "grapple",
    "high-jump",
    "long-jump",
    "reposition",
    "shove",
    "swim",
    "trip",
    "disarm"
  ],
  "Artisanat": [
    "repair",
    "craft",
    "identify-alchemy",
    "deconstruct",
    "fortify-camp"
  ],
  "Duperie": [
    "create-a-diversion",
    "impersonate",
    "lie",
    "feint"
  ],
  "Diplomatie": [
    "gather-information",
    "make-an-impression",
    "request"
  ],
  "Intimidation": [
    "coerce",
    "demoralize"
  ],
  "Connaissance": [],
  "Médecine": [
    "administer-first-aid",
    "treat-disease",
    "treat-poison",
    "treat-wounds"
  ],
  "Nature": [
    "command-an-animal"
  ],
  "Occultisme": [
    "psychometric-assessment"
  ],
  "Représentation": [
    "perform"
  ],
  "Religion": [],
  "Société": [
    "create-forgery"
  ],
  "Discrétion": [
    "conceal-an-object",
    "hide",
    "sneak"
  ],
  "Survie": [
    "sense-direction",
    "cover-tracks",
    "track"
  ],
  "Larcin": [
    "palm-an-object",
    "steal",
    "disable-a-device",
    "pick-a-lock"
  ]
};

/**
 * The previous ordering followed PF2e's English skill order.
 * Sort the displayed French labels in French instead.
 */
export const SKILL_GROUP_ORDER = Object.keys(SKILL_ACTION_SLUGS)
  .sort((a, b) => a.localeCompare(
    b,
    "fr",
    {
      sensitivity: "base",
      ignorePunctuation: true
    }
  ));

export const SKILL_ACTION_SLUG_SET = new Set(
  Object.values(SKILL_ACTION_SLUGS).flat()
);

export const GENERAL_ACTION_SLUGS = [
  ...BASIC_ACTION_SLUGS,
  ...Array.from(SKILL_ACTION_SLUG_SET)
];

export const GENERAL_ACTION_SLUG_SET = new Set(GENERAL_ACTION_SLUGS);

export function getSkillGroupsForSlug(slug) {
  return SKILL_GROUP_ORDER.filter(group =>
    SKILL_ACTION_SLUGS[group]?.includes(slug)
  );
}

export function getCatalogueKind(slug) {
  if (BASIC_ACTION_SLUGS.includes(slug)) return "basic";
  if (SKILL_ACTION_SLUG_SET.has(slug)) return "skill";
  return null;
}


/**
 * Skill-action proficiency matrix from PF2e 8.3.0 GM Screen:
 * "Actions de compétence (Skill Actions)".
 *
 * An action listed here requires at least Trained in that specific skill.
 * Actions not listed here are usable Untrained according to that table.
 *
 * The GM visibility setting remains authoritative: this metadata never hides
 * an action automatically. It only annotates it and can disable its ▶ button
 * when the current actor does not meet the minimum proficiency.
 */
export const SKILL_GROUP_TO_STATISTIC = {
  "Acrobaties": "acrobatics",
  "Arcanes": "arcana",
  "Athlétisme": "athletics",
  "Artisanat": "crafting",
  "Duperie": "deception",
  "Diplomatie": "diplomacy",
  "Intimidation": "intimidation",
  "Connaissance": null,
  "Médecine": "medicine",
  "Nature": "nature",
  "Occultisme": "occultism",
  "Représentation": "performance",
  "Religion": "religion",
  "Société": "society",
  "Discrétion": "stealth",
  "Survie": "survival",
  "Larcin": "thievery"
};

export const SKILL_TRAINED_ACTIONS = {
  "Acrobaties": [
    "maneuver-in-flight",
    "squeeze"
  ],
  "Arcanes": [
    "learn-a-spell",
    "decipher-writing",
    "borrow-an-arcane-spell",
    "identify-magic"
  ],
  "Athlétisme": [
    "disarm"
  ],
  "Artisanat": [
    "craft",
    "earn-income",
    "identify-alchemy"
  ],
  "Duperie": [
    "feint"
  ],
  "Diplomatie": [],
  "Intimidation": [],
  "Connaissance": [
    "earn-income"
  ],
  "Médecine": [
    "treat-disease",
    "treat-poison",
    "treat-wounds"
  ],
  "Nature": [
    "learn-a-spell",
    "identify-magic"
  ],
  "Occultisme": [
    "learn-a-spell",
    "decipher-writing",
    "identify-magic"
  ],
  "Représentation": [
    "earn-income"
  ],
  "Religion": [
    "learn-a-spell",
    "decipher-writing",
    "identify-magic"
  ],
  "Société": [
    "create-forgery",
    "decipher-writing"
  ],
  "Discrétion": [],
  "Survie": [
    "cover-tracks",
    "track"
  ],
  "Larcin": [
    "pick-a-lock",
    "disable-a-device"
  ]
};

export function skillActionRequiresTrained(group, slug) {
  return Boolean(SKILL_TRAINED_ACTIONS[group]?.includes(slug));
}

