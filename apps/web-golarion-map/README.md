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

## Lieux de quête, favoris et contributions des joueurs

**Guide détaillé et décisions validées :** [Synchronisation des quêtes Discord avec la carte](../../docs/pf2/discord-quest-map-sync.md). Les données effectives des lieux, de leurs titres et de leurs associations sont dans `pf2.sqlite`, et non dans ce README.

### ★ Lieux de quête

- Un **lieu** garde un seul repère géographique, y compris quand **plusieurs quêtes** s'y déroulent. Une quête peut aussi être associée à plusieurs lieux.
- Les fils du forum Discord `journal-de-quetes` sont la source des titres et du statut « Terminée ». Le bot NestJS synchronise leurs IDs/titres/tags à l'initialisation et toutes les **cinq minutes** dans `pf2_discord_quest`. `pf2_map_place_quest` contient les associations stables par ID de fil.
- Le clic sur un repère ouvre la liste des quêtes associées, avec état et lien vers Discord. Renommer un fil sur Discord met à jour son titre à la prochaine synchronisation réussie, **après actualisation de la page** : il n'est pas nécessaire de recréer le repère.
- Si toutes les quêtes liées sont terminées, le repère et sa ligne dans la liste sont **masqués par défaut**, sans suppression de données. Cocher **Afficher les quêtes terminées** les réaffiche. Les associations inconnues ou historiques non résolues restent visibles pour vérification.
- Les modes PJ, MJ-light et MJ disposent du menu **Lieux de quête**. Les modifications des associations utilisent un sélecteur de fils Discord, et non une saisie libre du titre de la quête.

### Carte hybride : regroupement selon le zoom

- **À faible et moyen zoom (inférieur à 9)**, les lieux de quête proches à l'écran (moins de 64 pixels de distance) sont regroupés sous une étoile portant le **nombre de quêtes distinctes**, pas le nombre de lieux. Une même quête liée à deux lieux du groupe n'est comptée qu'une seule fois.
- Le clic sur un regroupement ouvre une **liste par lieu**, avec pour chaque lieu les quêtes Discord et leurs liens. Le bouton **Zoomer pour distinguer les lieux** sépare les marqueurs. Le clic sur un nom de lieu permet de zoomer directement dessus.
- **À partir du zoom 9**, un marqueur est affiché par lieu. Un lieu avec plusieurs quêtes conserve un seul marqueur, enrichi d'un badge indiquant le nombre de quêtes. Deux lieux distincts ayant presque exactement les mêmes coordonnées sont légèrement décalés à l'écran pour rester accessibles ; leurs coordonnées en base ne changent pas.
- Le filtre **Afficher les quêtes terminées** s'applique également aux groupes et aux compteurs. Pour une localisation mixte, les quêtes terminées restent masquées dans le panneau tant que la case n'est pas cochée.
- Les listes **Lieux de quête** et **Favoris** restent séparées ; le clic sur une entrée de quête ouvre un zoom suffisamment élevé pour éviter qu'un regroupement masque son repère.
- Le regroupement est **uniquement visuel**, côté navigateur ; aucune quête, association ou coordonnée n'est créée, déplacée ou supprimée dans SQLite.

### ☆ Favoris distincts des quêtes

Le menu **Favoris**, partagé entre les trois modes, rassemble les lieux ordinaires favoris du référentiel et du catalogue géographique. Les favoris conservent leur **seuil de zoom normal** et ne sont pas transformés en grosses étoiles de quête persistantes. Le favori de référence **Grande Loge** et le lieu de quête **Grande Loge** peuvent coexister comme repères distincts ; éviter de fusionner leurs identités sur la seule base du nom.

### + Lieu : contribution PJ et MJ

