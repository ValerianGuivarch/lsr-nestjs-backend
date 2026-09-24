const BUY_BUTTON_CLASS = "pf2e-val-native-buy";

function getRoot(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

function isNativeMerchant(actor) {
  if (!actor || actor.type !== "loot") return false;

  return (
    actor.isMerchant === true ||
    actor.system?.lootSheetType === "Merchant"
  );
}

function ownedCharacters() {
  return (game.actors?.contents ?? [])
    .filter(actor =>
      actor.type === "character" &&
      actor.testUserPermission?.(game.user, "OWNER")
    );
}

/**
 * PF2e itself uses the character assigned to the Foundry user in many places.
 * Keep that as the unambiguous first choice. If no character is assigned, a
 * single owned character is safe. We deliberately refuse to guess when
 * several owned characters exist.
 */
export function getMerchantBuyer() {
  const assigned = game.user?.character;

  if (
    assigned?.type === "character" &&
    assigned.testUserPermission?.(game.user, "OWNER")
  ) {
    return {
      actor: assigned,
      reason: null
    };
  }

  const candidates = ownedCharacters();

  if (candidates.length === 1) {
    return {
      actor: candidates[0],
      reason: null
    };
  }

  return {
    actor: null,
    reason:
      candidates.length > 1
        ? "multiple-characters"
        : "no-character"
  };
}

function buyerWarning(reason) {
  if (reason === "multiple-characters") {
    return (
      "Plusieurs personnages vous appartiennent. " +
      "Assignez votre personnage actif à votre compte Foundry avant d'acheter."
    );
  }

  return (
    "Aucun personnage acheteur n'est associé à votre compte Foundry."
  );
}

async function buyItem(app, merchant, item, event) {
  const buyer = getMerchantBuyer();

  if (!buyer.actor) {
    ui.notifications.warn(buyerWarning(buyer.reason));
    return;
  }

  if (!item?.isOfType?.("physical")) {
    ui.notifications.warn("Cet objet ne peut pas être acheté.");
    return;
  }

  if (Number(item.quantity ?? item.system?.quantity ?? 0) < 1) {
    ui.notifications.warn("Cet objet est épuisé.");
    return;
  }

  if (
    item.isOfType("backpack") &&
    Number(item.contents?.size ?? 0) > 0
  ) {
    ui.notifications.error(
      game.i18n.localize(
        "PF2E.ErrorMessage.CantPurchaseContainerWithItems"
      )
    );
    return;
  }

  /**
   * Reuse PF2e's own merchant workflow instead of reimplementing money:
   *
   * ActorSheetPF2e.moveItemBetweenActors()
   *   -> detects sourceActor.isMerchant
   *   -> opens PF2e's native ItemTransferDialog in "purchase" mode
   *   -> lets the player choose quantity
   *   -> calls transferItemToActor(..., isPurchase=true)
   *   -> PF2e removes the buyer's coins and pays the merchant.
   *
   * The method is public at runtime in PF2e 8.3.0. A click event provides
   * everything it reads from the original drag event (target + shiftKey).
   */
  if (typeof app?.moveItemBetweenActors === "function") {
    await app.moveItemBetweenActors(event, item, buyer.actor);
    return;
  }

  // Conservative fallback if PF2e changes its sheet method in a future build:
  // one unit, still using the system's purchase-aware transfer implementation.
  if (typeof merchant.transferItemToActor === "function") {
    await merchant.transferItemToActor(
      buyer.actor,
      item,
      1,
      undefined,
      false,
      true
    );
    return;
  }

  throw new Error(
    "Aucune API PF2e de transfert marchand n'est disponible."
  );
}

function createBuyButton(app, merchant, item) {
  const buyer = getMerchantBuyer();
  const button = document.createElement("button");

  button.type = "button";
  button.className = BUY_BUTTON_CLASS;
  button.dataset.itemId = item.id;

  if (buyer.actor) {
    button.title = `Acheter pour ${buyer.actor.name}`;
  } else {
    button.title = buyerWarning(buyer.reason);
    button.classList.add("is-missing-buyer");
  }

  button.innerHTML = `
    <i class="fa-solid fa-cart-shopping" aria-hidden="true"></i>
    <span>Acheter</span>
  `;

  button.addEventListener("click", async event => {
    event.preventDefault();
    event.stopPropagation();

    if (button.disabled) return;

    button.disabled = true;

    try {
      await buyItem(app, merchant, item, event);
    } catch (error) {
      console.error(
        "PF2e Val Toolkit | Achat marchand natif",
        error
      );

      ui.notifications.error(
        "L'achat n'a pas pu être effectué."
      );
    } finally {
      button.disabled = false;
    }
  });

  return button;
}

function injectBuyButtons(app, html) {
  if (game.user?.isGM) return;

  const merchant = app?.actor;
  if (!isNativeMerchant(merchant)) return;

  const root = getRoot(html);
  if (!root) return;

  for (const row of root.querySelectorAll(
    ".inventory-list li[data-item-id]"
  )) {
    if (row.querySelector(`.${BUY_BUTTON_CLASS}`)) continue;

    const itemId = row.dataset.itemId;
    const item = merchant.items?.get?.(itemId);

    if (!item?.isOfType?.("physical")) continue;

    const itemName = row.querySelector(":scope > .data > .item-name")
      ?? row.querySelector(".data > .item-name");

    if (!itemName) continue;

    itemName.append(
      createBuyButton(app, merchant, item)
    );
  }
}

export const nativeMerchantPatch = {
  id: "native-merchant-buy",
  label: "Marchands PF2e natifs — bouton Acheter",
  enabled: true,

  init() {
    Hooks.on("renderActorSheet", injectBuyButtons);

    game.pf2eValToolkit ??= {};
    game.pf2eValToolkit.nativeMerchant = {
      getBuyer: getMerchantBuyer,
      isMerchant: isNativeMerchant
    };

    return game.pf2eValToolkit.nativeMerchant;
  }
};
