# Unified Routing Refactor Plan

## Goal

Converge toward:

- one frontend shell
- one backend process
- one explicit routing model per domain
- no ambiguous dynamic routes such as `/hp/MJ` versus `/hp/:wizardName`
- optional domain activation so unused domains are not mounted unnecessarily

## Current Problems

### Frontend routing ambiguity

- `web-hp` exposes both `/hp/mj` and `/hp/:wizardName`
- `web-l7r` duplicates HP routes and mixes multiple domains in the same router
- `web-jdr` exposes `/:jdrSlug/MJ` next to `/:jdrSlug/:characterSlug`

Even when React Router resolves these today because of route order, the URL contract is weak and hard to evolve.

### Frontend fragmentation

- `web-l7r` already behaves like a partial shell by importing HP, misc, and year-diary pages
- `web-hp`, `web-year-diary`, `web-misc`, `web-jdr`, and ghost fronts still have separate entrypoints and separate launch flows

### Backend fragmentation

- multiple Nest entry files exist: `main-hp.ts`, `main-l7r.ts`, `main-yeardiary.ts`, `main-ghost.ts`
- there is already a central bootstrap pattern via `bootstrapApi`
- the main app already proxies some traffic, which proves a unified backend is viable

### Launch complexity

- `package.json` historically accumulated per-domain and per-stack launch commands
- the real intent is environment-driven activation, not many human-facing commands

## Target Architecture

### Backend

One Nest application mounts domain modules under explicit prefixes:

- `/api/hp/*`
- `/api/l7r/*`
- `/api/yeardiary/*`
- `/api/jdr/*`
- `/api/ghost/*`

Each domain is activated by configuration flags:

- `ENABLE_HP=true|false`
- `ENABLE_L7R=true|false`
- `ENABLE_YEARDIARY=true|false`
- `ENABLE_JDR=true|false`
- `ENABLE_GHOST=true|false`

If a domain is disabled:

- its module is not imported
- its routes are not mounted
- its dependencies are not initialized

### Frontend

One web shell exposes a stable top-level route per domain:

- `/hp/*`
- `/l7r/*`
- `/yeardiary/*`
- `/jdr/*`
- `/ghost/*`

Each domain is loaded lazily and shown only if enabled by runtime config.

## Target Route Table

### HP

Current risky routes:

- `/hp/mj`
- `/hp/:wizardName`

Target routes:

- `/hp`
- `/hp/characters/new`
- `/hp/characters/:wizardSlug`
- `/hp/characters/:wizardSlug/edit`
- `/hp/spells/new`
- `/hp/mj`

Rule:

- all dynamic entities go under `/characters/*`
- reserved pages never compete with a top-level dynamic segment

### L7R

Target routes:

- `/l7r`
- `/l7r/mj`
- `/l7r/characters/:characterSlug`
- `/l7r/characters/:characterSlug/edit`
- `/l7r/characters/:characterSlug/invocation`
- `/l7r/characters/:characterSlug/arcane-primes`
- `/l7r/characters/:characterSlug/munitions`
- `/l7r/characters/:characterSlug/cartouches`
- `/l7r/tools/date`
- `/l7r/tools/speaking`
- `/l7r/tools/stores`

### Year Diary

Target routes:

- `/yeardiary`
- `/yeardiary/diary`

### Misc

If this domain is kept as a separate product area, avoid polluting L7R root routes and move to:

- `/misc/golf`
- `/misc/foussier`
- `/misc/so-lover`
- `/misc/selfie`
- `/misc/wall`
- `/misc/admin`

If misc is intentionally part of L7R, rename it explicitly as `/l7r/misc/*` or `/l7r/events/*`.

### JDR

Current risky routes:

- `/:jdrSlug/MJ`
- `/:jdrSlug/:characterSlug`

Target routes:

- `/jdr/admin`
- `/jdr/:jdrSlug`
- `/jdr/:jdrSlug/feed`
- `/jdr/:jdrSlug/mj`
- `/jdr/:jdrSlug/mj/config`
- `/jdr/:jdrSlug/characters/:characterSlug`
- `/jdr/:jdrSlug/characters/:characterSlug/edit`

Rule:

- remove uppercase `MJ` from public URLs
- keep lowercase-only URLs for consistency

### Ghost

Target routes:

- `/ghost/mj`
- `/ghost/devices/:deviceId`

Possible evolution:

- `/ghost/player?device=...` becomes `/ghost/devices/:deviceId`
- dashboard becomes a normal route inside the shell instead of a standalone app

## Refactor Plan

