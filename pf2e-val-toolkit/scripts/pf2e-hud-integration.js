// PF2e HUD owns its ApplicationV2 sidebar DOM, item handlers, and layout.
// Do not inject child nodes into it or reparent HUD-owned skill/action nodes.
// Both approaches broke the sidebar and token menus for players on PF2e HUD 2.55.
const MODULE_ID = "pf2e-val-toolkit";

export function registerPf2eHudIntegrationSettings() {
  // Keep the old setting keys registered for existing worlds, but hide the
  // controls while the incompatible DOM mutations have been retired.
  for (const [key, name] of [
    ["pf2eHud.localizedActionSort", "Tri localisé du HUD (désactivé pour compatibilité)"],
    ["pf2eHud.groupRecallKnowledge", "Regroupement des actions du HUD (désactivé pour compatibilité)"]
  ]) {
    game.settings.register(MODULE_ID, key, {
      name, scope: "client", config: false, type: Boolean, default: false
    });
  }
}

function removeLegacyInterludeNodes(root) {
  if (!root?.querySelectorAll) return;
  // Only remove our own obsolete widget. Never touch PF2e HUD action nodes,
  // DOM order, listeners, or elements belonging to other modules.
  if (root.matches?.(".pf2e-val-interlude-shortcuts")) root.remove();
  for (const element of root.querySelectorAll(".pf2e-val-interlude-shortcuts")) {
    element.remove();
  }
}

export function initPf2eHudIntegration() {
  if (!game.modules.get("pf2e-hud")?.active) return;

  // The interlude dialogs are still used by the optional native HUD macros.
  if (!document.getElementById("pf2e-val-interlude-css")) {
    const stylesheet = document.createElement("link");
    stylesheet.id = "pf2e-val-interlude-css";
    stylesheet.rel = "stylesheet";
    stylesheet.href = "/modules/pf2e-val-toolkit/styles/interlude-actions.css?v=0.44.16";
    document.head.append(stylesheet);
  }

  removeLegacyInterludeNodes(document);

  // PF2e HUD V14 provides pending ApplicationV2 DOM in this hook; clean up
  // already generated legacy widgets without modifying anything else.
  Hooks.on("renderApplicationV2", (application, element) => {
    if (application?.id === "pf2e-hud-sidebar") removeLegacyInterludeNodes(element);
  });
}
