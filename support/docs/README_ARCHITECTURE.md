# project architecture

## quick overview

Le workspace est organisé comme un monorepo Nx avec une séparation par contexte métier :

- `apps/api-l7r` et `apps/api-hp` : points d'entrée NestJS.
- `libs/l7r` et `libs/hp` : backend applicatif de chaque contexte.
- `libs/l7r/domain` et `libs/hp/domain` : domaine métier canonique, sans dépendance Nest.
- `libs/shared` : bootstrap et composants techniques transverses.

## architecture

## backend

La cible est une lecture hexagonale simple :

- **Domain**
	- entités, modèles, enums, types métier purs
	- ports métier (`providers` historiques, à considérer comme des ports)
- **Application**
	- orchestration des cas d'usage
	- services métier qui manipulent le domaine via les ports
- **Infrastructure**
	- adaptateurs sortants : base de données, APIs externes, fichiers
	- adaptateurs entrants : contrôleurs HTTP
	- configuration / bootstrap technique

### Mapping actuel dans le repo

#### L7R

- `libs/l7r/domain` : domaine canonique L7R.
- `libs/l7r/src/lib/backend/domain/models` : shims vers `domain` pour compatibilité pendant la migration.
- `libs/l7r/src/lib/backend/domain/ports` : ports métier canoniques (barils).
- `libs/l7r/src/lib/backend/application/services` : services applicatifs canoniques (barils).
- `libs/l7r/src/lib/backend/domain/providers` : chemins legacy conservés.
- `libs/l7r/src/lib/backend/domain/services` : chemins legacy conservés.
- `libs/l7r/src/lib/backend/infrastructure/persistence` : infrastructure secondaire canonique (shims vers l’existant).
- `libs/l7r/src/lib/backend/infrastructure/http` : infrastructure primaire canonique (shims vers l’existant).
- `libs/l7r/src/lib/backend/data` : chemins legacy conservés.
- `libs/l7r/src/lib/backend/web` : chemins legacy conservés.

#### HP

- `libs/hp/domain` : domaine canonique HP.
- `libs/hp/src/lib/backend/domain/entities` : shims vers `hp-domain` pour compatibilité.
- `libs/hp/src/lib/backend/domain/ports` : ports métier canoniques.
- `libs/hp/src/lib/backend/application/services` : services applicatifs canoniques.
- `libs/hp/src/lib/backend/domain/providers` : shims legacy vers `domain/ports`.
- `libs/hp/src/lib/backend/domain/services` : shims legacy vers `application/services`.
- `libs/hp/src/lib/backend/infrastructure/persistence` : adaptateurs secondaires canoniques.
- `libs/hp/src/lib/backend/infrastructure/http` : adaptateurs primaires canoniques.
- `libs/hp/src/lib/backend/data` : shims legacy vers `infrastructure/persistence`.
- `libs/hp/src/lib/backend/web` : shims legacy vers `infrastructure/http`.

### Règles de rangement

1. Toute entité ou type métier partagé doit vivre dans la lib `*/domain` correspondante.
2. Le backend Nest ne doit contenir que :
	 - des ports,
	 - des services de cas d'usage,
	 - des adaptateurs techniques.
3. Les doublons locaux dans `backend/domain/entities` ou `backend/domain/models` doivent être des shims temporaires, jamais des sources canoniques.
4. Les nouveaux développements doivent éviter d'ajouter des fichiers métier directement dans `libs/*/src/lib`.

Architecture diagram:

`apps/api-*` → `libs/*/src/lib/backend/web` → `libs/*/src/lib/backend/domain/services` → `libs/*/src/lib/backend/domain/providers` → `libs/*/src/lib/backend/data`

avec les entités métier canoniques dans `libs/*/domain`.

# database management

- Les modules Nest TypeORM restent dans les backends (`libs/*/src/lib/backend/data/database`).
- Les entités TypeORM de persistance restent côté infrastructure.
- Les modèles métier purs restent dans `libs/*/domain`.

# technical workflows

## file upload

- Les endpoints HTTP résident dans `backend/web`.
- La logique métier d'orchestration reste dans les services.
- L'accès disque / traitement technique reste dans les adaptateurs d'infrastructure.


