# Carte de Golarion

Cette application Vite est servie sur le port `4204`. Elle est indépendante de l’administration JdR (`4203`) et utilise les ressources cartographiques d’un dossier externe au dépôt.

## Modes d’affichage

- `/pj` : carte joueur avec zoom complet et recherche. La visibilité ne dépend plus du niveau de zoom :
  - la géographie générale (continents, nations, provinces, cours d’eau, forêts, montagnes, mers, routes…) est publique automatiquement ;
  - les villes sont publiques automatiquement ;
  - les lieux détaillés issus de PathfinderWiki sont masqués automatiquement tant qu’ils n’ont pas été validés ;
  - les districts, bâtiments et autres labels potentiellement scénarisés sont masqués par défaut ;
  - un override MJ `visible` ou `hidden` est prioritaire sur la règle automatique ;
  - un clic PJ n’affiche que le nom public et la description locale validée, jamais le texte PathfinderWiki.
- `/mj-light` : reprend exactement la carte PJ et sa recherche filtrée. Chaque élément visible peut être ouvert pour modifier sa description PJ, ajouter une note MJ optionnelle et le cacher immédiatement aux joueurs. Le mode ne charge pas les descriptions PathfinderWiki complètes, la grille ni les outils de mesure.
- `/mj` : carte maître du jeu complète, avec recherche, détails PathfinderWiki au clic, mesure, menu contextuel, grille hexagonale et panneau de curation de la visibilité joueur. Le panneau complet permet aussi de renseigner la note MJ.

La barre d’évolution temporelle est désactivée dans les trois modes. En ouvrant la racine `/`, l’application redirige automatiquement vers le mode joueur `/pj`.

Les décisions manuelles sont stockées dans SQLite (`pf2_map_visibility_override`) avec trois états fonctionnels dans l’interface : automatique, visible, masqué. Une colonne `mj_text` séparée conserve les rappels et secrets réservés au MJ sans les envoyer aux endpoints PJ. Le catalogue stable utilisé pour relier la carte importée à ces décisions est généré dans `resources/map-source-points.json`.

## Repères de campagne partagés

Les lieux importants sont gérés dans le référentiel **PF2-MJ → Lieux** (champ persistant `map_important`). Le MJ édite une fiche existante ou crée un nouveau lieu, coche **Afficher ce lieu sur la carte publique** et **Lieu important pour tous les PJ**, puis renseigne une latitude et une longitude. Pour récupérer une position d'un lieu déjà connu, chercher son nom dans le champ **Reprendre la position d'un lieu connu sur Golarion** (par exemple `Sandpoint` pour `Pointesable`). Sur la carte en mode `/mj`, un clic droit **★ Ajouter un lieu important (MJ)** ouvre directement une fiche Lieux préremplie avec les coordonnées choisies.

La carte PJ, MJ-light et MJ présente ces repères avec une étoile distinctive, un nom visible même à faible zoom et une liste **★ Lieux importants** permettant de centrer la carte. Ils sont **communs à tous les joueurs** et stockés dans le référentiel actuel, sans préférences locales par navigateur. Aucun bouton de création n'est exposé en mode PJ. Un lieu non publié (`map_visible !== true`) ou sans coordonnées valides n'est jamais transmis à la carte publique, même s'il porte le flag important. Les notes MJ ne sont pas transmises au mode PJ. La sélection de l'icône ordinaire (`map_icon`) reste indépendante de l'importance, en attendant le travail ultérieur sur les pictogrammes.

**Limite d'accès :** la création est réservée à l'interface MJ fonctionnellement. L'API générique historique `/api/pf2-mj/lieux` n'applique pas de contrôle de rôle : cette amélioration ne constitue pas à elle seule une autorisation serveur. Le durcissement de l'accès à l'ensemble du référentiel PF2 devra être traité séparément, sans perturber les autres appels existants.

## Plan illustré d’Absalom

Lorsque l’on zoome sur Absalom (à partir du zoom 7,5), un plan français de la ville apparaît progressivement, géoréférencé sur la carte MapLibre. Les marqueurs PF2, les fenêtres d’information et les règles de visibilité PJ/MJ restent gérés par les couches existantes, au-dessus de l’image. Le bouton **A** en haut à droite, visible à proximité d’Absalom, permet de comparer le plan illustré et le fond vectoriel dans les trois modes.

