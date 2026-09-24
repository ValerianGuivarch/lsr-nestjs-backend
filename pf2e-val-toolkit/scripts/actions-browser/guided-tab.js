import {
  getGeneralActionIndex
} from "./action-index.js";
import {
  BASIC_ACTION_FREQUENCY,
  SKILL_ACTION_SLUGS,
  SKILL_GROUP_ORDER
} from "./action-catalogue.js";
import {
  getShowEnglishNames,
  getShowIncompatibleActions,
  isGuidedActionVisible,
  openGuidedActionSettings,
  setShowEnglishNames,
  setShowIncompatibleActions
} from "./action-settings.js";
import { openGeneralAction } from "./action-runner.js";
import { getActionEligibility } from "./action-eligibility.js";
import {
  AUTOMATION_TYPES,
  getAutomationType
} from "./automation-catalogue.js";
import {
  postActionDeclaration,
  postLeapCard
} from "./action-chat.js";
import { recordActionUse } from "./action-events.js";
import {
  executeStrike,
  getMapChoices,
  getStrikeChoices
} from "./strike-runner.js";
import {
  getRuntimeVariants,
  resolveRuntimeAction,
  useRuntimeAction
} from "./runtime-actions.js";

const TAB_ID = "pf2e-val-guided-actions";
const PANEL_CLASS = "pf2e-val-guided-actions";
const NAV_CLASS = "pf2e-val-guided-actions-nav";

const RECALL_CORE_SKILLS = [
  "arcana",
  "crafting",
  "medicine",
  "nature",
  "occultism",
  "religion",
  "society"
];

const MAGIC_SKILLS = [
  ["arcana", "Arcanes"],
  ["nature", "Nature"],
  ["occultism", "Occultisme"],
  ["religion", "Religion"]
];

const DECIPHER_SKILLS = [
  ["arcana", "Arcanes"],
  ["occultism", "Occultisme"],
  ["religion", "Religion"],
  ["society", "Société"]
];

const REFLEX_OR_ACROBATICS = [
  ["acrobatics", "Acrobaties"],
  ["reflex", "Réflexes"]
];

const RUNTIME_CHAT_DECLARATION_SLUGS = new Set([
  "raise-a-shield",
  "avert-gaze",
  "drop-prone",
  "stand"
]);

const PERFORM_VARIANTS = [
  ["acting", "Interprétation"],
  ["comedy", "Comédie"],
  ["dance", "Danse"],
  ["keyboards", "Clavier"],
  ["oratory", "Art oratoire"],
  ["percussion", "Percussions"],
  ["singing", "Chant"],
  ["strings", "Cordes"],
  ["winds", "Vents"]
];

