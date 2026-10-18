# donnees — documentation PF2

[← Outils](../../OUTILS.md) · [Archive intégrale](archive/RECAP-2026-09-27.md)

> Contenu repris de l'audit du 27 septembre 2026 : **historique à confronter au code et à l'état de production** avant de considérer une observation ou une anomalie comme actuelle.

## 4. État SQLite observé lors de l’audit

Base auditée : `pf2.sqlite`.

| Table / type | Nombre |
|---|---:|
| `pf2_catalogue_entity` | 291 |
| `pf2_library_asset` | 480 |
| `pf2_record` | 782 |
| `pf2_session` | 10 |
| `pf2_scenario_npc` | 129 |
| `pf2_scenario_relation` | 90 |
| `pf2_scenario_package` | 8 |
| `pf2_scenario_deployment` | 8 |
| `pf2_media` | 0 |

Répartition actuelle de `pf2_record` :

| kind | Nombre |
|---|---:|
| `pnj` | 283 |
| `lieu` | 75 |
| `region` | 56 |
| `faction` | 84 |
| `evenement` | 30 |
| `scenario` | 250 |
| `catalogue` | 1 |
| `curation` | 1 |
| `geography-config` | 1 |
| `foundry-actor-cache` | 1 |

Le pipeline de packages alimente désormais réellement les relations et peut créer des entités `scope: "scenario"` lorsque le package en a besoin. Les identités globales existantes restent prioritaires afin d’éviter les doublons.

---

---

## 5. Structure de la persistance SQLite

### 5.1 `pf2_record`

Référentiel générique pour :

- `pnj`
- `lieu`
- `region`
- `faction`
- `evenement`
- anciennes copies `scenario`
- `curation`
- configuration géographique
- cache Actors Foundry

Les entités métier peuvent avoir :

```json
{
  "scope": "global"
}
```

ou :

```json
{
  "scope": "scenario",
  "ownerScenarioId": "id-du-scenario"
}
```

Les données `scope: scenario` peuvent être masquées automatiquement si leur scénario propriétaire est écarté.

### 5.2 `pf2_catalogue_entity`

Source runtime du catalogue actuel.

Le snapshot reconstruit par l’API contient actuellement un schéma V2 :

- `entries`
- `collections`
- `sections`
- `arcs`
- `narrativeThreads`

Le frontend `catalogue.ts` transforme ensuite cette structure en vue runtime V3 :

- `Container`
- `PlayableUnit`
- `Component`
- `CatalogueDocument`

### 5.3 `pf2_library_asset`

Métadonnées des ressources physiques :

- chemin ;
- nom ;
- type (`pdf`, futur `zip`) ;
- cible ;
- langue ;
- variante ;
- complétude ;
- état d’association ;
- présence sur disque ;
- métadonnées de scan.

### 5.4 Relations scénarios

Deux tables spécialisées :

```text
pf2_scenario_npc
```

pour scénario ↔ PNJ, et :

```text
pf2_scenario_relation
```

pour scénario ↔ :

- lieu ;
- région ;
- faction ;
- événement.

À la date de l’audit, ces deux tables sont vides.

### 5.5 Packages et déploiement Foundry

```text
pf2_scenario_package
pf2_scenario_deployment
```

Le code est en place, mais les tables sont actuellement vides car aucun ZIP n’a encore été intégré.

---

---

## 7. PNJ

### 7.1 Source métier

Un PNJ narratif vit dans :

```text
pf2_record
kind = "pnj"
```

Son identifiant est stable.

Il ne faut **jamais fusionner deux PNJ uniquement parce qu’ils ont le même nom**.

### 7.2 Global ou propre à un scénario

Un PNJ peut être :

```json
{ "scope": "global" }
```

ou :

```json
{
  "scope": "scenario",
  "ownerScenarioId": "..."
}
```

Un PNJ existant et réutilisable ne doit pas être recréé comme PNJ spécifique à chaque scénario.

### 7.3 PNJ vs bestiaire / Actors mécaniques

Il faut conserver la séparation suivante :

**PNJ métier narratif**

- personnage nommé ;
- identité persistante ;
- utile dans le référentiel MJ ;
- peut être lié à plusieurs scénarios.

**Actor mécanique**

- monstre ;
- garde anonyme ;
- créature ;
- figurant mécanique ;
- statblock nécessaire à une rencontre.

Ces Actors restent dans le package Foundry et ne doivent pas devenir automatiquement des PNJ métier.

### 7.4 Situation actuelle

SQLite contient actuellement 283 PNJ et 129 liens `pf2_scenario_npc`. Les fiches scénario peuvent donc afficher les PNJ réellement reliés au scénario. Les 90 relations `pf2_scenario_relation` couvrent en parallèle lieux/régions, factions et événements.