Le plan par défaut est inclus dans `assets/absalom-overlay.jpg` (carte de Master NI, issue de [Pathfinder-FR](https://www.pathfinder-fr.org/Wiki/Golarion.Absalom.ashx)). Le build Vite copie automatiquement l’image dans `dist` : aucun transfert d’asset supplémentaire n’est nécessaire. On peut la remplacer **sans modifier le code** en définissant `GOLARION_MAP_ABSALOM_OVERLAY_URL` vers une image accessible depuis le navigateur. Une URL relative sous `GolarionMapData` est recommandée, par exemple `/extra/absalom/carte-remplacement.jpg`. Ce réglage est lu au démarrage du serveur de production et par Vite en développement. Une image au cadrage différent peut nécessiter un nouvel ajustement des quatre coins définis dans `src/tools/absalom-overlay.ts`.

Le calage initial est approximatif et doit être vérifié sur la ville (fort Azlant, portes, quai, île des Pilotes). L’image contient des étiquettes publiques de quartiers visibles également en mode PJ : elle ne doit pas être employée pour y insérer des secrets MJ.

## Ressources externes

Par défaut, l’application attend `~/GolarionMapData`, soit `../../GolarionMapData` depuis la racine habituelle du dépôt `~/IdeaProjects/lsr-nestjs-backend`.

Copier dans ce dossier le contenu complet de l’ancien dossier :

`~/Developer/golarion-map-build/mapping/frontend/public/`

Le dossier doit notamment contenir :

- `golarion.pmtiles`
- `search.json`
- `place-names.fr.json`
- `extra/`
- `fonts/`
- `sprites/`

`place-names.fr.json` est également conservé dans le dépôt comme solution de repli pour la compilation du style. La copie externe complète reste la référence utilisée par l’application.

Pour utiliser un autre emplacement, définir `GOLARION_MAP_ASSETS_DIR` avec un chemin absolu ou relatif au dossier depuis lequel le projet est lancé.

Sur le Mac de développement actuel, si `~/GolarionMapData` n’existe pas, l’application détecte automatiquement l’ancien dossier `~/Developer/golarion-map-build/mapping/frontend/public`. Ainsi, `npm run dev:golarion-map` fonctionne sans configuration locale supplémentaire. Une valeur explicite de `GOLARION_MAP_ASSETS_DIR` reste toujours prioritaire.

`GOLARION_MAP_PUBLIC_ORIGIN` est facultatif. Sans valeur, tous les fichiers sont chargés depuis le serveur de la carte. Pour héberger les assets sur un autre domaine, lui donner l’origine publique correspondante.

## Commandes

- `npm run dev:golarion-map` : carte seule sur `http://localhost:4204`
- `npm run dev:jdr-golarion` : API JdR, administration React sur `4203` et carte sur `4204`
- `npm run build:golarion-map` : build du code dans `dist/apps/web-golarion-map`, sans copier les ressources lourdes
- `npm run start:golarion-map` : serveur de production sur `4204`, avec les ressources chargées depuis `GOLARION_MAP_ASSETS_DIR`

`node_modules` et `dist` sont générés et ignorés par Git. Le dossier `GolarionMapData` reste hors GitHub et doit être copié séparément sur la machine ou le NAS.

## Déploiement recommandé

Le build ne dépend pas de `GolarionMapData` et peut donc être exécuté dans GitHub Actions ou immédiatement après un clone :

`npm run build:golarion-map`

Sur le NAS, conserver les ressources dans un dossier séparé et donner son chemin au serveur :

```bash
export GOLARION_MAP_ASSETS_DIR=/volume1/docker/lsr/GolarionMapData
npm run build:golarion-map
npm run start:golarion-map
```

Le chemin peut être différent sur le Mac et le NAS : il n’est pas enregistré dans le build. `GOLARION_MAP_PORT` permet aussi de changer le port, qui vaut `4204` par défaut.

Le serveur lit également le `.env` situé à la racine du dépôt. `GOLARION_MAP_PLACES_URL` permet de changer l’API PF2 utilisée par les marqueurs et la curation ; les URL `source-points`, `visibility` et `curation` sont dérivées automatiquement de cette base.

Quand les données du projet cartographique amont sont rafraîchies, régénérer le catalogue de curation sans toucher aux décisions SQLite :

```bash
npm run refresh:golarion-map-curation
```

Le script lit par défaut le checkout frère `../golarion-map-build/mapping`. `GOLARION_MAP_SOURCE_ROOT` ou `--mapping-root` permet d’indiquer un autre emplacement.

Le serveur fourni accepte les requêtes `Range` nécessaires à PMTiles. Il sert le code depuis `dist/apps/web-golarion-map` et les données depuis le dossier externe, sous une même adresse HTTP.

Une autre possibilité est de servir le build avec Nginx et de monter le contenu de `GolarionMapData/` à la racine du même site. Dans ce cas, Nginx doit également accepter les requêtes `Range` sur `golarion.pmtiles`.
