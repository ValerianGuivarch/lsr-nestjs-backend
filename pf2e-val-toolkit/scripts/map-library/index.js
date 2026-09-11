const MODULE_ID = "pf2e-val-toolkit";
const TOKEN_FLAG = "mapLibrary";
const WRAP_MARKER = Symbol.for("pf2e-val-toolkit.map-library.token-double-click");

const MAPS = [
  { id: "world", label: "Monde", setting: "mapLibraryWorldPath" },
  { id: "inner-sea", label: "Mer Intérieure", setting: "mapLibraryInnerSeaPath" },
  { id: "kortos", label: "Île de Kortos", setting: "mapLibraryKortosPath" },
  { id: "absalom", label: "Absalom", setting: "mapLibraryAbsalomPath" }
];

function escapeHtml(value) {
  return foundry.utils.escapeHTML(String(value ?? ""));
}

function configuredMaps() {
  return MAPS.map(entry => ({
    ...entry,
    path: String(game.settings.get(MODULE_ID, entry.setting) ?? "").trim()
  })).filter(entry => entry.path);
}

function registerPathSetting(setting, name, hint) {
  game.settings.register(MODULE_ID, setting, {
    name,
    hint,
    scope: "world",
    config: true,
    type: String,
    default: "",
    restricted: true
  });
}

export function registerMapLibrarySettings() {
  registerPathSetting(
    "mapLibraryWorldPath",
    "Bibliothèque de cartes — Monde",
    "Chemin Foundry de la carte du monde."
  );

  registerPathSetting(
    "mapLibraryInnerSeaPath",
    "Bibliothèque de cartes — Mer Intérieure",
    "Chemin Foundry de la carte de la Mer Intérieure."
  );

  registerPathSetting(
    "mapLibraryKortosPath",
    "Bibliothèque de cartes — Île de Kortos",
    "Chemin Foundry de la carte de l'île de Kortos."
  );

  registerPathSetting(
    "mapLibraryAbsalomPath",
    "Bibliothèque de cartes — Absalom",
    "Chemin Foundry de la carte d'Absalom."
  );
}

let activeMapOverlay = null;

function closeActiveMapOverlay() {
  const current = activeMapOverlay;
  activeMapOverlay = null;

  if (!current) return;

  document.removeEventListener("keydown", current.onKeyDown);
  current.element.remove();
}

