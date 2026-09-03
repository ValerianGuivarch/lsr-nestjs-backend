import { getActionDocument } from "./action-index.js";

function actionCandidates(document) {
  const values = [
    document?.slug,
    document?.system?.slug,
    foundry.utils.slugify(document?.name ?? "")
  ];

  return [...new Set(values.filter(Boolean))];
}

async function callNativeAction(candidate, actor, event) {
  const registry = game.pf2e?.actions;
  if (!registry) return false;

  const action = registry[candidate];
  if (!action) return false;

  const options = {
    actors: [actor],
    event
  };

  if (typeof action === "function") {
    await action(options);
    return true;
  }

  if (typeof action.use === "function") {
    await action.use(options);
    return true;
  }

  if (typeof action.roll === "function") {
    await action.roll(options);
    return true;
  }

  return false;
}

export async function useGeneralAction(actor, entry, event) {
  const document = await getActionDocument(entry.id);
  if (!document) {
    ui.notifications.error("Action PF2e introuvable.");
    return;
  }

  for (const candidate of actionCandidates(document)) {
    try {
      if (await callNativeAction(candidate, actor, event)) return;
    } catch (error) {
      console.error(
        `PF2e Val Toolkit | Erreur lors de l'action native ${candidate}`,
        error
      );
      ui.notifications.error(
        `${document.name} n'a pas pu être lancée automatiquement.`
      );
      return;
    }
  }

  // Not every basic/general action has an automated PF2e macro. In that case
  // show the official compendium item rather than reimplementing its rules.
  document.sheet?.render(true);
  ui.notifications.info(
    `${document.name} n'a pas de jet automatique : règle officielle ouverte.`
  );
}

export async function openGeneralAction(entry) {
  const document = await getActionDocument(entry.id);
  if (!document) {
    ui.notifications.error("Action PF2e introuvable.");
    return;
  }

  document.sheet?.render(true);
}
