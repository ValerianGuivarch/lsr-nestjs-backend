# Bibliothèque de cartes — PF2e Val Toolkit 0.34.0

## Configuration

Dans Foundry : **Configuration du jeu → Paramètres du module → PF2e Val Toolkit**.

Renseigner les trois chemins :

- Bibliothèque de cartes — Monde
- Bibliothèque de cartes — Mer Intérieure
- Bibliothèque de cartes — Absalom

Les chemins sont des chemins Foundry, par exemple `assets/l7r/maps/monde.webp`.

## Configurer le token

1. Poser n'importe quel token sur la scène.
2. Sélectionner uniquement ce token.
3. Exécuter la macro `Toggle Map Library Token.js` fournie dans `macros/`.
4. Le token est maintenant marqué avec `flags.pf2e-val-toolkit.mapLibrary = true`.

Double-cliquer sur ce token ouvre la bibliothèque de cartes.

**MJ : Maj + double-clic** conserve l'ouverture normale de la fiche du token.

## API console / macro

```js
game.pf2eValToolkit.mapLibrary.open();
game.pf2eValToolkit.mapLibrary.enableSelectedToken();
game.pf2eValToolkit.mapLibrary.disableSelectedToken();
game.pf2eValToolkit.mapLibrary.toggleSelectedToken();
```
