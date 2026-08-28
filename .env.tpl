# node
NODE_ENV=production
# jwt
JWT_SECRET=changeme
# http
PORT=8081
YEARDIARY_PORT=8081
JDR_PORT=3333
# PF2 MJ: PDFs stay outside the repository. Default from the repository root: ../../PF2/MJ
# PF2_LIBRARY_ROOT=../../PF2/MJ
# PF2_DATA_ROOT=apps/web-misc/src/pf2-mj/data
# Persistance PF2 : SQLite contient les référentiels et la curation ; les médias restent sur disque.
# SQLITE_PATH=/app/data/pf2.sqlite
# STORAGE_PATH=/app/storage
# API_BASE_URL=http://127.0.0.1:3333
# CORS_ORIGINS=http://localhost:3000,https://pf2.l7r.fr
# Portraits PNJ PF2 MJ : répertoire d'assets partagé avec Foundry VTT.
# En production : /volume1/docker/foundry/data/Data/assets/l7r
# FOUNDRY_ASSETS_ROOT=../../FoundryVTT/Data/assets/l7r
# Carte de Golarion : ressources lourdes externes au dépôt (PMTiles, sprites, polices, index)
# GOLARION_MAP_ASSETS_DIR=../../GolarionMapData
# GOLARION_MAP_PUBLIC_ORIGIN=
# GOLARION_MAP_HOST=0.0.0.0
# GOLARION_MAP_PORT=4204
# Niveau de détail fixe de la carte PJ : essential, standard ou detailed
# GOLARION_MAP_PJ_DETAIL=standard
# NAS public : désactive le WebSocket de hot reload Vite derrière nginx.
# VITE_DISABLE_HMR=true
# Wiki XWiki et Foundry REST relay : voir support/xwiki/ et support/foundry-rest/ (services independants, .env dedies).
# Intégration Foundry REST (api-jdr → relay local/self-hosted → monde Foundry).
# FOUNDRY_REST_URL=http://127.0.0.1:3010
# FOUNDRY_REST_API_KEY=remplacer-par-la-cle-du-relay
# Scope Foundry du flag XPC : doit correspondre à l'id du Toolkit Foundry.
# FOUNDRY_XPC_FLAG_SCOPE=pf2e-val-toolkit

# Discord PF2-Bot (laissez ces valeurs vides pour désactiver Discord).
DISCORD_BOT_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
HOST=127.0.0.1

# jdr admin (apps/admin-jdr) - Basic Auth gating the admin frontend only, not the JDR API
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme

# web front (apps/web-l7r)
REACT_APP_API_URL=http://127.0.0.1:8081/api/v1
API_URL=http://127.0.0.1:8081/api/v1

# year diary
FRONTEND_URL=http://127.0.0.1:3000

# PostgreSQL est historique et n'est pas nécessaire à cette branche : api-jdr
# et api-yeardiary utilisent SQLite. Ces variables ne sont à définir que pour
# les anciens composants ou une autre branche qui les requiert.
# DB_URI=postgres://postgres:postgres@localhost:5432/default-database
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=postgres
# DB_NAME=starter-database

#super admin
SUPER_ADMIN_EMAIL=superadmin@email.com
SUPER_ADMIN_NAME=changeme
SUPER_ADMIN_PASSWORD=changeme

# forest admin
FOREST_ENV_SECRET=changeme
FOREST_AUTH_SECRET=changeme

# twilio
TWILIO_ACCOUNT_SID=changeme
TWILIO_AUTH_TOKEN=changeme
TWILIO_MESSAGING_SERVICE=changeme


# Prismic
PRISMIC_URI=changeme
PRISMIC_TOKEN=changeme
