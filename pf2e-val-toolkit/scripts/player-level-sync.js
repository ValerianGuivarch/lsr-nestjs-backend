import { getXpc, pf2MjApiUrl } from "./career-xp/index.js";

const MODULE_ID = "pf2e-val-toolkit";
const SYNC_KEY_SETTING = "discordCharacterChatKey";
const DEBOUNCE_MS = 1200;
const RETRY_MS = 30000;
const MAX_RETRIES = 5;

let initialized = false;
let startupFinished = false;
let timer = null;
let sending = false;
let pending = false;
let retryCount = 0;
let lastSent = null;

function firstActiveGM() {
  if (!game.user?.isGM) return false;
  const activeGMs = (game.users?.contents ?? [])
    .filter(user => user.isGM && user.active)
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
  return activeGMs[0]?.id === game.user.id;
}

/** Only world-owned PF2e player characters with a valid canonical XPC. */
export function collectPlayerLevelSnapshot(actors) {
  return (actors ?? []).flatMap(actor => {
    if (actor?.type !== "character" || actor.hasPlayerOwner === false) return [];
    const uuid = actor.uuid;
    const foundryLevel = Number(actor.system?.details?.level?.value);
    const xpc = getXpc(actor);
    if (typeof uuid !== "string" || !/^Actor\.[A-Za-z0-9]+$/.test(uuid)
      || !Number.isInteger(foundryLevel) || foundryLevel < 1 || foundryLevel > 20
      || !Number.isSafeInteger(xpc) || xpc < 0) return [];
    return [{ uuid, foundryLevel, xpc }];
  }).sort((left, right) => left.uuid.localeCompare(right.uuid));
}

/**
 * Reuse the already configured Discord↔Foundry synchronization key.
 * Only the first online GM sends the snapshot; no new secret or player
 * permission is introduced, and no Foundry document is changed by this call.
 */
export async function pushPlayerLevelSnapshot() {
  if (!startupFinished || !firstActiveGM()) return { status: "not-ready" };
  const key = game.settings.get(MODULE_ID, SYNC_KEY_SETTING);
  if (typeof key !== "string" || !key.trim()) return { status: "not-configured" };
  const players = collectPlayerLevelSnapshot(game.actors?.contents ?? []);
  if (!players.length) return { status: "empty" };
  const signature = JSON.stringify(players);
  if (signature === lastSent) return { status: "unchanged", count: players.length };
  const response = await fetch(`${pf2MjApiUrl()}/player-codex/foundry-level-snapshot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-pf2-foundry-sync-key": key
    },
    body: JSON.stringify({ players }),
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`API niveaux PJ : HTTP ${response.status}`);
  lastSent = signature;
  return { status: "sent", count: players.length };
}

function schedulePush(delay = DEBOUNCE_MS) {
  if (!startupFinished || !firstActiveGM()) return;
  if (sending) {
    pending = true;
    return;
  }
  if (timer !== null) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    sending = true;
    void pushPlayerLevelSnapshot().then(result => {
      if (result.status === "sent") {
        console.info(`${MODULE_ID} | Niveaux PJ mémorisés dans l’API (${result.count}).`);
      }
      retryCount = 0;
    }).catch(error => {
      console.warn(`${MODULE_ID} | Impossible de mémoriser les niveaux PJ :`, error);
      if (++retryCount <= MAX_RETRIES) pending = true;
    }).finally(() => {
      sending = false;
      if (pending) {
        pending = false;
        schedulePush(retryCount ? RETRY_MS : DEBOUNCE_MS);
      }
    });
  }, delay);
}

/**
 * Register at Foundry ready. The initial upload waits for the existing
 * session→XPC→PF2 progression reconciliation to finish. Later Actor updates
 * are debounced (including manual level-ups and XPC updates).
 */
export function initPlayerLevelSync(startupReconciliation) {
  if (initialized || !game.user?.isGM) return;
  initialized = true;
  Hooks.on("updateActor", actor => {
    if (actor?.type === "character" && actor.hasPlayerOwner !== false) schedulePush();
  });
  Promise.resolve(startupReconciliation).catch(error => {
    console.warn(`${MODULE_ID} | Progression XPC non synchronisée avant l’envoi des niveaux :`, error);
  }).finally(() => {
    startupFinished = true;
    schedulePush(0);
  });
}
