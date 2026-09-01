# PF2 MJ

L’interface est disponible sur `/pf2-mj` via `npm run dev:pf2-mj` ou `npm run launch -- --profile pf2`.

Les données JSON sont versionnées dans `data/`. Les documents PDF ne sont pas copiés dans ce dépôt : l’API les lit depuis `PF2_LIBRARY_ROOT`, qui vaut par défaut `../../PF2/MJ` depuis la racine du dépôt. Sur un NAS, définissez cette variable vers le dossier partagé contenant `MJ`.

Les portraits de PNJ sont enregistrés dans `STORAGE_PATH/portraits/`, indexés
dans `pf2_media`, puis téléversés à la demande via le Relay vers
`assets/l7r/portraits/` dans Foundry. `FOUNDRY_ASSETS_ROOT` ne sert plus qu'à
lire les portraits historiques en repli ; aucun nouveau portrait ne dépend du
chemin NAS historique.

Les liens vers les documents passent tous par l’API du serveur en cours d’exécution. Ainsi, un clic ouvre le PDF accessible depuis la machine (ou le NAS) qui héberge l’application.
