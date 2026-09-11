(async () => {
  if (!game.user.isGM) {
    return ui.notifications.warn("Seul le MJ peut configurer la Bibliothèque de cartes.");
  }

  if (!game.pf2eValToolkit?.mapLibrary?.toggleSelectedToken) {
    return ui.notifications.error("PF2e Val Toolkit : Bibliothèque de cartes indisponible.");
  }

  await game.pf2eValToolkit.mapLibrary.toggleSelectedToken();
})();
