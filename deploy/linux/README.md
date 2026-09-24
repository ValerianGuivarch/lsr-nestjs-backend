# Déploiement Linux du mini-PC

Ce dossier remplace l'ancien packaging Synology. Il reproduit les quatre processus
actuellement lancés par `npm run start` sous forme de conteneurs :

- `api-jdr` sur le port 3333 ;
- `api-yeardiary` sur le port 8081 ;
- `web` sur le port 3000 ;
- `admin` sur le port 4203, protégé par le Basic Auth existant.

Foundry, son relay et MediaWiki restent dans leurs stacks Docker actuelles.

## Données persistantes

Les images ne contiennent aucune base de production. Par défaut, Compose monte :

- `../../pf2.sqlite` vers `/app/data/pf2.sqlite` ;
- `../../jdr-database.sqlite` vers `/app/data/jdr-database.sqlite` ;
- `../../database.sqlite` vers `/app/data/database.sqlite` ;
- `../../storage` vers `/app/storage` ;
- `../../../pf2-data` en lecture seule comme bibliothèque PF2 ;
- `../../../foundry/data/Data/assets/l7r` en lecture seule comme repli d'assets Foundry.

Ces chemins correspondent au mini-PC actuel depuis `deploy/linux`. Ils peuvent
être remplacés avec `APP_STATE_DIR`, `APP_STORAGE_DIR`, `PF2_LIBRARY_DIR` et
`FOUNDRY_ASSETS_DIR`.

Les secrets continuent de venir du `.env` racine, ignoré par Git.

## Premier basculement depuis tmux

Ne lancez pas les conteneurs applicatifs tant que l'ancien `npm run start`
occupe 3000, 3333, 8081 et 4203.

Après merge de cette PR et `git pull --ff-only` sur le mini-PC :

1. arrêter uniquement la session tmux qui exécute l'application ;
2. depuis la racine du dépôt, lancer
   `./deploy/linux/scripts/deploy-main.sh --force` ;
3. vérifier `docker compose -f deploy/linux/docker-compose.yml ps` et les URLs ;
4. laisser les autres stacks Docker (Foundry, relay, MediaWiki) inchangées.

Les conteneurs utilisent `restart: unless-stopped` et repartiront avec Docker
après un redémarrage du mini-PC.

## Déploiement automatique après merge sur main

Le watcher fait un `git fetch origin main` toutes les 60 secondes. En présence
d'un nouveau commit il exige un arbre Git suivi propre, avance `main` en
fast-forward, construit les quatre images puis applique Compose avec `--wait`.
Un échec de build n'arrête pas les conteneurs déjà en cours.

Installation en service utilisateur :

```bash
mkdir -p ~/.config/systemd/user
ln -sf "$HOME/services/lsr-nestjs-backend/deploy/linux/systemd/lsr-deploy-watch.service" \
  "$HOME/.config/systemd/user/lsr-deploy-watch.service"
systemctl --user daemon-reload
systemctl --user enable --now lsr-deploy-watch.service
```

Pour que le watcher fonctionne même sans session utilisateur ouverte après un
reboot, activer une fois le lingering (nécessite sudo) :

```bash
sudo loginctl enable-linger "$USER"
```

Logs du watcher :

```bash
journalctl --user -u lsr-deploy-watch.service -f
```

## Sécurité

Le dépôt est public : aucun secret n'est commité et aucun runner GitHub
self-hosted n'est exposé au code des pull requests. Le mini-PC tire lui-même les
changements de `main`. GitHub Actions ne fait que valider les builds.

Le compte qui exécute ce watcher doit déjà avoir le droit d'utiliser Docker.
Cela équivaut pratiquement à un accès root ; ce droit ne doit pas être donné au
futur compte Linux dédié à Remote Desktop Commander.
