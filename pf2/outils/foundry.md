# Foundry PF2 — Toolkit, Relay, scènes et personnages

[← Outils](../../OUTILS.md)

## 8. Portraits PNJ — code vérifié le 18 octobre 2026

`Pf2MjService.ts` résout `FOUNDRY_ASSETS_ROOT`, écrit les fichiers sous `portraits/pnj/` et en conserve le chemin logique `assets/l7r/portraits/pnj/`. Les valeurs réellement présentes dans la bibliothèque Foundry n'ont pas été vérifiées pendant cet audit.

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

### 10.8 Cache des niveaux PJ pour Discord (5 novembre 2026)

La commande Discord `/recap-pjs` doit afficher le **niveau réel** (fiche Foundry) et le **niveau théorique** (courbe XPC) même lorsque personne n'a ouvert Foundry au moment de la commande.

Le Toolkit `scripts/player-level-sync.js`, lancé depuis `scripts/main.js` uniquement par le **premier GM actif**, attend que `syncCareerXpFromResumes()` ait terminé son recalcul et les éventuelles mises à jour d'Actors. Il envoie ensuite un instantané des personnages de type `character` possédés par des joueurs :

```text
POST <API PF2 MJ>/player-codex/foundry-level-snapshot
x-pf2-foundry-sync-key: <clé déjà configurée dans discordCharacterChatKey>
{ "players": [{ "uuid": "Actor.…", "foundryLevel": 4, "xpc": 6500 }] }
```

- L'API contrôle la clé `PF2_FOUNDRY_CHAT_SYNC_KEY`, la forme des UUID, les valeurs et les doublons. Elle calcule elle-même `theoreticalLevel` par `levelForCareerXp(xpc)`, puis fusionne les niveaux dans `pf2.sqlite` via `saveFoundryPlayerLevels`. Aucun niveau théorique fourni par le navigateur n'est accepté comme source de vérité.
- Un changement d'Actor PJ déclenche un nouvel envoi après regroupement des événements. Un instantané identique n'est pas renvoyé ; les erreurs réseau font l'objet de quelques nouvelles tentatives.
- Les envois n'écrivent **aucune** donnée dans les Actors Foundry. La synchronisation des XPC et de l'XP native reste la responsabilité de la procédure existante du Toolkit.
- L'API conserve aussi sa capture périodique en lecture seule comme filet de sécurité. Si Foundry et le cache sont tous deux absents, `/recap-pjs` indique `?` au lieu d'inventer une valeur.
- **Limite métier :** le Toolkit aligne actuellement automatiquement le niveau de la fiche PF2e sur la courbe XPC. Une absence de choix de dons, compétences ou autres éléments d'une montée de niveau ne peut pas être diagnostiquée par la seule comparaison des deux nombres. Cette fonctionnalité requiert un contrôle distinct de la fiche.

**Installation :** le monde Foundry doit avoir le réglage restreint `pf2e-val-toolkit.discordCharacterChatKey` configuré avec la même clé que `PF2_FOUNDRY_CHAT_SYNC_KEY` côté API. Aucune nouvelle clé ni ouverture d'endpoint public non authentifié n'est nécessaire.

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

### 15.2.1 Illustrations privées Monster Core (4–5 novembre 2026)

**Contrainte : ne publier aucune image issue des PDF sur GitHub.** Les PDF de *Monster Core 1* et *Monster Core 2* en anglais restent dans `/home/valou/services/`. Les illustrations sont uniquement stockées sur le mini-PC dans `pf2-data/_AI/` et dans le module local `Data/modules/monster-core-private-art/`.

