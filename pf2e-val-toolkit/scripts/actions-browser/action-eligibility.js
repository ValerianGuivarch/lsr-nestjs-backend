import {
  SKILL_GROUP_TO_STATISTIC,
  skillActionRequiresTrained
} from "./action-catalogue.js";

function getActorSkillRank(actor, skillGroup) {
  const statisticSlug = SKILL_GROUP_TO_STATISTIC[skillGroup];

  // Lore/Connaissance is dynamic: there is no single statistic to inspect.
  if (!statisticSlug) return null;

  const statistic =
    actor?.getStatistic?.(statisticSlug) ??
    actor?.skills?.[statisticSlug] ??
    null;

  if (!statistic) return 0;

  return Number(
    statistic.rank ??
    statistic.proficiency?.rank ??
    0
  );
}

function actorStatisticRank(actor, slug) {
  const statistic =
    actor?.getStatistic?.(slug) ??
    actor?.skills?.[slug] ??
    null;

  if (!statistic) return 0;

  return Number(
    statistic.rank ??
    statistic.proficiency?.rank ??
    0
  );
}

function actorHasTrainedLore(actor) {
  const skills = Object.entries(actor?.skills ?? {});

  return skills.some(([slug, statistic]) => {
    const normalizedSlug = String(
      statistic?.slug ?? slug
    ).toLowerCase();

    const isLore =
      normalizedSlug.includes("lore") ||
      statistic?.lore === true ||
      statistic?.isLore === true;

    if (!isLore) return false;

    return Number(
      statistic?.rank ??
      statistic?.proficiency?.rank ??
      0
    ) >= 1;
  });
}

const TRANSVERSAL_TRAINED_OPTIONS = {
  "identify-magic": [
    ["arcana", "Arcanes"],
    ["nature", "Nature"],
    ["occultism", "Occultisme"],
    ["religion", "Religion"]
  ],
  "learn-a-spell": [
    ["arcana", "Arcanes"],
    ["nature", "Nature"],
    ["occultism", "Occultisme"],
    ["religion", "Religion"]
  ],
  "decipher-writing": [
    ["arcana", "Arcanes"],
    ["occultism", "Occultisme"],
    ["religion", "Religion"],
    ["society", "Société"]
  ]
};

function transversalTrainingState(actor, slug) {
  const choices = TRANSVERSAL_TRAINED_OPTIONS[slug];

  if (choices) {
    const eligible = choices.some(([statistic]) =>
      actorStatisticRank(actor, statistic) >= 1
    );

    return {
      required: true,
      eligible,
      label: choices.map(([, label]) => label).join(", ")
    };
  }

  if (slug === "earn-income") {
    const eligible =
      actorStatisticRank(actor, "crafting") >= 1 ||
      actorStatisticRank(actor, "performance") >= 1 ||
      actorHasTrainedLore(actor);

    return {
      required: true,
      eligible,
      label: "Artisanat, Représentation ou une Connaissance"
    };
  }

  return {
    required: false,
    eligible: true,
    label: ""
  };
}

function conditionState(actor, slug) {
  if (typeof actor?.hasCondition === "function") {
    try {
      return Boolean(actor.hasCondition(slug));
    } catch {
      return null;
    }
  }

  return null;
}

function inventoryItems(actor) {
  if (Array.isArray(actor?.inventory?.contents)) {
    return actor.inventory.contents;
  }

  if (Array.isArray(actor?.items?.contents)) {
    return actor.items.contents;
  }

  if (actor?.items && typeof actor.items[Symbol.iterator] === "function") {
    try {
      return Array.from(actor.items);
    } catch {
      return null;
    }
  }

  return null;
}

function heldItemState(actor) {
  const items = inventoryItems(actor);
  if (!items) return null;

  return items.some(item => {
    const equipped = item?.system?.equipped;
    return equipped?.carryType === "held" &&
      Number(equipped?.handsHeld ?? 0) > 0;
  });
}

function heldShieldState(actor) {
  // PF2e character actors expose heldShield. null means the state is known and
  // no shield is currently wielded.
  if (actor && "heldShield" in actor) {
    return Boolean(actor.heldShield);
  }

  const items = inventoryItems(actor);
  if (!items) return null;

  const shieldItems = items.filter(item => item?.type === "shield");
  if (!shieldItems.length) return false;

  return shieldItems.some(item => {
    const equipped = item?.system?.equipped;
    return equipped?.carryType === "held" &&
      Number(equipped?.handsHeld ?? 0) > 0;
  });
}

