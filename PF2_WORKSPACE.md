# PF2 — Espace de travail et conventions

**Point d'entrée obligatoire** des nouvelles discussions ChatGPT PF2. Les conversations sont temporaires : **les décisions et connaissances utiles doivent survivre dans les artefacts Markdown**, sans doubler les données des systèmes opérationnels.

## Sommaire

| Dossier ChatGPT | Index principal | Sujets |
| --- | --- | --- |
| PF2 - PJs | [PJ.md](PJ.md) | Biographies, relations, évolution et décisions des personnages joueurs |
| PF2 - campagnes | [CAMPAGNES.md](CAMPAGNES.md) | Campagnes, scénarios, préparation et événements joués |
| PF2 - univers | [UNIVERS.md](UNIVERS.md) | Lieux, PNJ, factions, institutions et continuité transversale |
| PF2 - outils / apps | [OUTILS.md](OUTILS.md) | Application, wiki, Foundry, Discord, carte, automatisations |
| PF2 - aides | [AIDE.md](AIDE.md) | Règles maison, méthodes de MJ et aides réutilisables |
| PF2 - divers | Ce fichier, puis index pertinent | Conversation hybride, à reclasser lorsque possible |
| PF2 - old | Archives de conversations | Après vérification que les informations durables sont conservées |

Les fiches narratives détaillées résident sous `pf2/pj/`, `pf2/campagnes/`, `pf2/univers/`. Les descriptions techniques sont sous `pf2/outils/`. Les ressources plus spécifiques au code peuvent rester proches de celui-ci.

## Règle d'or — capitalisation continue

**Une discussion ChatGPT ne doit jamais être la seule détentrice d'une décision durable.** Pendant tout travail, lorsqu'une histoire, un choix de PJ, une adaptation, une règle maison, une conception ou une implémentation évolue et est validée, **mettre à jour l'artefact Markdown de référence au fil de l'eau** (ou proposer immédiatement la modification si l'autorisation d'écrire n'est pas encore donnée). Ne pas attendre l'archivage de la conversation.

- **Campagne ou scénario suivi :** une fiche Markdown propre est obligatoire. Créer la fiche si nécessaire, puis l'inscrire dans [CAMPAGNES.md](CAMPAGNES.md). Si une discussion suit plusieurs scénarios, les séparer lorsque chacun nécessite une continuité autonome.
- **PJ :** utiliser une fiche `pf2/pj/PJ-*.md` et l'indexer dans [PJ.md](PJ.md). Compléter seulement les faits sourcés ou validés.
- **Univers, outils, aides :** privilégier le document thématique existant ; créer une fiche seulement si le contenu le justifie.
- **Implémentation technique :** tenir la documentation de fonctionnement et les travaux ouverts synchronisés avec le code réellement livré ; dater les constats ponctuels.
- **Modification de données runtime :** ne pas recopier SQLite/Foundry/Discord dans les Markdown. Documenter les *règles, choix et conséquences durables*, pas leurs tableaux de données.

## Sources de vérité et niveaux de certitude

- **Éditorial et continuité :** fichiers `pf2/` concernés, avec statut explicite des informations.
- **Données métier :** `pf2.sqlite` pour catalogues, PNJ, lieux, séances, relations, etc.
- **Fiches et objets mécaniques :** Foundry ; les choix futurs peuvent être décrits en Markdown sans prétendre qu'ils sont déjà appliqués.
- **Quêtes du forum Discord :** fils, titres et état Discord ; consulter [l'intégration](docs/pf2/discord-quest-map-sync.md).
- **Documents PDF/ZIP :** `PF2_LIBRARY_ROOT` / `pf2-data`.
- **Application :** code et configuration courants, voir [OUTILS.md](OUTILS.md).

Distinguer explicitement **canon publié**, **adaptation/décision validée**, **événement réellement joué**, **information connue des PJ**, **proposition**, **à vérifier** et **chronique de lecture**. Les secrets MJ ne sont pas automatiquement des informations connues des joueurs. Ne jamais arbitrer silencieusement une contradiction.

## Méthode de modification

1. Lire ce sommaire et l'index du domaine, puis **seulement** les fiches liées au sujet.
2. Vérifier l'état réel lorsque le sujet dépend du code, de Foundry, de SQLite ou d'un service externe ; les audits datés ne remplacent pas une vérification.
3. Avant d'écrire, relire **la dernière version GitHub** des fichiers concernés. Fusionner les nouveautés, ne pas écraser les modifications d'une autre discussion.
4. Lorsque l'utilisateur a autorisé explicitement la capitalisation, réaliser la mise à jour documentaire dès qu'une décision importante est actée ; sinon demander son accord. Suivre le workflow GitHub demandé (branche/PR pour les réorganisations importantes).
5. Mettre à jour index et liens lorsqu'une fiche est créée ou renommée. Ne jamais déplacer ou supprimer des informations sans conservation vérifiée.
6. Conclure le travail par un bref état : décisions, fichiers Markdown actualisés, points encore ouverts. Pour les modifications applicatives : vérifications réellement exécutées, pas supposées.

## Instructions de démarrage d'une nouvelle discussion

> Consulte `PF2_WORKSPACE.md` du dépôt GitHub `ValerianGuivarch/lsr-nestjs-backend`, puis l'index et les fiches correspondant au sujet de cette discussion. Applique la règle d'or : les faits, décisions et évolutions durables doivent être capitalisés au fur et à mesure, dans les bons Markdown, sans se reposer sur l'historique ChatGPT. Différencie faits validés, propositions, événements joués et données runtime ; ne modifie rien en cas de conflit non tranché. Pour une campagne ou un scénario suivi, utilise ou crée une fiche dédiée ; pour un PJ, utilise sa fiche. Réexplore les fichiers actuels avant chaque écriture.

### Audit / clôture d'une ancienne discussion

> Résume en quelques lignes le sujet, le dossier recommandé, la pertinence de conserver ou renouveler la conversation, et **les seules informations durables non déjà présentes dans GitHub**. Consulte le dépôt en lecture seule pour cet audit. Propose les modifications de Markdown avant de les effectuer.
