# Déploiement PF2 provisoire sur Synology

Copier le contenu de ce dossier dans `/volume1/docker/pf2-app/`, puis cloner le
dépôt dans `/volume1/docker/pf2-app/source/` et créer `.env` depuis `.env.example`.
Les répertoires `data`, `storage` et `backups` sont des bind mounts : la base
SQLite n'est jamais conservée uniquement dans le conteneur.

```bash
cd /volume1/docker/pf2-app
cp .env.example .env
mkdir -p data storage/{portraits,illustrations,maps,documents} backups
docker compose up -d --build pf2-api pf2-web
curl http://127.0.0.1:3333/health
```

La première initialisation importe les JSON PF2 présents dans l'image seulement
si les catégories SQLite correspondantes sont vides. Elle n'écrase donc jamais
une curation ou un référentiel déjà persisté.

`pf2-wiki` et `pf2-bot` sont des emplacements Docker futurs (profil `future`).
Ils ne possèdent aucune base de données. L'XWiki historique reste inchangé dans
`support/xwiki/`; sa migration vers un client de l'API devra être un chantier
distinct, car XWiki nécessite MariaDB et ne peut pas utiliser SQLite comme
source de données.
