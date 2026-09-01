# Wiki XWiki, relay Foundry et portraits PNJ

Ces services sont indépendants du démarrage habituel de l'application : `npm run start` ne lance que les API JdR/Diary, le site misc et l'administration JdR.

| Service | Port local par défaut | URL publique | Démarrage |
| --- | ---: | --- | --- |
| XWiki | 4205 | `https://wiki.l7r.fr` | `npm run wiki` |
| Foundry REST relay | 3010 | — (usage interne Foundry) | `npm run foundry:relay` |
| Carte de Golarion | 4204 | `https://map.l7r.fr` | `npm run map` |

## Wiki XWiki

XWiki tourne dans Docker, indépendamment des applications Node. Les fichiers sont dans `support/xwiki/` et sa configuration locale non versionnée est `support/xwiki/.env`.

```bash
npm run wiki
npm run wiki:up
npm run wiki:down
npm run wiki:logs
```

## Foundry REST relay

Le relay REST Foundry VTT est dans `support/foundry-rest/`, avec sa propre configuration locale non versionnée (`support/foundry-rest/.env`).

```bash
npm run foundry:relay
npm run foundry:relay:up
npm run foundry:relay:down
npm run foundry:relay:logs
npm run foundry:relay:build
```

## Portraits PNJ PF2 MJ

PF2 MJ est la source structurée des PNJ. Le fichier source est conservé par
l'application dans `STORAGE_PATH/portraits/`, indexé dans SQLite (`pf2_media`).
Lorsqu'un PNJ est lié à un Actor, l'API le téléverse via le Relay vers Foundry.
Le chemin Foundry produit est stable :

```text
assets/l7r/portraits/<id-pnj>.webp
```

Le champ `portrait` du PNJ conserve le chemin local `portraits/<id-pnj>.webp` et
`foundryActorUuid` garde l'association stable avec l'Actor. L'outil MJ affiche
le fichier via `GET /api/pf2-mj/portraits/<fichier>` et propose l'envoi de
fichier, le glisser-déposer, le collage d'image, l'import par URL et le
remplacement. `FOUNDRY_ASSETS_ROOT` reste une compatibilité de lecture pour les
portraits historiques, mais n'est plus requis pour les nouveaux.

Les anciens champs `image` restent affichables comme repli afin de ne pas casser les données existantes. Les nouveaux portraits n'utilisent ni identifiant de médiathèque ni API de média générique.

## Vérifications

```bash
curl -I http://127.0.0.1:4205
curl -I http://127.0.0.1:3333/api/pf2-mj/curation
curl -I http://127.0.0.1:3333/api/v1/pf2-mj/curation
```
