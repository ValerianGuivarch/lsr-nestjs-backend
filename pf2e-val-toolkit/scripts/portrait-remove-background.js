import { shareablePortraitUrl } from "./portrait-chat-share.js";

const endpoint = "https://l7r.fr/apil7r/pf2-mj";
const buttonClass = "pf2e-val-remove-background";
const processing = new Set();

async function checked(response, fallback) {
  if (response.ok) return response;
  const error = await response.json().catch(() => null);
  throw new Error(error?.message || fallback);
}

export async function removeActorPortraitBackground(actor) {
  if (!game.user?.isGM || !actor?.isOwner) return;
  const original = actor.img;
  const src = shareablePortraitUrl(original);
  if (!src) throw new Error("Aucun portrait valide.");
  if (processing.has(actor.uuid)) return;
  processing.add(actor.uuid);
  try {
    const source = await checked(await fetch(new URL(src, location.origin + "/"), { cache: "no-store" }), "Impossible de lire le portrait.");
    const form = new FormData();
    form.set("file", await source.blob(), "portrait");
    const cutout = await checked(await fetch(endpoint + "/portraits/remove-background", { method: "POST", body: form }), "Impossible de supprimer le fond.");
    const upload = new FormData();
    upload.set("pnjId", "cutout-" + crypto.randomUUID());
    upload.set("file", await cutout.blob(), "portrait-sans-fond.png");
    const saved = await checked(await fetch(endpoint + "/pnj/portrait", { method: "POST", body: upload }), "Impossible d’enregistrer le portrait.");
    const { portrait } = await saved.json();
    if (!/^assets\/l7r\/portraits\/pnj\/[^/]+\.webp$/.test(portrait)) throw new Error("Chemin du portrait invalide.");
    if (actor.img !== original) throw new Error("Le portrait a changé pendant le détourage. Aucun remplacement effectué.");
    await actor.update({ img: portrait });
    ui.notifications.info("Remove BG : portrait sans fond enregistré.");
  } finally {
    processing.delete(actor.uuid);
  }
}

export function injectPortraitRemoveBackground(application, html) {
  if (!game.user?.isGM) return;
  const actor = application?.actor ?? application?.document ?? application?.object;
  const root = html?.querySelectorAll ? html : html?.[0] ?? application?.element;
  if (!actor?.img || !actor.isOwner || !root?.querySelectorAll) return;
  for (const container of root.querySelectorAll(".image-container")) {
    if (!container.querySelector("img") || !container.querySelector('[data-action="show-image"]') || container.querySelector("." + buttonClass)) continue;
    const button = root.ownerDocument.createElement("button");
    button.type = "button";
    button.className = buttonClass;
    button.title = "Remove BG — supprimer le fond du portrait";
    button.setAttribute("aria-label", button.title);
    const icon = root.ownerDocument.createElement("i");
    icon.className = "fa-solid fa-scissors";
    icon.setAttribute("aria-hidden", "true");
    button.append(icon);
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (button.disabled) return;
      button.disabled = true;
      void removeActorPortraitBackground(actor).catch(error => {
        ui.notifications.error(error.message || "Remove BG : erreur.");
      }).finally(() => { button.disabled = false; });
    });
    container.append(button);
  }
}

export function initPortraitRemoveBackground() {
  for (const hook of ["renderActorSheet", "renderActorSheetV2", "renderCharacterSheetPF2e", "renderNPCSheetPF2e"]) Hooks.on(hook, injectPortraitRemoveBackground);
}
