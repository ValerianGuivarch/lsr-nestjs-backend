# PF2e Val Toolkit — v0.8.0

Ajout de la campagne complète **Agents d'Absalom** à partir des deux volumes français fournis.

## Imports Agents d'Absalom

```text
foundry-imports/
└── Agents d'Absalom/
    ├── AOE-01-le-diable-du-palais-des-reves.json
    ├── AOE-02-soixante-pieds-sous-terre.json
    ├── AOE-03-pas-de-compromis.json
    ├── AOE-04-assaut-sur-le-pavillon-de-chasse-sept.json
    ├── AOE-05-dans-le-ventre-de-la-baleine-noire.json
    └── AOE-06-les-ruines-du-siege-radieux.json
```

Arborescence Foundry :

```text
Campagnes
└── Agents d'Absalom
    ├── Volume 1
    │   ├── AOE-01 - Le diable du Palais des rêves
    │   ├── AOE-02 - Soixante pieds sous terre
    │   └── AOE-03 - Pas de compromis
    └── Volume 2
        ├── AOE-04 - Assaut sur le pavillon de chasse Sept
        ├── AOE-05 - Dans le ventre de la Baleine noire
        └── AOE-06 - Les ruines du siège radieux
```

Les entrées sont des références de compendium : le resolver privilégie le pack
`pf2e.agents-of-edgewatch-bestiary`, puis cherche dans les autres compendiums PF2e.

Les créatures et dangers sont regroupés par chapitre pour cette première passe.

## v0.9.0 — Terminer le déplacement

Le Combat Tracker reçoit un bouton **Terminer le déplacement** pour le combattant dont c'est le tour.

Il efface uniquement l'historique de mouvement du token courant via l'API Foundry V14
`TokenDocument.clearMovementHistory()` ; il ne termine pas le tour et ne gère pas de compteur d'actions.

Le bouton est disponible au MJ et au propriétaire du personnage actif.
Une API est aussi exposée pour dépannage/macros :

```js
await game.pf2eValToolkit.endMovement();
```

## v0.10.0 — Actors locaux restaurés

Lors de l'import d'un scénario, une référence trouvée dans un compendium PF2e est désormais :

1. résolue vers son Actor officiel ;
2. copiée comme **Actor du monde** dans le dossier du scénario ;
3. réutilisée si le même scénario est réimporté ;
4. liée depuis le Journal vers cette copie locale.

La provenance du compendium reste enregistrée dans le flag :

```js
actor.getFlag("pf2e-val-toolkit", "sourceUuid")
```

Le module ne recrée donc pas le statblock : il clone l'Actor officiel tel qu'il existe dans PF2e/Foundry.

## v0.11.1 — Correctif Combat Tracker

Le bouton **Terminer le déplacement** n'est plus injecté sur la même ligne que
**Terminer le tour**. Il possède désormais sa propre ligne pleine largeur juste
au-dessus des contrôles de tour.

## v0.11.2 — Combat Tracker et retrait du lanceur de dés

- suppression complète du lanceur de dés du chat ;
- le bouton **Terminer le déplacement** est maintenant placé à l'intérieur de la
  barre native du Combat Tracker ;
- il prend une ligne complète au-dessus des contrôles natifs, qui restent sur
  leur propre ligne sans chevauchement.


## v0.12.0 — Scène de combat rapide

Le MJ sélectionne les tokens des personnages sur la scène actuelle puis lance :

```js
game.pf2eValToolkit.createCombatScene();
```

Une petite fenêtre demande le nom, la largeur et la hauteur en cases. Le module crée une scène vide avec grille carrée, sans murs et sans gestion de vision, copie les tokens sélectionnés près du centre et active automatiquement la nouvelle scène.

Une macro prête à copier est fournie dans :

```text
macros/Create Quick Combat Scene.js
```

## v0.12.1 — Visibilité totale des combats rapides

Les scènes créées par `createCombatScene()` désactivent explicitement la vision
limitée par token et le brouillard d'exploration de Foundry V14. Le niveau
d'obscurité est verrouillé à 0 : la scène est entièrement visible par défaut.

## v0.13.0 — Système extensible de patchs PF2e

Ajout d'une architecture dédiée aux modifications maison du système PF2e :

```text
scripts/
├── lib/
│   ├── effects.js
│   ├── targets.js
│   └── token-marks.js
└── patches/
    ├── index.js
    └── hunt-prey.js
```

### Registre central

`scripts/patches/index.js` contient `PATCH_REGISTRY`. Chaque patch expose au minimum :

```js
{
  id: "mon-patch",
  label: "Mon patch",
  enabled: true,
  init() { ... }
}
```

À terme, les nouveaux patchs PF2e doivent être ajoutés à ce registre plutôt que sous
forme de macros isolées ou de modifications manuelles des personnages.

L'API runtime est visible via :

```js
game.pf2eValToolkit.patches.list();
game.pf2eValToolkit.patches.get("hunt-prey");
```

### Premier patch : Hunt Prey / Chasser une proie

Le joueur continue d'utiliser l'action PF2e normale de sa fiche.

Le patch :

- reconnaît l'effet grâce au Rule Element natif `TokenMark` avec le slug `hunted-prey` ;
- ne modifie ni les fichiers du système PF2e ni ses compendiums ;
- conserve intégralement le `TokenMark` natif, donc les prédicats PF2e tels que
  `target:mark:hunted-prey` continuent de fonctionner ;
- si exactement une cible est sélectionnée, renomme l'effet en
  `🎯 Proie : <nom de la cible>` ;
