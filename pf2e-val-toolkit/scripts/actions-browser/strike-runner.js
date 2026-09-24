import { getSingleUserTarget } from "../lib/targets.js";
import { recordActionUse } from "./action-events.js";

function actorStrikes(actor) {
  const actions = actor?.system?.actions;

  if (!Array.isArray(actions)) return [];

  return actions.filter(action =>
    action?.type === "strike" &&
    Array.isArray(action?.variants) &&
    action.variants.length > 0 &&
    action?.item
  );
}

function strikeOptions(strike) {
  return new Set(
    Array.isArray(strike?.options)
      ? strike.options
      : []
  );
}

function itemTraits(strike) {
  const raw =
    strike?.item?.system?.traits?.value ??
    strike?.item?.traits ??
    [];

  if (raw instanceof Set) return raw;
  return new Set(Array.isArray(raw) ? raw : []);
}

function isMeleeStrike(strike) {
  const options = strikeOptions(strike);

  if (options.has("item:melee")) return true;

  const item = strike?.item;

  if (typeof item?.isMelee === "boolean") {
    return item.isMelee;
  }

  if (typeof item?.isMelee === "function") {
    try {
      return Boolean(item.isMelee());
    } catch {}
  }

  // PF2e weapon items with no range are melee in their primary usage.
  return !item?.system?.range;
}

export function isPreciseStrikeEligible(strike) {
  if (!strike) return false;

  const options = strikeOptions(strike);
  const traits = itemTraits(strike);

  const agileOrFinesse =
    options.has("item:trait:agile") ||
    options.has("item:trait:finesse") ||
    traits.has("agile") ||
    traits.has("finesse");

  return isMeleeStrike(strike) && agileOrFinesse;
}

function displayStrikeName(strike) {
  return (
    strike?.label ??
    strike?.item?.name ??
    "Frappe"
  );
}

export function getStrikeChoices(actor) {
  return actorStrikes(actor)
    .map((strike, index) => ({
      index,
      strike,
      label: displayStrikeName(strike),
      eligibleForPreciseStrike:
        isPreciseStrikeEligible(strike)
    }));
}

function mapLabel(variant, index) {
  if (variant?.label) return variant.label;

  return [
    "Première attaque",
    "Deuxième attaque",
    "Troisième attaque"
  ][index] ?? `Attaque ${index + 1}`;
}

export function getMapChoices(strikeChoice) {
  return strikeChoice.strike.variants.map(
    (variant, index) => ({
      index,
      label: mapLabel(variant, index),
      penalty:
        Number.isFinite(Number(variant?.penalty))
          ? Number(variant.penalty)
          : null
    })
  );
}

async function rollStrikeVariant(
  variant,
  event
) {
  if (typeof variant?.roll !== "function") {
    return null;
  }

  const target = getSingleUserTarget();

  // Foundry v14 / PF2e modern StrikeData accepts one params object.
  // Keep a compatibility fallback for older exposed strike functions.
  if (variant.roll.length >= 2) {
    return variant.roll(event, []);
  }

  return variant.roll({
    event,
    target,
    options: []
  });
}

export async function executeStrike(
  actor,
  entry,
  {
    strikeIndex,
    mapIndex = 0,
    event = null
  }
) {
  const choices = getStrikeChoices(actor);

  const choice = choices.find(
    candidate =>
      candidate.index === strikeIndex
  );

  if (!choice) {
    ui.notifications.warn(
      "Aucune Frappe disponible n’a été trouvée."
    );

    return {
      ok: false,
      reason: "strike-missing"
    };
  }

  const variant =
    choice.strike.variants[mapIndex] ??
    choice.strike.variants[0];

  const roll = await rollStrikeVariant(
    variant,
    event
  );

  if (!roll) {
    return {
      ok: false,
      reason: "roll-cancelled"
    };
  }

  recordActionUse(actor, entry, {
    mode: "strike",
    detail: {
      weapon: choice.label,
      mapIndex
    }
  });

  return {
    ok: true,
    roll,
    choice,
    variant
  };
}
