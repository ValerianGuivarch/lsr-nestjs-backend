import assert from "node:assert/strict";
import {
  collectPlayerLevelSnapshot,
  initPlayerLevelSync,
  pushPlayerLevelSnapshot
} from "../scripts/player-level-sync.js";

const actor = (uuid, level, xpc, hasPlayerOwner = true) => ({
  uuid, type: "character", hasPlayerOwner,
  system: { details: { level: { value: level } } },
  getFlag: (scope, key) => scope === "pf2e-val-toolkit" && key === "xpc" ? xpc : null
});

const neyla = actor("Actor.neyla", 4, 6500);
const eryn = actor("Actor.eryn", 5, 6500);
const npc = actor("Actor.npc", 3, 900, false);
assert.deepEqual(collectPlayerLevelSnapshot([neyla, npc, eryn, actor("Actor.bad", 3, null)]), [
  { uuid: "Actor.eryn", foundryLevel: 5, xpc: 6500 },
  { uuid: "Actor.neyla", foundryLevel: 4, xpc: 6500 },
]);

const responses = [];
const originalFetch = globalThis.fetch;
const originalGame = globalThis.game;
const originalHooks = globalThis.Hooks;
const callbacks = new Map();
const key = "test-sync-key";
const currentGM = { id: "gm-a", active: true, isGM: true };
globalThis.game = {
  user: currentGM,
  users: { contents: [currentGM] },
  actors: { contents: [neyla, eryn, npc] },
  settings: { get: (_module, setting) => setting === "discordCharacterChatKey"
    ? key
    : "https://l7r.fr/apil7r/pf2-mj" }
};
globalThis.Hooks = { on: (name, callback) => callbacks.set(name, callback) };
globalThis.fetch = async (url, options) => {
  responses.push({ url, options, payload: JSON.parse(options.body) });
  return { ok: true };
};
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

try {
  let finishStartup;
  const startup = new Promise(resolve => { finishStartup = resolve; });
  initPlayerLevelSync(startup);
  assert.ok(callbacks.get("updateActor"), "Actor updates must be tracked");
  await delay(15);
  assert.equal(responses.length, 0, "No push before the XPC reconciliation is complete");

  finishStartup({ status: "ok", updated: 2 });
  await delay(70);
  assert.equal(responses.length, 1, "One startup push for the first active GM");
  assert.match(responses[0].url, /\/player-codex\/foundry-level-snapshot$/);
  assert.equal(responses[0].options.method, "POST");
  assert.equal(responses[0].options.headers["x-pf2-foundry-sync-key"], key);
  assert.deepEqual(responses[0].payload.players, [
    { uuid: "Actor.eryn", foundryLevel: 5, xpc: 6500 },
    { uuid: "Actor.neyla", foundryLevel: 4, xpc: 6500 },
  ]);

  const second = await pushPlayerLevelSnapshot();
  assert.equal(second.status, "unchanged", "Same values must not trigger another write");
  assert.equal(responses.length, 1);

  neyla.system.details.level.value = 5;
  callbacks.get("updateActor")(neyla);
  await delay(1300);
  assert.equal(responses.length, 2, "Changes must push a fresh snapshot");
  assert.equal(responses[1].payload.players[1].foundryLevel, 5);

  currentGM.active = false;
  callbacks.get("updateActor")(neyla);
  await delay(1300);
  assert.equal(responses.length, 2, "No upload by an inactive GM");

  currentGM.active = true;
  game.users.contents = [{ id: "gm-0", active: true, isGM: true }, currentGM];
  assert.equal((await pushPlayerLevelSnapshot()).status, "not-ready", "Only the first active GM may push");
  game.users.contents = [currentGM];

  game.settings.get = () => "";
  assert.equal((await pushPlayerLevelSnapshot()).status, "not-configured", "Require a configured existing key");
  console.log("Player level snapshot on startup and Actor updates OK");
} finally {
  globalThis.fetch = originalFetch;
  globalThis.game = originalGame;
  globalThis.Hooks = originalHooks;
}
