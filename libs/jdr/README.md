# `jdr` lib — architecture

The `jdr` library is organized as a single NestJS module (`JdrModule`) with a hexagonal
(ports & adapters) layering **flattened at the top level of the lib**, split by data type
("slice"). There is no module-per-slice, no `forwardRef`, and no separate `backend/` folder —
everything lives under exactly three top-level folders: `domain/`, `app/`, `data/`.

## The three layers

```
libs/jdr/src/lib/
  domain/<slice>/          <- the hexagon's core: framework-agnostic
    <Entity>.ts             entity (plain class/interface, no NestJS/TypeORM)
    <Entity>Service.ts       business logic, injects the port via DI token
    ports/I<Entity>Provider.ts   port interface (driven port), owned by domain

  app/<slice>/             <- entry point (driving adapter)
    <Entity>Controller.ts    HTTP controller for that data type
    dto/<Entity>Dto.ts        response DTO, `implements <Entity>`
    dto/<Entity>Requests.ts   request DTOs (class-validator decorated)

  data/<slice>/            <- persistence (driven adapter)
    database/DB<Entity>.ts   TypeORM entity (columns/relations only, no mapping logic)
    <Entity>Mapper.ts         DB row  -> domain entity conversion
    <Entity>Provider.ts       implements I<Entity>Provider using the repo + mapper

  jdr.module.ts            <- single composition root: wires every slice together
```

A slice's three folders never know about each other's _internals_ — `app` depends on
`domain` (service + entity types), `data` depends on `domain` (port + entity types), and
`domain` depends on nothing NestJS/TypeORM-specific. Only `jdr.module.ts` wires the concrete
`data` provider to the `domain` port via a DI token (e.g. `'ITraitProvider' -> TraitProvider`).

## Slices

| Slice        | Entity                                                                 | Notes                                                                                                                                          |
| ------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `jdr`        | `Jdr` (root aggregate)                                                 | Only owns root CRUD (`findAll`, `findOneBySlug`, `create`, `update`, `delete`). Composes the full `Jdr` by calling every other slice's mapper. |
| `traits`     | `Trait`                                                                | Pilot slice — `Trait`/`TraitType` are plain interfaces (not classes).                                                                          |
| `stats`      | `Stat`                                                                 |                                                                                                                                                |
| `resources`  | `Resource`, `CharacterResource`, `GroupResource`                       | JdR definitions are copied to every new owner; owners may also have local resources.                                                           |
| `items`      | `Item`, `OwnedItem` (group-owned)                                      |                                                                                                                                                |
| `classes`    | `JdrClass`                                                             | Character classification only; resources are independent from classes.                                                                         |
| `groups`     | `JdrGroup` (+ nested `GroupResource`)                                  |                                                                                                                                                |
| `characters` | `Character` (+ nested `CharacterStat`/`CharacterResource`/owned items) | Most complex slice: seeds stats/resources on creation, owns all character-scoped link tables.                                                  |
| `players`    | `Player`                                                               | A player belongs to one JdR and may own several characters.                                                                                    |
| `rolls`      | `DiceRoll`                                                             | Needs the fully composed `Jdr` (via `JdrMapper`) to compute final stat values before rolling.                                                  |

## Complete JSON import

`POST /api/v1/jdr/import` accepts a versioned document (`{ "version": 1, "jdr": { ... } }`)
containing a complete aggregate: stats, resources, named class levels, groups, players, traits,
items and characters with all their links. The import is atomic and only creates a new JdR; an
existing slug is rejected rather than overwritten. Missing character stats are initialized to
`2`, and missing character/group resources are copied from their JdR definitions.

The React Admin application exposes this endpoint through the **Import JSON** page. A complete
example is available in `support/hp-jdr-import.json`.

## Why every mutation still returns the full `Jdr`

The frontend (`apps/web-jdr`) expects every mutation endpoint (add a trait, update a stat, ...)
to respond with the **entire recomposed `JdrDto`**, not just the mutated entity. Rather than
making every slice's provider reconstruct the whole aggregate, each slice keeps that
responsibility at the **controller** level:

