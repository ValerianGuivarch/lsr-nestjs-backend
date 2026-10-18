# foundry — documentation PF2

[← Outils](../../OUTILS.md) · [Archive intégrale](archive/RECAP-2026-09-27.md)

> Contenu repris de l'audit du 27 septembre 2026 : **historique à confronter au code et à l'état de production** avant de considérer une observation ou une anomalie comme actuelle.

## 8. Portraits PNJ

Le comportement courant du code est le suivant.

### 8.1 Fichier canonique

Le portrait est écrit directement sous :

```text
FOUNDRY_ASSETS_ROOT/
└── portraits/
    └── pnj/
        └── <id-pnj>.webp
```

ou `.gif` pour un GIF conservé comme tel.

### 8.2 Chemin stocké dans le PNJ

Le PNJ conserve un chemin du type :

```text
assets/l7r/portraits/pnj/<id-pnj>.webp
```

Les anciennes URLs HTTP dans `image` ou `portrait` ne sont pas considérées comme la représentation active.

### 8.3 Affichage web

L’API expose le portrait via :

```text
GET /api/pf2-mj/portraits/:filename
```

### 8.4 Association à Foundry

Si le PNJ possède :

```text
foundryActorUuid
```

l’API peut demander au Relay de mettre à jour l’Actor afin qu’il utilise le même asset de portrait.

Le fichier n’est pas dupliqué par le Relay : le PNJ et l’Actor doivent pointer vers le même asset Foundry.

---

---

## 9. Foundry REST Relay

Il existe deux couches à ne pas confondre.

### 9.1 Service Relay indépendant

Service externe au processus Nest principal.

Configuration côté API :

```text
FOUNDRY_REST_URL
FOUNDRY_REST_API_KEY
```

Le wrapper Nest utilise par défaut :

```text
http://127.0.0.1:3010
```

si `FOUNDRY_REST_URL` n’est pas défini.

### 9.2 Wrapper Nest

Code :

```text
apps/api-jdr/src/foundry/
```

Il sert notamment à :

- lister les Actors ;
- lire un Actor ;
- récupérer les candidats PNJ ;
- créer un Actor placeholder ;
- synchroniser un portrait ;
- lire/modifier XPC ;
- parler au service Relay.

### 9.3 Point XPC à surveiller

Le wrapper Nest contient encore un mécanisme de compatibilité qui peut reconstruire une XPC absente depuis le niveau et l’XP PF2e existants.

Le Toolkit, lui, ne reconstruit jamais une XPC absente à partir de ces valeurs.

Cette divergence doit être traitée comme une dette technique. Le comportement canonique à conserver est celui du système XPC décrit dans la section suivante.

---

---

## 10. Séances, résumés et XPC

### 10.1 Séances

Les séances sont stockées dans :

```text
pf2_session
```

Une séance contient notamment :

- numéro ;
- date ;
- titre ;
- participants ;
- auteur du résumé court ;
- auteur du résumé long ;
- XP de séance ;
- bonus XP résumé court ;
- bonus XP résumé long ;
- URL du résumé long ;
- résumé court ;
- message Discord associé.

Les participants et auteurs sont référencés par UUID Actor Foundry.

### 10.2 Page web Résumés

Routes :

```text
/resumes
/résumés
```

Le frontend utilise :

```text
/apil7r/pf2-mj/sessions
```

Il récupère aussi les Actors depuis :

```text
/apil7r/pf2-mj/actors
```

pour permettre de sélectionner les PJ.

### 10.3 Calcul XPC

Pour un Actor :

```text
XPC =
  somme(sessionXp des séances où il est participant)
+ somme(shortSummaryXp lorsqu’il est auteur du résumé court)
+ somme(longSummaryXp lorsqu’il est auteur du résumé long)
```

Le Toolkit appelle :

```text
GET <API PF2 MJ>/sessions
```

puis recalcule les XPC.

### 10.4 Flag Foundry

```text
flags.pf2e-val-toolkit.xpc
```

Le namespace canonique est :

```text
pf2e-val-toolkit
```

### 10.5 Courbe historique canonique

**Ne jamais remplacer cette règle par `XPC / 1000`.**