- à la création d'une nouvelle proie, supprime automatiquement les anciens effets
  utilisant le même `TokenMark`, de façon à ne laisser qu'une seule proie active.

Une fonction de nettoyage est également exposée pour diagnostic :

```js
const patch = game.pf2eValToolkit.patches.get("hunt-prey");
await patch.api.cleanupActor(actor);
```

## v0.14.0 — Onglet « Actions générales »

Ajout d'un navigateur complet d'actions directement sur les fiches de personnages.

Le nouvel onglet **Actions générales** :

- lit dynamiquement le compendium système `pf2e.actionspf2e` ;
- ne copie aucune action sur les Actors ;
- n'édite aucun compendium PF2e ;
- ne retient que les dossiers système **Basic Actions / Actions de base** et
  **Skill Actions / Actions de compétence** ;
- regroupe les actions de compétence selon les sous-dossiers du compendium ;
- affiche le rang de compétence du personnage lorsqu'il peut être identifié ;
- propose une recherche instantanée ;
- filtre entre **Toutes / Base / Compétences** ;
- ouvre toujours la règle officielle depuis le compendium ;
- tente l'automatisation native `game.pf2e.actions` avec le personnage de la fiche
  lorsqu'une action PF2e automatisée existe ;
- sinon ouvre simplement la règle officielle au lieu de réimplémenter l'action.

Architecture :

```text
scripts/actions-browser/
├── index.js
├── action-index.js
├── action-runner.js
├── actor-skills.js
└── actor-tab.js
```

L'index est mis en cache côté client et peut être forcé à se reconstruire avec :

```js
await game.pf2eValToolkit.actionsBrowser.refresh();
```

Cette fonction d'interface reste séparée du système de patchs `scripts/patches/`.

## v0.14.1 — Correctif Actions générales

Correctifs suite au premier test sous Foundry V14 / PF2e 8.3.0 :

- correction du catalogue affichant `0 actions` lorsque l'index du compendium ne
  fournit pas l'ascendance des dossiers imbriqués ;
- conservation du classement dynamique par dossiers lorsqu'il est disponible ;
- ajout d'un fallback fondé sur les slugs système PF2e stables pour les actions
  de base et les actions de compétence du Player Core ;
- aucune règle n'est recopiée : noms, images, coûts et documents ouverts viennent
  toujours du compendium `pf2e.actionspf2e` ;
- l'onglet de navigation est désormais une icône avec infobulle, adaptée à la
  barre circulaire de la fiche PF2e ;
- les boutons `Toutes / Base / Compétences` sont forcés sur une ligne afin de ne
  plus être étirés par les styles généraux de la fiche.

## v0.14.2 — Vue compacte pour les Actions générales

Ajustement de l'interface après test en situation réelle :

- chaque action est maintenant affichée sur une **ligne compacte** ;
- l'icône est réduite ;
- le bouton **Utiliser** devient un petit bouton icône ;
- le coût en actions reste visible sous forme de petit badge ;
- l'objectif est de voir **un maximum d'actions à l'écran** sans énormes blocs verticaux.

Aucune logique métier n'a changé : il s'agit d'un correctif d'ergonomie/présentation.

## v0.14.3 — Actions générales réellement compactes

Le correctif précédent était encore écrasé par des styles globaux de la fiche PF2e.

Cette version change donc l'approche :

- suppression des gros `<button>` pour les actions et les filtres ;
- actions affichées en petites tuiles de 28 px de haut ;
- grille adaptative : plusieurs actions par ligne lorsque la fiche est assez large ;
- plus d'image par action pour maximiser la densité ;
- nom = ouvre la règle ;
- petit badge = coût en actions ;
- petit bouton ▶ = utilise l'automatisation PF2e ;
- règles CSS critiques injectées directement dans l'onglet pour éviter que les styles
  de la fiche PF2e ne les écrasent par ordre de chargement.

## v0.14.4 — Deuxième onglet « Actions guidées » (prototype comparatif)

Le premier onglet **Actions générales** est conservé tel quel afin de pouvoir comparer.

Un deuxième onglet, identifié par l'icône baguette magique, ajoute un prototype
**Actions guidées** :

- liste dédupliquée des actions générales ;
- affichage ultra compact ;
- `▶` : action directement supportée par le registre natif `game.pf2e.actions` ;
- `▾` : l'action nécessite d'abord un choix ;
- `i` : pas d'automatisation native détectée, ouverture de la règle officielle ;
- détection dynamique des variantes exposées par PF2e ;
- **Bondir** possède un choix guidé Horizontal / Vertical ;
- **Se souvenir** propose la liste des compétences de connaissance réellement présentes
  sur le personnage puis appelle l'action native PF2e avec la statistique choisie ;
- les autres actions à variantes utilisent les variantes exposées directement par
  `game.pf2e.actions`.

Ce deuxième onglet est volontairement un prototype : son but est de comparer
l'approche « un bouton générique par action » avec une approche qui adapte
l'interaction au type réel d'action.

## v0.15.0 — Catalogue MJ + onglet guidé unique

Refonte du navigateur d'actions générales :

- suppression de l'ancien onglet « Actions générales » ;
- conservation du seul onglet « Actions guidées » ;
- catalogue fixe des 84 actions générales exportées depuis PF2e 8.3.0 ;
- aucun filtrage automatique selon la classe, les compétences ou l'équipement du PJ ;
- le MJ fixe explicitement les actions visibles via le bouton ⚙ de l'onglet ;
- la configuration est enregistrée en setting de monde ;
- toutes les 84 actions sont visibles par défaut tant que le MJ ne les masque pas ;
- option utilisateur « Nom anglais », décochée par défaut ;
- nom français seul par défaut, nom anglais ajouté à la demande ;
- affichage normal sur exactement 3 colonnes ;
- actions de compétence séparées par compétence ;
- une même action peut apparaître dans plusieurs compétences lorsque les règles le prévoient
  (par exemple Se souvenir ou Identifier la magie), tout en partageant un unique réglage MJ.