- Les compendiums remaster PF2e possèdent **492 + 446 = 938 Actors**, sans illustrations spécifiques. Ils ne sont pas modifiés.
- Pilote initial : 20 images validées, 20 copies d'Actors et 20 tokens réellement installés et vérifiés par API dans la scène `TestToken`, dans le dossier d'Actors `TestToken - Monster Core`. Le MJ a validé ce pilote.
- Inventaire complet des **756 pages des deux PDF** : 274 images candidates dans Monster Core 1 et 324 dans Monster Core 2, soit **598 images extraites en PNG** avec **598 tokens WebP**. Le dossier privé `pf2-data/_AI/monster-core-complet/` comprend `index-pdf.py`, `extract-all.py`, `inventory.json`, `inventory.csv` et 25 planches JPEG de revue.
- Répartition : 20 illustrations du pilote déjà validées, 293 associations simples encore à vérifier visuellement, 134 cas avec plusieurs candidats et 151 images sans association directe. Ces images ne couvrent pas nécessairement 938 fiches uniques ; certaines variantes partagent l'art ou n'en ont pas.
- Un **second lot de 20 illustrations** a été contrôlé visuellement et ajouté au module privé (total actuel : **40 correspondances** et 80 fichiers portrait/token). Les scripts de reprise normale sont `pf2-data/_AI/monster-core-complet/place-approved-testtoken.py` et `verify-approved-testtoken.py`. Leur exécution nécessite un client Foundry connecté et autorisé via le relais REST.
- **État au dernier contrôle : le deuxième lot n'était pas encore placé dans TestToken**, car le client Foundry du relais s'est déconnecté. Ne pas écrire directement dans LevelDB ni lancer un hook d'import automatique pour contourner l'accès. Relancer explicitement via le REST Relay après reconnexion MJ.
- Le module `monster-core-private-art` est installé localement, mais son activation dans le monde n'a pas été vérifiée ; les copies d'Actors sur la scène utilisent déjà les liens d'images privées.
- Le code du dépôt `pf2e-val-toolkit` a des modifications locales indépendantes en cours : ne pas les écraser ni les mélanger avec ce chantier.

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


## Gagner de l'argent — versement depuis le chat (proposition, octobre 2026)

Dans le module `pf2e-val-toolkit`, le rendu du résultat natif PF2e `earn-income` reçoit un bouton **Ajouter l'argent**. Le montant provient uniquement de la ligne « revenu gagné » du résultat (total pour tous les jours) ; aucune récompense n'est déduite du seul résultat du d20. Le joueur propriétaire du personnage ou le MJ doit confirmer le crédit. Le Toolkit appelle `actor.inventory.addCoins`, puis conserve un drapeau sur le message de chat pour empêcher un second crédit. Les montants illisibles ne donnent pas de bouton actif. Le développement est sur branche séparée et doit être vérifié dans Foundry avant diffusion.

### 15.6 Compatibilité PF2e Leveler — prérequis français

**Cas confirmé avec Eryn (Assurance)** : dans PF2e Leveler 3.7.9, `Qualifié dans au moins une compétence` est interprété comme un nom de don au lieu d'une condition de compétence, car le parseur ne reconnaît que les connecteurs `in` et `en`. Le moteur de règles rejette ainsi Assurance à tort alors qu'une compétence est qualifiée.

Le Toolkit installe au démarrage, **uniquement si PF2e Leveler 3.7.9 est actif**, un patch de compatibilité de sa fenêtre `FeatPicker`. Il réévalue les prérequis commençant par un rang de maîtrise suivi de `dans` en présentant provisoirement `en` au vérificateur **d'origine**. Les objets Foundry et les compendiums ne sont jamais modifiés. Toutes les autres conditions sont encore vérifiées ; les restrictions d'archétype et les blocages d'accès restent applicables. Le patch est ignoré si Leveler est absent ou sur une autre version, afin d'éviter un conflit avec une future correction officielle.

Source : `pf2e-val-toolkit/scripts/patches/leveler-french-ranks.js`. Test reproduisant le bug et vérifiant le correctif : `node pf2e-val-toolkit/tests/leveler-french-ranks.mjs`. **Test interactif de validation** à refaire dans Foundry avec la fiche d'Eryn et le don Assurance après mise à jour du Toolkit. Ne pas éditer les fichiers du module tiers installé directement.

### Jets privés PF2e — nom du PJ et intitulé (octobre 2026)

Les jets aveugles Foundry V14 n'ont pas nécessairement de propriété `rollMode` exploitable dans le message : ils possèdent `blind: true` et une liste `whisper`. Le précédent correctif `private-roll-names.js` ne reconnaissait donc pas certains jets, laissant le nom du joueur (ex. **Arcady**) dans l'en-tête et la phrase de remplacement.

