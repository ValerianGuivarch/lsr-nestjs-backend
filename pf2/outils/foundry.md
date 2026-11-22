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

### 9.2 bis Versements de séance (toolkit 0.44.20)

`/fin-seance` mémorise les montants par PJ en SQLite. Le toolkit du monde `test-pf2` les récupère via `player-codex/foundry-session-coins`, avec la clé `PF2_FOUNDRY_CHAT_SYNC_KEY` existante, et les applique via `actor.inventory.addCoins`. Aucun droit `execute-js` requis. Seul le MJ actif exécute les opérations ; réservation SQLite unique par séance/PJ, flag `sessionCoinAwards` sur l'Actor, et aucune relance du crédit si un résultat est incertain. Un message Foundry signale les versements effectués ou à vérifier. Les anciennes séances ne sont pas remises en file. Voir [fin de séance](../../docs/pf2/discord-session-end.md).

### 9.3 Point XPC à surveiller

Le wrapper Nest contient encore un mécanisme de compatibilité qui peut reconstruire une XPC absente depuis le niveau et l’XP PF2e existants.

Le Toolkit, lui, ne reconstruit jamais une XPC absente à partir de ces valeurs.

Cette divergence doit être traitée comme une dette technique. Le comportement canonique à conserver est celui du système XPC décrit dans la section suivante.

---

---

### 9.4 Accès contrôlé aux scènes et documents MJ (12 novembre 2026)

Les opérations de scènes auparavant lancées directement contre le relais passent désormais par **le service Nest existant** `FoundryRelayService` : la clé `FOUNDRY_REST_API_KEY` reste dans le processus serveur, sans lecture/transmission via une commande ChatGPT.

**Routes internes du backend JDR** (préfixe `/foundry`) :

| Opération | Route |
|---|---|
| Lire une scène | `GET /foundry/gm/scenes/:uuid` |
| Lire les éléments d'un calque | `GET /foundry/gm/scenes/:uuid/canvas/:type` |
| Créer un jeton ou une note | `POST /foundry/gm/scenes/:uuid/canvas/:type` |
| Mettre à jour un élément de calque | `PUT /foundry/gm/scenes/:uuid/canvas/:type/:documentId` |
| Créer un Actor ou JournalEntry | `POST /foundry/gm/documents/:type` |
| Mettre à jour un Actor ou JournalEntry | `PUT /foundry/gm/documents/:uuid` |

**Toutes ces routes sont protégées** par l'en-tête interne `x-pf2-journals-key` (correspondant à `PF2_JOURNALS_INTERNAL_KEY` déjà configuré côté serveur). Sans cet en-tête valide, le backend refuse l'opération avant de contacter Foundry ; ce n'est **pas une API publique ou une interface à partager aux joueurs**. Les opérations ciblent uniquement un client connecté au monde `test-pf2`, valident les UUID et limitent les types documentaires. Elles ne proposent ni exécution libre de JavaScript Foundry, ni suppression de documents.

**Ordre pour reprendre PFS S01-00 :** vérifier le déploiement de cette version, accéder au service avec un client interne autorisé, lire `Scene.eYxhjbWrCqWtLtO7` (orrerie) et `Scene.Dtg1CvduJ1cIxccD` (égouts) puis leurs calques `tokens`, `notes`, `walls`, `lights`. Ne modifier qu'après audit de l'existant, et relire le résultat de chaque écriture. Les tests automatisés protègent la règle d'autorisation mais ne prouvent pas qu'un déploiement ou un placement effectif a eu lieu.

---

### Organisation des campagnes et détection (21 novembre 2026)

La convention cible est une racine par campagne dans Scene, Actor et JournalEntry, sans conteneur MJ pour les nouvelles préparations manuelles. The Party reste à la racine ; le dossier MJ est réservé aux éléments communs (PJ sous MJ / PJ, improvisation, etc.). Les imports historiques Toolkit sous MJ ne nécessitent pas une migration de format immédiate. Ne pas renommer arbitrairement les dossiers scénario du Toolkit : le reset reconnaît notamment leur préfixe d'identifiant.

