// PF2_AI_TWO_PASS_REFERENCE_LIBRARY_V1
if (!game.pf2eValToolkit?.exportReferenceLibrary) {
  ui.notifications.error("PF2e Val Toolkit : exportReferenceLibrary indisponible. Recharge Foundry après mise à jour du module.");
} else {
  await game.pf2eValToolkit.exportReferenceLibrary();
}
