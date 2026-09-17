import { getUserTargets, getTargetName } from "../lib/targets.js";

const MODULE_ID = "pf2e-val-toolkit";
const SOCKET_HANDLER = "applyQuickEffect";
const QUICK_APPLY_CLASS = "pf2e-val-quick-apply";

let socket = null;

/**
 * Register the small GM relay as soon as socketlib is ready.
 *
 * Players can target NPCs they do not own. In that case the relay only asks
 * the GM client to apply an existing PF2e Condition/Effect by UUID; no rule
 * data supplied by the player is trusted or persisted as a custom library.
 */
Hooks.once("socketlib.ready", () => {
  try {
    socket = socketlib.registerModule(MODULE_ID);
    socket.register(SOCKET_HANDLER, applyQuickEffectAsGM);
  } catch (error) {
    console.error("PF2e Val Toolkit | Initialisation socketlib quick effects", error);
  }
});

function escapeHTML(value) {
  return foundry.utils.escapeHTML(String(value ?? ""));
}

function isSupportedDocument(document) {
  return document?.documentName === "Item" && ["condition", "effect"].includes(document.type);
}

function getConditionValueInfo(condition) {
  const value = condition?.system?.value;
  return {
    isValued: value?.isValued === true,
    defaultValue: Number.isFinite(Number(value?.value)) ? Math.max(1, Number(value.value)) : 1
  };
}

function durationLabel(duration) {
  if (!duration) return "sans durée";
  const value = Number(duration.value);
  const unit = duration.unit;
  if (unit === "rounds") return `${value} round${value > 1 ? "s" : ""}`;
  if (unit === "minutes") return `${value} minute${value > 1 ? "s" : ""}`;
  if (unit === "hours") return `${value} heure${value > 1 ? "s" : ""}`;
  return `${value} ${unit}`;
}

function normalizeDurationChoice(data) {
  const preset = String(data.preset ?? "none");
  const expiry = ["turn-start", "turn-end", "round-end"].includes(data.expiry)
    ? data.expiry
    : "turn-start";

  if (preset === "none") return null;
  if (preset === "1r") return { value: 1, unit: "rounds", expiry };
  if (preset === "3r") return { value: 3, unit: "rounds", expiry };
  if (preset === "1m") return { value: 1, unit: "minutes", expiry };

  const value = Math.max(1, Number.parseInt(data.customValue, 10) || 1);
  const unit = ["rounds", "minutes", "hours"].includes(data.customUnit)
    ? data.customUnit
    : "rounds";

  return { value, unit, expiry };
}

