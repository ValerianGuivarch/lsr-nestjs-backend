# Format des packages de scénario PF2

Un ZIP est d'abord intégré dans l'application MJ, puis importé dans Foundry. L'application est la source de vérité des PNJ narratifs.

```text
package.zip
├── scenario.json
└── assets/
    ├── maps/
    └── portraits/
```

```json
{
  "packageVersion": 1,
  "scenario": { "id": "pfs-s01-01", "name": "The Absalom Initiation" },
  "actors": [],
  "npcs": []
}
```

`scenario.id` est stable ; `packageVersion` est un entier positif et vaut 1 pour les packages historiques. Trois types d'Actors sont acceptés : `reference`, `custom`, et `narrative`.

Un PNJ narratif existant :

```json
{ "key": "amiri", "npcId": "amiri", "role": "alliée" }
```

Un nouveau PNJ :

```json
{ "key": "captain-vara", "name": "Capitaine Vara", "portrait": "assets/portraits/captain-vara.webp" }
```

Sans `npcId`, l'application crée `<scenario.id>--<key>` et ne fusionne jamais les PNJ sur le nom seul. Obtenir les identifiants existants : `GET /api/pf2-mj/npc-registry`.

Un Actor narratif réutilise l'Actor ayant `flags.pf2e-val-toolkit.npcId` correspondant ; sinon son sous-Actor `reference` ou `custom` est créé puis ce flag est posé.

```json
{
  "key": "amiri",
  "name": "Amiri",
  "type": "narrative",
  "npcId": "amiri",
  "actor": { "type": "reference", "uuid": "Compendium.pf2e...Actor..." }
}
```

Les maps acceptent `image`, `width`, `height`, le format historique `grid.size` / `grid.distance`, et le format mesuré `grid.columns`, `grid.rows`, `grid.bounds.{x,y,width,height}`. Tous les champs mesurés deviennent obligatoires dès que l'un d'eux est présent.
