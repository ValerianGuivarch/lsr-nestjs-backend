# Aide-mémoire des règles — Pathfinder 2e Remaster

[← Aide PF2](../../AIDE.md) · [Outils](../../OUTILS.md)

## Finalité et source de vérité

La sous-rubrique **Monde → Règles** est un pense-bête utilisable immédiatement pendant les séances, sans recopier les livres. Les fiches et l'URL ChatGPT sont des données métier de SQLite (`pf2_record`, kind `rules-aide`, id `pf2-rules`) éditables depuis l'interface ou l'API `GET/PUT /api/pf2-mj/rules-aide`. Le Markdown documente les décisions et l'historique, pas les fiches elles-mêmes.

Chaque fiche comprend catégorie, titre, réponse immédiate, détails, lien de référence et statut : « règle officielle », « règle maison validée », « décision ouverte ». Toute mécanique officielle doit être vérifiée contre PF2e Remaster, notamment les sources Paizo et Archives of Nethys.

## Politique éditoriale

Répondre d'abord aux questions concrètes du MJ : actions, degrés de réussite, DD, conséquences, exceptions et sources. Examiner ensuite la pertinence d'une fiche réutilisable ou d'une correction. Ne pas inscrire chaque cas exceptionnel. Une question répétée peut signaler une fiche difficile à retrouver, pas seulement manquante. Les réorganisations importantes et décisions ambiguës nécessitent validation du MJ. Ne pas déduire l'inutilité d'une fiche de l'absence de questions.

## Historique daté

### 2026-11-23 — Besoin initial et mise en œuvre

- **Besoin :** rubrique de règles PF2e Remaster accessible au sein du portail MJ ; recherche et consultation instantanées ; lien direct vers la discussion dédiée ; enrichissement progressif fondé sur l'expérience.
- **Décision :** sous-rubrique de « Monde », avec fiches repliables, recherche textuelle, filtres par catégorie et statut, édition intégrée ; données et lien ChatGPT conservés dans SQLite.
- **Architecture :** `RulesAide.tsx`, `RulesAide.css`, `routing.ts`, `Pf2MjApp.tsx`, `Pf2MjController.ts`, `Pf2MjService.ts`, `Pf2PersistenceService.ts`.
- **À conserver :** mécaniques générales réellement utiles, expliquées avec références ; **à écarter :** questions purement circonstancielles.
- **Point ouvert (levé le 23/11) :** premier socle de fiches vérifiées publié en SQLite. Les fiches spécialisées restent à enrichir selon les questions du MJ.
- **Évaluation future :** ergonomie en séance, fréquence des questions, rubriques difficiles à retrouver, redondances, catégories inadaptées.

## Questions mécaniques et décisions

### 2026-11-23 — Demande de socle initial

- **Demande MJ :** « remplir avec un peu les infos de base : les combats, les pièges, les sorts, les armes ».
- **Décision : intégrer.** Thèmes généraux très réutilisables, directement utiles à l'arbitrage en séance ; garder une fiche synthétique par mécanisme plutôt qu'une encyclopédie par équipement ou sort.
- **Modifications réellement appliquées via l'API métier :** 22 fiches dans SQLite, réparties en Combat (8), Pièges et dangers (4), Sorts (6) et Armes (4) ; chaque fiche dispose d'un lien de référence Archives of Nethys ; aucune règle maison ajoutée. Le lien ChatGPT existant est conservé.
- **Précisions après vérification du GM Core, p. 98 :** les dangers exigeant un rang minimal ne donnent un jet de détection qu'aux personnages suffisamment compétents qui recherchent activement ; un désamorçage est habituellement une activité de 2 actions et un échec critique déclenche le danger.
- **Sources utiles :** [Écran MJ PF2e](https://2e.aonprd.com/GMScreen.aspx), [dangers, GM Core](https://2e.aonprd.com/Rules.aspx?ID=2846), [incantation, Player Core](https://2e.aonprd.com/Rules.aspx?ID=2233), [armes, Player Core](https://2e.aonprd.com/Rules.aspx?ID=2186).
- **Suite :** compléter selon les situations répétées, vérifier les éventuels changements d'errata, éviter de recopier les fiches SQLite dans ce Markdown.

Pour chaque future question significative, conserver date, situation, réponse synthétique sourcée, décision d'intégration ou non (avec justification), et modification effectivement réalisée.