Une scène détectée par identifiant/titre/alias de dossier est une **indication de présence**, pas une preuve que le module est prêt. La détection prend en compte les dossiers sous MJ et à la racine, ignore les dossiers vides, Copies, archives/OLD et Vérification. Le statut de déploiement Toolkit reste indépendant. Pour une association fiable à long terme, préférer les UUID des documents ou une association explicite de dossier par ID catalogue à un nom seul.

Le service de listes d'Actors conserve une portée volontairement limitée : racine et dossier PJ (à la racine ou sous MJ). Il alimente la sélection des participants/auteurs de résumés, le cache de noms Discord et les niveaux/XPC de /recap-pjs, ainsi que les candidats PNJ de cette portée. Les lectures individuelles par UUID sont indépendantes du dossier. Ne pas interroger en détail tous les monstres de campagne pour calculer la liste des PJ.

Rangement : inventaire par UUID, sauvegarde, comparaison des tokens (actorId), des notes (entryId/pageId), des références de préparations et du contexte. Déplacer sans recréer ; les homonymes ne sont pas des doublons avérés. Archiver les éléments incertains sous Vérification plutôt que les effacer. Les dossiers vides ne sont supprimés qu'après vérification de tous leurs descendants et de leur rôle. Les opérations restent soumises à l'accès Foundry normal et aux règles de PF2_WORKSPACE.

**Rangement réalisé le 21 novembre 2026** — monde actif, exclusivement via REST Relay (mise à jour du champ `folder`, et harmonisation de huit noms de dossiers racine). Inventaire avant/après et journal des modifications avec données avant écriture : `/home/valou/services/foundry/backups/organisation-20261121/`. Contrôle final : mêmes 362 scènes, 761 Actors, 133 journaux (1 256 UUID identiques), 195 déplacements directs (38 dossiers, 5 scènes, 66 Actors, 86 journaux), 10 dossiers créés ; aucun document supprimé et aucun ID recréé. Chaque déplacement a été relu et comparé hors champ folder, sort et _stats ; pour les noms de dossier, seul le nom a changé.

- Racines identiques dans les trois onglets pour La Route ouverte, Malveillance, Le Cartel du Sel, Agents d’Absalom, Sentences d’Extinction, Les Sept Fléaux de Pointesable, La Force des milliers et L’Âge des cendres. Les dossiers de scénario Toolkit existants conservent leur nom et UUID.
- La Route ouverte : 12 scènes, 39 Actors, 14 journaux (1-00, 1-08 et 1-21, selon contenu disponible). Les 1-08 sont rattachés à leur sous-dossier ; le Labyrinthe demeure intact. Les flags hérités incorrects de certains Actors n'ont pas été modifiés lors de ce rangement.
- Malveillance : 5 cartes actives et 6 anciennes cartes dans le sous-dossier d’archives, 61 Actors et 68 journaux. Les 37 journaux auparavant à la racine et les 15 coffres Blanchebois ont été identifiés via les repères/jetons des cartes.
- L’Âge des cendres : les 39 journaux AoA1 sont sous le tome 1 et les chapitres selon campaignId/moduleKey ; les arbres de cartes anglais et français et les copies sont conservés, sans fusion.
- Le Cartel du Sel : sous-dossier de La Vengeance de la rue Rose (3 scènes, 4 Actors, 1 journal). Les chapitres futurs ainsi que les campagnes sans contenu Foundry identifié (Pacte des Échanges, Absalom de l’Ombre) ne donnent pas lieu à des dossiers vides.
- Ressources communes : MJ / PJ (16 fiches, dont familiers et archive de Neyla), MJ / Marchands, MJ / TestToken - Monster Core ; la Loge des Éclaireurs est sous MJ / Divers. The Party demeure le seul Actor isolé à la racine. Les listes API `/foundry/actors` (17) et `/api/pf2-mj/actors` (14) retournent exactement les mêmes noms et UUID avant/après. `/foundry/scene-folders` confirme les chemins et compteurs de 1-08, 1-21, Malveillance et La Vengeance de la rue Rose.
- Exceptions intactes : Copies (13 scènes de Pointesable), Kingmaker (43), Runelords (37), OLD ; imports autonomes historiques encore sous MJ. Les dossiers de journaux vides Campagnes et Campagnes officielles ont été déplacés sous Vérification, sans suppression. Aucun journal ni scène à la racine.

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