Le principe reste : réutiliser une identité globale quand elle existe ; ne créer une identité propre au scénario que lorsqu’aucune identité fiable n’existe.

---

---

## 12. Packages de scénario

### 12.1 Principe

Le workflow prévu est :

```text
ZIP
→ intégration dans l’application MJ
→ création/réutilisation des entités métier
→ enregistrement des relations
→ stockage du ZIP intégré
→ demande de déploiement
→ Toolkit Foundry réclame le ZIP
→ import dans Foundry
→ retour de résultat
```

### 12.2 Structure minimale

```text
package.zip
├── scenario.json
└── assets/
    ├── maps/
    └── portraits/
```

Exemple minimal :

```json
{
  "packageVersion": 1,
  "scenario": {
    "id": "scenario-stable",
    "name": "Nom"
  },
  "actors": [],
  "npcs": []
}
```

### 12.3 Entités métier acceptées

Le manifeste peut contenir :

```text
npcs[]
places[]
factions[]
events[]
```

### 12.4 Réutilisation d’un PNJ existant

```json
{
  "key": "amiri",
  "npcId": "amiri",
  "role": "alliée"
}
```

Si `npcId` est fourni et n’existe pas, l’intégration échoue.

### 12.5 Création d’un nouveau PNJ

```json
{
  "key": "captain-vara",
  "name": "Capitaine Vara"
}
```

Sans `npcId`, l’API utilise l’identifiant déterministe :

```text
<scenarioId>--<key>
```

Elle ne fusionne jamais sur le nom.

Le même principe existe pour les nouveaux lieux, régions, factions et événements.

### 12.6 Actors Foundry

Trois types :

```text
reference
custom
narrative
```

- `reference` : Actor mécanique provenant d’une référence/compendium ;
- `custom` : Actor mécanique propre au scénario ;
- `narrative` : Actor rattaché à un PNJ métier via `npcId`.

Un Actor narratif reçoit :

```text
flags.pf2e-val-toolkit.npcId
```

### 12.7 Déploiement piloté

Le Toolkit GM interroge périodiquement :

```text
GET /scenario-deployments/claim
```

Une demande est :

```text
pending
→ claimed
→ success
```

ou :

```text
pending
→ claimed
→ failed
```

Le succès réel du Toolkit est ce qui marque le déploiement comme terminé. L’interface ne doit pas simuler un succès.

### 12.8 Bibliothèque de ressources réutilisables

Les contenus externes ou génériques qui servent d'inspiration sans être eux-mêmes des scénarios du catalogue vivent dans un domaine séparé.

Tables SQLite :

```text
pf2_resource
pf2_resource_file
pf2_resource_link
```

Un enregistrement `pf2_resource` contient :

- un titre français ;
- un `nom_vo` conservant le titre original ;
- une description courte ;
- un résumé détaillé (MJ, secrets compris) ;
- une origine libre, par exemple `Trilemma` ;
- des tags libres.

Les fichiers lourds ne sont pas versionnés dans Git. Plusieurs PDF peuvent appartenir à la même ressource et sont stockés sous :

```text
storage/pf2-resources/<resource-id>/
```

Cela permet notamment de conserver ensemble original, traduction et variantes documentaires.

Une ressource peut être rattachée sans devenir membre du catalogue à :

```text
campaign
scenario
component
```

Pour un composant jouable, la cible est le couple `target_id + component_id` afin que deux scénarios puissent utiliser le même identifiant local de composant sans collision.

API principale :

```text
GET    /api/pf2-mj/resources
POST   /api/pf2-mj/resources
GET    /api/pf2-mj/resources/export
GET    /api/pf2-mj/resources/:id
PUT    /api/pf2-mj/resources/:id
DELETE /api/pf2-mj/resources/:id
POST   /api/pf2-mj/resources/:id/files
GET    /api/pf2-mj/resources/:id/files/:fileId
DELETE /api/pf2-mj/resources/:id/files/:fileId
```

L'export JSON contient toutes les métadonnées, titre français, `nom_vo`, tags, rattachements et références de fichiers ; il est conçu pour pouvoir être fourni à une IA afin de rechercher rapidement les ressources adaptées à une situation de jeu.

### 12.9 Situation actuelle

Au 27 septembre 2026 :

```text
pf2_scenario_package : 8
pf2_scenario_deployment : 8
```

Les huit déploiements enregistrés ont réussi. Ils couvrent les six aventures d’Agents of Edgewatch, `pfs-season-1-1-01` et `extinction-curse-volume-1`.

Le Toolkit importe réellement Actors, Scenes, Journals et assets, puis renvoie son résultat à l’application. L’interface distingue désormais ce contenu géré du contenu de scènes déjà présent dans le monde Foundry hors dossiers Toolkit ; un scénario peut donc être détecté comme préexistant, généré ou hybride.

---
