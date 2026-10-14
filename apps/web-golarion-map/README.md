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

## Cohérence des repères MJ et PJ

Les trois modes affichent maintenant les repères **publiés** sur la carte PJ :
- les lieux du catalogue source explicitement rendus visibles par le MJ (comme `Grand Lodge → Grande Loge`) sont réinjectés aussi dans le mode MJ, qui conserve par ailleurs les points et informations d'origine ;
- les libellés non-localisation explicitement publiés sont également réinjectés en MJ ;
- les villes normalement déjà visibles sur la carte MJ ne sont pas doublées inutilement.

En cliquant sur un lieu du catalogue en mode `/mj`, le panneau **Visibilité joueurs** permet de cocher **★ Lieu important pour tous les PJ** : la validation publie le lieu et enregistre le favori directement sur le point existant, sans création d'une nouvelle fiche de lieu. Cela vaut aussi pour les libellés cartographiques modifiables. L'étoile correspondante est rendue comme un marqueur ancré aux coordonnées officielles et rejoint la liste globale des lieux importants en modes MJ et PJ. Le repère est visible après **rechargement de la carte** ; le mode PJ ne peut pas en créer.

La nouvelle donnée `important` des règles de visibilité est persistée par la migration SQLite `034-map-important-overrides`. L'endpoint `/map/important-places` ne publie que les favoris explicitement visibles : il ne retourne ni texte MJ ni référence Wiki interne.

## Menus partagés « Favoris » et « Lieux de quête »

Deux menus sont affichés en haut à gauche des modes PJ, MJ-light et MJ :

- **★ Lieux de quête** : un repère géographique par lieu, quel que soit le nombre de quêtes qui s'y déroulent. En ouvrant le repère, les joueurs voient une liste de toutes les quêtes associées. Le MJ et le MJ-light peuvent modifier cette liste directement dans la fenêtre du lieu (une quête par ligne, jusqu'à 30), sans créer de nouveau marqueur. Les actions « Convertir en lieu normal » et « Supprimer le lieu » continuent à porter sur le lieu entier, et non sur une seule quête.
- **☆ Favoris** : une liste distincte de tous les lieux ordinaires favoris. Elle réunit les lieux du référentiel PF2 et ceux du catalogue de Golarion, dont la Grande Loge. Sélectionner une entrée recentre la carte et ouvre ses informations ; le nom du lieu conserve ses règles normales de visibilité selon le zoom, sans grosse étoile permanente.

Les fiches existantes avec un seul `map_quest_name` restent compatibles. Le nouveau champ `map_quest_names` est une liste de chaînes, avec `map_quest_name` conservé comme premier élément pour la compatibilité. Aucune migration de données destructive n'est nécessaire. Les quêtes sont des **noms affichés**, pas des références automatiques au wiki des quêtes.

Dans **PF2-MJ → Lieux**, sélectionner le type « Lieu de quête » et saisir plusieurs quêtes, une par ligne. Côté carte, cliquer sur le lieu en MJ/MJ-light et choisir « Modifier les quêtes associées ». Les PJ voient la liste sans droit de modification dans l'interface.

## Favoris et lieux de quête : deux systèmes indépendants

### ☆ Favori partagé
Un PJ, un MJ ou un MJ-light peut mettre en favori **un lieu déjà publié**, sans en modifier la localisation, le nom, ou les informations cachées. Son texte devient **doré et gras**, précédé d'une petite étoile, mais respecte exactement son niveau de zoom habituel : aucun grand marqueur universel n'est créé. Le champ `map_important` reste la source des favoris ordinaires. Le bouton de la fenêtre d'un lieu permet également de retirer le favori.

### ★ Lieu de quête
Le **MJ** crée un lieu de quête à une position libre avec un clic droit sur la carte `/mj`, option **Créer un lieu de quête**. Il indique le nom du lieu puis le nom de la quête. Cela crée un enregistrement de type `lieu` avec `map_kind: "quest"` et `map_quest_name`, à la latitude/longitude géographique choisie. Il reste marqué par une étoile de 30 px à n'importe quel zoom, dans la liste **Lieux de quête**, sans transformer une ville existante en doublon. Dans **PF2-MJ → Lieux**, le MJ peut également choisir ce type et renseigner la quête.

Quand une quête est terminée, le MJ ou le MJ-light clique sur son étoile, puis choisit **Convertir en lieu normal** (enlève le statut de quête et garde le lieu sur la carte aux zooms habituels) ou **Supprimer le lieu de quête** (supprime uniquement cette fiche après confirmation). Ces opérations refusent un lieu normal. En mode PJ, les commandes de création, conversion et suppression ne sont pas proposées.

### Jeu de données de validation
L'initialisation idempotente `038-map-quest-sites-and-examples`, exécutée **après** les données initiales, prend uniquement les ruines azlantes déjà publiées et marquées importantes, les convertit en **lieu de quête sans changer leurs coordonnées**, met **Grand Lodge / Grande Loge** en favori ordinaire si le lieu est déjà publié, puis ajoute **La demande de Pointe-Sable** comme lieu de quête au point officiel de Sandpoint (`-27.16403, 44.09723`) avec l'identifiant `quest-demande-pointesable`. La migration ne crée pas de deuxième ville de Pointesable et ne modifie aucun lieu non concerné.

**Limitation de sécurité existante :** les accès `/mj` et `/mj-light` distinguent les contrôles dans l'interface, mais les routes PF2-MJ historiques n'ont pas de véritable authentification par rôle. Les utilisateurs ordinaires de la carte ne disposent pas de ces boutons ; cela ne constitue pas une barrière serveur contre des appels API forgés. Une authentification de ces routes sera nécessaire pour garantir une séparation MJ/PJ stricte.

## Calage interactif du plan d’Absalom

En mode `/mj`, centre la carte sur Absalom et zoome : le bouton **Caler** est à droite du bouton **A**. Il affiche le plan à 65 % d'opacité, puis permet :
- déplacement avec les flèches et augmentation/réduction indépendantes de la largeur et de la hauteur ;
- déplacement précis des **quatre coins numérotés** pour corriger l'alignement ou la perspective ;
- comparaison avec le fond cartographique et option de masquer les noms de l'ancien fond ;
- **Enregistrer pour tous** (SQLite) ou **Annuler**, qui restaure le précédent calage.

Les coordonnées absolues des quatre coins sont stockées dans l'enregistrement `geography-config/absalom-overlay` et exposées par `GET /api/pf2-mj/map/absalom-overlay`, ce qui permet aux modes PJ/MJ-light/MJ de charger toujours le **même** plan recalé, indépendamment du navigateur ou du zoom. `PUT` valide un quadrilatère raisonnable avant sauvegarde.

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
