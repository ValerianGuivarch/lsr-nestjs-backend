# Racooze Map Library — correctif local Foundry 14 (v1.2.22)

## Incident du 3 novembre 2026

Lors de l'import des 67 scènes Strength of Thousands, `FilePicker.upload` a répondu `false` à la requête /upload. Foundry affichait « User [] does not have permission to upload files ». Le module Racooze n'examinait pas la réponse et incrémentait tout de même les compteurs de fichiers téléchargés. Les vignettes avaient le même défaut (résultat non vérifié de `ImageHelper.uploadBase64`).

Audit initial en lecture seule : 67 scènes, 6 608 murs, 67 dossiers d'assets enregistrés, mais **0 des 80 fichiers d'images attendus (environ 121 Mo)** et **0 des 67 vignettes**. Ces scènes ne doivent pas être supprimées : leurs structures sont présentes.

## Correctif installé sur le mini-PC

Le code original du module tiers est sauvegardé sous `/home/valou/services/foundry/patches/racooze/main.js.v1.2.22.original` (SHA-256 `eef5e260f1cf74defef47e7fe9e842aa28111923389854ac393358d409f8369b`).

- `apply.py` patche la version strictement contrôlée 1.2.22 : un upload refusé fait désormais échouer le traitement ; un upload réussi doit être vérifiable par SHA-256. Les vignettes refusées ne sont plus considérées comme réussies.
- `repair.js` ajoute à la colonne **Scènes** un bouton MJ **Réparer images FdM**. Il utilise les empreintes déjà enregistrées et le téléchargement Racooze existant (clé Patreon conservée côté navigateur), **sans importer de scènes ni toucher aux murs/éclairages**.
- Le premier contrôle est la petite image de Reth's Shack ; un nouvel échec de permission interrompt immédiatement la réparation au lieu de redéclarer 67 succès.
- La file existante indique le progrès. Les vignettes manquantes sont régénérées après la récupération des images.

`node --check` passe sur les deux scripts. Test de simulation `test-repair.mjs` : résultat `false` rejeté, récupération d'image, vignette, et second passage idempotent.

## Procédure utilisateur

1. **Fermer les autres onglets Foundry** susceptibles de partager/renouveler la session.
2. Se déconnecter de Foundry et **se reconnecter comme MJ** depuis le site canonique. Le problème `User []` signifie que la requête HTTP /upload n'est pas associée à un utilisateur côté serveur. La cause exacte de cette session sans identité doit encore être confirmée.
3. Forcer le rechargement (`Ctrl+Shift+R` ou `Cmd+Shift+R` sur macOS).
4. Dans l'onglet **Scènes**, choisir **Réparer images FdM** et confirmer. Ne pas supprimer les scènes, et ne pas relancer l'import complet.
5. Contrôler la file. Le succès exige les **80 fichiers** présents physiquement, leurs SHA-256 conformes, et idéalement les **67 vignettes** présentes. Si la requête /upload est encore refusée, conserver le message affiché.

**Attention :** l'import initial affiche « terminé » à tort ; ce n'est pas la preuve du téléchargement des images. L'action utilisateur et la vérification serveur post-réparation sont nécessaires. Le correctif local peut être écrasé lors d'une mise à jour du module Racooze ; vérifier la nouvelle version, sauvegarder les scripts et adapter le correctif au lieu de réappliquer aveuglément.

## Étape suivante

**Ne commencer l'audit transversal des autres scènes/cartes qu'après la réparation et vérification de Strength of Thousands**, selon l'ordre demandé. Contrôler ensuite : fonds et avant-plans, tuiles, fichiers locaux, vignettes, liens externes, murs, lumières, scènes importées sans contenu ou images, et doublons éventuels.