### 15.2.1 Illustrations privées des bestiaires PF2e

**Contrainte : ne publier aucune image issue des PDF commerciaux sur GitHub.** Les PDF, les images, les tokens, les inventaires détaillés et les mappages d'art restent sur le mini-PC. Ne jamais modifier directement les bases de compendium LevelDB.

#### Monster Core 1 et 2 — traitement du 4–5 novembre 2026

Les deux PDF anglais sont dans `/home/valou/services/pf2-data/Références/Règles/` (déplacés le 22 novembre 2026 ; scripts privés adaptés). La source de vérité du traitement complet est le rapport privé `pf2-data/_AI/monster-core-complet/README.md`, avec `coverage-summary.json`, `coverage-report.csv`, `unmapped-actors.csv` et `all-art-mapping.json`.

- Pilote validé par le MJ : 40 tokens de démonstration placés dans la scène `TestToken` selon le rapport final (20 initialement vérifiés par API). Ne pas recréer inutilement ces tests.
- Extraction de 672 illustrations PNG (338 + 334) et de 672 tokens WebP transparents de 512 × 512, sans cadre ni recadrage destructeur ; une illustration peut servir à plusieurs variantes.
- Mappage natif installé : **909 / 938 Actors (96,9 %)**, dont 471 / 492 Monster Core 1 et 438 / 446 Monster Core 2. Les 29 fiches restantes n'avaient pas d'association suffisamment fiable dans ces deux PDF.
- Le module privé `monster-core-private-art` contient `map-pf2e.json` dans `/home/valou/services/foundry/data/Data/modules/monster-core-private-art/`. Il associe les IDs des fiches de compendium aux images et aux tokens, sans modifier les packs PF2e. Activé dans `test-pf2` le 5 novembre 2026 selon le rapport local, avec redémarrage du service et chargement des nouveaux modules après rechargement des clients.
- Audit du 16 novembre : le fichier installé contient toujours exactement les deux collections remaster et leurs 909 correspondances. La scène Malveillance utilise effectivement des tokens de ce module pour la Mimique et la Mandragore élite.
- Les scripts privés réutilisables sont dans `pf2-data/_AI/monster-core-complet/` : `index-pdf.py`, `extract-all.py`, `refine-headings.py`, `extract-bleed-images.py`, `build-full-mapping.py`, `install-private-art-map.py`, `generate-private-report.py`, ainsi que les scripts de contrôle visuel et les planches de revue. Une galerie privée `index.html` permet de consulter le résultat.

#### Bestiary 1, 2, 3 — extension du 16 novembre 2026

Les trois PDF français sont sous `/home/valou/services/pf2-data/Références/Règles/` : `Règles - Bestiaire 1.pdf` (362 pages), `Règles - Bestiaire 2.pdf` (322), `Règles - Bestiaire 3.pdf` (322). Les compendiums legacy présents dans cette version de PF2e comptent 491 Actors (les fiches remplacées par le remaster sont dans les packs Monster Core).

Traitement privé : `pf2-data/_AI/bestiary-legacy/`. Catalogue des IDs et des noms anglais/français issu des packs et du dictionnaire de traduction PF2-FR ; indexation des titres et statblocks des PDF, normalisation des accents et des alias, extraction du raster et de son masque de transparence, planches de revue des cas ambigus, génération de tokens WebP 512 × 512 sans cadre. Les scripts et rapports privés sont `index-pdf.py`, `match.py`, `review.py`, `approve-visual.py`, `fix-dragon-species.py`, `install.py`, `catalog.json`, `installed.json`, `coverage-summary.json`, `unmatched.json`. Les PDF et illustrations ne doivent jamais être publiés.

| Collection | Fiches associées | Total |
| --- | ---: | ---: |
| Bestiary 1 | 139 | 166 |
| Bestiary 2 | 136 | 160 |
| Bestiary 3 | 135 | 165 |
| Total legacy | 410 | 491 |

