/**
 * GM-controlled A/V session modes for Foundry 14 + LiveKit AVClient.
 * The native core.rtcWorldSettings.mode is the single source of truth:
 * 0 disabled, 1 audio only, 3 audio+video. The control never powers on a
 * participant's microphone or camera without their own prior action.
 */
const MODULE = 'pf2e-val-toolkit';
const MIGRATED = 'avControlInitialized';
const HIDE_DOCK = 'avHideVideoPanels';
const MODES = Object.freeze({ OFF: 0, AUDIO: 1, VIDEO: 3 });
const VALID_MODES = new Set(Object.values(MODES));
const LABELS = { 0: 'Arrêté', 1: 'Audio uniquement', 3: 'Audio + vidéo' };

let appliedMode = null;
let syncQueue = Promise.resolve();
let livekitPresent = false;
let tooltipTimeout = null;
let tooltipElement = null;

function isLiveKitClient(client = game.webrtc?.client) {
  return !!client?._liveKitClient;
}

function worldMode() {
  const mode = Number(game.settings.get('core', 'rtcWorldSettings')?.mode);
  return VALID_MODES.has(mode) ? mode : MODES.OFF;
}

function isInitialized() {
  return game.settings.get(MODULE, MIGRATED) === true;
}

function hideTooltip() {
  if (tooltipTimeout !== null) window.clearTimeout(tooltipTimeout);
  tooltipTimeout = null;
  tooltipElement?.remove();
  tooltipElement = null;
}

function showTooltip(button) {
  const text = button.dataset.valAvTooltip;
  if (!text || !button.isConnected) return;
  hideTooltip();
  const tooltip = document.createElement('div');
  tooltip.className = 'pf2e-val-av-tooltip';
  tooltip.textContent = text;
  document.body.append(tooltip);
  const rect = button.getBoundingClientRect();
  const width = tooltip.offsetWidth;
  const height = tooltip.offsetHeight;
  tooltip.style.left = `${Math.max(8, Math.min(window.innerWidth - width - 8, rect.left + rect.width / 2 - width / 2))}px`;
  tooltip.style.top = `${Math.max(8, rect.top - height - 9)}px`;
  tooltipElement = tooltip;
}

function decorateCameraTooltips() {
  hideTooltip();
  for (const control of document.querySelectorAll('#camera-views .av-control')) {
    const original = control.getAttribute('aria-label') || control.getAttribute('title') || control.getAttribute('data-tooltip');
    if (original) {
      control.dataset.valAvTooltip = game.i18n?.has?.(original) ? game.i18n.localize(original) : original;
      // Foundry's automatic tooltip overlays the controls; replace just here.
      control.removeAttribute('data-tooltip');
      control.removeAttribute('title');
    }
    if (control.dataset.valAvBound === '1' || !control.dataset.valAvTooltip) continue;
    control.dataset.valAvBound = '1';
    control.addEventListener('pointerenter', () => {
      hideTooltip();
      tooltipTimeout = window.setTimeout(() => { tooltipTimeout = null; showTooltip(control); }, 700);
    });
    control.addEventListener('pointerleave', hideTooltip);
    control.addEventListener('pointerdown', hideTooltip);
    control.addEventListener('focusout', hideTooltip);
  }
}

function refreshDock() {
  document.body.classList.toggle('pf2e-val-av-panels-hidden', !!game.settings.get(MODULE, HIDE_DOCK));
}

function stopLocalMedia() {
  const lk = game.webrtc?.client?._liveKitClient;
  if (!lk) return;
  // The LiveKit module disconnects with stopTracks=false. Explicitly release
  // device access after global stop or when rebuilding a session.
  for (const prop of ['audioTrack', 'videoTrack']) {
    try { lk[prop]?.stop?.(); }
    catch (error) { console.warn('PF2e Val Toolkit | A/V track stop:', prop, error); }
    lk[prop] = null;
  }
}

/** Persist a muted+hidden starting position; preserve voluntarily active audio
 * across audio<->audio/video transitions, but never restore an active camera. */
async function prepareLocalPrivacy(previousMode, nextMode) {
  const settings = foundry.utils.deepClone(game.settings.get('core', 'rtcClientSettings'));
  settings.users ??= {};
  const local = settings.users[game.userId] ?? {};
  const keepMicrophone = previousMode !== MODES.OFF && nextMode !== MODES.OFF && local.muted === false;
  settings.users[game.userId] = { ...local, muted: !keepMicrophone, hidden: true };
  await game.settings.set('core', 'rtcClientSettings', settings);
  // AVSettings maintains a live local cache used by AVMaster.connect().
  const cached = game.webrtc?.settings?.client;
  if (cached?.users) cached.users[game.userId] = { ...cached.users[game.userId], ...settings.users[game.userId] };
}

