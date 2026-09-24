import {
  findEffectsWithTokenMark,
  isEffectWithTokenMark,
  preparePatchedEffectSource
} from "../lib/effects.js";
import {
  getSingleUserTarget,
  getTargetName,
  getTargetUuid
} from "../lib/targets.js";

const PATCH_ID = "hunt-prey";
const TOKEN_MARK_SLUG = "hunted-prey";

/**
 * Identify the *effect* used by Hunt Prey through its native TokenMark rule.
 *
 * We intentionally do not match the French/English item name and do not edit
 * the PF2e action or its compendium entry.
 */
function isHuntPreyEffect(item) {
  return isEffectWithTokenMark(item, TOKEN_MARK_SLUG);
}

function buildTargetMetadata(userId) {
  const target = getSingleUserTarget(userId);
  if (!target) return null;

  return {
    targetUuid: getTargetUuid(target),
    targetName: getTargetName(target)
  };
}

function displayName(targetName) {
  return `🎯 Proie : ${targetName}`;
}

/**
 * Rename the native effect *before* it is committed to the actor whenever the
 * player already has exactly one target selected.
 *
 * The TokenMark Rule Element itself is left untouched.
 */
function onPreCreateItem(item, _data, _options, userId) {
  if (!isHuntPreyEffect(item)) return;

  const target = buildTargetMetadata(userId);
  if (!target) return;

  preparePatchedEffectSource(
    item,
    PATCH_ID,
    {
      tokenMarkSlug: TOKEN_MARK_SLUG,
      ...target
    },
    {
      name: displayName(target.targetName)
    }
  );
}

/**
 * PF2e currently allows two Hunt Prey effects to remain on the ranger.
 * Once the new native effect exists, remove every older effect carrying the
 * same native TokenMark slug.
 *
 * createItem fires on every client, so only the user who initiated the create
 * performs document updates/deletions.
 */
async function onCreateItem(item, _options, userId) {
  if (!isHuntPreyEffect(item)) return;
  if (userId !== game.user?.id) return;

  const actor = item.actor ?? item.parent;
  if (!actor || actor.documentName !== "Actor") return;

  // If preCreate could not name the effect (for example because the target was
  // selected during PF2e's TokenMark prompt), try once more after creation.
  const target = buildTargetMetadata(userId);
  if (target && item.name !== displayName(target.targetName)) {
    await item.update({
      name: displayName(target.targetName),
      [`flags.pf2e-val-toolkit.patches.${PATCH_ID}`]: {
        tokenMarkSlug: TOKEN_MARK_SLUG,
        ...target
      }
    });
  }

  const oldEffects = findEffectsWithTokenMark(actor, TOKEN_MARK_SLUG)
    .filter(effect => effect.id !== item.id);

  if (!oldEffects.length) return;

  await actor.deleteEmbeddedDocuments(
    "Item",
    oldEffects.map(effect => effect.id)
  );
}

/**
 * Utility for manual cleanup/debugging and for future migrations.
 */
async function cleanupActor(actor, keepId = null) {
  const effects = findEffectsWithTokenMark(actor, TOKEN_MARK_SLUG);
  if (effects.length <= 1) return effects[0] ?? null;

  const keep =
    effects.find(effect => effect.id === keepId) ??
    effects.at(-1);

  const remove = effects.filter(effect => effect.id !== keep?.id);
  if (remove.length) {
    await actor.deleteEmbeddedDocuments(
      "Item",
      remove.map(effect => effect.id)
    );
  }

  return keep ?? null;
}

export const huntPreyPatch = {
  id: PATCH_ID,
  label: "Chasser une proie / Hunt Prey",
  enabled: true,

  init() {
    Hooks.on("preCreateItem", onPreCreateItem);
    Hooks.on("createItem", onCreateItem);

    return {
      cleanupActor,
      tokenMarkSlug: TOKEN_MARK_SLUG
    };
  }
};
