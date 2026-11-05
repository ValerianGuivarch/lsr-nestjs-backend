import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  isLodgeScene, personalChestFor, personalChestCharacter, groupChest,
  canOperateCharacter, transferStashItem,
  injectStashButtons, registerLodgeStashSettings, initLodgeStashes,
} from "../scripts/lodge-stashes.js";

const transfers = [];
function actor(id, type, name, owned = true, data = {}) {
  const items = new Map((data.items || []).map(i => [i.id, i]));
  return {
    id, uuid: "Actor." + id, type, name, items,
    system: { lootSheetType: type === "loot" ? "Loot" : null },
    getFlag: () => undefined,
    testUserPermission: (_user, permission) => owned && ["OWNER", "OBSERVER"].includes(permission),
    transferItemToActor: async function(target, item, quantity, containerId, newStack, purchase) {
      transfers.push({ source: this.id, target: target.id, itemId: item.id,
        quantity, containerId, newStack, purchase });
    },
  };
}
const sword = { id: "sword", name: "Épée courte", type: "weapon", quantity: 1,
  isOfType: kind => kind === "physical" || kind === "weapon" };
const arrows = { id: "arrows", name: "Tir-balise", type: "ammo", quantity: 6,
  isOfType: kind => kind === "physical" || kind === "ammo" };
const character = actor("4N3WqzZHJ5KTTINr", "character", "Jilkra (Jupi)", true, { items: [sword, arrows] });
const otherCharacter = actor("N5h2vjYTiecCJji2", "character", "Ruhtra (Arthur)");
const personal = actor("UdzbGJTIsO5Xf4RY", "loot", "Coffre de Jilkra", true, { items: [{ ...sword }] });
const otherChest = actor("6JiE4MVc8EtiqSyG", "loot", "Coffre de Ruhtra", false, { items: [sword] });
const group = actor("4UYT39KUmloEM6mt", "loot", "Coffre du groupe", true, { items: [arrows] });
const assignedUser = { id: "jupi", isGM: false, character };
const settings = {};
const dom = new JSDOM("<!doctype html><html><body><section id='app'></section></body></html>");
globalThis.document = dom.window.document;
globalThis.canvas = { scene: { id: "lagY36CCwnaTzDag" } };
globalThis.game = {
  user: assignedUser, actors: { contents: [character, otherCharacter, personal, otherChest, group] },
  settings: {
    get: (_module, key) => settings[key],
    register: (_module, key, def) => { settings[key] = def.default; },
  },
};
const errors = [];
globalThis.ui = { notifications: { error: value => errors.push(value) } };
const hooks = new Map();
globalThis.Hooks = { on: (name, callback) => hooks.set(name, callback) };
const form = () => {
  const root = document.createElement("form");
  root.innerHTML = [
    '<section class="inventory-list"><ul>',
    '<li data-item-id="sword"><div class="data"><h4>Épée courte</h4><div class="item-controls"><a data-action="edit-item">éditer</a><a data-action="delete-item">supprimer</a></div></div></li>',
    '<li data-item-id="arrows"><div class="data"><h4>Tir-balise</h4><div class="item-controls"><a data-action="edit-item">éditer</a><a data-action="delete-item">supprimer</a></div></div></li>',
    '<li data-item-id="not-physical"><div class="data"><div class="item-controls"></div></div></li>',
    '</ul></section>',
  ].join('');
  document.body.append(root);
  return root;
};
const wait = () => new Promise(resolve => setTimeout(resolve, 0));

registerLodgeStashSettings();
assert.equal(isLodgeScene(), true);
assert.equal(groupChest(), group);
assert.equal(personalChestFor(character), personal);
assert.equal(personalChestFor(otherCharacter), otherChest);
assert.equal(personalChestCharacter(personal), character);
assert.equal(canOperateCharacter(character), true);
assert.equal(canOperateCharacter(otherCharacter), false);

