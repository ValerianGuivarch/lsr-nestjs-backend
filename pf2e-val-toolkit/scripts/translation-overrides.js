/**
 * French terminology overrides for PF2e 8.3.0.
 *
 * The installed French translation calls Thievery "Vol". The toolkit uses
 * "Larcin" everywhere to avoid confusion with flight and the abbreviation for
 * Will.
 */

function patchDictionary(dictionary) {
  if (!dictionary || typeof dictionary !== "object") return;

  foundry.utils.setProperty(
    dictionary,
    "PF2E.Skill.Thievery",
    "Larcin"
  );

  foundry.utils.setProperty(
    dictionary,
    "PF2E.ActionsCheck.thievery",
    "Test de Larcin"
  );
}

function patchConfig() {
  const thievery = CONFIG.PF2E?.skills?.thievery;

  if (!thievery || typeof thievery !== "object") return;

  // Do this unconditionally. During init PF2e can rebuild CONFIG after our
  // first localization override, which was why the native "Maîtrises" page
  // could still display "Vol".
  thievery.label = "Larcin";

  if ("short" in thievery) {
    thievery.short = "Larcin";
  }

  if ("labelShort" in thievery) {
    thievery.labelShort = "Larcin";
  }
}

export function applyTranslationOverrides() {
  if (game.i18n?.lang !== "fr") return;

  patchDictionary(game.i18n.translations);
  patchConfig();
}