function getRoot(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

function isCharacterSheet(app) {
  const actor = app?.actor ?? app?.object ?? app?.document;
  return actor?.type === "character";
}

function getActor(app) {
  return app?.actor ?? app?.object ?? app?.document ?? null;
}

function findPrimaryNavigation(root) {
  const candidates = Array.from(
    root.querySelectorAll("nav, .sheet-navigation, .sheet-tabs, .tabs")
  );

  return candidates.find(element => {
    const hasActions = element.querySelector('[data-tab="actions"]');
    const hasInventory = element.querySelector('[data-tab="inventory"]');
    return hasActions && hasInventory;
  }) ?? null;
}

function findNativeActionsTab(root) {
  const candidates = Array.from(
    root.querySelectorAll('.tab[data-tab="actions"], [data-tab="actions"].tab')
  );

  return candidates.find(element => {
    return element.parentElement?.querySelector('[data-tab="inventory"]');
  }) ?? candidates[0] ?? null;
}

function actionGlyph(cost) {
  if (cost === "R") return "↩";
  if (cost === "F") return "◇";
  return cost || "•";
}

function createNavigationButton(navigation) {
  const source =
    navigation.querySelector('[data-tab="actions"]') ??
    navigation.querySelector("[data-tab]");

  let button;

  if (source) {
    button = source.cloneNode(false);
    button.removeAttribute("data-action");
    button.removeAttribute("data-tooltip");
    button.removeAttribute("aria-label");
  } else {
    button = document.createElement("a");
  }

  button.classList.remove("active");
  button.classList.add(NAV_CLASS);
  button.dataset.tab = TAB_ID;
  button.title = "Actions guidées";
  button.setAttribute("aria-label", "Actions guidées");
  button.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';

  return button;
}

function createPanel() {
  const panel = document.createElement("section");
  panel.classList.add("tab", PANEL_CLASS);
  panel.dataset.tab = TAB_ID;

  panel.innerHTML = `
    <style>
      .pf2e-val-guided-actions {
        height: 100% !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-browser {
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
        min-height: 0 !important;
        gap: 5px !important;
        padding: 8px !important;
        box-sizing: border-box !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-header {
        display: flex !important;
        align-items: end !important;
        justify-content: space-between !important;
        gap: 8px !important;
        flex: 0 0 auto !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-header h2 {
        margin: 0 !important;
        font-size: 1.05rem !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-header p {
        margin: 1px 0 0 !important;
        font-size: 0.78rem !important;
        opacity: 0.72 !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-count {
        white-space: nowrap !important;
        font-size: 0.78rem !important;
        font-weight: 700 !important;
        opacity: 0.72 !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-toolbar {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        gap: 6px !important;
        align-items: center !important;
        flex: 0 0 auto !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-search {
        display: flex !important;
        align-items: center !important;
        gap: 5px !important;
        min-width: 0 !important;
        height: 28px !important;
        padding: 0 6px !important;
        border: 1px solid rgba(80, 60, 40, 0.45) !important;
        border-radius: 4px !important;
        background: rgb(0 0 0 / 7%) !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-search input {
        width: 100% !important;
        height: 26px !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-controls {
        display: flex !important;
        align-items: center !important;
        gap: 7px !important;
        white-space: nowrap !important;
        font-size: 0.72rem !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-english,
      .pf2e-val-guided-actions .pf2e-val-guided-unfiltered {
        display: inline-flex !important;
        align-items: center !important;
        gap: 4px !important;
        cursor: pointer !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-settings {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 26px !important;
        height: 26px !important;
        min-width: 26px !important;
        min-height: 26px !important;
        padding: 0 !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-legend {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 4px 10px !important;
        flex: 0 0 auto !important;
        padding: 0 2px !important;
        font-size: 0.68rem !important;
        opacity: 0.7 !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-content {
        min-height: 0 !important;
        overflow-y: auto !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-section {
        margin: 0 0 5px !important;
        border: 1px solid rgba(90, 70, 50, 0.18) !important;
        border-radius: 4px !important;
        overflow: hidden !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-section-title {
        display: flex !important;
        align-items: center !important;
        gap: 5px !important;
        margin: 0 !important;
        padding: 4px 6px !important;
        font-size: 0.8rem !important;
        font-weight: 800 !important;
        opacity: 0.88 !important;
        cursor: pointer !important;
        user-select: none !important;
        list-style: none !important;
        background: rgb(127 127 127 / 6%) !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-section-title::-webkit-details-marker {
        display: none !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-section-title::before {
        content: "▸" !important;
        width: 10px !important;
        font-size: 0.72rem !important;
        transition: transform 0.12s ease !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-section[open] > .pf2e-val-guided-section-title::before {
        transform: rotate(90deg) !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-section-label {
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-section-count {
        margin-left: auto !important;
        font-size: 0.68rem !important;
        opacity: 0.65 !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-section > .pf2e-val-guided-grid {
        padding: 4px !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-collapse-controls {
        display: inline-flex !important;
        align-items: center !important;
        gap: 3px !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-collapse-controls button {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 26px !important;
        height: 26px !important;
        min-width: 26px !important;
        min-height: 26px !important;
        padding: 0 !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 3px !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-tile {
        display: grid !important;
        grid-template-columns: 16px minmax(0, 1fr) auto 20px 24px !important;
        align-items: center !important;
        gap: 3px !important;
        width: auto !important;
        min-width: 0 !important;
        height: 27px !important;
        min-height: 27px !important;
        margin: 0 !important;
        padding: 1px 2px 1px 6px !important;
        border: 1px solid rgba(80, 60, 40, 0.3) !important;
        border-radius: 3px !important;
        background: rgb(255 255 255 / 5%) !important;
        box-sizing: border-box !important;
        cursor: pointer !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-tile:hover {
        background: rgb(127 127 127 / 12%) !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-automation {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 14px !important;
        min-width: 14px !important;
        height: 18px !important;
        font-size: 0.78rem !important;
        font-weight: 800 !important;
        line-height: 1 !important;
        opacity: 0.86 !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-automation[data-automation="unsupported"] {
        opacity: 0.42 !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-name {
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        font-size: 0.78rem !important;
        font-weight: 650 !important;
        line-height: 1 !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-training {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        height: 17px !important;
        min-height: 17px !important;
        padding: 0 4px !important;
        border: 1px solid currentColor !important;
        border-radius: 3px !important;
        white-space: nowrap !important;
        font-size: 0.58rem !important;
        font-weight: 800 !important;
        line-height: 1 !important;
        opacity: 0.72 !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-unavailable {
        opacity: 0.58 !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-unavailable .pf2e-val-guided-training {
        opacity: 1 !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-play[disabled] {
        opacity: 0.3 !important;
        cursor: not-allowed !important;
        pointer-events: auto !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-cost {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 18px !important;
        height: 18px !important;
        min-width: 18px !important;
        min-height: 18px !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 1px solid currentColor !important;
        border-radius: 50% !important;
        line-height: 1 !important;
        font-size: 0.62rem !important;
        font-weight: 800 !important;
        opacity: 0.72 !important;
        box-sizing: border-box !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-play,
      .pf2e-val-guided-actions .pf2e-val-guided-info-only {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 22px !important;
        height: 22px !important;
        min-width: 22px !important;
        min-height: 22px !important;
        margin: 0 !important;
        padding: 0 !important;
        border-radius: 3px !important;
        line-height: 1 !important;
        box-shadow: none !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-play {
        border: 1px solid rgba(65, 105, 65, 0.7) !important;
        cursor: pointer !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-play:hover {
        background: rgb(70 130 70 / 16%) !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-play.disabled {
        opacity: 0.45 !important;
        pointer-events: none !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-info-only {
        border: 1px solid rgba(80, 80, 100, 0.35) !important;
        opacity: 0.45 !important;
        cursor: default !important;
      }

      .pf2e-val-guided-actions .pf2e-val-guided-empty {
        padding: 1rem !important;
        text-align: center !important;
        opacity: 0.7 !important;
      }

      .pf2e-val-guided-choice-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
      }

      .pf2e-val-guided-choice-note {
        margin: 0;
        font-size: 0.9rem;
        opacity: 0.8;
      }

      @media (max-width: 680px) {
        .pf2e-val-guided-actions .pf2e-val-guided-grid {
          grid-template-columns: 1fr !important;
        }

        .pf2e-val-guided-actions .pf2e-val-guided-toolbar {
          grid-template-columns: 1fr !important;
        }
      }
    </style>

    <div class="pf2e-val-guided-browser">
      <header class="pf2e-val-guided-header">
        <div>
          <h2>Actions guidées</h2>
          <p>Clique sur l'action pour lire la règle ; ▶ exécute ou ouvre les choix nécessaires.</p>
        </div>
        <div class="pf2e-val-guided-count"></div>
      </header>

      <div class="pf2e-val-guided-toolbar">
        <label class="pf2e-val-guided-search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="search" placeholder="Rechercher…" autocomplete="off">
        </label>

        <div class="pf2e-val-guided-controls">
          <span class="pf2e-val-guided-collapse-controls">
            <button
              type="button"
              title="Tout déplier"
              data-expand-all
            >
              <i class="fa-solid fa-angles-down"></i>
            </button>
            <button
              type="button"
              title="Tout replier"
              data-collapse-all
            >
              <i class="fa-solid fa-angles-up"></i>
            </button>
          </span>

          <label
            class="pf2e-val-guided-unfiltered"
            title="Afficher aussi les actions dont les conditions connues ne sont pas remplies"
          >
            <input type="checkbox" data-show-incompatible>
            <span>Sans filtre</span>
          </label>

          <label
            class="pf2e-val-guided-english"
            title="Afficher également le nom anglais"
          >
            <input type="checkbox" data-show-english>
            <span>Nom anglais</span>
          </label>

          ${game.user.isGM ? `
            <button
              type="button"
              class="pf2e-val-guided-settings"
              title="Configurer les actions visibles pour tous les joueurs"
              data-open-action-settings
            >
              <i class="fa-solid fa-gear"></i>
            </button>
          ` : ""}
        </div>
      </div>

      <div class="pf2e-val-guided-legend">
        <span title="${AUTOMATION_TYPES.direct.title}">
          ${AUTOMATION_TYPES.direct.glyph} direct
        </span>
        <span title="${AUTOMATION_TYPES.actionMenu.title}">
          ${AUTOMATION_TYPES.actionMenu.glyph} menu d’action
        </span>
        <span title="${AUTOMATION_TYPES.statisticMenu.title}">
          ${AUTOMATION_TYPES.statisticMenu.glyph} choix de jet
        </span>
        <span title="${AUTOMATION_TYPES.assistant.title}">
          ${AUTOMATION_TYPES.assistant.glyph} assistant PF2e
        </span>
        <span title="${AUTOMATION_TYPES.declaration.title}">
          ${AUTOMATION_TYPES.declaration.glyph} déclaration
        </span>
        <span title="${AUTOMATION_TYPES.unsupported.title}">
          ${AUTOMATION_TYPES.unsupported.glyph} non automatisé
        </span>
        <span><i class="fa-solid fa-book-open"></i> clic sur la ligne = règle</span>
      </div>

      <div class="pf2e-val-guided-content">
        <div class="pf2e-val-guided-empty">
          <i class="fa-solid fa-spinner fa-spin"></i>
          Chargement…
        </div>
      </div>
    </div>
  `;

  return panel;
}

function setCustomTabActive(app, root, active) {
  const navigation = findPrimaryNavigation(root);
  const panel = root.querySelector(`.${PANEL_CLASS}`);
  const nav = root.querySelector(`.${NAV_CLASS}`);

  app._pf2eValGuidedActionsActive = active;

  if (!navigation || !panel || !nav) return;

  if (active) {
    for (const item of navigation.querySelectorAll("[data-tab]")) {
      item.classList.toggle("active", item === nav);
    }

    const parent = panel.parentElement;
    if (parent) {
      for (const tab of parent.querySelectorAll(":scope > .tab")) {
        tab.classList.toggle("active", tab === panel);
      }
    }

    panel.hidden = false;
  } else {
    panel.classList.remove("active");
    panel.hidden = true;
    nav.classList.remove("active");
  }
}

function localized(value) {
  if (!value) return "";
  return game.i18n.has?.(value) ? game.i18n.localize(value) : String(value);
}

function interactionFor(entry) {
  const automation = getAutomationType(entry.slug);

  if (automation.key === "unsupported") {
    return {
      type: "info",
      title: automation.title,
      automation
    };
  }

  if (
    automation.key === "action-menu" ||
    automation.key === "statistic-menu"
  ) {
    return {
      type: "guided",
      title: automation.title,
      automation
    };
  }

  if (automation.key === "declaration") {
    return {
      type: "declaration",
      title: automation.title,
      automation
    };
  }

  const runtime = resolveRuntimeAction(entry.slug);

  if (!runtime) {
    return {
      type: "info",
      title: "Automatisation prévue, mais aucun runtime PF2e n’a été détecté.",
      automation
    };
  }

  const variants = getRuntimeVariants(runtime);

  // This fallback is useful if PF2e adds a native variant to an action that
  // our table currently classifies as direct.
  if (variants.length && automation.key === "direct") {
    return {
      type: "native-variants",
      title: "PF2e expose plusieurs variantes.",
      runtime,
      variants,
      automation
    };
  }

  return {
    type: "direct",
    title: automation.title,
    runtime,
    automation
  };
}

function rankLabel(rank) {
  return [
    "Non qualifié",
    "Qualifié",
    "Expert",
    "Maître",
    "Légendaire"
  ][Number(rank ?? 0)] ?? `Rang ${rank}`;
}

function actorStatistic(actor, slug) {
  return actor?.getStatistic?.(slug) ?? actor?.skills?.[slug] ?? null;
}

function statisticSummary(actor, slug, fallbackLabel) {
  const statistic = actorStatistic(actor, slug);

  if (!statistic) {
    return {
      slug,
      label: fallbackLabel,
      mod: null,
      rank: null
    };
  }

  return {
    slug,
    label: statistic.label ?? fallbackLabel,
    mod: Number.isFinite(Number(statistic.mod))
      ? Number(statistic.mod)
      : Number.isFinite(Number(statistic.modifier))
        ? Number(statistic.modifier)
        : null,
    rank: statistic.rank ?? statistic.proficiency?.rank ?? null
  };
}

function getRecallStatistics(actor) {
  const result = [];
  const seen = new Set();

  for (const slug of RECALL_CORE_SKILLS) {
    const statistic = actorStatistic(actor, slug);
    if (!statistic) continue;

    const key = statistic.slug ?? slug;
    if (seen.has(key)) continue;
    seen.add(key);

    result.push(statisticSummary(
      actor,
      key,
      statistic.label ?? slug
    ));
  }

  for (const statistic of Object.values(actor?.skills ?? {})) {
    const slug = statistic?.slug;
    if (!slug || seen.has(slug) || RECALL_CORE_SKILLS.includes(slug)) continue;

    const label = statistic?.label ?? slug;
    const lower = String(label).toLocaleLowerCase(game.i18n.lang);

    if (!lower.includes("lore") && !lower.includes("connaissance")) continue;

    seen.add(slug);
    result.push(statisticSummary(actor, slug, label));
  }

  for (const lore of actor?.itemTypes?.lore ?? []) {
    const slug = lore.slug ?? foundry.utils.slugify(lore.name);
    if (!slug || seen.has(slug)) continue;

    const statistic = actor?.getStatistic?.(slug);
    if (!statistic) continue;

    seen.add(slug);
    result.push(statisticSummary(actor, slug, statistic.label ?? lore.name));
  }

  return result.sort((a, b) =>
    a.label.localeCompare(b.label, game.i18n.lang)
  );
}

function getAidStatistics(actor) {
  const definitions = [
    ["perception", "Perception"],
    ["acrobatics", "Acrobaties"],
    ["arcana", "Arcanes"],
    ["athletics", "Athlétisme"],
    ["crafting", "Artisanat"],
    ["deception", "Duperie"],
    ["diplomacy", "Diplomatie"],
    ["intimidation", "Intimidation"],
    ["medicine", "Médecine"],
    ["nature", "Nature"],
    ["occultism", "Occultisme"],
    ["performance", "Représentation"],
    ["religion", "Religion"],
    ["society", "Société"],
    ["stealth", "Discrétion"],
    ["survival", "Survie"],
    ["thievery", "Larcin"],
    ["unarmed", "Attaque à mains nues"]
  ];

  const result = [];
  const seen = new Set();

  for (const [slug, label] of definitions) {
    const statistic = actorStatistic(actor, slug);
    if (!statistic) continue;

    const key = statistic.slug ?? slug;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(statisticSummary(actor, key, statistic.label ?? label));
  }

  for (const recallStatistic of getRecallStatistics(actor)) {
    if (seen.has(recallStatistic.slug)) continue;
    seen.add(recallStatistic.slug);
    result.push(recallStatistic);
  }

  return result.sort((a, b) =>
    a.label.localeCompare(b.label, game.i18n.lang)
  );
}

async function waitDialog({ title, content, buttons, width = 560 }) {
  const DialogV2 = foundry.applications?.api?.DialogV2;

  if (!DialogV2?.wait) {
    ui.notifications.warn(
      "Cette interaction guidée nécessite DialogV2 sous Foundry V14."
    );
    return null;
  }

  return DialogV2.wait({
    window: { title },
    position: { width },
    content,
    buttons,
    close: () => null
  });
}

function choiceButtons(choices, icon = "fa-solid fa-play") {
  return choices.map(choice => ({
    action: choice.value,
    label: choice.label,
    icon,
    callback: () => choice.value
  }));
}

async function chooseSimple(title, intro, choices, { width = 560 } = {}) {
  return waitDialog({
    title,
    width,
    content: `
      <div>
        ${intro ? `<p>${intro}</p>` : ""}
        <div class="pf2e-val-guided-choice-grid">
          ${choices.map(choice => `
            <div>
              <strong>${foundry.utils.escapeHTML(choice.label)}</strong>
              ${choice.note
                ? `<p class="pf2e-val-guided-choice-note">${foundry.utils.escapeHTML(choice.note)}</p>`
                : ""}
            </div>
          `).join("")}
        </div>
      </div>
    `,
    buttons: [
      ...choiceButtons(choices),
      {
        action: "rule",
        label: "Règle",
        icon: "fa-solid fa-book-open",
        callback: () => "__rule__"
      }
    ]
  });
}

async function chooseAid(actor) {
  const statistics = getAidStatistics(actor);

  if (!statistics.length) {
    ui.notifications.warn(
      "Aucune statistique utilisable pour Aider n’a été trouvée sur cette fiche."
    );
    return null;
  }

  const choices = statistics.map(statistic => ({
    value: statistic.slug,
    label:
      `${statistic.label}` +
      (statistic.mod === null
        ? ""
        : ` ${statistic.mod >= 0 ? "+" : ""}${statistic.mod}`),
    note: statistic.rank === null ? "" : rankLabel(statistic.rank)
  }));

  return chooseSimple(
    "Aider — jet utilisé",
    "Le MJ décide du test approprié à la manière dont tu aides. Choisis ici une statistique disponible.",
    choices,
    { width: 720 }
  );
}

async function chooseRecallKnowledge(actor) {
  const statistics = getRecallStatistics(actor);

  if (!statistics.length) {
    ui.notifications.warn(
      "Aucune compétence utilisable pour Se souvenir n'a été trouvée sur cette fiche."
    );
    return null;
  }

  const choices = statistics.map(statistic => ({
    value: statistic.slug,
    label:
      `${statistic.label}` +
      (statistic.mod === null
        ? ""
        : ` ${statistic.mod >= 0 ? "+" : ""}${statistic.mod}`),
    note: statistic.rank === null ? "" : rankLabel(statistic.rank)
  }));

  return chooseSimple(
    "Se souvenir — compétence",
    "Choisis la compétence correspondant à la question posée au MJ.",
    choices,
    { width: 680 }
  );
}

async function chooseNamedStatistics(actor, title, intro, definitions) {
  const choices = definitions.map(([slug, label]) => {
    const statistic = statisticSummary(actor, slug, label);

    return {
      value: slug,
      label:
        `${statistic.label}` +
        (statistic.mod === null
          ? ""
          : ` ${statistic.mod >= 0 ? "+" : ""}${statistic.mod}`),
      note: statistic.rank === null ? "" : rankLabel(statistic.rank)
    };
  });

  return chooseSimple(title, intro, choices);
}

async function chooseNativeVariants(entry, variants) {
  const choices = variants.map(variant => {
    const value = String(variant.slug ?? variant.name ?? variant.label);
    const label = localized(
      variant.name ?? variant.label ?? variant.slug ?? value
    );

    return { value, label: label || value };
  });

  return chooseSimple(
    entry.frenchName,
    "PF2e expose plusieurs variantes pour cette action.",
    choices
  );
}

async function runSystemAction(
  actor,
  entry,
  event,
  {
    variant = null,
    statistic = null,
    skill = null,
    difficultyClass = null
  } = {}
) {
  try {
    const result = await useRuntimeAction(
      actor,
      entry.slug,
      event,
      {
        variant,
        statistic,
        skill,
        difficultyClass
      }
    );

    if (!result.ok) {
      ui.notifications.warn(
        `${entry.frenchName} n'expose pas d'automatisation PF2e utilisable dans cette version.`
      );
      return false;
    }

    recordActionUse(actor, entry, {
      mode: "runtime",
      detail: {
        variant,
        statistic: statistic ?? skill ?? null
      }
    });

    if (RUNTIME_CHAT_DECLARATION_SLUGS.has(entry.slug)) {
      await postActionDeclaration(
        actor,
        entry,
        { record: false }
      );
    }

    return true;
  } catch (error) {
    console.error(
      `PF2e Val Toolkit | Action guidée "${entry.slug}"`,
      error
    );

    ui.notifications.error(
      `${entry.frenchName} n'a pas pu être lancée automatiquement.`
    );

    return false;
  }
}

async function chooseStrikeWeapon(actor) {
  const choices = getStrikeChoices(actor);

  if (!choices.length) {
    ui.notifications.warn(
      "Aucune Frappe disponible."
    );
    return null;
  }

  if (choices.length === 1) {
    return String(choices[0].index);
  }

  return chooseSimple(
    "Frapper — arme",
    "Choisissez la Frappe utilisée.",
    choices.map(choice => ({
      value: String(choice.index),
      label: choice.label,
      note: choice.eligibleForPreciseStrike
        ? "Compatible Frappe précise"
        : ""
    })),
    { width: 720 }
  );
}

async function chooseStrikeMap(strikeChoice) {
  const choices = getMapChoices(strikeChoice);

  if (!choices.length) return 0;
  if (choices.length === 1) return 0;

  const selected = await chooseSimple(
    "Frapper — pénalité d’attaques multiples",
    "Choisissez la position de cette attaque dans votre tour.",
    choices.map(choice => ({
      value: String(choice.index),
      label: choice.label,
      note:
        choice.penalty === null
          ? ""
          : `Pénalité : ${choice.penalty}`
    })),
    { width: 650 }
  );

  if (!selected || selected === "__rule__") return selected;

  return Number(selected);
}

async function runGuidedAction(actor, entry, event) {
  switch (entry.slug) {
    case "aid": {
      const statistic = await chooseAid(actor);
      if (statistic === "__rule__") return openGeneralAction(entry);
      if (statistic) {
        await runSystemAction(actor, entry, event, {
          statistic,
          skill: statistic
        });
      }
      return;
    }

    case "leap": {
      await postLeapCard(actor, entry);
      return;
    }

    case "strike": {
      const selectedWeapon =
        await chooseStrikeWeapon(actor);

      if (
        selectedWeapon === null ||
        selectedWeapon === "__rule__"
      ) {
        if (selectedWeapon === "__rule__") {
          await openGeneralAction(entry);
        }
        return;
      }

      const strikeChoices =
        getStrikeChoices(actor);

      const strikeChoice =
        strikeChoices.find(
          choice =>
            choice.index ===
            Number(selectedWeapon)
        );

      if (!strikeChoice) return;

      const mapIndex =
        await chooseStrikeMap(strikeChoice);

      if (
        mapIndex === "__rule__" ||
        mapIndex === null ||
        mapIndex === undefined
      ) {
        if (mapIndex === "__rule__") {
          await openGeneralAction(entry);
        }
        return;
      }

      await executeStrike(actor, entry, {
        strikeIndex: strikeChoice.index,
        mapIndex,
        event
      });

      return;
    }

    case "take-cover": {
      const ok = await runSystemAction(
        actor,
        entry,
        event
      );

      if (ok) {
        await postActionDeclaration(
          actor,
          entry,
          { record: false }
        );
      }

      return;
    }

    case "recall-knowledge": {
      const statistic = await chooseRecallKnowledge(actor);
      if (statistic === "__rule__") return openGeneralAction(entry);
      if (statistic) {
        await runSystemAction(actor, entry, event, {
          statistic,
          skill: statistic
        });
      }
      return;
    }

    case "create-a-diversion": {
      const variant = await chooseSimple(
        "Faire diversion",
        "Choisis comment tu détournes l'attention.",
        [
          ["gesture", "Geste", "Manipulation"],
          ["trick", "Astuce", "Manipulation"],
          ["distracting-words", "Propos", "Audible et linguistique"]
        ].map(([value, label, note]) => ({ value, label, note }))
      );
      if (variant === "__rule__") return openGeneralAction(entry);
      if (variant) await runSystemAction(actor, entry, event, { variant });
      return;
    }

    case "administer-first-aid": {
      const variant = await chooseSimple(
        "Prodiguer les premiers soins",
        "Choisis ce que tu essaies de traiter.",
        [
          {
            value: "stabilize",
            label: "Stabiliser",
            note: "Pour une créature à 0 PV avec l'état Mourant."
          },
          {
            value: "stop-bleeding",
            label: "Stopper l'hémorragie",
            note: "Pour des dégâts persistants de saignement."
          }
        ]
      );
      if (variant === "__rule__") return openGeneralAction(entry);
      if (variant) await runSystemAction(actor, entry, event, { variant });
      return;
    }

    case "perform": {
      const variant = await chooseSimple(
        "Se produire",
        "Choisis le type de représentation.",
        PERFORM_VARIANTS.map(
          ([value, label]) => ({
            value,
            label
          })
        ),
        { width: 720 }
      );

      if (variant === "__rule__") {
        return openGeneralAction(entry);
      }

      if (variant) {
        await runSystemAction(
          actor,
          entry,
          event,
          { variant }
        );
      }

      return;
    }

    case "subsist": {
      const statistic = await chooseNamedStatistics(
        actor,
        "Subsister",
        "En ville, on utilise normalement Société ; dans la nature, Survie.",
        [
          ["society", "Société"],
          ["survival", "Survie"]
        ]
      );
      if (statistic === "__rule__") return openGeneralAction(entry);
      if (statistic) {
        await runSystemAction(actor, entry, event, {
          statistic,
          skill: statistic
        });
      }
      return;
    }

    case "escape": {
      const statistic = await chooseNamedStatistics(
        actor,
        "S'échapper",
        "Choisis le modificateur utilisé pour tenter de te libérer.",
        [
          ["unarmed", "Attaque à mains nues"],
          ["acrobatics", "Acrobaties"],
          ["athletics", "Athlétisme"]
        ]
      );
      if (statistic === "__rule__") return openGeneralAction(entry);
      if (statistic) {
        await runSystemAction(actor, entry, event, {
          statistic,
          skill: statistic
        });
      }
      return;
    }

    case "decipher-writing": {
      const statistic = await chooseNamedStatistics(
        actor,
        "Déchiffrer un texte",
        "Choisis la compétence adaptée au texte.",
        DECIPHER_SKILLS
      );
      if (statistic === "__rule__") return openGeneralAction(entry);
      if (statistic) {
        await runSystemAction(actor, entry, event, {
          statistic,
          skill: statistic
        });
      }
      return;
    }

    case "identify-magic": {
      const statistic = await chooseNamedStatistics(
        actor,
        "Identifier la magie",
        "Choisis la compétence magique utilisée.",
        MAGIC_SKILLS
      );
      if (statistic === "__rule__") return openGeneralAction(entry);
      if (statistic) {
        await runSystemAction(actor, entry, event, {
          statistic,
          skill: statistic
        });
      }
      return;
    }

    case "learn-a-spell": {
      const statistic = await chooseNamedStatistics(
        actor,
        "Apprendre un sort",
        "Choisis la compétence magique correspondant à la tradition du sort.",
        MAGIC_SKILLS
      );
      if (statistic === "__rule__") return openGeneralAction(entry);
      if (statistic) {
        await runSystemAction(actor, entry, event, {
          statistic,
          skill: statistic
        });
      }
      return;
    }

    case "arrest-a-fall": {
      const statistic = await chooseNamedStatistics(
        actor,
        "Arrêter une chute",
        "Choisis Acrobaties ou Réflexes.",
        REFLEX_OR_ACROBATICS
      );
      if (statistic === "__rule__") return openGeneralAction(entry);
      if (statistic) {
        await runSystemAction(actor, entry, event, {
          statistic,
          skill: statistic
        });
      }
      return;
    }

    case "grab-an-edge": {
      const statistic = await chooseNamedStatistics(
        actor,
        "Se raccrocher in extremis",
        "Choisis Acrobaties ou Réflexes.",
        REFLEX_OR_ACROBATICS
      );
      if (statistic === "__rule__") return openGeneralAction(entry);
      if (statistic) {
        await runSystemAction(actor, entry, event, {
          statistic,
          skill: statistic
        });
      }
      return;
    }

  }
}

async function activateEntry(actor, entry, event) {
  const interaction = interactionFor(entry);

  if (interaction.type === "info") {
    return;
  }

  if (interaction.type === "guided") {
    await runGuidedAction(actor, entry, event);
    return;
  }

  if (interaction.type === "declaration") {
    await postActionDeclaration(actor, entry);
    return;
  }

  if (interaction.type === "native-variants") {
    const variant = await chooseNativeVariants(entry, interaction.variants);

    if (variant === "__rule__") {
      await openGeneralAction(entry);
      return;
    }

    if (variant) {
      await runSystemAction(actor, entry, event, { variant });
    }

    return;
  }

  if (interaction.type === "direct") {
    await runSystemAction(actor, entry, event);
  }
}

function displayName(entry, showEnglish) {
  if (!showEnglish || !entry.englishName) return entry.frenchName;
  return `${entry.frenchName} (${entry.englishName})`;
}

function createTile(
  actor,
  entry,
  showEnglish,
  {
    skillGroup = null,
    eligibility = null
  } = {}
) {
  const interaction = interactionFor(entry);
  const automation = getAutomationType(entry.slug);
  const state = eligibility ?? getActionEligibility(
    actor,
    entry,
    { skillGroup }
  );
  const tile = document.createElement("div");

  tile.className = "pf2e-val-guided-tile";

  if (!state.eligible) {
    tile.classList.add("pf2e-val-guided-unavailable");
  }

  tile.dataset.frName = entry.frenchName;
  tile.dataset.enName = entry.englishName ?? "";
  tile.dataset.search =
    `${entry.frenchName} ${entry.englishName} ${entry.slug}`.toLocaleLowerCase(
      game.i18n.lang
    );
  tile.dataset.slug = entry.slug;
  tile.dataset.automation = automation.key;

  const reasonText = state.reasons.join(" ; ");
  const requirementTitle = reasonText
    ? ` — indisponible : ${reasonText}`
    : state.requiresTrained
      ? state.rank === null
        ? ` — requiert Qualifié en ${skillGroup}`
        : ` — prérequis satisfait : Qualifié en ${skillGroup}`
      : "";

  tile.title =
    `${displayName(entry, showEnglish)} — cliquer pour ouvrir la règle` +
    requirementTitle;

  const canPlay =
    interaction.type !== "info" &&
    state.eligible;

  tile.innerHTML = `
    <span
      class="pf2e-val-guided-automation"
      data-automation="${foundry.utils.escapeHTML(automation.key)}"
      title="${foundry.utils.escapeHTML(automation.title)}"
      aria-label="${foundry.utils.escapeHTML(automation.label)}"
    >
      ${foundry.utils.escapeHTML(automation.glyph)}
    </span>

    <span class="pf2e-val-guided-name">
      ${foundry.utils.escapeHTML(displayName(entry, showEnglish))}
    </span>

    ${
      state.requiresTrained
        ? `
          <span
            class="pf2e-val-guided-training"
            title="Requiert au moins Qualifié en ${foundry.utils.escapeHTML(skillGroup)}"
          >
            Qualifié
          </span>
        `
        : "<span></span>"
    }

    <span class="pf2e-val-guided-cost">
      ${foundry.utils.escapeHTML(actionGlyph(entry.actionCost))}
    </span>

    ${
      interaction.type === "info"
        ? `
          <span
            class="pf2e-val-guided-info-only"
            title="${foundry.utils.escapeHTML(interaction.title)}"
          >
            <i class="fa-solid fa-circle-info"></i>
          </span>
        `
        : `
          <button
            type="button"
            class="pf2e-val-guided-play"
            data-guided-play
            title="${
              state.eligible
                ? foundry.utils.escapeHTML(interaction.title)
                : foundry.utils.escapeHTML(reasonText || "Conditions non remplies")
            }"
            aria-label="Utiliser ${foundry.utils.escapeHTML(entry.frenchName)}"
            ${canPlay ? "" : "disabled"}
          >
            <i class="${
              interaction.type === "declaration"
                ? "fa-solid fa-book-open"
                : "fa-solid fa-play"
            }"></i>
          </button>
        `
    }
  `;

  tile.addEventListener("click", async event => {
    if (event.target.closest("[data-guided-play]")) return;

    event.preventDefault();
    await openGeneralAction(entry);
  });

  const play = tile.querySelector("[data-guided-play]");

  if (play && canPlay) {
    play.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();

      play.classList.add("disabled");

      try {
        await activateEntry(actor, entry, event);
      } finally {
        play.classList.remove("disabled");
      }
    });
  }

  return tile;
}

