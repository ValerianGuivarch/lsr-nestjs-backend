import { pf2MjApiUrl } from "./career-xp/index.js";

const MODULE_ID = "pf2e-val-toolkit";
const FLAG = "discordCharacterPresentation";

function firstActiveGM() {
  return game.users?.filter(user => user.active && user.isGM).sort((a, b) => a.id.localeCompare(b.id))[0]?.id === game.user.id;
}

function renderPresentation(item) {
  const escape = value => foundry.utils.escapeHTML(String(value ?? ""));
  const image = String(item.portraitUrl ?? "");
  const safeImage = /^(https:\/\/|assets\/l7r\/)/i.test(image) ? image : "";
  const actionUrl = item.wikiUrl || item.discordUrl;
  const safeUrl = typeof actionUrl === "string" && /^https:\/\//i.test(actionUrl) ? actionUrl : "";
  const label = item.wikiUrl ? "Voir la fiche" : "Créer la fiche";
  return `<div class="pf2e-val-character-presentation">
    ${item.showName ? `<p><strong>${escape(item.name)}</strong></p>` : ""}
    ${safeImage ? `<img src="${escape(safeImage)}" alt="Portrait du personnage" style="max-width:100%;height:auto;display:block" />` : ""}
    ${safeUrl ? `<p><a href="${escape(safeUrl)}" target="_blank" rel="noopener noreferrer" class="button">${label}</a></p>` : ""}
  </div>`;
}

async function synchronizePresentations() {
  if (!firstActiveGM()) return;
  const key = game.settings.get(MODULE_ID, "discordCharacterChatKey");
  if (!key) return;
  const response = await fetch(`${pf2MjApiUrl()}/player-codex/foundry-presentations`, {
    headers: { Accept: "application/json", "x-pf2-foundry-sync-key": key }, signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const presentations = await response.json();
  if (!Array.isArray(presentations)) return;
  for (const item of [...presentations].reverse()) {
    if (!item?.id) continue;
    const content = renderPresentation(item);
    const existing = game.messages?.contents.find(message => message.getFlag(MODULE_ID, FLAG)?.id === item.id);
    if (existing) {
      if (existing.content !== content) await existing.update({ content });
      continue;
    }
    await ChatMessage.create({
      user: game.user.id,
      speaker: { alias: game.user.name },
      content,
      flags: { [MODULE_ID]: { [FLAG]: { id: item.id } } }
    });
  }
}

export function registerDiscordCharacterChatSettings() {
  game.settings.register(MODULE_ID, "discordCharacterChatKey", {
    name: "Clé de synchronisation Discord → chat Foundry",
    hint: "Doit correspondre à PF2_FOUNDRY_CHAT_SYNC_KEY côté backend. Réservée au MJ.",
    scope: "world", config: true, type: String, default: "", restricted: true
  });
}

export function initDiscordCharacterChat() {
  if (!game.user.isGM) return;
  let running = false;
  const poll = async () => {
    if (running) return;
    running = true;
    try { await synchronizePresentations(); }
    catch (error) { console.warn("PF2e Val Toolkit | Synchronisation des personnages Discord :", error); }
    finally { running = false; }
  };
  void poll();
  window.setInterval(() => { void poll(); }, 30000);
}
