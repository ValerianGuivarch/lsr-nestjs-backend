# PF2 — Réputations individuelles, relations et intermèdes

[← Outils](../../OUTILS.md) · [← Espace de travail](../../PF2_WORKSPACE.md)

## Décision validée

Les réputations PF2 appartiennent par défaut au **groupe**. Chaque PJ peut avoir un **écart personnel** par faction, nul lorsqu'aucune ligne n'existe. Le score du personnage est le score collectif plus cet écart, plafonné à –50/+50.

Les seuils de réputation et les qualificatifs existants sont conservés : Neutre (–4 à +4), Apprécié (+5), Admiré (+15), Révéré (+30), Méprisé (–5), Détesté (–15), Pourchassé (–30). On les réutilise pour les Relations personnelles comme règle maison.

La page **Réputation** du wiki affiche Groupe en premier dans son sélecteur, puis les PJ autorisés. Une barre unique marque le groupe par un point et le personnage par une étoile, avec un segment d'écart (positif ou négatif). Le MJ peut modifier directement les valeurs sans saisir de motif. Aucun nouvel historique n'est enregistré ; l'ancienne table historique n'est pas supprimée.

## Données et permissions

- Table `pf2_reputation_character_modifier` : `reputation_id`, `player_npc_id`, `modifier`. Absence de ligne = 0 ; pas de duplication du score collectif.
- Table `pf2_player_character_relation` : `id`, `player_npc_id`, `name`, `description`, `score` et `linked_npc_id` facultatif.
- L'onglet **Relations** dans `Spécial:MesPersonnages` est distinct de l'onglet Contacts. Pas de portrait. Une Relation peut être liée à une fiche PNJ existante, si cette fiche est consultable par le PJ ; sinon aucun lien de fiche n'est proposé.
- Un joueur consulte uniquement les Relations des personnages qui lui appartiennent, ou le MJ tous les PJ. Seul le MJ peut créer, éditer et supprimer les Relations ou modifier les scores.
- Les scores sont compris entre –50 et +50 ; aucun nouveau suivi chiffré additionnel par rapport à la Relation elle-même.

## Trois activités d'intermède

Le don **Animal social / Hobnobber**, déjà possédé par Pépin, débloque dans le toolkit les activités A et B. C'est une adaptation maison d'intermède ; les actions PF2 ordinaires restent applicables à tous selon les règles.

1. **Créer un contact** : Diplomatie — Recueillir des informations. Le PJ choisit un milieu ou groupe. DD indicatif 15 (courant), 20 (spécialisé), 25 (difficile), 30 (très fermé). Réussite : création de Relation à **+1**. Réussite critique (DD+10 après règles de degrés) : création à **+1** et droit d'effectuer immédiatement l'activité B. Échec : rien ; échec critique : pas de contact, fausse piste possible. Le MJ détermine le DD.
2. **Entretenir une relation** : Diplomatie — Faire bonne impression, contre le **DD de Volonté** du personnage concerné. Adaptation persistante proposée : échec critique –1, échec 0, réussite +1, réussite critique +2. Le MJ valide l'évolution ; la règle officielle change d'abord l'attitude, pas une valeur de relation.
3. **Rendre service à une communauté** : le PJ choisit une faction du référentiel de réputations, un service réalisable et une compétence adaptée à ce service. Le MJ détermine le DD. Les points de réputation sont attribués en fonction du service réellement rendu (par exemple +1 mineur, +2 modéré, +5 ou plus majeur), **sur son écart individuel**, pas automatiquement au groupe.

Les activités respectent le temps de trajet et la disponibilité du PJ. On n'effectue pas nécessairement un jet par jour. **Les jets Foundry produisent une proposition de résultat, jamais une modification automatique du wiki** : le MJ applique les variations manuellement dans un premier temps.

## Technique

- API interne wiki / toolkit : `/api/pf2-mj/reputations/internal` et `/api/pf2-mj/relations/internal/:npcId`, avec contrôle d'identité/permissions côté wiki et backend.
- API de lecture publique `/api/pf2-mj/reputations/visible` : uniquement les intitulés des factions déjà visibles, sans scores ni groupes masqués.
- PF2e Val Toolkit : raccourcis intégrés à **PF2e HUD → Extras** pour un acteur possédant Hobnobber. Trois formulaires de jet, utilisant les compétences natives du système. La communauté est proposée via la liste de réputations visibles lorsque cette API est accessible, avec saisie libre de secours.
- Aucun script de migration d'Actor Foundry, aucun remplacement de dons et aucun changement automatique de réputation/Relations.
- Les tables sont initialisées par les services NestJS au démarrage du backend. Les fichiers source ne doivent pas être copiés à la main dans le déploiement : flux habituel branche → PR → CI → fusion → déploiement.

## Reste à vérifier après déploiement

Tester en compte MJ et en compte joueur : sélecteur et scores, visibilité des factions, CRUD des Relations, liens vers les fiches PNJ et trois raccourcis HUD avec le monde Foundry connecté. En particulier, tester la compatibilité des modales et du jet `actor.getStatistic(...).roll` avec le PF2e installé.

Le code du module est réutilisable pour d'autres PJ ; aucun identifiant d'acteur particulier n'y est figé.

## Correctif de l'édition MJ des réputations (5 novembre 2026)

La nouvelle sélection de vue « Groupe / personnage » ne doit jamais retirer au MJ
la possibilité de modifier directement les deux niveaux de réputation.

- En affichage **Groupe**, le MJ dispose de « Modifier le groupe » sur chaque faction.
- En affichage **PJ**, il dispose, sur la même faction, de **« Modifier le groupe » et « Modifier [nom du PJ] »** ; les quatre raccourcis ±1/±5 continuent d'agir sur la vue sélectionnée.
- Pour **Modifier [PJ]**, le MJ saisit le **score final souhaité** pour le personnage, entre –50 et +50. L'interface en déduit l'écart (score final − score collectif), qui est le seul nombre envoyé à l'API et stocké dans la table de modificateurs personnels. Cela préserve le modèle collectif + individuel et ne touche pas aux autres PJ.
- Si le score final nécessite un écart hors de –50 à +50, l'interface explique la limite réelle de la faction au lieu d'enregistrer une valeur incorrecte. Les valeurs sont validées et les annulations ne changent rien.
- Le droit d'écriture du wiki est **pf2sessions-admin** (attribué aux sysop), avec conservation du droit historique delete comme compatibilité. La lecture reste possible selon les règles actuelles ; les joueurs n'obtiennent pas de boutons d'administration.
- Les mutations passent toujours par pf2reputationsupdate (CSRF + vérification des droits) vers l'API interne ; aucune donnée existante n'est automatiquement modifiée par le correctif.

Fichiers : support/mediawiki/extensions/PF2PlayerCodex/includes/PF2ReputationBridge.php, resources/pf2-reputations.js et resources/pf2-reputations.css. Contrôles : resources/pf2-reputations.test.cjs, tests/ReputationBridgePermissionsTest.php et lint PHP.

### Correctif d'affichage des raccourcis (Foundry V14)

PF2e HUD utilise `ApplicationV2` et déclenche `renderApplicationV2`, **pas** l'ancien événement `renderApplication`. Lors du rendu de la barre latérale `extras`, le Toolkit injecte les trois raccourcis dans l'élément HTML en cours de rendu avec l'Actor réel de PF2e HUD, même si aucun token n'est sélectionné. Les raccourcis sont réservés aux personnages possédant le don Hobnobber et ne modifient jamais les relations/réputations automatiquement. Test de régression : `node pf2e-val-toolkit/tests/interlude-hud-v14.mjs`.