async function applyMode(mode) {
  const av = game.webrtc;
  if (!isLiveKitClient()) return;
  // Foundry debounces rtcSettingsChanged; its in-memory world snapshot can
  // still contain the old mode after game.settings.set has resolved. Sync it
  // before AVMaster.connect() checks its native mode gate.
  av.settings.world = game.settings.get('core', 'rtcWorldSettings');
  // This guard protects first-run clients before the GM finishes installing
  // the global OFF default; the GM migration itself is allowed to disconnect.
  if (mode !== MODES.OFF && !isInitialized()) return;
  const previous = appliedMode ?? MODES.OFF;
  // Native rtcWorldSettings onChange is debounced; AVMaster must see the new
  // mode now, otherwise connect() may decide it is still disabled.
  if (av.settings?.world) av.settings.world.mode = mode;
  appliedMode = mode;
  if (mode === MODES.OFF) {
    await prepareLocalPrivacy(MODES.OFF, MODES.OFF);
    await av.disconnect();
    stopLocalMedia();
    ui.webrtc?.render?.();
    return;
  }
  // On transitions between active modes the camera is always hidden; existing
  // audio can remain enabled if its user explicitly unmuted it before.
  await prepareLocalPrivacy(previous, mode);
  await av.disconnect();
  stopLocalMedia();
  if (worldMode() !== mode) return; // A newer GM transition took precedence.
  const connected = await av.connect();
  if (worldMode() === MODES.OFF && connected) {
    await av.disconnect();
    stopLocalMedia();
    return;
  }
  if (!connected) console.warn('PF2e Val Toolkit | Connexion LiveKit non établie en mode', mode);
}

function syncMode() {
  const nextMode = worldMode();
  // Queue transitions to prevent racing asynchronous disconnect/connect calls.
  syncQueue = syncQueue.catch(error => console.error('PF2e Val Toolkit | A/V précédente transition:', error))
    .then(async () => {
      if (appliedMode === worldMode()) return;
      await applyMode(worldMode());
      if (game.ready) {
        const description = LABELS[worldMode()] ?? 'Arrêté';
        ui.notifications?.info?.(`Audio/vidéo MJ : ${description}.`);
        ui.controls?.render?.({ force: true });
      }
    }).catch(error => {
      console.error('PF2e Val Toolkit | Transition A/V:', error);
      ui.notifications?.error?.('Impossible de changer le mode audio/vidéo. Consultez la console.');
    });
  return syncQueue;
}

async function setMode(mode) {
  if (!game.user?.isGM) throw new Error('Commande réservée au MJ.');
  if (!VALID_MODES.has(mode)) throw new Error('Mode A/V invalide.');
  if (!isLiveKitClient()) {
    ui.notifications.error('LiveKit AVClient doit être activé pour utiliser ce contrôle.');
    return false;
  }
  const world = foundry.utils.deepClone(game.settings.get('core', 'rtcWorldSettings'));
  if (world.mode === mode) return true;
  world.mode = mode;
  await game.settings.set('core', 'rtcWorldSettings', world);
  // The native AV settings change hook is debounced; sync immediately on GM.
  await syncMode();
  return true;
}

async function setPanelsHidden(hidden) {
  if (!game.user?.isGM) throw new Error('Commande réservée au MJ.');
  await game.settings.set(MODULE, HIDE_DOCK, !!hidden);
  refreshDock();
}

