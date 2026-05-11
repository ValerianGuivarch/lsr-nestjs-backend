# Plan d’architecture Ghost Escape Game (NX Monorepo)

## Objectif
Système web pour piloter un escape game live inspiré de Phasmophobia, 100% web, multi-device, MVP simple, scalable ensuite.

---

## Structure Générale du Projet

### 1. Backend : ghost-api (NestJS)
- Dossier : `apps/api-ghost`
- API HTTP simple (pas de WebSocket pour le MVP)
- Stockage en mémoire (état de session, devices, rôles)
- CORS activé pour les apps front
- Endpoints principaux :
  - `GET /api/player/devices` : liste des devices connus (pour choix sur mobile)
  - `GET /api/player/state?deviceId=xxx` : état du device
  - `GET /api/admin/state` : état global
  - `POST /api/admin/device/:deviceId/state` : maj état device
  - `POST /api/admin/device/:deviceId/role` : attribuer un rôle à un device
  - `POST /api/admin/reset` : reset session
- Modèle device :
  ```ts
  {
    deviceId: string,
    role: 'emf' | 'spiritbox' | 'uv' | 'cam' | ...,
    mode: string,
    emfLevel?: number,
    huntActive: boolean,
    message?: string,
    updatedAt: string
  }
  ```

### 2. Dashboard MJ : ghost-dashboard (React)
- Dossier : `apps/web-ghost-dashboard`
- Interface de contrôle pour le MJ
- Affiche la liste des devices (joueuses)
- Pour chaque device :
  - Attribuer un rôle (EMF, Spirit Box, UV, Cam, etc)
  - Contrôler l’état (EMF level, hunt, message, reset...)
- Dark theme, UX type van Phasmophobia
- Responsive laptop/tablette

### 3. Application mobile joueuse : ghost-player (React/PWA)
- Dossier : `apps/web-ghost-player`
- PWA mobile fullscreen
- Au lancement :
  - Menu de choix/saisie du deviceId (liste fournie par le backend)
  - Récupère le rôle/mode attribué par le MJ
  - Affiche l’UI adaptée au rôle (EMF, Spirit Box, etc)
  - Polling HTTP toutes les 500ms/1s pour l’état
- UI immersive, sombre, adaptée mobile
- PWA manifest, support fullscreen

---

## Flows Fonctionnels

### Joueur·se (ghost-player)
1. Ouvre l’app sur mobile
2. Choisit son deviceId dans la liste
3. L’app récupère le rôle/mode attribué par le MJ
4. L’UI s’adapte (EMF, Spirit Box, etc)
5. Polling HTTP pour l’état

### MJ (ghost-dashboard)
1. Ouvre le dashboard
2. Voit la liste des devices
3. Attribue un rôle à chaque device
4. Contrôle l’état de chaque device (EMF, hunt, message...)
5. Peut reset la session

---

## Extensions prévues
- Ajout WebSocket pour temps réel
- Authentification
- Persistance (BDD)
- Plus de rôles/devices
- Effets spéciaux, logs, etc.

---

## Conventions NX
- Respect strict des patterns apps/libs, configs, tags, structure, lint/test/build
- Réutilisation de libs partagées si besoin
- Typage fort, code simple, scalable

---


## Dossiers à créer / à adapter
- `apps/api-ghost` (NestJS)
- `apps/web-ghost-dashboard` (React)
- `apps/web-ghost-player` (React/PWA)
- Renommer la lib métier existante `libs/phasmo` en `libs/ghost` (sera utilisée pour le backend ghost-api)

---

## MVP :
- 1 rôle device : EMF
- 1 device test
- Contrôle EMF/hunt/message
- UI mobile immersive
- Dashboard simple, efficace
- Pas d’auth, pas de BDD, pas de WebSocket