332 nouvelles illustrations PNG et leurs tokens WebP ont été installés dans le module privé existant, sous `images/bestiary1..3/` et `tokens/bestiary1..3/`. Une correspondance supplémentaire (Quatoid) réutilise l'art remaster de la même créature. Les 909 associations Monster Core restent strictement identiques à la sauvegarde `map-before-legacy.json`. Les 1 319 associations des cinq collections et tous les fichiers correspondants ont été contrôlés sur disque. Les 81 fiches legacy restantes n'ont pas d'art identifié de manière suffisamment sûre ; ne pas leur attribuer arbitrairement une image. Certaines variantes de créature partagent une illustration. La revue visuelle complémentaire des dragons a corrigé le décalage des pages (noir PDF p. 113, rouge p. 115, cuivre p. 127), récupérant 12 fiches supplémentaires.

Le client Foundry déjà ouvert peut conserver en mémoire le mappage antérieur : recharger la page (F5) pour charger les nouvelles associations natives. Le contrôle REST du 16 novembre avant rechargement montre effectivement l'ancienne image pour le compendium de Brume vampirique, tandis que les documents du monde et les tokens mis à jour utilisent les nouveaux chemins ; les trois chemins de tokens de recette répondent HTTP 200. Ne pas interrompre le relais en cours de synchronisation pour forcer un redémarrage.

Les Actors et tokens déjà importés dans les scènes sont traités séparément via `bestiary-legacy/sync-scenes.py` (argument UUID de scène ou `all`) : identifier l'origine par `_stats.compendiumSource` puis compléter les images génériques du portrait (`img`), du prototype Token et des tokens déjà placés, y compris les éventuelles surcharges génériques. Préserver les images personnalisées et les données de jeu. Sauvegardes des documents concernés sous `scene-backups/`, modifications via REST Relay avec un client MJ connecté et relecture après écriture. Le passage global des scènes est lancé, mais son état doit être confirmé dans `world-sync-progress.json` avant d'annoncer sa fin. Le script est idempotent pour les images déjà remplacées. Ne pas contourner un relais indisponible.

#### Scène de recette : Malveillance / 02 — Rez-de-chaussée

Audit du 16 novembre 2026, `Scene.Uq84XNQFWwwGtThn` : 14 tokens, dont 11 créatures/PNJ et 3 dangers.

- Deux créatures (Mimique et Mandragore élite) avaient déjà un token Monster Core.
- Bestiary 2 : **4 Actors et 7 tokens corrigés et relus via le REST Relay** (deux Brumes vampiriques, deux Étrangleurs, une Matriarche étrangleuse, deux Nécrophidieux). Les trois illustrations ont été contrôlées visuellement sur la planche privée `malevolence-review.jpg`.
- Brume vampirique : source `Compendium.pf2e.pathfinder-bestiary-2.Actor.NQ6qRvpD9DIwVxt3`, Bestiaire 2 p. 42 (page PDF 44), portrait `images/bestiary2/b2-p044-x1582.png`, token `tokens/bestiary2/b2-p044-x1582.webp`. Les deux tokens B10 utilisent bien ce chemin après contrôle.
- Bestiaire propre à Malveillance : Nosoi hanté (Ezramalkun) et Nils Kelveken restent à illustrer à partir d'une source pertinente. Les dangers ne font pas partie de ce chantier.

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

## Convention MJ — ascendance des PNJ temporaires (12 novembre 2026)

Tout **personnage temporaire de préparation sans portrait** doit avoir une **ascendance affichée**, pour que le MJ puisse choisir une image cohérente. Préciser les ascendants dont la source est sûre et indiquer clairement **« Inconnue »** ou une hypothèse de travail **« Humain (choix MJ) »** lorsqu'elle ne l'est pas. **Ne jamais déduire une ascendance certaine du seul nom.** Le bouton séparé **« Enregistrer comme PNJ permanent »** crée une fiche privée dans la base MJ, réutilisable même sans rencontre par les PJ ; il n'envoie rien automatiquement sur Discord, Foundry ou wiki. Voir [préparations de séances](../../docs/pf2/session-preparations.md).

## Convention MJ — combats adaptés et « comment le jouer » (12 novembre 2026)

**À appliquer à tous les futurs Actors PNJ/monstres préparés, en plus de la règle de nommage des tokens.** Le MJ découvre encore certaines règles : une fiche techniquement correcte **sans mode d'emploi tactique** n'est pas suffisante.

