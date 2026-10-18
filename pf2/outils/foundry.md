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

