# Espace de travail PF2 — connaissances durables

Point d'entrée commun aux discussions ChatGPT, à la continuité narrative et à la documentation technique.

## Orientation

| Dossier ChatGPT | Index de référence |
| --- | --- |
| PF2 PJ | [PJ.md](PJ.md) |
| PF2 Campagnes | [CAMPAGNES.md](CAMPAGNES.md) |
| PF2 Univers | [UNIVERS.md](UNIVERS.md) |
| PF2 Outils | [OUTILS.md](OUTILS.md) |
| PF2 Aide | [AIDE.md](AIDE.md) |
| PF2 Divers | Identifier d'abord le domaine principal et le bon index |
| PF2 Old | Discussions archivées après capitalisation |

## Sources de vérité

- **Continuité narrative et choix validés :** `pf2/pj/`, `pf2/campagnes/`, `pf2/univers/`.
- **Données métier (catalogue, PNJ, lieux, factions, séances, associations) :** `pf2.sqlite` ; les Markdown ne constituent pas un doublon de cette base.
- **Personnages et objets mécaniques réellement présents :** Foundry.
- **Fichiers documentaires physiques :** `PF2_LIBRARY_ROOT` / `pf2-data`.
- **Architecture et comportement technique :** code et configuration courants, synthétisés par [OUTILS.md](OUTILS.md).

## Écriture et continuité

1. Lire cet index puis les documents liés au sujet. Ne pas supposer qu'une ancienne discussion est une source de vérité.
2. Distinguer canon Pathfinder, adaptation validée, hypothèse / proposition et chronique de lecture ; ne jamais inventer une décision.
3. Écrire une information détaillée une seule fois, puis créer des liens depuis les autres index ou fiches.
4. Les fiches PJ couvrent l'histoire et les choix envisagés ou validés ; la mécanique effective reste dans Foundry.
5. Les fiches de campagne distinguent préparation, événements réellement joués et chroniques exploratoires. Ne pas déclarer terminée une campagne faute d'échanges récents.
6. Avant toute modification GitHub : demander l'accord du MJ, puis relire les dernières versions des fichiers concernés ; fusionner sans écraser les contributions concurrentes.
7. Signaler les conflits entre documentation et état réel. Les rapports datés ne constituent pas une description garantie du présent.
8. Après un travail important, proposer la capitalisation des informations durables et des décisions non encore documentées.

## Documentation vivante

Les index PF2 et les fiches sous `pf2/` forment la base de connaissances durable.
Ne pas recréer de fichiers « déplacé vers… », de copies historiques ni de répertoires d’archives Markdown : les anciennes versions se retrouvent dans les commits Git. Les rapports d’audit datés ne deviennent pas des sources de vérité concurrentes.

Pour capitaliser une discussion : enrichir la fiche existante, conserver les décisions utiles et liens actifs, supprimer les doublons sans garder des pointeurs de compatibilité vides. Si un ancien texte et une fiche récente divergent, privilégier la décision documentée la plus récente et signaler les contradictions non résolues.
