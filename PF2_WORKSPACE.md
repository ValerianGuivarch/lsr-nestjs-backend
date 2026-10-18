# PF2 — point d'entrée des discussions et artefacts

Ce document oriente les discussions ChatGPT et les interventions de documentation PF2. **Ne pas confondre fichiers narratifs, documents techniques et données runtime.**

## Routage

| Catégorie ChatGPT | Point d'entrée | Documents associés |
| --- | --- | --- |
| PF2 Campagnes | [Campagnes](story/Campagnes.md) | [Fronts](story/Fronts-de-campagne.md), [Lectures](story/Campagnes-et-lectures.md) |
| PF2 PJ | [Index des PJ](story/Personnages-joueurs.md) | [Bible](story.md), fiches `story/PJ-*.md` |
| PF2 Univers | [Univers](story/Univers.md) | [Bible](story.md), PNJ/lieux/factions en SQLite |
| PF2 Outils | [Architecture actuelle](RECAP.md) | [Précédent état daté](RECAP-PF2-2026-09-09.md), [Wiki et Foundry](docs/wiki-foundry.md) |
| PF2 Aide | [Bible](story.md), [Architecture](RECAP.md) | selon le sujet, aucune obligation d'artefact |
| PF2 Divers | ce fichier | déterminer ensuite la destination permanente |
| PF2 Old | aucune source principale | archiver seulement après capitalisation |

## Politique documentaire

1. Commencer par identifier la source de vérité : lore dans `story.md` / `story/*.md`, architecture dans `RECAP.md`, données métier dans `pf2.sqlite`, objets mécaniques dans Foundry, documents physiques dans `PF2_LIBRARY_ROOT`. Un Markdown ne remplace pas l'état réel de ces systèmes.
2. Conserver canon Pathfinder, adaptation validée, proposition provisoire et chronique de lecture comme quatre statuts distincts.
3. Éviter les duplications : une information détaillée dans un seul fichier, des liens dans les index. Une information concernant un PJ et une campagne peut être reliée dans les deux sens.
4. Avant toute proposition : consulter le contenu le plus récent sur GitHub, signaler les divergences documentaires ; ne pas écraser une décision plus récente.
5. Avant **toute écriture**, relire la version courante des fichiers touchés et comparer les différences. En cas d'éditions concurrentes, reconstituer le patch depuis la dernière version, sans écrasement ni suppression.
6. Exiger l'accord du MJ avant l'écriture. Préférer une modification minimale et traçable ; ne pas convertir une hypothèse en fait acquis.
7. À la fin d'une discussion : lister les décisions, découvertes, informations non encore capitalisées et tâches ouvertes ; proposer les fichiers concernés.
8. La migration des douze PJ a extrait les résumés du dossier `story/Personnages-joueurs.md` vers des fiches `story/PJ-*.md`. Les informations détaillées provenant des fiches Google Docs/Foundry restent à intégrer après vérification.
9. Les chapitres narratifs doivent rester directement sous `story/` tant que le lecteur `apps/web-misc/src/pf2-mj/Lore.tsx` ne prend pas en charge les sous-dossiers.

## Démarrage d'une nouvelle discussion

Lire cet index puis uniquement les fichiers pertinents pour la tâche. Préférer les fichiers au contexte des anciennes conversations. Pour les données en évolution, vérifier les sources runtime plutôt que supposer les Markdown à jour.
