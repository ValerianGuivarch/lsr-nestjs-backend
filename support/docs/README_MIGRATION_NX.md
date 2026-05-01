# Migration vers Nx (plan progressif)

## Objectif

Séparer le backend actuel en 2 applications NestJS distinctes :

- `api-l7r`
- `api-hp`

Puis ajouter ensuite :

- `web-l7r` (React)

## Constat actuel

- Les couches `hp` et `l7r` sont agrégées dans un `AppModule` unique.
- Le module racine contient à la fois des contrôleurs/provideurs `hp` et `web` (`l7r`).
- Une partie des éléments `hp` dépend de composants transverses historiques (`data/errors`, config, etc.).

## Principes de migration

- Migration incrémentale (pas de big bang).
- Conserver l’API existante en fonctionnement pendant la transition.
- Extraire d’abord les frontières fonctionnelles (modules) avant le déplacement physique des fichiers.
- Introduire des bibliothèques partagées uniquement pour le réellement commun.

## Cible Nx

### Apps

- `apps/api-l7r` : API NestJS L7R
- `apps/api-hp` : API NestJS HP
- `apps/web-l7r` : front React (phase 2)

### Libs (exemples)

- `libs/shared/config`
- `libs/shared/errors`
- `libs/shared/postgres`
- `libs/l7r/domain`
- `libs/l7r/data-access`
- `libs/l7r/feature-api`
- `libs/hp/domain`
- `libs/hp/data-access`
- `libs/hp/feature-api`

## Plan en 6 phases

## Statut actuel (mise à jour du 2026-05-01)

- ✅ `api-hp` et `api-l7r` sont des apps Nx et sont localisées sous `apps/`.
- ✅ Les 2 entrypoints API sont minces (`apps/api-hp/src/main.ts`, `apps/api-l7r/src/main.ts`).
- ✅ Les builds passent pour les deux APIs : `nx build api-hp` et `nx build api-l7r`.
- ✅ Les entrypoints API n'utilisent plus le scaffold Nest généré par défaut (`src/app/*`).
- ⚠️ Le backend reste en mode de transition avec des shims legacy conservés pour compatibilité.

## Exécution recommandée en micro-étapes (anti big-bang)

Objectif : livrer la migration en incréments petits, testables, et réversibles.

## Rectification de trajectoire — backend d'abord

État constaté : le workspace est actuellement dans un état hybride.

- une partie du domaine a été copiée dans des libs Nx ;
- une partie importante du backend vit encore sous `src/main` ;
- certaines apps Nx pointent encore indirectement vers l'ancien arbre.

Ce n'est pas la cible.

La suite doit donc être cadrée ainsi :

1. **geler les évolutions front non critiques** ;
2. **déplacer physiquement le backend dans les libs Nx** ;
3. **ne laisser dans `api-l7r` et `api-hp` que des entrypoints minces** ;
4. **supprimer l'état hybride ensuite**.

### Ordre backend imposé

#### B1 — Infrastructure partagée backend

Déplacer vers `libs/shared/backend` :

- `bootstrap-api.ts`
- `config/configuration.ts`
- `data/database/postgres.module.ts`

Critère de sortie :

- `api-l7r` et `api-hp` n'importent plus ces fichiers depuis `src/main`.

#### B2 — Backend L7R complet

Déplacer vers `libs/l7r/backend` :

- `src/main/domain/**`
- `src/main/data/**` utiles à L7R
- `src/main/web/**`
- `src/main/config/evolutions/**` utiles à L7R
- les modules `L7rModule` / `AppL7rModule`

Critère de sortie :

- `api-l7r` n'importe plus rien depuis `src/main`.

#### B3 — Backend HP complet

Déplacer vers `libs/hp/backend` :

- `src/main/hp/**`
- les modules `HpModule` / `AppHpModule`

Critère de sortie :

- `api-hp` n'importe plus rien depuis `src/main`.

#### B4 — Nettoyage legacy

Une fois `api-l7r` et `api-hp` branchées uniquement sur les libs Nx :

- supprimer les doublons temporaires ;
- réduire `src/main` au minimum, voire le retirer comme source applicative.

Critère de sortie :

- plus aucun import applicatif runtime vers `src/main` depuis les apps Nx.

### Étape A — Stabilisation toolchain front (fait)

- ✅ Dépendances React installées dans le workspace racine.
- ✅ Build Nx validée sur les 4 apps front (`web-l7r`, `web-hp`, `web-misc`, `web-year-diary`).

Critère de sortie :

- `nx run-many -t build -p web-l7r,web-hp,web-misc,web-year-diary` passe en vert.

### Étape B — Vertical slice `web-l7r` (fait)

