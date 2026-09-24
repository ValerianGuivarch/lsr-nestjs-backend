const TOOLKIT_ID = "pf2e-val-toolkit";
const MERCHANT_MODULE_ID = "pf2e-cinematic-merchant";
const WRAP_MARKER = Symbol.for("pf2eValToolkit.merchantTokenWrapped");
const OBSERVER = CONST?.DOCUMENT_OWNERSHIP_LEVELS?.OBSERVER ?? 2;

function hasShift(event) {
  return Boolean(
    event?.shiftKey ??
    event?.nativeEvent?.shiftKey ??
    event?.originalEvent?.shiftKey
  );
}

function normalizeName(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[’]/g, "'")
    .trim()
    .toLocaleLowerCase("fr");
}

function isKnownEmber(actor) {
  const name = normalizeName(actor?.name);
  return name === "ember" || name === "boutique d'ember";
}

function isConfiguredMerchant(actor) {
  if (!actor || actor.type !== "loot") return false;

  const explicit = actor.getFlag?.(TOOLKIT_ID, "merchantToken");

  if (explicit === true) return true;
  if (explicit === false) return false;

  // Backward compatibility with Ember, including the renamed Actor requested
  // for the player-facing shop title.
  return isKnownEmber(actor);
}

function merchantApi() {
  const module = game.modules.get(MERCHANT_MODULE_ID);

  if (!module?.active) return null;
  if (typeof module.api?.openMerchant !== "function") return null;

  return module.api;
}

function pickViewerActor() {
  if (game.user.isGM) return null;

  const assigned = game.user.character;
  if (assigned?.type === "character") return assigned;

  return (
    game.actors?.find?.(
      actor =>
        actor.type === "character" &&
        actor.testUserPermission?.(game.user, "OWNER")
    ) ?? null
  );
}

function localized(key, fallback, data = null) {
  const value = data
    ? game.i18n.format(key, data)
    : game.i18n.localize(key);

  return value && value !== key ? value : fallback;
}

function escapeHTML(value) {
  const element = document.createElement("div");
  element.textContent = String(value ?? "");
  return element.innerHTML;
}

function refreshViewerBadge(root = document) {
  if (game.user.isGM) {
    root
      .querySelectorAll?.(".pf2e-val-merchant-viewer")
      ?.forEach?.(node => node.remove());
    return;
  }

  const merchantRoot = root.querySelector?.("#pf2e-cd-mer-root");
  if (!merchantRoot?.classList?.contains("is-active")) return;

  const header = merchantRoot.querySelector(".pf2e-cd-mer-header");
  if (!header) return;

  const viewer = pickViewerActor();

  let badge = header.querySelector(".pf2e-val-merchant-viewer");
  if (!badge) {
    badge = document.createElement("div");
    badge.className = "pf2e-val-merchant-viewer";
    header.appendChild(badge);
  }

  badge.classList.toggle("is-missing", !viewer);

  if (viewer) {
    badge.title = localized(
      "PF2E_VAL_TOOLKIT.merchant.viewerHint",
      "Les achats sont payés par ce personnage et ajoutés à son inventaire."
    );

    badge.innerHTML = `
      <i class="fa-solid fa-user"></i>
      <span>${escapeHTML(
        localized(
          "PF2E_VAL_TOOLKIT.merchant.buyFor",
          "Achat pour : {name}",
          { name: viewer.name }
        )
      )}</span>
    `;
  } else {
    badge.title = localized(
      "PF2E_VAL_TOOLKIT.merchant.noViewerHint",
      "Assignez un personnage à ce compte Foundry, ou donnez-lui la propriété d'un personnage."
    );

    badge.innerHTML = `
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span>${escapeHTML(
        localized(
          "PF2E_VAL_TOOLKIT.merchant.noViewer",
          "Aucun personnage associé"
        )
      )}</span>
    `;
  }
}

function scheduleViewerBadge() {
  if (game.user.isGM) return;

  // PF2e Merchant mounts its overlay lazily. Try a few times after open()
  // instead of watching the entire Foundry DOM. The previous MutationObserver
  // rewrote badge.innerHTML in response to its own childList mutation and
  // could create an infinite render loop on player clients.
  const delays = [0, 50, 150, 350, 750];

  for (const delay of delays) {
    setTimeout(() => {
      try {
        refreshViewerBadge(document);
      } catch (error) {
        console.warn(
          "PF2e Val Toolkit | Impossible d'afficher le personnage acheteur",
          error
        );
      }
    }, delay);
  }
}

function safeOwnership(actor) {
  const current =
    foundry.utils?.deepClone?.(actor.ownership ?? {}) ??
    foundry.utils.duplicate(actor.ownership ?? {});

  current.default = OBSERVER;

  for (const user of game.users ?? []) {
    if (user.isGM) continue;
    current[user.id] = OBSERVER;
  }

  return current;
}

