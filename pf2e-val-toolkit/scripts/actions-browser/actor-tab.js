import { clearGeneralActionIndexCache } from "./action-index.js";
import {
  openGuidedActionSettings
} from "./action-settings.js";
import { initActionChatHandlers } from "./action-chat.js";
import { initCharacterSheetNavigation } from "./sheet-navigation.js";

export function initGeneralActionsBrowser() {
  // Le navigateur d'actions est conservé dans le module, mais n'est plus
  // injecté visuellement sur les fiches pour le moment.
  // initGuidedActionsBrowser();
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
