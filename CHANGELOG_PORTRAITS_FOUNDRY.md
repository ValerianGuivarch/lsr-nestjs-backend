# PF2-MJ — correctif portraits Foundry

- Suppression des hotlinks `image: https://...` du runtime PNJ.
- Un portrait actif doit être sous `assets/l7r/portraits/pnj/`.
- Upload, collage et import par URL écrivent directement dans le dossier
  `FOUNDRY_ASSETS_ROOT/portraits/pnj`.
- Pour un PNJ déjà associé à un Actor Foundry, le nouveau portrait est persisté
  puis appliqué à l'Actor.
- L'endpoint de lecture ne sert plus que le dossier de portraits Foundry et
  accepte WebP, GIF, PNG et JPEG.
- Le frontend ne tente jamais de charger une image externe.
- Le portrait de carte ouvre la fiche du PNJ.
- Le bouton « Voir la fiche » a été supprimé.
- Une petite icône de copie est superposée au portrait ; elle devient
  temporairement ✓ « Copié » après succès.
- La copie passe par l'endpoint même origine PF2-MJ, supprimant le problème CORS
  des anciennes URLs externes.
- Ajout de `scripts/sync_pf2_portraits.py` :
  - recherche des portraits déjà installés dans Foundry ;
  - détection d'Actors dans les données Foundry lisibles ;
  - centralisation vers `assets/l7r/portraits/pnj` ;
  - migration des anciennes URLs connues ;
  - recherche en ligne optionnelle et stricte via PathfinderWiki ;
  - mise à jour du JSON et tentative de synchronisation SQLite via l'API.