let root = form();
const nativeControls = root.querySelectorAll('[data-action="edit-item"], [data-action="delete-item"]').length;
assert.equal(injectStashButtons({ actor: character }, root), 4);
assert.equal(root.querySelectorAll(".pf2e-val-stash-action").length, 4);
assert.equal(root.querySelectorAll('[data-action="edit-item"], [data-action="delete-item"]').length, nativeControls);
assert.equal(injectStashButtons({ actor: character }, root), 4, "double render must not duplicate buttons");
assert.equal(root.querySelectorAll(".pf2e-val-stash-action").length, 4);
assert.equal(root.querySelectorAll('[data-item-id="not-physical"] .pf2e-val-stash-action').length, 0);
const personalSend = root.querySelector('[data-item-id="sword"] [data-stash-direction="personal"]');
assert.ok(personalSend.getAttribute("aria-label").startsWith("Envoyer dans mon coffre personnel"));
personalSend.click();
await wait();
assert.deepEqual(transfers[0], {
  source: character.id, target: personal.id, itemId: "sword",
  quantity: 1, containerId: undefined, newStack: false, purchase: false,
});
assert.equal(personalSend.disabled, false);
const groupSend = root.querySelector('[data-item-id="arrows"] [data-stash-direction="group"]');
groupSend.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, shiftKey: true }));
await wait();
assert.deepEqual(transfers[1], {
  source: character.id, target: group.id, itemId: "arrows",
  quantity: 1, containerId: undefined, newStack: false, purchase: false,
});
assert.deepEqual(await transferStashItem(character, "arrows", "group"), {
  quantity: 6, source: character.id, destination: group.id,
});

const personalRoot = form();
assert.equal(injectStashButtons({ actor: personal }, personalRoot), 1);
personalRoot.querySelector('[data-stash-direction="withdraw"]').click();
await wait();
assert.equal(transfers.at(-1).source, personal.id);
assert.equal(transfers.at(-1).target, character.id);
const groupRoot = form();
assert.equal(injectStashButtons({ actor: group }, groupRoot), 1);
groupRoot.querySelector('[data-stash-direction="withdraw"]').click();
await wait();
assert.equal(transfers.at(-1).source, group.id);
assert.equal(transfers.at(-1).target, character.id);

// Another person's chest cannot display buttons or be used for withdrawal.
const foreignRoot = form();
assert.equal(injectStashButtons({ actor: otherChest }, foreignRoot), 0);
await assert.rejects(transferStashItem(otherChest, "sword", "withdraw"), /n'est pas autorisé/);

game.user = { ...assignedUser, character: otherCharacter };
const nonActiveRoot = form();
assert.equal(injectStashButtons({ actor: character }, nonActiveRoot), 0);
await assert.rejects(transferStashItem(character, "sword", "group"), /n'est pas autorisé/);
assert.equal(injectStashButtons({ actor: personal }, form()), 0);

game.user = assignedUser;
canvas.scene.id = "different-scene";
assert.equal(isLodgeScene(), false);
assert.equal(injectStashButtons({ actor: character }, root), 0);
await assert.rejects(transferStashItem(character, "sword", "personal"), /n'est pas autorisé/);
canvas.scene.id = "lagY36CCwnaTzDag";

const future = actor("NEWCHARACTER1234", "character", "Éole (Marie)");
const futureChest = actor("NEWCHEST1234567", "loot", "Coffre de Eole");
game.actors.contents.push(future, futureChest);
assert.equal(personalChestFor(future), futureChest);
futureChest.name = "Le casier du vent";
assert.equal(personalChestFor(future), null);
settings.lodgePersonalChestLinks = JSON.stringify({ [future.id]: futureChest.id });
assert.equal(personalChestFor(future), futureChest);
settings.lodgePersonalChestLinks = "{invalid json";
assert.equal(personalChestFor(future), null);
settings.lodgePersonalChestLinks = "{}";

initLodgeStashes();
for (const name of ["renderActorSheet", "renderActorSheetV2", "renderCharacterSheetPF2e", "renderLootSheetPF2e", "canvasReady"]) {
  assert.equal(typeof hooks.get(name), "function", name);
}
root = form();
injectStashButtons({ actor: character }, root);
assert.equal(root.querySelectorAll(".pf2e-val-stash-action").length, 4);
canvas.scene.id = "elsewhere";
hooks.get("canvasReady")();
assert.equal(document.querySelectorAll(".pf2e-val-stash-action").length, 0, "canvas switch removes old buttons");
assert.deepEqual(errors, []);
console.log("Lodge stashes: scoped sheet buttons, personal/group routing, native transfers, permissions and settings OK");