API MJ :

```js
await game.pf2eValToolkit.actionsBrowser.openSettings();
```

La logique d'interaction reste celle du prototype v0.14.4 pour le moment :
Bondir et Se souvenir ont leurs menus dédiés, les variantes exposées par PF2e sont
détectées dynamiquement, et les autres actions seront affinées progressivement.

## v0.16.0 — Clic = règle, ▶ = utilisation + menus guidés

Évolution du navigateur d'actions guidées :

- la tuile / le nom d'une action ouvre toujours sa règle officielle ;
- seul le petit bouton ▶ à droite tente réellement d'utiliser l'action ;
- les actions sans activation pertinente affichent une icône d'information à la place
  d'un faux bouton ▶ ;
- passage de 3 à **2 colonnes** ;
- conservation du classement des actions de compétence par compétence ;
- ajout de menus guidés pour :
  - Bondir ;
  - Se souvenir ;
  - Faire diversion ;
  - Prodiguer les premiers soins ;
  - Se produire ;
  - Subsister ;
  - S'échapper ;
  - Déchiffrer un texte ;
  - Identifier la magie ;
  - Apprendre un sort ;
  - Arrêter une chute ;
  - Se raccrocher in extremis ;
  - Soigner les blessures (macro PF2e officielle) ;
- les variantes utilisées correspondent aux paramètres officiels présents dans les
  descriptions PF2e (`variant=...`, `statistic=...`) ;
- les actions restantes continuent à utiliser l'automatisation native
  `game.pf2e.actions` lorsqu'elle existe.

Le menu MJ et la case « Nom anglais » de la v0.15.0 sont conservés.

## v0.16.1 — Actions courantes / situationnelles + accordéons

- les actions de base sont séparées entre **Actions courantes** et **Actions situationnelles** ;
- Actions courantes est ouvert par défaut ;
- Actions situationnelles est replié par défaut ;
- chaque compétence possède son propre panneau dépliable/repliable ;
- les compétences sont repliées par défaut ;
- boutons « Tout déplier » / « Tout replier » ;
- une recherche ouvre automatiquement les groupes contenant des résultats puis restaure leur état précédent ;
- les actions restent affichées sur **2 colonnes** dans chaque groupe ouvert.

Classement initial :

Courantes : Aider, Bondir, Chercher, Deviner les intentions, Faire un pas, Frapper,
Interagir, Lancer un sort, Lever un bouclier, Marcher rapidement, Mise à l'abri,
Préparer, Relâcher, Retarder, S'échapper, Se jeter à terre, Se relever, Signaler.

Situationnelles : Arrêter une chute, Creuser, Détourner le regard, Fixer un fulu,
Fixer un talisman, Investir un objet, Maintenir, Ramper, Révoquer, Se mettre en selle,
Se raccrocher in extremis, Voler.

## v0.16.2 — Maîtrise minimale des actions de compétence

Ajout de la matrice officielle issue de l'Écran du MJ PF2e 8.3.0,
page « Actions de compétence (Skill Actions) ».

- les actions placées dans la colonne « Actions qualifiées » affichent un badge
  **Qualifié** dans leur section de compétence ;
- l'action reste visible : le réglage de visibilité du MJ reste prioritaire et aucun
  pré-filtre automatique n'est réintroduit ;
- si le PJ est inexpérimenté dans la compétence concernée, la ligne est atténuée et
  son bouton ▶ est désactivé ;
- cliquer sur la ligne continue d'ouvrir la règle, même si le PJ n'est pas qualifié ;
- une même action peut être disponible dans une compétence et indisponible dans une
  autre selon les maîtrises du personnage ;
