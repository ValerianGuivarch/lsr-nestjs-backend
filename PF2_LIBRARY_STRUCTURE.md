# Structure cible de la bibliothèque PF2

La structure devient **centrée sur l’œuvre / l’unité jouable**, et non sur le type global de fichier. Les cartes et guides ne sont donc plus regroupés loin du contenu qu’ils accompagnent.

```text
pf2-data/
├── Campagnes/
│   ├── Campagnes longues/
│   │   └── Age of Ashes/
│   │       ├── Documents/
│   │       ├── Guides joueurs/
│   │       ├── Infos/
│   │       ├── Foundry/
│   │       └── Episodes/
│   │           └── 03 - Brûlons demain/
│   │               ├── Documents/
│   │               ├── Cartes/
│   │               └── Foundry/
│   ├── Aventures autonomes/
│   ├── Communauté/
│   └── Pathfinder Society/
│       ├── Saisons/
│       ├── Quests/
│       ├── Bounties/
│       └── Legacy/
└── Références/
    ├── Règles/
    └── Univers/
```

## ZIP Foundry

Le scanner parcourt récursivement toute la racine `PF2_LIBRARY_ROOT`. Le dossier du ZIP n’est donc pas imposé techniquement. **Le nom du ZIP est important pour l’association automatique.**

- Campagne : `.../<Campagne>/Foundry/<Titre original de campagne> - Foundry.zip` ; il est associé à la campagne et couvre ses épisodes.
- Épisode seulement : `.../<Campagne>/Episodes/<épisode>/Foundry/<Titre épisode> - Foundry.zip`.
- PFS / Quest / Bounty / aventure autonome : `.../<unité>/Foundry/<numéro + titre> - Foundry.zip`.

Ne nomme pas simplement le fichier `resources.zip` : le scanner aurait trop peu d’information pour l’associer avec certitude.