async function askConditionOptions(condition) {
  const DialogV2 = foundry.applications?.api?.DialogV2;
  const { isValued, defaultValue } = getConditionValueInfo(condition);

  if (!DialogV2?.wait) {
    const raw = window.prompt(
      `Durée de ${condition.name} : 0 = sans durée, sinon nombre de rounds`,
      "1"
    );
    if (raw === null) return null;
    const rounds = Number.parseInt(raw, 10);
    return {
      cancelled: false,
      duration: rounds > 0 ? { value: rounds, unit: "rounds", expiry: "turn-start" } : null,
      conditionValue: isValued ? defaultValue : null
    };
  }

  const result = await DialogV2.wait({
    window: { title: `Appliquer ${condition.name}` },
    content: `
      <form class="pf2e-val-quick-effect-form">
        <div class="form-group">
          <label>Durée</label>
          <div class="form-fields">
            <select name="preset">
              <option value="none">Sans durée — retrait manuel</option>
              <option value="1r" selected>1 round</option>
              <option value="3r">3 rounds</option>
              <option value="1m">1 minute</option>
              <option value="custom">Personnalisée</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Durée personnalisée</label>
          <div class="form-fields">
            <input type="number" name="customValue" value="1" min="1" step="1">
            <select name="customUnit">
              <option value="rounds">round(s)</option>
              <option value="minutes">minute(s)</option>
              <option value="hours">heure(s)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Expiration</label>
          <div class="form-fields">
            <select name="expiry">
              <option value="turn-start" selected>Début du tour de la source</option>
              <option value="turn-end">Fin du tour de la source</option>
              <option value="round-end">Fin du round</option>
            </select>
          </div>
        </div>

        ${isValued ? `
          <div class="form-group">
            <label>Valeur de l'état</label>
            <div class="form-fields">
              <input type="number" name="conditionValue" value="${defaultValue}" min="1" step="1">
            </div>
          </div>
        ` : ""}

        <p class="hint">
          Pour un sort ou une capacité, « début du tour de la source » correspond normalement au lanceur/auteur.
          La condition PF2e officielle est utilisée ; le Toolkit ne recrée pas sa mécanique.
        </p>
      </form>
    `,
    buttons: [
      {
        action: "apply",
        label: "Appliquer",
        icon: "fa-solid fa-crosshairs",
        default: true,
        callback: (_event, button) => {
          const data = Object.fromEntries(new FormData(button.form).entries());
          return {
            cancelled: false,
            duration: normalizeDurationChoice(data),
            conditionValue: isValued
              ? Math.max(1, Number.parseInt(data.conditionValue, 10) || defaultValue)
              : null
          };
        }
      },
      {
        action: "cancel",
        label: "Annuler",
        icon: "fa-solid fa-xmark",
        callback: () => ({ cancelled: true })
      }
    ],
    close: () => ({ cancelled: true })
  });

  return result ?? { cancelled: true };
}

function speakerTokenUuid(message) {
  const sceneId = message?.speaker?.scene;
  const tokenId = message?.speaker?.token;
  return sceneId && tokenId ? `Scene.${sceneId}.Token.${tokenId}` : null;
}

function sourceContextFromMessage(message) {
  const actor = message?.actor ?? message?.speakerActor ?? null;
  const item = message?.item ?? null;

  return {
    actorUuid: actor?.uuid ?? null,
    itemUuid: item?.uuid ?? null,
    tokenUuid: speakerTokenUuid(message)
  };
}

function sourceContextFromActor(actor) {
  const controlled = canvas.tokens?.controlled?.find(token => token.actor?.uuid === actor?.uuid) ?? null;
  const active = controlled ?? canvas.tokens?.placeables?.find(token => token.actor?.uuid === actor?.uuid) ?? null;

  return {
    actorUuid: actor?.uuid ?? null,
    itemUuid: null,
    tokenUuid: active?.document?.uuid ?? null
  };
}

function buildOriginContext({ actorUuid = null, itemUuid = null, tokenUuid = null } = {}) {
  if (!actorUuid && !itemUuid && !tokenUuid) return null;

  return {
    target: null,
    origin: {
      actor: actorUuid,
      token: tokenUuid,
      item: itemUuid,
      spellcasting: null,
      rollOptions: []
    },
    roll: null
  };
}

function cleanEmbeddedSource(source) {
  const data = foundry.utils.deepClone(source);
  delete data._id;
  delete data.folder;
  delete data.sort;
  delete data.ownership;
  return data;
}

function buildDirectConditionSource(condition, conditionValue = null) {
  const data = cleanEmbeddedSource(condition.toObject());

  if (condition.system?.value?.isValued && Number.isFinite(Number(conditionValue))) {
    foundry.utils.setProperty(data, "system.value.value", Math.max(1, Number(conditionValue)));
  }

  return data;
}

