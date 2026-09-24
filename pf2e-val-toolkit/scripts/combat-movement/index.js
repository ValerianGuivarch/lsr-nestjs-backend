const BUTTON_CLASS = "pf2e-val-end-movement";
const ROW_CLASS = "pf2e-val-end-movement-row";
const CONTROLS_CLASS = "pf2e-val-combat-controls";

function getRoot(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

function getCurrentCombatant() {
  return game.combat?.combatant ?? null;
}

function canResetMovement(combatant) {
  if (!combatant) return false;
  if (game.user?.isGM) return true;
  return Boolean(combatant.actor?.isOwner);
}

async function clearCurrentMovement() {
  const combatant = getCurrentCombatant();

  if (!combatant) {
    ui.notifications.warn("Aucun combattant n'a actuellement le tour.");
    return;
  }

  if (!canResetMovement(combatant)) {
    ui.notifications.warn("Vous ne pouvez pas terminer le déplacement de ce combattant.");
    return;
  }

  const tokenDocument =
    combatant.token ??
    canvas.tokens?.get(combatant.tokenId)?.document ??
    null;

  if (!tokenDocument?.clearMovementHistory) {
    ui.notifications.error("Impossible de trouver l'historique de déplacement du token.");
    return;
  }

  await tokenDocument.clearMovementHistory();
  ui.notifications.info(`Déplacement terminé : ${combatant.name}.`);
}

function makeButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.classList.add(BUTTON_CLASS);
  button.dataset.tooltip = "Terminer le déplacement";
  button.title = "Terminer le déplacement";
  button.innerHTML =
    '<i class="fa-solid fa-shoe-prints"></i><span>Terminer le déplacement</span>';

  button.addEventListener("click", async event => {
    event.preventDefault();
    event.stopPropagation();

    button.disabled = true;
    try {
      await clearCurrentMovement();
    } catch (error) {
      console.error("PF2e Val Toolkit | Erreur lors de la fin du déplacement", error);
      ui.notifications.error("Impossible de terminer le déplacement.");
    } finally {
      button.disabled = false;
    }
  });

  return button;
}

function makeRow() {
  const row = document.createElement("div");
  row.classList.add(ROW_CLASS);
  row.append(makeButton());
  return row;
}

function findControlsContainer(root, endTurn) {
  // Prefer a semantic Foundry container when available.
  const semantic =
    endTurn.closest(".combat-controls") ??
    endTurn.closest(".encounter-controls");

  if (semantic) return semantic;

  // In Foundry V14 the whole bottom control bar is usually the nearest
  // parent containing the previous/next/end-turn actions.
  let node = endTurn.parentElement;
  while (node && node !== root) {
    const buttonCount = node.querySelectorAll("button, [data-action]").length;
    const hasPrev =
      node.querySelector('[data-action="previousTurn"]') ??
      node.querySelector('[data-action="prevTurn"]');
    const hasNext =
      node.querySelector('[data-action="nextTurn"]') ??
      node.querySelector('[data-action="endTurn"]');

    if (buttonCount >= 2 && (hasPrev || hasNext)) return node;
    node = node.parentElement;
  }

  return endTurn.parentElement;
}

function cleanup(root) {
  root.querySelectorAll(`.${ROW_CLASS}`).forEach(node => node.remove());
  root.querySelectorAll(`.${CONTROLS_CLASS}`).forEach(node =>
    node.classList.remove(CONTROLS_CLASS)
  );
}

function injectButton(_app, html) {
  const root = getRoot(html);
  if (!root) return;

  cleanup(root);

  const combatant = getCurrentCombatant();
  if (!combatant || !canResetMovement(combatant)) return;

  const endTurn =
    root.querySelector('[data-action="nextTurn"]') ??
    root.querySelector('[data-action="endTurn"]');

  if (!endTurn) return;

  const controls = findControlsContainer(root, endTurn);
  if (!controls) return;

  controls.classList.add(CONTROLS_CLASS);

  // The movement button becomes the first item of the native controls.
  // CSS makes it take a complete row, while Foundry's buttons stay below.
  controls.insertAdjacentElement("afterbegin", makeRow());
}

export function initCombatMovement() {
  Hooks.on("renderCombatTracker", injectButton);

  game.pf2eValToolkit ??= {};
  game.pf2eValToolkit.endMovement = clearCurrentMovement;
}
