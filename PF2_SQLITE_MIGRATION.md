# Migration PF2-MJ vers SQLite comme source de vérité

## Cible

- `pf2.sqlite` contient les données métier vivantes : catalogue, campagnes/scénarios, PNJ, lieux, régions, factions, événements, curation, relations et métadonnées de bibliothèque.
- `PF2_LIBRARY_ROOT` (`../pf2-data` sur le minipc) reste la source de vérité des fichiers physiques : PDF, ZIP, cartes et autres ressources lourdes.
- les JSON historiques déplacés dans `apps/web-misc/src/pf2-mj/data/old/` ne sont plus lus par le frontend ; ils servent uniquement au premier bootstrap/migration et au retour arrière contrôlé.
- les JSON de travail doivent désormais être produits par l'API d'export puis réimportés après validation.

## Migrations SQLite ajoutées

`008-catalogue-and-library-assets` ajoute :

- `pf2_catalogue_entity` : sections, collections, entrées/campagnes/scénarios, arcs et fils narratifs ;
- `pf2_library_asset` : métadonnées des PDF et ZIP, association, langue/variante, présence et date de scan.

La première initialisation de ces tables importe sans perte `data/old/catalogue-pf2.json`.

La migration conserve les données SQLite existantes : les référentiels historiques ne remplacent jamais un ID déjà présent. Les IDs présents dans les anciens seeds mais absents de SQLite sont ajoutés une fois afin de combler les écarts de migration.

## Vérifications attendues avec les données fournies

Le catalogue archivé contient actuellement :

- 250 entrées ;
- 14 collections ;
- 377 fichiers ;
- 5 sections ;
- 11 arcs ;
- 10 fils narratifs.

Les seeds contiennent notamment 145 PNJ, 60 factions, 81 lieux, 55 régions et 25 événements. La DB du minipc observée avant migration avait 244 scénarios et 54 régions : la réconciliation additive doit donc au minimum combler ces écarts sans écraser les records déjà modifiés.

## API

Lecture runtime :

- `GET /api/pf2-mj/catalogue`
- `GET /api/pf2-mj/geography`

Échange JSON :

- `GET /api/pf2-mj/data-export/geography`
- `GET /api/pf2-mj/data-export/catalogue`
- `GET /api/pf2-mj/data-export/catalogue?id=<id>`
- `GET /api/pf2-mj/data-export/pnj`
- idem pour `factions`, `lieux`, `regions`, `evenements`, `curation`
- `POST /api/pf2-mj/data-import/<domain>?dryRun=true` pour valider sans écrire ;
- `POST /api/pf2-mj/data-import/<domain>` pour appliquer dans une transaction de persistance.

Le frontend propose aussi l'export/import Géographie et Catalogue depuis l'écran de réglages.

## CLI d'échange

```bash
node scripts/pf2-data-transfer.mjs export geography exports/pf2/geography.json
node scripts/pf2-data-transfer.mjs export catalogue exports/pf2/catalogue.json
node scripts/pf2-data-transfer.mjs export catalogue exports/pf2/pfs-saison-1.json pfs-season-1
node scripts/pf2-data-transfer.mjs import geography exports/pf2/geography.json --dry-run
node scripts/pf2-data-transfer.mjs import geography exports/pf2/geography.json
```

La variable `PF2_API_URL` permet de changer la base URL, par exemple :

```bash
PF2_API_URL=http://localhost:3333/api/pf2-mj node scripts/pf2-data-transfer.mjs export geography /tmp/geography.json
```

## Scanner de bibliothèque

`scanLibrary()` ne modifie plus `catalogue-pf2.json`.

Il :

1. parcourt `PF2_LIBRARY_ROOT` ;
2. rapproche PDF et ZIP des cibles du catalogue SQLite ;
3. détecte les déplacements de PDF ;
4. détecte les fichiers de traduction (`trad`, `traduction`, `translated`, `vf`) et tente de retrouver leur original ;
5. sur `apply=true`, persiste les nouveaux PDF/associations dans le catalogue SQLite et l'inventaire ZIP dans `pf2_library_asset`.

## Déploiement recommandé

Avant copie :

```bash
cd ~/services/lsr-nestjs-backend
cp pf2.sqlite "pf2.sqlite.backup-$(date +%Y%m%d-%H%M%S)"
cp -a apps/web-misc/src/pf2-mj/data "tmp/pf2-mj-data-backup-$(date +%Y%m%d-%H%M%S)"
```

Après copie des fichiers modifiés, lancer les tests/builds habituels puis redémarrer l'API. `onModuleInit()` applique automatiquement la migration.

Vérification SQL :

```bash
sqlite3 pf2.sqlite <<'SQL'
SELECT id FROM pf2_schema_migration ORDER BY id;
SELECT entity_kind, COUNT(*) FROM pf2_catalogue_entity GROUP BY entity_kind ORDER BY entity_kind;
SELECT asset_type, COUNT(*) FROM pf2_library_asset GROUP BY asset_type ORDER BY asset_type;
SELECT kind, COUNT(*) FROM pf2_record GROUP BY kind ORDER BY kind;
SQL
```

Puis vérifier :

```bash
curl -s http://localhost:3333/api/pf2-mj/catalogue | jq '.entries|length, .collections|length, .files|length'
curl -s http://localhost:3333/api/pf2-mj/geography | jq '.lieux|length, .regions|length'
```
