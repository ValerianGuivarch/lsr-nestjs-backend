const MODULE_ID = "pf2e-val-toolkit";
const SETTING_KEY = "syncCharacterPortraitToToken";

function enabled() {
  return game.settings.get(MODULE_ID, SETTING_KEY);
}

function isCharacter(actor) {
  return actor?.type === "character";
}

function isPrimaryGM() {
  if (!game.user?.isGM) return false;
  const activeGMs = game.users
    ?.filter((user) => user.active && user.isGM)
    ?.sort((a, b) => a.id.localeCompare(b.id));
  return !activeGMs?.length || activeGMs[0].id === game.user.id;
}

async function syncPlacedTokens(actor, portrait) {
  if (!portrait) return;

  for (const scene of game.scenes ?? []) {
    const updates = scene.tokens
      .filter((token) => token.actorId === actor.id && token.texture?.src !== portrait)
      .map((token) => ({
        _id: token.id,
        "texture.src": portrait
      }));

    if (updates.length) {
      await scene.updateEmbeddedDocuments("Token", updates, {
        pf2eValPortraitSync: true
      });
    }
  }
}

export async function syncActorPortraitToTokens(actor, { syncPlaced = true } = {}) {
  if (!enabled() || !isCharacter(actor) || !isPrimaryGM()) return;

  const portrait = actor.img;
  if (!portrait) return;

  if (actor.prototypeToken?.texture?.src !== portrait) {
    await actor.update(
      { "prototypeToken.texture.src": portrait },
      { pf2eValPortraitSync: true }
    );
  }

  if (syncPlaced) {
    await syncPlacedTokens(actor, portrait);
  }
}

async function syncAllCharacters() {
  if (!enabled() || !isPrimaryGM()) return;

  for (const actor of game.actors?.filter((entry) => isCharacter(entry)) ?? []) {
    await syncActorPortraitToTokens(actor);
  }
}

export function registerPortraitTokenSyncSettings() {
  game.settings.register(MODULE_ID, SETTING_KEY, {
    name: "Synchroniser portrait et token des PJ",
    hint: "Utilise le portrait de chaque Actor de type Personnage comme image de son Prototype Token et de ses tokens déjà présents sur les scènes.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: false,
    onChange: async (value) => {
      if (value && game.ready) await syncAllCharacters();
    }
  });
}

export function initPortraitTokenSync() {
  Hooks.on("updateActor", async (actor, changes, options) => {
    if (options?.pf2eValPortraitSync) return;
    if (!enabled() || !isCharacter(actor) || !isPrimaryGM()) return;

    // Only react to a real portrait change. Prototype-token-only updates must not
    // recurse into another synchronization pass.
    if (!Object.prototype.hasOwnProperty.call(changes ?? {}, "img")) return;

    await syncActorPortraitToTokens(actor);
  });

  // Bring pre-existing characters/tokens into sync once the world is ready.
  void syncAllCharacters();
}
