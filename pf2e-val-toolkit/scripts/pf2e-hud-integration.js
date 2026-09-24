const MODULE_ID = "pf2e-val-toolkit";
const HUD_MODULE_ID = "pf2e-hud";
const RECALL_KNOWLEDGE_UUID = "Compendium.pf2e.actionspf2e.Item.1OagaWtBpVXExToo";

const SETTINGS = Object.freeze({
  localizedSort: "pf2eHud.localizedActionSort",
  groupRecallKnowledge: "pf2eHud.groupRecallKnowledge"
});

let scheduled = false;

function hudActive() {
  return Boolean(game.modules.get(HUD_MODULE_ID)?.active);
}

function enabled(setting) {
  return Boolean(game.settings.get(MODULE_ID, setting));
}

function localText(element) {
  return (element?.textContent ?? "").replace(/\s+/g, " ").trim();
}

function localizedLabel(element) {
  return localText(element).replace(/^[+−-]?\d+\s+/, "");
}

function collator() {
  return new Intl.Collator(game.i18n?.lang || "fr", {
    sensitivity: "base",
    numeric: true,
    usage: "sort"
  });
}

function restoreHiddenRecallKnowledge() {
  for (const element of document.querySelectorAll("[data-pf2e-val-hidden-recall]")) {
    element.style.removeProperty("display");
    delete element.dataset.pf2eValHiddenRecall;
  }
}

function skillGroups(sidebar) {
  const children = Array.from(sidebar.children);
  const groups = [];

  for (let index = 0; index < children.length; index += 1) {
    const header = children[index];
    if (!header.matches("header[data-filter-value]:not(.lore-header)")) continue;

    const nodes = [header];
    let cursor = index + 1;
    while (cursor < children.length && !children[cursor].matches("header[data-filter-value]")) {
      nodes.push(children[cursor]);
      cursor += 1;
    }

    groups.push({ header, nodes, end: children[cursor] ?? null, label: localizedLabel(header) });
    index = cursor - 1;
  }

  return groups;
}

function sortLocalizedSkills(sidebar) {
  const groups = skillGroups(sidebar);
  if (!groups.length) return;

  const perception = game.i18n.localize("PF2E.PerceptionLabel");
  const compare = collator();
  const sortedGroups = groups.slice().sort((left, right) => {
    const leftPerception = left.label === perception;
    const rightPerception = right.label === perception;
    if (leftPerception !== rightPerception) return leftPerception ? -1 : 1;
    return compare.compare(left.label, right.label);
  });

  // Preserve all HUD-owned nodes and their listeners; only move the existing groups.
  const anchor = groups.at(-1).end;
  for (const group of sortedGroups) {
    for (const node of group.nodes) sidebar.insertBefore(node, anchor);
  }

  // HUD prepares action labels localized, but its own sort is not locale-aware.
  for (const group of sortedGroups) {
    const actions = group.nodes.filter((node) => node.matches(".statistic-wrapper"));
    const sortedActions = actions.slice().sort((left, right) => {
      return compare.compare(localizedLabel(left), localizedLabel(right));
    });
    const siblings = Array.from(sidebar.children);
    const start = siblings.indexOf(group.header);
    const end = siblings.slice(start + 1).find((node) => node.matches("header[data-filter-value]")) ?? null;
    for (const action of sortedActions) sidebar.insertBefore(action, end);
  }
}

function groupRecallKnowledge(sidebar) {
  restoreHiddenRecallKnowledge();

  const extras = document.querySelector('#pf2e-hud-sidebar [data-sidebar="extras"]');
  const nativeRecallKnowledge = extras?.querySelector(
    `.statistic-wrapper [data-item-uuid="${RECALL_KNOWLEDGE_UUID}"]`
  )?.closest(".statistic-wrapper");
  if (!nativeRecallKnowledge) return;

  const recallKnowledgeLabel = game.i18n.localize("PF2E.Actions.RecallKnowledge.Title");
  for (const wrapper of sidebar.querySelectorAll(":scope > .statistic-wrapper")) {
    if (localizedLabel(wrapper) !== recallKnowledgeLabel) continue;
    wrapper.style.display = "none";
    wrapper.dataset.pf2eValHiddenRecall = "true";
  }
}

function refreshHudSidebars() {
  scheduled = false;
  if (!hudActive()) return;

  try {
    const skillSidebars = document.querySelectorAll('#pf2e-hud-sidebar [data-sidebar="skills"]');
    for (const sidebar of skillSidebars) {
      restoreHiddenRecallKnowledge();
      if (enabled(SETTINGS.localizedSort)) sortLocalizedSkills(sidebar);
      if (enabled(SETTINGS.groupRecallKnowledge)) groupRecallKnowledge(sidebar);
    }
  } catch (error) {
    console.warn("PF2e Val Toolkit | Intégration PF2e HUD ignorée :", error);
  }
}

function scheduleRefresh() {
  if (scheduled || !hudActive()) return;
  scheduled = true;
  requestAnimationFrame(refreshHudSidebars);
}

export function registerPf2eHudIntegrationSettings() {
  game.settings.register(MODULE_ID, SETTINGS.localizedSort, {
    name: "Tri localisé des actions PF2e HUD",
    hint: "Trie les compétences et leurs actions selon leur texte localisé. Perception reste en tête.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: scheduleRefresh
  });
  game.settings.register(MODULE_ID, SETTINGS.groupRecallKnowledge, {
    name: "Regrouper Se souvenir dans PF2e HUD",
    hint: "Masque les doublons de compétences quand l’action générique native Se souvenir de PF2e HUD est disponible.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: scheduleRefresh
  });
}

export function initPf2eHudIntegration() {
  if (!hudActive()) return;

  // ApplicationV2 emits this Foundry hook after it replaces its sidebar HTML.
  Hooks.on("renderApplication", () => scheduleRefresh());
  scheduleRefresh();
}

