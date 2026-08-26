# Wiki et médiathèque

Ces deux services sont indépendants du démarrage habituel de l'application.

| Service | Port local par défaut | URL publique | Démarrage |
| --- | ---: | --- | --- |
| BookStack | 4205 | `https://wiki.l7r.fr` | `npm run start` ou `npm run wiki` |
| Médiathèque React | 4206 | `https://media.l7r.fr` | `npm run start` ou `npm run media` |

## Wiki BookStack

BookStack démarre automatiquement en arrière-plan avec `npm run start`. Pour le lancer seul, utiliser `npm run wiki`. Comme il tourne dans Docker, il reste actif après l'arrêt des applications Node ; `npm run wiki:down` l'arrête explicitement.

Copier les variables ci-dessous dans `.env` (sans les commiter) :

```dotenv
BOOKSTACK_PORT=4205
BOOKSTACK_APP_URL=https://wiki.l7r.fr
BOOKSTACK_APP_KEY=base64:... 
BOOKSTACK_DB_PASSWORD=...
BOOKSTACK_DB_ROOT_PASSWORD=...
BOOKSTACK_DATA_ROOT=../../bookstack-data
```

Générer une clé avec `openssl rand -base64 32`, puis la préfixer par `base64:`.
Le dossier `BOOKSTACK_DATA_ROOT` contient à la fois la configuration BookStack et MariaDB : il doit être conservé hors Git et sauvegardé.

Lancer ou arrêter uniquement le wiki :

```bash
npm run wiki
npm run wiki:down
```

Sur le NAS, créer un proxy inverse `wiki.l7r.fr` HTTPS vers `http://127.0.0.1:4205`. BookStack n'est relié ni à Foundry ni aux données de jeu.

## Médiathèque

La médiathèque démarre automatiquement avec `npm run start`. Pour la lancer seule, utiliser `npm run media`.

Les métadonnées sont dans la base SQLite JDR ; les fichiers restent hors base, dans :

```dotenv
MEDIA_ROOT=../../media
MEDIA_PUBLIC_BASE_URL=https://media.l7r.fr
MEDIA_PORT=4206
```

La structure créée automatiquement est `MEDIA_ROOT/portraits` et `MEDIA_ROOT/images`.
`MEDIA_ROOT` peut par exemple viser `../../FoundryVTT/Data/assets/l7r` : aucun fichier n'est copié dans le dépôt.

L'interface permet l'envoi, le glisser-déposer, le collage et l'import d'URL. Les fichiers statiques PNG/JPEG/WebP sont convertis en WebP ; les GIF animés sont conservés. La limite est 10 Mo.

Pour rendre le service public, créer un proxy inverse HTTPS `media.l7r.fr` vers `http://127.0.0.1:4206`. L'application Vite relaie ensuite `/api` vers l'API JDR locale (3333).

Les images publiques retournées par l'API utiliseront `MEDIA_PUBLIC_BASE_URL`. Elles peuvent donc être insérées dans BookStack et affichées depuis n'importe quelle application.

## PF2 MJ

Un PNJ peut désormais référencer `portraitMediaId`. Ce portrait est prioritaire ; le champ historique `image` est conservé comme repli. Il n'y a aucune migration automatique des données existantes.

Depuis l'édition d'un PNJ, on peut rechercher un portrait existant, en importer un ou en envoyer un nouveau. Une création depuis PF2 MJ crée une entrée de médiathèque ; un remplacement met à jour cette même entrée.

## Vérifications

```bash
curl -I http://127.0.0.1:4205
curl -I http://127.0.0.1:4206
curl -I http://127.0.0.1:3333/api/v1/media
```

Les builds se font avec une version récente de Node (22 recommandé) :

```bash
npm run build:media
npm run build:web:misc
```