Le Toolkit identifie désormais les jets privés via `blind` / `whisper`, préfère le nom de l'Actor lié à `speaker.actor`, et masque le suffixe de joueur de la convention `Personnage (Joueur)` (ex. **Pen-Pen**). Il remplace le nom dans la phrase générique du chat et ajoute `Jet : <action>` en lisant seulement le titre `<h4 class="action"><strong>…</strong></h4>` du `flavor` PF2e. Le reste du contenu `flavor`, susceptible de contenir des DD, modificateurs ou résultats, n'est **jamais** recopié ; les dés restent masqués. Si aucune action identifiable n'est disponible, le Toolkit n'invente pas son type.

Reproduction validée en lecture seule sur deux messages privés du 21 octobre 2026 : leur `speaker.alias` était `Pen-Pen (Arcady)` et leur action `Se Souvenir`. Tests automatisés : `node pf2e-val-toolkit/tests/private-roll-names.mjs` (y compris un DOM de chat masqué). Validation interactive à effectuer après déploiement du Toolkit.

### Portrait des personnages sur les jets privés (21 octobre 2026)

Le personnage Pen-Pen (Arcady) possède bien \`assets/Pen-Pen_01.png\` dans Foundry. Ses deux messages de jet aveugle contiennent déjà \`speaker.actor\` et des données d'avatar Dorako, mais certains rendus du chat n'affichent aucune image. Le Toolkit ajoute une **image de secours** à l'en-tête uniquement lorsque le portrait est absent, à partir de \`Actor.img\` (ou de la texture du prototype de token) des Actors de type \`character\`. Un portrait Dorako existant est conservé sans duplication ; l'état \`no-image\` est ajusté et une règle CSS explicite garantit une taille et un cadrage. Les tokens cachés ne font pas apparaître d'avatar supplémentaire pour les non-MJ. Aucune donnée du jet n'est révélée.

Fichiers : \`pf2e-val-toolkit/scripts/private-roll-names.js\`, \`styles/private-roll-names.css\` et tests \`tests/private-roll-names.mjs\`. Tester l'affichage réel après mise à jour/rechargement de Foundry.

---

## Gestion ponctuelle des personnages dans Foundry

Le monde Foundry est la source de vérité des Actors, familiers, Items et
préparations de sorts. Les modifications ponctuelles passent par l'interface
ou les endpoints documentaires autorisés du REST Relay. Elles ne sont jamais
réalisées par un importeur de personnage spécifique au Toolkit ou un hook
de création automatique. En cas de refus d'accès, rechercher la cause et
demander l'accord de l'utilisateur avant un contournement.

La synchronisation XPC du Toolkit concerne les personnages possédés par les
joueurs : une fiche de type character appartenant seulement au MJ reste
hors des calculs XPC des séances des PJ.

---

## Pilotage A/V LiveKit par le MJ (toolkit 0.44.6)

Sur LiveKit serveur v1.9.4, le toolkit force le protocole RTC legacy
(`/rtc`) : le client 2.19.x essayait `/rtc/v1` (404). Aucun réglage du
serveur ni fichier du module LiveKit tiers n’est modifié.

Le panneau `Communications MJ` est injecté par `pf2e-val-toolkit` dans la
catégorie dédiée **Outils MJ**, avec Groupe actif, PNJ rapide et Improvisation, à l'aide des modes A/V natifs de Foundry 14 : arrêt complet,
audio seul, audio + vidéo. Le MJ décide manuellement, indépendamment des
commandes début/fin de séance. Les joueurs gardent le contrôle de leurs
périphériques ; l'arrêt global coupe les flux des clients Foundry équipés du
toolkit. Les infobulles audio/vidéo sont déplacées au-dessus des commandes.
Le micro et la caméra ne sont acquis par le navigateur qu’après activation
volontaire du joueur (sauf une activation déjà consentie et conservée lors
d’un changement de mode actif).

Un clic sur un mode déjà sélectionné relance la connexion en cas d’échec ;
le retour de succès dépend de la connexion effective du client LiveKit.

L’activation individuelle après arrêt / relance tient compte du réglage explicite
`muted/hidden` du joueur, indépendamment de l’existence préalable d’une piste
LiveKit (différée pour confidentialité).

Le premier affichage du panneau A/V est forcé à la connexion, car Foundry 14
ne dessine pas une fenêtre `ApplicationV2` au premier `render()` sans `force`.
À l’arrêt du MJ, le dock est explicitement fermé.

À l'arrivée sur une session LiveKit active, une fenêtre demande au joueur
s'il souhaite **Activer le micro**, **Activer micro et caméra** (seulement si
la vidéo est autorisée par le MJ), ou **Refuser**. L'offre est affichée une fois
par chargement de page, et ne change rien tant que le joueur n'a pas accepté.
Les modes vocaux personnels, dont push-to-talk, restent inchangés.

La description technique, les limites et les tests sont dans
[`pf2e-val-toolkit/README.md`](../../pf2e-val-toolkit/README.md).


## Audit des cartes Racooze et des doublons — 3 novembre 2026

Instantané en lecture seule du monde `test-pf2` sur le mini-PC, pendant la réorganisation des scènes : **520 scènes**. Une comparaison des groupes de scènes portant le même nom, dans le même dossier, avec les drapeaux `racooze-map-library.mapSlug`, empreintes des imports et nombres d'éléments, donne **72 groupes de doublons et 75 scènes surnuméraires** : **56 pour Age of Ashes**, **19 pour Agents of Edgewatch**. Deux cartes possèdent des tokens uniquement sur un des exemplaires et demandent de préserver la version enrichie : `Tipsy Tengu` et `Knight's Marvelous Menagerie`. Les originaux et les nouveaux imports ont souvent exactement les mêmes caractéristiques de carte et empreintes de sources.