function createSection(
  actor,
  label,
  entries,
  showEnglish,
  showIncompatible,
  {
    open = false,
    sectionType = "skill",
    skillGroup = null
  } = {}
) {
  const displayEntries = entries
    .filter(entry => isGuidedActionVisible(entry.slug))
    .map(entry => ({
      entry,
      eligibility: getActionEligibility(
        actor,
        entry,
        { skillGroup }
      )
    }))
    .filter(({ eligibility }) =>
      showIncompatible || eligibility.eligible
    );

  if (!displayEntries.length) return null;

  const section = document.createElement("details");
  section.className = "pf2e-val-guided-section";
  section.dataset.section = label;
  section.dataset.sectionType = sectionType;
  section.open = open;

  const title = document.createElement("summary");
  title.className = "pf2e-val-guided-section-title";
  title.innerHTML = `
    <span class="pf2e-val-guided-section-label">
      ${foundry.utils.escapeHTML(label)}
    </span>
    <span class="pf2e-val-guided-section-count">
      ${displayEntries.length}
    </span>
  `;

  const grid = document.createElement("div");
  grid.className = "pf2e-val-guided-grid";

  for (const { entry, eligibility } of displayEntries) {
    grid.append(
      createTile(actor, entry, showEnglish, {
        skillGroup,
        eligibility
      })
    );
  }

  section.append(title, grid);
  return section;
}

