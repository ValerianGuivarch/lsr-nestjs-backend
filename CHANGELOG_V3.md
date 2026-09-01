# PF2 MJ V3 — changements livrés

- Modèle `Container / PlayableUnit / Component / Document / ResourceBundle`.
- Recherche « Trouver une partie » limitée aux unités jouables.
- Campagnes longues transformées en conteneurs ; épisodes jouables issus des parts quand leur type le permet.
- Niveaux structurés avec provenance et sans héritage automatique depuis une campagne globale.
- Lieux avec provenance directe / héritée / agrégée / curation.
- Disponibilité séparée : original, FR officiel, traduction, documents requis, ressources facultatives.
- PDF `(info)` reconnu comme substitut `informationOnly`.
- Scan des `.zip` et association à une campagne ou une unité jouable.
- Héritage d’un ZIP de campagne vers tous ses descendants.
- Associations ZIP `confirmed`, `review` ou `unassociated` ; les associations `review` restent « ZIP à vérifier ».
- Vue « À préparer » : PDF requis, traductions, ZIP, info seules, associations incertaines, métadonnées.
- Curation V3 écrite dans `byId` tout en conservant la lecture des anciens champs.
- Endpoint `GET /api/pf2-mj/resource-bundles` pour l’inventaire ZIP dynamique.
- `POST /api/pf2-mj/local-scan` enrichi avec PDF info et ZIP.