La copie de travail de l'audit et le plan de conservation restent sur le mini-PC : `/tmp/racooze-dedupe-20261103/` (`global.json`, `duplicates-detail.json`, `dedupe-plan.json`), avec **snapshot LevelDB avant modification**. Il ne s'agit pas de fichiers à commiter. Le premier doublon `Scene.Vxk2bTaMc2S94U8W` (Tipsy Tengu, sans tokens) a été supprimé avec succès via le REST Relay `DELETE /delete`, en conservant `Scene.S8CI8g7so0k1sOCs` (avec tokens). L'ancienne carte `Scene.03K90p7HX87wIJwW` (Ruined Temple) a été renommée « Temple en ruine » par `PUT /update`, puis vérifiée par `GET /get`. **Les 74 autres suppressions et la traduction générale ne sont pas terminées : la tentative d'opération groupée a été bloquée par les contrôles d'exécution. Ne pas prétendre que l'ensemble a été nettoyé.**

**Répertoire MJ / Campagnes officielles : ne pas supprimer en bloc.** Plusieurs scènes MJ ne disposent pas de remplacement dans la bibliothèque téléchargée :
- Les scènes personnalisées d'Extinction Curse / Sentence d'extinction ne sont pas remplacées par un lot de scènes Racooze correspondant.
- Les scènes Agents d'Absalom du livre 4 ne sont pas couvertes par les cartes Racooze actuellement importées (principalement livres 1 à 3).
- Une scène personnalisée des Sept Fléaux de Pointesable, « Catacombes du Feu Infernal », contient 287 murs, une lumière et 13 tokens ; sa structure doit être conservée tant que son équivalent n'a pas été établi.
- Les dossiers MJ contiennent aussi des préparations et des cartes par étage ou niveau qui ne correspondent pas nécessairement aux vues Racooze uniques.

Pour terminer : privilégier l'API Document Foundry avec session MJ active, conserver les versions ayant des tokens ou des modifications manuelles, vérifier l'existence des équivalents avant suppression, traduire les **noms des scènes** en français sans toucher aux drapeaux `mapSlug`, puis refaire un audit différentiel après nettoyage. Aucun passage direct en écriture de LevelDB n'est autorisé.

---

## Coffres à la Loge des Éclaireurs — toolkit 0.44.13 (PR du 5 novembre 2026)