function buildTimedConditionSource(condition, duration, origin, conditionValue = null) {
  const alterations = [];

  if (condition.system?.value?.isValued && Number.isFinite(Number(conditionValue))) {
    alterations.push({
      mode: "override",
      property: "badge-value",
      value: Math.max(1, Number(conditionValue))
    });
  }

  const grant = {
    key: "GrantItem",
    uuid: condition.uuid,
    onDeleteActions: { grantee: "cascade" }
  };

  if (alterations.length) grant.alterations = alterations;

  return {
    name: `${condition.name} — ${durationLabel(duration)}`,
    type: "effect",
    img: condition.img,
    system: {
      description: {
        value: `<p>Durée manuelle appliquée par PF2e Val Toolkit pour @UUID[${condition.uuid}]{${escapeHTML(condition.name)}}.</p>`,
        gm: ""
      },
      duration: {
        value: duration.value,
        unit: duration.unit,
        expiry: duration.expiry,
        sustained: false
      },
      level: { value: 1 },
      rules: [grant],
      start: { value: 0, initiative: null },
      tokenIcon: { show: false },
      traits: { value: [], otherTags: [] },
      slug: null,
      unidentified: false,
      badge: null,
      fromSpell: false,
      context: buildOriginContext(origin)
    },
    flags: {
      [MODULE_ID]: {
        quickEffect: {
          kind: "timed-condition",
          conditionUuid: condition.uuid
        }
      }
    }
  };
}

function buildEffectSource(effect, origin) {
  const data = cleanEmbeddedSource(effect.toObject());
  const hasOrigin = origin?.actorUuid || origin?.itemUuid || origin?.tokenUuid;

  if (hasOrigin) {
    const context = foundry.utils.deepClone(data.system?.context ?? {
      target: null,
      origin: null,
      roll: null
    });

    if (!context.origin?.actor) {
      context.origin = buildOriginContext(origin)?.origin ?? null;
      foundry.utils.setProperty(data, "system.context", context);
    }
  }

  return data;
}

async function resolveTargetActor(tokenUuid) {
  const tokenDocument = await fromUuid(tokenUuid);
  return tokenDocument?.actor ?? null;
}

async function createOnActor(actor, document, { duration = null, conditionValue = null, origin = {} } = {}) {
  if (!actor || !isSupportedDocument(document)) return false;

  const source = document.type === "condition"
    ? duration
      ? buildTimedConditionSource(document, duration, origin, conditionValue)
      : buildDirectConditionSource(document, conditionValue)
    : buildEffectSource(document, origin);

  await actor.createEmbeddedDocuments("Item", [source]);
  return true;
}

async function applyQuickEffectAsGM(request) {
  const document = await fromUuid(request?.documentUuid ?? "");
  if (!isSupportedDocument(document)) {
    throw new Error("Le document à appliquer n'est ni une Condition ni un Effect PF2e.");
  }

  const results = [];
  for (const tokenUuid of request?.targetTokenUuids ?? []) {
    const actor = await resolveTargetActor(tokenUuid);
    if (!actor) {
      results.push({ tokenUuid, ok: false });
      continue;
    }

    try {
      await createOnActor(actor, document, {
        duration: request.duration ?? null,
        conditionValue: request.conditionValue ?? null,
        origin: request.origin ?? {}
      });
      results.push({ tokenUuid, ok: true, actorName: actor.name });
    } catch (error) {
      console.error("PF2e Val Toolkit | Application rapide par le MJ", error);
      results.push({ tokenUuid, ok: false, actorName: actor.name });
    }
  }

  return results;
}

function canCurrentUserUpdate(actor) {
  if (game.user?.isGM) return true;
  return actor?.testUserPermission?.(game.user, "OWNER") === true;
}