| Niveau | XPC cumulée |
|---:|---:|
| 1 | 0 |
| 2 | 300 |
| 3 | 900 |
| 4 | 2 700 |
| 5 | 6 500 |
| 6 | 14 000 |
| 7 | 23 000 |
| 8 | 34 000 |
| 9 | 48 000 |
| 10 | 65 000 |
| 11 | 84 000 |
| 12 | 105 000 |
| 13 | 127 000 |
| 14 | 151 000 |
| 15 | 177 000 |
| 16 | 205 000 |
| 17 | 236 000 |
| 18 | 271 000 |
| 19 | 311 000 |
| 20 | 356 000 |

Le niveau est le plus haut palier inférieur ou égal à XPC.

### 10.6 XP PF2e dérivée

L’XP PF2e affichée dans le niveau courant est une projection proportionnelle entre le palier XPC actuel et le suivant.

Exemple :

```text
XPC = 2 430

niveau 3 : 900
niveau 4 : 2 700

progression :
(2430 - 900) / (2700 - 900)
= 1530 / 1800
= 85 %

XP PF2e = 850
```

Au niveau 20, le Toolkit conserve la barre PF2e à 1000.

### 10.7 Synchronisation automatique

Lors du chargement du Toolkit :

1. un GM récupère les séances ;
2. le Toolkit recalcule l’XPC de chaque PJ ;
3. il écrit le flag XPC si nécessaire ;
4. il dérive niveau et XP PF2e ;
5. il met à jour l’Actor.

Ainsi, modifier une séance modifie l’historique source ; le recalcul Toolkit remet ensuite Foundry en cohérence.

---

## 11. Synchronisation portrait → token

Le code courant du Toolkit (v0.42.0 au contrôle du 18 octobre 2026) contient `scripts/portrait-token-sync.js` et l'initialise depuis `scripts/main.js`.

Le réglage monde `pf2e-val-toolkit.syncCharacterPortraitToToken` est activé par défaut. Pour les Actors de type `character` **et `loot`** :

- `Actor.img` est la source ;
- `Actor.prototypeToken.texture.src` est remis en cohérence ;
- les Tokens déjà posés sur toutes les Scenes sont également mis à jour ;
- une modification réelle de `Actor.img` déclenche la synchronisation ;
- une passe complète est aussi effectuée au chargement du monde ;
- seul le premier GM actif exécute la synchronisation, afin d'éviter les doubles mises à jour ;
- la synchronisation ne modifie pas taille, position, vision, nom ou autres propriétés du Token.

Ce comportement est donc plus large que la demande initiale « PJ uniquement » : les marchands `loot` sont volontairement inclus dans le code actuel.

---

## 12. Modules PF2e — répartition des responsabilités

Contrôle runtime du monde **Les Eclaireurs** le 18 octobre 2026 : Foundry 14.365 / PF2e 8.4.1. Les modules ci-dessous sont installés et actifs dans la configuration observée.

| Module | Version observée | Rôle retenu |
| --- | --- | --- |
| PF2e Automations | 1.4.8 | Automatismes ciblés de règles, actions, dons, sorts et effets. |
| PF2e Workbench | 7.7.5 | Boîte à outils de déroulement de combat et d'automatismes généraux. |
| PF2e Toolbelt | 3.56.2 | Petites fonctions transverses et améliorations d'ergonomie PF2e. |
| PF2e HUD | 2.55.2 | Interface rapide pour le token/personnage ; notamment sidebars d'actions et de compétences. |
| PF2e Leveler | 3.7.9 | Création, planification et application des montées de niveau. |
| PF2e Dorako UI | 4.1.10 | Refonte visuelle de l'interface ; conservée par choix esthétique. |
| PF2e Unified Spellbook | 2.5.4 | Vue unifiée des sorts ; reste optionnel malgré son activation actuelle. |
| PF2e Val Toolkit | 0.42.0 | Fonctionnalités maison et intégrations propres à la table. |

### Convention pour limiter les chevauchements

- **Automations** : privilégier les conséquences précises d'une capacité ou d'une règle.
- **Workbench** : privilégier les automatismes de déroulement du combat ; ne pas activer aveuglément toutes ses options.
- **Toolbelt** : privilégier les utilitaires de confort et les workflows transverses.
- **HUD** : rester la couche d'accès rapide, pas une nouvelle source de règles.
- Le module autonome **PF2e Target Damage** n'est pas nécessaire dans cette configuration : la fonction correspondante est considérée comme relevant de Toolbelt.
- Les fonctionnalités maison ne doivent être ajoutées au **Val Toolkit** que lorsqu'elles ne sont pas déjà correctement couvertes par PF2e ou un module conservé.

