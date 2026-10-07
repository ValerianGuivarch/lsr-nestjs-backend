const MODULE_ID = "pf2e-val-toolkit";
const SETTING = "activeParty.actorIds";

function escapeHtml(value) {
  return foundry.utils.escapeHTML(String(value ?? ""));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function selectedCharacterActors() {
  return unique(
    (canvas.tokens?.controlled ?? [])
      .map((token) => token.actor)
      .filter((actor) => actor?.type === "character")
      .map((actor) => actor.id)
  );
}

function getActorIds() {
  return unique(game.settings.get(MODULE_ID, SETTING) ?? []);
}

function getActors() {
  return getActorIds()
    .map((id) => game.actors.get(id))
    .filter((actor) => actor?.type === "character");
}

function getLevels() {
  return getActors().map((actor) => Number(actor.system?.details?.level?.value ?? 0));
}

function getTokens(scene = canvas.scene) {
  if (!scene) return [];
  const ids = new Set(getActorIds());
  return scene.tokens.filter((token) => ids.has(token.actorId));
}

async function setActorIds(actorIds) {
  if (!game.user?.isGM) {
    ui.notifications.warn("Seul le MJ peut modifier le groupe actif.");
    return [];
  }

  const ids = unique(actorIds)
    .map((id) => game.actors.get(id))
    .filter((actor) => actor?.type === "character")
    .map((actor) => actor.id);

  await game.settings.set(MODULE_ID, SETTING, ids);
  refreshControls();
  return getActors();
}

async function setFromSelected() {
  const ids = selectedCharacterActors();
  if (!ids.length) {
    ui.notifications.warn("Sélectionnez au moins un token de PJ.");
    return [];
  }

  const actors = await setActorIds(ids);
  ui.notifications.info(
    `Groupe actif défini : ${actors.map((actor) => actor.name).join(", ")}.`
  );
  return actors;
}

async function clearActiveParty() {
  await setActorIds([]);
  ui.notifications.info("Groupe actif vidé.");
}

function selectTokens() {
  const tokens = getTokens();
  if (!tokens.length) {
    ui.notifications.warn("Aucun membre du groupe actif n est présent sur cette scène.");
    return [];
  }

  canvas.tokens?.releaseAll?.();
  for (const document of tokens) {
    document.object?.control?.({ releaseOthers: false });
  }
  return tokens;
}

function placementData(actor, x, y) {
  const prototype = actor.prototypeToken?.toObject?.() ?? foundry.utils.deepClone(actor.prototypeToken ?? {});
  delete prototype._id;
  prototype.actorId = actor.id;
  prototype.actorLink = true;
  prototype.x = x;
  prototype.y = y;
  prototype.hidden = false;
  return prototype;
}

async function placeMissingTokens() {
  if (!game.user?.isGM || !canvas.scene) return [];

  const actors = getActors();
  if (!actors.length) {
    ui.notifications.warn("Aucun groupe actif n'est défini.");
    return [];
  }

  const present = new Set(canvas.scene.tokens.map((token) => token.actorId));
  const missing = actors.filter((actor) => !present.has(actor.id));
  if (!missing.length) {
    ui.notifications.info("Tous les membres du groupe actif sont déjà sur la scène.");
    return [];
  }

  const gridSize = canvas.scene.grid?.size ?? 100;
  const center = canvas.dimensions?.sceneRect?.center ?? {
    x: (canvas.scene.width ?? gridSize * 10) / 2,
    y: (canvas.scene.height ?? gridSize * 10) / 2
  };
  const columns = Math.ceil(Math.sqrt(missing.length));
  const startX = center.x - ((columns - 1) * gridSize) / 2;
  const rows = Math.ceil(missing.length / columns);
  const startY = center.y - ((rows - 1) * gridSize) / 2;

  const data = missing.map((actor, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return placementData(
      actor,
      Math.round(startX + column * gridSize),
      Math.round(startY + row * gridSize)
    );
  });

  const created = await canvas.scene.createEmbeddedDocuments("Token", data);
  ui.notifications.info(`${created.length} membre(s) du groupe actif placé(s).`);
  return created;
}

function partySummaryHtml() {
  const actors = getActors();
  if (!actors.length) {
    return '<p class="pf2e-val-active-party-empty">Aucun groupe actif défini.</p>';
  }

  return `
    <div class="pf2e-val-active-party-list">
      ${actors.map((actor) => {
        const level = Number(actor.system?.details?.level?.value ?? 0);
        return `
          <div class="pf2e-val-active-party-member">
            <img src="${escapeHtml(actor.img)}" alt="" width="28" height="28" style="width:28px!important;height:28px!important;min-width:28px!important;max-width:28px!important;min-height:28px!important;max-height:28px!important;object-fit:cover!important">
            <span>${escapeHtml(actor.name)}</span>
            <strong>Niv. ${level}</strong>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

async function openManager() {
  if (!game.user?.isGM) return;

  const DialogV2 = foundry.applications?.api?.DialogV2;
  if (!DialogV2) {
    ui.notifications.warn("Cette interface nécessite Foundry V14.");
    return;
  }

  const selected = selectedCharacterActors()
    .map((id) => game.actors.get(id))
    .filter(Boolean);

  const result = await DialogV2.wait({
    window: { title: "Groupe actif de la séance" },
    classes: ["pf2e-val-active-party-dialog"],
    content: `
      <section class="pf2e-val-active-party">
        <h3>Groupe actif</h3>
        ${partySummaryHtml()}
        <p class="hint">
          Ce groupe est conservé entre les scènes. Les outils d'improvisation l'utiliseront
          automatiquement pour le nombre de PJ et leurs niveaux.
        </p>
        <hr>
        <p><strong>Sélection actuelle :</strong> ${selected.length
          ? selected.map((actor) => escapeHtml(actor.name)).join(", ")
          : "aucun PJ sélectionné"}</p>
      </section>
    `,
    buttons: [
      {
        action: "selected",
        label: "Utiliser les tokens sélectionnés",
        icon: "fa-solid fa-users",
        default: selected.length > 0,
        callback: () => "selected"
      },
      {
        action: "select",
        label: "Sélectionner sur la scène",
        icon: "fa-solid fa-object-group",
        callback: () => "select"
      },
      {
        action: "place",
        label: "Placer les absents",
        icon: "fa-solid fa-location-dot",
        callback: () => "place"
      },
      {
        action: "clear",
        label: "Vider",
        icon: "fa-solid fa-trash",
        callback: () => "clear"
      },
      {
        action: "close",
        label: "Fermer",
        icon: "fa-solid fa-xmark",
        callback: () => null
      }
    ],
    close: () => null
  });

  if (result === "selected") await setFromSelected();
  else if (result === "select") selectTokens();
  else if (result === "place") await placeMissingTokens();
  else if (result === "clear") await clearActiveParty();
}

function refreshControls() {
  try {
    ui.controls?.render?.({ force: true });
  } catch {
    // Rendering is optional; the persisted group is already updated.
  }
}

function registerSceneControl() {
  Hooks.on("getSceneControlButtons", (controls) => {
    if (!game.user?.isGM || !controls.tokens?.tools) return;

    const actors = getActors();
    const label = actors.length
      ? `Groupe actif (${actors.length}) : ${actors.map((actor) => actor.name).join(", ")}`
      : "Groupe actif : aucun PJ";

    controls.tokens.tools.pf2eValActiveParty = {
      name: "pf2eValActiveParty",
      title: label,
      icon: "fa-solid fa-users",
      order: Object.keys(controls.tokens.tools).length,
      button: true,
      visible: true,
      onChange: () => void openManager()
    };
  });
}

export function registerActivePartySettings() {
  game.settings.register(MODULE_ID, SETTING, {
    scope: "world",
    config: false,
    type: Array,
    default: [],
    onChange: () => refreshControls()
  });
}

export function initActiveParty() {
  registerSceneControl();

  game.pf2eValToolkit ??= {};
  game.pf2eValToolkit.activeParty = {
    getActorIds,
    getActors,
    getLevels,
    getTokens,
    setActorIds,
    setFromSelected,
    clear: clearActiveParty,
    selectTokens,
    placeMissingTokens,
    openManager
  };
}
