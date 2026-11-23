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

### 2026-11-23 — Potions et consommables

- **Demande MJ :** ajout des potions au socle de règles de l'application.
- **Décision : intégrer**, car les actions pour boire et administrer des potions sont fréquentes en combat.
- **Modification effectivement réalisée :** cinq fiches enregistrées par l'API métier dans SQLite : boire une potion et la sortir, l'administrer à un allié, potions de soins (dés, niveaux et prix), différence entre potions magiques et élixirs alchimiques, huiles et autres consommables. Le catalogue passe de 22 à 27 fiches. Le lien ChatGPT est conservé.
- **Sources :** [PF2 Remaster — trésors et potions](https://pf2orc.d20pfsrd.com/rules/home/gamemastering/treasure/), [trait potion](https://pf2.d20pfsrd.com/trait/potion/), [trait élixir](https://pf2.d20pfsrd.com/trait/elixir/).
- **Justification :** aider à arbitrer les coûts en actions sans dupliquer le catalogue complet des objets.

### 2026-11-23 — Fiches détaillées, application Foundry et retour d'utilité

- **Besoin MJ :** les résumés seuls n'indiquent pas précisément comment arbitrer ; ajouter des procédures concrètes, des exemples, des instructions Foundry si pertinentes, et des pouces ↑/↓ avec compteurs.
- **Décision :** chaque fiche a désormais quatre zones distinctes : résumé opérationnel très court ; mode d'emploi détaillé ; exemple concret ; rubrique « Foundry — comment faire ? » optionnelle. Une fiche de règles peut ne pas avoir de partie Foundry si elle n'apporte aucune information pratique.
- **Distinction impérative :** les règles Pathfinder, les fonctionnalités natives de Foundry, les fonctions du système PF2e et les possibilités ajoutées par des modules ne sont **pas interchangeables**. Ne jamais promettre une automatisation par le seul fait de placer un danger/Actor sur une scène. Identifier si une intervention du MJ ou un script/région/module est requis et si un module est réellement installé/activé.
- **Méthode de rédaction obligatoire :** expliquer d'abord **quand** la règle s'applique, puis **qui lance quel jet**, contre **quel DD**, **avec quelles actions**, et **quelles conséquences** selon les degrés de réussite et les exceptions. Ajouter au moins un exemple chiffré ou une situation narrative qui démontre la procédure. Enfin indiquer le déroulement concret sur Foundry (préparation du plateau, déclenchement, chat/dés, conséquences, limites d'automatisation), si utile.
- **Couverture des pièges :** détection et jets secrets avant déclenchement ; déclencheur de la fiche, mécanique ou action explicite ; réaction initiale ; danger simple/complexe, initiative et routine ; options de neutralisation ; emplacement, visibilité et déclenchement manuel/automatisé dans Foundry.
- **Retour utilisateur :** boutons 👍 et 👎 visibles uniquement en dépliant une fiche ; ils incrémentent des compteurs **partagés** et persistants en SQLite (pas un vote unique par personne). Une fiche avec pouces négatifs doit être revue en priorité, en examinant son utilisation réelle.
- **Réinitialisation :** à chaque modification substantielle de l'explication (résumé, mode d'emploi, exemple, partie Foundry), les deux compteurs de cette fiche reviennent à zéro ; ne pas réinitialiser pour un changement mineur de ponctuation, d'espacement, de titre, de catégorie ou de lien. Ne pas effacer les votes lors d'un simple vote ni pour les modifications des autres fiches.
- **Interface :** le champ du lien ChatGPT est masqué par défaut ; bouton d'édition à côté du lien. Même principe pour les liens campagnes/scénarios, y compris dans le Journal.
- **Sources :** [PF2e Remaster — hazards](https://2e.aonprd.com/Rules.aspx?ID=2846) ; [Foundry — régions de scène](https://foundryvtt.com/article/scene-regions/) ; [PF2e Foundry — guide MJ](https://github.com/foundryvtt/pf2e/wiki/GM%27s-Starter-Guide).
- **Évolution :** cet historique décrit les exigences et choix éditoriaux, sans dupliquer les 27 fiches de SQLite.

### Suivi continu des évaluations

Lors de chaque audit de fiches : trier en priorité par nombre de 👎, puis interpréter 👍/👎 dans le contexte de l'usage. Revoir exactitude des règles, clarté des procédures, validité des exemples, pertinence des étapes Foundry et liens des sources. Noter ci-dessous les révisions importantes et leur justification ; ne pas confondre compteur zéro après révision et absence d'utilité.
