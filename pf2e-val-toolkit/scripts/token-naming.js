const MODULE_ID = "pf2e-val-toolkit";
const ALWAYS = CONST.TOKEN_DISPLAY_MODES.ALWAYS;

const SETTINGS = Object.freeze({
  showNames: "tokenNaming.showNpcNames",
  distinguish: "tokenNaming.distinguishDuplicates",
  suffixFormat: "tokenNaming.suffixFormat"
});

function enabled(key) {
  return Boolean(game.settings.get(MODULE_ID, key));
}

function isNpc(actor) {
  return actor?.type === "npc";
}

function sourceActor(token) {
  return game.actors.get(token?.actorId) ?? token?.actor ?? null;
}

function baseName(token) {
  return sourceActor(token)?.name ?? token?.actor?.name ?? token?.name ?? "PNJ";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function suffix(index) {
  if (game.settings.get(MODULE_ID, SETTINGS.suffixFormat) === "numbers") {
    return String(index + 1);
  }

  let result = "";
  let value = index;
  do {
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return result;
}

function managedName(name, base) {
  const expression = new RegExp(`^${escapeRegExp(base)}(?: (?:[A-Z]+|\\d+))?$`);
  return expression.test(name ?? "");
}

function usedSuffixes(tokens, base) {
  const expression = new RegExp(`^${escapeRegExp(base)} (?:([A-Z]+)|(\\d+))$`);
  const used = new Set();
  for (const token of tokens) {
    const match = expression.exec(token.name ?? "");
    if (!match) continue;
    if (match[2]) used.add(Number(match[2]) - 1);
    else {
      let value = 0;
      for (const character of match[1]) value = value * 26 + character.charCodeAt(0) - 64;
      used.add(value - 1);
    }
  }
  return used;
}

async function setNpcTokenVisibility(actor) {
  if (!game.user.isGM || !enabled(SETTINGS.showNames) || !isNpc(actor)) return;
  if (actor.prototypeToken?.displayName === ALWAYS) return;
  await actor.update({ "prototypeToken.displayName": ALWAYS });
}

async function setTokenVisibility(token) {
  if (!game.user.isGM || !enabled(SETTINGS.showNames) || !isNpc(sourceActor(token))) return;
  if (token.displayName === ALWAYS) return;
  await token.update({ displayName: ALWAYS }, { [`${MODULE_ID}.tokenNaming`]: true });
}

async function nameDuplicates(scene, actorId) {
  if (!game.user.isGM || !enabled(SETTINGS.distinguish)) return;
  const tokens = scene.tokens.filter((token) => token.actorId === actorId && isNpc(sourceActor(token)));
  if (tokens.length < 2) return;

  const base = baseName(tokens[0]);
  const used = usedSuffixes(tokens, base);
  const updates = [];

  for (const token of tokens) {
    if (!managedName(token.name, base)) continue;
    if (new RegExp(`^${escapeRegExp(base)} (?:[A-Z]+|\\d+)$`).test(token.name ?? "")) continue;
    let index = 0;
    while (used.has(index)) index += 1;
    used.add(index);
    updates.push({ _id: token.id, name: `${base} ${suffix(index)}` });
  }

  if (updates.length) {
    await scene.updateEmbeddedDocuments("Token", updates, { [`${MODULE_ID}.tokenNaming`]: true });
  }
}

export async function migrateNpcTokenVisibility() {
  if (!game.user.isGM) return ui.notifications.warn("Seul le MJ peut modifier les tokens du monde.");
  const actors = game.actors.filter(isNpc);
  const actorUpdates = actors
    .filter((actor) => actor.prototypeToken?.displayName !== ALWAYS)
    .map((actor) => ({ _id: actor.id, "prototypeToken.displayName": ALWAYS }));
  if (actorUpdates.length) await Actor.updateDocuments(actorUpdates);

  let tokenCount = 0;
  for (const scene of game.scenes) {
    const updates = scene.tokens
      .filter((token) => isNpc(sourceActor(token)) && token.displayName !== ALWAYS)
      .map((token) => ({ _id: token.id, displayName: ALWAYS }));
    if (!updates.length) continue;
    await scene.updateEmbeddedDocuments("Token", updates, { [`${MODULE_ID}.tokenNaming`]: true });
    tokenCount += updates.length;
  }
  ui.notifications.info(`PF2e Val Toolkit | ${actorUpdates.length} prototype(s) et ${tokenCount} token(s) PNJ corrigés.`);
  return { actors: actorUpdates.length, tokens: tokenCount };
}

export async function migrateNpcDuplicateNames() {
  if (!game.user.isGM) return ui.notifications.warn("Seul le MJ peut modifier les tokens du monde.");
  for (const scene of game.scenes) {
    const actorIds = new Set(scene.tokens.filter((token) => isNpc(sourceActor(token))).map((token) => token.actorId));
    for (const actorId of actorIds) await nameDuplicates(scene, actorId);
  }
  ui.notifications.info("PF2e Val Toolkit | Doublons PNJ standards renommés sans toucher aux noms personnalisés.");
}

export function registerTokenNamingSettings() {
  game.settings.register(MODULE_ID, SETTINGS.showNames, {
    name: "Afficher toujours les noms des PNJ",
    hint: "Force l’affichage du nom des PNJ et créatures pour tous les joueurs.",
    scope: "world", config: true, type: Boolean, default: true
  });
  game.settings.register(MODULE_ID, SETTINGS.distinguish, {
    name: "Distinguer automatiquement les NPC identiques",
    hint: "Nomme les doublons d’un même Actor sur une scène : Gobelin A, Gobelin B…",
    scope: "world", config: true, type: Boolean, default: true
  });
  game.settings.register(MODULE_ID, SETTINGS.suffixFormat, {
    name: "Format du suffixe des PNJ",
    scope: "world", config: true, type: String, default: "letters",
    choices: { letters: "Lettres : A, B, C", numbers: "Nombres : 1, 2, 3" }
  });
}

export function initTokenNaming() {
  Hooks.on("preCreateActor", (actor, data) => {
    if (!game.user.isGM || !enabled(SETTINGS.showNames) || !isNpc(actor)) return;
    foundry.utils.setProperty(data, "prototypeToken.displayName", ALWAYS);
  });
  Hooks.on("createActor", (actor) => void setNpcTokenVisibility(actor));
  Hooks.on("preCreateToken", (token, data) => {
    if (!game.user.isGM || !enabled(SETTINGS.showNames) || !isNpc(sourceActor(token))) return;
    if (data.displayName !== ALWAYS) data.displayName = ALWAYS;
  });
  Hooks.on("createToken", (token) => {
    if (!game.user.isGM || !isNpc(sourceActor(token))) return;
    void setTokenVisibility(token);
    void nameDuplicates(token.parent, token.actorId);
  });

  game.pf2eValToolkit ??= {};
  game.pf2eValToolkit.tokenNaming = {
    migrateVisibility: migrateNpcTokenVisibility,
    migrateDuplicateNames: migrateNpcDuplicateNames
  };
}

