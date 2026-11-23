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
- **Point ouvert :** contenu initial à ajouter progressivement après vérification officielle. Éviter de publier des synthèses mécaniques non sourcées.
- **Évaluation future :** ergonomie en séance, fréquence des questions, rubriques difficiles à retrouver, redondances, catégories inadaptées.

## Questions mécaniques et décisions

Aucune question de règles n'a encore été traitée ici. Pour chaque question significative, conserver date, situation, réponse synthétique sourcée, décision d'intégration ou non (avec justification), et modification effectivement réalisée.
