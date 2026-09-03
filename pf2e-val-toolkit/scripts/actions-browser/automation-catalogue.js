/**
 * Stable UI classification for general PF2e actions.
 *
 * The symbols are plain Unicode on purpose: unlike Font Awesome icons they
 * remain visible inside every PF2e character-sheet theme.
 */

export const AUTOMATION_TYPES = {
  direct: {
    key: "direct",
    label: "Direct",
    glyph: "⚡",
    title: "Direct — lance immédiatement l’automatisation PF2e."
  },
  actionMenu: {
    key: "action-menu",
    label: "Menu d’action",
    glyph: "☰",
    title: "Menu d’action — affiche les choix propres à cette action."
  },
  statisticMenu: {
    key: "statistic-menu",
    label: "Choix de jet",
    glyph: "🎲",
    title: "Choix de jet — demande la compétence ou statistique utilisée."
  },
  assistant: {
    key: "assistant",
    label: "Assistant PF2e",
    glyph: "▣",
    title: "Assistant PF2e — ouvre le dialogue ou sélecteur natif PF2e."
  },
  declaration: {
    key: "declaration",
    label: "Déclaration",
    glyph: "📖",
    title: "Déclaration — publie l’action dans le chat sans inventer de mécanique."
  },
  unsupported: {
    key: "unsupported",
    label: "Non automatisé",
    glyph: "×",
    title: "Non automatisé — ouvre uniquement la règle pour le moment."
  }
};

export const DIRECT_ACTION_SLUGS = new Set([
  "seek",
  "sense-motive",
  "avert-gaze",
  "raise-a-shield",
  "drop-prone",
  "stand",
  "coerce",
  "create-forgery",
  "trip",
  "pick-a-lock",
  "command-an-animal",
  "conceal-an-object",
  "demoralize",
  "tumble-through",
  "disable-a-device",
  "disarm",
  "climb",
  "palm-an-object",
  "make-an-impression",
  "feint",
  "balance",
  "identify-alchemy",
  "maneuver-in-flight",
  "lie",
  "swim",
  "force-open",
  "track",
  "shove",
  "gather-information",
  "reposition",
  "sense-direction",
  "grapple",
  "high-jump",
  "long-jump",
  "hide",
  "impersonate",
  "squeeze",
  "treat-poison",
  "treat-disease",
  "request",
  "steal",
  "sneak"
]);

export const ACTION_MENU_SLUGS = new Set([
  "leap",
  "strike",
  "take-cover",
  "create-a-diversion",
  "administer-first-aid",
  "perform"
]);

export const STATISTIC_MENU_SLUGS = new Set([
  "aid",
  "arrest-a-fall",
  "escape",
  "grab-an-edge",
  "learn-a-spell",
  "decipher-writing",
  "identify-magic",
  "recall-knowledge",
  "subsist"
]);

export const ASSISTANT_ACTION_SLUGS = new Set([
  "craft",
  "earn-income",
  "repair",
  "treat-wounds"
]);

export const DECLARATION_ACTION_SLUGS = new Set([
  "step",
  "interact",
  "ready",
  "release",
  "delay",
  "point-out",
  "affix-a-fulu",
  "affix-a-talisman",
  "invest-an-item",
  "crawl",
  "mount"
]);

export const UNSUPPORTED_ACTION_SLUGS = new Set([
  "cast-a-spell",
  "sustain",
  "dismiss",
  "cover-tracks",
  "deconstruct",
  "borrow-an-arcane-spell",
  "fortify-camp",
  "plummeting-roll",
  "psychometric-assessment"
]);

export function getAutomationType(slug) {
  if (DIRECT_ACTION_SLUGS.has(slug)) return AUTOMATION_TYPES.direct;
  if (ACTION_MENU_SLUGS.has(slug)) return AUTOMATION_TYPES.actionMenu;
  if (STATISTIC_MENU_SLUGS.has(slug)) return AUTOMATION_TYPES.statisticMenu;
  if (ASSISTANT_ACTION_SLUGS.has(slug)) return AUTOMATION_TYPES.assistant;
  if (DECLARATION_ACTION_SLUGS.has(slug)) return AUTOMATION_TYPES.declaration;
  return AUTOMATION_TYPES.unsupported;
}