```mermaid
sequenceDiagram
    participant FE as apps/web-jdr
    participant TC as TraitController
    participant TS as TraitService
    participant TP as TraitProvider (data)
    participant DB as SQLite (jdr-sqlite)
    participant JS as JdrService
    participant JP as JdrImplementation (data)

    FE->>TC: POST /jdr/:jdrSlug/traits
    TC->>TS: add(jdrSlug, body)
    TS->>TP: add(jdrSlug, body)
    TP->>DB: insert DBJdrTrait (+ modifiers)
    DB-->>TP: saved row
    TP-->>TS: Trait (via TraitMapper)
    TS-->>TC: Trait
    TC->>JS: findOneBySlug(jdrSlug)
    JS->>JP: findOneBySlug(jdrSlug)
    JP->>DB: load full Jdr aggregate (all relations)
    DB-->>JP: DBJdr
    JP-->>JS: Jdr (via JdrMapper, composes every slice's mapper)
    JS-->>TC: Jdr
    TC-->>FE: JdrDto.from(jdr)
```

Every other slice's controller (`StatController`, `ResourceController`, `ItemController`,
`ClassController`, `GroupController`, `CharacterController`) follows the exact same pattern.
`RollController` is the one exception: dice rolls return their own `DiceRollDto`, not the full
`JdrDto`, matching the pre-existing API contract.

## Module composition

```mermaid
graph TD
    subgraph JdrModule["JdrModule (single module)"]
        JC[JdrController] --> JS[JdrService]
        TC[TraitController] --> TS[TraitService]
        SC[StatController] --> SS[StatService]
        RC[ResourceController] --> RS[ResourceService]
        IC[ItemController] --> IS[ItemService]
        CC[ClassController] --> CS[ClassService]
        GC[GroupController] --> GS[GroupService]
        ChC[CharacterController] --> ChS[CharacterService]
        RoC[RollController] --> RoS[RollService]

        JS -.DI token IJdrProvider.-> JP[JdrImplementation]
        TS -.DI token ITraitProvider.-> TP[TraitProvider]
        SS -.DI token IStatProvider.-> SP[StatProvider]
        RS -.DI token IResourceProvider.-> RP[ResourceProvider]
        IS -.DI token IItemProvider.-> IP[ItemProvider]
        CS -.DI token IClassProvider.-> CP[ClassProvider]
        GS -.DI token IGroupProvider.-> GP[GroupProvider]
        ChS -.DI token ICharacterProvider.-> ChP[CharacterProvider]
        RoS -.DI token IRollProvider.-> RoP[RollProvider]
    end

    JP & TP & SP & RP & IP & CP & GP & ChP & RoP --> SqliteModule[JdrSqliteModule<br/>data/database/jdr-sqlite.module.ts]
    SqliteModule --> SQLite[(jdr-sqlite<br/>SQLite connection)]
```

There is a single `JdrModule` (`libs/jdr/src/lib/jdr.module.ts`). It imports one shared
`JdrSqliteModule` (registers every `DB*` entity across all slices on the same TypeORM
connection) and registers all 9 controllers/services/providers directly — no per-slice Nest
modules, so there's nothing to `forwardRef`.

`apps/api-jdr/src/main.ts` and `src/main/app-unified.module.ts` both import `JdrModule`
straight from the `jdr` package.

## Database schema

All tables live on the same SQLite connection (`jdr-sqlite`, registered once by
`data/database/jdr-sqlite.module.ts`). `jdr_*` is the root aggregate; every other table is
scoped to it via a `jdrSlug` column that's part of its composite primary key.

Most catalog links are composite foreign keys (`jdrSlug` + entity slug) and are enforced by
SQLite. Character and group resources are the exception: they may be local to their owner, so
their `resourceSlug` is intentionally not required to reference a JdR-level definition.

