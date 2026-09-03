import { initScenarioImporter } from "./scenario-importer/index.js";
import { initReferenceIndexExporter } from "./reference-index/index.js";
import { initCombatMovement } from "./combat-movement/index.js";
import { initQuickCombatScene } from "./quick-combat-scene/index.js";
import { initPatches } from "./patches/index.js";
import { initGeneralActionsBrowser } from "./actions-browser/index.js";
import { applyTranslationOverrides } from "./translation-overrides.js";
import {
  initPortraitTokenSync,
  registerPortraitTokenSyncSettings
} from "./portrait-token-sync.js";
import {
  registerGuidedActionSettings
} from "./actions-browser/action-settings.js";
import {
  initCareerXp,
  registerCareerXpSettings
} from "./career-xp/index.js";

Hooks.once("init", () => {
  console.log("PF2e Val Toolkit | Initialisation");
  applyTranslationOverrides();
  registerGuidedActionSettings();
  registerCareerXpSettings();
  registerPortraitTokenSyncSettings();
});

Hooks.once("ready", () => {
  console.log("PF2e Val Toolkit | Ready");

  // PF2e rebuilds part of CONFIG after init. Reapply the terminology override
  // here so native character-sheet pages (including Maîtrises) also use Larcin.
  applyTranslationOverrides();

  initCombatMovement();
  initQuickCombatScene();
  initPatches();
  initGeneralActionsBrowser();
  initCareerXp();
  initPortraitTokenSync();

  if (!game.user.isGM) return;

  initScenarioImporter();
  initReferenceIndexExporter();

  ui.notifications.info("PF2e Val Toolkit chargé.");
});
