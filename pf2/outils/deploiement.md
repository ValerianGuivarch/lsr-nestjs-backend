# Déploiement PF2 — production, CI et mini-PC

[← Outils](../../OUTILS.md)

## 19. Variables importantes

```text
SQLITE_PATH
PF2_LIBRARY_ROOT
PF2_DATA_ROOT
FOUNDRY_ASSETS_ROOT
FOUNDRY_REST_URL
FOUNDRY_REST_API_KEY
FOUNDRY_XPC_FLAG_SCOPE
DISCORD_BOT_TOKEN
DISCORD_CLIENT_ID
DISCORD_GUILD_ID
DISCORD_SUMMARIES_CHANNEL_NAME
GOLARION_MAP_ASSETS_DIR
```

Le scope XPC doit rester aligné avec :

```text
pf2e-val-toolkit
```

---

---

## 20. Procédure de mise à jour de ce fichier

Après toute modification d’architecture :

1. mettre à jour le schéma Mermaid si un flux change ;
2. mettre à jour la section « Sources de vérité » ;
3. mettre à jour les tables/chemins concernés ;
4. déplacer un élément de « dettes » vers « fonctionnement actuel » lorsqu’il est réellement opérationnel ;
5. ne pas conserver ici un changelog détaillé ;
6. supprimer les règles historiques devenues fausses au lieu de les laisser cohabiter ;
7. vérifier explicitement la section XPC.

Ce fichier doit rester un **manuel d’état courant**, pas un journal de toutes les migrations passées.

---

---

## 22. Dépôt, mini-PC et déploiement de production

Cette section décrit le fonctionnement opérationnel courant. En cas de contradiction avec une ancienne procédure tmux, un ancien watcher ou un document de déploiement historique, **cette section et les fichiers de déploiement courants font foi**.

### 22.1 Dépôt et branche de référence

Le dépôt applicatif est :

```text
ValerianGuivarch/lsr-nestjs-backend
```

Le dépôt est public. **Aucun secret, token, clé privée, contenu de `.env` ou donnée de production ne doit être ajouté au Git.**

La branche canonique de production est :

```text
main
```

Flux normal :

```text
branche de travail
→ pull request vers main
→ CI verte
→ merge
→ déploiement automatique
```

Une modification directe de `main` déclenche immédiatement le workflow de production et doit rester exceptionnelle.

### 22.2 CI de pull request

Le workflow :

```text
.github/workflows/ci.yml
```

s’exécute sur les pull requests vers `main`. Il valide la configuration Docker Compose et construit les quatre cibles de production :

- `api-jdr` ;
- `api-yeardiary` ;
- `web-misc` ;
- `admin-jdr`.

La CI de PR ne déploie rien sur le mini-PC.

### 22.3 Déploiement automatique après merge

Le workflow de production est :

```text
.github/workflows/deploy.yml
```

Tout push sur `main` déclenche :

```text
GitHub Actions
→ build et publication des images Docker avec le SHA exact
→ runner GitHub éphémère dans Tailscale (tag:ci)
→ SSH privé vers le mini-PC
→ mise à jour du checkout de déploiement
→ docker compose pull
→ démarrage des services cœur avec attente des healthchecks
→ tentative séparée de démarrage des services Recalbox, non bloquante pour le cœur
```

Images :

```text
ghcr.io/valerianguivarch/lsr-api-jdr:<sha>
ghcr.io/valerianguivarch/lsr-api-yeardiary:<sha>
ghcr.io/valerianguivarch/lsr-web:<sha>
ghcr.io/valerianguivarch/lsr-admin-jdr:<sha>
```

Le mini-PC **ne construit plus l’application** et **ne poll plus GitHub**. Les anciens `watch-main.sh` et `lsr-deploy-watch.service` ont été supprimés. L’application principale ne doit plus être démarrée avec l’ancien tmux/npm.

### 22.4 Tailscale et SSH

Le mini-PC est membre du tailnet Tailscale. Le runner GitHub rejoint temporairement ce réseau avec :

```text
tailscale/github-action@v4
```

et le tag :

```text
tag:ci
```

Secrets GitHub Actions requis :

```text
TS_OAUTH_CLIENT_ID
TS_OAUTH_SECRET
DEPLOY_HOST
DEPLOY_SSH_PRIVATE_KEY
```

Ne jamais écrire leurs valeurs dans le dépôt ou dans ce document.

`DEPLOY_SSH_PRIVATE_KEY` sert uniquement à la connexion :

```text
GitHub Actions → mini-PC
```

Elle ne sert pas à authentifier le mini-PC auprès de GitHub.

Le clone historique du mini-PC peut avoir un remote SSH. Le déploiement fait volontairement son fetch via l’URL publique HTTPS :

```text
https://github.com/ValerianGuivarch/lsr-nestjs-backend.git
```

Ne pas ajouter une clé GitHub permanente au mini-PC pour ce besoin : le dépôt est public et le fetch HTTPS évite une credential supplémentaire.