async function openMap(entry) {
  closeActiveMapOverlay();

  const overlay = document.createElement("div");
  overlay.className = "pf2e-val-map-overlay";

  overlay.innerHTML = `
    <div class="pf2e-val-map-overlay-header">
      <strong>${escapeHtml(entry.label)}</strong>

      <div class="pf2e-val-map-overlay-tools">
        <button type="button" data-map-zoom-out title="Dézoomer">
          <i class="fa-solid fa-minus"></i>
        </button>

        <button type="button" data-map-fit>
          Ajuster
        </button>

        <button type="button" data-map-100>
          100 %
        </button>

        <button type="button" data-map-zoom-in title="Zoomer">
          <i class="fa-solid fa-plus"></i>
        </button>

        <span data-map-zoom-label></span>

        <button type="button" data-map-close title="Fermer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>

    <div class="pf2e-val-map-overlay-scroll" data-map-scroll>
      <div class="pf2e-val-map-overlay-stage">
        <img
          src="${escapeHtml(entry.path)}"
          alt="${escapeHtml(entry.label)}"
          draggable="false"
          data-map-image
        >
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const scroll = overlay.querySelector("[data-map-scroll]");
  const image = overlay.querySelector("[data-map-image]");
  const label = overlay.querySelector("[data-map-zoom-label]");

  let zoom = 1;

  const updateLabel = () => {
    label.textContent = `${Math.round(zoom * 100)} %`;
  };

  const applyZoom = (nextZoom, preserveCenter = true) => {
    if (!image.naturalWidth || !image.naturalHeight) return;

    let relativeX = 0.5;
    let relativeY = 0.5;

    if (preserveCenter && image.offsetWidth && image.offsetHeight) {
      relativeX = (
        scroll.scrollLeft +
        scroll.clientWidth / 2 -
        image.offsetLeft
      ) / image.offsetWidth;

      relativeY = (
        scroll.scrollTop +
        scroll.clientHeight / 2 -
        image.offsetTop
      ) / image.offsetHeight;
    }

    zoom = Math.max(0.05, Math.min(nextZoom, 5));

    image.style.width =
      `${Math.round(image.naturalWidth * zoom)}px`;

    image.style.height =
      `${Math.round(image.naturalHeight * zoom)}px`;

    updateLabel();

    if (preserveCenter) {
      requestAnimationFrame(() => {
        scroll.scrollLeft =
          image.offsetLeft +
          image.offsetWidth * relativeX -
          scroll.clientWidth / 2;

        scroll.scrollTop =
          image.offsetTop +
          image.offsetHeight * relativeY -
          scroll.clientHeight / 2;
      });
    }
  };

  /*
   * Affichage initial :
   * toute la carte doit être visible,
   * en utilisant le maximum de place disponible.
   */
  const fitWholeMap = () => {
    if (!image.naturalWidth || !image.naturalHeight) return;

    const availableWidth = Math.max(
      scroll.clientWidth - 32,
      200
    );

    const availableHeight = Math.max(
      scroll.clientHeight - 32,
      200
    );

    const scale = Math.min(
      availableWidth / image.naturalWidth,
      availableHeight / image.naturalHeight,
      1.5
    );

    applyZoom(scale, false);

    requestAnimationFrame(() => {
      scroll.scrollLeft = Math.max(
        0,
        (scroll.scrollWidth - scroll.clientWidth) / 2
      );

      scroll.scrollTop = Math.max(
        0,
        (scroll.scrollHeight - scroll.clientHeight) / 2
      );
    });
  };

  if (image.complete && image.naturalWidth) {
    requestAnimationFrame(fitWholeMap);
  } else {
    image.addEventListener(
      "load",
      () => requestAnimationFrame(fitWholeMap),
      { once: true }
    );
  }

  overlay
    .querySelector("[data-map-zoom-in]")
    .addEventListener("click", () => {
      applyZoom(zoom * 1.25);
    });

  overlay
    .querySelector("[data-map-zoom-out]")
    .addEventListener("click", () => {
      applyZoom(zoom / 1.25);
    });

  overlay
    .querySelector("[data-map-fit]")
    .addEventListener("click", fitWholeMap);

  overlay
    .querySelector("[data-map-100]")
    .addEventListener("click", () => {
      applyZoom(1);
    });

  overlay
    .querySelector("[data-map-close]")
    .addEventListener("click", closeActiveMapOverlay);

  /*
   * Molette normale = défilement.
   * Ctrl/Cmd + molette = zoom.
   */
  scroll.addEventListener(
    "wheel",
    event => {
      if (!event.ctrlKey && !event.metaKey) return;

      event.preventDefault();

      applyZoom(
        event.deltaY < 0
          ? zoom * 1.12
          : zoom / 1.12
      );
    },
    { passive: false }
  );

  /*
   * Bonus : cliquer-glisser permet aussi
   * de déplacer la carte lorsqu'elle est zoomée.
   */
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  scroll.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;

    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    startLeft = scroll.scrollLeft;
    startTop = scroll.scrollTop;

    scroll.setPointerCapture(event.pointerId);
    scroll.classList.add("is-panning");
  });

  scroll.addEventListener("pointermove", event => {
    if (!dragging) return;

    scroll.scrollLeft =
      startLeft - (event.clientX - startX);

    scroll.scrollTop =
      startTop - (event.clientY - startY);
  });

  const stopDragging = event => {
    dragging = false;
    scroll.classList.remove("is-panning");

    try {
      scroll.releasePointerCapture(event.pointerId);
    } catch {
      // rien
    }
  };

  scroll.addEventListener("pointerup", stopDragging);
  scroll.addEventListener("pointercancel", stopDragging);

  const onKeyDown = event => {
    if (event.key === "Escape") {
      closeActiveMapOverlay();
    }
  };

  document.addEventListener("keydown", onKeyDown);

  activeMapOverlay = {
    element: overlay,
    onKeyDown
  };
}

function libraryContent(maps) {
  return `
    <div class="pf2e-val-map-library-menu">
      ${maps.map(entry => `
        <button
          type="button"
          class="pf2e-val-map-library-entry"
          data-map-id="${escapeHtml(entry.id)}"
        >
          <i class="fa-solid fa-map"></i>
          <span>${escapeHtml(entry.label)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

async function openLibraryDialog() {
  const maps = configuredMaps();

  if (!maps.length) {
    ui.notifications.warn(
      "Aucune carte n'est configurée. Renseignez les chemins dans Configuration du jeu > Paramètres du module > PF2e Val Toolkit."
    );
    return;
  }

  const DialogV2 = foundry.applications?.api?.DialogV2;

  if (!DialogV2?.wait) {
    const choice = window.prompt(
      `Carte à ouvrir :\n${maps.map((entry, index) => `${index + 1}. ${entry.label}`).join("\n")}`,
      "1"
    );

    if (choice === null) return;

    const map = maps[Number.parseInt(choice, 10) - 1];
    if (map) await openMap(map);
    return;
  }

  await DialogV2.wait({
    window: {
      title: "Cartes du monde",
      resizable: false
    },

    position: {
      width: 420,
      height: "auto"
    },

    content: libraryContent(maps),

    buttons: [
      {
        action: "close",
        label: "Fermer",
        icon: "fa-solid fa-xmark"
      }
    ],

    render: (_event, dialog) => {
      const element = dialog?.element ?? dialog;

      element?.querySelectorAll?.("[data-map-id]").forEach(button => {
        button.addEventListener("click", () => {
          const map = maps.find(entry => entry.id === button.dataset.mapId);
          if (!map) return;

          try {
            dialog.close?.();
          } catch {
            // rien
          }

          window.setTimeout(() => {
            void openMap(map);
          }, 100);
        });
      });
    },

    close: () => null
  });
}

function isMapLibraryToken(token) {
  return token?.document?.getFlag?.(MODULE_ID, TOKEN_FLAG) === true;
}

function installTokenDoubleClickPatch() {
  const TokenClass = foundry?.canvas?.placeables?.Token ?? globalThis.Token;

  if (!TokenClass?.prototype?._onClickLeft2) {
    throw new Error("Token._onClickLeft2 est introuvable.");
  }

  const current = TokenClass.prototype._onClickLeft2;

  if (current[WRAP_MARKER]) return;

  function mapLibraryTokenDoubleClick(event) {
    if (!isMapLibraryToken(this)) {
      return current.call(this, event);
    }

    const original = event?.originalEvent ?? event;

    if (game.user?.isGM && original?.shiftKey) {
      return current.call(this, event);
    }

    void openLibraryDialog();
    return undefined;
  }

  mapLibraryTokenDoubleClick[WRAP_MARKER] = true;
  TokenClass.prototype._onClickLeft2 = mapLibraryTokenDoubleClick;
}

async function setSelectedTokenEnabled(enabled) {
  if (!game.user?.isGM) {
    ui.notifications.warn(
      "Seul le MJ peut configurer un token Bibliothèque de cartes."
    );
    return false;
  }

  const controlled = canvas.tokens?.controlled ?? [];

  if (controlled.length !== 1) {
    ui.notifications.warn("Sélectionnez exactement un token.");
    return false;
  }

  const token = controlled[0];

  await token.document.setFlag(
    MODULE_ID,
    TOKEN_FLAG,
    Boolean(enabled)
  );

  ui.notifications.info(
    enabled
      ? `« ${token.name} » ouvre maintenant la Bibliothèque de cartes au double-clic.`
      : `Bibliothèque de cartes désactivée pour « ${token.name} ».`
  );

  return true;
}

async function toggleSelectedToken() {
  const controlled = canvas.tokens?.controlled ?? [];

  if (controlled.length !== 1) {
    ui.notifications.warn("Sélectionnez exactement un token.");
    return false;
  }

  return setSelectedTokenEnabled(
    !isMapLibraryToken(controlled[0])
  );
}

function exposeApi() {
  game.pf2eValToolkit ??= {};

  game.pf2eValToolkit.mapLibrary = {
    open: openLibraryDialog,
    maps: configuredMaps,
    enableSelectedToken: () => setSelectedTokenEnabled(true),
    disableSelectedToken: () => setSelectedTokenEnabled(false),
    toggleSelectedToken,
    isEnabled: isMapLibraryToken
  };
}

export function initMapLibrary() {
  try {
    installTokenDoubleClickPatch();
    exposeApi();
  } catch (error) {
    console.error(
      "PF2e Val Toolkit | Bibliothèque de cartes non initialisée",
      error
    );

    ui.notifications.error(
      "PF2e Val Toolkit : impossible d'initialiser la Bibliothèque de cartes."
    );
  }
}
