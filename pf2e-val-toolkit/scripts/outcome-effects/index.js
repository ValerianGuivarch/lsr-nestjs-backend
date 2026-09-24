import { getUserTargets, getTargetName } from "../lib/targets.js";
import { applyConfiguredDocumentToTargets } from "../quick-effects/index.js";

const PANEL_CLASS = "pf2e-val-outcome-effects";

const OUTCOME_LABELS = {
  criticalSuccess: "Succès critique",
  success: "Succès",
  failure: "Échec",
  criticalFailure: "Échec critique"
};

const RECIPES = {
  "faerie-dust": {
    outcomes: {
      failure: {
        summary: "Pénalité -2 Perception/Volonté pendant 1 round",
        actions: [
          { type: "effect", uuid: "Compendium.pf2e.spell-effects.Item.LHREWCGPkWsc4GGJ" }
        ]
      },
      criticalFailure: {
        summary: "Comme Échec, puis pénalité -1 pendant 1 minute",
        actions: [
          { type: "effect", uuid: "Compendium.pf2e.spell-effects.Item.LHREWCGPkWsc4GGJ" },
          { type: "effect", uuid: "Compendium.pf2e.spell-effects.Item.pcK88HqL6LjBNH2h" }
        ]
      }
    }
  },

  "tangle-vine": {
    outcomes: {
      criticalSuccess: {
        summary: "-3 m aux Vitesses + Immobilisé",
        actions: [
          {
            type: "effect",
            uuid: "Compendium.pf2e.spell-effects.Item.TwtUIEyenrtAbeiX",
            effectRuleSelections: { "tangle-vine": "critical-success" }
          }
        ]
      },
      success: {
        summary: "-3 m aux Vitesses",
        actions: [
          {
            type: "effect",
            uuid: "Compendium.pf2e.spell-effects.Item.TwtUIEyenrtAbeiX",
            effectRuleSelections: { "tangle-vine": "success" }
          }
        ]
      }
    }
  },

  "thunderstrike": {
    note: "À utiliser seulement si la cible porte une armure métallique ou est faite de métal, et a subi des dégâts.",
    outcomes: {
      success: {
        buttonLabel: "Succès · métal",
        summary: "Maladroit 1 pendant 1 round",
        actions: [
          {
            type: "condition",
            uuid: "Compendium.pf2e.conditionitems.Item.i3OJZU2nk64Df3xm",
            conditionValue: 1,
            duration: { value: 1, unit: "rounds", expiry: "turn-start" }
          }
        ]
      },
      failure: {
        buttonLabel: "Échec · métal",
        summary: "Maladroit 1 pendant 1 round",
        actions: [
          {
            type: "condition",
            uuid: "Compendium.pf2e.conditionitems.Item.i3OJZU2nk64Df3xm",
            conditionValue: 1,
            duration: { value: 1, unit: "rounds", expiry: "turn-start" }
          }
        ]
      },
      criticalFailure: {
        buttonLabel: "Échec critique · métal",
        summary: "Maladroit 1 pendant 1 round",
        actions: [
          {
            type: "condition",
            uuid: "Compendium.pf2e.conditionitems.Item.i3OJZU2nk64Df3xm",
            conditionValue: 1,
            duration: { value: 1, unit: "rounds", expiry: "turn-start" }
          }
        ]
      }
    }
  },

  "live-wire": {
    outcomes: {
      criticalSuccess: {
        summary: "Dégâts électriques persistants",
        actions: [
          {
            type: "persistent-damage",
            uuid: "Compendium.pf2e.conditionitems.Item.lDVqvLKA6eF3Df60",
            damageType: "electricity",
            formula: ({ item }) => `${Math.max(1, Math.ceil(getSpellRank(item) / 2))}d4`
          }
        ]
      }
    }
  }
};

function getSpellRank(item) {
  const candidates = [
    item?.rank,
    item?.system?.location?.heightenedLevel,
    item?.system?.level?.value
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) return value;
  }

  return 1;
}

