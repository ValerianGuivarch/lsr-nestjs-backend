# Outil Ghost — Récapitulatif fonctionnel & technique

Document destiné à un outil de scénarisation : décrit précisément les composants, états, transitions et endpoints de l'escape « Ghost » (chasse aux fantômes). À utiliser comme contexte source pour rédiger un scénario MJ <-> joueurs.

> Stack : NestJS (backend) + React/Vite (frontends) + TypeORM (Postgres). Source de vérité = entité `tool_state` (1 ligne par outil).

---

## 1. Architecture en un coup d'œil

Deux frontends consomment la même API NestJS :

| Frontend | Rôle | Code |
|---|---|---|
| `web-ghost-player` | Tablettes/écrans joueurs (1 par appareil dans la salle) | `apps/web-ghost-player/` |
| `web-ghost-dashboard` | Console du Maître du Jeu (MJ) | `apps/web-ghost-dashboard/` |

Le backend (`libs/ghost/src/lib/backend/`) expose une API sous `/apil7r/api/...` (alias historique `device` ↔ `tool`).

---

## 2. Modèle de données central — `ToolStateEntity`

Une seule ligne par outil, clé primaire = `toolType` (string, hardcodé). Voir `libs/ghost/src/lib/backend/device.entity.ts`.

### 2.1. Colonnes communes
| Colonne | Type | Défaut | Usage |
|---|---|---|---|
| `toolType` | string (PK) | — | Identifiant de l'outil (`emf`, `spiritbox`, `ghostcam`, `ghostorbs`, `thermometer`, `motion_sensor`, `sound_detector`, `van`, `messagerie`) |
| `powerOn` | boolean | `true` | Outil allumé/éteint |
| `huntActive` | boolean | `false` | Chasse en cours (impacte tous les outils) |
| `message` | string? | — | Message courant (Spirit Box, etc.) |
| `emfLevel` | number? | — | Niveau EMF affiché 0..5 |
| `cameraColor` | `'green'\|'red'` | `'green'` | Filtre Ghost Cam |
| `temperature` | float | `20` | Thermomètre (°C) |
| `ghostUntil` | ISO string? | — | Tant que `now < ghostUntil`, le fantôme est visible sur la Ghost Cam |
| `orbUntil` | ISO string? | — | Idem pour les orbes |
| `photoModeUnlocked` | boolean | `false` | Déverrouille le bouton photo de la Ghost Cam |
| `updatedAt` | ISO string | — | Auto |

### 2.2. Colonnes spécifiques au Van (toolType = `van`)
| Colonne | Type | Défaut | Usage |
|---|---|---|---|
| `ghostActivityLevel` | number | `0` | Jauge 0..10 (curseur MJ) |
| `playerSanity` | JSON string | `{}` | `{ "Joueur1": 0..100 }` |
| `soundLevels` | JSON string | `{}` | `{ "Cuisine": 0..100 }` |
| `motionDetections` | JSON string | `{}` | `{ "Cuisine": true }` |
| `roomList` | JSON string | `[]` | Liste de pièces |
| `motionSensorRooms` | JSON string | `[]` | Pièces équipées d'un capteur |
| `recentMotionAlert` | string? | — | Dernière pièce alerte mouvement |
| `missionObjectives` | JSON string | `[]` | `[{ objective, completed }]` |
| `floorPlanImage` | string? | — | URL ou base64 du plan |
| `backgroundMusic` | JSON string | `{...}` | `{ title, url, volume, loop, playing }` |
| `soundboard` | JSON string | `[]` | `[{ id, label, url, volume, lastTriggeredAt? }]` |
| `vanMessageTemplates` | JSON string | `[]` | Templates de messages MJ |
| `vanSentMessages` | JSON string | `[]` | Messages déjà envoyés (feed joueur) |
| **`vanStep`** | number | `0` | **Machine à états du scénario, 0..7** |
| **`vanPendingPhoto`** | text? | — | Photo de peur en attente (étape 6) |
| **`vanFinalPhoto`** | text? | — | Photo affichée à la victoire (étape 7) |
| **`vanFearMessageAt`** | ISO string? | — | Trigger « niveau de peur insuffisant » côté Ghostcam |

---

## 3. Outils (`ToolType`) & rôles joueurs

