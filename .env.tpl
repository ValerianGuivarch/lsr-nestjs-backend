# node
NODE_ENV=production
# jwt
JWT_SECRET=changeme
# http
PORT=8081
YEARDIARY_PORT=8080
# PF2 MJ: PDFs stay outside the repository. Default from the repository root: ../../PF2/MJ
# PF2_LIBRARY_ROOT=../../PF2/MJ
# PF2_DATA_ROOT=apps/web-misc/src/pf2-mj/data
# PF2_IMAGE_ROOT=../../PF2/pnj
# Carte de Golarion : ressources lourdes externes au dépôt (PMTiles, sprites, polices, index)
# GOLARION_MAP_ASSETS_DIR=../../GolarionMapData
# GOLARION_MAP_PUBLIC_ORIGIN=
HOST=127.0.0.1

# jdr admin (apps/admin-jdr) - Basic Auth gating the admin frontend only, not the JDR API
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme

# web front (apps/web-l7r)
REACT_APP_API_URL=http://127.0.0.1:8081/api/v1
API_URL=http://127.0.0.1:8081/api/v1

# year diary
FRONTEND_URL=http://127.0.0.1:3000

# database
DB_URI=postgres://postgres:postgres@localhost:5432/default-database
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=starter-database

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