### 22.5 Clone de production sur le mini-PC

Chemin :

```text
/home/valou/services/lsr-nestjs-backend
```

Script de déploiement :

```text
deploy/linux/scripts/deploy-main.sh <sha-complet>
```

Le script :

1. refuse des modifications Git suivies localement ;
2. vérifie que la version demandée correspond toujours au `main` distant ;
3. vérifie que le checkout de déploiement correspond exactement au SHA demandé ;
4. prépare l'environnement runtime local ;
5. pull les images GHCR de ce SHA ;
6. démarre avec `--wait` les services cœur `api-jdr`, `api-yeardiary`, `admin`, `map` et `web` ;
7. tente ensuite de démarrer `api-recalbox` et `web-recalbox` séparément : une indisponibilité Recalbox produit un avertissement mais ne doit pas faire échouer le cœur de l'application ;
8. rafraîchit ensuite la stack MediaWiki depuis le checkout de déploiement.

**Ne jamais utiliser `git clean`, `git reset --hard` ou une suppression globale sur ce clone sans audit préalable.** Le mini-PC contient des fichiers locaux, sauvegardes et données non suivis qui doivent être préservés.

### 22.6 Stack Docker principale

Fichier :

```text
deploy/linux/docker-compose.yml
```

Stack :

```text
lsr-app
```

| Service | Port hôte | Image |
|---|---:|---|
| `api-jdr` | 3333 | `lsr-api-jdr` |
| `api-yeardiary` | 8081 | `lsr-api-yeardiary` |
| `web` | 3000 | `lsr-web` |
| `admin` | 4203 | `lsr-admin-jdr` |

Healthchecks actuels :

```text
api-jdr       http://127.0.0.1:3333/health
web           http://127.0.0.1/
admin         http://127.0.0.1/healthz
api-yeardiary http://127.0.0.1:8081/api/v1/diaries
```

Le healthcheck YearDiary considère actuellement tout statut inférieur à 500 comme vivant ; un endpoint `/health` dédié serait plus propre à terme.

**Recalbox est un sous-système optionnel.** Le web principal ne dépend pas de `web-recalbox` pour démarrer. Une panne du partage CIFS Recalbox ou de `api-recalbox` ne doit donc pas rendre `l7r.fr` indisponible ; seules les fonctions Recalbox sont alors dégradées.

### 22.7 Données persistantes

Les images GHCR sont jetables. Les données restent sur le mini-PC et sont montées dans les conteneurs :

```text
pf2.sqlite            → /app/data/pf2.sqlite
jdr-database.sqlite   → /app/data/jdr-database.sqlite
database.sqlite       → /app/data/database.sqlite
storage/              → /app/storage
../pf2-data           → /app/pf2-library      (lecture seule)
assets Foundry l7r    → /app/foundry-assets   (lecture seule)
```

Le `.env` de production reste local au mini-PC. Il n’est ni publié dans GHCR ni versionné.

### 22.8 Services séparés

Le passage à Docker/GHCR concerne l’application principale. Les services suivants restent dans leurs propres stacks et ne doivent pas être modifiés lors d’un déploiement applicatif ordinaire :

- Foundry VTT ;
- Foundry REST Relay ;
- Wiki/MediaWiki ;
- leurs volumes et données associés.

L’API principale parle notamment aux services hôte via :

```text
Foundry REST Relay : host.docker.internal:3010
MediaWiki API       : host.docker.internal:4205/api.php
```

### 22.9 Règles pour une future discussion

Quand une nouvelle discussion doit modifier ou déployer l’application :

1. lire d’abord `PF2_WORKSPACE.md` et l’index spécialisé (`OUTILS.md` pour la technique, `UNIVERS.md`, `PJ.md` ou `CAMPAGNES.md` pour la continuité) ;
2. considérer `main` comme la référence de production ;
3. pour un changement normal, créer une branche et une PR vers `main` ;
4. laisser GitHub Actions construire et publier les images ; ne pas faire de build de production sur le mini-PC ;
5. après merge, vérifier le workflow `Build and deploy`, puis l’état de `lsr-app` si nécessaire ;
6. ne jamais exposer les secrets GitHub/Tailscale/SSH ni le contenu du `.env` ;
7. préserver les SQLite, `storage/`, `pf2-data` et les fichiers locaux non suivis ;
8. ne pas relancer l’ancienne application npm/tmux ;
9. ne pas toucher aux stacks Foundry/Relay/Wiki sauf si la tâche les concerne explicitement ;
10. si un déploiement retourne `git@github.com: Permission denied (publickey)`, vérifier que le fetch reste en HTTPS plutôt que d’ajouter une nouvelle clé GitHub sur le serveur.

Fichiers techniques de référence :

```text
.github/workflows/ci.yml
.github/workflows/deploy.yml
deploy/linux/Dockerfile
deploy/linux/docker-compose.yml
deploy/linux/scripts/deploy-main.sh
deploy/linux/README.md
```