- Les 12 Actors loot personnels de la scène La Loge des Eclaireurs étaient en majorité accessibles à tous (ownership.default = 3), alors que leurs propriétaires individuels étaient correctement renseignés. Leurs propriétés générales ont été remises à 0 via le REST Relay, **sans modifier les droits nominatifs ni la visibilité des tokens**. Ces droits doivent rester privés lors de toute recréation de coffre.
- Le **Coffre du groupe** est un Actor loot à accès général Observateur (2) : ce niveau suffit à PF2e pour demander au MJ un transfert d'objet, sans donner à tous les droits complets de propriétaire.
- Le Toolkit propose deux actions depuis les lignes d'inventaire des PJ (coffre personnel / collectif) et une action de récupération sur les coffres. Ces actions ne sont disponibles que sur la scène de la Loge et passent par transferItemToActor() de PF2e ; la pile entière est transférée d'un clic, une unité par Maj + clic.
- L'association normale est déduite de « Personnage (Joueur) » ↔ « Coffre de Personnage ». Les exceptions sont configurables par le MJ via le réglage de monde JSON lodgePersonalChestLinks ; les identifiants de la scène et du coffre du groupe sont également configurables.
- La permission native Foundry reste **par utilisateur**. Le Toolkit vérifie en outre game.user.character pour ses boutons, sans prétendre verrouiller toutes les voies d'accès natives selon le personnage actif.
- Code : pf2e-val-toolkit/scripts/lodge-stashes.js, style styles/lodge-stashes.css, tests tests/lodge-stashes.mjs. Détails de configuration dans pf2e-val-toolkit/README.md.
- **Livraison :** branche/PR isolée, sans chargement de cette version dans Foundry avant fusion ; essais de transfert réels à effectuer sur la scène après fusion et rechargement.

---

## Réglage de grille — Sept Fléaux de Pointesable (7 novembre 2026)

Dans le monde **test-pf2**, dossier de scènes français « Les Sept Fléaux de Pointesable », le MJ a demandé un quadrillage deux fois plus dense. Contrôle du **7 novembre 2026** par l'API documentaire Foundry :

- **13 scènes inspectées** : les scènes 01 (Catacombes) et 02 (Corniches C1–C7) étaient déjà à une taille de grille de 50 px.
- **11 scènes corrigées** : 03, 04, 05, 05b et 06 à 12 sont passées de 100 à 50 px par case, en conservant la distance de 5 pieds, les dimensions du canvas et les fonds de carte.
- Les **339 tokens** et **4 012 murs** des 13 scènes ont été relus ; leurs documents et coordonnées sont inchangés, hormis la propriété dérivée *Token._regions* recalculée par Foundry pour quatre tokens de la scène 03 en raison de leur nouvelle emprise.
- Sauvegardes JSON privées *avant modification* des 13 scènes : /home/valou/services/pf2-data/_AI/scene-grid-fosse-backup-20261107/. Aucune donnée du monde ou illustration privée n'est publiée sur GitHub.
- Modification et vérification via les endpoints documentaires Foundry REST Relay, sans écriture LevelDB et sans redémarrage Foundry.

**Limite :** cette première opération réglait seulement la densité de grille. Le décalage des éléments de N1 a été traité **ensuite**, comme décrit ci-dessous. La validation visuelle en client MJ reste à faire. La duplication/agrandissement ×2 de N1 demandée auparavant n'avait pas été effectuée.

### Fosse N1 — translation verticale des placeables (7 novembre 2026)

Sur la scène 03 — **Fosse N1, Repaire des Crocs-Sifflets**, la capture fournie par le MJ montre le contrôle d'une porte une case **sous** le pont représenté sur la carte. Pour aligner les éléments avec l'image, correction via les endpoints documentaires Foundry en déplaçant les éléments de **−50 px en Y** (une case de grille), tout en laissant le Level de fond et la grille inchangés.

- **643/643 murs et portes** et **16/16 notes de salle** : translation exacte, vérifiée par identifiant et coordonnées.
- **57/61 tokens** : translation exacte. Le token de Volpépite avait été déplacé indépendamment pendant l'opération ; sa nouvelle position a été conservée avant application du décalage vertical.
- **Quatre exceptions** : les tokens de **Saucisse** et **Seigneur Longs-Doigts** n'ont pas été déplacés, car leurs références d'Actor invalides provoquent des erreurs de validation Foundry. Un **Commando gobelin** est resté 10 px au-dessous de la position cible et **Minargul** 11 px au-dessous, leurs mouvements étant arrêtés par les collisions Foundry. Ne pas contourner ces erreurs en modifiant LevelDB, les ActorIds ou les permissions.
- Tous les identifiants d'éléments sont conservés. L'image du Level, la grille et les dimensions de la scène sont inchangées.
- Snapshot JSON privé avant opération, script de reprise et snapshot après intervention : /home/valou/services/pf2-data/_AI/fosse-n1-translation-backup-20261107/.

