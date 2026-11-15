# Monde — Prix du quotidien et itinéraires

[← Outils PF2](../../OUTILS.md)

## Prix — fonctionnement

Dans l'administration MJ (/pf2-mj), **Monde → Prix** (/pf2-mj/prices) ouvre une aide de jeu en français. Le référentiel éditorial versionné (apps/web-misc/src/pf2-mj/priceCatalogue.ts) stocke les montants en pièces de cuivre entières et des fourchettes, avec unité et catégorie. Recherche instantanée sans accents (mots, synonymes), filtres par catégorie et provenance, tri, multiplication par quantité (personnes, jours, lots suivant l'unité). Aucun appel backend supplémentaire ni migration SQLite ; aucun inventaire de personnages ou de compendium n'est dupliqué.

- Officiel : valeurs des tables de prix Pathfinder 2 (Player Core / livre de règles, notamment services, équipement, animaux, coût de vie, armes et armures) avec lien vers chacune des tables de règles gratuites.
- Estimation MJ : produits/services sans tarif identifié, fourchettes de qualité ou prix par journée calculés avec une distance de référence. Ce ne sont ni des prix canoniques ni des données spécifiques à une ville. Toutes restent ajustables en jeu.
- Conversion : 1 po = 10 pa = 100 pc. Les tarifs de transport de base s'appliquent par passager pour 5 miles (~8 km), sans prestations supplémentaires. La journée type de navire suppose 60 miles, donc 72 pc/personne ; celle de caravane suppose 20 miles, donc 12 pc/personne. Ce sont des hypothèses d'improvisation, pas des durées garanties.

## Voyages — proposition, pas encore implémentée (15/11/2026)

La carte partage déjà deux ressources utiles : catalogue de points (avec identifiants stables, coordonnées et noms traduits) et outil de mesure géodésique. Le GeoPackage source du mini-PC (golarion-map-build/mapping-data/data.gpkg) contient des couches séparées en EPSG:4326 : 405 géométries de routes, 3 146 de terres, 485 d'eaux, 1 839 de rivières, ainsi que forêts, marais, montagnes, collines, déserts, glace. Les tuiles PMTiles d'affichage amalgament en revanche la géométrie sous une couche colorée ; ne pas déduire le terrain des pixels ou de cette couleur.

Proposition : produire hors ligne à partir du GeoPackage un réseau de navigation, sans ajouter de dépendance au fichier QGIS en production.
1. Grille/maillage terrestre avec coût des terrains et routes privilégiées ; exclure mers, lacs et obstacles infranchissables. Relier les villes via leurs coordonnées et connexions géographiquement valides (pas de pont fabriqué au-dessus de l'eau).
2. Réseau maritime navigable séparé (zones d'eau, contournement des terres, liaisons portuaires identifiées et vérifiées), liaisons fluviales distinctes seulement en présence d'une navigabilité connue. Traversées entre terre et mer uniquement aux ports/bacs validés. D'abord les routes commerciales majeures de la mer Intérieure, puis extension progressive.
3. Routage A* (ou Dijkstra) par durée, avec mode à pied, cheval, caravane, calèche, navire et multimodal. Distance géodésique sur le tracé, profil de vitesse ajustable. PF2 : à vitesse 25 pieds, 20 miles/jour en terrain normal, moitié en difficile, tiers en très difficile. Les profils propres aux navires, les attentes et la sécurité sont des hypothèses explicites, pas des constantes du canon.
4. Interface Monde → Voyages : deux villes (recherche FR/EN depuis le catalogue), mode, nombre de voyageurs et vitesse personnalisable. Résultat distance, durée approximative et coût estimé par personne/groupe (réutiliser les prix du catalogue), détails par tronçon, surcoût optionnel repas/logement. Afficher raison et absence de route si le réseau est incomplet, jamais une traversée terrestre fictive.
5. Même calcul accessible dans la carte MJ via sélection des points de départ et arrivée, tracé coloré par mode. Partager le moteur et le référentiel plutôt que deux calculs divergents. Le MJ pourra consigner des passages/temps canoniques particuliers comme overrides après validation.

Avant d'implémenter : vérifier l'échelle de mesure de la carte et la topologie des routes (intersections, franchissements, ports, précision). Valider quelques trajets de référence (dans Kortos, Absalom → Pointe-Sable par mer, itinéraire terrestre varisien) et des cas impossibles. Aucune durée ou route géographique arbitraire n'est ajoutée au catalogue actuel.
