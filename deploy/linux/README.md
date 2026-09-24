# Déploiement Linux du mini-PC

L'application principale tourne sous Docker Compose. Foundry, son relay et
MediaWiki restent dans leurs stacks Docker existantes.

Services applicatifs :

- `api-jdr` : port 3333 ;
- `api-yeardiary` : port 8081 ;
- `web` : port 3000 ;
- `admin` : port 4203.

## Données persistantes

Les images ne contiennent aucune base de production. Compose monte les fichiers
SQLite et les données directement depuis le mini-PC :

- `pf2.sqlite` ;
- `jdr-database.sqlite` ;
- `database.sqlite` ;
- `storage/` en lecture/écriture ;
- `../pf2-data` en lecture seule ;
- les assets historiques Foundry en lecture seule.

Le fichier `.env` reste local au mini-PC et n'est jamais publié dans GHCR.

## Chaîne de déploiement

Une pull request vers `main` exécute la CI de validation. Après merge, le
workflow `Build and deploy` :

1. construit les quatre images sur un runner GitHub ;
2. les publie dans GitHub Container Registry avec le SHA exact du commit ;
3. crée un nœud Tailscale éphémère `tag:ci` ;
4. rejoint le mini-PC via son adresse Tailscale et SSH ;
5. avance le clone local en fast-forward sur `origin/main` ;
6. fait `docker compose pull` puis `docker compose up -d --wait`.

Le mini-PC ne surveille donc plus GitHub et ne construit plus les images.

## Configuration Tailscale à faire une seule fois

Tailscale doit être installé sur le mini-PC et connecté au même tailnet que le
runner GitHub éphémère. Le workflow suit l'intégration officielle
`tailscale/github-action@v4` avec un client OAuth et le tag `tag:ci`.

Dans Tailscale :

1. créer le tag `tag:ci` et autoriser ce tag à joindre le mini-PC sur TCP/22 ;
2. créer un client OAuth autorisé à créer des auth keys pour `tag:ci` ;
3. relever le nom MagicDNS ou l'IP Tailscale du mini-PC.

Dans GitHub > Settings > Secrets and variables > Actions, créer :

- `TS_OAUTH_CLIENT_ID`
- `TS_OAUTH_SECRET`
- `DEPLOY_HOST` : nom MagicDNS ou IP Tailscale du mini-PC
- `DEPLOY_SSH_PRIVATE_KEY` : clé privée SSH dédiée au déploiement

La clé publique correspondante doit être ajoutée dans
`/home/valou/.ssh/authorized_keys` sur le mini-PC.

## GHCR

Les images publiées sont :

- `ghcr.io/valerianguivarch/lsr-api-jdr:<sha>`
- `ghcr.io/valerianguivarch/lsr-api-yeardiary:<sha>`
- `ghcr.io/valerianguivarch/lsr-web:<sha>`
- `ghcr.io/valerianguivarch/lsr-admin-jdr:<sha>`

Le workflow se connecte temporairement à GHCR sur le mini-PC avec le
`GITHUB_TOKEN` du job, effectue le pull, puis se déconnecte. Aucun token GHCR
permanent n'est nécessaire sur la machine.

## Déploiement manuel de secours

Après une authentification `docker login ghcr.io`, un commit précis peut être
redéployé avec :

```bash
cd ~/services/lsr-nestjs-backend
./deploy/linux/scripts/deploy-main.sh <sha-complet-de-main>
```

Le script refuse les branches autres que `main`, les modifications Git suivies
localement, et un SHA qui ne correspond pas exactement au HEAD de `main`.
