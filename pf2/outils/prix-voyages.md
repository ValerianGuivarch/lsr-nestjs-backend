# Monde — Prix du quotidien et itinéraires

[← Outils PF2](../../OUTILS.md)

## Prix — fonctionnement

Dans l'administration MJ (/pf2-mj), **Monde → Prix** (/pf2-mj/prices) ouvre une aide de jeu en français. Le référentiel éditorial versionné (apps/web-misc/src/pf2-mj/priceCatalogue.ts) stocke les montants en pièces de cuivre entières et des fourchettes, avec unité et catégorie. Recherche instantanée sans accents (mots, synonymes), filtres par catégorie et provenance, tri, multiplication par quantité (personnes, jours, lots suivant l'unité). Aucun appel backend supplémentaire ni migration SQLite ; aucun inventaire de personnages ou de compendium n'est dupliqué.

- Officiel : valeurs des tables de prix Pathfinder 2 (Player Core / livre de règles, notamment services, équipement, animaux, coût de vie, armes et armures) avec lien vers chacune des tables de règles gratuites.
- Estimation MJ : produits/services sans tarif identifié, fourchettes de qualité ou prix par journée calculés avec une distance de référence. Ce ne sont ni des prix canoniques ni des données spécifiques à une ville. Toutes restent ajustables en jeu.
- Conversion : 1 po = 10 pa = 100 pc. Les tarifs de transport de base s'appliquent par passager pour 5 miles (~8 km), sans prestations supplémentaires. La journée type de navire suppose 60 miles, donc 72 pc/personne ; celle de caravane suppose 20 miles, donc 12 pc/personne. Les constantes partagées avec Voyages sont dans travel-rates.ts.

## Voyages — fonctionnement

**Monde → Voyages** (/pf2-mj/travels) : sélection de deux villes par nom français ou original, mode de transport, vitesse journalière ajustable, nombre de voyageurs. Affiche distance, durée, détail des étapes, prix du transport (par personne et groupe), repas et logement optionnels. Un lien ouvre le tracé dans la carte MJ, avec les mêmes paramètres. Sur https://map.l7r.fr/mj, bouton ↝ (Calculer un itinéraire), recherche des deux extrémités, mode et vitesse, tracé rouge à terre et bleu sur l'eau. Les deux interfaces utilisent le même moteur ; aucune duplication ni requête de calcul au serveur. En mode PJ ou MJ-light, le bouton n'existe pas. Le calculateur est chargé à la demande.

### Géographie et algorithme

La source est le GeoPackage du mini-PC (golarion-map-build/mapping-data/data.gpkg), du projet [pf-wikis/mapping-data](https://github.com/pf-wikis/mapping-data) / [pf-wikis/mapping](https://github.com/pf-wikis/mapping). Il contient des couches distinctes de routes, terres, eaux, forêts, montagnes, marais, déserts et glace. Le script `scripts/generate-golarion-travel-grid.py` lit ces géométries en lecture seule et génère `apps/web-golarion-map/resources/travel-grid.json`, maillage compressé RLE, versionné et livré dans les deux builds. Aucune copie du GeoPackage ni des cartes raster originales de Paizo. Le fichier dérivé est couvert par CC BY-NC-SA 4.0 ; attribution et conditions ci-dessous.

- Couverture initiale : longitude -50 à +20, latitude -5 à +68, pas de 0,1° (environ 11 km de latitude), soit 511 000 cellules. La sélection ne montre que les villes géoréférencées pouvant être raccordées à une cellule terrestre voisine (tolérance de 16 km). Les noms et coordonnées proviennent du catalogue de la carte existante.
- Routage A* pondéré par durée, distance géodésique (même convention que l'outil de mesure). Les diagonales ne traversent pas les coins de cellules interdites. Les lacs isolés ne sont pas des mers navigables. Le mode navire relie uniquement des localités côtières ; le mode mixte accepte les changements marche/navire aux cellules côtières reliées à une ville, avec 6 h par embarquement/débarquement. Les ports inférés sont des possibilités géographiques, pas des services maritimes attestés.
- Rythmes par défaut : marche 20 miles/jour (PF2, vitesse 25 pieds), cheval 32, caravane 20, calèche 20, navire 60 (hypothèses MJ sauf marche). Routes/plaine : rythme normal, terrains difficiles (forêts, collines, déserts) moitié, très difficiles (marais, montagnes, glace) tiers. Calèche : seulement route ou plaine, plus lente hors route.
- Prix par 5 miles (caravane 3 pc, calèche 2 pa, navire 6 pc), location cheval 1 pa / jour arrondi, marche sans prix de transport. Coût facultatif : 3 repas ordinaires 9 pc/jour, lit 1 pa/jour par voyageur. Les tarifs par jour et le moteur partagent les mêmes constantes dans travel-rates.ts.
- Pas de routage fluvial indépendant : une rivière dans les données n'est pas une preuve de navigabilité ou de présence de pont. Les petites îles, détroits, cols ou ponts sous la résolution du maillage peuvent être absents. Les lignes d'accès locales ville-cellule sont approximatives. Le calculateur ne suppose ni horaires, ni météo, ni disponibilité des navires ; les valeurs sont modifiables par le MJ. Si aucun trajet n'est trouvé, l'interface le dit (pas de trajet fictif).

### Régénérer et vérifier

Sur le mini-PC ou une machine disposant du GeoPackage et de Python 3 + Pillow :

```sh
python3 scripts/generate-golarion-travel-grid.py /chemin/data.gpkg apps/web-golarion-map/resources/travel-grid.json
```

Les deux applications construisent sans le GeoPackage local. Les tests Vitest couvrent les villes FR/EN, Absalom → Almas impossible à pied, Absalom → Pointesable par navire, Pointesable → Magnimar à terre, transport mixte, vitesses, liens, interface et dessin du tracé.

### Attribution cartographique

Maillage dérivé des géométries de [pf-wikis/mapping-data](https://github.com/pf-wikis/mapping-data), projet [pf-wikis/mapping](https://github.com/pf-wikis/mapping) et contributeurs (notamment John Mechalas et Oznogon), sous [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Modifications : rasterisation en classes de voyage, compression RLE. Le fichier dérivé est distribué sous la même licence ; le projet cartographique est non commercial. Les marques et droits de propriété intellectuelle de Pathfinder/Golarion appartiennent à Paizo Inc. Ce projet n'est ni publié ni approuvé par Paizo.
