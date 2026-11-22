# Organisation et entretien du mini-PC — `/home/valou/services`

Convention validée le 22 novembre 2026. Les dossiers actifs restent à leurs emplacements actuels : ne pas déplacer un montage Docker, une base, des données Foundry ou un répertoire de déploiement.

## Rangement obligatoire
- `_travail/<projet>/<date>-<sujet>/` : fichiers temporaires, exports, imports, conversions, essais et worktrees ponctuels. Supprimer à la validation.
- `_sauvegardes/<projet>/` : sauvegardes utiles et datées, documenter la raison et la procédure de restauration. Éviter les snapshots successifs une fois l'opération validée.
- `_a_supprimer/<date>/` : quarantaine des éléments ambigus ; vérifier avant suppression définitive. Ne pas l'utiliser pour une sauvegarde nécessaire.
- Aucun fichier ponctuel à la racine de services. Les sources de vérité restent Git, la bibliothèque PF2 et les systèmes métiers. Les scripts réellement réutilisables doivent être rangés et référencés dans le Markdown pertinent ; ne pas publier les données privées.
- Avant un nettoyage, vérifier montages, conteneurs même arrêtés, processus en cours, références documentaires et état Git. Ne jamais écrire dans le dépôt de déploiement ni modifier un worktree concurrent.

## PF2
- Conserver tous les PDF de cartes et guides joueurs, ainsi que les autres PDF. Le catalogue se réconcilie via le scan de bibliothèque de l'application, pas par modification directe SQLite.
- Les PDF Monster Core 1 et 2 sont désormais dans `pf2-data/Références/Règles/` (noms inchangés). Les scripts privés ont été ajustés. Les méthodes, mappages, rapports et sources d'images réutilisables restent dans `pf2-data/_AI/monster-core-complet/`, `monster-core-pilote/`, `bestiary-legacy/` ; voir [Foundry](foundry.md).
- `pf2-data/_AI/cartes-audit-20261111/` contient l'audit de cartes référencé, notamment le pilote Route ouverte. Préserver `required-data` et les travaux récents.
- Les snapshots historiques Foundry de septembre à début novembre et l'archive de migration du 31 août ont été supprimés à la demande du MJ après validation de l'exploitation ; les mentions historiques dans les fiches ne sont pas des chemins de restauration disponibles. Les audits du 22 novembre et la sauvegarde d'organisation du 21 novembre sont préservés.
- Les copies de bases et sauvegardes PF2 déplacées sont dans `_sauvegardes/PF2/`, notamment `db_copy`, `backup-projet-choix-libre-20261116` et `pf2-pdf-backup-20261121`. Les 19 PDF de cette dernière ont été restaurés dans la bibliothèque. Les documents sources restent privés.
- `tmp-sot` et les autres travaux récents sont exclus du rangement tant que l'intervention parallèle n'est pas clôturée.

## Recalbox
Les ROM déjà importées et les répertoires de conversion locaux ont été supprimés avec accord utilisateur. Le dossier `roms/` reste vide car référencé par le conteneur. Les configurations, listes de jeux, sauvegardes de parties SNES et diagnostic support sont conservés dans `_sauvegardes/Recalbox/`. Ne jamais supprimer ni parcourir récursivement les montages CIFS `recalbox/share` ou `recalbox/system` lors du ménage local.

## Docker
- Le déploiement LSR produit sept images taguées par SHA de commit ; des centaines de déploiements expliquent l'accumulation. Nettoyer les images inutilisées et les vieux caches de construction après déploiement réussi, en protégeant les images référencées par tous les conteneurs et les images récentes d'un déploiement concurrent.
- Ne jamais supprimer automatiquement les volumes, conteneurs arrêtés ou images privées non reproductibles. Vérifier l'état des services et l'espace disque après entretien.
- Les worktrees intégrés et propres sont supprimés avec `git worktree remove` ; conserver ceux en cours.
