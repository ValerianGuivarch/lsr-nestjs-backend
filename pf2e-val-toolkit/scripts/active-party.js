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

let placementInProgress = false;

function choosePlacementPoint(scene) {
  return new Promise((resolve) => {
    const stage = canvas.stage;
    if (!stage?.on || !stage?.off) {
      ui.notifications.warn("Impossible de sélectionner un point sur la scène.");
      resolve(null);
      return;
    }
    let finished = false;
    let hookId;
    const finish = (point) => {
      if (finished) return;
      finished = true;
      stage.off("pointerdown", onClick);
      stage.off("rightdown", onCancel);
      window.removeEventListener("keydown", onKeyDown, true);
      if (hookId !== undefined) Hooks.off("canvasTearDown", hookId);
      resolve(point);
    };
    const onCancel = () => finish(null);
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      finish(null);
    };
    const onClick = (event) => {
      if (canvas.scene?.id !== scene.id || event.button !== 0) return;
      const point = event.getLocalPosition?.(stage) ?? stage.toLocal(event.global);
      const rect = canvas.dimensions?.sceneRect;
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
      if (rect && (point.x < rect.x || point.y < rect.y ||
        point.x >= rect.x + rect.width || point.y >= rect.y + rect.height)) {
        ui.notifications.warn("Cliquez à l'intérieur de la scène.");
        return;
      }
      finish({ x: point.x, y: point.y });
    };
    stage.on("pointerdown", onClick);
    stage.on("rightdown", onCancel);
    window.addEventListener("keydown", onKeyDown, true);
    hookId = Hooks.on("canvasTearDown", onCancel);
    ui.notifications.info("Cliquez sur la scène pour placer les PJ (Échap ou clic droit pour annuler).");
  });
}

function partyPlacementData(scene, actors, point) {
  const size = scene.grid?.size || 100;
  const columns = Math.ceil(Math.sqrt(actors.length));
  const rows = Math.ceil(actors.length / columns);
  const rect = canvas.dimensions?.sceneRect ?? {
    x: 0, y: 0, width: scene.width, height: scene.height
  };
  const maxX = Math.max(rect.x, rect.x + rect.width - columns * size);
  const maxY = Math.max(rect.y, rect.y + rect.height - rows * size);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  let x = clamp(point.x - columns * size / 2, rect.x, maxX);
  let y = clamp(point.y - rows * size / 2, rect.y, maxY);
  if (scene.grid?.type !== 0) {
    x = rect.x + Math.round((x - rect.x) / size) * size;
    y = rect.y + Math.round((y - rect.y) / size) * size;
  }
  x = clamp(x, rect.x, maxX);
  y = clamp(y, rect.y, maxY);
  return actors.map((actor, index) =>
    placementData(actor, Math.round(x + (index % columns) * size),
      Math.round(y + Math.floor(index / columns) * size))
  );
}

async function placeMissingTokens() {
  if (!game.user?.isGM || !canvas.scene || placementInProgress) return [];
  const scene = canvas.scene;
  const actors = getActors();
  if (!actors.length) {
    ui.notifications.warn("Aucun groupe actif n'est défini.");
    return [];
  }
  const present = new Set(scene.tokens.map((token) => token.actorId));
  const missing = actors.filter((actor) => !present.has(actor.id));
  if (!missing.length) {
    ui.notifications.info("Tous les membres du groupe actif sont déjà sur la scène.");
    return [];
  }
  placementInProgress = true;
  try {
    const point = await choosePlacementPoint(scene);
    if (!point || canvas.scene?.id !== scene.id) return [];
    const current = new Set(scene.tokens.map((token) => token.actorId));
    const remaining = missing.filter((actor) => !current.has(actor.id));
    if (!remaining.length) return [];
    const created = await scene.createEmbeddedDocuments(
      "Token", partyPlacementData(scene, remaining, point)
    );
    ui.notifications.info(created.length + " membre(s) du groupe actif placé(s).");
    return created;
  } finally {
    placementInProgress = false;
  }
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
        label: "Placer les absents sur la scène",
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
