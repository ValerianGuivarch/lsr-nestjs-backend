const NAV_CLASS = "pf2e-val-character-sheet-nav";
const OVERVIEW_CLASS = "pf2e-val-character-overview-nav";
const LABEL_CLASS = "pf2e-val-character-nav-heading";

function getRoot(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

function getActor(app) {
  return app?.actor ?? app?.object ?? app?.document ?? null;
}

function isCharacterSheet(app) {
  return getActor(app)?.type === "character";
}

function findPrimaryNavigation(root) {
  const candidates = Array.from(
    root.querySelectorAll(
      "nav, .sheet-navigation, .sheet-tabs, .tabs"
    )
  );

  return candidates.find(element => {
    const hasActions =
      element.querySelector('[data-tab="actions"]');
    const hasInventory =
      element.querySelector('[data-tab="inventory"]');

    return hasActions && hasInventory;
  }) ?? null;
}

function normalizedText(element) {
  return String(element?.textContent ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase(game.i18n.lang);
}

function isCharacterHeading(element) {
  const text = normalizedText(element);

  return (
    text === "personnage" ||
    text === "character"
  );
}

function compactNativeCharacterEntry(navigation) {
  const children = Array.from(navigation.children);

  // PF2e 8.3.0's French sheet has a wide "Personnage" entry/heading at the
  // start of the navigation bar. Depending on the exact sheet markup it can
  // either be the overview tab itself or a non-tab heading. Handle both
  // without depending on one private PF2e class name.
  const candidate =
    children.find(element =>
      element.matches?.('[data-tab="character"]')
    ) ??
    children.find(isCharacterHeading) ??
    null;

  if (!candidate) return;

  const label =
    normalizedText(candidate) === "character"
      ? "Character"
      : "Personnage";

  if (candidate.matches?.("[data-tab]")) {
    candidate.classList.add(OVERVIEW_CLASS);
    candidate.title = label;
    candidate.setAttribute("aria-label", label);

    // Keep the tab fully functional but make it icon-only, like the rest of
    // the PF2e navigation. This saves the width previously occupied by the
    // word "Personnage".
    candidate.innerHTML =
      '<i class="fa-solid fa-user" aria-hidden="true"></i>';
  } else {
    candidate.classList.add(LABEL_CLASS);
    candidate.setAttribute("aria-hidden", "true");
  }
}

function compactCharacterNavigation(app, html) {
  if (!isCharacterSheet(app)) return;

  const root = getRoot(html);
  if (!root) return;

  const navigation = findPrimaryNavigation(root);
  if (!navigation) return;

  navigation.classList.add(NAV_CLASS);

  compactNativeCharacterEntry(navigation);

  // Les actions restent disponibles dans PF2e, mais leur onglet est masqué
  // visuellement à la demande de la table.
  navigation.querySelector('[data-tab="actions"]')?.remove();
  root.querySelector('.tab[data-tab="actions"]')?.remove();

  // This browser is retired. Remove a tab left by a previously rendered sheet
  // as well, so a hot reload does not leave a dead Conditions entry visible.
  navigation.querySelector('[data-tab="pf2e-val-conditions"]')?.remove();
  root.querySelector('.tab[data-tab="pf2e-val-conditions"]')?.remove();
}

export function initCharacterSheetNavigation() {
  // Registered after the Toolkit Actions and Conditions tabs, so the
  // centering applies to the complete final row.
  Hooks.on(
    "renderCharacterSheetPF2e",
    compactCharacterNavigation
  );

  Hooks.on(
    "renderActorSheet",
    compactCharacterNavigation
  );
}
