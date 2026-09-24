# Format des packages de scénario PF2

Un ZIP est d'abord intégré dans l'application MJ, puis importé dans Foundry. L'application est la source de vérité des PNJ narratifs.

```text
package.zip
├── scenario.json
└── assets/
    ├── maps/
    └── portraits/
```

Pour les nouveaux packages produits par l'IA, utiliser **`packageFormatVersion: 4`**.

```json
{
  "packageFormatVersion": 4,
  "packageVersion": 2,
  "scenario": { "id": "pfs-s01-01", "name": "The Absalom Initiation" },
  "actors": [],
  "npcs": [],
  "maps": []
}
```

`scenario.id` est stable. `packageVersion` est la révision du contenu de ce scénario (v1, v2…). `packageFormatVersion` décrit le contrat technique ; les anciens packages sans ce champ restent lisibles en mode legacy.

## PNJ narratifs

Un PNJ narratif existant :

```json
{ "key": "amiri", "npcId": "amiri", "role": "alliée" }
```

Un nouveau PNJ :

```json
{
  "key": "captain-vara",
  "name": "Capitaine Vara",
  "portrait": "assets/portraits/captain-vara.webp",
  "roleplay": "À jouer avec une assurance chaleureuse ; devient sèche et très précise dès qu'une décision met son équipage en danger."
}
```

`roleplay` est le champ « Comment le jouer » : tempérament, attitude, réactions et éléments directement utiles au MJ. Il est distinct de `description` (qui est le PNJ) et de `notes` (notes MJ / intrigue). En l'absence d'indices suffisants, laisser vide plutôt que d'inventer.

Pour un PNJ existant, un package peut remplir `roleplay` seulement si la fiche n'en possède pas encore ; un texte déjà curaté n'est pas écrasé.

Sans `npcId`, l'application crée `<scenario.id>--<key>` et ne fusionne jamais les PNJ sur le nom seul.

## Actors Foundry

Trois types sont acceptés : `reference`, `custom`, `narrative`.

### 1. `reference` — choix prioritaire pour une créature standard

Utiliser une référence lorsque la créature existe déjà dans les compendiums PF2. Le Toolkit importe alors la vraie fiche mécanique.

```json
{
  "key": "giant-rat",
  "name": "Rat géant",
  "type": "reference",
  "lookup": "Giant Rat"
}
```

`uuid` est obligatoire pour tout nouveau package produit par le pipeline IA. Il doit correspondre exactement à une entrée de `foundry/reference-index.json`. `lookup` reste toléré par le Toolkit pour compatibilité historique, mais l'application refuse désormais un Actor `reference` IA sans UUID vérifié.

### 2. `custom` — bloc de statistiques propre au scénario

En format v4, `data.mode` est obligatoire.

#### `data.mode = "statblock"`

À utiliser **dès que le PDF donne un bloc de statistiques de créature/NPC**. Un simple niveau, ou niveau+CA+PV, n'est pas accepté.

```json
{
  "key": "hendrid-pratchett",
  "name": "Hendrid Pratchett",
  "type": "custom",
  "sourcePage": "67",
  "data": {
    "mode": "statblock",
    "level": 5,
    "ac": 24,
    "hp": 75,
    "perception": 13,
    "saves": {
      "fortitude": 12,
      "reflex": 11,
      "will": 15
    },
    "speed": 25,
    "skills": {
      "athletics": 13,
      "deception": 12
    },
    "traits": ["human", "humanoid"],
    "size": "med",
    "attacks": [
      {
        "name": "Épée",
        "bonus": 14,
        "traits": [],
        "damage": [
          { "formula": "1d8+6", "type": "slashing" }
        ]
      }
    ],
    "abilities": [
      {
        "name": "Exemple de capacité",
        "actionType": "reaction",
        "category": "defensive",
        "traits": [],
        "description": "Texte mécanique exact et utile de la capacité."
      }
    ]
  }
}
```

Les nombres ci-dessus illustrent uniquement la structure : ils doivent toujours venir du PDF ou d'une référence fiable.

Champs v4 supportés dans `data` :