```mermaid
erDiagram
    JDR ||--o{ STAT : "real FK"
    JDR ||--o{ TRAIT : "real FK"
    JDR ||--o{ RESOURCE : "real FK"
    JDR ||--o{ ITEM : "real FK"
    JDR ||--o{ GROUP_ITEM : "real FK"
    JDR ||--o{ CHARACTER : "real FK"
    JDR ||--o{ PLAYER : "real FK"
    JDR ||--o{ JDR_CLASS : "real FK"
    JDR ||--o{ GROUP : "real FK"
    JDR ||--o{ DICE_ROLL : "jdrSlug column, no FK"

    TRAIT ||--o{ TRAIT_MODIFIER : "real FK"

    RESOURCE ||--o{ CHARACTER_RESOURCE : "copied default or local resource"
    RESOURCE ||--o{ GROUP_RESOURCE : "copied default or local resource"

    ITEM ||--o{ ITEM_MODIFIER : "real FK"
    ITEM ||--o| GROUP_ITEM : "real FK (1:1, group inventory qty)"
    ITEM ||--o{ CHARACTER_ITEM : "composite FK"

    JDR_CLASS ||--o{ CHARACTER : "composite FK; provider clears before delete"
    PLAYER ||--o{ CHARACTER : "composite FK; nullable owner"

    GROUP ||--o{ CHARACTER_GROUP : "composite FK (M:N w/ CHARACTER)"
    GROUP ||--o{ GROUP_RESOURCE : "real FK"

    STAT ||--o{ CHARACTER_STAT : "composite FK (M:N w/ CHARACTER)"

    TRAIT ||--o{ CHARACTER_TRAIT : "composite FK (M:N w/ CHARACTER)"

    CHARACTER ||--o{ CHARACTER_STAT : "real FK"
    CHARACTER ||--o{ CHARACTER_TRAIT : "real FK"
    CHARACTER ||--o{ CHARACTER_ITEM : "real FK"
    CHARACTER ||--o{ CHARACTER_RESOURCE : "real FK"
    CHARACTER ||--o{ CHARACTER_GROUP : "real FK"

    JDR {
        varchar slug PK
        varchar name
        varchar text
    }
    STAT {
        varchar jdrSlug PK "FK -> JDR"
        varchar slug PK
        varchar name
    }
    TRAIT {
        varchar jdrSlug PK "FK -> JDR"
        varchar slug PK
        varchar name
        varchar type
        int level
        json data
    }
    TRAIT_MODIFIER {
        varchar jdrSlug PK "FK -> JDR"
        varchar traitSlug PK "FK -> TRAIT"
        varchar statSlug PK "FK -> STAT"
        int value
    }
    RESOURCE {
        varchar jdrSlug PK "FK -> JDR"
        varchar slug PK
        varchar name
        varchar ownerType "CHARACTER | GROUP"
        int defaultValue
    }
    GROUP_RESOURCE {
        varchar jdrSlug PK
        varchar groupSlug PK "FK -> GROUP"
        varchar resourceSlug PK "definition slug or local slug"
        varchar name
        int value
    }
    ITEM {
        varchar jdrSlug PK "FK -> JDR"
        varchar slug PK
        varchar name
        varchar description
        boolean unique
    }
    ITEM_MODIFIER {
        varchar jdrSlug PK "FK -> JDR"
        varchar itemSlug PK "FK -> ITEM"
        varchar statSlug PK "FK -> STAT"
        int value
    }
    GROUP_ITEM {
        varchar jdrSlug PK "FK -> JDR"
        varchar itemSlug PK "FK -> ITEM"
        int quantity
    }
    JDR_CLASS {
        varchar jdrSlug PK "FK -> JDR"
        varchar slug PK
        varchar name
        varchar text
        json levels
    }
    PLAYER {
        varchar jdrSlug PK "FK -> JDR"
        varchar slug PK
        varchar name
    }
    GROUP {
        varchar jdrSlug PK "FK -> JDR"
        varchar slug PK
        varchar name
        varchar text
    }
    CHARACTER {
        varchar jdrSlug PK "FK -> JDR"
        varchar slug PK
        varchar name
        varchar playerSlug "nullable, FK -> PLAYER"
        varchar classSlug "nullable, FK -> JDR_CLASS"
        varchar classLevel "nullable named level"
        boolean isPlayable
        varchar text
    }
    CHARACTER_STAT {
        varchar jdrSlug PK "FK -> JDR"
        varchar characterSlug PK "FK -> CHARACTER"
        varchar statSlug PK "FK -> STAT"
        int value
    }
    CHARACTER_TRAIT {
        varchar jdrSlug PK "FK -> JDR"
        varchar characterSlug PK "FK -> CHARACTER"
        varchar traitSlug PK "FK -> TRAIT"
    }
    CHARACTER_ITEM {
        varchar jdrSlug PK "FK -> JDR"
        varchar characterSlug PK "FK -> CHARACTER"
        varchar itemSlug PK "FK -> ITEM"
        int quantity
    }
    CHARACTER_RESOURCE {
        varchar jdrSlug PK "FK -> JDR"
        varchar characterSlug PK "FK -> CHARACTER"
        varchar resourceSlug PK "definition slug or local slug"
        varchar name
        int value
    }
    CHARACTER_GROUP {
        varchar jdrSlug PK "FK -> JDR"
        varchar characterSlug PK "FK -> CHARACTER"
        varchar groupSlug PK "FK -> GROUP"
    }
    DICE_ROLL {
        uuid id PK
        varchar jdrSlug "no FK"
        varchar characterSlug "snapshot, no FK"
        varchar characterName "denormalized snapshot"
        varchar statSlug "snapshot, no FK"
        varchar statName "denormalized snapshot"
        int statValue "computed final value at roll time"
        varchar rollState "normal | advantage | disadvantage | double_advantage"
        boolean isArbitrary
        varchar formula "e.g. 2d6, arbitrary rolls only"
        simple-array results
        varchar text
        datetime createdDate
    }
```