**À reprendre :** vérifier visuellement l'alignement porte/pont et régler les quatre exceptions avec la méthode Foundry appropriée, après validation du MJ. Ne pas considérer la translation de tous les tokens comme terminée.

---

## Bibliothèque des cartes et pilote Pathfinder Society — 11 novembre 2026

Audit en lecture seule puis corrections ciblées dans le monde Foundry **test-pf2** via REST Relay avec un client MJ connecté, sous **Foundry V14.365 / PF2e 8.4.1**.

- L'ancien inventaire du 3 novembre recensait **520 scènes** et proposait **75 suppressions** parmi 72 groupes de doublons. La nouvelle lecture **live** du 11 novembre compte **407 scènes avant** le pilote ; les 75 scènes anciennes à supprimer ont toutes disparu, tandis que les versions désignées à conserver sont présentes. Aucun autre doublon de nom dans un même dossier n'est relevé. **Aucune suppression supplémentaire effectuée.**
- Le contrôle des ressources après reprise porte sur **409 scènes et 2 276 références**, dont 1 892 fichiers locaux présents, 320 références externes ou icônes natives non évaluées dans Data, et **64 références locales absentes** : 59 miniatures d'un monde Phandelver externe, 4 sons et 1 tuile. **Aucune image de fond de scène manquante** parmi les chemins locaux contrôlés.
- Sur 65 chemins d'images auparavant proposés à la correction, **51 concernaient des scènes désormais supprimées**. Les **14 images de fond encore concernées** ont été réparées dans leur scène d'origine via le REST Relay, en changeant uniquement le chemin de fond du niveau de assets/maps vers le fichier existant maps ; relecture de chaque scène après modification, et conservation des murs, tokens et autres paramètres.
- **Ne pas désinstaller** les modules tant que les scènes utilisent leurs chemins : ec-maps-remake-by-lios (73 fonds, 73 miniatures, 1 tuile), mad-phandelver (58 fonds, 330 tuiles, 324 sons) et monster-core-private-art (145 références de tokens dans les scènes). Les collections libres présentes sans références dans cet inventaire ne sont pas automatiquement à supprimer : vérifier les compendiums et les éventuels futurs imports.
- **Kingmaker** : 43 scènes déjà importées. Comparer les nouvelles collections plutôt que créer un second ensemble par défaut.

### Pilote PFS S01-00 — Origin of the Open Road

Le PDF anglais officiel conservé dans la bibliothèque privée contient deux cartes distinctes ; elles ont été extraites puis adaptées au quadrillage dans des fichiers WebP **privés**, sous Data/worlds/test-pf2/images/scenes/pfs-s01-00/.

Le dossier de scènes **« PFS S01-00 — Origin of the Open Road (cartes préparées) »** est créé dans Foundry (navigation des joueurs désactivée) :

- Scene.eYxhjbWrCqWtLtO7 — **A, Archives de l'orrerie**, à Quantium ; page 6 du PDF, grille carrée **85 px / 5 pieds**, image **2573 × 2061**.
- Scene.Dtg1CvduJ1cIxccD — **B, Égouts de Quantium**, page 12, grille carrée **66 px / 5 pieds**, image **2590 × 1796**.

Les paramètres et les chemins d'images ont été vérifiés par API. **Le calage du quadrillage reste à confirmer visuellement dans le client**, et les deux scènes n'ont encore **ni murs, ni éclairages, ni tokens**. Il s'agit de cartes préparées manuellement, **pas encore d'un import complet par PDF to Foundry**. L'importateur PDF to Foundry n'a pas été installé sous V14 par cette opération.

### Données privées et suite

Les rapports détaillés, sauvegardes de scènes avant correction, inventaire des images, fichiers convertis et scripts ponctuels sont conservés uniquement sur le mini-PC dans /home/valou/services/pf2-data/_AI/cartes-audit-20261111/. Les PDF et illustrations propriétaires ne sont pas publiés sur GitHub.

Priorités : validation visuelle des deux cartes PFS ; éventuellement murs et éclairages pour celles qui seront jouées ; contrôle des miniatures Phandelver uniquement si utile ; test de Deidril sous V14 sur un scénario effectivement pris en charge (21 PDF anglais complets identifiés parmi 27 références étudiées), et test de l'importateur historique PDF to Foundry dans un environnement V13 séparé si besoin. Ne pas importer toutes les cartes en bloc ni désinstaller les modules sources sans vérification des dépendances.

