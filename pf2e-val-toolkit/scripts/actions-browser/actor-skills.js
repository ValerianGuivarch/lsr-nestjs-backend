const CORE_SKILL_ALIASES = {
  acrobatics: ["acrobatics", "acrobatie"],
  arcana: ["arcana", "arcanes"],
  athletics: ["athletics", "athletisme", "athlétisme"],
  crafting: ["crafting", "artisanat"],
  deception: ["deception", "tromperie"],
  diplomacy: ["diplomacy", "diplomatie"],
  intimidation: ["intimidation"],
  medicine: ["medicine", "medecine", "médecine"],
  nature: ["nature"],
  occultism: ["occultism", "occultisme"],
  performance: ["performance", "representation", "représentation"],
  religion: ["religion"],
  society: ["society", "societe", "société"],
  stealth: ["stealth", "discretion", "discrétion"],
  survival: ["survival", "survie"],
  thievery: ["thievery", "vol", "larcin"]
};

const RANK_LABELS = [
  "Non qualifié",
  "Qualifié",
  "Expert",
  "Maître",
  "Légendaire"
];

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findCoreSlug(groupName) {
  const group = normalize(groupName);

  for (const [slug, aliases] of Object.entries(CORE_SKILL_ALIASES)) {
    if (aliases.some(alias => normalize(alias) === group)) return slug;
  }

  return null;
}

export function getSkillForGroup(actor, groupName) {
  if (!actor?.skills) return null;

  const slug = findCoreSlug(groupName);
  if (slug && actor.skills[slug]) {
    return actor.skills[slug];
  }

  const normalizedGroup = normalize(groupName);

  return Object.values(actor.skills).find(skill => {
    return (
      normalize(skill?.label) === normalizedGroup ||
      normalize(skill?.slug) === normalizedGroup
    );
  }) ?? null;
}

export function getSkillRankData(actor, groupName) {
  const skill = getSkillForGroup(actor, groupName);
  if (!skill) return null;

  const rank = Number(skill.rank ?? skill.proficiency?.rank ?? 0);
  return {
    rank,
    label: RANK_LABELS[rank] ?? `Rang ${rank}`,
    skillLabel: skill.label ?? groupName,
    modifier: Number.isFinite(Number(skill.mod)) ? Number(skill.mod) : null
  };
}
