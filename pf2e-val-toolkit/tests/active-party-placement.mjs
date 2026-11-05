import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const code = readFileSync(new URL("../scripts/active-party.js", import.meta.url), "utf8")
  .replace(/export function /g, "function ");
const handlers = new Map();
const calls = [];
const ids = ["pj1", "pj2", "pj3"];
const actors = new Map(ids.map((id) => [id, {
  id, type: "character", prototypeToken: { toObject: () => ({ texture: { src: id + ".webp" } }) }
}]));
const scene = {
  id: "scene1", width: 2000, height: 2000, grid: { size: 100, type: 1 },
  tokens: [],
  async createEmbeddedDocuments(kind, data) {
    assert.equal(kind, "Token");
    calls.push(data);
    this.tokens.push(...data);
    return data;
  }
};
const stage = {
  on(name, listener) { handlers.set(name, listener); },
  off(name, listener) { if (handlers.get(name) === listener) handlers.delete(name); },
  toLocal(p) { return p; }
};
const hooks = new Map();
const keys = new Map();
const ctx = {
  canvas: { scene, stage, dimensions: { sceneRect: { x: 0, y: 0, width: 2000, height: 2000 } } },
  game: { user: { isGM: true }, settings: { get: () => ids }, actors: { get: (id) => actors.get(id) } },
  Hooks: { on(name, fn) { hooks.set(name, fn); return name; }, off(name) { hooks.delete(name); } },
  window: { addEventListener(name, fn) { keys.set(name, fn); }, removeEventListener(name) { keys.delete(name); } },
  ui: { notifications: { info() {}, warn() {} } },
  foundry: { utils: { deepClone: structuredClone, escapeHTML: (s) => s } },
  console
};
vm.runInNewContext(code + "\nglobalThis.__test = { placeMissingTokens, partyPlacementData };", ctx);
const { placeMissingTokens, partyPlacementData } = ctx.__test;
const placement = placeMissingTokens();
assert.equal(calls.length, 0, "No tokens placed before click");
assert.equal(handlers.has("pointerdown"), true);
handlers.get("pointerdown")({ button: 0, getLocalPosition: () => ({ x: 700, y: 900 }) });
await placement;
assert.equal(calls.length, 1);
assert.equal(calls[0].length, 3);
assert.ok(calls[0].every((token) => token.x >= 0 && token.y >= 0 && token.actorLink));
assert.equal(handlers.size, 0, "Canvas listeners removed");
assert.equal(keys.size, 0, "Keyboard listeners removed");
assert.equal(await placeMissingTokens().then((tokens) => tokens.length), 0, "No duplicate PJ");
scene.tokens = [];
const cancelled = placeMissingTokens();
keys.get("keydown")({ key: "Escape", preventDefault() {} });
assert.equal((await cancelled).length, 0);
assert.equal(calls.length, 1, "Cancel creates nothing");
const nearEdge = partyPlacementData(scene, [...actors.values()], { x: 1999, y: 1999 });
assert.ok(nearEdge.every((token) => token.x < 2000 && token.y < 2000));
console.log("Active party: click placement, cancel, deduplication, bounds and cleanup OK");

