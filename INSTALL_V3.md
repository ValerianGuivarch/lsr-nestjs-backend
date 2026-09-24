# Installation PF2 MJ V3

Cette archive est prévue pour être extraite à la racine de `lsr-nestjs-backend`.

Elle remplace / ajoute les fichiers sous :

- `apps/web-misc/src/pf2-mj/`
- `apps/api-jdr/src/pf2-mj/`

## Avant remplacement

Faire un commit ou une sauvegarde du dépôt et de la curation actuelle.

## Installation

Depuis la racine du dépôt :

```bash
unzip -o pf2-mj-v3-complete.zip
```

Puis lancer les commandes de build/test habituelles du projet.

## Vérifications fonctionnelles

1. Ouvrir PF2 MJ et vérifier « Trouver une partie ».
2. Aller dans « À préparer » : PDF requis, Traductions, ZIP Foundry, Info seules, À vérifier, Métadonnées.
3. Lancer « Scanner PDF & ZIP ».
4. Vérifier que les ZIP de campagne apparaissent comme hérités sur les épisodes.
5. Modifier une valeur de curation sur une unité issue d’une part et vérifier que `byId` est utilisé.
6. Vérifier qu’un PDF `(info).pdf` est affiché comme « Info seule », pas comme scénario complet.

## Variables utilisées

- `PF2_LIBRARY_ROOT` : racine de la bibliothèque locale contenant PDF et ZIP.
- `PF2_DATA_ROOT` : dossier contenant `catalogue-pf2.json`.

## Migration

Le schéma V2 n’est pas supprimé. La V3 fonctionne d’abord comme adaptateur runtime. Les anciennes clés de curation sont lues, mais les nouvelles écritures sont centralisées dans `byId`.
