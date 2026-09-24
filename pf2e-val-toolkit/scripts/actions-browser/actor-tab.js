import { clearGeneralActionIndexCache } from "./action-index.js";
import {
  openGuidedActionSettings
} from "./action-settings.js";
import { initActionChatHandlers } from "./action-chat.js";
import { initCharacterSheetNavigation } from "./sheet-navigation.js";
import { initConditionsBrowser } from "./conditions-tab.js";

export function initGeneralActionsBrowser() {
  // Le navigateur d'actions guidées reste masqué, mais l'onglet générique
  // États & conditions est actif et expose aussi le contexte contre la cible.
  // initGuidedActionsBrowser();
  initConditionsBrowser();
  initCharacterSheetNavigation();
  initActionChatHandlers();

  game.pf2eValToolkit ??= {};
  game.pf2eValToolkit.actionsBrowser = {
    refresh: async () => {
      clearGeneralActionIndexCache();

      for (const actor of game.actors.filter(a => a.type === "character")) {
        if (actor.sheet?.rendered) actor.sheet.render(false);
      }
    },

    openSettings: openGuidedActionSettings
  };
}