- les actions absentes de la table officielle (par exemple certaines actions
  spécialisées issues d'autres sous-systèmes) ne reçoivent pas de prérequis inventé ;
- correction du libellé français de compétence « Tromperie » vers **Duperie**.

Exemples confirmés par la table PF2e :
- Vol : Crocheter une serrure et Désamorcer un dispositif nécessitent Qualifié ;
- Athlétisme : Désarmer nécessite Qualifié ;
- Duperie : Feinter nécessite Qualifié ;
- Médecine : Soigner la maladie, Soigner le poison et Soigner les blessures
  nécessitent Qualifié ;
- Survie : Couvrir ses traces et Pister nécessitent Qualifié.

## v0.17.0 — Runtime PF2e exact + ciblage + Larcin

Cette version s'appuie sur l'export runtime réel de PF2e 8.3.0.

### Exécution des actions

Le navigateur distingue désormais correctement :

- les actions modernes de la `Collection game.pf2e.actions`, exécutées via
  `Action.use(options)` ;
- les helpers PF2e historiques exposés directement sur `game.pf2e.actions`.

Cas particuliers vérifiés et pris en charge :

- **Désamorcer un dispositif** : Item `disable-a-device` → runtime `disable-device` ;
- **Lever un bouclier** → `game.pf2e.actions.raiseAShield(...)` ;
- **Fabriquer** → helper PF2e `craft(...)`, avec le sélecteur d'objet natif ;
- **Réparer** → helper PF2e `repair(...)`, avec le sélecteur d'objet natif ;
- **Gagner de l'argent** → dialogue PF2e natif `earnIncome(actor)` ;
- **Soigner les blessures** → dialogue PF2e natif `treatWounds(...)`.

`Soigner les blessures` n'affiche donc plus un menu Toolkit à un seul bouton : cliquer
sur ▶ ouvre directement le vrai dialogue PF2e, qui gère notamment Chirurgien,
Médecine naturelle, Chirurgie risquée, Guérison mortelle et les DD de maîtrise.

### Cibles

Lorsqu'une seule cible Foundry est ciblée, elle est maintenant transmise aux actions
modernes avec `options.target`. Cela permet à PF2e d'utiliser directement la cible
pour ses DD et contextes de test quand l'action le prévoit.

### Traduction française

Les clés PF2e 8.3.0 ont été confirmées :

- `PF2E.Skill.Thievery` ;
- `PF2E.ActionsCheck.thievery`.

Le Toolkit remplace donc en français **Vol** par **Larcin** pour la compétence
Thievery, et « Test de Vol » par « Test de Larcin ». Les sections du navigateur
utilisent également « Larcin ».

Les occurrences de « Vol » qui signifient réellement voler dans les airs ou
l'abréviation de Volonté ne sont pas modifiées.

## v0.18.0 — Sans filtre + statut d'automatisation

Le navigateur affiche maintenant un second réglage client, **Sans filtre**, à côté de
**Nom anglais**.

- décoché par défaut : masque les actions dont une incompatibilité peut être déterminée
  de façon fiable à partir du personnage ;
- coché : réaffiche ces actions grisées, avec leur raison, mais sans autoriser le ▶ ;
- le filtre du MJ reste prioritaire : une action masquée par le MJ ne réapparaît jamais
  via « Sans filtre » ;
- les conditions purement contextuelles que Foundry ne peut pas déterminer avec
  certitude ne sont pas utilisées pour masquer une action.

Compatibilités actuellement vérifiées :
- maîtrise minimale **Qualifié** par compétence ;
- Vitesse de vol pour **Voler** et **Arrêter une chute** ;
- Vitesse de creusement pour **Creuser** ;
- bouclier tenu pour **Lever un bouclier** ;
- état **À terre** pour **Se relever** et **Ramper** ;
- états **Agrippé / Immobilisé / Entravé** pour **S'échapper** ;
- capacité de lancement de sorts détectable pour **Lancer un sort** ;
- objet tenu pour **Relâcher** ;
- **Se jeter à terre** est masqué si le personnage est déjà À terre.

Chaque ligne possède aussi une icône stable décrivant son niveau d'automatisation :
⚡ direct, ☰ menu d'action, 🎲 choix de jet, 🪟 assistant PF2e, ⛔ non automatisé.

La classification des 84 actions est volontairement stockée dans
`scripts/actions-browser/automation-catalogue.js`, au lieu d'être devinée dynamiquement
depuis l'API PF2e. La matrice complète de test se trouve dans `ACTION-TEST-MATRIX.md`.

**Chercher** possède maintenant un menu guidé avant le test de Perception, et **Aider**
propose un choix de statistique/compétence avant de lancer le test.

Correction incluse : la section de compétence **Larcin** est bien présente dans l'ordre
d'affichage (un ancien `Vol` subsistait encore dans `SKILL_GROUP_ORDER` en 0.17.0).

## v0.19.0 — Déclarations, Bondir interactif et corrections du premier test

### Icônes visibles sur chaque action

Les catégories utilisent désormais directement des glyphes Unicode dans les lignes,
et pas seulement dans la légende :

- ⚡ direct ;
- ☰ menu/carte d'action ;
- 🎲 choix de jet ;
- ▣ assistant PF2e ;
- 📖 déclaration dans le chat ;
- × non automatisé.

### Déclarations

Faire un pas, Interagir, Préparer, Relâcher, Retarder et Signaler ont maintenant un
bouton 📖. Il publie une carte courte dans le chat avec le rappel utile et un lien vers
la règle officielle.

Cette couche appelle également le hook `pf2eValToolkit.actionUsed`. Le compteur
optionnel d'actions de combat n'est pas encore affiché, mais pourra se brancher sur ce
hook plus tard sans réécrire les actions.

### Bondir

Bondir ne lance pas de test. Son bouton publie une carte rappelant :

- saut horizontal : 3 m, ou 4,50 m avec une Vitesse d'au moins 9 m ;
- saut vertical : 0,90 m vers le haut et 1,50 m horizontalement.

La carte contient deux boutons :

- Sauter en longueur — Athlétisme ;
- Sauter en hauteur — Athlétisme.

Ces boutons lancent les vraies actions PF2e correspondantes.

### Corrections

- Chercher est désormais direct : plus de menu intermédiaire inutile.
- Marcher rapidement a été retiré du navigateur.
- Lever un bouclier utilise un fallback robuste : l'effet PF2e
  `Effect: Raise a Shield` est appliqué directement si un bouclier est manié.
- Mise à l'abri demande d'abord le niveau d'abri, puis applique `Effect: Cover` avec
  la sélection déjà préremplie afin d'éviter le choix tardif de l'effet natif.

## v0.20.0 — Panache automatique + Frapper / Aboutissement assuré

### Bretteur : Panache

Le Toolkit post-traite désormais les résultats retournés par l'API Action de PF2e.

Lorsqu'une action possède **Bravade**, qu'elle réussit (succès ou succès critique) et que
le personnage est engagé dans un combat actif, le Toolkit ajoute automatiquement
l'effet officiel :

`Compendium.pf2e.feat-effects.Item.uBJsxCzNhje8m8jj`

La détection de Bravade ne repose pas sur du texte français. Elle lit les Rule Elements
structurés du personnage :

- Déplacement acrobatique est reconnu via la capacité Panache ;
- les actions ajoutées par un style de Bretteur sont détectées via `ItemAlteration`
  (`traits += bravado`) ;
- cela couvre par exemple Se produire pour Danseur de combat et Feinte / Faire diversion
  pour Escrimeur.

Le patch ne crée pas plusieurs Panaches si l'effet est déjà présent. Le GM retire aussi
les effets Panache des participants lorsque le Combat Foundry est supprimé.

### Frapper

**Frapper** passe de « non automatisé » à **menu d'action**.

Le Toolkit lit `actor.system.actions` et utilise les vraies Strikes PF2e. Le joueur peut :

1. choisir l'arme / attaque si plusieurs sont disponibles ;
2. choisir la pénalité d'attaques multiples ;
3. lancer la vraie Frappe PF2e contre la cible Foundry.

### Frappe précise et Aboutissement assuré

Aucun nombre de dés n'est codé en dur dans le Toolkit.

Si le personnage possède l'effet Panache et l'action Aboutissement assuré, Frapper propose :

- **Frappe normale** ;
- **Aboutissement assuré**.

Pour l'Aboutissement, le Toolkit transmet les roll options PF2e :

- `finisher`
- `finisher:confident`

au jet d'attaque natif, puis consomme l'effet Panache une fois l'attaque effectuée.

Les dégâts sont ensuite calculés par les Rule Elements déjà présents sur **Frappe précise**.
Ainsi le nombre de d6 suit automatiquement le niveau du Bretteur : au niveau 1, par
exemple, le personnage a 2d6 de précision sur un Aboutissement compatible, sans formule
dupliquée dans le module.

## v0.21.0 — Actions transversales + ordre FR + Larcin partout

### Catalogue

Les actions multi-compétences ne sont plus dupliquées dans chaque rubrique :

- **Se souvenir** est maintenant dans **Actions courantes** ;
- **Identifier la magie** est également dans **Actions courantes** ;
- **Déchiffrer un texte**, **Apprendre un sort**, **Subsister** et
  **Gagner de l'argent** sont affichées une seule fois dans
  **Actions situationnelles**.

Leur menu 🎲 / assistant continue à demander la compétence pertinente.

Pour les actions transversales qui exigent Qualifié, le filtre vérifie maintenant
qu'au moins une compétence valable satisfait la maîtrise avant d'afficher l'action.

### Ordre des compétences

Les rubriques de compétences sont triées avec `localeCompare(..., "fr")` sur leur
**nom français**, et non plus dans l'ordre historique anglais de PF2e.

### Larcin

L'override français `Vol` → `Larcin` est maintenant réappliqué au hook `ready`, après
que PF2e a construit son `CONFIG`. `CONFIG.PF2E.skills.thievery.label` est également
forcé à `Larcin`.

Cela corrige notamment la page native **Maîtrises**, qui pouvait encore conserver
`Vol` malgré le remplacement dans le navigateur d'actions.

### Nettoyage et déclarations

**Voler** et **Creuser** sont retirés du navigateur comme Marcher rapidement : il s'agit
essentiellement d'utiliser une Vitesse de déplacement.

Fixer un fulu, Fixer un talisman, Investir un objet, Ramper et Se mettre en selle
deviennent des actions 📖 déclaratives au lieu d'être marquées non automatisées.

### Mise à l'abri

Le double choix a été supprimé. Le Toolkit lance directement l'action PF2e et laisse
son **unique sélecteur natif** choisir le niveau d'abri. Une carte courte est ensuite
ajoutée au chat pour conserver une trace de l'action.

Lever un bouclier, Détourner le regard, Se jeter à terre et Se relever ajoutent également
une petite trace textuelle après leur effet automatique.

## v0.22.0 — Import de scénario en français + dossier Actors MJ

### Actors temporaires

Les Actors clonés depuis les compendiums sont maintenant rangés séparément des Journals :

```text
Actors
└── MJ
    └── Société des Éclaireurs
        └── Introductions
            └── INTRO-01 - La Seconde Confirmation
```

Les Journals restent dans :

```text
Journals
└── Campagnes
    └── Société des Éclaireurs
        └── Introductions
            └── INTRO-01 - La Seconde Confirmation
```

Cela permet de supprimer facilement les Actors temporaires du scénario après la partie sans toucher aux Journals de campagne.

### Noms français

Un Actor résolu peut continuer à utiliser un `lookup` anglais pour retrouver de manière robuste son entrée de compendium, mais la copie créée dans le monde prend désormais le `name` fourni dans le JSON de scénario.

Le scénario Intro n°1 est donc livré avec :
- titre et rencontres en français ;
- lieux et notes en français ;
- créatures et dangers nommés en français quand le guide français fournit un équivalent ;
- noms propres conservés tels quels.

### Nouveau fichier

`foundry-imports/PFS-INTRO-01-La-Seconde-Confirmation.json`

Ce fichier couvre le danger des sables mouvants ainsi que les rencontres A, B, C1, C2, C3 et C4, avec toutes les variantes de créatures et les hazards associés.

## v0.22.1 — Ember ouvre PF2e Merchant depuis son Token

Le Toolkit intercepte maintenant le double-clic gauche sur le Token du Loot Actor `Ember`.

- double-clic sur Ember : ouvre `PF2e Merchant` ;
- `Maj` + double-clic en tant que MJ : ouvre la fiche Actor normale ;
- si PF2e Merchant est désactivé ou indisponible : comportement Foundry normal ;
- tous les autres Tokens restent inchangés.

Pour rendre un autre Loot Actor compatible sans coder son nom :

```js
const actor = game.actors.getName("Nom du marchand");
await game.pf2eValToolkit.merchantTokens.enable(actor);
```

Pour retirer ce comportement :

```js
const actor = game.actors.getName("Nom du marchand");
await game.pf2eValToolkit.merchantTokens.disable(actor);
```

Ember est reconnue automatiquement pour rester compatible avec le marchand déjà créé.

## v0.22.2 — PF2e Merchant en français

Le Toolkit fournit maintenant la localisation française de l'interface de PF2e Merchant lorsque Foundry est utilisé en français.

Cela couvre notamment :
- boutique, catégories, filtres, panier et achats ;
- vente et rachat ;
- détails des objets ;
- offres du jour et liste de souhaits ;
- coffre personnel ;
- import depuis les compendiums et génération de stock aléatoire ;
- réglages MJ, services et historique ;
- liaison de tuiles au marchand.

Les noms et descriptions des objets restent fournis par le système PF2e et son module de traduction français ; cette localisation ne modifie pas les données d'objets.

## v0.22.3 — Boutique joueur sécurisée

L'intégration PF2e Merchant du Toolkit utilise maintenant une politique de permissions plus sûre pour les marchands configurés :

```text
MJ      → contrôle complet
Joueurs → Observateur
```

PF2e Merchant tente normalement de promouvoir automatiquement les joueurs en `OWNER` lorsque le MJ ouvre un Loot marchand. Le Toolkit intercepte cette modification pour ses propres marchands et conserve les joueurs en `OBSERVER`.

Les achats utilisent alors le relais MJ déjà prévu par PF2e Merchant :
- le client joueur choisit automatiquement `game.user.character` ;
- à défaut, PF2e Merchant utilise un personnage que ce joueur possède ;
- le MJ connecté exécute la transaction ;
- l'argent est retiré du PJ ;
- l'objet est ajouté à l'inventaire du PJ ;
- le stock et la bourse du marchand sont modifiés côté MJ.

La fenêtre de boutique affiche aussi, côté joueur :

```text
Achat pour : Nom du personnage
```

Si aucun personnage n'est associé au compte, la boutique affiche `Aucun personnage associé`.

`Ember` et `Boutique d'Ember` / `Boutique d’Ember` sont reconnues automatiquement. Les autres marchands peuvent toujours être activés avec :

```js
await game.pf2eValToolkit.merchantTokens.enable(actor);
```

`Maj` + double-clic sur le Token reste disponible au MJ pour ouvrir la fiche Loot normale.

## v0.22.4 — Correctif blocage côté joueur

Correction d'un blocage possible à l'ouverture de PF2e Merchant côté joueur.

La v0.22.3 observait tout le DOM Foundry afin d'ajouter la ligne `Achat pour : <PJ>`.
Cette observation pouvait se déclencher elle-même en boucle lors de la réécriture
du badge et saturer le client joueur.

La v0.22.4 supprime complètement cette observation globale. Le badge est maintenant
injecté par quelques tentatives temporisées uniquement après l'ouverture du marchand.

Le reste du comportement v0.22.3 est conservé :
- joueur en Observateur du marchand ;
- contrôles MJ cachés par PF2e Merchant ;
- achat relayé au MJ connecté ;
- personnage acheteur choisi via `game.user.character`, avec fallback sur un PJ possédé ;
- traduction française conservée.

## v0.23.0 — Achat natif + moteur Bravade

### Marchands PF2e natifs

Les Loot Actors en mode `Merchant` affichent maintenant côté joueur un bouton
**Acheter** sur chaque ligne d'objet.

Le bouton ne réimplémente pas l'économie PF2e : il appelle le workflow natif
`ActorSheetPF2e.moveItemBetweenActors()`.

Cela conserve donc :
- le dialogue PF2e de quantité ;
- le calcul du vrai prix de l'objet ;
- le contrôle des fonds ;
- le retrait automatique des pièces au PJ ;
- le paiement du marchand ;
- le transfert / empilement natif de l'objet.

Le personnage acheteur est :
1. le personnage assigné au compte Foundry (`game.user.character`) ;
2. à défaut, l'unique personnage possédé par l'utilisateur.

Si plusieurs personnages sont possédés et qu'aucun n'est assigné, le Toolkit
refuse de deviner et demande d'assigner le personnage actif.

### Bravade — contexte PF2e générique

Le Toolkit ne maintient plus de liste codée en dur par style de Bretteur.

Il lit les Rule Elements structurés présents sur le personnage :
- `ItemAlteration` ajoutant le trait `bravado` à une action ;
- `RollOption` fournissant `item:trait:bravado` pour une action.

Pour toute action exécutée depuis le navigateur du Toolkit et détectée comme
Bravade, le Toolkit transmet désormais à `Action.use()` :

```text
item:trait:bravado
self:action:trait:bravado
```

PF2e 8.3.0 fusionne ces options avec les roll options natives de l'action. Les
Rule Elements du personnage restent donc la source de vérité. Cela permet
notamment à `Combattant stylé` de reconnaître correctement le test et
d'appliquer son bonus de circonstances lorsque ses propres prédicats sont
satisfaits.

Le post-traitement Panache existant utilise le même détecteur :
- Bravade réellement accordée au personnage ;
- rencontre de combat commencée ;
- personnage présent dans le combat ;
- réussite ou réussite critique ;
- Panache absent ;
- application de l'effet officiel Panache.

Les actions lancées hors du navigateur du Toolkit ne sont pas interceptées par
ce moteur dans cette version.

## v0.23.1 — Bravade : correction de Se produire

Correction du cas Danseur de combat / `Se produire`.

La cause était différente de la détection de Bravade : l'action PF2e `Perform`
n'a pas de DD générique fixe. Sans DD, PF2e peut produire un jet mais aucun
degré de réussite (`success`, `criticalSuccess`, etc.). Le Toolkit refusait
donc correctement de deviner une réussite, mais ne pouvait pas accorder le
Panache.

Pour un personnage possédant `Représentation fascinante` :
- si exactement une cible est sélectionnée, `Se produire` utilise maintenant
  le DD de Volonté de cette cible ;
- PF2e renvoie alors un vrai degré de réussite ;
- sur réussite / réussite critique pendant une rencontre de combat, l'effet
  officiel Panache est appliqué.

Le trait `bravado` est désormais aussi transmis à PF2e comme vrai trait
d'action, en plus des roll options. Cela permet à PF2e d'afficher le trait et
de générer lui-même `item:trait:bravado`.

La détection Bravade est renforcée :
1. `Déplacement acrobatique` reste un invariant de la capacité Panache ;
2. les traits préparés sur les Actions de l'Actor sont lus directement ;
3. les `ItemAlteration` et `RollOption` structurés restent le fallback générique.

Le Toolkit ne donne jamais automatiquement Panache à un jet Bravade sans
degré de réussite connu.

## v0.24.0 — Onglet États & conditions

Un nouvel onglet est ajouté aux fiches de personnages, à côté de l'onglet
Actions guidées.

L'onglet charge dynamiquement les Conditions depuis le compendium officiel
`pf2e.conditionitems`. Le Toolkit ne copie donc ni les règles ni les
traductions : les noms, descriptions, liens et mises à jour proviennent
directement de la version PF2e installée.

Organisation proposée :

```text
Visibilité & sens
Position & entraves
Économie d’actions
Mental & comportement
Affaiblissements
Survie & blessures
Attitudes sociales
Autres états
```

Une condition ajoutée plus tard par PF2e qui n'est pas encore connue du
classement apparaît automatiquement dans `Autres états`.

Fonctions :
- recherche instantanée ;
- sections repliables + tout déplier / tout replier ;
- résumé court de chaque condition ;
- clic sur la condition : règle PF2e complète directement dans l'onglet ;
- bouton livre : ouverture de la fiche officielle de la condition ;
- les conditions actuellement actives sur le personnage sont mises en
  évidence ;
- bandeau `Sur le personnage` avec accès rapide aux conditions actives ;
- les conditions à valeur affichent leur valeur (`Effrayé 2`, etc.).

## v0.24.1 — États compacts

L'onglet `États & conditions` reprend maintenant la densité visuelle de
l'onglet Actions :

- icônes officielles limitées à 22×22 px ;
- lignes d'environ 29 px ;
- deux colonnes ;
- plus de résumé sur deux lignes dans la vue principale ;
- le résumé reste disponible au survol ;
- clic sur la ligne pour déplier la règle complète ;
- bouton livre compact à droite ;
- conditions actives affichées sous forme de badges textuels compacts.

L'objectif est de pouvoir parcourir rapidement les états sans transformer
chaque condition en grande carte illustrée.

## v0.25.0 — XP cumulative de carrière

Le Toolkit ajoute une surcouche d'XP destinée à la table ouverte sans
remplacer les données mécaniques PF2e.

Principes :
- le vrai niveau reste `system.details.level.value` ;
- l'XP cumulative est stockée dans un flag du module ;
- le niveau est automatiquement synchronisé avec le seuil atteint ;
- la zone d'XP native de la fiche est remplacée visuellement par l'XP carrière ;
- aucune classe ou méthode PF2e n'est monkey-patchée ;
- les mises à jour passent par `Actor.update()` et les hooks Foundry ;
- une modification manuelle du niveau recale automatiquement l'XP carrière.

Exemple au niveau 11 :

```text
84 500 / 105 000 XP
```

Le champ accepte également des deltas :

```text
+300
-50
```

Le réglage monde `XP de carrière (table ouverte)` permet de désactiver la
surcouche.

Voir `CAREER-XP.md` pour l'architecture complète et l'API.

## v0.25.1 — XP carrière indicative uniquement

- XP carrière séparée dans les flags du Toolkit ;
- affichée à la place de l'XP PF2e sur la fiche ;
- joueurs en lecture seule ;
- MJ peut saisir temporairement la valeur ;
- aucune modification de l'XP native PF2e ;
- aucune modification du niveau PF2e ;
- niveau théorique affiché uniquement à titre informatif.

## v0.26.0 — XPC synchronisée depuis l’API

L’XPC est calculée depuis les séances de l’API PF2 / SQLite. Le Toolkit ne
crée ni ne modifie de Journal Foundry pour ce registre ; la macro déclenche une
synchronisation complète depuis l’API.

```js
game.pf2eValToolkit.careerXp.get(actor);
```

## v0.27.0 — Illustrations officielles des scénarios

L'importeur accepte maintenant un champ optionnel `image` sur une définition
Actor :

```json
{
  "key": "vengeant-thorn-12",
  "name": "Vengeant Thorn — sous-tier 1–2",
  "type": "reference",
  "uuid": "Compendium.…",
  "image": "modules/pf2e-val-toolkit/assets/scenarios/PFS-S01-04/vengeant-thorn.webp"
}
```

Lors du clonage d'un Actor de compendium, cette image remplace uniquement :

```text
Actor.img
Actor.prototypeToken.texture.src
```

Les statistiques et toutes les données mécaniques continuent de provenir de
l'Actor PF2e officiel.

Un réimport applique aussi l'image aux Actors déjà clonés : il n'est donc pas
nécessaire de supprimer puis recréer le dossier du scénario.

### S01-04 — Bandits d’Immenwood

Les illustrations officielles disponibles aux pages d'art du PDF ont été
extraites et intégrées au module sous :

```text
assets/scenarios/PFS-S01-04/
```

Arts inclus : écureuil rabique, druide halfelin, loup, tourbillon vivant,
pince des récifs, éclaireur diable des mers et Vengeant Thorn.

Les variantes de sous-tier partagent la même illustration lorsqu'elles
représentent le même personnage ou la même créature.

## v0.28.0 — Cartes de scénario

Le JSON peut maintenant déclarer un `assets.root` et des `maps`.

Les images relatives sont résolues depuis `assets.root`; les chemins absolus
Foundry (`modules/`, `worlds/`, `systems/`) et les URL restent compatibles.

Chaque map crée une vraie Scene Foundry, rangée sous l'arborescence MJ du
scénario. Les rencontres du Journal affichent un lien direct vers leur Scene,
et une page `Cartes` liste toutes les cartes du scénario.

La réimportation met à jour le fond / dimensions / grille de la Scene mais ne
supprime pas ses documents embarqués (Tokens, murs, lumières, dessins, notes).

Pour S01-04, quatre cartes sont fournies :
- A — taverne / écuries ;
- B1 — Immenwood ;
- B2/B3 — route de l'Immenwood ;
- C — Haute Côte.

Les images ont été normalisées pour une grille exacte de 50 px = 5 ft.

### Préparation au futur paquet JSON + assets

Pour cette version les images restent dans le Toolkit, mais le schéma n'en
dépend plus : `assets.root` est le seul point d'ancrage. Une future version
pourra donc importer un ZIP/dossier contenant le JSON et ses assets dans le
monde Foundry, puis utiliser exactement le même JSON.

## v0.29.0 — Import JSON ou paquet ZIP

La même commande accepte désormais :

```js
game.pf2eValToolkit.importScenario();
```

### JSON

Un `.json` fonctionne comme avant. Aucun asset n'est extrait. Si le JSON ne
contient pas d'images/cartes, le Toolkit importe simplement Actors + Journal et
les Actors référencés conservent l'art natif PF2e.

### ZIP complet

Convention :

```text
scenario.zip
├── scenario.json
└── assets/
    ├── vengeant-thorn.webp
    ├── ...
    └── maps/
        ├── a-taverne.webp
        └── ...
```

Le Toolkit lit le JSON, extrait les assets et les envoie dans :

```text
worlds/<world-id>/pf2e-val-toolkit/scenarios/<scenario-id>/
```

Puis il utilise ce dossier comme `assets.root`.

Les illustrations de PNJ/créatures fournies par le paquet deviennent, dès la
création :
- le portrait de l'Actor ;
- l'image de son prototype Token.

Les cartes fournies créent les Scenes définies dans `maps`.

### Scenes

Les Scenes importées sont des cartes de table simples :
- vision Token désactivée ;
- brouillard d'exploration désactivé ;
- obscurité 0 ;
- aucune Ambient Light créée ;
- aucune playlist / son ;
- aucune météo.

Donc un joueur voit toute la carte lorsqu'elle est activée.

La réimportation ne supprime pas les Tokens, murs, lumières, dessins ou notes
ajoutés manuellement par le MJ.

Les assets S01-04 ne sont plus stockés dans le Toolkit en v0.29.0 : ils sont
dans le paquet de scénario ZIP.

## v0.29.1 — Barre d'onglets compacte

La fiche personnage PF2e reçoit un petit ajustement visuel :

- le large libellé `Personnage` au début de la barre est supprimé ;
- si ce libellé correspond au premier onglet, il devient une simple icône
  personnage avec tooltip ;
- les onglets PF2e, Actions guidées et États sont centrés ensemble ;
- les onglets ajoutés par le Toolkit gardent une largeur fixe compacte.

L'objectif est de faire tenir l'onglet États sans devoir agrandir la fiche.

## v0.29.2 — Correction cartes Foundry V14

Foundry V14 stocke désormais le fond d'une Scene sur son document `Level`.
L'ancien `Scene.background` n'est plus la donnée canonique.

L'importeur :
- crée/met à jour la Scene ;
- récupère son `firstLevel` ;
- écrit l'image dans `Level.background.src` ;
- crée un Level s'il n'existe exceptionnellement pas ;
- conserve vision Token désactivée, fog désactivé et obscurité 0.

Réimporter un ZIP déjà extrait suffit : les quatre fichiers WebP déjà présents
dans le dossier du monde sont réutilisés et les Scenes existantes reçoivent
leur fond correctement.

## v0.30.0 — version nettoyée

Cette version repart de la dernière version réelle du dépôt (`0.29.2`) et
remet la numérotation à plat.

- XPC maître : `flags.pf2e-val-toolkit.xpc`.
- progression selon la courbe historique cumulée, pas `XPC / 1000`;
- aucune reconstruction d'XPC depuis le niveau/XP PF2;
- XPC recalculée depuis l'API des résumés au chargement par un MJ ;
- Hunt Prey custom supprimé;
- Panache/Bravade/Aboutissement assuré custom supprimés;
- grilles de cartes mesurées (`columns`, `rows`, `bounds`) + ancien
  `grid.size`;
- Foundry V14 : offsets via `Scene.shiftX/shiftY`, fond via
  `Scene.firstLevel.background.src`;
- scènes importées toujours totalement visibles.