function speedState(actor, type) {
  const speed = actor?.system?.attributes?.speed;

  if (!speed) return null;

  const collections = [
    speed.otherSpeeds,
    speed.other
  ];

  for (const collection of collections) {
    if (!Array.isArray(collection)) continue;

    const found = collection.find(entry =>
      String(entry?.type ?? entry?.slug ?? "").toLowerCase() === type
    );

    if (!found) return false;

    const value = Number(found?.value ?? found?.total ?? 0);
    return Number.isFinite(value) ? value > 0 : true;
  }

  // Some PF2e actor versions expose an object map.
  const map =
    actor?.system?.movement?.speeds ??
    actor?.system?.attributes?.speed?.speeds ??
    null;

  if (map && typeof map === "object") {
    if (!(type in map)) return false;

    const entry = map[type];
    const value = Number(
      typeof entry === "object"
        ? entry?.value ?? entry?.total ?? 0
        : entry
    );

    return Number.isFinite(value) ? value > 0 : Boolean(entry);
  }

  return null;
}

function spellcastingState(actor) {
  const itemTypes = actor?.itemTypes;
  if (!itemTypes || typeof itemTypes !== "object") return null;

  const entries = itemTypes.spellcastingEntry;
  const spells = itemTypes.spell;

  if (!Array.isArray(entries) && !Array.isArray(spells)) return null;

  return Boolean(
    (Array.isArray(entries) && entries.length) ||
    (Array.isArray(spells) && spells.length)
  );
}

function addReason(state, reason) {
  state.eligible = false;
  state.reasons.push(reason);
}

export function getActionEligibility(
  actor,
  entry,
  { skillGroup = null } = {}
) {
  const state = {
    eligible: true,
    reasons: [],
    requiresTrained: false,
    rank: null
  };

  // Official GM Screen proficiency matrix.
  if (skillGroup && entry?.kind === "skill") {
    state.requiresTrained = skillActionRequiresTrained(
      skillGroup,
      entry.slug
    );

    state.rank = getActorSkillRank(actor, skillGroup);

    if (
      state.requiresTrained &&
      state.rank !== null &&
      state.rank < 1
    ) {
      addReason(state, `Requiert Qualifié en ${skillGroup}`);
    }
  }

  if (!skillGroup) {
    const transversal = transversalTrainingState(
      actor,
      entry?.slug
    );

    if (transversal.required) {
      state.requiresTrained = true;

      if (!transversal.eligible) {
        addReason(
          state,
          `Requiert Qualifié en ${transversal.label}`
        );
      }
    }
  }

  // From here on, filter only when the character state is known with enough
  // confidence. Contextual requirements that Foundry cannot know (terrain,
  // willing mount, nearby cover, GM permission, etc.) remain visible.

  switch (entry?.slug) {
    case "arrest-a-fall": {
      const hasFlySpeed = speedState(actor, "fly");

      if (hasFlySpeed === false) {
        addReason(state, "Aucune Vitesse de vol");
      }
      break;
    }


    case "raise-a-shield": {
      const hasHeldShield = heldShieldState(actor);

      if (hasHeldShield === false) {
        addReason(state, "Aucun bouclier tenu");
      }
      break;
    }

    case "stand":
    case "crawl": {
      const prone = conditionState(actor, "prone");

      if (prone === false) {
        addReason(state, "Nécessite l’état À terre");
      }
      break;
    }

    case "drop-prone": {
      const prone = conditionState(actor, "prone");

      if (prone === true) {
        addReason(state, "Déjà À terre");
      }
      break;
    }

    case "escape": {
      const grabbed = conditionState(actor, "grabbed");
      const immobilized = conditionState(actor, "immobilized");
      const restrained = conditionState(actor, "restrained");

      if (
        grabbed !== null &&
        immobilized !== null &&
        restrained !== null &&
        !grabbed &&
        !immobilized &&
        !restrained
      ) {
        addReason(
          state,
          "Nécessite Agrippé, Immobilisé ou Entravé"
        );
      }
      break;
    }

    case "cast-a-spell": {
      const canCast = spellcastingState(actor);

      if (canCast === false) {
        addReason(state, "Aucun sort ou lancement de sorts détecté");
      }
      break;
    }

    case "release": {
      const holding = heldItemState(actor);

      if (holding === false) {
        addReason(state, "Aucun objet tenu à Relâcher");
      }
      break;
    }
  }

  return state;
}
