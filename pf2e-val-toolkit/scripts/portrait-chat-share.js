/**
 * Share a Foundry Actor portrait with the whole table in public chat.
 * Only the GM sees the button. The message deliberately does NOT contain
 * Actor UUID, name, private notes, token name, or an Actor chat speaker.
 */
const MODULE_ID = "pf2e-val-toolkit";
const BUTTON_CLASS = "pf2e-val-share-portrait";

/**
 * Trust only ordinary asset URLs. An Actor portrait may be hosted on Foundry
 * or on a remote HTTPS server, but must never inject markup into the chat.
 */
export function shareablePortraitUrl(value) {
  if (typeof value !== "string") return null;
  const src = value.trim();
  if (!src || /[\u0000-\u001f\u007f<>"]/u.test(src) || src.includes("\\\\")) return null;
  if (/^https?:\/\//i.test(src)) {
    try {
      const url = new URL(src);
      return ["http:", "https:"].includes(url.protocol) ? src : null;
    } catch {
      return null;
    }
  }
  // Keep spaces, apostrophes and accents found in real Foundry file paths.
  // Reject external protocols and traversal, not normal asset filenames.
  if (/^[a-z][a-z\d+.-]*:/i.test(src) || src.startsWith("//")
    || src.startsWith("..") || src.includes("/../")) return null;
  return src;
}

export function makePortraitChatContent(src) {
  const safe = shareablePortraitUrl(src);
  if (!safe) return null;
  const escaped = safe.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  return `<div class="pf2e-val-shared-portrait"><img src="${escaped}" alt="Illustration partagée" style="display:block;max-width:100%;height:auto;max-height:70vh;object-fit:contain;margin:0 auto" /></div>`;
}

export async function shareActorPortrait(actor) {
  if (!game.user?.isGM) return { status: "forbidden" };
  const content = makePortraitChatContent(actor?.img);
  if (!content) {
    ui.notifications.warn("Ce personnage n'a pas de portrait partageable.");
    return { status: "missing" };
  }
  await ChatMessage.create({
    user: game.user.id,
    speaker: { alias: "Illustration" },
    content,
  });
  return { status: "shared" };
}

function portraitRoot(html, application) {
  const element = html?.querySelectorAll ? html : html?.[0] ?? application?.element;
  return element?.querySelectorAll ? element : null;
}

export function injectPortraitShareButton(application, html) {
  if (!game.user?.isGM) return 0;
  const actor = application?.actor ?? application?.document ?? application?.object;
  if (!actor?.img) return 0;
  const root = portraitRoot(html, application);
  if (!root) return 0;
  let added = 0;
  for (const container of root.querySelectorAll(".image-container")) {
    const portrait = container.querySelector("img.profile-img, img.actor-image, img");
    // Share only the Actor portrait hosts used by PF2e sheets.
    if (!portrait || !container.querySelector('[data-action="show-image"]')
      || container.querySelector(`.${BUTTON_CLASS}`)) continue;
    // Keep buttons of Foundry, Tokener and Quick Upload as they are.
    const button = root.ownerDocument.createElement("button");
    button.type = "button";
    button.className = BUTTON_CLASS;
    button.setAttribute("aria-label", "Partager le portrait dans le chat");
    button.title = "Partager le portrait dans le chat";
    const icon = root.ownerDocument.createElement("i");
    icon.className = "fa-solid fa-share-nodes";
    icon.setAttribute("aria-hidden", "true");
    button.append(icon);
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      if (button.disabled) return;
      button.disabled = true;
      void shareActorPortrait(actor).catch(error => {
        console.error(`${MODULE_ID} | Partage du portrait impossible`, error);
        ui.notifications.error("Impossible de partager le portrait dans le chat.");
      }).finally(() => {
        button.disabled = false;
      });
    });
    container.append(button);
    added += 1;
  }
  return added;
}

export function initPortraitChatShare() {
  // PF2e V14 uses both legacy ActorSheet and ApplicationV2-based sheets
  // depending on the Actor and its modules.
  Hooks.on("renderActorSheet", injectPortraitShareButton);
  Hooks.on("renderActorSheetV2", injectPortraitShareButton);
  Hooks.on("renderCharacterSheetPF2e", injectPortraitShareButton);
  Hooks.on("renderNPCSheetPF2e", injectPortraitShareButton);
}