async function openPanel() {
  if (!game.user?.isGM) return;
  if (!isLiveKitClient()) {
    ui.notifications.warn('LiveKit AVClient est désactivé ou non installé.');
    return;
  }
  const current = worldMode();
  const hidden = game.settings.get(MODULE, HIDE_DOCK);
  const content = `<div class="pf2e-val-av-panel">
    <p><b>État actuel :</b> ${LABELS[current]}. Le MJ contrôle l'autorisation globale ; chaque joueur active lui-même son micro et sa caméra.</p>
    <p class="hint">Le démarrage n'ouvre aucun micro ni aucune caméra automatiquement. L'arrêt coupe les connexions LiveKit pour tous les joueurs présents, sans interrompre Foundry.</p>
    <p><b>Panneaux vidéo :</b> ${hidden ? 'Masqués pour tous' : 'Visibles pour tous'}</p>
  </div>`;
  const action = await foundry.applications.api.DialogV2.wait({
    window: { title: 'Communications audio/vidéo — MJ' },
    content,
    buttons: [
      { action: 'off', icon: 'fa-solid fa-power-off', label: 'Arrêter tout', callback: () => MODES.OFF },
      { action: 'audio', icon: 'fa-solid fa-microphone', label: 'Audio uniquement', callback: () => MODES.AUDIO },
      { action: 'video', icon: 'fa-solid fa-video', label: 'Audio + vidéo', callback: () => MODES.VIDEO },
      { action: 'panels', icon: 'fa-solid fa-eye-slash', label: hidden ? 'Afficher les panneaux' : 'Masquer les panneaux', callback: () => 'panels' },
      { action: 'cancel', icon: 'fa-solid fa-xmark', label: 'Annuler', callback: () => null }
    ],
    close: () => null
  });
  if (action === 'panels') await setPanelsHidden(!hidden);
  else if (VALID_MODES.has(action)) await setMode(action);
}

function addGMControl() {
  Hooks.on('getSceneControlButtons', controls => {
    if (!game.user?.isGM || !controls.tokens?.tools) return;
    const mode = isInitialized() ? worldMode() : MODES.OFF;
    controls.tokens.tools.pf2eValAV = {
      name: 'pf2eValAV',
      title: `Communications MJ : ${LABELS[mode]}`,
      icon: mode === MODES.OFF ? 'fa-solid fa-power-off' : mode === MODES.AUDIO ? 'fa-solid fa-microphone' : 'fa-solid fa-video',
      order: Object.keys(controls.tokens.tools).length,
      button: true,
      visible: true,
      onChange: () => { void openPanel(); }
    };
  });
}

/** Called on init: before Foundry's initializeRTC constructs AVMaster. */
function protectFirstConnection() {
  const proto = foundry.av?.AVMaster?.prototype;
  if (!proto || proto._pf2ValAVGuard) return;
  const nativeConnect = proto.connect;
  proto.connect = async function (...args) {
    if (!isLiveKitClient(this.client)) return nativeConnect.apply(this, args);
    if (!isInitialized()) return false;
    if (!this._pf2ValFirstConnect) {
      this._pf2ValFirstConnect = true;
      try { await prepareLocalPrivacy(MODES.OFF, worldMode()); }
      catch (error) { this._pf2ValFirstConnect = false; throw error; }
    }
    const result = await nativeConnect.apply(this, args);
    // A world-mode change may arrive during the asynchronous LiveKit handshake.
    if (worldMode() === MODES.OFF && result) {
      await this.disconnect();
      stopLocalMedia();
      return false;
    }
    return result;
  };
  proto._pf2ValAVGuard = true;
}

export function registerAVControlSettings() {
  game.settings.register(MODULE, MIGRATED, { scope: 'world', config: false, restricted: true, type: Boolean, default: false,
    onChange: () => { if (game.ready) void syncMode(); }
  });
  game.settings.register(MODULE, HIDE_DOCK, { scope: 'world', config: false, restricted: true, type: Boolean, default: false,
    onChange: () => { if (document.body) refreshDock(); }
  });
  protectFirstConnection();
  addGMControl();
}

export function initAVControl() {
  livekitPresent = isLiveKitClient();
  if (!livekitPresent) return;
  refreshDock();
  Hooks.on('rtcSettingsChanged', (_settings, changed) => {
    if (foundry.utils.getProperty(changed, 'world.mode') !== undefined) void syncMode();
  });
  Hooks.on('renderCameraViews', () => { window.setTimeout(decorateCameraTooltips, 0); });
  window.setTimeout(decorateCameraTooltips, 0);
  game.pf2eValToolkit ??= {};
  game.pf2eValToolkit.avControl = { getMode: worldMode, setMode, setPanelsHidden, openPanel };

  if (game.user.isGM && !isInitialized()) {
    // One-time installation: start OFF without requiring any GM action.
    void (async () => {
      try {
        await setMode(MODES.OFF);
        await game.settings.set(MODULE, MIGRATED, true);
        appliedMode = null;
        await syncMode();
        ui.notifications.info('Contrôle A/V MJ installé : communications arrêtées par défaut.');
      } catch (error) {
        console.error('PF2e Val Toolkit | Initialisation des contrôles A/V:', error);
        ui.notifications.error('Impossible d’initialiser le contrôle audio/vidéo MJ.');
      }
    })();
  } else {
    appliedMode = worldMode(); // Foundry already applied this world mode at startup.
  }
}