### Après le retrait des scènes Phandelver (11 novembre 2026)

- Le MJ a retiré son dossier de **59 scènes Phandelver**. Relecture du monde : **350 scènes restantes** ; aucune scène ne référence désormais les fichiers du module **mad-phandelver**. Celui-ci est néanmoins toujours installé (**environ 446 Mo**) et actif. Il n'a pas été désinstallé.
- Inventaire des scènes restantes : dépendances de module limitées à **ec-maps-remake-by-lios** (147 références de scène) et **monster-core-private-art** (145 références de tokens). Il reste seulement **5 fichiers locaux introuvables** (4 sons et 1 tuile), sans lien avec Phandelver.
- **Deidril 7.90 est incompatible avec la version de PF2e en cours** : il demande au minimum PF2e 8.5.0 ; ce monde est en **PF2e 8.4.1** sous Foundry **V14.365**.
- **Deidril 7.87**, distribution officielle, est compatible Foundry V14 et exige au minimum PF2e 8.0.0. Cette version a été **installée sur disque sans activation**, dans le dossier des modules du mini-PC. Le client actuellement connecté ne l'a pas encore chargée ; aucun redémarrage ni import n'a été lancé.
- **Pilote d'import proposé** : PDF anglais original *Pathfinder Society S03-16 — Escape from Oppara*, déjà présent dans la bibliothèque privée, 34 pages, non chiffré. Deidril référence ce scénario parmi ceux pris en charge. Le module s'utilise via le panneau de configuration Foundry **Helyx - Import PDF** ; fournir le PDF dans ce sélecteur depuis le client MJ après activation. Attention : les identifiants d'objets importés ne sont pas stables d'un import à l'autre.
- Les rapports détaillés et le package Deidril 7.87 (SHA-256 **a7bf73b332c726c5abea64d3224222f9bdc3a8f8c6717c22491010b9f714387e**) restent sur le mini-PC, dans l'audit privé. Aucune illustration de PDF n'est mise dans GitHub.

**Avant d'importer :** actualiser le catalogue de modules Foundry si nécessaire, puis activer **Deidril 7.87** pour le monde et fournir le PDF du pilote ; ne pas accepter une mise à jour automatique vers 7.90 sans vérifier la version du système PF2e. Contrôler les scènes, journaux et Actors générés avant de tenter un second import.

### PFS S01-00 — Cartes réorientées et repères MJ (11 novembre 2026)

- Les deux scènes PFS S01-00 ont conservé leurs UUID, mais leurs images privées ont été tournées pour retrouver l'orientation du PDF. Images actuelles : orrery-archive-portrait-aligned.webp et awash-in-slurry-portrait-aligned.webp, dans worlds/test-pf2/images/scenes/pfs-s01-00/. Copies d'origine et snapshots avant modification conservés.
- Grilles vérifiées à 85 et 66 px pour 5 pieds ; calage visuel local de certains secteurs de la scène B encore à confirmer.
- Création de **14 repères MJ cliquables** renvoyant à deux journaux privés (16 pages) ; troisième journal privé de trois documents joueurs issus des pages 16–17 du PDF, à partager au bon moment. Aucun accès joueur par défaut.
- **Non terminé :** aucun mur, lumière dynamique ou token préparé sur ces deux scènes. Il reste à les préparer et à valider visuellement en client MJ.
- Détails : [fiche du scénario](../campagnes/Scenario-Origines-Route-Ouverte.md). Pas d'images/PDF propriétaires dans GitHub.

## Convention MJ — explorer une carte par journaux, Actors et coffres (12 novembre 2026)

À **généraliser** depuis la méthode déjà employée dans les scènes des **Sept Fléaux de Pointesable** : une carte de donjon sert à la véritable exploration, et **le conducteur de séance reste compact**. Ne pas générer une carte tactique complète lorsqu'une loge, un bureau ou une salle d'archives fonctionne mieux en RP.

### Composition d'une scène explorée