async function applyToTargets(document, options) {
  const targets = getUserTargets().filter(token => token?.actor && token?.document?.uuid);

  if (!targets.length) {
    ui.notifications.warn("Ciblez d'abord au moins une créature.");
    return { applied: 0, failed: 0 };
  }

  const direct = [];
  const remote = [];

  for (const target of targets) {
    if (canCurrentUserUpdate(target.actor)) direct.push(target);
    else remote.push(target);
  }

  let applied = 0;
  let failed = 0;

  for (const target of direct) {
    try {
      const ok = await createOnActor(target.actor, document, options);
      if (ok) applied += 1;
      else failed += 1;
    } catch (error) {
      failed += 1;
      console.error("PF2e Val Toolkit | Application rapide", error);
    }
  }

  if (remote.length) {
    if (!socket) {
      failed += remote.length;
      ui.notifications.warn(
        "Ces cibles ne vous appartiennent pas. Socketlib doit être actif avec un MJ connecté pour leur appliquer l'effet."
      );
    } else {
      try {
        const results = await socket.executeAsGM(SOCKET_HANDLER, {
          documentUuid: document.uuid,
          targetTokenUuids: remote.map(target => target.document.uuid),
          duration: options.duration ?? null,
          conditionValue: options.conditionValue ?? null,
          origin: options.origin ?? {}
        });

        for (const result of results ?? []) {
          if (result?.ok) applied += 1;
          else failed += 1;
        }
      } catch (error) {
        failed += remote.length;
        console.error("PF2e Val Toolkit | Relais GM quick effect", error);
        ui.notifications.error("Impossible d'appliquer l'effet via le MJ.");
      }
    }
  }

  if (applied > 0) {
    const names = targets.map(getTargetName).join(", ");
    ui.notifications.info(`${document.name} appliqué à ${names}.`);
  }

  if (failed > 0) {
    ui.notifications.warn(`${failed} cible(s) n'ont pas pu recevoir l'effet.`);
  }

  return { applied, failed };
}

/**
 * Public entry point shared by chat cards and the existing Conditions tab.
 */
export async function applyDocumentToTargets(document, { sourceMessage = null, sourceActor = null } = {}) {
  if (!isSupportedDocument(document)) {
    ui.notifications.warn("Ce lien n'est ni une Condition ni un Effect PF2e.");
    return null;
  }

  let duration = null;
  let conditionValue = null;

  if (document.type === "condition") {
    const choice = await askConditionOptions(document);
    if (!choice || choice.cancelled) return null;
    duration = choice.duration;
    conditionValue = choice.conditionValue;
  }

  const origin = sourceMessage
    ? sourceContextFromMessage(sourceMessage)
    : sourceActor
      ? sourceContextFromActor(sourceActor)
      : sourceContextFromActor(canvas.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null);

  return applyToTargets(document, { duration, conditionValue, origin });
}

async function addQuickApplyButtons(message, root) {
  const links = Array.from(root.querySelectorAll("a[data-uuid]"));

  await Promise.all(links.map(async link => {
    if (link.dataset.pf2eValQuickApply === "true") return;

    const uuid = link.dataset.uuid;
    if (!uuid) return;

    let document = null;
    try {
      document = await fromUuid(uuid);
    } catch (_error) {
      return;
    }

    if (!isSupportedDocument(document)) return;

    link.dataset.pf2eValQuickApply = "true";

    // The resolved Item is named `document`, so use the link ownerDocument for DOM creation.
    const domDocument = link.ownerDocument ?? window.document;
    const quickButton = domDocument.createElement("button");
    quickButton.type = "button";
    quickButton.className = QUICK_APPLY_CLASS;
    quickButton.dataset.uuid = uuid;
    quickButton.title = `Appliquer ${document.name} aux cibles`;
    quickButton.setAttribute("aria-label", quickButton.title);
    quickButton.innerHTML = '<i class="fa-solid fa-crosshairs"></i>';

    quickButton.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      await applyDocumentToTargets(document, { sourceMessage: message });
    });

    link.insertAdjacentElement("afterend", quickButton);
  }));
}

export function initQuickEffects() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    void addQuickApplyButtons(message, html);
  });

  game.pf2eValToolkit ??= {};
  game.pf2eValToolkit.quickEffects = {
    applyToTargets: applyDocumentToTargets,
    get socketReady() {
      return !!socket;
    }
  };
}