1. Remplacer le scaffold Nx (`app/nx-welcome`) par le routeur réel L7R.
2. Brancher Redux Provider et état local nécessaire.
3. Corriger les imports vers `libs/shared` et `libs/l7r/domain`.
4. Vérifier `nx build web-l7r` puis `nx serve web-l7r`.

Critère de sortie :

- Les routes L7R principales répondent (`/`, `/characters/:characterName`, `/mj`).
- ✅ Build `web-l7r` valide.

### Étape C — Vertical slice `web-hp` (fait)

1. Bootstrap React dédié HP.
2. Routes HP minimales (`/hp/:wizardName`, `/hp/create`, `/hp/update/:wizardName`, `/hp/spell`).
3. Brancher contracts `libs/hp` et API client partagé.

Critère de sortie :

- Navigation HP fonctionnelle et build verte.
- ✅ Build `web-hp` valide.

### Étape D — Vertical slice `web-misc` (fait)

1. Bootstrap React dédié wedding photos.
2. Vérifier assets statiques (`so-lover/clover.png`).
3. Valider routes (`/golf`, `/selfie`, `/wall`, `/admin`, `/so-lover`, `/foussier`).

Critère de sortie :

- Pages wedding affichées sans erreur runtime.
- ✅ Build `web-misc` valide.

### Étape E — Vertical slice `web-year-diary` (fait)

1. Bootstrap React dédié Diary.
2. Isoler les dépendances Diary (pas de couplage fort L7R/HP).

Critère de sortie :

- Route diary disponible et build verte.
- ✅ Build `web-year-diary` valide.

### Étape F — Normalisation libs + frontières Nx

1. Nettoyer `index.ts` des libs (exports explicites, suppression placeholders générés).
2. Ajouter tags Nx par couche (`type:app`, `type:feature`, `type:data-access`, `type:domain`, `scope:l7r`, `scope:hp`, `scope:shared`).
3. Activer/renforcer `enforce-module-boundaries`.

Critère de sortie :

- Imports croisés interdits automatiquement par lint.

### Phase 0 — Préparation (dans le repo actuel)

1. Créer un module `L7rModule` qui regroupe les contrôleurs/providers non-HP.
2. Créer un module `HpModule` qui regroupe les contrôleurs/providers HP.
3. Garder `AppModule` comme agrégateur temporaire.

Critère de sortie : comportement identique, build vert, tests verts.

### Phase 1 — Initialisation Nx

1. Initialiser Nx en mode intégré.
2. Générer `api-l7r` et `api-hp` (NestJS) sans déplacer immédiatement toute la logique.
3. Mettre en place les cibles CI : build, lint, test par app.

Critère de sortie : les 2 apps démarrent, même si une partie du code est encore partagée.

### Phase 2 — Extraction L7R

1. Déplacer progressivement le code L7R vers `libs/l7r/*`.
2. Déplacer les composants transverses réellement communs vers `libs/shared/*`.
3. Réduire les dépendances croisées vers HP.

Critère de sortie : `api-l7r` ne dépend plus du code métier HP.

### Phase 3 — Extraction HP

1. Déplacer progressivement le code HP vers `libs/hp/*`.
2. Éliminer les imports HP vers les couches L7R (hors `shared`).

Critère de sortie : `api-hp` ne dépend plus du code métier L7R.

### Phase 4 — Front React dans le monorepo

1. Générer `web-l7r` (React).
2. Connecter `web-l7r` à `api-l7r` via variables d’environnement et contrat API.
3. Ajouter éventuellement une lib `libs/l7r/api-client`.

Critère de sortie : front buildable/testable via Nx, pipeline unifié.

### Phase 5 — Durcissement

1. Ajouter les tags de libs Nx et règles de frontières (`enforce-module-boundaries`).
2. Interdire les imports croisés non autorisés.
3. Finaliser la stratégie migrations DB et versionning API.

Critère de sortie : architecture protégée par règles automatiques.

## Risques majeurs à traiter tôt

- Couplages cachés entre HP et L7R via providers/errors/helpers.
- Config environnement partagée non factorisée.
- Migrations DB non isolées par domaine.

## Stratégie DB recommandée

- Garder une base commune au début (pour limiter le risque).
- Séparer les schémas/logiques de migration par domaine (`l7r`, `hp`).
- Prévoir une séparation physique ultérieure seulement si nécessaire.

## Definition of Done (globale)

- `api-l7r` et `api-hp` déployables indépendamment.
- Aucune dépendance directe HP ↔ L7R hors libs `shared`.
- `web-l7r` intégré dans le monorepo et connecté à `api-l7r`.
- Pipelines CI par projet + exécution Nx affectée.