1. **Partir des vrais PJ et de leur niveau**, et vérifier le **budget d'XP PF2e pour le nombre de personnages** avant la mise en place. Ne jamais importer tels quels les niveaux de difficulté d'un scénario conçu pour un autre groupe. Distinguer clairement le **statblock original** de son **adaptation réelle en monde** ; réajuster attaques, dégâts, PV, CA, DD, capacités et danger complexe, puis revérifier le total XP. Éviter les créatures très au-dessus du groupe ; la difficulté est sensible aux écarts de niveau.
2. **Réutiliser les compendiums** en priorité. Si le bon thème de créature existe, préférer un clone identifié et **rééquilibré de manière cohérente** à un acteur générique mal adapté. Un simple texte « niveau 2 » sur un monstre niveau 7 ne réduit aucune de ses statistiques : contrôler les données mécaniques et capacités.
3. **Toutes les actions utiles doivent exister réellement dans Foundry** : attaques, dégâts, munitions, bombes, élixirs, objets équipés, aptitudes à actions/réactions, états et sauvegardes. **Pour tout lanceur de sorts**, intégrer **les sorts dans ses entrées de lancement**, avec rang, DD, attaques de sort et préparations/slots ou usages adaptés, pas seulement une liste dans la description. **Ne pas attribuer de sorts à tort aux alchimistes** : leurs bombes/élixirs relèvent des règles alchimiques et doivent être prêts à utiliser comme Items.
4. **Sur chaque Actor**, créer une courte section privée **« Comment le jouer (MJ) »** (3 à 6 lignes) : objectif/attitude, ouverture de combat ou première action caractéristique, combinaison de 1–2 capacités, déplacements/terrain, réaction lorsqu'il perd l'avantage. Écrire pour un MJ qui **ne connaît pas encore tous les dons/sorts** : faire ressortir les actions concrètes, pas un catalogue de références.
5. **Dans le journal de la salle**, rappeler en 2–4 lignes les gestes clés du combat : « Au premier tour, X fait Y ; au second tour, s'il peut, Z ; attention à l'effet de A ; ils cherchent à fuir/négocier lorsque… ». Éviter le « attaque, attaque, attaque » comme routine unique ; encourager **déplacements, couverts, contrôle, coordination et utilisation du décor**.
6. **Vérifier dans Foundry par une action réelle** qu'un Actor est jouable : ouvrir la fiche, utiliser un sort/une bombe/une aptitude, vérifier calculs, charges, consommations et macros/routines. Recontrôler l'image et la visibilité du token, les droits des notes MJ et le placement final. Sans test, garder un statut « préparé sur papier / non validé en Foundry ».

**Cas pilote actuel** : `PFS 1-00` à Quantium, désormais préparé pour **4 PJ niveau 3**. La fiche détaillée de [la Route ouverte](../campagnes/Scenario-Origines-Route-Ouverte.md) propose le rebalancement des égouts. Les statblocks originaux niveau 5–7 n'y sont **pas** acceptables tels quels. Le 12 novembre, l'accès au relais a été bloqué par les contrôles d'exécution ; ces consignes sont documentées, **pas déployées** dans le monde.

## Convention MJ — fiches immédiatement jouables (17 novembre 2026)

**Convention permanente, toutes campagnes et scénarios.** Référence validée par le MJ : [Malveillance — manoir de Blanchebois](../campagnes/Scenario-Malveillance.md), après la séance du 16 novembre. Le MJ consulte Foundry pendant l'exploration et doit pouvoir comprendre une pièce en quelques secondes. Le PDF reste disponible comme référence ; ne pas obliger le MJ à le relire ni à chercher dans le conducteur pour jouer une pièce.

### Journal de salle : deux niveaux de lecture

Conserver une page privée MJ par salle/zone pertinente, accessible par son repère de carte, avec les identifiants et liens existants. **Commencer par « En jeu — [repère] · [nom] »**, puis des rubriques courtes, en gras et en listes ; garder les seules rubriques applicables :