### Point de nettoyage encore ouvert

`Token Action HUD Core` 2.1.1 est installé et actif, mais aucun adaptateur PF2e correspondant n'est installé dans le répertoire de modules observé. Le Core est une bibliothèque générique et dépend de Socketlib. Comme PF2e HUD est déjà la solution de HUD retenue, **Token Action HUD Core est un candidat à désactivation/suppression après vérification qu'aucun autre module local ne le requiert**.

Les packs de cartes et modules de contenu restent à traiter au cas par cas : leur activation n'est pas une décision architecturale durable et ne doit pas être figée ici.

---

## 13. Audit des scènes et des imports

> **Observation datée du 18 octobre 2026 :** à revalider avant toute correction, car Foundry et les packages peuvent avoir évolué depuis.

### 13.1 Accès et méthode

L'audit peut être mené sans écrire dans le monde :

- utiliser en priorité le **Foundry REST Relay** pour lire les documents Foundry (Scenes, Actors, Folders, Tiles, Walls, Tokens, Lights, Notes, etc.) ;
- utiliser l'accès direct au volume Foundry sous `/data` pour vérifier l'existence réelle des assets ;
- **ne pas modifier directement les bases LevelDB pendant que Foundry tourne**.

Le diagnostic utile compare toujours trois niveaux :

1. ce que le scénario/package indique devoir exister ;
2. les fichiers réellement présents sur disque ;
3. les documents Foundry réellement créés et les assets qu'ils référencent.

Un `background = null` n'est pas une panne à lui seul : une scène peut volontairement utiliser des Tiles. Il faut donc examiner l'ensemble background / tiles / murs / tokens / vignette avant de conclure.

### 13.2 Cas témoin : Sentence d'Extinction, volume 1

Lors du contrôle, le monde contenait environ **212 Scenes**. Pour `extinction-curse-volume-1`, les **13 fichiers de carte** attendus existaient bien sur disque dans le dossier du scénario, et **13 documents Scene** portaient les flags du scénario.

**Circus Camp** et **Big Top** étaient au moins partiellement exploitables (vignette et tokens présents).

En revanche, les onze autres scènes observées — **Abberton**, les trois niveaux d'**Erran Tower**, **Goldenlaws Church**, **Hawfton Mill**, **Hermitage of Blessed Lightning**, les deux niveaux de **Lindell Barn**, **Odlin's Orchard** et **The Mad Mug** — possédaient leur document Scene, leurs dimensions et leur `scenarioMapKey`, mais pas de background ni de Tiles ; elles étaient également vides de murs et de tokens dans l'état observé.

Le signal est donc celui d'un **import partiel** : les images ont été extraites, les Scenes créées, mais les images n'ont pas été reliées aux documents Foundry. Ce cas doit servir de témoin pour l'audit global avant de corriger l'importeur ou les scènes.

### 13.3 Fonction Map Library abandonnée

L'ancienne fonctionnalité du **PF2e Val Toolkit** qui transformait un token/PNJ en accès à une bibliothèque de cartes (`map-library`) a été volontairement abandonnée et supprimée du module. Elle ne doit pas être réintroduite lors d'un futur nettoyage du Toolkit.

---

## 14. Déploiement de scénarios et arborescence MJ

Le package ZIP reste l'artefact compilé entre l'application MJ et Foundry. Le Toolkit applique le package au monde Foundry ; il ne remplace ni SQLite comme source métier, ni le catalogue comme source de classement.

### 14.1 Arborescence calculée depuis le catalogue

Quand un package n'impose pas explicitement un chemin, le backend déduit désormais sa bibliothèque Foundry depuis les données métier courantes :

```text
MJ
├── Campagnes officielles
│   └── <campagne>
│       └── <scénario>
├── Campagnes transverses
│   └── <arc de 4 scénarios ou plus>
│       └── <scénario>
├── Campagnes transverses courtes
│   └── <arc de 2 ou 3 scénarios>
│       └── <scénario>
└── Scénarios individuels
    ├── Pathfinder Society
    │   └── <scénario>
    └── Autres
        └── <scénario>
```

La même logique doit s'appliquer aux Actors, Scenes et Journals gérés par le Toolkit. Les cartes/scènes officielles déjà fournies par d'autres modules et situées hors de l'arborescence `MJ` ne doivent pas être déplacées uniquement pour uniformiser l'affichage.

