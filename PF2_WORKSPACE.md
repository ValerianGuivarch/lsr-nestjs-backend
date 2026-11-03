# PF2 — Espace de travail et conventions

**Point d'entrée obligatoire** des nouvelles discussions ChatGPT PF2. Les conversations sont temporaires : **les décisions et connaissances utiles doivent survivre dans les artefacts Markdown**, sans doubler les données des systèmes opérationnels.

## Priorité aux accès et processus nominaux

**Règle impérative pour l'assistant :** utiliser les interfaces, outils et processus officiels prévus pour chaque tâche (Git et GitHub pour le code ; mini-PC pour l'exploitation ; API documentaire ou interface Foundry pour les Actors, Items et Scenes ; outils métiers pour leurs données). Les données de campagne restent dans le système qui en est la source de vérité.

Lorsqu'une opération habituelle échoue (monde Foundry fermé, relais sans droits, compte indisponible, problème Git, SSH ou déploiement), **diagnostiquer le blocage et demander explicitement à l'utilisateur avant de passer à une autre méthode**. Rétablir en priorité l'accès nominal. Une solution alternative peut être proposée, mais elle ne doit jamais être exécutée sur la seule base de la demande initiale.

En particulier, ne jamais placer un script de création ou de réparation ponctuelle d'un personnage, d'une scène ou d'un scénario dans un module applicatif ou un hook de démarrage pour contourner un accès Foundry bloqué ; ne jamais écrire directement dans la base de données Foundry active ; ne pas changer les permissions, les clés ou l'architecture pour forcer un accès. Le code réutilisable n'est pas un réceptacle de données spécifiques au monde. Un contournement exige une approbation distincte.

Quand plusieurs endpoints normaux et autorisés existent (par exemple lecture et modification d'un document dans le REST Relay), les privilégier sans rechercher de nouvelles permissions. Avant tout changement de code, examiner et protéger les modifications locales non commitées ; distinguer sources Git et déploiement. Rendre compte de ce qui est réellement fait et de ce qui reste bloqué.

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
- **Données métier :** `pf2.sqlite` (catalogue, PNJ, lieux, séances, relations).
- **Mécanique :** Foundry. Les choix futurs en Markdown ne sont pas nécessairement appliqués.
- **Quêtes Discord :** fils, titres et état Discord, selon [l’intégration](docs/pf2/discord-quest-map-sync.md).
- **PDF/ZIP :** `PF2_LIBRARY_ROOT` / `pf2-data`.
- **Application :** code et configuration courants, voir [OUTILS.md](OUTILS.md).

Distinguer canon publié, décision validée, événement joué, information connue des PJ, proposition, point à vérifier et chronique de lecture. Préserver les secrets MJ.

## Méthode de modification

1. Lire l’index et les fiches liées au sujet.
2. Vérifier le fonctionnement réel du code et des systèmes, plutôt qu’un audit daté.
3. Relire les versions actuelles GitHub, fusionner les nouveautés et éviter d’écraser un autre travail.
4. Écrire après accord explicite, via branche et PR pour les réorganisations importantes.
5. Préserver les faits utiles avant suppression et maintenir les liens internes.
6. Récapituler les modifications et vérifications effectivement exécutées.

## Documentation vivante

Les index PF2 et les fiches sous `pf2/` forment la base de connaissances durable.
Ne pas recréer de fichiers « déplacé vers… », de copies historiques ni de répertoires d’archives Markdown : les anciennes versions se retrouvent dans les commits Git. Les rapports d’audit datés ne deviennent pas des sources de vérité concurrentes.

Pour capitaliser une discussion : enrichir la fiche existante, conserver les décisions utiles et liens actifs, supprimer les doublons sans garder des pointeurs de compatibilité vides. Si un ancien texte et une fiche récente divergent, privilégier la décision documentée la plus récente et signaler les contradictions non résolues.

## Source complémentaire : discussions privées Discord des PJ

Le script local `scripts/pf2-discord-pj-read.py` permet au MJ de consulter en lecture seule les salons des PJ associés dans SQLite. Voir [Wiki / Discord](pf2/outils/wiki-discord.md). Les échanges peuvent enrichir la liste des contacts, mais ne remplacent ni la continuité validée, ni le Background éditable dans SQLite/wiki, ni Foundry pour la mécanique. Ne jamais promouvoir une proposition de salon en fait canonique sans validation MJ.

La publication des PNJ, les contacts personnels et le masquage de leur portrait par PJ sont documentés dans [Visibilité des personnages PF2](pf2/outils/personnages-visibilite.md).
