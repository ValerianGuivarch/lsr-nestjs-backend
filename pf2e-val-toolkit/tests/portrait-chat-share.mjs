import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import {
  shareablePortraitUrl,
  makePortraitChatContent,
  shareActorPortrait,
  injectPortraitShareButton,
  initPortraitChatShare,
} from "../scripts/portrait-chat-share.js";

const css = readFileSync(new URL("../styles/portrait-chat-share.css", import.meta.url), "utf8");
const dom = new JSDOM(`<!doctype html><style>${css}</style>
<div class="actor sheet">
  <form id="sheet">
    <div class="image-container">
      <img class="profile-img" src="worlds/pf2/Chevalier noir.webp" />
      <a data-action="show-image" title="Voir l'image"></a>
      <button class="pf2e-tokener-actor-sheet-button" title="Tokener"></button>
      <button class="quick-upload-button" title="Quick Upload"></button>
    </div>
    <div class="image-container"><img src="not-an-actor-art.png" /></div>
  </form>
</div>`);
const doc = dom.window.document;
const image = doc.querySelector(".image-container");
const sheet = doc.getElementById("sheet");
const actor = { type: "npc", name: "Boss secret", uuid: "Actor.SECRET123", img: "worlds/pf2/Chevalier noir.webp" };
const sent = [];
const errors = [];
const hooks = new Map();
globalThis.game = { user: { id: "gm", isGM: true } };
globalThis.ui = { notifications: { warn: message => errors.push(message), error: message => errors.push(message) } };
globalThis.ChatMessage = { create: async data => { sent.push(data); } };
globalThis.Hooks = { on: (name, cb) => hooks.set(name, cb) };

assert.equal(shareablePortraitUrl(actor.img), actor.img, "paths containing spaces must be supported");
assert.equal(shareablePortraitUrl("worlds/pf2/Créature d'ombre.jpg"), "worlds/pf2/Créature d'ombre.jpg");
assert.equal(shareablePortraitUrl("https://cdn.example/art.webp?v=3&x=2"), "https://cdn.example/art.webp?v=3&x=2");
for (const unsafe of ["", "javascript:alert(1)", "data:image/png;base64,abcd", "../private.webp", "/../secret.webp", "bad<svg>.png", "https://cdn/x.png\" onerror=\"x"]) {
  assert.equal(shareablePortraitUrl(unsafe), null, `unsafe portrait source: ${unsafe}`);
}
assert.match(makePortraitChatContent("worlds/a.png?x=1&y=2"), /x=1&amp;y=2/);

initPortraitChatShare();
for (const hook of ["renderActorSheet", "renderActorSheetV2", "renderCharacterSheetPF2e", "renderNPCSheetPF2e"]) {
  assert.equal(typeof hooks.get(hook), "function", `${hook} must be registered`);
}
assert.equal(injectPortraitShareButton({ actor }, sheet), 1);
assert.equal(injectPortraitShareButton({ actor }, sheet), 0, "repeat renders must not duplicate the button");
const shareButton = image.querySelector(".pf2e-val-share-portrait");
assert.ok(shareButton);
assert.equal(shareButton.type, "button");
assert.equal(shareButton.getAttribute("aria-label"), "Partager le portrait dans le chat");
assert.equal(image.querySelectorAll("a[data-action='show-image']").length, 1, "native art viewer must remain");
assert.equal(image.querySelectorAll(".pf2e-tokener-actor-sheet-button").length, 1, "Tokener must remain");
assert.equal(image.querySelectorAll(".quick-upload-button").length, 1, "Quick Upload must remain");
assert.equal(doc.querySelectorAll(".pf2e-val-share-portrait").length, 1, "only real portrait hosts receive a button");
const computed = dom.window.getComputedStyle(shareButton);
assert.equal(computed.bottom, "4px");
assert.equal(computed.left, "4px");
assert.equal(computed.position, "absolute");

const click = new dom.window.MouseEvent("click", { bubbles: true, cancelable: true });
shareButton.dispatchEvent(click);
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(sent.length, 1);
assert.equal(sent[0].user, "gm");
assert.deepEqual(sent[0].speaker, { alias: "Illustration" });
assert.match(sent[0].content, /<img src="worlds\/pf2\/Chevalier noir\.webp"/);
assert.match(sent[0].content, /object-fit:contain/);
assert.ok(!sent[0].content.includes("Boss secret") && !sent[0].content.includes("SECRET123"), "don't reveal an Actor's hidden identity");
assert.deepEqual(errors, []);
assert.equal(shareButton.disabled, false);

game.user.isGM = false;
assert.equal(injectPortraitShareButton({ actor }, doc.createElement("div")), 0);
assert.deepEqual(await shareActorPortrait(actor), { status: "forbidden" });
assert.equal(sent.length, 1, "players cannot send a portrait through this GM-only action");
console.log("Portrait share button, secrecy, unchanged Foundry controls and chat image OK");
