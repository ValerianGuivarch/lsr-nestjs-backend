import { initDiscordCharacterChat, registerDiscordCharacterChatSettings } from "./discord-character-chat.js";
import { initScenarioImporter } from "./scenario-importer/index.js";
import { initReferenceIndexExporter } from "./reference-index/index.js";
import { initCombatMovement } from "./combat-movement/index.js";
import { initQuickCombatScene } from "./quick-combat-scene/index.js";
import { initActiveParty, registerActivePartySettings } from "./active-party.js";
import { initCreatureIndex } from "./improvisation/creature-index.js";
import { initEncounterBuilder } from "./improvisation/encounter-builder.js";
import { initQuickNpc } from "./improvisation/quick-npc.js";
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
import {
  initTokenNaming,
  registerTokenNamingSettings
} from "./token-naming.js";
import {
  initPf2eHudIntegration,
  registerPf2eHudIntegrationSettings
} from "./pf2e-hud-integration.js";
import { initQuickEffects } from "./quick-effects/index.js";
import { initTargetContext } from "./target-context/index.js";
import { initPrivateRollCharacterNames } from "./private-roll-names.js";
import { initEarnIncomeCoins } from "./earn-income/index.js";
import { initOutcomeEffects } from "./outcome-effects/index.js";

import { initFamiliarSelector } from "./familiar-selector.js";
import { registerAVControlSettings, initAVControl } from "./livekit-mj-controls.js";
import { migrateSashkaFamiliarFeat } from "./familiar-sashka-migration.js";

Hooks.once("init", () => {
  console.log("PF2e Val Toolkit | Initialisation");
  applyTranslationOverrides();
  registerGuidedActionSettings();
  registerCareerXpSettings();
  registerActivePartySettings();
  registerTokenNamingSettings();
  registerPf2eHudIntegrationSettings();
  registerPortraitTokenSyncSettings();
  registerDiscordCharacterChatSettings();
  registerAVControlSettings();

  // Scene-control hooks must be registered during init, before Foundry builds
  // the left-hand scene controls for the first time.
  initActiveParty();
  initCreatureIndex();
  initEncounterBuilder();
  initQuickNpc();
});

Hooks.once("ready", () => {
  console.log("PF2e Val Toolkit | Ready");

  // PF2e rebuilds part of CONFIG after init. Reapply the terminology override
  // here so native character-sheet pages (including Maîtrises) also use Larcin.
  applyTranslationOverrides();

  initFamiliarSelector();
  initAVControl();
  initCombatMovement();
  initQuickCombatScene();
  initPatches();
  initQuickEffects();
  initOutcomeEffects();
  initEarnIncomeCoins();
  initPrivateRollCharacterNames();
  initTargetContext();
  initGeneralActionsBrowser();
  initCareerXp();
  initTokenNaming();
  initPf2eHudIntegration();
  initPortraitTokenSync();

  if (!game.user.isGM) return;

  void migrateSashkaFamiliarFeat();
  initDiscordCharacterChat();
  initScenarioImporter();
  initReferenceIndexExporter();

  ui.notifications.info("PF2e Val Toolkit chargé.");
});
