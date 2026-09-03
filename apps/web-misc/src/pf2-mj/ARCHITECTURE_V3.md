# PF2 MJ — architecture catalogue V3

## Principe

Le runtime V3 normalise une vue de catalogue stockée dans `pf2.sqlite`. Le JSON V2 historique est conservé dans `data/old/` uniquement comme archive/seed de migration :

- `Container` : campagne, série, collection, saison PFS ; jamais proposé dans « Trouver une partie ».
- `PlayableUnit` : seule entité jouable et filtrable.
- `Component` : guide joueur, compilation, carte, ressource, information externe…
- `CatalogueDocument` : fichier PDF physique, relié à une entité.
- `ResourceBundle` : archive `.zip` de ressources Foundry, directe ou héritée d’un conteneur.

`catalogue.ts` est actuellement l’adaptateur V2 → V3. Il permet de migrer progressivement `catalogue-pf2.json` sans perdre les ids ou associations existantes.

## Migration automatique actuelle

- toutes les entrées non `campaign` restent des unités jouables ;
- une entrée `campaign` devient un conteneur ;
- dans une campagne, les parts `volume_aventure`, `aventure_autonome`, `one_shot` et `aventure_communautaire` deviennent des unités jouables ;
- les autres parts deviennent des composants ;
- les ids de parts sont conservés ;
- les documents gardent leur `fileId` et leur association ;
- les niveaux de campagne ne sont pas hérités automatiquement par les épisodes ;
- les lieux de campagne sont hérités par les épisodes avec provenance explicite ;
- les saisons PFS gardent leurs lieux/niveaux agrégés uniquement pour leur page de synthèse.

Sur le catalogue fourni :

- 42 conteneurs sont produits (14 collections + 28 campagnes) ;
- 283 unités jouables sont produites (216 entrées existantes + 67 épisodes issus des parts) ;
- 44 composants non jouables sont produits ;
- 294 documents physiques sont conservés ;
- 10 campagnes n’ont pas encore de découpage jouable explicite ;
- 66 des 67 épisodes migrés n’ont pas encore leurs niveaux propres dans le V2 et sont donc marqués « à revoir » plutôt que de recevoir une valeur inventée.

## PDF « info »

Un PDF dont le nom contient un marqueur `info` / `information`, par exemple :

`PFS 3-05 - Titre (info).pdf`

est classé comme `informationFallback`.

Il donne l’état `Info seule` si le scénario complet n’est pas disponible. Cet état est volontairement distinct de `Complet`, `Partiel` et `Absent`.

## ZIP ressources Foundry

Les ZIP sont séparés des PDF. Le schéma runtime est produit par le scan de `PF2_LIBRARY_ROOT` et les ZIP appliqués sont persistés dans `pf2_library_asset`. `data/old/resource-bundles.json` n'est plus une source runtime.

Exemple campagne :

```json
{
  "id": "zip-age-of-ashes-resources",
  "filename": "Campagne - L'Âge des Cendres (ressources).zip",
  "path": "Campagnes/Campagne - L'Âge des Cendres (ressources).zip",
  "targetId": "age-of-ashes",
  "scope": "descendants",
  "presence": "present",
  "associationStatus": "confirmed",
  "contents": ["maps", "actors", "tokens"]
}
```

Avec `scope: "descendants"`, ce ZIP est considéré disponible pour tous les épisodes de la campagne.

Exemple scénario :

```json
{
  "id": "zip-pfs-1-01-resources",
  "filename": "PFS 1-01 (ressources).zip",
  "path": "PFS/PFS 1-01 (ressources).zip",
  "targetId": "pfs-season-1-1-01",
  "scope": "exact",
  "presence": "present",
  "associationStatus": "confirmed"
}
```

## Disponibilité

Elle est calculée séparément :

- original ;
- FR officiel ;
- traduction ;
- complétude des documents requis ;
- ressources facultatives ;
- état `Info seule` ;
- ZIP Foundry.

Une carte ou un guide facultatif ne rend jamais une unité incomplète.

## Curation

La cible est une map unique :

```json
{
  "byId": {
    "pfs-season-1-1-01": {
      "excluded": false,
      "playability": "Prêt",
      "progress": "À jouer",
      "levelsOverride": "1–4",
      "placesOverride": ["Absalom"]
    }
  }
}
```

Le frontend V3 lit déjà `byId`, puis `entries`, puis les anciennes maps `...ByCampaign` / `...ByScenario`.

## Navigation

- **Trouver une partie** : uniquement `PlayableUnit`.
- **Bibliothèque** : conteneurs + unités + composants.
- **À préparer** : onglets PDF requis, traductions, ZIP Foundry, info seules, associations incertaines, métadonnées.
- **Ressources PDF** : inventaire physique.
- **Chronologie**.
- **Écartés / archive**.

## Inventaire local runtime

Au chargement de PF2 MJ, l'UI charge d'abord le catalogue et la géographie depuis SQLite, puis lance un scan léger via `/api/pf2-mj/local-scan`. Le scan passif sert de couche runtime :

- les chemins PDF réellement présents empêchent un fichier supprimé du disque de rester compté comme disponible ;
- les nouveaux PDF `(info)` dont l'association est identifiable sont ajoutés temporairement comme documents d'information ;
- l'inventaire ZIP est calculé depuis `pf2-data` ; lors d'un scan appliqué, il est persisté dans `pf2_library_asset` ;
- une association ZIP `review` produit l'état `ZIP à vérifier`, jamais `ZIP disponible`.

Le bouton « Scanner PDF & ZIP » relance le même inventaire et affiche les ajouts, suppressions, PDF info et ZIP à vérifier.

Le scan passif n'écrit rien. Depuis l'UI, « Appliquer ce scan dans SQLite » appelle le même endpoint avec `apply=true` : les déplacements et nouveaux PDF sont alors intégrés au catalogue SQLite, et les ZIP sont enregistrés dans `pf2_library_asset`. Aucun fichier JSON canonique n'est réécrit.
