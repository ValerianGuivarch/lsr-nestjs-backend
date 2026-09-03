/**
 * PF2e TokenMark helpers.
 *
 * These helpers deliberately inspect Rule Element data instead of relying on
 * translated item names. This keeps patches stable across languages.
 */

export function getRuleSources(itemOrSource) {
  const rules =
    itemOrSource?.system?.rules ??
    itemOrSource?._source?.system?.rules ??
    [];

  return Array.isArray(rules) ? rules : [];
}

export function getTokenMarkRules(itemOrSource) {
  return getRuleSources(itemOrSource).filter(
    rule => rule?.key === "TokenMark" && typeof rule?.slug === "string"
  );
}

export function hasTokenMark(itemOrSource, slug) {
  return getTokenMarkRules(itemOrSource).some(rule => rule.slug === slug);
}
