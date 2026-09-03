import {
  getGeneralActionIndex
} from "./action-index.js";

const MODULE_ID = "pf2e-val-toolkit";
const VISIBILITY_SETTING = "guidedActionVisibility";
const ENGLISH_SETTING = "guidedShowEnglish";
const SHOW_INCOMPATIBLE_SETTING = "guidedShowIncompatible";

function rerenderCharacterSheets() {
  if (!game?.actors) return;

  for (const actor of game.actors.filter(actor => actor.type === "character")) {
    if (actor.sheet?.rendered) actor.sheet.render(false);
  }
}

export function registerGuidedActionSettings() {
  game.settings.register(MODULE_ID, VISIBILITY_SETTING, {
    name: "Actions guidées visibles",
    hint: "Configuration interne des actions que le MJ souhaite afficher.",
    scope: "world",
    config: false,
    type: Object,
    default: {},
    onChange: rerenderCharacterSheets
  });

  game.settings.register(MODULE_ID, ENGLISH_SETTING, {
    name: "Afficher les noms anglais des actions",
    hint: "Affiche le nom anglais en complément du nom français.",
    scope: "client",
    config: false,
    type: Boolean,
    default: false,
    onChange: rerenderCharacterSheets
  });

  game.settings.register(MODULE_ID, SHOW_INCOMPATIBLE_SETTING, {
    name: "Afficher les actions incompatibles",
    hint: "Affiche aussi les actions dont une condition connue n'est pas remplie.",
    scope: "client",
    config: false,
    type: Boolean,
    default: false,
    onChange: rerenderCharacterSheets
  });
}

export function getActionVisibility() {
  return game.settings.get(MODULE_ID, VISIBILITY_SETTING) ?? {};
}

export function isGuidedActionVisible(slug) {
  const visibility = getActionVisibility();

  // No automatic eligibility filtering: an action is visible unless the GM
  // has explicitly disabled it.
  return visibility[slug] !== false;
}

export async function setGuidedActionVisibility(visibility) {
  if (!game.user.isGM) return;
  await game.settings.set(MODULE_ID, VISIBILITY_SETTING, visibility);
}

export function getShowEnglishNames() {
  return Boolean(game.settings.get(MODULE_ID, ENGLISH_SETTING));
}

export async function setShowEnglishNames(value) {
  await game.settings.set(MODULE_ID, ENGLISH_SETTING, Boolean(value));
}

export function getShowIncompatibleActions() {
  return Boolean(
    game.settings.get(MODULE_ID, SHOW_INCOMPATIBLE_SETTING)
  );
}

export async function setShowIncompatibleActions(value) {
  await game.settings.set(
    MODULE_ID,
    SHOW_INCOMPATIBLE_SETTING,
    Boolean(value)
  );
}

