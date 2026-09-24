import { getSingleUserTarget } from "../lib/targets.js";
import { toggleRaiseShield } from "./basic-action-effects.js";

/**
 * Runtime aliases verified against PF2e 8.3.0.
 *
 * Most actions live in the Collection under their canonical slug.
 * A handful only exist as direct compatibility helpers on
 * game.pf2e.actions, and Disable a Device uses a different runtime slug.
 */
const COLLECTION_SLUG_ALIASES = {
  "disable-a-device": "disable-device"
};

const DIRECT_ACTIONS = {
  "craft": {
    key: "craft",
    mode: "options"
  },
  "earn-income": {
    key: "earnIncome",
    mode: "actor"
  },
  "raise-a-shield": {
    key: "raiseAShield",
    mode: "options"
  },
  "repair": {
    key: "repair",
    mode: "options"
  },
  "treat-wounds": {
    key: "treatWounds",
    mode: "options"
  }
};

function camelCaseSlug(slug) {
  const [first, ...rest] = String(slug ?? "").split("-");

  return first + rest
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function resolveRuntimeAction(slug) {
  const registry = game.pf2e?.actions;
  if (!registry || !slug) return null;

  const collectionSlug = COLLECTION_SLUG_ALIASES[slug] ?? slug;
  const collectionAction = registry.get?.(collectionSlug);

  if (collectionAction) {
    return {
      kind: "collection",
      key: collectionSlug,
      value: collectionAction
    };
  }

  const exactDirect = DIRECT_ACTIONS[slug];

  if (exactDirect) {
    const fn = registry[exactDirect.key];

    if (typeof fn === "function") {
      return {
        kind: "function",
        key: exactDirect.key,
        mode: exactDirect.mode,
        value: fn
      };
    }
  }

  // Backward-compatible fallback for the old camelCase API.
  const candidates = [
    slug,
    camelCaseSlug(slug)
  ];

  for (const key of candidates) {
    const value = registry[key];

    if (typeof value === "function") {
      return {
        kind: "function",
        key,
        mode: "options",
        value
      };
    }
  }

  return null;
}

export function getRuntimeVariants(runtime) {
  if (runtime?.kind !== "collection") return [];

  const variants = runtime.value?.variants;
  if (!variants) return [];

  if (Array.isArray(variants)) return variants;
  if (typeof variants.values === "function") {
    return Array.from(variants.values());
  }
  if (typeof variants[Symbol.iterator] === "function") {
    return Array.from(variants);
  }

  return [];
}

export function hasRuntimeAction(slug) {
  return Boolean(resolveRuntimeAction(slug));
}

/**
 * Invoke PF2e's native automation.
 *
 * Collection actions use the modern Action.use(options) API.
 * Compatibility helpers use their real PF2e 8.3.0 signatures:
 * - most receive an options object;
 * - Earn Income receives the actor directly.
 *
 * For collection actions we also provide the single Foundry target, when one
 * exists. PF2e's ActionVariant.use explicitly accepts options.target.
 */
export async function useRuntimeAction(
  actor,
  slug,
  event,
  {
    variant = null,
    statistic = null,
    skill = null,
    difficultyClass = null
  } = {}
) {
  if (slug === "raise-a-shield") {
    return toggleRaiseShield(actor);
  }

  const runtime = resolveRuntimeAction(slug);

  if (!runtime) {
    return {
      ok: false,
      reason: "missing"
    };
  }

  const selectedTarget = getSingleUserTarget();

  if (runtime.kind === "collection") {
    const action = runtime.value;

    if (typeof action?.use !== "function") {
      return {
        ok: false,
        reason: "not-usable"
      };
    }

    const options = {
      actors: [actor],
      event
    };

    if (selectedTarget) options.target = selectedTarget;
    if (variant) options.variant = variant;
    if (difficultyClass != null) {
      options.difficultyClass = difficultyClass;
    }

    // Modern Action.use() consumes "statistic".
    // Keep "skill" only as a fallback for specialized/legacy bridges.
    if (statistic) options.statistic = statistic;
    if (skill) options.skill = skill;

    const rawResults = await action.use(options);
    const results = Array.isArray(rawResults)
      ? rawResults
      : rawResults
        ? [rawResults]
        : [];

    return {
      ok: true,
      runtime,
      results
    };
  }

  if (runtime.kind === "function") {
    if (runtime.mode === "actor") {
      await runtime.value(actor);

      return {
        ok: true,
        runtime
      };
    }

    const results = [];
    const options = {
      actors: [actor],
      event,
      callback: result => results.push(result)
    };

    if (selectedTarget) options.target = selectedTarget;
    if (variant) options.variant = variant;

    // Legacy PF2e helpers use "skill", not "statistic".
    const selectedStatistic = skill ?? statistic;
    if (selectedStatistic) options.skill = selectedStatistic;

    await runtime.value(options);

    return {
      ok: true,
      runtime,
      results
    };
  }

  return {
    ok: false,
    reason: "unsupported"
  };
}