Le Toolkit sait relocaliser des documents qu'il gère lorsqu'un scénario change de catégorie, afin d'éviter qu'une réorganisation du catalogue crée une seconde copie dans un nouveau dossier.

### 14.2 Déploiement piloté et vérification

Le chemin normal est :

1. package v4 validé et intégré par l'API ;
2. demande de déploiement créée ;
3. un GM connecté laisse le Toolkit réclamer la demande ;
4. le Toolkit télécharge le ZIP ;
5. Actors, Scenes, Journal et assets sont créés ou mis à jour ;
6. le Journal du scénario est ouvert automatiquement après import réussi ;
7. le Toolkit renvoie le résultat à l'API ;
8. seule une réponse `success` confirme que le package est effectivement déployé.

L'interface MJ expose principalement l'état utile (`à préparer`, `à mettre à jour`, `prêt`, `échec`) et l'action suivante. Les anciens contrôles détaillés du workflow IA en deux phases sont conservés dans le code pour compatibilité mais volontairement masqués dans l'usage courant.

### 14.3 Contenu préexistant et contenu MJ

Un scénario peut combiner :

- des scènes ou cartes préexistantes fournies par un module officiel ou une installation antérieure ;
- des Actors, Scenes ou Journals créés par le pipeline MJ.

L'absence d'une Scene générée par le Toolkit ne prouve donc pas qu'un scénario est absent de Foundry. Les diagnostics doivent distinguer **contenu préexistant** et **contenu géré par le Toolkit**, puis agréger l'état au niveau de la campagne quand celle-ci est composée de plusieurs packages enfants.

---

## 15. Improvisation de séance : groupe actif, rencontres et PNJ rapides

> État vérifié dans le code du **PF2e Val Toolkit 0.42.0** le 18 octobre 2026. Le code courant reste la source de vérité si cette section devient ancienne.

Ces outils sont accessibles au MJ depuis les contrôles **Token** de Foundry. Ils servent à préparer rapidement une scène de jeu sans transformer l'improvisation de séance en donnée métier durable : les fiches mécaniques restent dans Foundry et les compendiums PF2e, tandis que SQLite reste réservé au catalogue, aux PNJ métier et aux relations éditoriales.

### 15.1 Groupe actif

Le Toolkit conserve un groupe de PJ de séance dans le setting monde caché :

```text
pf2e-val-toolkit.activeParty.actorIds
```

Seuls les Actors de type `character` sont acceptés. Le groupe persiste entre les scènes et les rechargements.

Le gestionnaire **Groupe actif** permet de :

- définir le groupe à partir des tokens de PJ sélectionnés ;
- sélectionner sur la scène les tokens correspondant au groupe ;
- placer au centre de la scène les membres absents à partir de leur prototype Token ;
- vider le groupe.

Les outils d'improvisation utilisent ce groupe comme contexte par défaut. Pour une rencontre, le nombre de PJ et le niveau moyen arrondi viennent du groupe actif ; à défaut, les PJ actuellement sélectionnés sont utilisés, puis un fallback de **4 PJ niveau 1**. Pour le PNJ rapide, le niveau moyen du groupe actif est proposé ; sans groupe actif, le niveau par défaut est 1.

API runtime utile pour diagnostic ou macro :

```js
game.pf2eValToolkit.activeParty
```

### 15.2 Index partagé de créatures

Les deux outils d'improvisation s'appuient sur `game.pf2eValToolkit.creatureIndex`.

L'index lit les Actors `npc` des compendiums installés ainsi que les NPC du monde. Le scope `core` regroupe explicitement :

- Monster Core et Monster Core 2 ;
- NPC Core ;
- Bestiary 1, 2 et 3 ;
- NPC Gallery.

L'index conserve notamment niveau, traits, rareté, taille, source et notes publiques. Il permet de filtrer par niveau, traits, texte, rareté, collection et périmètre de sources. Son cache est invalidé lors des créations, modifications ou suppressions d'Actors et lors des mises à jour de compendiums.

### 15.3 Générateur de rencontres

Le bouton **Improviser une rencontre** calcule d'abord le budget PF2e selon la difficulté et la taille du groupe.

Pour 4 PJ :

| Difficulté | Budget | Ajustement par PJ en plus ou en moins |
| --- | ---: | ---: |
| Triviale | 40 XP | 10 XP |
| Faible | 60 XP | 20 XP |
| Modérée | 80 XP | 20 XP |
| Sévère | 120 XP | 30 XP |
| Extrême | 160 XP | 40 XP |