function renderSearch(panel) {
  const query =
    panel.querySelector(".pf2e-val-guided-search input")
      ?.value
      ?.trim()
      ?.toLocaleLowerCase(game.i18n.lang) ?? "";

  let visible = 0;

  for (const section of panel.querySelectorAll(".pf2e-val-guided-section")) {
    let sectionVisible = 0;

    for (const tile of section.querySelectorAll(".pf2e-val-guided-tile")) {
      const show = !query || tile.dataset.search.includes(query);
      tile.hidden = !show;

      if (show) {
        visible += 1;
        sectionVisible += 1;
      }
    }

    section.hidden = sectionVisible === 0;

    if (query && sectionVisible > 0) {
      if (section.dataset.preSearchOpen === undefined) {
        section.dataset.preSearchOpen = section.open ? "true" : "false";
      }

      section.open = true;
    } else if (!query && section.dataset.preSearchOpen !== undefined) {
      section.open = section.dataset.preSearchOpen === "true";
      delete section.dataset.preSearchOpen;
    }
  }

  const count = panel.querySelector(".pf2e-val-guided-count");
  if (count) count.textContent = `${visible} entrées affichées`;
}

function updateDisplayedNames(panel, showEnglish) {
  for (const tile of panel.querySelectorAll(".pf2e-val-guided-tile")) {
    const french = tile.dataset.frName ?? "";
    const english = tile.dataset.enName ?? "";
    const name = showEnglish && english
      ? `${french} (${english})`
      : french;

    const label = tile.querySelector(".pf2e-val-guided-name");
    if (label) label.textContent = name;
  }
}

