const DEFAULT_GRID_SIZE = 100;
const DEFAULT_WIDTH_CELLS = 20;
const DEFAULT_HEIGHT_CELLS = 16;

function getSelectedTokenDocuments() {
  return (canvas.tokens?.controlled ?? [])
    .map(token => token.document)
    .filter(Boolean);
}

function escapeHtml(value) {
  return foundry.utils.escapeHTML(String(value ?? ""));
}

function clampCells(value, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(100, Math.max(5, number));
}

function defaultSceneName(tokens) {
  if (tokens.length === 1) {
    return `Combat — ${tokens[0].actor?.name ?? tokens[0].name}`;
  }
  return "Combat rapide";
}

async function promptFallback(defaultName) {
  const name = window.prompt("Nom de la scène", defaultName);
  if (name === null) return null;

  const widthCells = window.prompt(
    "Largeur en cases",
    String(DEFAULT_WIDTH_CELLS)
  );
  if (widthCells === null) return null;

  const heightCells = window.prompt(
    "Hauteur en cases",
    String(DEFAULT_HEIGHT_CELLS)
  );
  if (heightCells === null) return null;

  return {
    name: name.trim() || defaultName,
    widthCells: clampCells(widthCells, DEFAULT_WIDTH_CELLS),
    heightCells: clampCells(heightCells, DEFAULT_HEIGHT_CELLS)
  };
}

async function askSceneOptions(tokens) {
  const defaultName = defaultSceneName(tokens);
  const DialogV2 = foundry.applications?.api?.DialogV2;

  if (!DialogV2?.wait) return promptFallback(defaultName);

  return DialogV2.wait({
    window: { title: "Créer une scène de combat rapide" },
    content: `
      <form class="pf2e-val-quick-scene-form">
        <div class="form-group">
          <label>Nom</label>
          <div class="form-fields">
            <input type="text" name="name" value="${escapeHtml(defaultName)}">
          </div>
        </div>
        <div class="form-group">
          <label>Largeur</label>
          <div class="form-fields">
            <input type="number" name="widthCells" value="${DEFAULT_WIDTH_CELLS}" min="5" max="100" step="1">
            <span class="units">cases</span>
          </div>
        </div>
        <div class="form-group">
          <label>Hauteur</label>
          <div class="form-fields">
            <input type="number" name="heightCells" value="${DEFAULT_HEIGHT_CELLS}" min="5" max="100" step="1">
            <span class="units">cases</span>
          </div>
        </div>
        <p class="hint">
          Scène vide, sans murs ni gestion de vision. Les tokens sélectionnés seront placés au centre.
        </p>
      </form>
    `,
    buttons: [
      {
        action: "create",
        label: "Créer",
        icon: "fa-solid fa-map",
        default: true,
        callback: (_event, button) => {
          const form = button.form;
          const data = Object.fromEntries(new FormData(form).entries());

          return {
            name: String(data.name ?? "").trim() || defaultName,
            widthCells: clampCells(data.widthCells, DEFAULT_WIDTH_CELLS),
            heightCells: clampCells(data.heightCells, DEFAULT_HEIGHT_CELLS)
          };
        }
      },
      {
        action: "cancel",
        label: "Annuler",
        icon: "fa-solid fa-xmark",
        callback: () => null
      }
    ],
    close: () => null
  });
}

function buildTokenData(tokens, widthCells, heightCells, gridSize) {
  const count = tokens.length;
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);

  // One empty square between tokens for readability.
  const step = 2;
  const occupiedWidth = (columns - 1) * step;
  const occupiedHeight = (rows - 1) * step;
  const startX = Math.max(0, Math.floor((widthCells - occupiedWidth) / 2));
  const startY = Math.max(0, Math.floor((heightCells - occupiedHeight) / 2));

  return tokens.map((token, index) => {
    const data = token.toObject();
    delete data._id;

    const column = index % columns;
    const row = Math.floor(index / columns);

    data.x = (startX + column * step) * gridSize;
    data.y = (startY + row * step) * gridSize;
    data.hidden = false;

    return data;
  });
}

async function createQuickCombatScene() {
  if (!game.user?.isGM) {
    ui.notifications.warn("Seul le MJ peut créer une scène de combat rapide.");
    return null;
  }

  const tokens = getSelectedTokenDocuments();

  if (!tokens.length) {
    ui.notifications.warn(
      "Sélectionnez d'abord les tokens des personnages sur la scène actuelle."
    );
    return null;
  }

  const options = await askSceneOptions(tokens);
  if (!options) return null;

  const sourceGrid = canvas.scene?.grid;
  const gridSize = sourceGrid?.size || DEFAULT_GRID_SIZE;
  const gridDistance = sourceGrid?.distance || 5;
  const gridUnits = sourceGrid?.units || "ft";

  const scene = await Scene.create({
    name: options.name,
    width: options.widthCells * gridSize,
    height: options.heightCells * gridSize,
    padding: 0,
    background: { src: null },
    backgroundColor: "#202020",

    // Combat rapide = visibilité totale pour tout le monde.
    // En Foundry V14, le brouillard se configure via fog.mode.
    tokenVision: false,
    fog: {
      mode: CONST.FOG_EXPLORATION_MODES.DISABLED
    },
    environment: {
      darknessLevel: 0,
      darknessLevelLock: true
    },

    grid: {
      type: CONST.GRID_TYPES.SQUARE,
      size: gridSize,
      distance: gridDistance,
      units: gridUnits
    }
  });

  if (!scene) {
    ui.notifications.error("Impossible de créer la scène.");
    return null;
  }

  const tokenData = buildTokenData(
    tokens,
    options.widthCells,
    options.heightCells,
    gridSize
  );

  await scene.createEmbeddedDocuments("Token", tokenData);
  await scene.activate();

  ui.notifications.info(
    `${scene.name} créée avec ${tokens.length} personnage(s).`
  );

  return scene;
}

export function initQuickCombatScene() {
  game.pf2eValToolkit ??= {};
  game.pf2eValToolkit.createCombatScene = createQuickCombatScene;
}
