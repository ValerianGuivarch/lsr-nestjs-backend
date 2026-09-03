# Réconciliation catalogue PF2 — 2026-09-01

Cette version a été construite à partir de `data(1).zip` et de l'arborescence réelle fournie pour `~/services/pf2-data`.

## Résultat

- 377 PDF physiques dans l'arborescence.
- 377 PDF enregistrés dans `catalogue-pf2.json` après correction.
- 0 chemin catalogue sans fichier physique correspondant.
- 0 fichier physique absent du catalogue.
- 21 anciens chemins/nommages mis à jour vers les noms réellement présents sur disque.
- 83 fichiers physiques auparavant non inventoriés ajoutés au catalogue.
- 74 de ces 83 fichiers associés automatiquement à une unité, un épisode ou un composant avec une cible déterministe.
- 7 nouveaux fichiers de règles/univers conservés volontairement comme documents de référence hors catalogue jouable.
- 2 ressources restent réellement à associer manuellement :
  - `Ressources/Cartes/War for the Crown - Tome 2 - Songbird, Scion, Saboteur (map).pdf`
  - `Ressources/Guides joueurs/Pathfinder Adventure Path - Player's Guide (player).pdf`
- 41 associations historiques PFS qui pointaient vers des IDs `*-main` inexistants ont été corrigées pour viser directement l'entrée Quest/Bounty correspondante.
- 6 unités jouables manquantes ont été créées à partir de fichiers physiques certains : Bounty 04, Quests 10/11/16/23 et PFS 1e #47. Leurs niveaux, lieux et synopsis restent volontairement à documenter plutôt que d'être inventés.
- `Abomination Vaults — Hands of the Devil` est maintenant représenté comme épisode jouable car le volume anglais existe réellement dans la bibliothèque.
- Les PDF `(info)` de Rusthenge, Threshold of Knowledge et PFS 3-17 sont des substituts documentaires et produisent un état `information_seule`, pas `complet`.
- Les cartes et guides joueurs détectés ont été ajoutés comme composants facultatifs ; ils ne rendent pas une œuvre incomplète.
- Aucun ZIP n'existe encore : `resource-bundles.json` indique donc un inventaire connu de 0 ZIP, ce qui permet à la vue « ZIP manquants » de fonctionner immédiatement.

## Fichiers à remplacer

- `apps/web-misc/src/pf2-mj/data/catalogue-pf2.json`
- `apps/web-misc/src/pf2-mj/data/catalogue-player.json`
- `apps/web-misc/src/pf2-mj/data/library-scan.json`
- `apps/web-misc/src/pf2-mj/data/pending-document-links.json`
- `apps/web-misc/src/pf2-mj/data/resource-bundles.json`

Un rapport JSON détaillé est également fourni sous `catalogue-reconciliation-2026-09-01.json`.