1. **Une note de journal par salle ou zone pertinente**, positionnée sur la carte, visible **MJ uniquement**. La page décrit ce que les PJ perçoivent, les éléments interactifs, les dangers/aptitudes/DD, les créatures et le butin ; elle distingue la description à lire des secrets de l'arbitre. Réutiliser les journaux existants, corriger et déplacer leurs repères plutôt que fabriquer des doublons.
2. **Les Actors/jetons mécaniques sont placés là où ils seront rencontrés** ; réutiliser d'abord un Actor déjà présent ou une entrée de bestiaire/compendium (Monster Core, NPC Core, Bestiary, etc.), afin de récupérer sa statistique et si possible son portrait. N'inventer un Actor spécifique que si les références ne conviennent pas ; les dangers (mécaniques, moisissures, gouffres) peuvent rester des **journaux ou dangers Foundry**, sans faux monstre.
3. **Coffres / Actors `loot` invisibles pour les joueurs**, uniquement aux emplacements où un butin exploitable existe réellement. Propriétés par défaut **privées au MJ**, token caché et visibilité contrôlée. Renseigner l'inventaire exact d'après la source, pas un butin improvisé pour remplir la carte. Les objets de quête restent identifiés séparément du trésor commercial.
4. **Murs, passages, portes, lumière et navigation** : vérifier les dimensions et l'alignement des cases avant de poser les tokens ; ne pas dévoiler les salles inexplorées via des icônes, étiquettes ou lumières. Les notes MJ et Actors dissimulés ne doivent pas devenir lisibles aux joueurs à cause de droits trop ouverts.

### Convention obligatoire de nommage des tokens

**Nom du token toujours affiché à tous** (Foundry `displayName` : mode **Always / Toujours visible**, y compris sur les clones créés depuis un compendium), sans divulguer les secrets de scénario.

- **Créature clairement identifiable** : dénomination **spécifique de son espèce/type visuel** lorsque plausible — `Pudding noir`, `Gobelin A`, `Gobelin B`, `Vase A`, `Vase B`. Numéroter/lettre A, B, C pour distinguer les exemplaires.
- **Monstre dont l'identité réelle est secrète ou trompeuse** : utiliser une apparence/description visible **informative** mais non spoilante, par ex. `Démon` (si démon manifeste), `Poupée de glaise` (pour un automate dont le nom n'a pas été révélé), `Garde masqué` ; ne pas afficher le nom individuel caché ou un type surnaturel invisible aux PJ.
- **PNJ réellement nommé et identifié dans la scène** : nom propre (`Bijan Ohrlavi`, `Zaynap Ohrlavi`). Si les PJ ne connaissent pas encore son nom, employer un libellé descriptif jusqu'à la présentation, puis mettre à jour le token.
- **Éviter deux extrêmes** : les noms trop flous (par ex. `Animal bestial`, `Créature de feu` lorsque l'espèce est reconnaissable), et les noms encyclopédiques ou secrets d'une entité qui n'a pas été identifiée.

**Distinguer le nom affiché des autres visibilités :** un nom en mode Always ne rend pas un token caché visible, ne le dévoile pas sur une scène inexplorée et ne donne aucune permission de consulter la fiche. Vérifier nom, `displayName`, `hidden`, `ownership`, image `Actor.img` et texture du token **dans Foundry après création** ; la simple présence d'un fichier portrait sur disque ne prouve pas qu'il est utilisé.

### Méthode technique et blocages

Travailler sur le **monde effectivement ouvert**, via **Foundry REST Relay connecté à un client GM** ou l'interface Foundry ; lire d'abord Scene/Actors/Notes/carte et faire une sauvegarde ciblée autorisée avant un remplacement massif. Modifier les documents par les endpoints normaux `/canvas/{documentType}`, `/create`, `/update`, `/scene` (selon l'opération), puis **relire le résultat**. Ne jamais modifier directement LevelDB, ni injecter des scénarios dans le module ou un hook de démarrage pour contourner une panne du Relay.

**Cas concret 12 novembre 2026** : scènes du scénario PFS 1-00 déjà référencées dans [la fiche de scénario](../campagnes/Scenario-Origines-Route-Ouverte.md). Le service Relay répondait, mais l'unique client `test-pf2` était indiqué hors ligne ; **aucun token, Actor, coffre ni repère n'a été modifié dans ce contrôle**. Reprendre les placements par le processus nominal une fois le client GM connecté.
