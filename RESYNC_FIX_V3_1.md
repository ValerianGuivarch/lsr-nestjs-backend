# PF2-MJ V3.1 — correctif de resynchronisation

Ce correctif traite les écarts constatés après réorganisation de la bibliothèque PDF :

- ignore les fichiers macOS AppleDouble `._*`, `__MACOSX` et `.DS_Store` ;
- normalise les chemins en Unicode NFC ;
- rapproche automatiquement un chemin catalogue et un fichier disque quand leur identité normalisée est identique ;
- retrouve aussi un PDF déplacé si son nom normalisé est unique dans le catalogue et sur le disque ;
- ne classe plus ces fichiers comme simultanément « nouveau » et « absent » ;
- expose les chemins retrouvés au frontend pour que la disponibilité et les liens PDF utilisent le vrai chemin disque ;
- garde le scan en lecture seule : aucune réécriture automatique de `catalogue-pf2.json`.

Le rapprochement est volontairement prudent : une correspondance ambiguë reste à classer manuellement.