async function enforceSafeMerchantOwnership(actor) {
  if (!game.user.isGM || !isConfiguredMerchant(actor)) return actor;

  const next = safeOwnership(actor);
  const current = actor.ownership ?? {};

  const same =
    Number(current.default ?? 0) === OBSERVER &&
    (game.users ?? [])
      .filter(user => !user.isGM)
      .every(user => Number(current[user.id] ?? current.default ?? 0) === OBSERVER);

  if (same) return actor;

  await actor.update(
    { ownership: next },
    {
      diff: false,
      pf2eValToolkitMerchantOwnership: true
    }
  );

  return actor;
}

function sanitizeOwnershipChange(actor, changes) {
  if (!isConfiguredMerchant(actor)) return;
  if (!changes || typeof changes !== "object") return;

  // PF2e Merchant currently promotes merchant permissions to OWNER when a GM
  // opens the shop. Toolkit merchants stay OBSERVER for players, so purchases
  // use PF2e Merchant's existing GM relay path instead.
  if (changes.ownership && typeof changes.ownership === "object") {
    changes.ownership.default = OBSERVER;

    for (const user of game.users ?? []) {
      if (user.isGM) continue;
      changes.ownership[user.id] = OBSERVER;
    }
  }

  if (Object.prototype.hasOwnProperty.call(changes, "ownership.default")) {
    changes["ownership.default"] = OBSERVER;
  }

  for (const user of game.users ?? []) {
    if (user.isGM) continue;

    const key = `ownership.${user.id}`;
    if (Object.prototype.hasOwnProperty.call(changes, key)) {
      changes[key] = OBSERVER;
    }
  }
}

function installOwnershipGuard() {
  Hooks.on("preUpdateActor", (actor, changes) => {
    sanitizeOwnershipChange(actor, changes);
  });
}

function openMerchant(actor) {
  const api = merchantApi();

  if (!api) {
    ui.notifications.warn(
      "PF2e Merchant n'est pas disponible : ouverture de la fiche normale."
    );
    return false;
  }

  try {
    if (game.user.isGM) {
      // The preUpdateActor guard also blocks PF2e Merchant's automatic
      // escalation back to OWNER when this window opens.
      void enforceSafeMerchantOwnership(actor);
    }

    api.openMerchant(actor);

    scheduleViewerBadge();

    return true;
  } catch (error) {
    console.error(
      "PF2e Val Toolkit | Impossible d'ouvrir PF2e Merchant",
      error
    );

    ui.notifications.error(
      "Impossible d'ouvrir la boutique PF2e Merchant."
    );

    return false;
  }
}

function installTokenDoubleClickPatch() {
  const TokenClass = foundry?.canvas?.placeables?.Token ?? globalThis.Token;

  if (!TokenClass?.prototype?._onClickLeft2) {
    throw new Error("Token._onClickLeft2 est introuvable.");
  }

  const current = TokenClass.prototype._onClickLeft2;

  if (current[WRAP_MARKER]) return;

  function merchantTokenDoubleClick(event) {
    const actor = this.actor;

    if (!isConfiguredMerchant(actor)) {
      return current.call(this, event);
    }

    // GM escape hatch: Shift + double-click keeps the normal Actor sheet.
    if (game.user.isGM && hasShift(event)) {
      return current.call(this, event);
    }

    if (openMerchant(actor)) {
      return;
    }

    return current.call(this, event);
  }

  merchantTokenDoubleClick[WRAP_MARKER] = true;
  TokenClass.prototype._onClickLeft2 = merchantTokenDoubleClick;
}

async function configureKnownMerchant() {
  if (!game.user.isGM) return;

  const ember = game.actors?.find?.(
    actor => actor.type === "loot" && isKnownEmber(actor)
  );

  if (!ember) return;

  if (ember.getFlag?.(TOOLKIT_ID, "merchantToken") !== true) {
    await ember.setFlag(TOOLKIT_ID, "merchantToken", true);
  }

  await enforceSafeMerchantOwnership(ember);
}

function exposeApi() {
  game.pf2eValToolkit ??= {};

  game.pf2eValToolkit.merchantTokens = {
    isEnabled(actor) {
      return isConfiguredMerchant(actor);
    },

    open(actor) {
      return openMerchant(actor);
    },

    async enable(actor) {
      if (!actor) throw new Error("Actor manquant.");

      await actor.setFlag(TOOLKIT_ID, "merchantToken", true);
      await enforceSafeMerchantOwnership(actor);

      return actor;
    },

    async disable(actor) {
      if (!actor) throw new Error("Actor manquant.");

      // Explicit false disables even the Ember compatibility fallback.
      await actor.setFlag(TOOLKIT_ID, "merchantToken", false);

      return actor;
    },

    async secure(actor) {
      if (!actor) throw new Error("Actor manquant.");
      return enforceSafeMerchantOwnership(actor);
    },

    viewer() {
      return pickViewerActor();
    }
  };
}

export const merchantTokenPatch = {
  id: "merchant-token",
  label: "PF2e Merchant sécurisé sur Token",
  enabled: true,

  init() {
    installOwnershipGuard();
    installTokenDoubleClickPatch();
    exposeApi();

    void configureKnownMerchant();

    return game.pf2eValToolkit.merchantTokens;
  }
};