La valeur d'une créature dépend de son écart de niveau avec le groupe : de **10 XP à niveau -4** jusqu'à **160 XP à niveau +4**.

Les trois catégories de composition signifient :

| Catégorie | Niveaux recherchés par rapport au groupe |
| --- | --- |
| Forte | +2 puis +1 |
| Moyenne | 0 puis -1 |
| Faible | -2, -3 puis -4 |

Les profils **Automatique**, **Boss + renforts**, **Groupe équilibré** et **Horde de faibles** préremplissent les nombres Forte / Moyenne / Faible en fonction de la difficulté et du nombre de PJ. Ces nombres restent modifiables avant génération. **Composition personnalisée** ne remplace pas les valeurs saisies.

Le profil **Automatique** possède plusieurs structures possibles selon la difficulté afin d'éviter de converger systématiquement vers deux ennemis. **Boss + renforts** cherche une structure avec au moins un adversaire fort ou moyen et, lorsque le budget le permet, au moins deux faibles. **Horde** ne propose que des faibles.

Les nombres sont des **objectifs de composition**, pas une promesse absolue. Le moteur choisit les niveaux exacts disponibles dans chaque catégorie, maximise d'abord le nombre de slots demandés puis les XP utilisés, et **ne dépasse pas le budget**. Un slot peut donc être omis si les filtres, le bestiaire disponible ou le budget rendent la composition impossible.

Filtres disponibles :

- thème / texte ;
- trait PF2e ;
- sources : bestiaires principaux, tous les compendiums, ou compendiums + NPC du monde ;
- rareté ;
- inclusion optionnelle des NPC déjà sélectionnés sur la scène dans le budget.

La prévisualisation permet de remplacer une seule créature, de relancer toute la composition ou d'ajouter la rencontre à la scène. Les Actors issus de compendiums sont matérialisés dans un dossier Actor **Improvisation** et réutilisés lorsqu'une copie portant la même source de compendium existe déjà.

### 15.4 Création rapide de PNJ

Le bouton **Créer un PNJ rapide** est volontairement un outil de **reskin mécanique**, pas un générateur de nouvelle fiche de règles.

Il cherche uniquement dans :

```text
pf2e.pathfinder-npc-core
```

Critères disponibles :

- niveau ;
- profil : tous, combattant, lanceur de sorts, soutien/soins, discret/crim., autorité/social ;
- concept / recherche libre ;
- trait ;
- rareté.

La recherche essaie d'abord le niveau exact, puis élargit à ±1 et enfin ±2 si nécessaire. Les Troops sont écartées. Les résultats sont classés selon le concept, le profil, la proximité de niveau et la rareté ; jusqu'à 12 candidats sont affichés.

Le workflow conserve les critères tant que la fenêtre n'est pas abandonnée :

- **Autres résultats** exclut d'abord les candidats déjà affichés pour proposer une autre série ; lorsque les alternatives sont épuisées, la recherche repart sur l'ensemble du pool ;
- **Retour aux critères** rouvre le formulaire avec les valeurs précédentes ;
- le nom personnalisé saisi est également conservé pendant ces allers-retours ;
- l'icône livre d'un résultat ouvre sa fiche de compendium.

Après choix, le Toolkit clone l'Actor avec `game.actors.fromCompendium()`. Attaques, actions, sorts et données mécaniques restent donc ceux du statblock PF2e d'origine. Le MJ peut créer seulement l'Actor ou le créer puis poser immédiatement son Token au centre de la scène.

Ces Actors sont rangés dans **Improvisation** sous le dossier Actor `MJ` lorsqu'il existe. Cette création **ne crée pas un PNJ métier dans SQLite** et ne doit pas être interprétée comme une nouvelle identité narrative canonique.

### 15.5 Principe de conception

La séparation à conserver est :

```text
texte / intention du MJ
        ↓
critères structurés
        ↓
index de créatures + budgets PF2e
        ↓
Actor officiel ou clone Foundry
```

Les outils d'improvisation peuvent évoluer en ergonomie, mais le moteur mécanique doit rester déterministe et fondé sur les données PF2e/Foundry. Une éventuelle couche de langage naturel ou d'IA doit seulement traduire une intention en critères structurés et laisser au MJ la possibilité de vérifier ces critères avant génération.