async function populatePanel(app, panel) {
  const actor = getActor(app);
  const content = panel.querySelector(".pf2e-val-guided-content");

  try {
    const entries = await getGeneralActionIndex();
    const bySlug = new Map(entries.map(entry => [entry.slug, entry]));
    const showEnglish = getShowEnglishNames();
    const showIncompatible = getShowIncompatibleActions();

    const fragment = document.createDocumentFragment();

    const frequentBasic = (BASIC_ACTION_FREQUENCY.frequent ?? [])
      .map(slug => bySlug.get(slug))
      .filter(Boolean);

    const situationalBasic = (BASIC_ACTION_FREQUENCY.situational ?? [])
      .map(slug => bySlug.get(slug))
      .filter(Boolean);

    const frequentSection = createSection(
      actor,
      "Actions courantes",
      frequentBasic,
      showEnglish,
      showIncompatible,
      {
        open: true,
        sectionType: "basic-frequent"
      }
    );

    if (frequentSection) fragment.append(frequentSection);

    const situationalSection = createSection(
      actor,
      "Actions situationnelles",
      situationalBasic,
      showEnglish,
      showIncompatible,
      {
        open: false,
        sectionType: "basic-situational"
      }
    );

    if (situationalSection) fragment.append(situationalSection);

    for (const skill of SKILL_GROUP_ORDER) {
      const skillEntries = (SKILL_ACTION_SLUGS[skill] ?? [])
        .map(slug => bySlug.get(slug))
        .filter(Boolean);

      const section = createSection(
        actor,
        skill,
        skillEntries,
        showEnglish,
        showIncompatible,
        {
          open: false,
          sectionType: "skill",
          skillGroup: skill
        }
      );

      if (section) fragment.append(section);
    }

    if (!fragment.childNodes.length) {
      content.innerHTML =
        '<div class="pf2e-val-guided-empty">Aucune action compatible n’est affichée. Active « Sans filtre » pour voir les actions incompatibles.</div>';
      return;
    }

    content.replaceChildren(fragment);
    renderSearch(panel);
  } catch (error) {
    console.error("PF2e Val Toolkit | Guided actions", error);
    content.innerHTML =
      '<div class="pf2e-val-guided-empty">Impossible de charger les actions guidées.</div>';
  }
}