Chaque tablette joueur a un `deviceId` et un `role` (`DeviceRole` côté player). Le rôle pilote la vue affichée.

| ToolType | Rôle player | Vue/composant | Ce que voit le joueur | Contrôles MJ |
|---|---|---|---|---|
| `emf` | `emf` | `EmfDeviceView` | Cadran EMF 0..5, lampe rouge si `huntActive` | `emfLevel`, `huntActive`, `powerOn` |
| `spiritbox` | `spiritbox` | `SpiritBoxDeviceView` | Bandes radio, peut envoyer un audio au MJ ; reçoit audio MJ | Push audio MJ, lecture audio joueur |
| `ghostcam` | `ghostcam` | `GhostCamDeviceView` | Caméra (stream MediaDevices), filtre vert/rouge, apparition fantôme si `ghostUntil > now`, bouton photo si `photoModeUnlocked` | `cameraColor`, `ghostUntil`, `photoModeUnlocked`, capture frame |
| `ghostorbs` | `ghostorbs` | Vue caméra orbes | Orbes visibles si `orbUntil > now` | `orbUntil`, durée d'apparition |
| `thermometer` | `thermometer` | `ThermometerDeviceView` | Température et tendance | `temperature` (curseur), `powerOn` |
| `motion_sensor` | `emf` (réutilisé) | — | Alerte mouvement par pièce | `motionDetections`, `recentMotionAlert` |
| `sound_detector` | `spiritbox` (réutilisé) | — | Niveaux sonores par pièce | `soundLevels` |
| `van` | `van` | Composants `VanStepN…` | Mission progressive (étapes 0→7) | Voir §5 |
| `messagerie` | `messagerie` | `MessagerieDeviceView` | Feed de messages MJ (audio/texte/texte+image) | Envoi de messages depuis le van |

Notes :
- Les rôles `messagerie` et `ghostcam` lisent en plus l'état du van (toolType `van`) car ils dépendent du `vanStep` (cf. §5.4).
- Un même outil peut être instancié sur plusieurs tablettes (mais une seule ligne en DB) ; la frame caméra est stockée côté serveur par `deviceId` (multi-source possible).

---

## 4. État de partie — `GameStateEntity` & `GHOST_SCENARIO`

Le backend gère aussi un `GameState` séparé (`game-state.entity.ts`) avec :
- `isInitialized`, `isRunning`, `startedAt`
- `initialSpectralActivity` (0..100), `accelerationRate` (sec)
- `currentSpectralActivity`, `currentScenarioStep`

Un scénario générique en 5 étapes est codé en dur (`scenario.types.ts` → `GHOST_SCENARIO`) :
1. **Préparation** — EMF + Spirit Box
2. **Première exploration** — EMF + Ghost Cam + Motion Sensor
3. **Communication** — Spirit Box + Sound Detector
4. **Montée d'activité** — EMF + Ghost Orbs + Thermomètre
5. **Chasse** — Van

⚠️ Ce scénario est **distinct** du `vanStep` (qui pilote la mission joueur dans le van). Le scénario générique est cosmétique côté MJ ; la mécanique joueur tourne autour du `vanStep`.

---

## 5. Machine à états du Van — `vanStep` (0..7)

C'est le cœur du scénario joueur. **Seul le MJ pilote la progression**, à l'exception de deux transitions automatiques (cf. ↓).

### 5.1. Tableau des étapes

| Step | Nom | Affichage joueur (van) | Objectifs cochés |
|---|---|---|---|
| **0** | Introduction | Écran d'intro, bouton « Démarrer la mission » (audio d'intro) | 0 |
| **1** | Récup. matériel de localisation | Carte mission + objectifs (1 coché) | 1 |
| **2** | Trouver la zone d'activité | Carte mission + objectifs (2 cochés) | 2 |
| **3** | Récup. matériel d'identification | Carte mission + objectifs (3 cochés) | 3 |
| **4** | Identifier le fantôme | Carte mission + objectifs (4 cochés) | 4 |
| **5** | Saisir le nom du fantôme | Champ de saisie côté van ; le bon nom déclenche → 6 | 5 |
| **6** | Panique & bannissement | `VanStep6Banish` — instructions « retourner dans la salle, attendre le fantôme, prendre un air paniqué… » + image | 6 |
| **7** | Victoire | `VanStep7Victory` — « Vous avez réussi à chasser le fantôme ! Bravo ! » + photo finale validée | 7 |

