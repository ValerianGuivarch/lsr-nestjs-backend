/**
 * One-click character ↔ personal/group stash transfers in the Lodge.
 *
 * No world-specific migration runs when the module loads: Actors and scene
 * live in Foundry. Transfers use PF2e's native transferItemToActor so it
 * handles stack merging, loot permissions and GM-supervised transfers.
 */
const MODULE = "pf2e-val-toolkit";
const DEFAULT_SCENE = "lagY36CCwnaTzDag";
const DEFAULT_GROUP_CHEST = "4UYT39KUmloEM6mt";
const ACTION = "pf2e-val-stash-action";

function setting(name, fallback) {
  try { return game.settings.get(MODULE, name) || fallback; }
  catch { return fallback; }
}

function normalizeName(name) {
  return String(name ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim().toLocaleLowerCase("fr").replace(/\s+/g, " ");
}

function actorList() {
  return game.actors?.contents ?? [];
}

function actorById(id) {
  return actorList().find(a => a.id === id || a.uuid === id) ?? null;
}

function configuredBindings() {
  try {
    const parsed = JSON.parse(setting("lodgePersonalChestLinks", "{}"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    console.warn("PF2e Val Toolkit | Association des coffres : JSON invalide.");
    return {};
  }
}

export function isLodgeScene() {
  const sceneId = setting("lodgeSceneId", DEFAULT_SCENE);
  return Boolean(sceneId && globalThis.canvas?.scene?.id === sceneId);
}

function isStash(actor) {
  return actor?.type === "loot" && actor.system?.lootSheetType === "Loot";
}

function baseCharacterName(actor) {
  return normalizeName(actor?.name?.replace(/\s+\([^()]+\)\s*$/, ""));
}

/**
 * Future actors resolve automatically if the chest is named "Coffre de X"
 * for character "X (Joueur)". A GM can override any ambiguous name through
 * the world setting lodgePersonalChestLinks: { "<characterId>": "<chestId>" }.
 * Multiple matches fail closed; never send items into an arbitrary chest.
 */
export function personalChestFor(character) {
  if (character?.type !== "character") return null;

  const links = configuredBindings();
  const explicit = links[character.id] ?? links[character.uuid] ??
    character.getFlag?.(MODULE, "personalChestActorId");
  if (explicit) {
    const chest = actorById(String(explicit));
    return isStash(chest) ? chest : null;
  }

  const expected = "coffre de " + baseCharacterName(character);
  const candidates = actorList().filter(a =>
    isStash(a) && normalizeName(a.name) === expected
  );
  return candidates.length === 1 ? candidates[0] : null;
}

export function groupChest() {
  const id = setting("lodgeGroupChestId", DEFAULT_GROUP_CHEST);
  const configured = actorById(id);
  if (isStash(configured)) return configured;
  const candidates = actorList().filter(a => isStash(a) && normalizeName(a.name) === "coffre du groupe");
  return candidates.length === 1 ? candidates[0] : null;
}

export function personalChestCharacter(chest) {
  if (!isStash(chest)) return null;
  const characters = actorList().filter(a => a.type === "character" && personalChestFor(a)?.id === chest.id);
  return characters.length === 1 ? characters[0] : null;
}

function activeCharacterFor(user = game.user) {
  const character = user?.character;
  return character?.type === "character" ? character : null;
}

/**
 * Permissions are checked again on click, not just when the sheet renders.
 * For non-GM players, only the user-assigned character can use the buttons.
 */
export function canOperateCharacter(character, user = game.user) {
  if (character?.type !== "character" || !user) return false;
  if (user.isGM) return true;
  return activeCharacterFor(user)?.id === character.id &&
    character.testUserPermission?.(user, "OWNER") === true;
}

function canUseStash(stash, user = game.user) {
  return isStash(stash) &&
    (user?.isGM || stash.testUserPermission?.(user, "OBSERVER") === true);
}

export function transferContext(actor, direction, destination) {
  if (!isLodgeScene()) return null;

  if (actor?.type === "character") {
    if (!canOperateCharacter(actor)) return null;
    const chest = direction === "personal" ? personalChestFor(actor) : groupChest();
    if (!canUseStash(chest)) return null;
    return { source: actor, destination: chest };
  }

  if (isStash(actor) && direction === "withdraw") {
    const isGroup = groupChest()?.id === actor.id;
    const character = isGroup ? activeCharacterFor() : personalChestCharacter(actor);
    if (!character || !canOperateCharacter(character) || !canUseStash(actor)) return null;
    return { source: actor, destination: character };
  }

  return null;
}

export async function transferStashItem(actor, itemId, direction, options = {}) {
  const context = transferContext(actor, direction);
  if (!context || !context.destination || context.source.id === context.destination.id) {
    throw new Error("Ce transfert n'est pas autorisé pour le personnage actif ou cette scène.");
  }

  const item = context.source.items?.get?.(itemId);
  if (!item?.isOfType?.("physical")) throw new Error("Objet physique introuvable.");
  const available = Number(item.quantity ?? item.system?.quantity);
  if (!Number.isSafeInteger(available) || available < 1) throw new Error("Plus aucune unité disponible.");
  if (item.isOfType?.("backpack") && Number(item.contents?.size || 0) > 0) {
    throw new Error("Videz d'abord ce contenant avant de le déplacer.");
  }
  if (typeof context.source.transferItemToActor !== "function") {
    throw new Error("La fonction native de transfert PF2e est indisponible.");
  }

  // Click sends the full stack; Shift+click sends one unit.
  const quantity = options.one ? 1 : available;
  await context.source.transferItemToActor(
    context.destination, item, quantity, undefined, false, false
  );
  return { quantity, source: context.source.id, destination: context.destination.id };
}

function asElement(html, app) {
  const candidate = html?.querySelectorAll ? html : html?.[0] ?? app?.element;
  return candidate?.querySelectorAll ? candidate : null;
}

function button(label, icon, direction, actor, itemId, root) {
  const element = root.ownerDocument.createElement("button");
  element.type = "button";
  element.className = ACTION;
  element.dataset.stashDirection = direction;
  element.dataset.stashItemId = itemId;
  element.title = label;
  element.setAttribute("aria-label", label);
  const symbol = root.ownerDocument.createElement("i");
  symbol.className = "fa-solid fa-fw " + icon;
  symbol.setAttribute("aria-hidden", "true");
  element.append(symbol);

  const activate = async event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    if (element.disabled) return;
    element.disabled = true;
    try {
      await transferStashItem(actor, itemId, direction, { one: event.shiftKey === true });
    } catch (error) {
      console.warn("PF2e Val Toolkit | Transfert de coffre", error);
      ui.notifications.error(error instanceof Error ? error.message : "Transfert du coffre impossible.");
    } finally {
      element.disabled = false;
    }
  };
  element.addEventListener("click", activate);
  return element;
}

export function injectStashButtons(app, html) {
  const actor = app?.actor ?? app?.document ?? app?.object;
  const root = asElement(html, app);
  if (!root) return 0;

  // Clean up buttons on an existing sheet if scene/user/ownership changed.
  for (const control of root.querySelectorAll("." + ACTION)) control.remove();
  for (const host of root.querySelectorAll(".pf2e-val-stash-controls")) {
    host.classList.remove("pf2e-val-stash-controls");
    delete host.dataset.stashCount;
  }
  if (!isLodgeScene() || !actor) return 0;

  const directions = actor.type === "character"
    ? ["personal", "group"]
    : isStash(actor) ? ["withdraw"] : [];
  const allowed = directions.filter(d => Boolean(transferContext(actor, d)));
  if (!allowed.length) return 0;

  let total = 0;
  for (const row of root.querySelectorAll(".inventory-list li[data-item-id]")) {
    const itemId = row.dataset.itemId;
    const item = actor.items?.get?.(itemId);
    if (!item?.isOfType?.("physical")) continue;
    const controls = row.querySelector(":scope > .data > .item-controls");
    if (!controls) continue;
    controls.classList.add("pf2e-val-stash-controls");
    controls.dataset.stashCount = String(allowed.length);
    const nativeFirstControl = controls.firstChild;

    for (const direction of allowed) {
      const label = direction === "personal"
        ? "Envoyer dans mon coffre personnel (Maj : 1 unité)"
        : direction === "group"
          ? "Envoyer dans le coffre du groupe (Maj : 1 unité)"
          : "Récupérer dans mon inventaire (Maj : 1 unité)";
      const icon = direction === "personal" ? "fa-box"
        : direction === "group" ? "fa-boxes-stacked" : "fa-hand-holding";
      // Preserve personal then group order, before native Equip/Edit/Delete.
      controls.insertBefore(button(label, icon, direction, actor, itemId, root), nativeFirstControl);
      total++;
    }
  }
  return total;
}

export function registerLodgeStashSettings() {
  game.settings.register(MODULE, "lodgeSceneId", {
    name: "Coffres : identifiant de la scène Loge",
    hint: "ID de la scène autorisant les transferts des coffres.",
    scope: "world", config: true, type: String, default: DEFAULT_SCENE,
    restricted: true,
  });
  game.settings.register(MODULE, "lodgeGroupChestId", {
    name: "Coffres : identifiant du coffre du groupe",
    hint: "ID de l'Actor Coffre du groupe.",
    scope: "world", config: true, type: String, default: DEFAULT_GROUP_CHEST,
    restricted: true,
  });
  game.settings.register(MODULE, "lodgePersonalChestLinks", {
    name: "Coffres : associations manuelles (JSON)",
    hint: 'Facultatif. Exemple : {"idDuPersonnage":"idDeSonCoffre"}. Sans association, recherche automatique par nom.',
    scope: "world", config: true, type: String, default: "{}",
    restricted: true,
  });
}

export function initLodgeStashes() {
  Hooks.on("renderActorSheet", injectStashButtons);
  Hooks.on("renderActorSheetV2", injectStashButtons);
  Hooks.on("renderCharacterSheetPF2e", injectStashButtons);
  Hooks.on("renderLootSheetPF2e", injectStashButtons);
  // Leaving the Loge hides any buttons in sheets that stayed open.
  Hooks.on("canvasReady", () => {
    if (!isLodgeScene()) {
      for (const control of globalThis.document?.querySelectorAll?.("." + ACTION) ?? []) {
        control.remove();
      }
    }
  });
}