### Phase 1: Normalize URL contracts

Goal:

- remove route ambiguity without yet merging all apps

Actions:

- update `web-hp` routes to move dynamic wizard pages under `/hp/characters/*`
- update `web-jdr` routes to move dynamic character pages under `/jdr/:jdrSlug/characters/*`
- replace uppercase `MJ` routes with lowercase canonical URLs and redirects
- update internal links, `navigate(...)`, and bookmarks in the codebase

Main files to touch:

- `apps/web-hp/src/main.tsx`
- `apps/web-jdr/src/app/App.tsx`
- `apps/web-l7r/src/main.tsx`
- HP pages that call `navigate('/hp/...')`
- JDR pages that call `navigate('/${jdrSlug}/...')`

Expected result:

- no more ambiguous matching
- stable route grammar before larger consolidation

### Phase 2: Introduce a frontend shell

Goal:

- one frontend entrypoint for all enabled domains

Actions:

- create a new shell app, or repurpose `web-l7r` into a true shell
- define top-level domain routers under `/hp`, `/l7r`, `/yeardiary`, `/jdr`, `/ghost`
- lazy-load each domain router
- provide runtime config endpoint or static config file to expose enabled domains
- migrate `web-hp`, `web-year-diary`, `web-jdr`, `web-ghost-*` routes into router modules consumed by the shell

Main files to touch:

- `apps/web-l7r/src/main.tsx` or new shell app entrypoint
- router extraction files for HP, L7R, JDR, ghost, year-diary
- API base URL configuration files in each frontend domain
- Vite config for the unified shell

Expected result:

- one frontend process
- one browser router
- feature areas still isolated by domain

### Phase 3: Unify backend runtime

Goal:

- one Nest process hosting all enabled domains

Actions:

- create a unified root module importing domain modules conditionally
- stop launching separate entry files for hp, l7r, year-diary, ghost in normal development
- migrate controllers to explicit `/api/<domain>` prefixes where missing
- replace reverse-proxy bridges with in-process domain mounting when possible

Main files to touch:

- `src/main/app.module.ts`
- `src/main/main.ts`
- `src/main/app-hp.module.ts`
- `src/main/app-l7r.module.ts`
- `src/main/main-yeardiary.ts`
- `src/main/main-ghost.ts`
- domain controllers and API clients using `/api/v1` assumptions

Expected result:

- one backend process
- one public API surface
- optional domain activation by env flags

### Phase 4: Simplify launch commands

Goal:

- one backend command and one frontend command

Target commands:

- `npm run dev:backend`
- `npm run dev:frontend`
- `npm run dev`

With env examples:

- `ENABLE_HP=true ENABLE_L7R=false ENABLE_GHOST=true npm run dev:backend`
- `VITE_ENABLE_HP=true VITE_ENABLE_L7R=false VITE_ENABLE_GHOST=true npm run dev:frontend`

Expected result:

- clean operational model
- domains activated intentionally, not by choosing a different app entrypoint

## Suggested File Strategy

### Backend composition

- keep domain modules in their current libraries
- add one `UnifiedAppModule` responsible only for orchestration
- avoid mixing domain business logic into the shell module

### Frontend composition

- extract route arrays or router modules per domain
- keep domain UI code in place
- let the shell compose routers rather than absorb all page code directly

## Main Risks

### URL compatibility

- bookmarks and external links will break if no redirects are kept

Mitigation:

- keep redirects during at least one transition phase

### Hardcoded API URLs

- several clients still assume `/api/v1` or domain-specific absolute paths

Mitigation:

- centralize API base construction per domain

### Hidden coupling inside `web-l7r`

- `web-l7r` currently imports HP, misc, and year-diary pages directly

Mitigation:

- treat it as temporary shell code and extract domain routers deliberately

### Nx and workspace tooling instability

- the current environment has Nx project graph issues tied to pnpm metadata

Mitigation:

- do not block routing refactor on full Nx cleanup
- keep launch scripts pragmatic until the graph is repaired

## Recommended Order Of Execution

1. Phase 1 first: route normalization and redirects
2. Phase 2 second: unified frontend shell
3. Phase 3 third: unified backend runtime with flags
4. Phase 4 last: final command simplification and removal of legacy entrypoints

## Decision Recommendation

Proceed with the unified model.

This repo is already halfway there:

- a shared backend bootstrap exists
- one frontend already aggregates multiple domains
- the current URL model is the real blocker, not the idea of convergence itself

The next safest implementation step is to start with Phase 1 and Phase 2 before touching deep backend composition.