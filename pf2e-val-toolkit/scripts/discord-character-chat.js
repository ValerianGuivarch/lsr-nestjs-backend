import { pf2MjApiUrl } from "./career-xp/index.js";

const MODULE_ID = "pf2e-val-toolkit";
const FLAG = "discordCharacterPresentation";
const PROCESSED = "discordCharacterProcessedIds";
const STARTED_AT = "discordCharacterSyncStartedAt";
const NORMAL_INTERVAL = 30000;
const SESSION_INTERVAL = 1000;
let interval = NORMAL_INTERVAL;
let running = false;
let nextPoll = 0;
let nextStatus = 0;

function firstActiveGM() {
  return game.users?.filter(user => user.active && user.isGM).sort((a, b) => a.id.localeCompare(b.id))[0]?.id === game.user.id;
}

function escape(value) { return foundry.utils.escapeHTML(String(value ?? "")); }
function renderPresentation(item) {
  const image = String(item.portraitUrl ?? "");
  const safeImage = /^(https:\/\/|assets\/l7r\/)/i.test(image) ? image : "";
  const wiki = item.wikiUrl && /^https:\/\//.test(item.wikiUrl) ? item.wikiUrl : null;
  return `<div class="pf2e-val-character-presentation">
    ${item.showName ? `<p><strong>${escape(item.name)}</strong></p>` : ""}
    ${safeImage ? `<img src="${escape(safeImage)}" alt="Portrait du personnage" style="max-width:100%;height:auto;display:block" />` : ""}
    ${wiki ? `<p><a class="button" href="${escape(wiki)}" target="_blank" rel="noopener noreferrer">Voir la fiche</a></p>`
      : `<p><button type="button" data-pf2-character-create="${escape(item.id)}" data-pf2-character-token="${escape(item.token)}" data-pf2-character-name="${escape(item.showName ? item.name : "")}">Créer la fiche</button></p>`}
  </div>`;
}