Mapping interne côté player (`apps/web-ghost-player/src/app/app.tsx`) :
```
phaseFromVanStep(step) → 'step0' | 'step1' | 'step2' | 'step3' | 'step6' | 'step7'
  0  → step0
  1-4 → step1 (carte progressive)
  5  → step2 (saisie nom)
  6  → step6 (panique)
  ≥7 → step7 (victoire)
```

### 5.2. Transitions

| Transition | Déclencheur | Action |
|---|---|---|
| 0 → 1 | **Automatique** : fin de l'audio d'intro (player) | PATCH `{ vanStep: 1, missionObjectives: [...1 coché] }` |
| 1 → 2, 2 → 3, 3 → 4, 4 → 5 | MJ (boutons ◀/▶ dans `VanAdminTool`) | PATCH `{ vanStep: N, missionObjectives }` |
| 5 → 6 | **Automatique** : joueur saisit le bon nom du fantôme | PATCH `{ vanStep: 6, missionObjectives }` |
| 6 → 7 | **Automatique** : MJ valide la photo de peur depuis l'admin Ghostcam | PATCH `{ vanStep: 7, vanFinalPhoto: <photo>, vanPendingPhoto: null, missionObjectives }` |
| n'importe → 0 | MJ (bouton ⟲ Réinit) avec confirmation | PATCH `{ vanStep: 0, vanPendingPhoto: null, vanFinalPhoto: null, vanFearMessageAt: null, missionObjectives }` |
| ± libre | MJ (boutons ◀/▶) | Clampe sur 0..7 |

### 5.3. Sous-flux « photo de peur » (étape 6)

1. En `vanStep === 6`, sur la tablette Ghost Cam joueur, le bouton « photo » est **masqué** (`hidePhotoButton`).
2. Côté MJ, le bouton photo Ghost Cam capture la frame puis PATCH `{ vanPendingPhoto: <base64> }` (au lieu de télécharger).
3. La tablette MJ Ghost Cam affiche un cartouche **« Photo de peur en attente de validation »** avec deux boutons :
   - **✓ Valider** → `validateVanPhoto` → step 7 + `vanFinalPhoto` = la photo (visible dans `VanStep7Victory`).
   - **✗ Refuser** → `refuseVanPhoto` → `vanPendingPhoto: null`, `vanFearMessageAt: now()`.
4. Sur refus, la Ghost Cam joueur observe `vanFearMessageAt` (polling) : si la valeur change, overlay rouge « Niveau de peur insuffisant » pendant **3 secondes**, puis disparait. Le joueur peut reprendre une photo.

### 5.4. Polling

- Les tablettes joueur `role === 'van'`, `role === 'messagerie'` et `role === 'ghostcam'` interrogent en plus l'état du toolType `van` (`vanFetchId = 'van'`) pour récupérer `vanStep`, `vanPendingPhoto`, `vanFinalPhoto`, `vanFearMessageAt`, objectifs et messages.
- Le polling est en ~500 ms (cf. `pollVanData` useEffect).

---

## 6. Composants UI joueur — Van

Fichiers dans `apps/web-ghost-player/src/app/components/van/` :

- `VanStep0Intro.tsx` — écran d'intro avec bouton « Démarrer » qui lance un audio (intro narrée). À la fin → PATCH `vanStep: 1`.
- `VanStep1Puzzle.tsx`, `VanStep2Equipment.tsx`, `VanStep3Validation.tsx` — vues intermédiaires (utilisées pour la phase `step1`/`step2` selon le mapping).
- `VanStep6Banish.tsx` — grid 1fr 2fr :
  - Gauche : `ActivityCard` (rouge, jauge `ghostActivityLevel`) + `ObjectivesCard` (objectifs).
  - Droite : `BanishCard` avec image (`VAN_BANISH_IMAGE_URL`) + texte FR :
    > *« Retourner dans la salle et attendre que le fantôme apparaisse, puis dès qu'il apparait, prendre un air paniqué, jusqu'à ce qu'il disparaisse. »*
  - Props : `{ objectives, ghostActivity }`.
