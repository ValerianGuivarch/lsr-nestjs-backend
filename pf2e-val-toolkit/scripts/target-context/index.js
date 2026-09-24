const contextBindings = new Map();
let refreshTimer = null;

function conditionSlug(item) {
  return item?.slug ?? item?.system?.slug ?? "";
}

function getOriginToken(actor) {
  if (!canvas?.ready || !actor) return null;

  return (
    canvas.tokens?.controlled?.find(token => token.actor?.uuid === actor.uuid) ??
    canvas.tokens?.placeables?.find(token => token.actor?.uuid === actor.uuid) ??
    null
  );
}

function activeCondition(actor, slug) {
  const matches = actor?.conditions?.bySlug?.(slug, { active: true });
  if (Array.isArray(matches)) return matches.length > 0;
  if (matches && typeof matches.size === "number") return matches.size > 0;

  const active = actor?.conditions?.active;
  return Array.from(active ?? []).some(condition => conditionSlug(condition) === slug && condition.active !== false);
}

function targetCanBeOffGuardFromFlanking(target, origin) {
  if (!target || !origin) return false;
  if (target.isOfType?.("creature") === false) return false;

  const attributes = target.attributes;
  const flanking = attributes?.flanking;
  if (!flanking?.flankable) return false;

  const offGuardable = typeof flanking.offGuardable === "number"
    ? Number(origin.level ?? 0) > flanking.offGuardable
    : Boolean(flanking.offGuardable);

  if (!offGuardable) return false;

  try {
    const rollOptions = [
      "item:type:condition",
      "item:slug:off-guard",
      ...(origin.getSelfRollOptions?.("origin") ?? [])
    ];

    const immune = (attributes?.immunities ?? []).some(immunity => immunity?.test?.(rollOptions));
    return !immune;
  } catch (_error) {
    // If a future PF2e version changes the immunity API, remain conservative:
    // do not announce an Off-Guard result we cannot validate.
    return false;
  }
}

function strikeFlankingDetails(actor, originToken, targetToken) {
  if (!originToken?.isFlanking || !actor?.getReach) return [];
  if (!targetCanBeOffGuardFromFlanking(targetToken.actor, actor)) return [];

  const actions = Array.from(actor.system?.actions ?? []);
  const results = [];

  for (const action of actions) {
    if (action?.type !== "strike" || action?.ready === false) continue;

    const item = action.item ?? action.weapon ?? null;
    if (!item?.isMelee) continue;

    let reach = null;
    try {
      reach = actor.getReach({ action: "attack", weapon: item });
    } catch (_error) {
      continue;
    }

    if (typeof reach !== "number") continue;

    try {
      if (originToken.isFlanking(targetToken, { reach })) {
        results.push({ name: item.name ?? action.label ?? "Attaque de mêlée", reach });
      }
    } catch (_error) {
      // Ignore one strike if PF2e cannot evaluate it in the current scene.
    }
  }

  return results;
}

function tokenMarks(actor, targetToken) {
  const map = actor?.synthetics?.tokenMarks;
  const uuid = targetToken?.document?.uuid;
  if (!map?.get || !uuid) return [];

  return Array.from(map.get(uuid) ?? []);
}

function markLabel(slug) {
  const labels = {
    "hunted-prey": "Proie chassée (Hunt Prey)",
    "hunted-prey-outwit": "Proie chassée — Outwit"
  };
  return labels[slug] ?? slug;
}

function distanceBetween(originToken, targetToken) {
  try {
    const distance = originToken?.distanceTo?.(targetToken);
    return Number.isFinite(distance) ? distance : null;
  } catch (_error) {
    return null;
  }
}

function renderLine(icon, label, value, className = "") {
  return `
    <div class="pf2e-val-target-context-line ${className}">
      <i class="${icon}"></i>
      <span class="pf2e-val-target-context-label">${foundry.utils.escapeHTML(label)}</span>
      <span class="pf2e-val-target-context-value">${foundry.utils.escapeHTML(value)}</span>
    </div>
  `;
}