async function readJson(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(12000) });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${response.status}`);
  }
  return response.json();
}

async function showCharacterForm(button) {
  const id = button.dataset.pf2CharacterCreate;
  const token = button.dataset.pf2CharacterToken;
  const name = button.dataset.pf2CharacterName ?? "";
  if (!id || !token) return;
  let factions;
  try { factions = await readJson(`${pf2MjApiUrl()}/player-codex/foundry-factions`); }
  catch (error) { ui.notifications.error(`Factions indisponibles : ${error.message}`); return; }
  const select = `<select name="faction"><option value="">(Aucune faction)</option>${factions.slice(0, 24).map(f => `<option value="${escape(f.id)}">${escape(f.path)}</option>`).join("")}</select>`;
  const content = `<form class="pf2e-val-character-form">
    <div class="form-group"><label>Nom connu des joueurs</label><input type="text" name="name" maxlength="160" required value="${escape(name)}" /></div>
    <div class="form-group"><label>Description courte</label><textarea name="description" maxlength="1000" rows="5"></textarea></div>
    <div class="form-group"><label>Faction principale (facultative)</label>${select}</div>
  </form>`;
  try {
    await foundry.applications.api.DialogV2.wait({
      window: { title: "Créer la fiche personnage" }, content,
      buttons: [
        { action: "cancel", label: "Annuler" },
        { action: "create", label: "Créer la fiche", default: true, callback: async (_event, _button, dialog) => {
          const form = dialog.element.querySelector("form.pf2e-val-character-form");
          const data = new FormData(form);
          const submittedName = String(data.get("name") ?? "").trim();
          if (!submittedName) { ui.notifications.warn("Le nom est obligatoire."); return false; }
          const result = await readJson(`${pf2MjApiUrl()}/player-codex/foundry-presentations/${encodeURIComponent(id)}/publish`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, name: submittedName, description: String(data.get("description") ?? ""), factionId: String(data.get("faction") ?? "") || null })
          });
          ui.notifications.info("Fiche créée : " + result.wikiUrl);
          return true;
        } }
      ]
    });
  } catch (error) { ui.notifications.error(`Création impossible : ${error.message}`); }
}

async function synchronizePresentations() {
  if (!firstActiveGM()) return;
  const key = game.settings.get(MODULE_ID, "discordCharacterChatKey");
  if (!key) return;
  const data = await readJson(`${pf2MjApiUrl()}/player-codex/foundry-presentations`, {
    headers: { Accept: "application/json", "x-pf2-foundry-sync-key": key }
  });
  const updatedInterval = data.active ? SESSION_INTERVAL : NORMAL_INTERVAL;
  if (interval !== updatedInterval) nextPoll = 0;
  interval = updatedInterval;
  const presentations = data.presentations;
  if (!Array.isArray(presentations)) return;
  const startedAt = game.settings.get(MODULE_ID, STARTED_AT);
  if (!startedAt) {
    // Upgrade boundary: never resurrect historical chat posts removed before this version.
    await game.settings.set(MODULE_ID, STARTED_AT, Date.now());
  }
  const cutoff = startedAt || Date.now();
  const processed = new Set(game.settings.get(MODULE_ID, PROCESSED));
  for (const message of game.messages?.contents ?? []) {
    const id = message.getFlag(MODULE_ID, FLAG)?.id;
    if (id) processed.add(id);
  }
  for (const item of [...presentations].reverse()) {
    if (!item?.id) continue;
    const content = renderPresentation(item);
    const existing = game.messages?.contents.find(message => message.getFlag(MODULE_ID, FLAG)?.id === item.id);
    if (existing) {
      if (existing.content !== content) await existing.update({ content });
    } else if (!processed.has(item.id) && Date.parse(String(item.createdAt).replace(" ", "T") + "Z") > cutoff) {
      const message = await ChatMessage.create({
        user: game.user.id, speaker: { alias: game.user.name }, content,
        flags: { [MODULE_ID]: { [FLAG]: { id: item.id } } }
      });
      if (message) processed.add(item.id);
    }
  }
  const stored = game.settings.get(MODULE_ID, PROCESSED);
  if (processed.size !== stored.length) await game.settings.set(MODULE_ID, PROCESSED, [...processed]);
}

export function registerDiscordCharacterChatSettings() {
  game.settings.register(MODULE_ID, "discordCharacterChatKey", {
    name: "Clé de synchronisation Discord → chat Foundry",
    hint: "Doit correspondre à PF2_FOUNDRY_CHAT_SYNC_KEY côté backend. Réservée au MJ.",
    scope: "world", config: true, type: String, default: "", restricted: true
  });
  game.settings.register(MODULE_ID, PROCESSED, { scope: "world", config: false, type: Array, default: [], restricted: true });
  game.settings.register(MODULE_ID, STARTED_AT, { scope: "world", config: false, type: Number, default: 0, restricted: true });
}

export function initDiscordCharacterChat() {
  document.addEventListener("click", event => {
    const button = event.target.closest?.("[data-pf2-character-create]");
    if (!button) return;
    event.preventDefault();
    void showCharacterForm(button);
  });
  if (!game.user.isGM) return;
  const poll = async () => {
    if (running || !firstActiveGM()) return;
    running = true;
    try { await synchronizePresentations(); }
    catch (error) { console.warn("PF2e Val Toolkit | Synchronisation des personnages Discord :", error); }
    finally { running = false; }
  };
  void poll();
  window.setInterval(() => {
    if (!firstActiveGM()) return;
    const now = Date.now();
    if (now >= nextStatus) {
      nextStatus = now + SESSION_INTERVAL;
      const key = game.settings.get(MODULE_ID, "discordCharacterChatKey");
      if (key) void readJson(`${pf2MjApiUrl()}/player-codex/foundry-sync-state`, {
        headers: { "x-pf2-foundry-sync-key": key }
      }).then(state => {
        const nextInterval = state.active ? SESSION_INTERVAL : NORMAL_INTERVAL;
        if (interval !== nextInterval) nextPoll = 0;
        interval = nextInterval;
      }).catch(error => console.warn("PF2e Val Toolkit | État de séance :", error));
    }
    if (now < nextPoll) return;
    nextPoll = now + interval;
    void poll();
  }, SESSION_INTERVAL);
}
