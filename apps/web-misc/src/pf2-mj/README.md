# PF2 MJ — catalogue V3

L’interface reste disponible sur `/pf2-mj`.

La V3 sépare explicitement :

- les conteneurs non jouables (campagnes, saisons, collections) ;
- les unités jouables, seules proposées dans « Trouver une partie » ;
- les composants secondaires (guides, cartes, compilations, ressources) ;
- les documents PDF physiques ;
- les ZIP de ressources Foundry.

Le fichier `data/catalogue-pf2.json` reste en schéma V2 pendant la migration. `catalogue.ts` construit le modèle V3 à l’exécution en conservant les ids historiques et les associations documentaires.

## Scanner local

Le backend scanne maintenant :

- `.pdf` et `.pd` ;
- les PDF dont le nom contient `(info)` / `(information)` ;
- tous les `.zip` présents sous `PF2_LIBRARY_ROOT`.

Les ZIP sont associés par titre, alias, numéro PFS et chemin. Un ZIP associé à une campagne reçoit `scope: descendants` et couvre donc ses épisodes. Un ZIP associé à une unité jouable reçoit `scope: exact`.

L’inventaire ZIP est servi par :

- `GET /api/pf2-mj/resource-bundles` ;
- `POST /api/pf2-mj/local-scan` pour le rapport PDF + ZIP complet.

Une association incertaine reste `review` et n’est jamais assimilée silencieusement à un ZIP confirmé.

## Curation

Toutes les nouvelles écritures passent par `curation.byId[id]`. Les anciennes structures sont conservées pour lecture rétrocompatible ; elles ne sont pas détruites pendant cette étape.

Voir `ARCHITECTURE_V3.md` pour le modèle détaillé.

## Source de vérité SQLite

Le catalogue et la géographie ne sont plus importés directement depuis les JSON du frontend. Ils sont chargés via l'API depuis `pf2.sqlite`. Les anciennes sources sont archivées dans `data/old/` pour bootstrap/rollback uniquement.

Les données partageables se récupèrent via `data-export/*` et se réimportent via `data-import/*` (avec `?dryRun=true` pour une validation sans écriture). Voir `PF2_SQLITE_MIGRATION.md` à la racine du dépôt.
