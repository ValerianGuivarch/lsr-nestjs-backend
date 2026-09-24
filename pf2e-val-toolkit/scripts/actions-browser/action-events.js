/**
 * Common action-use event.
 *
 * v0.19 does not display an action counter yet. This hook is deliberately
 * introduced now so the future optional combat counter can observe every
 * Toolkit action without rewriting each action implementation.
 */
export function recordActionUse(actor, entry, {
  mode = "unknown",
  detail = null
} = {}) {
  const payload = {
    actor,
    actorUuid: actor?.uuid ?? null,
    slug: entry?.slug ?? null,
    name: entry?.frenchName ?? entry?.name ?? null,
    actionCost: entry?.actionCost ?? "",
    mode,
    detail,
    combatId: game.combat?.id ?? null,
    combatantId:
      game.combat?.combatant?.actor?.id === actor?.id
        ? game.combat.combatant.id
        : null,
    timestamp: Date.now()
  };

  Hooks.callAll("pf2eValToolkit.actionUsed", payload);

  return payload;
}