export function renderTargetContext(actor, container) {
  if (!container?.isConnected && !container?.ownerDocument) return;

  const originToken = getOriginToken(actor);
  const targets = Array.from(game.user?.targets ?? []);

  if (!originToken) {
    container.innerHTML = `
      <div class="pf2e-val-target-context-empty">
        Placez ou sélectionnez le token de ${foundry.utils.escapeHTML(actor?.name ?? "ce personnage")} sur la scène.
      </div>
    `;
    return;
  }

  if (targets.length !== 1) {
    container.innerHTML = `
      <div class="pf2e-val-target-context-empty">
        Ciblez exactement une créature pour afficher le contexte calculable sans lancer de jet.
      </div>
    `;
    return;
  }

  const targetToken = targets[0];
  const targetActor = targetToken.actor;
  if (!targetActor) return;

  const lines = [];
  const distance = distanceBetween(originToken, targetToken);
  const units = canvas.scene?.grid?.units || "";

  if (distance !== null) {
    lines.push(renderLine(
      "fa-solid fa-ruler",
      "Distance",
      `${distance}${units ? ` ${units}` : ""}`
    ));
  }

  const explicitOffGuard = activeCondition(targetActor, "off-guard");
  lines.push(renderLine(
    "fa-solid fa-shield-halved",
    "Dépourvu explicite",
    explicitOffGuard ? "Oui — condition active" : "Non",
    explicitOffGuard ? "is-positive" : ""
  ));

  const flankStrikes = strikeFlankingDetails(actor, originToken, targetToken);
  if (flankStrikes.length) {
    const names = flankStrikes.map(entry => entry.name).join(", ");
    lines.push(renderLine(
      "fa-solid fa-people-arrows-left-right",
      "Prise en tenaille",
      `Oui → Dépourvu pour : ${names}`,
      "is-positive"
    ));
  } else {
    lines.push(renderLine(
      "fa-solid fa-people-arrows-left-right",
      "Prise en tenaille",
      "Non détectée pour les frappes de mêlée prêtes"
    ));
  }

  const marks = tokenMarks(actor, targetToken);
  if (marks.length) {
    lines.push(renderLine(
      "fa-solid fa-bullseye",
      "Marques PF2e",
      marks.map(markLabel).join(", "),
      "is-positive"
    ));
  }

  container.innerHTML = `
    <div class="pf2e-val-target-context-target">
      <i class="fa-solid fa-crosshairs"></i>
      Contre <strong>${foundry.utils.escapeHTML(targetToken.name ?? targetActor.name)}</strong>
    </div>
    ${lines.join("")}
    <div class="pf2e-val-target-context-note">
      Aperçu volontairement limité : condition Dépourvu, prise en tenaille calculée avec le moteur PF2e, marques et distance.
      L'absence d'une ligne ne signifie pas qu'aucun autre modificateur contextuel ne s'appliquera au prochain jet.
    </div>
  `;
}

export function bindTargetContext(container, actor) {
  if (!container || !actor) return;
  contextBindings.set(container, actor);
  renderTargetContext(actor, container);
}

function refreshBoundContexts() {
  for (const [container, actor] of contextBindings.entries()) {
    if (!container.isConnected) {
      contextBindings.delete(container);
      continue;
    }
    renderTargetContext(actor, container);
  }
}

function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(refreshBoundContexts, 50);
}

export function initTargetContext() {
  Hooks.on("targetToken", scheduleRefresh);
  Hooks.on("controlToken", scheduleRefresh);
  Hooks.on("updateToken", scheduleRefresh);
  Hooks.on("createItem", scheduleRefresh);
  Hooks.on("deleteItem", scheduleRefresh);
  Hooks.on("updateItem", scheduleRefresh);
  Hooks.on("combatTurn", scheduleRefresh);
  Hooks.on("combatRound", scheduleRefresh);

  game.pf2eValToolkit ??= {};
  game.pf2eValToolkit.targetContext = {
    refresh: refreshBoundContexts
  };
}