function settingsDialogContent(entries, visibility) {
  const basic = entries.filter(entry => entry.kind === "basic");
  const skill = entries.filter(entry => entry.kind === "skill");

  const renderRows = list =>
    list.map(entry => `
      <label class="pf2e-val-action-setting-row"
             data-search="${foundry.utils.escapeHTML(
               `${entry.frenchName} ${entry.englishName} ${entry.slug}`.toLowerCase()
             )}">
        <input
          type="checkbox"
          data-action-slug="${foundry.utils.escapeHTML(entry.slug)}"
          ${visibility[entry.slug] !== false ? "checked" : ""}
        >
        <span>
          <strong>${foundry.utils.escapeHTML(entry.frenchName)}</strong>
          ${entry.englishName
            ? `<small>${foundry.utils.escapeHTML(entry.englishName)}</small>`
            : ""}
        </span>
      </label>
    `).join("");

  return `
    <style>
      .pf2e-val-action-settings {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-height: 520px;
      }

      .pf2e-val-action-settings-toolbar {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: 6px;
        align-items: center;
      }

      .pf2e-val-action-settings-toolbar input[type="search"] {
        width: 100%;
      }

      .pf2e-val-action-settings-toolbar button {
        white-space: nowrap;
      }

      .pf2e-val-action-settings-scroll {
        overflow-y: auto;
        max-height: 62vh;
        padding-right: 4px;
      }

      .pf2e-val-action-setting-section {
        margin-bottom: 10px;
      }

      .pf2e-val-action-setting-section h3 {
        margin: 0 0 5px;
        padding-bottom: 3px;
        border-bottom: 1px solid rgba(90, 70, 50, 0.35);
      }

      .pf2e-val-action-setting-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 4px 8px;
      }

      .pf2e-val-action-setting-row {
        display: grid;
        grid-template-columns: 18px minmax(0, 1fr);
        gap: 5px;
        align-items: start;
        min-width: 0;
        padding: 3px 4px;
        border-radius: 3px;
      }

      .pf2e-val-action-setting-row:hover {
        background: rgb(127 127 127 / 10%);
      }

      .pf2e-val-action-setting-row strong,
      .pf2e-val-action-setting-row small {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .pf2e-val-action-setting-row strong {
        font-size: 0.82rem;
      }

      .pf2e-val-action-setting-row small {
        opacity: 0.65;
        font-size: 0.72rem;
      }

      @media (max-width: 800px) {
        .pf2e-val-action-setting-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    </style>

    <div class="pf2e-val-action-settings">
      <p>
        Le MJ fixe ici la liste commune des actions affichées aux joueurs.
        Le filtre de compatibilité est ensuite appliqué côté joueur et peut être désactivé avec <strong>Sans filtre</strong>.
      </p>

      <div class="pf2e-val-action-settings-toolbar">
        <input
          type="search"
          class="pf2e-val-action-settings-search"
          placeholder="Rechercher une action…"
        >
        <button type="button" data-toggle-all="on">
          <i class="fa-solid fa-check-double"></i> Tout afficher
        </button>
        <button type="button" data-toggle-all="off">
          <i class="fa-solid fa-xmark"></i> Tout masquer
        </button>
      </div>

      <div class="pf2e-val-action-settings-scroll">
        <section class="pf2e-val-action-setting-section">
          <h3>Actions de base — ${basic.length}</h3>
          <div class="pf2e-val-action-setting-grid">
            ${renderRows(basic)}
          </div>
        </section>

        <section class="pf2e-val-action-setting-section">
          <h3>Actions de compétence — ${skill.length}</h3>
          <div class="pf2e-val-action-setting-grid">
            ${renderRows(skill)}
          </div>
        </section>
      </div>
    </div>
  `;
}

export async function openGuidedActionSettings() {
  if (!game.user.isGM) {
    ui.notifications.warn("Seul le MJ peut configurer les actions guidées.");
    return;
  }

  const DialogV2 = foundry.applications?.api?.DialogV2;
  if (!DialogV2?.wait) {
    ui.notifications.error("DialogV2 est indisponible.");
    return;
  }

  const entries = await getGeneralActionIndex();
  const visibility = getActionVisibility();

  const result = await DialogV2.wait({
    window: {
      title: "PF2e Val Toolkit — Actions affichées"
    },
    position: {
      width: 900
    },
    content: settingsDialogContent(entries, visibility),
    buttons: [
      {
        action: "save",
        label: "Enregistrer",
        icon: "fa-solid fa-floppy-disk",
        default: true,
        callback: (event, button) => {
          const next = {};

          for (const input of button.form.querySelectorAll(
            "input[data-action-slug]"
          )) {
            next[input.dataset.actionSlug] = input.checked;
          }

          return next;
        }
      },
      {
        action: "cancel",
        label: "Annuler",
        icon: "fa-solid fa-ban",
        callback: () => null
      }
    ],
    render: (event, dialog) => {
      const root = dialog.element;
      const search = root.querySelector(
        ".pf2e-val-action-settings-search"
      );

      const applySearch = () => {
        const query = search?.value?.trim().toLowerCase() ?? "";

        for (const row of root.querySelectorAll(
          ".pf2e-val-action-setting-row"
        )) {
          row.hidden = Boolean(query) && !row.dataset.search.includes(query);
        }
      };

      search?.addEventListener("input", applySearch);

      for (const button of root.querySelectorAll("[data-toggle-all]")) {
        button.addEventListener("click", () => {
          const checked = button.dataset.toggleAll === "on";

          for (const input of root.querySelectorAll(
            "input[data-action-slug]"
          )) {
            if (!input.closest(".pf2e-val-action-setting-row")?.hidden) {
              input.checked = checked;
            }
          }
        });
      }
    },
    rejectClose: false
  });

  if (!result || typeof result !== "object") return;

  await setGuidedActionVisibility(result);
  ui.notifications.info("Liste des actions guidées mise à jour.");
}