async function getMessageItem(message) {
  if (message?.item) return message.item;

  const candidateUuids = [
    message?.flags?.pf2e?.origin?.uuid,
    message?.flags?.pf2e?.context?.origin?.item,
    message?.flags?.pf2e?.context?.origin?.itemUuid
  ].filter(Boolean);

  for (const uuid of candidateUuids) {
    try {
      const document = await fromUuid(uuid);
      if (document?.documentName === "Item") return document;
    } catch (_error) {
      // Try the next candidate.
    }
  }

  return null;
}

function normalizeSlug(item) {
  return String(item?.slug ?? item?.system?.slug ?? "").trim();
}

function makeButton(rootDocument, outcomeKey, config) {
  const button = rootDocument.createElement("button");
  button.type = "button";
  button.className = "pf2e-val-outcome-button";
  button.dataset.outcome = outcomeKey;
  button.title = config.summary ?? "Appliquer les effets aux cibles";
  button.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i><span>${config.buttonLabel ?? OUTCOME_LABELS[outcomeKey] ?? outcomeKey}</span>`;
  return button;
}

async function applyOutcome(message, item, recipe, outcomeKey) {
  const config = recipe?.outcomes?.[outcomeKey];
  if (!config) return;

  const targets = getUserTargets().filter(token => token?.actor && token?.document?.uuid);
  if (!targets.length) {
    ui.notifications.warn("Ciblez d'abord la ou les créatures auxquelles appliquer ce résultat.");
    return;
  }

  let anyFailure = false;

  for (const action of config.actions ?? []) {
    let document = null;
    try {
      document = await fromUuid(action.uuid);
    } catch (error) {
      console.error("PF2e Val Toolkit | Impossible de résoudre l'effet de résultat", action, error);
    }

    if (!document) {
      anyFailure = true;
      continue;
    }

    const persistentDamage = action.type === "persistent-damage"
      ? {
          formula: typeof action.formula === "function" ? action.formula({ item, message }) : action.formula,
          damageType: action.damageType,
          dc: action.dc ?? 15,
          criticalHit: action.criticalHit === true
        }
      : null;

    const result = await applyConfiguredDocumentToTargets(document, {
      sourceMessage: message,
      duration: action.duration ?? null,
      conditionValue: action.conditionValue ?? null,
      effectRuleSelections: action.effectRuleSelections ?? null,
      persistentDamage,
      notify: false
    });

    if (!result || result.failed > 0) anyFailure = true;
  }

  const targetNames = targets.map(getTargetName).join(", ");
  if (anyFailure) {
    ui.notifications.warn(`Résultat ${OUTCOME_LABELS[outcomeKey] ?? outcomeKey} appliqué partiellement à ${targetNames}.`);
  } else {
    ui.notifications.info(`${OUTCOME_LABELS[outcomeKey] ?? outcomeKey} : effets appliqués à ${targetNames}.`);
  }
}

async function addOutcomePanel(message, root) {
  if (!root || root.querySelector?.(`.${PANEL_CLASS}`)) return;

  const item = await getMessageItem(message);
  const slug = normalizeSlug(item);
  const recipe = RECIPES[slug];
  if (!recipe) return;

  const domDocument = root.ownerDocument ?? window.document;
  const panel = domDocument.createElement("section");
  panel.className = PANEL_CLASS;

  const header = domDocument.createElement("div");
  header.className = "pf2e-val-outcome-header";
  header.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i><strong>Appliquer les effets</strong><span>aux cibles actuelles</span>';
  panel.append(header);

  const buttons = domDocument.createElement("div");
  buttons.className = "pf2e-val-outcome-buttons";

  for (const [outcomeKey, config] of Object.entries(recipe.outcomes ?? {})) {
    const button = makeButton(domDocument, outcomeKey, config);
    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      button.disabled = true;
      try {
        await applyOutcome(message, item, recipe, outcomeKey);
      } finally {
        button.disabled = false;
      }
    });
    buttons.append(button);
  }

  panel.append(buttons);

  if (recipe.note) {
    const note = domDocument.createElement("p");
    note.className = "pf2e-val-outcome-note";
    note.textContent = recipe.note;
    panel.append(note);
  }

  const content = root.querySelector?.(".message-content") ?? root;
  content.append(panel);
}

export function initOutcomeEffects() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    void addOutcomePanel(message, html);
  });

  game.pf2eValToolkit ??= {};
  game.pf2eValToolkit.outcomeEffects = {
    recipes: RECIPES
  };
}
