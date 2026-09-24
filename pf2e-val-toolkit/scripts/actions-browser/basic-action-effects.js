const RAISE_SHIELD_EFFECT_UUID =
  "Compendium.pf2e.equipment-effects.Item.2YgXoHvJfrDHucMr";

const COVER_EFFECT_UUID =
  "Compendium.pf2e.other-effects.Item.I9lfZUiCwMiGogVi";

function effectItems(actor) {
  return Array.isArray(actor?.itemTypes?.effect)
    ? actor.itemTypes.effect
    : [];
}

function sourceId(item) {
  return (
    item?.sourceId ??
    foundry.utils.getProperty(item, "_stats.compendiumSource") ??
    foundry.utils.getProperty(item, "flags.core.sourceId") ??
    null
  );
}

async function createEffect(actor, uuid, mutate = null) {
  const effect = await fromUuid(uuid);

  if (!effect) {
    throw new Error(`Effet PF2e introuvable : ${uuid}`);
  }

  const source = effect.toObject();

  if (typeof mutate === "function") {
    mutate(source);
  }

  const [created] = await actor.createEmbeddedDocuments(
    "Item",
    [source]
  );

  return created ?? null;
}

export async function toggleRaiseShield(actor) {
  const existing = effectItems(actor).find(effect =>
    effect.slug === "effect-raise-a-shield" ||
    sourceId(effect) === RAISE_SHIELD_EFFECT_UUID
  );

  if (existing) {
    await existing.delete();
    return {
      ok: true,
      removed: true
    };
  }

  const shield = actor?.heldShield ?? null;

  if (!shield) {
    ui.notifications.warn(
      "Aucun bouclier manié n’a été détecté."
    );
    return {
      ok: false,
      reason: "no-shield"
    };
  }

  if (shield.isDestroyed) {
    ui.notifications.warn("Ce bouclier est détruit.");
    return {
      ok: false,
      reason: "destroyed"
    };
  }

  if (shield.isBroken) {
    ui.notifications.warn("Ce bouclier est brisé.");
    return {
      ok: false,
      reason: "broken"
    };
  }

  await createEffect(
    actor,
    RAISE_SHIELD_EFFECT_UUID
  );

  return {
    ok: true,
    removed: false
  };
}

const COVER_SELECTIONS = {
  standard: {
    bonus: 2,
    level: "standard"
  },
  greater: {
    bonus: 4,
    level: "greater"
  },
  "greater-prone": {
    bonus: 4,
    level: "greater-prone"
  }
};

export async function applyCoverEffect(actor, selection) {
  const value = COVER_SELECTIONS[selection];

  if (!value) {
    return {
      ok: false,
      reason: "invalid-selection"
    };
  }

  const existing = effectItems(actor).filter(effect =>
    effect.slug === "effect-cover" ||
    sourceId(effect) === COVER_EFFECT_UUID
  );

  if (existing.length) {
    await actor.deleteEmbeddedDocuments(
      "Item",
      existing.map(effect => effect.id)
    );
  }

  await createEffect(
    actor,
    COVER_EFFECT_UUID,
    source => {
      // PF2e versions have used both of these flag roots. Pre-seeding both
      // prevents the native ChoiceSet from asking after the effect is applied.
      foundry.utils.setProperty(
        source,
        "flags.pf2e.rulesSelections.cover",
        foundry.utils.deepClone(value)
      );

      foundry.utils.setProperty(
        source,
        "flags.system.rulesSelections.cover",
        foundry.utils.deepClone(value)
      );
    }
  );

  return {
    ok: true,
    selection,
    value
  };
}
