# Spécification complète — Escape Game Ghost

> Générée par analyse statique du code source. Dernière lecture : mai 2026.
> Fichiers source : `libs/ghost/`, `apps/api-ghost/`, `apps/web-ghost-dashboard/`, `apps/web-ghost-player/`

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Infrastructure & démarrage](#2-infrastructure--démarrage)
3. [Modèle de données](#3-modèle-de-données)
4. [Les outils (ToolType)](#4-les-outils-tooltype)
5. [Machine à états du Van — le cœur du scénario](#5-machine-à-états-du-van--le-cœur-du-scénario)
6. [Système caméra & Ghost Cam](#6-système-caméra--ghost-cam)
7. [Système audio](#7-système-audio)
8. [Dashboard MJ — fonctionnalités détaillées](#8-dashboard-mj--fonctionnalités-détaillées)
9. [Tablettes joueurs — comportement détaillé](#9-tablettes-joueurs--comportement-détaillé)
10. [API HTTP complète](#10-api-http-complète)
11. [WebSocket — Spirit Box temps réel](#11-websocket--spirit-box-temps-réel)
12. [GameState — système parallèle](#12-gamestate--système-parallèle)
13. [Valeurs hardcodées dans le code](#13-valeurs-hardcodées-dans-le-code)
14. [Problèmes identifiés & dettes techniques](#14-problèmes-identifiés--dettes-techniques)
15. [Schéma de séquence complet](#15-schéma-de-séquence-complet)
16. [Checklist MJ — avant la partie](#16-checklist-mj--avant-la-partie)

---

## 1. Vue d'ensemble

L'escape Ghost est un jeu de chasse aux fantômes en salle. Des joueurs munis de tablettes utilisent des outils (EMF, caméra, Spirit Box…) pour identifier et bannir un fantôme. Un Maître du Jeu (MJ) contrôle l'ensemble depuis une console.

### Architecture

```
┌──────────────────────┐    HTTP polling    ┌──────────────────────────┐
│  web-ghost-player    │ ←────────────────► │  api-ghost               │
│  (tablettes joueurs) │                    │  NestJS / port GHOST_PORT │
└──────────────────────┘    WebSocket WS    │                          │
                           ←────────────── │  libs/ghost/             │
┌──────────────────────┐    HTTP polling    │  (GhostService,          │
│  web-ghost-dashboard │ ←────────────────► │   GhostController,       │
│  (console MJ)        │                    │   GhostAudioGateway)     │
└──────────────────────┘                    └──────────────┬───────────┘
                                                           │ TypeORM
                                                    ┌──────▼──────┐
                                                    │  ghost.sqlite│
                                                    │  tool_state  │
                                                    │  game_state  │
                                                    └─────────────┘
```

**Point d'entrée joueur :** `?device=<toolType>` dans l'URL  
**Préfixe API :** `/apil7r/api/...`  
**Base de données :** SQLite (`ghost.sqlite`), `synchronize: true` (auto-migration au démarrage)

---

## 2. Infrastructure & démarrage

### Démarrage serveur (`apps/api-ghost/src/main.ts`)

```typescript
bootstrapApi({
  rootModule: AppGhostModule,
  appName: 'Ghost',
  portEnvKey: 'GHOST_PORT'   // variable d'env pour le port
})
```

`AppGhostModule` importe `TypeOrmModule.forRoot({ name: 'ghost', type: 'sqlite', ... })` puis `GhostModule`.

### Données persistées vs en mémoire

| Donnée | Stockage | Survit au redémarrage |
|---|---|---|
| `ToolStateEntity` (états outils) | SQLite | ✅ oui |
| `GameStateEntity` (game state) | SQLite | ✅ oui |
| `frameBuffer` (frames caméra) | `Map` en mémoire | ❌ non |
| `spiritPlayerToMjBuffer` (audio Spirit Box) | `Map` en mémoire | ❌ non |
| `spiritMjToPlayerBuffer` (audio Spirit Box) | `Map` en mémoire | ❌ non |

> ⚠️ Un redémarrage du serveur efface toutes les frames caméra et les messages audio Spirit Box en cours.

---

## 3. Modèle de données

### 3.1 `ToolStateEntity` (table `tool_state`)

Une seule ligne par outil. La PK est `toolType` (string, ex. `"emf"`, `"van"`).

#### Colonnes communes (tous les outils)

| Colonne | Type | Défaut | Description |
|---|---|---|---|
| `toolType` | string (PK) | — | Identifiant de l'outil |
| `powerOn` | boolean | `true` | Outil allumé/éteint |
| `huntActive` | boolean | `false` | Chasse fantôme active (impacte tous les outils) |
| `message` | string? | `null` | Message libre (Spirit Box) |
| `emfLevel` | number? | `null` | Niveau EMF, 0..5 |
| `cameraColor` | `'green'\|'red'` | `'green'` | Filtre Ghost Cam |
| `temperature` | float | `20` | Thermomètre en °C |
| `ghostUntil` | string? | `null` | ISO timestamp : fantôme visible sur Ghost Cam jusqu'à cette date |
| `orbUntil` | string? | `null` | ISO timestamp : orbes visibles jusqu'à cette date |
| `photoModeUnlocked` | boolean | `false` | Bouton photo joueur déverrouillé |
| `updatedAt` | string | `new Date()` au boot | Auto (⚠️ voir §14.8) |

#### Colonnes spécifiques au Van (toolType = `"van"`)

| Colonne | Type | Défaut | Description |
|---|---|---|---|
| `ghostActivityLevel` | number | `0` | Activité du fantôme, 0..100 (⚠️ GHOST_OVERVIEW dit 0..10, c'est faux) |
| `playerSanity` | JSON string | `'{}'` | `{ "NomJoueur": 0..100 }` |
| `soundLevels` | JSON string | `'{}'` | `{ "NomPièce": 0..100 }` |
| `motionDetections` | JSON string | `'{}'` | `{ "NomPièce": boolean }` |
| `roomList` | JSON string | `'[]'` | Liste des noms de pièces |
| `motionSensorRooms` | JSON string | `'[]'` | Pièces équipées d'un capteur mouvement |
| `recentMotionAlert` | string? | `null` | Dernière pièce avec alerte mouvement |
| `missionObjectives` | JSON string | `'[]'` | `[{ objective: string, completed: boolean }]` |
| `floorPlanImage` | string? | `null` | URL ou base64 du plan de sol |
| `backgroundMusic` | JSON string | `'{"title":"","url":"","volume":70,"loop":true,"playing":false}'` | Musique de fond |
| `soundboard` | JSON string | `'[]'` | `[{ id, label, url, volume, lastTriggeredAt? }]` |
| `vanMessageTemplates` | JSON string | `'[]'` | Templates de messages MJ (non utilisés côté joueur) |
| `vanSentMessages` | JSON string | `'[]'` | Messages envoyés, feed joueur |
| **`vanStep`** | number | `0` | **Étape du scénario van, 0..7 (source de vérité)** |
| `vanPendingPhoto` | text? | `null` | Photo de peur en attente de validation (base64) |
| `vanFinalPhoto` | text? | `null` | Photo finale validée pour l'écran victoire (base64) |
| `vanFearMessageAt` | string? | `null` | ISO timestamp du dernier refus — déclenche overlay 4s côté joueur |

### 3.2 `GameStateEntity` (table `game_state`)

Système de gestion de partie parallèle (voir §12).

| Colonne | Type | Défaut | Description |
|---|---|---|---|
| `gameId` | string (PK) | — | `"hardcoded-game"` en pratique |
| `isInitialized` | boolean | `false` | |
| `isRunning` | boolean | `false` | |
| `startedAt` | string? | `null` | ISO timestamp |
| `initialSpectralActivity` | number | `20` | 0..100 |
| `accelerationRate` | number | `30` | Secondes entre chaque +5 d'activité |
| `currentSpectralActivity` | number | `20` | 0..100 — auto-incrémenté par timer |
| `currentScenarioStep` | number | `0` | Étape scénario côté MJ (5 étapes) |
| `scenarioObjectives` | JSON string | `'{}'` | Objectifs scénario (non utilisé joueur) |
| `updatedAt` | string | `new Date()` au boot | (⚠️ voir §14.8) |

---

## 4. Les outils (ToolType)

```typescript
enum ToolType {
  EMF = 'emf',
  SPIRITBOX = 'spiritbox',
  GHOSTCAM = 'ghostcam',
  GHOSTORBS = 'ghostorbs',
  THERMOMETER = 'thermometer',
  MOTION_SENSOR = 'motion_sensor',   // ⚠️ Non visible côté joueur (pas de vue dédiée)
  SOUND_DETECTOR = 'sound_detector', // ⚠️ Non visible côté joueur (pas de vue dédiée)
  VAN = 'van',
  MESSAGERIE = 'messagerie'
}
```

> `CANONICAL_TOOL_TYPES` dans `GhostService` ne liste que 6 outils : EMF, SPIRITBOX, GHOSTCAM, THERMOMETER, VAN, MESSAGERIE. Les outils `MOTION_SENSOR` et `SOUND_DETECTOR` existent en DB mais **ne sont jamais affichés en tant que devices joueur indépendants** — leurs données sont lues depuis le Van.

### Tableau des rôles joueur

| `toolType` | `role` joueur | Vue player | Contrôles MJ |
|---|---|---|---|
| `emf` | `emf` | `EmfDeviceView` — cadran EMF 0..5, bips sonores Web Audio | `emfLevel`, `huntActive`, `powerOn` |
| `spiritbox` | `spiritbox` | `SpiritBoxDeviceView` — fréquence radio, enregistrement micro → MJ | Sons preset + push audio MJ |
| `ghostcam` | `ghostcam` | `GhostCamDeviceView` — flux caméra Canvas (12 FPS) avec effets paranormaux | `ghostUntil`, `orbUntil`, `photoModeUnlocked`, capture frame |
| `ghostorbs` | `thermometer` | `ThermometerDeviceView` — même vue que thermomètre | `orbUntil`, `temperature` |
| `thermometer` | `thermometer` | `ThermometerDeviceView` | `temperature`, `powerOn` |
| `van` | `van` | Van progressif (steps 1..7) + ambiance sonore | Progression, activité, musique, messages |
| `messagerie` | `messagerie` | `MessagerieDeviceView` — feed texte/image/audio | `vanSentMessages` |

---

## 5. Machine à états du Van — le cœur du scénario

### 5.1 Étapes (1..7)

La progression côté joueur est pilotée par **`vanStep`** (côté MJ, persisté en DB) **combiné avec `missionObjectives`** (mis à jour par les joueurs van + MJ).

| Step | Nom affiché | Vue van | Déclencheur |
|---|---|---|---|
| 1 | Lecture du message | `VanStep0Intro` — bouton INITIALISER | Chargement initial / reset |
| 2 | Récupérer le matériel de localisation | `VanStep2Equipment` | Fin audio intro (automatique) |
| 3 | Trouver la zone d'activité | `VanStep2Equipment` + sélecteur salle | MJ avance (◀/▶) |
| 4 | Récupérer le matériel d'identification | `VanStep2Equipment` | Joueur valide salle correcte |
| 5 | Identifier le fantôme | `VanStep2Equipment` + champ nom spectre | MJ avance |
| 6 | Bannir le fantôme | `VanStep6Banish` | Joueur saisit le bon nom (hardcodé : "oni") |
| 7 | Victoire | `VanStep7Victory` + photo finale | MJ valide la photo de peur |

> **Note:** Les phases 2 à 6 utilisent toutes le même composant `VanStep2Equipment`. L'affichage change selon `currentStep` (prop) et `vanPhase` (état React). `VanStep1Puzzle` et `VanStep3Validation` **existent mais ne sont jamais rendus** (dead code).

### 5.2 Mapping phase ↔ objectifs

```
deriveDisplayedVanStep(objectives, persistedVanStep, hasFinalPhoto):
  objStep = nombre d'objectifs complétés (séquentiellement)
  fromObjectives = max(1, min(7, objStep + 1))
  persisted = vanStep de la DB (clampé 1..7)
  step = max(fromObjectives, persisted)
  si hasFinalPhoto → 7

phaseFromDisplayedStep(step): "step1" | "step2" | ... | "step7"
```

**Objectifs séquentiels (ordre fixe) :**
1. `"Intro terminee"` — coché à la fin de l'audio d'intro
2. `"Récupérer le matériel de localisation"` — coché par MJ (◀/▶)
3. `"Trouver la zone d'activité du fantôme"` — coché quand le joueur valide la bonne salle
4. `"Récupérer le matériel d'identification"` — coché par MJ
5. `"Identifier le fantôme"` — coché quand le bon nom est saisi
6. `"Bannir le fantôme"` — coché à la victoire (step 7)

> **Double source de vérité :** `vanStep` (DB, MJ-controlled) + `vanPhase` (React state, dérivé d'objectifs). La réconciliation est one-way : la phase ne peut qu'avancer (sauf reset). En cas de drift, le `max()` gagne.

### 5.3 Transitions détaillées

| Transition | Déclencheur | Mécanisme |
|---|---|---|
| start → 1 | Chargement initial / `POST /admin/reset` | `vanStep = 0` → affiché comme step 1 (intro) |
| 1 → 2 | Fin audio intro | `audio.onended` → `patchVanObjectives` coche "Intro terminee" + `vanStep: 2` |
| 2 → 3 | MJ clique ▶ | `PATCH /admin/device/van/van { vanStep: 3 }` |
| 3 → 4 | Joueur sélectionne "salle-de-bain-1" | `validateVanLocation` → patch objectif "Trouver zone" + `vanStep: 4` |
| 4 → 5 | MJ clique ▶ | `PATCH` van `{ vanStep: 5 }` |
| 5 → 6 | Joueur saisit `"oni"` (case-insensitive) | `declareGhost()` → patch objectifs + `vanStep: 6` |
| 6 → 7 | MJ valide la photo depuis GhostCam admin | `validateVanPhoto()` → `PATCH van { vanStep: 7, vanFinalPhoto: base64, vanPendingPhoto: null }` |
| n'importe → 1 | MJ clique ⟲ (reset) | `PATCH van { vanStep: 0, vanPendingPhoto: null, vanFinalPhoto: null, vanFearMessageAt: null, missionObjectives: '[]' }` |
| libre | MJ ◀/▶ | Clampé sur `[1, 7]` |

### 5.4 Sous-flux photo de peur (étapes 6→7)

```
Étape 6 activée
    │
    ▼
[Van joueur] Affiche VanStep6Banish (sourire + photo)
[GhostCam joueur] Bouton photo MASQUÉ (hidePhotoButton=true quand vanStep >= 6)
[GhostCam admin] Bouton photo capture la frame → PATCH vanPendingPhoto=base64
    │
    ▼
[GhostCam admin] Affiche cartouche "Photo de peur en attente de validation"
    │                           │
    ▼                           ▼
  [✓ Valider]              [✗ Refuser]
    │                           │
    ▼                           ▼
PATCH van:                 PATCH van:
  vanStep=7                  vanFearMessageAt=now()
  vanFinalPhoto=base64        vanPendingPhoto=null
  vanPendingPhoto=null
    │                           │
    ▼                           ▼
[Van joueur]               [GhostCam joueur]
VanStep7Victory            Overlay rouge 4s
+ photo                    "Pas assez effrayant. Recommence !"
                           puis retour caméra normale
```

### 5.5 Hints affichés aux joueurs (VanStep2Equipment)

| Objectif en cours | Hint affiché |
|---|---|
| Récupérer le matériel de localisation | "Récupérer le capteur EMF et le Thermomètre au rez-de-chaussée, ne montez pas à l'étage !" |
| Trouver la zone d'activité | "Utilisez le matériel de localisation pour repérer la pièce où se trouve le fantôme puis sélectionnez-la dans la liste déroulante." |
| Récupérer le matériel d'identification | "Récupérer la lampe UV, la Camera Ghost et la Spirit Box." |
| Identifier le fantôme | "Utilisez le matériel à votre disposition pour identifier le fantôme. Saisissez son nom après identification." |

---

## 6. Système caméra & Ghost Cam

### 6.1 Pipeline côté joueur

```
[Caméra tablette] → getUserMedia → <video hidden>
     │
     ▼ (setInterval 80ms = ~12 FPS)
[Canvas 480×360]
  1. drawImage(video)
  2. Overlay vert (rgba(0,255,125,0.32)) ou rouge (si fantôme + photo pausée)
  3. Scanlines (1 stroke groupé)
  4. Glitch lines aléatoires
  5. Grain vidéo
  6. Vignette (radialGradient, recréée si résolution change)
  7. Si ghostActive → sprite Colin2.png (ou fallback dessiné) avec jitter sinusoïdal
  8. Si orbsActive → 5 orbes animés
     │
     ▼ (si !ghostcamUploadInFlightRef)
  captureCanvas.toDataURL('image/jpeg', 0.35)
  POST /apil7r/admin/device/{deviceId}/camera-frame { frame: base64 }
```

**Résolution :** 480×360 px, JPEG quality 0.35, ~12 FPS  
**Optimisation :** 2 canvas (affichage + capture offscreen pour éviter la taint CORS du sprite)

### 6.2 Pipeline côté MJ

```
[GhostCam admin] → setInterval 100ms
  GET /apil7r/player/device/{ghostcamDeviceId}/camera-frame
  → { frame: base64 } → affichage <img>
```

### 6.3 Fantôme & Orbes

- **Fantôme (`ghostUntil`)** : ISO timestamp. Pendant `now < ghostUntil`, le sprite `Colin2.png` (depuis `/public/Colin2.png`, same-origin) est superposé avec animation sinusoïdale. Fallback : silhouette dessinée canvas si image non chargée.
- **Orbes (`orbUntil`)** : 5 orbes animés en cercles sur le canvas. Visible aussi sur le device `ghostorbs` (même caméra).
- **Teinte rouge** : active si `ghostActive && role === 'ghostcam' && photoPaused`. Signale visuellement au joueur qu'il doit prendre la photo maintenant.

### 6.4 Photo mode

Le bouton photo joueur nécessite un code PIN `1234` pour être déverrouillé (`useGhostCamPhotoMode`). Une fois déverrouillé, il est persisté via `PATCH /admin/device/{deviceId} { photoModeUnlocked: true }`.

---

## 7. Système audio

### 7.1 EMF (bips Web Audio)

Bips Web Audio synthétisés localement (oscillateur carré), sans réseau :

| emfLevel | Intervalle entre bips | Fréquence | Durée |
|---|---|---|---|
| 0 | ∞ (silence) | — | — |
| 1 | 900ms | 760 Hz | 0.035s |
| 2 | 720ms | 900 Hz | 0.04s |
| 3 | 520ms | 1020 Hz | 0.048s |
| 4 | 360ms | 1180 Hz | 0.055s |
| 5 | 230ms | 1340 Hz | 0.07s |

### 7.2 Spirit Box (temps réel WebSocket)

```
[Tablette joueur spiritbox]
  getUserMedia(audio) → ScriptProcessorNode (⚠️ deprecated)
  → PCM16 → base64 → emit('spiritbox:audio-chunk', { deviceId, chunk, ... })
  via Socket.IO /ghost-audio, room spiritbox:player:{deviceId}
      │
      ▼ [GhostAudioGateway] relay immédiat
      │
  → room spiritbox:admin:{deviceId}
      │
      ▼
[Dashboard MJ]
  createBufferSource → Web Audio → effets ghost voice FX :
    - LowPassFilter 1800Hz
    - WaveShaper (distortion, 8-bit)
    - TremoloOscillator
    - DelayStereo
    - GainNode
```

**Sons preset MJ (5 fichiers) :** `GhostVoix1..5.mp3` depuis `https://l7r.fr/l7r/`

**Polling alternatif (HTTP) :** `GET /admin/device/{id}/spiritbox/player-message` utilisé si WebSocket non disponible.

### 7.3 Audio Van

- **Musique de fond** : `backgroundMusic.url` → `<audio loop>`, controlée par MJ depuis le dashboard. Joue pendant steps 2..6 uniquement.
- **Soundboard** : liste de `{ id, url, volume, lastTriggeredAt }`. Le joueur van observe `lastTriggeredAt` : si la valeur change, lecture immédiate. Déclenchement MJ → PATCH van.
- **Messages audio** : `vanSentMessages` peut contenir des messages de type `'audio'` avec `audioUrl`. Le dernier message audio est joué automatiquement à la réception. **Le dashboard n'a pas d'UI pour envoyer un message audio** (uniquement texte/image).
- **Intro** : `GhostIntro.mp3` depuis `https://l7r.fr/l7r/GhostIntro.mp3`.

### 7.4 Audio Spirit Box (tablette joueur → affichage + bruit blanc)

La Spirit Box joueur affiche des bandes de fréquence et joue un bruit blanc avec effets. Le joueur peut "tuner" la fréquence (99.2 MHz par défaut, ±0.1 par clic). Quand le MJ envoie un son, la fréquence se "verrouille" temporairement (4s) et l'audio MJ est lu.

---

## 8. Dashboard MJ — fonctionnalités détaillées

### 8.1 Panneaux

Le dashboard (`web-ghost-dashboard/src/app/app.tsx`) a 3 panneaux (`HomePanel`) :

| Panneau | Accès | Contenu |
|---|---|---|
| `config` | Défaut | Liste des devices, statut, création device, config partie |
| `game` | `?panel=game` | GameState (initialiser/démarrer/arrêter), étapes scénario ESCAPE_STEPS |
| `admin` | `?panel=admin&adminRole=X&adminDevice=Y` | Outil admin selon le rôle sélectionné |

### 8.2 Admin tools (composants)

#### `VanAdminTool`

- **Slider activité fantôme** 0..100 avec boutons ±1 et ±10
- **Navigation step** : ◀ / ▶ (clampé 1..7) + badge `N/7` + label
- **Objectifs** en lecture seule (✓/○)
- **Étape calculée depuis objectifs** (info)
- **Mode caméra** (`resolveVanCameraMode`) :
  - `manual_locked` : step < 6, photoModeUnlocked = false
  - `manual_unlocked` : step < 6, photoModeUnlocked = true
  - `auto_mj_validation` : step >= 6
- **Bouton "Aller à l'admin caméra"** visible à step >= 6

#### `GhostCamAdminTool`

- **Preview caméra** (polling 100ms)
- **Bouton capture** (rond au centre) :
  - Step < 6 : capture normale, télécharge ou stocke selon config
  - Step >= 6 : `photoCaptureMode = true`, le PATCH envoie `vanPendingPhoto`
- **Cartouche validation photo** (si `vanPendingPhoto` présent) :
  - ✓ Valider → step 7 + `vanFinalPhoto`
  - ✗ Refuser → `vanFearMessageAt = now()`
- **Apparition fantôme** : select device + durée → `PATCH ghostcam { ghostUntil: now + Xs }`
- **Apparition orbes** : select device + durée → `PATCH ghostorbs { orbUntil: now + Xs }`

#### `MessagerieAdminTool`

- Formulaire : titre (obligatoire) + texte (optionnel) + imageUrl (optionnel)
- Envoi → append dans `vanSentMessages` (PATCH van)
- Historique + bouton "Vider"
- ⚠️ **Pas d'UI pour envoyer un message audio** malgré le support technique

#### `SpiritBoxAdminTool`

- Écoute en direct (WebSocket), lecture avec effets ghost voice FX
- Sons preset (5 voix) + sons de la bibliothèque musicale
- Bouton pour parler (enregistrement micro, push WebSocket)

#### `EmfAdminTool`

- Curseur emfLevel 0..5 + toggle powerOn + toggle huntActive

#### `ThermometerAdminTool`

- Curseur température + toggle powerOn

### 8.3 `MiniMJDashboard`

Interface légère MJ (`/mini-mj`) avec un affichage condensé du game state (SCENARIO 5 étapes + jauge activité spectrale). Ne contrôle pas le van.

### 8.4 Polling MJ

- **Devices** : `GET /admin/state` toutes les ~1000ms (voire plus fréquent si scroll actif)
- **Camera frame** : `GET /player/device/{id}/camera-frame` toutes les **100ms** quand panel admin actif sur ghostcam/ghostorbs/emf

---

## 9. Tablettes joueurs — comportement détaillé

### 9.1 Sélection device

1. Au chargement : `GET /apil7r/player/devices` → liste de tous les devices
2. Si `?device=X` dans URL → auto-sélection (case-insensitive)
3. Sinon → écran de choix avec liste de boutons

### 9.2 Polling état

| Rôle | Intervalle polling |
|---|---|
| `emf` | **150ms** |
| `ghostcam` | **150ms** |
| Tous les autres | **1000ms** |

### 9.3 Polling van (rôles van, messagerie, ghostcam)

En plus du polling état principal, ces rôles font un **poll van dédié toutes les 500ms** :

```
GET /apil7r/player/device/{vanId}/van?ts=...
  + GET /apil7r/player/device/ghostcam/camera-frame  (frame caméra en live)
  + GET /apil7r/game/hardcoded-game?ts=...           (⚠️ URL incorrecte, voir §14.9)
```

### 9.4 Bouton plein écran flottant

Injecté dans `document.body` à chaque rendu — bouton ⛶ en haut à droite, position `fixed`, `z-index: 99999`. Bascule `document.fullscreenElement`.

### 9.5 Van — logique audio automatique

| Événement | Action audio |
|---|---|
| Clic "INITIALISER" | Lit `GhostIntro.mp3` |
| Fin intro | Passe step 2, coupe intro |
| `backgroundMusic.playing = true` & step 2-6 | Lecture en boucle `backgroundMusic.url` |
| Changement `soundboard[i].lastTriggeredAt` | Lecture one-shot de `soundboard[i].url` |
| Nouveau message `kind=audio` dans `vanSentMessages` | Lecture auto `audioUrl` |
| Step 1 ou step 7 | Pause musique de fond |

---

## 10. API HTTP complète

Préfixe global : `/apil7r/api` (configuré par `bootstrapApi` → `setGlobalPrefix('apil7r/api')`)

### États (lecture)

| Route | Description |
|---|---|
| `GET /admin/state` | Tous les outils (format LegacyDeviceState) |
| `GET /player/devices` | Alias de /admin/state |
| `GET /player/state?deviceId=X` | Un outil ou tous si deviceId absent |
| `GET /tool/:toolType` | Un outil (format natif) |
| `GET /tools` | Tous les outils (format natif) |

### Modifications

| Route | Description |
|---|---|
| `PATCH /admin/device/:deviceId` | Met à jour n'importe quel champ d'un outil |
| `POST /admin/device/:deviceId/state` | Alias PATCH |
| `PATCH /admin/tool/:toolType` | Alias PATCH (format natif) |
| `POST /admin/reset` | Efface tout (tool_state) + frameBuffer + spiritBuffers |

### Caméra

| Route | Description |
|---|---|
| `POST /admin/device/:deviceId/camera-frame` | Body `{ frame: base64 }` → stockage mémoire |
| `GET /player/device/:deviceId/camera-frame` | Retourne `{ frame? }` |
| `POST /admin/tool/:toolType/camera-frame` | Idem (format natif) |
| `GET /tool/:toolType/camera-frame` | Idem (format natif) |

### Spirit Box

| Route | Description |
|---|---|
| `POST /player/device/:id/spiritbox/player-message` | `{ audioData, mimeType? }` → buffer mémoire |
| `GET /admin/device/:id/spiritbox/player-message` | Récupère dernier audio joueur |
| `POST /admin/device/:id/spiritbox/mj-message` | `{ audioData, mimeType? }` → buffer mémoire |
| `GET /player/device/:id/spiritbox/mj-message` | Récupère dernier audio MJ |

### Van

| Route | Description |
|---|---|
| `PATCH /admin/device/:deviceId/van` | Whitelist de champs van uniquement |
| `GET /player/device/:deviceId/van` | État complet du van |
| `PATCH /admin/van` | PATCH van sans deviceId (implicite `van`) |
| `GET /tool/van` | État van (format natif) |

**Champs whitelistés dans `updateVanData` :** ghostActivityLevel, playerSanity, soundLevels, motionDetections, roomList, motionSensorRooms, recentMotionAlert, missionObjectives, floorPlanImage, backgroundMusic, soundboard, vanMessageTemplates, vanSentMessages, vanStep, vanPendingPhoto, vanFinalPhoto, vanFearMessageAt

### Game State

| Route | Description |
|---|---|
| `POST /admin/game/:gameId/init` | `{ initialSpectralActivity, accelerationRate }` |
| `POST /admin/game/:gameId/start` | Démarre le timer d'accélération |
| `POST /admin/game/:gameId/stop` | Arrête le timer |
| `GET /game/:gameId` | État courant |
| `POST /admin/game/:gameId/advance-step` | Incrémente `currentScenarioStep` |
| `PATCH /admin/game/:gameId/objectives` | `{ objectives: Record<string, boolean> }` |

### Musique (stub)

`GET /music/:type` → toujours `{ files: [] }` (non implémenté)

---

## 11. WebSocket — Spirit Box temps réel

**Namespace :** `/ghost-audio`  
**Transport :** `websocket` + `polling`  
**CORS :** `origin: '*'`

### Connexion

Query params obligatoires : `deviceId` + `role` (`'player'` | `'admin'`).  
Le client rejoint automatiquement la room `spiritbox:{role}:{deviceId}`.

### Events

| Event | Direction | Payload |
|---|---|---|
| `spiritbox:audio-chunk` | player → server | `{ deviceId, chunk: ArrayBuffer\|string, mimeType, hasPrependedHeader?, codec?: 'pcm16', sampleRate?, channels? }` |
| `spiritbox:audio-chunk` | server → admin | Même payload (relay immédiat) |

---

## 12. GameState — système parallèle

Le `GameState` est un système **cosmétique côté MJ**, utilisé dans `MiniMJDashboard` et le panneau `game` du dashboard. Il n'influence **pas directement** l'expérience joueur.

### Fonctionnement

- `initGame('hardcoded-game', config)` → crée/réinitialise le GameState
- `startGame('hardcoded-game')` → `isRunning = true` + lance `setInterval` qui fait `currentSpectralActivity += 5` toutes les `accelerationRate` secondes (max 100)
- `stopGame` → arrête le timer
- `currentScenarioStep` : incrémenté manuellement par le MJ via `advance-step`

### Lien avec le van player

Le player van fait `GET /apil7r/game/hardcoded-game` (⚠️ **URL incorrecte** — voir §14.9) toutes les 500ms pour récupérer `currentScenarioStep` et l'utiliser pour forcer `vanScenarioStep = 0` (intro). En pratique, ce fetch échoue silencieusement et la logique objectives prend le relais.

---

## 13. Valeurs hardcodées dans le code

Ces valeurs ne sont **pas configurables** sans modifier le code source :

| Valeur | Fichier | Localisation |
|---|---|---|
| Nom du fantôme : **`"oni"`** | `apps/web-ghost-player/src/app/app.tsx` | `declareGhost()` ligne ~1145 |
| Salle correcte : **`"salle-de-bain-1"`** | `VanStep1Puzzle.tsx` + `VanStep2Equipment.tsx` | `handleValidateRoom()` |
| Code PIN caméra : **`"1234"`** | `useGhostCamPhotoMode.ts` | `unlockPhotoMode()` |
| Sprite fantôme : **`"/Colin2.png"`** | `app.tsx` | `GHOST_CAM_SPRITE_URL` |
| Audio intro : **`"https://l7r.fr/l7r/GhostIntro.mp3"`** | `app.tsx` | `VAN_INTRO_AUDIO_URL` |
| Image bannissement : **`"https://l7r.fr/l7r/GhostBanish.jpg"`** | `VanStep6Banish.tsx` | `DEFAULT_BANISH_IMAGE` |
| Sons Spirit Box preset | `app.tsx` (dashboard) | `SPIRITBOX_PRESET_SOUNDS` (5 URLs) |
| Liste des pièces (select) | `VanStep1Puzzle.tsx` + `VanStep2Equipment.tsx` | Options `<select>` statiques |
| GameId : **`"hardcoded-game"`** | `app.tsx` (dashboard) | `useState('hardcoded-game')` |

---

## 14. Problèmes identifiés & dettes techniques

### 🔴 Critiques (bloquants en jeu)

#### 14.1 Nom du fantôme hardcodé à `"oni"`

**Fichier :** `apps/web-ghost-player/src/app/app.tsx`, `declareGhost()`  
**Impact :** Le joueur **doit** saisir "oni" pour passer step 5 → 6. Il n'y a aucune configuration possible. Pour un autre scénario (autre fantôme), il faut modifier le code et rebuilder.

#### 14.2 Salle correcte hardcodée à `"salle-de-bain-1"`

**Fichiers :** `VanStep1Puzzle.tsx`, `VanStep2Equipment.tsx`  
**Impact :** La validation de localisation vérifie `selectedRoom === 'salle-de-bain-1'`. Les options de la liste sont aussi statiques (7 pièces). Non reconfigurable sans rebuild.

### 🟠 Importants (bugs silencieux ou UX dégradée)

#### 14.3 URL incorrecte pour le game state dans le player

**Fichier :** `apps/web-ghost-player/src/app/app.tsx`, `pollVanData()`  
**Problème :** Le code fait `GET /apil7r/game/hardcoded-game`. Le préfixe global étant `/apil7r/api`, la vraie route est `/apil7r/api/game/hardcoded-game`. Résultat : ce fetch renvoie **404 en permanence**, et le player ignore silencieusement l'erreur (fallback sur la logique d'objectifs). Le `vanScenarioStep` ne se met jamais à jour depuis le serveur.

#### 14.4 `VanStep3Validation` — dead code avec données hardcodées

**Fichier :** `apps/web-ghost-player/src/app/components/van/VanStep3Validation.tsx`  
**Problème :** Ce composant affiche "Spectre identifié: ONI" et des instructions spécifiques à un scénario. Il **n'est jamais rendu** (aucun import actif). C'est du code mort avec un scénario hardcodé qui peut induire en erreur si quelqu'un l'importe.

#### 14.5 `toolLabel` incorrect dans le dashboard

**Fichier :** `apps/web-ghost-dashboard/src/app/app.tsx`  
**Problème :** `if (tool === 'ghostorbs') return 'Thermomètre'` — les orbes sont libellés "Thermomètre" dans la liste de badges d'outils requis.

#### 14.6 `VanStep6Banish` : instruction ≠ comportement attendu

**Fichier :** `apps/web-ghost-player/src/app/components/van/VanStep6Banish.tsx`  
**Problème :** Le composant affiche **"affichez votre plus beau sourire et prenez-vous en photo"**. Mais le sous-flux technique (§5.4) exige que le MJ prenne la photo depuis la Ghost Cam admin en capturant une expression paniquée. La description joueur est donc en contradiction avec la logique réelle.

#### 14.7 Pas d'UI pour envoyer un message audio depuis le dashboard

**Fichier :** `MessagerieAdminTool.tsx`  
**Problème :** Le type `VanDashboardMessage.kind` supporte `'audio'`, et le joueur van peut lire des messages audio auto-play. Mais le formulaire d'envoi du dashboard n'a que `title`, `text`, `imageUrl` — pas de champ `audioUrl`. Impossible d'envoyer un message audio sans patcher l'API manuellement.

### 🟡 Dette technique & qualité

#### 14.8 `updatedAt` default évalué au boot

**Fichiers :** `device.entity.ts`, `game-state.entity.ts`  
**Problème :** `@Column({ default: new Date().toISOString() })` — la valeur est évaluée **une fois au chargement du module**. Toutes les entités créées après le boot auront la même `updatedAt` par défaut jusqu'au prochain redémarrage.

```typescript
// ❌ Actuel
@Column({ default: new Date().toISOString() })
updatedAt: string

// ✅ À corriger
@Column({ default: () => new Date().toISOString() })
updatedAt: string
```

#### 14.9 Duplication de code entre les deux frontends

**Fichiers :** `web-ghost-player/app.tsx`, `web-ghost-dashboard/app.tsx`  
**Problème :** Les fonctions suivantes sont **copie-collées identiques** :
- `parseVanBackgroundMusic`
- `parseVanSoundboard`
- `parseVanObjectives`
- `ensureVanObjectives`
- `deriveVanObjectiveStep`
- `normalizeVanText` / `isVanObjectiveMatch`
- Constants `VAN_OBJECTIVE_*`

Ces fonctions devraient être extraites dans une lib partagée (`libs/ghost/` ou `libs/shared/`).

#### 14.10 `ScriptProcessorNode` deprecated (Spirit Box joueur)

**Fichier :** `useSpiritBoxAudio.ts`  
**Problème :** `ScriptProcessorNode` est déprécié depuis Chrome 66. Doit être remplacé par `AudioWorkletNode` pour une compatibilité future.

#### 14.11 Double source de vérité `vanStep` / `vanPhase`

**Problème :** `vanStep` (DB, nombre) et `vanPhase` (React state, string) pilotent tous les deux l'affichage. La réconciliation est one-way (phase ne recule pas sans reset). En cas de désync réseau (ex: MJ avance/recule rapidement), l'état affiché peut être incohérent temporairement.

#### 14.12 `GHOST_SCENARIO` (5 étapes backend) jamais utilisé dans la mécanique joueur

**Fichier :** `scenario.types.ts`  
**Problème :** `GHOST_SCENARIO` est importé dans `MiniMJDashboard` (cosmétique) mais n'est **jamais utilisé** par le player ou le dashboard principal. Les 5 étapes (`Préparation`, `Exploration`, etc.) sont une abstraction MJ déconnectée du scénario joueur (qui tourne sur les 7 étapes van).

#### 14.13 `frameBuffer` et `spiritBuffer` en mémoire

**Problème :** Redémarrage serveur = perte des frames et des audio Spirit Box en cours. En production (où le serveur peut se crasher), cela peut couper l'expérience joueur au milieu d'une partie.

#### 14.14 Pas de validation d'entrée sur `PATCH /admin/device/:deviceId`

**Fichier :** `ghost.controller.ts`  
**Problème :** `PATCH /admin/device/:deviceId` accepte `Partial<ToolStateEntity>` sans aucune validation NestJS (pas de DTO avec class-validator). N'importe quel champ peut être écrit, y compris `toolType` (PK), ce qui pourrait corrompre la table.

#### 14.15 `app.tsx` player : trop grand (2000+ lignes)

Toute la logique van (polling, audio, phases, objectifs) est dans un seul composant `App`. Cela rend la maintenance difficile et empêche les tests unitaires.

---

## 15. Schéma de séquence complet

### Happy path (partie complète)

```
 MJ Dashboard                   Van Player                 GhostCam Player
      │                              │                            │
      │─── POST /admin/reset ────────┤────────────────────────────►
      │                              │ vanStep=0, missionObj=[]   │
      │                              │                            │
      │                              │ [Affiche VanStep0Intro]    │
      │                              │ Tap "INITIALISER"          │
      │                              │ Lecture GhostIntro.mp3     │
      │                              │ [fin audio] → onended      │
      │                              │ PATCH van { vanStep:2,     │
      │◄── vanStep=2 ───────────────────  missionObj: intro✓ }    │
      │                              │ [Affiche VanStep2Equipment]│
      │                              │                            │
      │─── ▶ Step 3 ────────────────►│                            │
      │                              │ [Affiche obj 2 actif]      │
      │                              │ Sélectionne salle de bain 1│
      │                              │ PATCH van { vanStep:4,     │
      │◄── vanStep=4 ───────────────────  obj: localisation✓ }    │
      │                              │                            │
      │─── ▶ Step 5 ────────────────►│                            │
      │                              │ Saisit "oni" → confirm     │
      │                              │ PATCH van { vanStep:6, ... }
      │◄── vanStep=6 ───────────────────────────────────────────────────
      │                              │ [VanStep6Banish]           │ [hidePhotoButton=true]
      │─── PATCH ghostcam {ghostUntil: T+10s } ──────────────────►│
      │                              │                            │ [Fantôme visible 10s]
      │                              │                            │ [Prend air "paniqué"]
      │─── Bouton photo admin ───────────────────────────────────►│
      │    PATCH van {vanPendingPhoto: base64}                    │
      │                              │                            │
      │ [Cartouche validation photo] │                            │
      │─── ✓ Valider ───────────────►│─────────────────────────────
      │    PATCH van {vanStep:7, vanFinalPhoto:base64}            │
      │                              │ [VanStep7Victory + photo]  │ [Victory overlay]
```

---

## 16. Checklist MJ — avant la partie

- [ ] Vérifier que le serveur Ghost est démarré (`GHOST_PORT` configuré)
- [ ] Faire un `POST /admin/reset` pour partir d'un état propre
- [ ] Ouvrir le dashboard MJ sur la bonne URL
- [ ] Vérifier que toutes les tablettes joueur sont connectées (liste devices dans dashboard)
- [ ] Configurer les pièces (`roomList`) et capteurs mouvement (`motionSensorRooms`) si utilisés
- [ ] Charger la musique de fond (`backgroundMusic.url`) et le soundboard
- [ ] Préparer les messages texte/image à envoyer (templates van)
- [ ] Tester l'audio Spirit Box (micro MJ + tablette joueur Spirit Box)
- [ ] Tester la Ghost Cam (tablette joueur + preview admin)
- [ ] Vérifier que `Colin2.png` est accessible (servi depuis `/public/Colin2.png`)
- [ ] Vérifier l'audio d'intro (`GhostIntro.mp3`) accessible depuis `https://l7r.fr/l7r/`
- [ ] ⚠️ Rappeler aux joueurs que le nom du fantôme à saisir est **"oni"** (insensible à la casse)
- [ ] ⚠️ La salle correcte à sélectionner est **"Salle de bain 1"**
- [ ] ⚠️ Le code PIN déverrouillage photo Ghost Cam est **"1234"**

---

## Annexe — Résumé des URL côté frontend

| URL appelée | Méthode | Quand |
|---|---|---|
| `/apil7r/player/devices` | GET | Au chargement (player + dashboard) |
| `/apil7r/player/state?deviceId=X` | GET | Polling 150ms (emf/ghostcam) ou 1000ms |
| `/apil7r/player/device/{id}/van` | GET | Polling 500ms (van, messagerie, ghostcam) |
| `/apil7r/player/device/ghostcam/camera-frame` | GET | Dans pollVanData (pour le live van) |
| `/apil7r/admin/device/{id}/camera-frame` | POST | Upload frame (ghostcam, thermometer, emf) |
| `/apil7r/player/device/{id}/camera-frame` | GET | Polling 100ms (dashboard admin) |
| `/apil7r/admin/device/{id}/van` | PATCH | Objectifs, step, activité, messages |
| `/apil7r/admin/device/{id}` | PATCH | photoModeUnlocked, emfLevel, ghostUntil... |
| `/apil7r/admin/state` | GET | Polling dashboard |
| `/apil7r/admin/reset` | POST | Reset complet |
| `/apil7r/game/hardcoded-game` | GET | ⚠️ URL incorrecte (404 en permanence) |
| `/ghost-audio` | WebSocket | Spirit Box audio temps réel |
