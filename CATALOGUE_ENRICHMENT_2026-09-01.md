# Enrichissement du catalogue PF2 — 2026-09-01

## Résultat

- **71 / 71** unités auparavant sans synopsis ont maintenant un synopsis exploitable par le MJ.
- **71 / 71** ont maintenant des détails MJ et une justification d'adaptation à la table ouverte.
- **0** unité jouable ne reste sans `synopsis`/`contextSynopsis`.
- **250** entrées conservées ; **377** PDF physiques conservés sans changement de chemin.
- Associations PDF validées : chaque `fileId` et chaque `association.itemId` pointe vers une entité existante.
- Le catalogue joueur a été régénéré avec les mêmes unités, sans `gmDetails`, sans documents physiques et sans inventaire de fichiers.

## Corrections factuelles importantes

- PFS **2-00 The King in Thorns** : niveaux corrigés de `7–8` vers **`1–8`**.
- PFS **2-01 Citadel of Corruption** : niveaux corrigés de `3–4` vers **`1–4`**.
- PFS **3-99 Fate in the Future** : niveaux corrigés de `1–4` vers **`1–8`**.
- `United in Purpose` : lieux structurés `Blackwood Swamp / Taldor / Tskikha`.
- PFS 4-03 : ajout de **Halgrim**.
- PFS 4-17 : lieu renseigné **Thuvia**.
- PFS 6-15 : ajout de **Azlant** en plus de Kaer Maga.

## Entrées locales complétées

- Bounty #4 — Cat's Cradle : niveau 1, Golden Road/désert, répétable.
- Quest #10 — The Broken Scales : niveaux 1–4, Absalom, non répétable.
- Quest #11 — A Parchment Tree : niveaux 1–4, Katheer/Qadira, non répétable.
- **Boom Town Betrayal corrigé de Quest #16 vers Bounty #16** : niveau 1, Absalom, répétable. L'ancien ID `quest-16-boom-town-betrayal` reste dans `legacyIds` et le nom de fichier local n'est pas modifié.
- Quest #23 — Lacking Respect : niveaux 1–4, Irrisen, répétable.
- PFS 1e #47 — The Darkest Vengeance : niveaux 1–5, Ustalav, conservé en Legacy avec note d'adaptation PF2.

## Pérennité des données

Les enrichissements ont aussi été reportés dans :

- `synopsis-overrides.json`
- `pfs-spoiler-details.json`
- `pfs-analysis-overrides.json`
- `title-fr-overrides.json`

Ainsi une future reconstruction du catalogue à partir des fichiers de maintenance ne doit pas effacer cette passe documentaire.

## Sources de recherche

La description fonctionnelle, les niveaux, les lieux et les tags de scénario ont été recoupés principalement avec les fiches produit officielles **Paizo Pathfinder Society**. Les titres français disponibles ont été contre-vérifiés avec l'index communautaire **Pathfinder-FR**. Les textes intégrés au catalogue sont des synthèses françaises originales, non des copies des descriptions éditeur.

## ZIP Foundry

Aucun ZIP ressources n'est ajouté : la bibliothèque actuelle n'en contient pas encore, ce qui est volontaire.
