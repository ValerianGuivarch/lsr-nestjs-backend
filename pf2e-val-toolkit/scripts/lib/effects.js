import { hasTokenMark } from "./token-marks.js";

export const TOOLKIT_FLAG_SCOPE = "pf2e-val-toolkit";

export function getCompendiumSource(document) {
  return (
    document?._stats?.compendiumSource ??
    document?._source?._stats?.compendiumSource ??
    null
  );
}

export function isEffectWithTokenMark(item, slug) {
  return item?.type === "effect" && hasTokenMark(item, slug);
}

export function findEffectsWithTokenMark(actor, slug) {
  if (!actor?.items) return [];
  return actor.items.filter(item => isEffectWithTokenMark(item, slug));
}

export function patchFlagPath(patchId) {
  return `flags.${TOOLKIT_FLAG_SCOPE}.patches.${patchId}`;
}

export function readPatchFlag(document, patchId) {
  return foundry.utils.getProperty(
    document,
    `flags.${TOOLKIT_FLAG_SCOPE}.patches.${patchId}`
  );
}

/**
 * Apply source data before a document is created.
 * updateSource is intentionally used: no world/compendium document is edited
 * outside the embedded item currently being created.
 */
export function preparePatchedEffectSource(item, patchId, patchData, updates = {}) {
  const flags = foundry.utils.deepClone(item?._source?.flags ?? {});
  foundry.utils.setProperty(
    flags,
    `${TOOLKIT_FLAG_SCOPE}.patches.${patchId}`,
    patchData
  );

  item.updateSource({
    ...updates,
    flags
  });
}