- `VanStep7Victory.tsx` — Layout centré :
  - `VictoryTitle` (vert, animation glow) + sous-titre **« BRAVO ! »**.
  - `PhotoFrame` avec `finalPhoto` ou `PhotoPlaceholder`.
  - Texte : *« Vous avez réussi à chasser le fantôme ! Bravo ! »*.
  - Props : `{ finalPhoto?: string }`.

---

## 7. Composants UI MJ — Admin tools

Fichiers dans `apps/web-ghost-dashboard/src/app/components/admin-tools/` :

- `VanAdminTool.tsx`
  - **Slider activité fantôme** (0..10) → `ghostActivityLevel`.
  - **Badge `n / 7`** + label FR de l'étape (`STEP_LABELS`).
  - Boutons `⟲ Réinit` (avec confirm), `◀ Étape précédente`, `Étape suivante ▶`.
    - Précédente désactivée à 0, suivante désactivée à 7.
  - Objectifs **en lecture seule** (✓/○) — plus de cases à cocher.
  - Hint : *« L'étape 6 → 7 passe par la validation de la photo de peur depuis l'admin Ghostcam. »*
- `GhostCamAdminTool.tsx`
  - Prévisualisation caméra + bouton photo (titre dynamique : `"Prendre une photo"` ou `"Envoyer la photo de peur au MJ"` en `vanStep === 6` — note : l'étape 6 routing est en réalité géré côté `takeGhostcamPhoto` du parent).
  - Quand `vanPendingPhoto` est défini : cartouche **« Photo de peur en attente de validation (étape 6) »** avec preview + ✓ Valider / ✗ Refuser.
- `MessagerieAdminTool.tsx` — composer/templates de messages, push vers `vanSentMessages`.
- `EmfAdminTool`, `SpiritBoxAdminTool`, `GhostCamAdminTool`, `ThermometerAdminTool`, `GhostOrbsAdminTool` — contrôles par outil.

---

## 8. API HTTP (préfixe `/apil7r/api`)

Toutes les routes prennent/retournent l'état `LegacyDeviceState` (`ToolStateEntity` + `deviceId` + `role`). Le `deviceId` correspond ici au `toolType`.

### 8.1. État
- `GET /admin/state` — tous les outils.
- `GET /player/devices` — alias.
- `GET /player/state?deviceId=<id>` — un seul outil (ou tous).
- `POST /admin/reset` — réinitialise tout.

### 8.2. Patch d'un outil
- `PATCH /admin/device/:deviceId` — body `Partial<ToolStateEntity>`. Permet de modifier n'importe quelle colonne.
- `POST /admin/device/:deviceId/state` — équivalent.

### 8.3. Caméra
- `POST /admin/device/:deviceId/camera-frame` — body `{ frame: base64 }`.
- `GET /player/device/:deviceId/camera-frame` — retourne `{ frame }`.

### 8.4. Spirit Box
- `POST /player/device/:deviceId/spiritbox/player-message` — body `{ audioData, mimeType? }`.
- `GET /admin/device/:deviceId/spiritbox/player-message`.
- `POST /admin/device/:deviceId/spiritbox/mj-message`.
- `GET /player/device/:deviceId/spiritbox/mj-message`.

### 8.5. Van
- `PATCH /admin/device/:deviceId/van` — body `Partial<ToolStateEntity>` filtré côté service sur un `Pick<>` autorisé (cf. §8.7).
- `GET /player/device/:deviceId/van` — état complet du van.
- `PATCH /admin/van` — variante sans `deviceId` (toolType `van` implicite).
- `GET /tool/van` — variante.

### 8.6. Game state
- `POST /admin/game/:gameId/init` (body `GameConfig`)
- `POST /admin/game/:gameId/start`
- + getters/setters game state (cf. `ghost.controller.ts`).

### 8.7. Champs PATCHables sur `/admin/device/:id/van`

`ghost.service.updateVanData` whiteliste via un `Pick<ToolStateEntity, ...>` :
```
ghostActivityLevel, playerSanity, soundLevels, motionDetections,
roomList, motionSensorRooms, recentMotionAlert, missionObjectives,
floorPlanImage, backgroundMusic, soundboard,
vanMessageTemplates, vanSentMessages,
vanStep, vanPendingPhoto, vanFinalPhoto, vanFearMessageAt
```

---

## 9. WebSocket — `ghost-audio.gateway.ts`

Gateway Socket.IO dédiée au push audio temps réel (Spirit Box). Voir le fichier pour les events. La majorité du jeu fonctionne en HTTP polling.

---

## 10. Conventions importantes pour scénariser

1. **Source de vérité** = `vanStep`. Toute progression de mission doit s'exprimer en transitions de step.
2. **Les objectifs sont dérivés**, pas manipulés directement : `buildObjectivesForStep(step)` coche les N premiers d'une liste fixe (`DEFAULT_VAN_OBJECTIVES_LIST`).
3. **Pas de retour arrière sans intention** : le MJ peut revenir en arrière, mais cela laisse `vanPendingPhoto` / `vanFinalPhoto` tels quels — Réinit pour nettoyer.
4. **Photo de peur** : seul moyen de passer 6 → 7 ; le scénario doit prévoir un signal narratif (fantôme qui apparait sur la Ghost Cam, joueur qui « panique », MJ qui juge l'expression et valide ou refuse).
5. **Apparition fantôme** : pilotée par `ghostUntil` (timestamp futur) sur `ghostcam`. Combiner avec `huntActive` pour ambiance.
6. **Ambiance sonore** : `backgroundMusic` (loop) + `soundboard` (one-shot) sur le toolType `van`.
7. **Messagerie** : pousser des messages depuis le dashboard MJ via `vanSentMessages` (audio/texte/texte+image), affichés en feed sur les tablettes `messagerie`.
8. **Plan & pièces** : `roomList` définit les pièces, `motionSensorRooms` celles équipées de capteurs, `soundLevels` / `motionDetections` les valeurs courantes ; le MJ peut générer dynamiquement de l'inquiétude par pièce.
9. **Sanity** : `playerSanity[playerName]` 0..100. Pas de mécanique automatique côté backend — décision MJ.

---

## 11. Schéma de séquence — Mission complète (happy path)

```
 (MJ)                                         (Players)
   |                                              |
   |--- init game / reset ---------------------->|
   |                                              | vanStep=0, écran intro
   |                                              |
   |                                              | Tap "Démarrer" → audio intro
   |                                              | fin audio → PATCH vanStep=1
   |<--- vanStep=1 (auto) -----------------------|
   |                                              | objectif 1 ✓, carte mission
   |
   |--- ▶ (step 2) ----------------------------->|
   |--- ▶ (step 3) ----------------------------->|
   |--- ▶ (step 4) ----------------------------->|
   |--- ▶ (step 5) ----------------------------->|
   |                                              | écran de saisie nom
   |                                              | bon nom → PATCH vanStep=6
   |<--- vanStep=6 (auto) -----------------------|
   |                                              | VanStep6Banish (panique)
   |                                              | retourne dans la salle
   |
   | (Ghost Cam MJ) capture photo de peur         |
   |--- PATCH vanPendingPhoto -------------------|
   |                                              | (bouton photo joueur masqué)
   |
   | MJ refuse                                   |
   |--- PATCH vanFearMessageAt=now --------------|
   |                                              | overlay 3s "niveau insuffisant"
   |
   | (nouvelle tentative)                         |
   | MJ valide                                    |
   |--- PATCH vanStep=7 + vanFinalPhoto ---------|
   |                                              | VanStep7Victory + photo
```

---

## 12. Pointeurs code

| Sujet | Fichier |
|---|---|
| Entité unique | `libs/ghost/src/lib/backend/device.entity.ts` |
| Service (logique métier, whitelist Van) | `libs/ghost/src/lib/backend/ghost.service.ts` |
| Controller (routes HTTP) | `libs/ghost/src/lib/backend/ghost.controller.ts` |
| Types outils | `libs/ghost/src/lib/backend/tools.types.ts` |
| Scénario générique (5 steps cosmétiques) | `libs/ghost/src/lib/backend/scenario.types.ts` |
| Game state | `libs/ghost/src/lib/backend/game-state.entity.ts` |
| Player app (machine à états Van côté joueur) | `apps/web-ghost-player/src/app/app.tsx` |
| Vues joueur Van | `apps/web-ghost-player/src/app/components/van/` |
| Vues joueur outils | `apps/web-ghost-player/src/app/components/devices/` |
| Dashboard MJ | `apps/web-ghost-dashboard/src/app/app.tsx` |
| Admin tools MJ | `apps/web-ghost-dashboard/src/app/components/admin-tools/` |
