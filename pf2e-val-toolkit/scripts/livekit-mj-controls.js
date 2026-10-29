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
let consentPromptShown = false;
let consentDialog = null;

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
  // The LiveKit client's toggleAudio() short-circuits if this remains true
  // after a stopped room, so reset the broadcast state on every disconnect.
  lk.audioBroadcastEnabled = false;
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
  if (mode !== MODES.OFF && !isInitialized()) throw new Error('Contrôle global A/V non initialisé. Rechargez Foundry avec un MJ connecté.');
  const previous = appliedMode ?? MODES.OFF;
  // Native rtcWorldSettings onChange is debounced; AVMaster must see the new
  // mode now, otherwise connect() may decide it is still disabled.
  if (av.settings?.world) av.settings.world.mode = mode;
  appliedMode = mode;
  if (mode === MODES.OFF) {
    if (consentDialog) void consentDialog.close();
    await prepareLocalPrivacy(MODES.OFF, MODES.OFF);
    await av.disconnect();
    stopLocalMedia();
    // The A/V dock is an ApplicationV2. When world mode becomes OFF its
    // _canRender() is false; close the previously displayed dock explicitly.
    await ui.webrtc?.close?.();
    return;
  }
  // On transitions between active modes the camera is always hidden; existing
  // audio can remain enabled if its user explicitly unmuted it before.
  await prepareLocalPrivacy(previous, mode);
  await av.disconnect();
  stopLocalMedia();
  if (worldMode() !== mode) return; // A newer GM transition took precedence.
  let connected;
  try { connected = await av.connect(); }
  catch (error) {
    appliedMode = null; // Allow retry of the same selected mode.
    throw error;
  }
  if (worldMode() === MODES.OFF && connected) {
    await av.disconnect();
    stopLocalMedia();
    return;
  }
  if (!connected) {
    appliedMode = null;
    throw new Error('Le mode a été enregistré, mais la connexion LiveKit a échoué. Vérifiez les paramètres A/V et réessayez.');
  }
  // Foundry 14's ApplicationV2 refuses its FIRST render unless force=true.
  // The dock was never rendered if the world started in A/V OFF mode. Core
  // AVMaster#initialize() merely calls ui.webrtc.render() without force.
  // Consequently LiveKit connects successfully but no player/mic/camera UI
  // appears. Explicitly force the initial dock render after connecting.
  try {
    await ui.webrtc?.render?.({force:true});
  } catch (error) {
    console.error('PF2e Val Toolkit | LiveKit connected but A/V dock rendering failed:', error);
    throw new Error('LiveKit est connecté mais le panneau A/V Foundry ne peut pas s’afficher. Consultez la console.');
  }
  console.info(`PF2e Val Toolkit | LiveKit connecté, panneau A/V affiché en mode ${LABELS[mode]}`);
  void offerLocalAVActivation();
}

/** Show a one-time (per page load) opt-in after LiveKit is available.
 * Neither this prompt nor its rendering changes any media preferences.
 * Decline, closing and Escape leave both devices as they were.
 */
export async function offerLocalAVActivation() {
  if (consentPromptShown || !game.ready || !isInitialized() || !isLiveKitClient()) return false;
  const mode = worldMode();
  if (mode === MODES.OFF) return false;
  // Do not ask before the LiveKit handshake finishes. In particular, a room
  // that is still connecting must not request access to devices.
  const lk = game.webrtc.client._liveKitClient;
  if (lk.liveKitRoom?.state !== 'connected') return false;
  const av = game.webrtc;
  const local = av.settings?.getUser?.(game.userId);
  // Already opted into at least one source manually? Avoid re-prompting.
  if (!local || !local.muted || !local.hidden) return false;
  const microphone = !!av.canUserBroadcastAudio?.(game.userId);
  const camera = mode === MODES.VIDEO && !!av.canUserBroadcastVideo?.(game.userId);
  if (!microphone && !camera) return false;
  consentPromptShown = true; // Reserve before the first await, preventing duplicates.

  const buttons = [];
  if (microphone) buttons.push({
    action: 'audio', label: 'Activer le micro', icon: 'fa-solid fa-microphone'
  });
  if (microphone && camera) buttons.push({
    action: 'both', label: 'Activer micro et caméra', icon: 'fa-solid fa-video'
  });
  if (!microphone && camera) buttons.push({
    action: 'camera', label: 'Activer la caméra', icon: 'fa-solid fa-video'
  });
  buttons.push({
    action: 'decline', label: 'Refuser', icon: 'fa-solid fa-xmark', default: true
  });

  try {
    const choice = await foundry.applications.api.DialogV2.wait({
      window: { title: mode === MODES.AUDIO ? 'Activer le micro ?' : 'Activer le micro et la caméra ?' },
      content: `<p>${mode === MODES.AUDIO ? 'Les communications vocales sont disponibles.' : 'Les communications audio et vidéo sont disponibles.'}</p>
        <p>Souhaites-tu activer tes périphériques ? Tu peux aussi refuser et les activer plus tard avec les boutons Foundry.</p>`,
      buttons,
      close: () => 'decline',
      render: (_event, dialog) => {
        consentDialog = dialog;
        if (worldMode() === MODES.OFF) void dialog.close();
      }
    });
    if (choice === 'decline' || choice === null) return true;
    // The GM can change mode while the dialog is open: never activate a
    // peripheral no longer authorized in the world.
    const current = worldMode();
    if (current === MODES.OFF || !isLiveKitClient()) return true;
    const enableAudio = (choice === 'audio' || choice === 'both')
      && !!av.canUserBroadcastAudio?.(game.userId);
    const enableVideo = (choice === 'both' || choice === 'camera')
      && current === MODES.VIDEO && !!av.canUserBroadcastVideo?.(game.userId);
    if (!enableAudio && !enableVideo) return true;
    if (enableAudio) av.settings.set('client', `users.${game.userId}.muted`, false);
    if (enableVideo) av.settings.set('client', `users.${game.userId}.hidden`, false);
    await ui.webrtc?.render?.({parts: ['controls', game.userId]});
    return true;
  } catch (error) {
    console.error('PF2e Val Toolkit | Proposition activation A/V:', error);
    ui.notifications?.error?.('Impossible d’activer les périphériques depuis la fenêtre de bienvenue.');
    return false;
  } finally {
    consentDialog = null;
  }
}