async function injectGuidedTab(app, html) {
  if (!isCharacterSheet(app)) return;

  const root = getRoot(html);
  if (!root) return;

  const navigation = findPrimaryNavigation(root);
  const actionsTab = findNativeActionsTab(root);

  if (!navigation || !actionsTab?.parentElement) return;

  root.querySelector(`.${NAV_CLASS}`)?.remove();
  root.querySelector(`.${PANEL_CLASS}`)?.remove();

  const navButton = createNavigationButton(navigation);
  navigation.append(navButton);

  const panel = createPanel();
  actionsTab.parentElement.append(panel);

  navButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    setCustomTabActive(app, root, true);
  });

  for (const other of navigation.querySelectorAll(
    `[data-tab]:not([data-tab="${TAB_ID}"])`
  )) {
    other.addEventListener("click", () => {
      setCustomTabActive(app, root, false);
    });
  }

  panel
    .querySelector(".pf2e-val-guided-search input")
    ?.addEventListener("input", () => renderSearch(panel));

  panel
    .querySelector("[data-expand-all]")
    ?.addEventListener("click", event => {
      event.preventDefault();

      for (const section of panel.querySelectorAll(
        ".pf2e-val-guided-section:not([hidden])"
      )) {
        section.open = true;
      }
    });

  panel
    .querySelector("[data-collapse-all]")
    ?.addEventListener("click", event => {
      event.preventDefault();

      for (const section of panel.querySelectorAll(
        ".pf2e-val-guided-section:not([hidden])"
      )) {
        section.open = false;
      }
    });

  const englishCheckbox = panel.querySelector("[data-show-english]");
  if (englishCheckbox) {
    englishCheckbox.checked = getShowEnglishNames();

    englishCheckbox.addEventListener("change", async () => {
      await setShowEnglishNames(englishCheckbox.checked);
      updateDisplayedNames(panel, englishCheckbox.checked);
      renderSearch(panel);
    });
  }

  const incompatibleCheckbox = panel.querySelector(
    "[data-show-incompatible]"
  );

  if (incompatibleCheckbox) {
    incompatibleCheckbox.checked = getShowIncompatibleActions();

    incompatibleCheckbox.addEventListener("change", async () => {
      await setShowIncompatibleActions(incompatibleCheckbox.checked);
      await populatePanel(app, panel);
    });
  }

  panel
    .querySelector("[data-open-action-settings]")
    ?.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      await openGuidedActionSettings();
    });

  if (app._pf2eValGuidedActionsActive) {
    setCustomTabActive(app, root, true);
  } else {
    panel.hidden = true;
  }

  await populatePanel(app, panel);
}

export function initGuidedActionsBrowser() {
  Hooks.on("renderCharacterSheetPF2e", injectGuidedTab);
  Hooks.on("renderActorSheet", injectGuidedTab);
}