- **À l’arrivée :** ce que les PJ voient, entendent, sentent, sans explication cachée ; quelques éléments factuels, éventuellement une courte phrase à lire.
- **Interactions / déclenchement :** qui réagit, quand, à quelle condition, attitude, propos utiles, comportement, limites des interlocuteurs. Distinguer observation immédiate, fouille et information conditionnelle. Pour une menace : tactique, renforts, poursuite et fuite.
- **Jets / dangers :** compétence ou sauvegarde, DD précis, déclencheur, conséquences selon réussite/échec, désamorçage, réarmement, fin définitive. Distinguer niveau original et adaptation effective ; ne pas inventer de DD source.
- **Indices / informations accessibles :** ce que les PJ peuvent réellement apprendre, comment (document, dialogue, jet, vision), sujet débloqué, conséquence ou piste suivante. Ne jamais donner gratuitement tout le passé de la pièce.
- **Recherche :** sujet, compétence, DD, durée et plafond de points par source si prévu ; lien direct vers la fiche du sujet.
- **Passages et butin :** accès, portes, escaliers, secrets et DD ; objets, quantités, emplacement, lien vers coffre et Actors/dangers concernés.

Sous une séparation horizontale, placer **« Contexte MJ et détails (référence) »** : historique, descriptions longues, texte de document, détails supplémentaires, pages du PDF. Préserver le contenu utile existant lors d'une refonte sans le laisser précéder la fiche rapide. Un journal peut être long si bien structuré ; aucun remplissage ni pavé à parcourir avant les informations jouables.

### Actors : notes de jeu contextualisées

Sur chaque Actor PNJ/monstre, mettre en tête de `system.details.privateNotes` une fiche **« En jeu — [scénario] · [zone] / Comment le jouer (MJ) »** : rôle concret, déclenchement, attitude et objectif, tactique 1–2 capacités, terrain/renforts/poursuite/fuite et informations accessibles aux PJ. Ajouter **« Se souvenir »** : compétence(s), DD sourcé ou DD indicatif explicitement signalé et réponses factuelles utiles ; distinguer l'identification d'une espèce de l'identité secrète ou du passé d'un individu. Renvoyer aux actions réelles de la fiche, sans dupliquer les statblocks ni inventer des mécaniques. Pour les dangers, adapter aux champs propres.

La description publique reste courte et non spoilante ; jamais de secrets dans les notes publiques. Pour un Actor propre à la campagne, l'ancienne description générique peut être conservée en bas des notes privées, sous une section de référence ; ne pas écraser celle d'un Actor partagé. Les noms de tokens suivent la convention ci-dessous : aucun code de zone, niveau, mention technique ou secret dans leur nom affiché.

### Investigations, visions et progression

Si l'aventure comporte des recherches, rumeurs, visions, rêves, règles locales récurrentes ou indices transversaux, créer un **journal central privé MJ** : règles rapides, suivi manuel de progression, une page par sujet (sources, DD, durée, plafond, paliers, révélations et sujets débloqués). Lier chaque salle/source concernée directement à la page. Distinguer manifestations spécifiques et déclencheurs, visions facultatives, rêves et révélations de recherche ; ne pas transformer tout historique en vision automatique. Noter les indices réellement connus des joueurs sans inventer les résultats des séances précédentes. Ne pas fabriquer un sous-système artificiel si le scénario n'en comporte pas.

### Conducteur et validation

Le conducteur sert aux objectifs, rythme, introductions, PNJ, RP et transitions ; **Foundry est le support principal de l'exploration libre**, avec des journaux autosuffisants quel que soit le trajet. Ne pas imposer de chemin linéaire ni verrouiller artificiellement un accès autorisé par le scénario. Ne pas dupliquer les salles dans le conducteur. Voir [guide des préparations](../../docs/pf2/session-preparations.md).

Réviser toutes les zones du périmètre demandé, y compris les étages non encore joués. Relire les documents modifiés dans le monde actif, contrôler repères, liens, visibilité MJ, DD/source et accessibilité des fiches ; distinguer vérification documentaire/API et essai en client. En cours de campagne, préserver tokens, PV, combats, portes, progression, butin et positions ; ne pas modifier géométrie/statistiques hors demande explicite.

