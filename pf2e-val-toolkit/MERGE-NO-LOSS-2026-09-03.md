# Fusion sans perte — 2026-09-03

Base retenue : version mini-PC `0.31.0`, plus récente que la copie Mac `0.14.0`.
Version fusionnée : `0.31.1`.

## Résultat de la comparaison

Après exclusion des métadonnées macOS (`.DS_Store`, `._*`, `__MACOSX`) et du dépôt `.git` :

- Mac : 36 fichiers utiles
- mini-PC : 66 fichiers utiles
- 33 fichiers utiles existent uniquement côté mini-PC
- 3 fichiers utiles existent uniquement côté Mac
- 12 fichiers communs diffèrent en contenu ; pour ces 12 fichiers, la copie Mac correspond exactement au contenu Git de la v0.14.0, tandis que la copie mini-PC contient les évolutions plus récentes. La version mini-PC est donc conservée.

## Éléments Mac récupérés

### Fonctionnalité réactivée

`scripts/patches/hunt-prey.js` existait uniquement côté Mac. Il a été réintégré et ajouté au registre courant, aux côtés de :

- `merchantTokenPatch`
- `nativeMerchantPatch`

Cela évite de perdre le patch « Chasser une proie / Hunt Prey » tout en gardant les patchs récents du mini-PC.

### Imports historiques conservés

Les deux anciens imports Mac ont été conservés byte-for-byte dans :

`foundry-imports/legacy-mac-v0.14/`

- `PFS-INTRO-01-The-Second-Confirmation.json` (formatVersion 3)
- `PFS-S01-04-Bandits-of-Immenwood.json` (formatVersion 3)

Les versions françaises plus récentes du mini-PC restent les versions courantes :

- `PFS-INTRO-01-La-Seconde-Confirmation.json` (formatVersion 4)
- `PFS-S01-04-Bandits-d-Immenwood.json` (formatVersion 5)

Les anciens fichiers sont isolés afin de préserver leur contenu sans les confondre avec les imports actuels.

## Nettoyage

Les métadonnées macOS et le dossier `.git` embarqué dans le ZIP Mac ne sont pas repris dans l'archive fusionnée.