Notable design points:

- **Catalog links are real foreign keys** for stats, traits, items, classes and groups.
- **Resources are owned values**: a JdR definition supplies a name, owner type and default
  value. It is copied to each matching character or group. Additional local resources are
  allowed, which is why owned-resource slugs are not mandatory foreign keys.
- **`CHARACTER.classSlug`** is nullable; class deletion clears references before deleting the class.
- **`DICE_ROLL`** denormalizes `characterName`/`statName` at roll time (a historical roll log
  should still read correctly even if the character/stat is later renamed or deleted) — it's
  intentionally not a live join.

## Conventions recap

- **Entities** live in `domain/<slice>/`. Only `Trait`/`TraitType` are pure interfaces so far
  (pilot slice); the rest (`Stat`, `Resource`, `Item`, `JdrClass`, `JdrGroup`, `Character`,
  `DiceRoll`, ...) are still classes with constructor-time validation (`Slug.assertValid`,
  `Guards`). Converting them to plain interfaces is tracked as follow-up work, not done in this
  pass to limit risk/scope.
- **Ports** (`I<Entity>Provider`) are interfaces in `domain/<slice>/ports/`, owned by the
  domain layer (dependency inversion — the data layer implements them, not the other way
  around).
- **DTOs** in `app/<slice>/dto/` are concrete classes that `implements` the domain entity
  shape and carry `class-validator`/Swagger decorators; they're what controllers actually
  accept/return.
- **Mappers** (`<Entity>Mapper.ts`) live in `data/<slice>/` as dedicated classes — DB entity
  classes (`DB<Entity>.ts`) only declare TypeORM columns/relations, they no longer carry
  `static toXxx()` conversion methods.
- Cross-cutting utilities (`Slug`, `Guards`, `JdrError`) live in `domain/shared/`, not inside
  any one slice.

## Récap

Vue textuelle de la structure des données, en partant de la racine `Jdr` :

- **`Jdr`** (aggrégat racine, identifié par son `slug`)
  - possède des **`Stat`** (les caractéristiques disponibles, ex. Force, Agilité)
  - possède des **`Trait`** (chacun avec ses **`TraitModifier`**, qui appliquent un bonus/malus à une `Stat`)
  - possède des définitions de **`Resource`** pour les personnages ou pour les groupes, avec une valeur par défaut
  - possède des **`Item`** (chacun avec ses **`ItemModifier`**, comme les traits)
    - un `Item` peut avoir un **`OwnedItem`** au niveau du groupe (quantité en inventaire commun)
  - possède des **`JdrClass`** (classes de personnage, indépendantes des ressources)
  - possède des **`JdrGroup`** (groupes de personnages), chacun avec ses propres valeurs de ressources
  - possède des **`Character`** (personnages), chacun :
    - peut appartenir à une **`JdrClass`** (référence souple par `classSlug`, optionnelle)
    - a ses propres valeurs de `Stat` (via `CharacterStat`)
    - a ses propres `Trait` (via `CharacterTrait`)
    - a ses propres `Item` en inventaire (via `CharacterItem`, avec quantité)
    - reçoit les ressources personnage du JdR à sa création et peut avoir des ressources locales supplémentaires
    - appartient à un ou plusieurs `JdrGroup` (via `CharacterGroup`)
  - conserve un historique de **`DiceRoll`** (jets de dés), chacun figeant un instantané
    (nom du personnage, nom de la stat, valeur finale calculée) au moment du jet

En résumé : tout est rattaché au `Jdr`, les entités "catalogue" (`Stat`, `Trait`, `Resource`,
`Item`, `JdrClass`, `JdrGroup`) définissent les règles du jeu, et le `Character` vient piocher
dans ce catalogue pour construire son état propre (stats, traits, items, ressources, groupes).
