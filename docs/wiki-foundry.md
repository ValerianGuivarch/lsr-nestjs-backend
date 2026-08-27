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

PF2 MJ est la source structurée des PNJ. Un portrait est un unique fichier Foundry, et non plus une entrée de médiathèque :

```text
<FOUNDRY_ASSETS_ROOT>/portraits/pnj/<id-pnj>.webp
```

Configurer notamment sur le NAS :

```dotenv
FOUNDRY_ASSETS_ROOT=/volume1/docker/foundry/data/Data/assets/l7r
```

Foundry utilise alors le même fichier sous `assets/l7r/portraits/pnj/<id-pnj>.webp`. Le champ enregistré dans les données du PNJ est ce chemin Foundry simple et stable. L'outil MJ affiche le fichier via `GET /api/pf2-mj/portraits/<fichier>` et propose l'envoi de fichier, le glisser-déposer, le collage d'image, l'import par URL et le remplacement.

Les anciens champs `image` restent affichables comme repli afin de ne pas casser les données existantes. Les nouveaux portraits n'utilisent ni identifiant de médiathèque ni API de média générique.

## Vérifications

```bash
curl -I http://127.0.0.1:4205
curl -I http://127.0.0.1:3333/api/pf2-mj/curation
curl -I http://127.0.0.1:3333/api/v1/pf2-mj/curation
```