function syncMode(force = false) {
  const nextMode = worldMode();
  // Queue transitions to prevent racing asynchronous disconnect/connect calls.
  syncQueue = syncQueue.catch(error => console.error('PF2e Val Toolkit | A/V précédente transition:', error))
    .then(async () => {
      if (!force && appliedMode === worldMode()) return;
      await applyMode(worldMode());
      if (game.ready) {
        const description = LABELS[worldMode()] ?? 'Arrêté';
        ui.notifications?.info?.(`Audio/vidéo MJ : ${description}.`);
        ui.controls?.render?.({ force: true });
      }
    }).catch(error => {
      console.error('PF2e Val Toolkit | Transition A/V:', error);
      ui.notifications?.error?.(error.message || 'Impossible de changer le mode audio/vidéo. Consultez la console.');
      // Keep the queue reusable but report failure to a GM who clicked a mode.
      if (force) throw error;
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
  const changed = Number(world.mode) !== mode;
  if (changed) {
    world.mode = mode;
    await game.settings.set('core', 'rtcWorldSettings', world);
  }
  // Even the already selected mode must reconnect after a failed/disconnected
  // attempt. Native Foundry does not reconnect when only world.mode changes.
  await syncMode(true);
  if (mode === MODES.OFF) ui.notifications.info('Communications A/V arrêtées pour la partie.');
  else ui.notifications.info(`LiveKit connecté : ${LABELS[mode]}. Chaque joueur active ses périphériques.`);
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
  try {
    if (action === 'panels') await setPanelsHidden(!hidden);
    else if (VALID_MODES.has(action)) await setMode(action);
  } catch (error) {
    console.error('PF2e Val Toolkit | Commande A/V MJ:', error);
    // The transition already reports its error. Do not present false success.
  }
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

/** LiveKit creates local tracks during initialize(), even when muted/hidden.
 * Defer access to physical devices until the player explicitly enables them.
 * Patch the current LiveKit instance, not the third-party module's files.
 */
function installPrivateCapture(client) {
  const lk = client?._liveKitClient;
  if (!lk || lk._pf2ValPrivateCapture) return;
  const localId = () => game.userId;
  // Foundry 14's AVSettings#getUser() does:
  //   settings.muted ||= !game.webrtc.client.isAudioEnabled()
  //   settings.hidden ||= !game.webrtc.client.isVideoEnabled()
  // LiveKit reports both as false until the physical tracks exist. With lazy
  // capture, this creates a deadlock: clicking Unmute sets muted=false, but
  // getUser() immediately forces it back to true, so canUserShareAudio()
  // blocks the very track creation needed to unmute. Keep the original
  // settings calculation (including permissions) but use the EXPLICIT local
  // user's intent for muted/hidden, rather than implicit track availability.
  // Other users' states and the original LiveKit media methods are untouched.
  const avSettings = game.webrtc?.settings;
  if (typeof avSettings?.getUser === 'function' && !avSettings._pf2ValLazyUserSettings) {
    const nativeGetUser = avSettings.getUser;
    avSettings.getUser = function (userId) {
      const result = nativeGetUser.call(this, userId);
      if (result && userId === game.userId && !lk.useExternalAV) {
        const requested = this.client?.users?.[userId];
        if (typeof requested?.muted === 'boolean') {
          result.muted = requested.muted || this.client?.audioSrc === 'disabled';
        }
        if (typeof requested?.hidden === 'boolean') {
          result.hidden = requested.hidden || this.client?.videoSrc === 'disabled';
        }
      }
      return result;
    };
    avSettings._pf2ValLazyUserSettings = true;
  }
  // LiveKit AVClient 0.6.8 embeds livekit-client 2.19.x, which defaults to
  // singlePeerConnection=true (/rtc/v1). Our LiveKit server 1.9.4 only
  // exposes the legacy /rtc route; v1 validation produces a 404 and the
  // automatic fallback may fail to negotiate media. Force the supported
  // dual-peer-connection signalling mode before the Room connects.
  const originalInitializeRoom = lk.initializeRoom;
  if (typeof originalInitializeRoom === 'function') {
    lk.initializeRoom = function (...args) {
      const result = originalInitializeRoom.apply(this, args);
      if (this.liveKitRoom?.options) {
        this.liveKitRoom.options.singlePeerConnection = false;
      } else {
        console.warn('PF2e Val Toolkit | Impossible de régler le protocole RTC LiveKit : objet Room indisponible.');
      }
      return result;
    };
  }
  for (const [kind, allowed] of [
    ['Audio', () => game.webrtc?.canUserShareAudio(localId())],
    ['Video', () => game.webrtc?.canUserShareVideo(localId())]
  ]) {
    const method = `initialize${kind}Track`;
    const original = lk[method];
    if (typeof original !== 'function') continue;
    lk[method] = function (...args) {
      if (!allowed() || worldMode() === MODES.OFF) {
        this[`${kind.toLowerCase()}Track`] = null;
        return Promise.resolve();
      }
      return original.apply(this, args);
    };
  }

  const captureFailed = (kind, error) => {
    console.error(`PF2e Val Toolkit | Impossible d'activer ${kind}:`, error);
    ui.notifications?.error?.(`Impossible d'activer ${kind}. Vérifiez les périphériques et les autorisations du navigateur.`);
    // Do not leave the Foundry icon saying "enabled" after a failed capture.
    const property = kind === 'le micro' ? 'muted' : 'hidden';
    game.webrtc?.settings?.set?.('client', `users.${localId()}.${property}`, true);
  };
  const acquireAudio = async () => {
    await lk.changeAudioSource();
    if (!lk.audioTrack) throw new Error('Aucune piste micro créée par LiveKit.');
    if (!game.webrtc?.canUserShareAudio(localId()) || worldMode() === MODES.OFF) {
      await lk.audioTrack.mute();
    }
  };
  const originalAudio = client.toggleAudio;
  if (typeof originalAudio === 'function') {
    client.toggleAudio = function (enabled) {
      if (enabled && !lk.audioTrack && !lk.useExternalAV && game.webrtc?.canUserShareAudio(localId())) {
        return acquireAudio().then(() => originalAudio.call(this, enabled))
          .catch(error => captureFailed('le micro', error));
      }
      return originalAudio.call(this, enabled);
    };
  }
  const originalBroadcast = client.toggleBroadcast;
  if (typeof originalBroadcast === 'function') {
    client.toggleBroadcast = function (enabled) {
      if (enabled && !lk.audioTrack && !lk.useExternalAV && game.webrtc?.canUserShareAudio(localId())) {
        return acquireAudio().then(() => originalBroadcast.call(this, enabled))
          .catch(error => captureFailed('le micro', error));
      }
      return originalBroadcast.call(this, enabled);
    };
  }
  const originalVideo = client.toggleVideo;
  if (typeof originalVideo === 'function') {
    client.toggleVideo = function (enabled) {
      if (enabled && !lk.videoTrack && !lk.useExternalAV && game.webrtc?.canUserShareVideo(localId())) {
        return lk.changeVideoSource().then(() => {
          if (!lk.videoTrack) throw new Error('Aucune piste caméra créée par LiveKit.');
          if (!game.webrtc?.canUserShareVideo(localId()) || worldMode() !== MODES.VIDEO) {
            return lk.videoTrack?.mute?.();
          }
          return originalVideo.call(this, enabled);
        }).catch(error => captureFailed('la caméra', error));
      }
      return originalVideo.call(this, enabled);
    };
  }
  lk._pf2ValPrivateCapture = true;
}

/** Called on init: before Foundry's initializeRTC constructs AVMaster. */
function protectFirstConnection() {
  const proto = foundry.av?.AVMaster?.prototype;
  if (!proto || proto._pf2ValAVGuard) return;
  const nativeConnect = proto.connect;
  proto.connect = async function (...args) {
    if (!isLiveKitClient(this.client)) return nativeConnect.apply(this, args);
    if (!isInitialized()) return false;
    installPrivateCapture(this.client);
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
    if (result && game.ready) void offerLocalAVActivation();
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
  // Ready can run after Foundry's initial LiveKit handshake finished.
  void offerLocalAVActivation();

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