**Exemple : cuisine de Blanchebois (B14).** À l'arrivée : ustensiles en motifs absurdes, couteaux, squelette à la rapière. Ezramalkun, invisible, interpelle les PJ : elle se dit ancienne cuisinière, se révèle si elle a confiance. Elle sait que des oiseaux dangereux vivent au-dessus, des chiens en dessous, peut signaler une présence colérique et un accès secret ; elle ignore presque tout de la famille. Recherche par Diplomatie DD 20 ou 24 selon sujet, 10 min, maximum 3 points par sujet pour cette source. Accès et butin explicités ; histoire complète et origine de la créature en bas. C'est cette hiérarchie, pas la longueur exacte, qui doit être reprise.

## Convention MJ — explorer une carte par journaux, Actors et coffres (12 novembre 2026)

À **généraliser** depuis la méthode déjà employée dans les scènes des **Sept Fléaux de Pointesable** : une carte de donjon sert à la véritable exploration, et **le conducteur de séance reste compact**. Ne pas générer une carte tactique complète lorsqu'une loge, un bureau ou une salle d'archives fonctionne mieux en RP.

### Composition d'une scène explorée

1. **Une note de journal par salle ou zone pertinente**, positionnée sur la carte, visible **MJ uniquement**. La page décrit ce que les PJ perçoivent, les éléments interactifs, les dangers/aptitudes/DD, les créatures et le butin ; elle distingue la description à lire des secrets de l'arbitre. Réutiliser les journaux existants, corriger et déplacer leurs repères plutôt que fabriquer des doublons.
2. **Les Actors/jetons mécaniques sont placés là où ils seront rencontrés** ; réutiliser d'abord un Actor déjà présent ou une entrée de bestiaire/compendium (Monster Core, NPC Core, Bestiary, etc.), afin de récupérer sa statistique et si possible son portrait. N'inventer un Actor spécifique que si les références ne conviennent pas ; les dangers (mécaniques, moisissures, gouffres) peuvent rester des **journaux ou dangers Foundry**, sans faux monstre. Placer les créatures visibles par défaut, sauf justification narrative ou mécanique (embuscade, camouflage, invisibilité). Embarquer les sorts et objets portés effectivement dans leurs fiches, de préférence depuis les compendiums.
3. **Coffres / Actors `loot` invisibles pour les joueurs**, uniquement aux emplacements où un butin exploitable existe réellement. Propriétés par défaut **privées au MJ**, token caché et visibilité contrôlée. Renseigner l'inventaire exact d'après la source, pas un butin improvisé pour remplir la carte. Les objets de quête restent identifiés séparément du trésor commercial. Lier le token du coffre à son Actor, le verrouiller et le référencer dans la note de salle ; distinguer le butin de salle des objets portés par les adversaires.
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


### Détourage de portraits (Remove BG)

Le bouton ciseaux « Remove BG » est réservé au MJ sur les fiches Actor PF2e. L'admin MJ le propose également à la création/modification d'un PNJ et dans les blocs personnage temporaire des préparations. L'image actuelle est envoyée explicitement au service externe remove.bg, via `POST /api/pf2-mj/portraits/remove-background` (multipart `file`). La clé `REMOVE_BG_API_KEY` reste dans l'environnement du conteneur api-jdr (fichier `/home/valou/services/lsr-nestjs-deploy/.env`, jamais Git ni VITE). Voir https://www.remove.bg/api. Après ajout de la clé, recréer api-jdr avec la configuration de déploiement courante.

Le serveur vérifie le quota gratuit du compte avant chaque appel, refuse le traitement si le quota est épuisé/indisponible et impose le format PNG `size=preview` (environ 0,25 MP). Les appels sont sérialisés dans l'instance API. Sans clé, réponse explicite 503 ; pas d'appel externe. Le résultat est enregistré comme un nouvel asset WebP transparent dans `assets/l7r/portraits/pnj/`, sans écraser l'original. Pour une fiche Actor le champ `img` est modifié, pas le token ; pour un PNJ permanent, le flux de synchronisation habituel est réutilisé ; en préparation, enregistrer le portrait comme auparavant. Ne pas utiliser l'API à des fins commerciales sans vérifier les conditions du compte.
