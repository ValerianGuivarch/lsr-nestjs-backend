# XPC — source de vérité de progression

Le flag maître est :

```text
flags.pf2e-val-toolkit.xpc
```

Le Toolkit est le seul à écrire ce flag dans Foundry. Lorsqu'un MJ charge le
monde, il lit les résumés depuis l'API PF2 et recalcule intégralement l'XPC de
chaque PJ : il n'y a donc aucun cumul local susceptible de dériver.

Pour un PJ donné, le total est la somme, sur tous les résumés :

- de `sessionXp` pour chaque résumé où son UUID Foundry est dans
  `participants` ;
- de `shortSummaryXp` s'il est `shortSummaryAuthor` ;
- de `longSummaryXp` s'il est `longSummaryAuthor`.

Le Toolkit ne gère ni SQLite, ni XWiki, ni Discord. Il ne stocke que le flag
XPC dérivé sur l'Actor Foundry.

## Courbe historique

| Niveau | XPC cumulée |
| ---: | ---: |
| 1 | 0 |
| 2 | 300 |
| 3 | 900 |
| 4 | 2 700 |
| 5 | 6 500 |
| 6 | 14 000 |
| 7 | 23 000 |
| 8 | 34 000 |
| 9 | 48 000 |
| 10 | 65 000 |
| 11 | 84 000 |
| 12 | 105 000 |
| 13 | 127 000 |
| 14 | 151 000 |
| 15 | 177 000 |
| 16 | 205 000 |
| 17 | 236 000 |
| 18 | 271 000 |
| 19 | 311 000 |
| 20 | 356 000 |

Le niveau est le plus haut palier inférieur ou égal à XPC.

L'XP PF2 est une projection proportionnelle sur 0–999 entre le palier actuel
et le suivant.

Exemple :

```text
XPC 2 430
niveau 3 : palier 900
niveau 4 : palier 2 700
progression : 1 530 / 1 800 = 85 %
XP PF2 : 850
```

L'absence initiale de XPC n'est plus une erreur durable : le prochain
recalcul MJ l'écrit depuis les résumés, puis le niveau et l'XP PF2e dérivés
sont synchronisés.

## Synchro manuelle

```js
game.pf2eValToolkit.xpc.sync(actor);
game.pf2eValToolkit.xpc.syncSelected();
game.pf2eValToolkit.xpc.syncAll();
game.pf2eValToolkit.xpc.syncFromResumes({ notify: true });
```

`game.pf2eValToolkit.careerXp` reste un alias pour compatibilité.

L'URL de base est un réglage de monde : **PF2e Val Toolkit → URL API des
résumés**. Sa valeur par défaut est
`https://l7r.fr/apil7r/pf2-mj`, qui expose alors `GET /sessions`.