- obligatoires pour `statblock` : `level`, `ac`, `hp`, `perception`, `saves.fortitude/reflex/will`, `speed`, `skills` ;
- `attacks[]` : `name`, `bonus`, `damage[].formula`, `damage[].type`, avec `traits`, `effects`, `description` facultatifs ;
- `abilities[]` : `name`, `description`, avec `actionType` (`action`, `reaction`, `free`, `passive`), `actions`, `category`, `traits`, `frequency` facultatifs ;
- facultatifs : `traits`, `size`, `rarity`, `abilityModifiers` (modificateurs Str/Dex/Con/Int/Wis/Cha), `senses`, `immunities`, `weaknesses`, `resistances`, `allSaves` ;
- `items[]` peut contenir des Item sources PF2 natifs pour un cas complexe que le schéma normalisé ne couvre pas encore (par exemple une mécanique ou un lanceur de sorts sophistiqué).

Un `statblock` doit contenir au moins une attaque, une capacité, ou un Item PF2 natif. Le validateur refuse les placeholders mécaniques.

#### `data.mode = "narrative"`

À utiliser uniquement lorsqu'aucun bloc de statistiques n'existe et que l'Actor sert de portrait/token/support narratif. Ne jamais choisir ce mode pour contourner un bloc de statistiques présent dans le PDF.

```json
{
  "key": "witness",
  "name": "Témoin",
  "type": "custom",
  "data": { "mode": "narrative" }
}
```

### 3. `narrative` — identité MJ + Actor Foundry

Un Actor narratif réutilise le PNJ de l'application via `npcId`, puis crée ou actualise son sous-Actor Foundry.

```json
{
  "key": "hendrid-pratchett",
  "name": "Hendrid Pratchett",
  "type": "narrative",
  "npcId": "npc_hendrid_pratchett",
  "actor": {
    "type": "custom",
    "data": {
      "mode": "statblock",
      "level": 5,
      "ac": 24,
      "hp": 75,
      "perception": 13,
      "saves": { "fortitude": 12, "reflex": 11, "will": 15 },
      "speed": 25,
      "skills": {},
      "attacks": [{ "name": "Épée", "bonus": 14, "damage": [{ "formula": "1d8+6", "type": "slashing" }] }]
    }
  }
}
```

Lorsqu'une version plus récente du package est synchronisée, le Toolkit peut rafraîchir la mécanique d'un Actor qu'il gère lui-même. Les Actors manuels complets ne sont pas écrasés ; la compatibilité avec les anciens imports ne reprend automatiquement que les Actors manifestement incomplets.

## Cartes et grille

En format v4, une carte carrée doit fournir une grille **mesurée**. Une simple taille arbitraire de grille n'est pas suffisante.

```json
{
  "key": "guard-post",
  "name": "Poste de garde",
  "image": "assets/maps/guard-post.webp",
  "grid": {
    "type": "square",
    "distance": 5,
    "units": "ft",
    "columns": 22,
    "rows": 17,
    "bounds": {
      "x": 18.5,
      "y": 31.0,
      "width": 1606.0,
      "height": 1241.0
    },
    "paddingCells": 1
  }
}
```

`bounds` décrit le rectangle allant de la première ligne de grille complète à la dernière :

- `columns` / `rows` = nombre de **cases complètes** ;
- `bounds.x/y` = première intersection complète dans l'image source ;
- `bounds.width/height` = étendue exacte de ces cases complètes ;
- `paddingCells` vaut **1** : le Toolkit crée une scène avec une case de marge à gauche/droite/haut/bas ;
- les portions de cases coupées aux bords de l'image restent dans cette bande extérieure ;
- les cellules mesurées doivent être carrées à 2 % près, sinon le package est refusé.

La scène Foundry est dimensionnée automatiquement à `(columns + 2) × (rows + 2)` cases et le fond est décalé afin que la première vraie intersection de grille tombe exactement après la première case de marge.

Une carte réellement sans quadrillage peut utiliser :

```json
{ "grid": { "type": "gridless", "distance": 5, "units": "ft" } }
```

Ne marque pas `gridless` une carte dont le PDF affiche clairement une grille uniquement pour éviter la mesure.