- Un PJ peut créer un lieu de quête en sélectionnant sa position sur la carte et en choisissant une ou plusieurs quêtes Discord, ou créer un **lieu personnalisé** libre, sans quête obligatoire, à l'icône plus discrète.
- Le formulaire intégré recueille titre libre, description et associations ; il **remplace les pop-up natifs du navigateur**. La création d'une nouvelle quête elle-même reste sur Discord (création d'un fil, sans commande `/créer quête`).
- **Décision de partage :** aucune validation MJ. Une fiche créée par un PJ (`map_origin='pj'`) est immédiatement partagée. Les PJ peuvent modifier et supprimer les fiches d'origine PJ, mais ne doivent pas réécrire les lieux MJ ou de référence via les routes communautaires.
- La logique d'interface `/pj`, `/mj-light`, `/mj` ne remplace **pas** une authentification côté serveur. Les endpoints communautaires historiques ne vérifient pas l'identité de l'auteur : le contrôle d'accès demeure un travail ouvert, même si le partage est volontairement libre entre PJ.

### Compatibilité et migrations

La migration `038-map-quest-sites-and-examples` créait les premiers lieux de quête et favoris de démonstration ; ses exemples historiques ne doivent **pas** être interprétés comme l'état présent de la base. La migration `039-discord-quest-catalogue-and-map-links` introduit le catalogue Discord et ses liaisons. Les anciens champs `map_quest_name` / `map_quest_names` restent lisibles pour compatibilité ; les associations actives sont les IDs des fils Discord. Les corrections ultérieures de noms de points, de position ou de visibilité faites sur le mini-PC **ne nécessitent pas de modification du code**.

## Plan illustré et calage de Pointe-Sable

Le plan historique fourni par le MJ provient du fichier [Pointesable.jpg sur Nos Aventures en Golarion](https://nos-aventures-en-golarion.fandom.com/fr/wiki/Fichier:Pointesable.jpg). Le serveur d'images Wikia refuse parfois les téléchargements directs (403) : une copie de cette **même image** est incluse dans le build en WebP (`assets/pointesable-overlay.webp`), afin d'éviter de dépendre du site externe à l'affichage. Il s'agit d'un plan illustré, et non d'un fond géographique précis.

- Dans les modes **PJ / MJ-light / MJ**, zoomer sur Pointe-Sable (Sandpoint) : le plan apparaît progressivement à partir du zoom **8,5**, devant le fond de carte et **derrière les icônes/noms de lieux**. Le bouton **P** permet de le masquer et de le réafficher.
- Dans le mode **MJ**, cliquer sur **Caler**, à côté du bouton **P** : le plan passe à 65 % d'opacité ; les quatre coins numérotés sont déplaçables. Les flèches permettent d'ajuster sa position ; les boutons L ± / H ± modifient indépendamment la largeur et la hauteur. Les actions **Défaut**, **Annuler**, et **Enregistrer pour tous** ont le même rôle qu'à Absalom.
- Le premier placement autour de `[-27.164, 44.097]` est **approximatif**, à ajuster visuellement par le MJ. Le calage se conserve dans `pf2.sqlite`, entrée `geography-config/pointesable-overlay`, exposée par `GET /api/pf2-mj/map/pointesable-overlay` et `PUT` sur la même route. Aucun calage d'Absalom n'est modifié.
- Le seul nom de la ville sur la couche vectorielle peut être masqué pendant l'affichage du plan ; les autres POI, leurs icônes et leurs noms restent visibles.
- On peut remplacer l'image par une autre, sans modifier le code, via `GOLARION_MAP_POINTESABLE_OVERLAY_URL`, à condition qu'elle soit accessible au navigateur ; un nouveau cadrage peut être nécessaire. Le calage sauvegardé prend effet pour tous **après actualisation** de la carte.

Le réglage est volontairement indépendant de celui d'Absalom. Les routes de sauvegarde suivent actuellement le même modèle MJ côté interface que le calage d'Absalom ; **elles ne doivent pas être considérées comme protégées par un contrôle d'accès serveur renforcé** tant que l'authentification des outils MJ n'a pas été traitée.

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
