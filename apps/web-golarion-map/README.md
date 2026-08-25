# Carte de Golarion

Cette application Vite est servie sur le port `4204`. Elle est indépendante de l’administration JdR (`4203`) et utilise les ressources cartographiques d’un dossier externe au dépôt.

## Modes d’affichage

- `/pj` : carte joueur sans interactions de contenu, avec trois niveaux réglables depuis la carte ou l’URL.
  - `?detail=essential` : régions, nations, cours d’eau, grandes villes et capitales ; zoom maximal `7`.
  - sans paramètre, ou `?detail=standard` : ajoute les provinces et villes moyennes ; zoom maximal `9`.
  - `?detail=detailed` : toutes les couches et la recherche, mais toujours sans fenêtres au clic, outils MJ ni grille ; zoom maximal `12`.
- `/mj` : carte maître du jeu avec détails au clic, mesure, menu contextuel et grille hexagonale.

La barre d’évolution temporelle est désactivée dans les deux modes. En ouvrant la racine `/`, l’application utilise automatiquement le mode MJ.

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

Le serveur fourni accepte les requêtes `Range` nécessaires à PMTiles. Il sert le code depuis `dist/apps/web-golarion-map` et les données depuis le dossier externe, sous une même adresse HTTP.

Une autre possibilité est de servir le build avec Nginx et de monter le contenu de `GolarionMapData/` à la racine du même site. Dans ce cas, Nginx doit également accepter les requêtes `Range` sur `golarion.pmtiles`.
