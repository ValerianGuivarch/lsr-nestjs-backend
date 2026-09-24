import { useRuntimeAction } from "./runtime-actions.js";
import { recordActionUse } from "./action-events.js";

const DECLARATION_TEXT = {
  "step":
    "Vous vous déplacez de 1,50 m sans déclencher les réactions provoquées par les actions de déplacement.",
  "interact":
    "Vous manipulez un objet ou votre environnement : saisir, dégainer, ouvrir, actionner, etc.",
  "ready":
    "Vous préparez une action unique et définissez un déclencheur. Si ce déclencheur se produit avant votre prochain tour, vous pouvez effectuer l’action préparée par une réaction.",
  "release":
    "Vous lâchez quelque chose que vous tenez.",
  "delay":
    "Vous retardez votre tour et reviendrez plus tard dans l’ordre d’initiative.",
  "point-out":
    "Vous signalez à vos alliés la position d’une créature que vous avez détectée.",
  "affix-a-fulu":
    "Vous fixez un fulu à un objet ou à une créature selon les conditions de ce fulu.",
  "affix-a-talisman":
    "Vous fixez un talisman à un objet compatible.",
  "invest-an-item":
    "Vous investissez un objet magique afin de pouvoir bénéficier de ses effets investis.",
  "crawl":
    "Vous rampez en restant À terre.",
  "mount":
    "Vous montez sur une créature consentante adaptée comme monture.",
  "raise-a-shield":
    "Vous levez votre bouclier et bénéficiez de son bonus de circonstances à la CA jusqu’au début de votre prochain tour.",
  "take-cover":
    "Vous utilisez votre environnement pour améliorer votre abri. Le niveau d’abri est choisi dans le dialogue PF2e.",
  "avert-gaze":
    "Vous détournez le regard afin de mieux résister aux effets visuels.",
  "drop-prone":
    "Vous vous jetez À terre.",
  "stand":
    "Vous vous relevez."
};

function speakerFor(actor) {
  const cls = globalThis.ChatMessagePF2e ?? ChatMessage;

  try {
    return cls.getSpeaker?.({ actor }) ?? ChatMessage.getSpeaker({ actor });
  } catch {
    return ChatMessage.getSpeaker({ actor });
  }
}

async function enrich(content) {
  return TextEditor.enrichHTML(content, {
    async: true,
    documents: true,
    relativeTo: null
  });
}

function actionLink(entry, label = null) {
  return `@UUID[${entry.uuid}]{${label ?? entry.frenchName}}`;
}

function wrapper(title, glyph, body) {
  return `
    <div class="pf2e-val-action-card">
      <header style="display:flex;align-items:center;gap:.45rem;margin-bottom:.35rem">
        <strong>${foundry.utils.escapeHTML(title)}</strong>
        <span class="pf2-icon" style="margin-left:auto">${foundry.utils.escapeHTML(glyph || "•")}</span>
      </header>
      ${body}
    </div>
  `;
}

export async function postActionDeclaration(
  actor,
  entry,
  {
    record = true,
    text = null
  } = {}
) {
  const resolvedText =
    text ??
    DECLARATION_TEXT[entry.slug] ??
    "Le personnage effectue cette action.";

  const content = await enrich(wrapper(
    entry.frenchName,
    entry.actionCost,
    `
      <p>${foundry.utils.escapeHTML(resolvedText)}</p>
      <p style="margin-bottom:0;font-size:.9em">
        ${actionLink(entry, "Voir la règle")}
      </p>
    `
  ));

  await ChatMessage.create({
    speaker: speakerFor(actor),
    content
  });

  if (record) {
    recordActionUse(actor, entry, {
      mode: "declaration"
    });
  }

  return true;
}

export async function postLeapCard(actor, entry) {
  const actorUuid = foundry.utils.escapeHTML(actor.uuid);

  const content = await enrich(wrapper(
    "Bondir",
    entry.actionCost,
    `
      <p><strong>Horizontal :</strong> jusqu’à 3 m, ou 4,50 m si votre Vitesse est d’au moins 9 m.</p>
      <p><strong>Vertical :</strong> jusqu’à 0,90 m vers le haut et 1,50 m horizontalement.</p>
      <hr>
      <p><strong>Pour aller plus loin :</strong> utilisez un saut d’Athlétisme.</p>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap">
        <button
          type="button"
          data-pf2e-val-jump="long-jump"
          data-pf2e-val-actor="${actorUuid}"
        >
          Sauter en longueur — Athlétisme
        </button>
        <button
          type="button"
          data-pf2e-val-jump="high-jump"
          data-pf2e-val-actor="${actorUuid}"
        >
          Sauter en hauteur — Athlétisme
        </button>
      </div>
      <p style="margin:.45rem 0 0;font-size:.9em">
        ${actionLink(entry, "Règle de Bondir")}
      </p>
    `
  ));

  await ChatMessage.create({
    speaker: speakerFor(actor),
    content
  });

  recordActionUse(actor, entry, {
    mode: "action-menu",
    detail: "leap-card"
  });

  return true;
}

let chatHandlerInstalled = false;

export function initActionChatHandlers() {
  if (chatHandlerInstalled) return;
  chatHandlerInstalled = true;

  document.addEventListener("click", async event => {
    const button = event.target.closest?.("[data-pf2e-val-jump]");
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();

    const slug = button.dataset.pf2eValJump;
    const actorUuid = button.dataset.pf2eValActor;

    if (!slug || !actorUuid) return;

    button.disabled = true;

    try {
      const actor = await fromUuid(actorUuid);

      if (!actor) {
        ui.notifications.warn("Personnage introuvable pour ce saut.");
        return;
      }

      const result = await useRuntimeAction(
        actor,
        slug,
        event
      );

      if (!result.ok) {
        ui.notifications.warn(
          "Impossible de lancer automatiquement ce saut d’Athlétisme."
        );
      }
    } catch (error) {
      console.error(
        "PF2e Val Toolkit | Saut depuis la carte de Bondir",
        error
      );
      ui.notifications.error(
        "Le saut d’Athlétisme n’a pas pu être lancé."
      );
    } finally {
      button.disabled = false;
    }
  });
}
