import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { VanStep0Intro } from './components/van/VanStep0Intro'
import { VanStep2Equipment } from './components/van/VanStep2Equipment'
import { VanStep7Victory } from './components/van/VanStep7Victory'
import { GhostEvidenceCardsPrintPage } from './components/print/GhostEvidenceCardsPrintPage'
import { VanDashboard, VanHeader, VanStatus, VanTitle } from './components/van/van-styles'
import { EmfDeviceView } from './components/devices/EmfDeviceView'
import { SpiritBoxDeviceView } from './components/devices/SpiritBoxDeviceView'
import { GhostCamDeviceView } from './components/devices/GhostCamDeviceView'
import { ThermometerDeviceView } from './components/devices/ThermometerDeviceView'
import { MessagerieDeviceView } from './components/devices/MessagerieDeviceView'
import { useEmfNeedle } from './hooks/useEmfNeedle'
import { useGhostCamPhotoMode } from './hooks/useGhostCamPhotoMode'
import { useSpiritBoxAudio } from './hooks/useSpiritBoxAudio'
import { VanFeedMessage, VanObjective } from './components/van/types'

const darkTheme = {
  background: '#07111c',
  color: '#dce8f7',
}

type DeviceRole = 'emf' | 'spiritbox' | 'ghostcam' | 'thermometer' | 'ghostorbs' | 'van' | 'messagerie'

type Device = {
  deviceId: string
  role: DeviceRole
  emfLevel?: number
  powerOn?: boolean
  huntActive: boolean
  message?: string
  cameraColor?: 'green' | 'red'
  temperature?: number
  ghostUntil?: string
  orbUntil?: string
  photoModeUnlocked?: boolean
  ghostActivityLevel?: number
  playerSanity?: string
  soundLevels?: string
  motionDetections?: string
  roomList?: string
  motionSensorRooms?: string
  recentMotionAlert?: string
  missionObjectives?: string
  floorPlanImage?: string
  backgroundMusic?: string
  soundboard?: string
  vanMessageTemplates?: string
  vanSentMessages?: string
}

type VanBackgroundMusic = {
  title: string
  url: string
  volume: number
  loop: boolean
  playing: boolean
}

type VanSoundCue = {
  id: string
  label: string
  url: string
  volume: number
  lastTriggeredAt?: string
}

type VanPhase = 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'step6' | 'step7'

// Libellé affiché dans le bandeau de la vue van classique (étapes 2-6)
const VAN_STEP_BANNERS: Record<VanPhase, string> = {
  step1: 'Lecture du message',
  step2: 'Récupérer le matériel de localisation',
  step3: "Trouver la zone d'activité du fantôme",
  step4: "Récupérer le matériel d'identification",
  step5: 'Identifier le fantôme',
  step6: 'Bannir le fantôme',
  step7: 'Victoire',
}

const VAN_INTRO_AUDIO_URL = 'https://l7r.fr/l7r/GhostIntro.mp3'
const GHOST_CAM_SPRITE_URL = '/Colin2.png' // servi en same-origin depuis public/

const VAN_OBJECTIVE_INTRO = 'Intro terminee'
const VAN_OBJECTIVE_MATERIAL = 'Récupérer le matériel de localisation'
const VAN_OBJECTIVE_LOCATE = "Trouver la zone d'activité du fantôme"
const VAN_OBJECTIVE_IDENTIFICATION_GEAR = "Récupérer le matériel d'identification"
const VAN_OBJECTIVE_GHOST = 'Identifier le fantôme'

const DEFAULT_VAN_OBJECTIVES: VanObjective[] = [
  { objective: VAN_OBJECTIVE_INTRO, completed: false },
  { objective: 'Récupérer le matériel de localisation', completed: false },
  { objective: "Trouver la zone d'activité du fantôme", completed: false },
  { objective: "Récupérer le matériel d'identification", completed: false },
  { objective: 'Identifier le fantôme', completed: false },
  { objective: 'Bannir le fantôme', completed: false },
]

function normalizeVanText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function isObjectiveMatch(value: string, expected: string): boolean {
  return normalizeVanText(value) === normalizeVanText(expected)
}

function ensureVanObjectives(objectives: VanObjective[]): VanObjective[] {
  const normalized: VanObjective[] = objectives.map(item => ({
    objective: item.objective,
    completed: Boolean(item.completed),
  }))

  DEFAULT_VAN_OBJECTIVES.forEach(required => {
    if (!normalized.some(item => isObjectiveMatch(item.objective, required.objective))) {
      normalized.push({ ...required })
    }
  })

  return normalized
}

function deriveVanObjectiveStep(objectives: VanObjective[]): number {
  const normalized = ensureVanObjectives(objectives)
  let count = 0

  for (const objective of DEFAULT_VAN_OBJECTIVES) {
    const matched = normalized.find(item => isObjectiveMatch(item.objective, objective.objective))
    if (!matched?.completed) {
      break
    }
    count += 1
  }

  return count
}

// Mappe les données backend vers le numéro d'étape affiché côté player (1..7).
// - Aucun objectif terminé → 1 (lecture du message)
// - Intro lu → 2, Matériel → 3, Lieu → 4, Id Gear → 5, Fantôme → 6, Banish → 7
// - Override par vanStep persisté (ex: photo finale) si plus avancé.
function deriveDisplayedVanStep(
  objectives: VanObjective[],
  persistedVanStep: number | undefined,
  hasFinalPhoto: boolean,
): number {
  const objStep = deriveVanObjectiveStep(objectives)
  const fromObjectives = Math.max(1, Math.min(7, objStep + 1))
  const persisted =
    typeof persistedVanStep === 'number' ? Math.max(1, Math.min(7, persistedVanStep)) : 1
  let step = Math.max(fromObjectives, persisted)
  if (hasFinalPhoto) step = 7
  return step
}

function phaseFromDisplayedStep(step: number): VanPhase {
  const clamped = Math.max(1, Math.min(7, step))
  return (`step${clamped}` as VanPhase)
}

function deriveVanPhase(objectives: VanObjective[], _mjAccepted: boolean): VanPhase {
  return phaseFromDisplayedStep(deriveDisplayedVanStep(objectives, undefined, false))
}

function getVanPhaseRank(phase: VanPhase): number {
  switch (phase) {
    case 'step1':
      return 1
    case 'step2':
      return 2
    case 'step3':
      return 3
    case 'step4':
      return 4
    case 'step5':
      return 5
    case 'step6':
      return 6
    case 'step7':
      return 7
    default:
      return 1
  }
}

export function App() {
  const isGhostCardsPage =
    window.location.pathname === '/ghost-cards' || window.location.pathname === '/ghost-cards/'

  if (isGhostCardsPage) {
    return <GhostEvidenceCardsPrintPage />
  }

  const [deviceId, setDeviceId] = useState('')
  const [devices, setDevices] = useState<Device[]>([])
  const [state, setState] = useState<Device | null>(null)
  const [step, setStep] = useState<'choose' | 'play'>('choose')
  const [playStatus, setPlayStatus] = useState<'idle' | 'loading' | 'ready' | 'not-found' | 'error'>('idle')
  const [playError, setPlayError] = useState('')
  const audioContextRef = useRef<AudioContext | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const emfUploadInFlightRef = useRef(false)
  const ghostcamUploadInFlightRef = useRef(false)
  const ghostCamSpriteRef = useRef<HTMLImageElement | null>(null)
  // Canvas offscreen pour toDataURL — jamais taint par le sprite cross-origin.
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null)
  // Quand photoPaused passe true, on rend UNE dernière frame (avec teinte rouge si fantôme)
  // puis on bloque le rendu. Ref consulté par captureAndSend.
  const pausedFrameDrawnRef = useRef(false)
  const persistPhotoModeUnlocked = useCallback(
    async (unlocked: boolean): Promise<void> => {
      if (!deviceId) {
        return
      }

      await fetch(`/apil7r/admin/device/${encodeURIComponent(deviceId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoModeUnlocked: unlocked })
      })

      setState(prev => (prev ? { ...prev, photoModeUnlocked: unlocked } : prev))
    },
    [deviceId]
  )
  const {
    photoPaused,
    photoModeUnlocked,
    photoModePassword,
    photoModeError,
    setPhotoModePassword,
    togglePhotoPause,
    unlockPhotoMode
  } = useGhostCamPhotoMode(state?.role, Boolean(state?.photoModeUnlocked), persistPhotoModeUnlocked)
  const { needleAngle } = useEmfNeedle({ role: state?.role, emfLevel: state?.emfLevel, powerOn: state?.powerOn })
  const {
    spiritStatus,
    spiritLastHeardAt,
    spiritFrequency,
    tuneSpiritFrequencyDown,
    tuneSpiritFrequencyUp,
  } = useSpiritBoxAudio(state?.role, deviceId, state?.powerOn ?? true)

  useEffect(() => {
    const sprite = new Image()
    // Pas de crossOrigin : le serveur distant ne renvoie pas de headers CORS.
    // Sans crossOrigin l'image se charge normalement ; le canvas peut devenir
    // tainted mais on gère ca dans captureAndSend (try/catch sur toDataURL).
    sprite.src = GHOST_CAM_SPRITE_URL
    ghostCamSpriteRef.current = sprite

    return () => {
      if (ghostCamSpriteRef.current === sprite) {
        ghostCamSpriteRef.current = null
      }
    }
  }, [])

  const vanIntroAudioRef = useRef<HTMLAudioElement | null>(null)
  const vanMusicAudioRef = useRef<HTMLAudioElement | null>(null)
  const lastTriggeredSoundRef = useRef<Record<string, string>>({})
  const lastActivityAdjustRef = useRef(0)
  const [vanPhase, setVanPhase] = useState<VanPhase>('step1')
  const [vanIntroState, setVanIntroState] = useState<'idle' | 'playing' | 'done'>('idle')
  const [vanGhostGuess, setVanGhostGuess] = useState('')
  const [vanGhostDeclarationError, setVanGhostDeclarationError] = useState('')
  const lastPlayedVanMessageIdRef = useRef<string>('')
  const [vanScenarioStep, setVanScenarioStep] = useState<number | null>(null)
  const introCompletionPendingRef = useRef(false)

  // Van data
  const [vanData, setVanData] = useState<{
    vanStep?: number
    vanPendingPhoto?: string
    vanFinalPhoto?: string
    vanFearMessageAt?: string
    ghostActivityLevel: number
    playerSanity: Record<string, number>
    soundLevels: Record<string, number>
    motionDetections: Record<string, boolean>
    roomList: string[]
    motionSensorRooms: string[]
    recentMotionAlert?: string
    missionObjectives: Array<{ objective: string; completed: boolean }>
    floorPlanImage?: string
    liveCameraFrame?: string
    backgroundMusic: VanBackgroundMusic
    soundboard: VanSoundCue[]
    vanSentMessages: VanFeedMessage[]
  } | null>(null)

  // Message "pas assez effrayant" : affich\u00e9 4s apr\u00e8s un refus MJ, puis efface.
  const [ghostcamFearMessage, setGhostcamFearMessage] = useState<string | undefined>(undefined)
  const lastSeenFearMessageAtRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    const fearAt = vanData?.vanFearMessageAt
    if (!fearAt) return
    if (fearAt === lastSeenFearMessageAtRef.current) return
    lastSeenFearMessageAtRef.current = fearAt
    setGhostcamFearMessage('Pas assez effrayant. Recommence !')
    if (photoPaused) {
      togglePhotoPause()
    }
    const timer = window.setTimeout(() => setGhostcamFearMessage(undefined), 4000)
    return () => window.clearTimeout(timer)
  }, [vanData?.vanFearMessageAt, photoPaused, togglePhotoPause])

  const createDefaultVanBackgroundMusic = (): VanBackgroundMusic => ({
    title: '',
    url: '',
    volume: 70,
    loop: true,
    playing: false
  })

  const parseVanBackgroundMusic = (raw?: string): VanBackgroundMusic => {
    if (!raw) {
      return createDefaultVanBackgroundMusic()
    }

    try {
      const parsed = JSON.parse(raw) as Partial<VanBackgroundMusic>
      return {
        title: typeof parsed.title === 'string' ? parsed.title : '',
        url: typeof parsed.url === 'string' ? parsed.url : '',
        volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.volume))) : 70,
        loop: parsed.loop ?? true,
        playing: parsed.playing ?? false
      }
    } catch {
      return createDefaultVanBackgroundMusic()
    }
  }

  const parseVanSoundboard = (raw?: string): VanSoundCue[] => {
    if (!raw) {
      return []
    }

    try {
      const parsed = JSON.parse(raw) as Array<Partial<VanSoundCue>>
      return parsed
        .filter(item => item && typeof item === 'object')
        .map((item, index) => ({
          id: typeof item.id === 'string' && item.id ? item.id : `cue-${index}`,
          label: typeof item.label === 'string' ? item.label : '',
          url: typeof item.url === 'string' ? item.url : '',
          volume: typeof item.volume === 'number' ? Math.max(0, Math.min(100, Math.round(item.volume))) : 80,
          lastTriggeredAt: typeof item.lastTriggeredAt === 'string' ? item.lastTriggeredAt : undefined
        }))
    } catch {
      return []
    }
  }

  const parseVanSentMessages = (raw?: string): VanFeedMessage[] => {
    if (!raw) {
      return []
    }

    try {
      const parsed = JSON.parse(raw) as Array<Partial<VanFeedMessage>>
      return parsed
        .filter(item => item && typeof item === 'object')
        .map((item, index) => ({
          id: typeof item.id === 'string' && item.id ? item.id : `message-${index}`,
          kind:
            item.kind === 'audio' || item.kind === 'text' || item.kind === 'text_image'
              ? item.kind
              : 'text',
          title: typeof item.title === 'string' ? item.title : 'Message',
          text: typeof item.text === 'string' ? item.text : undefined,
          audioUrl: typeof item.audioUrl === 'string' ? item.audioUrl : undefined,
          imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
          sentAt: typeof item.sentAt === 'string' ? item.sentAt : new Date().toISOString()
        }))
    } catch {
      return []
    }
  }

  useEffect(() => {
    // Bouton plein écran flottant (injecte dans body pour apparaître quelle que soit la vue)
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = '⛶'
    btn.setAttribute('aria-label', 'Basculer le plein écran')
    btn.title = 'Plein écran'
    btn.style.cssText = [
      'position:fixed',
      'top:10px',
      'right:10px',
      'z-index:99999',
      'width:38px',
      'height:38px',
      'border-radius:50%',
      'border:1px solid rgba(255,255,255,0.4)',
      'background:rgba(0,0,0,0.55)',
      'color:#fff',
      'font-size:18px',
      'line-height:1',
      'cursor:pointer',
      'backdrop-filter:blur(4px)',
      'padding:0'
    ].join(';')
    const toggle = (): void => {
      const doc: any = document
      const el: any = document.documentElement
      const isFs = doc.fullscreenElement || doc.webkitFullscreenElement
      if (isFs) {
        const exit = doc.exitFullscreen || doc.webkitExitFullscreen
        if (exit) void exit.call(doc)
      } else {
        const req = el.requestFullscreen || el.webkitRequestFullscreen
        if (req) void req.call(el)
      }
    }
    btn.addEventListener('click', toggle)
    document.body.appendChild(btn)
    return () => {
      btn.removeEventListener('click', toggle)
      btn.remove()
    }
  }, [])

  useEffect(() => {
    fetch('/apil7r/player/devices')
      .then(r => r.json())
      .then(list => {
        setDevices(list)

        const fromUrl = new URLSearchParams(window.location.search).get('device')
        const normalized = fromUrl?.trim()

        if (normalized) {
          const matched = list.find((device: Device) => device.deviceId.toLowerCase() === normalized.toLowerCase())
          setDeviceId(matched?.deviceId ?? normalized)
          setStep('play')
          setPlayStatus('loading')
        }
      })
      .catch(() => {
        setPlayStatus('error')
        setPlayError('Impossible de charger la liste des devices.')
      })
  }, [])

  useEffect(() => {
    if (step === 'play' && deviceId) {
      const roleFromList = devices.find(device => device.deviceId === deviceId)?.role
      const refreshMs =
        roleFromList === 'emf' || roleFromList === 'ghostcam'
          ? 150
          : 1000

      const refreshState = async () => {
        try {
          const response = await fetch(`/apil7r/player/state?deviceId=${encodeURIComponent(deviceId)}`)
          if (!response.ok) {
            if (response.status === 404) {
              setState(null)
              setPlayStatus('not-found')
              setPlayError('')
              return
            }

            setPlayStatus('error')
            setPlayError(`Erreur API (${response.status})`)
            return
          }

          const next = (await response.json()) as Device | null
          if (!next) {
            setState(null)
            setPlayStatus('not-found')
            setPlayError('')
            return
          }

          setState(next)
          setPlayStatus('ready')
          setPlayError('')
        } catch {
          setPlayStatus('error')
          setPlayError('Impossible de contacter le serveur.')
        }
      }

      setPlayStatus(prev => (prev === 'ready' ? prev : 'loading'))
      void refreshState()

      const interval = setInterval(() => {
        void refreshState()
      }, refreshMs)

      return () => clearInterval(interval)
    }
  }, [step, deviceId, devices])

  useEffect(() => {
    if (state?.role !== 'emf') {
      return
    }

    const emfLevel = Math.max(0, Math.min(5, state.emfLevel ?? 0))
    const powerOn = state.powerOn ?? true

    if (!powerOn || emfLevel === 0) {
      return
    }

    const intervalByLevel = [0, 900, 720, 520, 360, 230]
    const freqByLevel = [0, 760, 900, 1020, 1180, 1340]
    const durationByLevel = [0, 0.035, 0.04, 0.048, 0.055, 0.07]

    const playBeep = () => {
      try {
        const AudioContextCtor = (window as any).AudioContext || (window as any).webkitAudioContext
        if (!AudioContextCtor) {
          return
        }

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextCtor()
        }

        const ctx = audioContextRef.current
        if (!ctx) {
          return
        }

        if (ctx.state === 'suspended') {
          void ctx.resume()
        }

        const now = ctx.currentTime
        const duration = durationByLevel[emfLevel]

        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()

        oscillator.type = 'square'
        oscillator.frequency.setValueAtTime(freqByLevel[emfLevel], now)

        gain.gain.setValueAtTime(0.0001, now)
        gain.gain.exponentialRampToValueAtTime(0.11, now + 0.005)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

        oscillator.connect(gain)
        gain.connect(ctx.destination)

        oscillator.start(now)
        oscillator.stop(now + duration + 0.01)
      } catch {
        // Audio can be blocked by browser autoplay policy before first user gesture.
      }
    }

    playBeep()
    const interval = setInterval(playBeep, intervalByLevel[emfLevel])

    return () => clearInterval(interval)
  }, [state?.role, state?.emfLevel, state?.powerOn])

  useEffect(() => {
    if (state?.role !== 'ghostcam' && state?.role !== 'thermometer' && state?.role !== 'ghostorbs' && state?.role !== 'emf') {
      return
    }

    const initCamera = async () => {
      try {
        if (!cameraStreamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: { ideal: 'user' },
              frameRate: { ideal: 30 }
            },
            audio: false
          })
          cameraStreamRef.current = stream

          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        }
      } catch {
        // Caméra non disponible
      }
    }

    void initCamera()
  }, [state?.role])

  useEffect(() => {
    if (state?.role !== 'ghostcam' && state?.role !== 'thermometer' && state?.role !== 'ghostorbs' && state?.role !== 'emf') {
      return
    }

    if (!videoRef.current || !cameraStreamRef.current) {
      return
    }

    if (videoRef.current.srcObject !== cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current
    }

    void videoRef.current.play().catch(() => {
      // Le navigateur peut bloquer la lecture auto avant interaction utilisateur.
    })
  }, [state?.role])

  useEffect(() => {
    if (state?.role !== 'ghostcam') {
      if (state?.role !== 'ghostorbs' && state?.role !== 'thermometer') {
        return
      }
    }

    // ─── Render + upload loop (~12 FPS) ──────────────────────────────────────
    // 12 FPS est volontaire pour l'effet caméra paranormal.
    // toDataURL (synchrone, coûteux) ne s'exécute qu'une fois toutes les 80ms.
    // L'upload est fire-and-forget : le rendu n'est jamais bloqué par le réseau.

    // Vignette pré-rendue : recréée uniquement si les dimensions changent (pas chaque tick).
    let vignetteCanvas: HTMLCanvasElement | null = null

    const captureAndSend = () => {
      if (!canvasRef.current || !videoRef.current) return
      if (videoRef.current.readyState < 2) return
      // Photo pause : frame figée déjà dessinée → stop.
      if (state.role === 'ghostcam' && photoPaused && pausedFrameDrawnRef.current) return

      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return
      const width = canvasRef.current.width
      const height = canvasRef.current.height

      // Canvas de capture offscreen (dimensions synchronisées).
      if (!captureCanvasRef.current) captureCanvasRef.current = document.createElement('canvas')
      const captureCanvas = captureCanvasRef.current
      if (captureCanvas.width !== width || captureCanvas.height !== height) {
        captureCanvas.width = width
        captureCanvas.height = height
      }
      const captureCtx = captureCanvas.getContext('2d')
      if (!captureCtx) return

      const ghostUntilTs = state.ghostUntil ? Date.parse(state.ghostUntil) : NaN
      const ghostActive = Number.isFinite(ghostUntilTs) && ghostUntilTs > Date.now()
      const orbUntilTs = state.orbUntil ? Date.parse(state.orbUntil) : NaN
      const orbsActive = Number.isFinite(orbUntilTs) && orbUntilTs > Date.now()
      const isRed = ghostActive && state.role === 'ghostcam' && photoPaused

      // Dessiner le flux video sur le canvas de capture.
      captureCtx.drawImage(videoRef.current, 0, 0, width, height)

      // Teinte verte forte facon camera paranormal.
      captureCtx.fillStyle = isRed ? 'rgba(255, 40, 40, 0.34)' : 'rgba(0, 255, 125, 0.32)'
      captureCtx.fillRect(0, 0, width, height)

      // Scanlines : un seul appel stroke() groupé (perf : 120 calls → 1).
      captureCtx.strokeStyle = isRed ? 'rgba(255, 180, 180, 0.24)' : 'rgba(165, 255, 185, 0.24)'
      captureCtx.lineWidth = 1
      captureCtx.beginPath()
      for (let i = 0; i < height; i += 4) {
        captureCtx.moveTo(0, i)
        captureCtx.lineTo(width, i)
      }
      captureCtx.stroke()

      // Lignes de glitch horizontales aleatoires.
      captureCtx.strokeStyle = isRed ? 'rgba(255, 120, 120, 0.6)' : 'rgba(120, 255, 155, 0.6)'
      captureCtx.beginPath()
      for (let i = 0; i < 5; i++) {
        const y = Math.random() * height
        const offset = (Math.random() - 0.5) * 20
        captureCtx.moveTo(0, y)
        captureCtx.lineTo(width, y + offset)
      }
      captureCtx.stroke()

      // Grain video prononce.
      const noiseDensity = Math.floor((width * height) / 180)
      captureCtx.fillStyle = isRed ? 'rgba(255, 190, 190, 0.15)' : 'rgba(185, 255, 210, 0.15)'
      for (let i = 0; i < noiseDensity; i++) {
        const x = Math.floor(Math.random() * width)
        const y = Math.floor(Math.random() * height)
        captureCtx.fillRect(x, y, 1, 1)
      }

      // Flash de gain : simple fillRect (pas d'overlay composite qui lit chaque pixel).
      captureCtx.fillStyle = isRed ? 'rgba(255, 40, 40, 0.14)' : 'rgba(40, 255, 120, 0.12)'
      captureCtx.fillRect(0, 0, width, height)

      // Vignette sombre — gradient recréé uniquement quand les dimensions changent.
      if (
        !vignetteCanvas ||
        vignetteCanvas.width !== width ||
        vignetteCanvas.height !== height
      ) {
        vignetteCanvas = document.createElement('canvas')
        vignetteCanvas.width = width
        vignetteCanvas.height = height
        const vCtx = vignetteCanvas.getContext('2d')!
        const gradient = vCtx.createRadialGradient(
          width / 2, height / 2, Math.min(width, height) * 0.25,
          width / 2, height / 2, Math.max(width, height) * 0.72
        )
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.58)')
        vCtx.fillStyle = gradient
        vCtx.fillRect(0, 0, width, height)
      }
      captureCtx.drawImage(vignetteCanvas, 0, 0)

      // Fantôme temporaire (piloté par MJ) - tout rendu sur captureCtx.
      if (ghostActive && state.role === 'ghostcam') {
        const sprite = ghostCamSpriteRef.current
        const now = Date.now() / 1000
        const ghostW = width * 0.26
        const ghostH = height * 0.52
        const jitterX = Math.sin(now * 4.4) * 6
        const jitterY = Math.cos(now * 5.1) * 4
        const ghostX = width * (0.52 + Math.sin(now * 0.9) * 0.18) + jitterX
        const ghostY = height * (0.42 + Math.cos(now * 0.8) * 0.08) + jitterY

        const drawGhostFallback = (c: CanvasRenderingContext2D) => {
          const bodyGradient = c.createRadialGradient(
            ghostX, ghostY - ghostH * 0.08, ghostW * 0.1,
            ghostX, ghostY, ghostH * 0.62
          )
          bodyGradient.addColorStop(0, isRed ? 'rgba(255, 210, 210, 0.92)' : 'rgba(210, 255, 235, 0.9)')
          bodyGradient.addColorStop(0.65, isRed ? 'rgba(255, 90, 90, 0.62)' : 'rgba(120, 255, 210, 0.56)')
          bodyGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
          c.fillStyle = bodyGradient
          c.beginPath()
          c.ellipse(ghostX, ghostY, ghostW * 0.33, ghostH * 0.48, 0, Math.PI, 0, true)
          c.lineTo(ghostX + ghostW * 0.22, ghostY + ghostH * 0.34)
          c.quadraticCurveTo(ghostX, ghostY + ghostH * 0.46, ghostX - ghostW * 0.22, ghostY + ghostH * 0.34)
          c.closePath()
          c.fill()
          c.fillStyle = isRed ? 'rgba(60, 0, 0, 0.8)' : 'rgba(5, 32, 18, 0.82)'
          c.beginPath()
          c.arc(ghostX - ghostW * 0.1, ghostY - ghostH * 0.1, ghostW * 0.028, 0, Math.PI * 2)
          c.arc(ghostX + ghostW * 0.1, ghostY - ghostH * 0.1, ghostW * 0.028, 0, Math.PI * 2)
          c.fill()
        }

        const applyRedOverlay = (c: CanvasRenderingContext2D) => {
          if (!isRed) return
          c.globalCompositeOperation = 'source-atop'
          c.fillStyle = 'rgba(255, 40, 40, 0.45)'
          c.fillRect(ghostX - ghostW / 2, ghostY - ghostH / 2, ghostW, ghostH)
          c.globalCompositeOperation = 'source-over'
        }

        captureCtx.save()
        captureCtx.globalAlpha = isRed ? 0.9 : 0.82
        captureCtx.filter = isRed
          ? 'drop-shadow(0 0 14px rgba(255, 70, 70, 0.85))'
          : 'drop-shadow(0 0 10px rgba(180, 255, 220, 0.55))'
        if (sprite && sprite.complete && sprite.naturalWidth > 0 && sprite.naturalHeight > 0) {
          captureCtx.drawImage(sprite, ghostX - ghostW / 2, ghostY - ghostH / 2, ghostW, ghostH)
        } else {
          drawGhostFallback(captureCtx)
        }
        captureCtx.filter = 'none'
        applyRedOverlay(captureCtx)
        captureCtx.restore()
      }

      if (orbsActive && state.role === 'ghostcam') {
        const now = Date.now() / 1000
        const orbCount = 5
        for (let i = 0; i < orbCount; i++) {
          const px = width * (0.2 + ((i + 1) / (orbCount + 1)) * 0.62) + Math.sin(now * (1.1 + i * 0.18)) * 16
          const py = height * (0.25 + ((i % 3) * 0.18)) + Math.cos(now * (1.4 + i * 0.22)) * 10
          const radius = 5 + ((i * 2) % 6)

          const orbGradient = captureCtx.createRadialGradient(px, py, 1, px, py, radius * 2.4)
          orbGradient.addColorStop(0, 'rgba(214, 236, 255, 0.96)')
          orbGradient.addColorStop(0.5, 'rgba(120, 185, 255, 0.4)')
          orbGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
          captureCtx.fillStyle = orbGradient
          captureCtx.beginPath()
          captureCtx.arc(px, py, radius * 2.4, 0, Math.PI * 2)
          captureCtx.fill()
          captureCtx.strokeStyle = 'rgba(145, 205, 255, 0.6)'
          captureCtx.lineWidth = 1
          captureCtx.beginPath()
          captureCtx.arc(px, py, radius, 0, Math.PI * 2)
          captureCtx.stroke()
        }
      }

      // Copier capture → display (joueur et admin voient la même image).
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(captureCanvas, 0, 0)

      // Upload fire-and-forget : ne bloque pas le tick suivant.
      if (!ghostcamUploadInFlightRef.current) {
        const frameData = captureCanvas.toDataURL('image/jpeg', 0.35)
        if (state.role === 'ghostcam' && photoPaused) {
          pausedFrameDrawnRef.current = true
        }
        ghostcamUploadInFlightRef.current = true
        fetch(`/apil7r/admin/device/${deviceId}/camera-frame`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frame: frameData })
        }).catch(() => {}).finally(() => {
          ghostcamUploadInFlightRef.current = false
        })
      }
    }

    // Réinitialise le flag de pause quand on (re)démarre l'effet.
    pausedFrameDrawnRef.current = false
    const interval = setInterval(captureAndSend, 80) // ~12 FPS

    return () => clearInterval(interval)
  }, [state?.role, state?.cameraColor, state?.ghostUntil, state?.orbUntil, photoPaused, deviceId])

  useEffect(() => {
    if (state?.role !== 'emf') {
      return
    }

    const captureWebcam = () => {
      if (!canvasRef.current || !videoRef.current) return
      if (emfUploadInFlightRef.current) return
      if (videoRef.current.readyState < 2) return

      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return

      // Dessiner le flux vidéo sur un canvas invisible
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)

      // Upload fire-and-forget : ne bloque pas le tick suivant (fix 1 FPS).
      const frameData = canvasRef.current.toDataURL('image/jpeg', 0.35)
      emfUploadInFlightRef.current = true
      fetch(`/apil7r/admin/device/${deviceId}/camera-frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: frameData })
      }).catch(() => {}).finally(() => {
        emfUploadInFlightRef.current = false
      })
    }

    const interval = setInterval(captureWebcam, 80) // ~12 FPS

    return () => clearInterval(interval)
  }, [state?.role, deviceId])

  useEffect(() => {
    if (state?.role !== 'van' && state?.role !== 'messagerie' && state?.role !== 'ghostcam') {
      return
    }

    const pollVanData = () => {
      const discoveredVanId = devices.find(device => device.role === 'van')?.deviceId
      const vanFetchId = state?.role === 'van' ? deviceId : (discoveredVanId || 'van')
      fetch(`/apil7r/player/device/${vanFetchId}/van?ts=${Date.now()}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(async (device: any) => {
          if (!device) return

          let liveGhostCamFrame: string | undefined
          try {
            const cameraPayload = await fetch('/apil7r/player/device/ghostcam/camera-frame').then(r => r.json())
            if (typeof cameraPayload?.frame === 'string' && cameraPayload.frame) {
              liveGhostCamFrame = cameraPayload.frame
            }
          } catch {
            // Flux caméra indisponible, fallback sur l'image van existante.
          }

          try {
            const gamePayload = await fetch('/apil7r/game/hardcoded-game?ts=' + Date.now(), { cache: 'no-store' }).then(r => r.json())
            if (typeof gamePayload?.currentScenarioStep === 'number') {
              setVanScenarioStep(gamePayload.currentScenarioStep)
            }
          } catch {
            // Partie indisponible, on garde la logique locale par objectifs.
          }
          
          setVanData(prev => ({
            vanStep: typeof device.vanStep === 'number' ? device.vanStep : undefined,
            vanPendingPhoto: typeof device.vanPendingPhoto === 'string' ? device.vanPendingPhoto : undefined,
            vanFinalPhoto: typeof device.vanFinalPhoto === 'string' ? device.vanFinalPhoto : undefined,
            vanFearMessageAt: typeof device.vanFearMessageAt === 'string' ? device.vanFearMessageAt : undefined,
            ghostActivityLevel: (Date.now() - lastActivityAdjustRef.current < 3000)
              ? (prev?.ghostActivityLevel ?? device.ghostActivityLevel ?? 0)
              : (device.ghostActivityLevel ?? 0),
            playerSanity: device.playerSanity ? JSON.parse(device.playerSanity) : {},
            soundLevels: device.soundLevels ? JSON.parse(device.soundLevels) : {},
            motionDetections: device.motionDetections ? JSON.parse(device.motionDetections) : {},
            roomList: device.roomList ? JSON.parse(device.roomList) : [],
            motionSensorRooms: device.motionSensorRooms ? JSON.parse(device.motionSensorRooms) : [],
            recentMotionAlert: device.recentMotionAlert,
            missionObjectives: ensureVanObjectives(device.missionObjectives ? JSON.parse(device.missionObjectives) : []),
            floorPlanImage: device.floorPlanImage,
            liveCameraFrame: liveGhostCamFrame,
            backgroundMusic: parseVanBackgroundMusic(device.backgroundMusic),
            soundboard: parseVanSoundboard(device.soundboard),
            vanSentMessages: parseVanSentMessages(device.vanSentMessages)
          }))
        })
        .catch(() => {
          // Réseau non disponible
        })
    }

    pollVanData()
    const interval = setInterval(pollVanData, 500)

    return () => clearInterval(interval)
  }, [state?.role, deviceId, devices])

  // Etape 7 sur le device ghostcam : on n'effectue PLUS de redirect vers le van,
  // pour preserver la navigation arriere. L'affichage victoire est rendu en overlay
  // sur GhostCamDeviceView (voir plus bas).

  useEffect(() => {
    return () => {
      vanIntroAudioRef.current?.pause()
      vanMusicAudioRef.current?.pause()
    }
  }, [])

  useEffect(() => {
    if (state?.role !== 'van') {
      setVanPhase('step1')
      setVanIntroState('idle')
      setVanGhostGuess('')
      setVanGhostDeclarationError('')
      lastPlayedVanMessageIdRef.current = ''
      vanIntroAudioRef.current?.pause()
      vanMusicAudioRef.current?.pause()
      return
    }

    setVanGhostGuess('')
    setVanGhostDeclarationError('')
    lastPlayedVanMessageIdRef.current = ''
    vanIntroAudioRef.current?.pause()
  }, [state?.role, deviceId])

  const patchVanObjectives = async (
    updater: (current: VanObjective[]) => VanObjective[],
    stepOverride?: number
  ): Promise<void> => {
    if (state?.role !== 'van' || !deviceId) {
      return
    }

    const current = ensureVanObjectives(vanData?.missionObjectives ?? [])
    const next = ensureVanObjectives(updater(current))

    if (JSON.stringify(current) === JSON.stringify(next)) {
      return
    }

    try {
      const currentPersisted = typeof vanData?.vanStep === 'number' ? vanData.vanStep : 1
      const derivedDisplayed = Math.max(1, Math.min(7, deriveVanObjectiveStep(next) + 1))
      const nextVanStep =
        typeof stepOverride === 'number'
          ? Math.max(1, Math.min(7, stepOverride))
          : Math.max(currentPersisted, derivedDisplayed)
      await fetch(`/apil7r/admin/device/${encodeURIComponent(deviceId)}/van`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionObjectives: JSON.stringify(next), vanStep: nextVanStep })
      })

      setVanData(prev => (prev ? { ...prev, missionObjectives: next, vanStep: nextVanStep } : prev))
    } catch {
      // Réseau non disponible
    }
  }

  const validateVanLocation = useCallback((_roomId: string): void => {
    // Étape 3 → 4 : le joueur a cliqué sur la bonne salle (salle de bain).
    void patchVanObjectives(current =>
      current.map(item =>
        isObjectiveMatch(item.objective, VAN_OBJECTIVE_LOCATE)
          ? { ...item, completed: true }
          : item
      )
    , 4)
  }, [patchVanObjectives])

  useEffect(() => {
    if (state?.role !== 'van') {
      return
    }

    const objectives = ensureVanObjectives(vanData?.missionObjectives ?? [])
    const introCompleted = objectives.some(
      item => isObjectiveMatch(item.objective, VAN_OBJECTIVE_INTRO) && item.completed
    )
    const backendVanStep = vanData?.vanStep
    const hasFinalPhoto = Boolean((vanData as any)?.vanFinalPhoto)

    const displayedStep = deriveDisplayedVanStep(objectives, backendVanStep, hasFinalPhoto)
    const nextPhase = phaseFromDisplayedStep(displayedStep)

    const shouldForceIntro =
      !introCompleted &&
      !introCompletionPendingRef.current &&
      (vanScenarioStep === 0 || backendVanStep === 0 || backendVanStep === 1 || backendVanStep === undefined)

    let resolvedPhase = vanPhase

    if (shouldForceIntro) {
      resolvedPhase = 'step1'
    } else if (getVanPhaseRank(nextPhase) > getVanPhaseRank(vanPhase)) {
      resolvedPhase = nextPhase
    } else if (hasFinalPhoto) {
      resolvedPhase = 'step7'
    }

    if (resolvedPhase !== vanPhase) {
      setVanPhase(resolvedPhase)
    }

    setVanIntroState(prev => (resolvedPhase === 'step1' ? prev : prev === 'playing' ? prev : 'done'))
  }, [state?.role, state?.huntActive, vanData?.missionObjectives, vanData?.vanStep, (vanData as any)?.vanFinalPhoto, vanScenarioStep, vanPhase])

  useEffect(() => {
    if (state?.role !== 'van' || vanPhase === 'step1' || vanPhase === 'step7') {
      vanMusicAudioRef.current?.pause()
      return
    }

    const audio = vanMusicAudioRef.current
    const music = vanData?.backgroundMusic

    if (!audio || !music) {
      return
    }

    audio.loop = music.loop
    audio.volume = music.volume / 100

    if (!music.url.trim()) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      return
    }

    if (audio.src !== music.url) {
      audio.src = music.url
      audio.load()
    }

    if (!music.playing) {
      audio.pause()
      return
    }

    void audio.play().catch(() => {
      // Le player van ne doit pas exposer d'information sur les musiques.
    })
  }, [state?.role, vanPhase, vanData?.backgroundMusic])

  const playVanIntro = async (): Promise<void> => {
    if (state?.role !== 'van' || vanIntroState === 'playing') {
      return
    }

    const introAudio = vanIntroAudioRef.current ?? new Audio(VAN_INTRO_AUDIO_URL)
    vanIntroAudioRef.current = introAudio
    introAudio.pause()
    introAudio.currentTime = 0
    introAudio.loop = false
    introAudio.volume = 0.92
    introAudio.src = VAN_INTRO_AUDIO_URL
    introAudio.onended = () => {
      introCompletionPendingRef.current = true
      setVanIntroState('done')
      setVanPhase('step2')
      setVanData(prev => {
        if (!prev) {
          return prev
        }

        const nextObjectives = ensureVanObjectives(
          prev.missionObjectives.map(item =>
            isObjectiveMatch(item.objective, VAN_OBJECTIVE_INTRO)
              ? { ...item, completed: true }
              : item
          )
        )

        return { ...prev, missionObjectives: nextObjectives }
      })
      void patchVanObjectives(current =>
        current.map(item =>
          isObjectiveMatch(item.objective, VAN_OBJECTIVE_INTRO)
            ? { ...item, completed: true }
            : item
        )
      ).finally(() => {
        introCompletionPendingRef.current = false
      })
    }
    introAudio.onerror = () => {
      setVanIntroState('idle')
      setVanGhostDeclarationError(`Impossible de lire ${VAN_INTRO_AUDIO_URL}`)
    }

    setVanGhostDeclarationError('')
    setVanIntroState('playing')

    try {
      await introAudio.play()
    } catch {
      setVanIntroState('idle')
      setVanGhostDeclarationError('Le navigateur a bloqué la lecture de l’intro.')
    }
  }

  const declareGhost = (): void => {
    if (vanPhase !== 'step5') {
      setVanGhostDeclarationError('Le nom du spectre se valide uniquement en étape 5.')
      return
    }

    if (!window.confirm('Confirmer la saisie du nom du spectre ?')) {
      return
    }

    const answer = vanGhostGuess.trim().toLowerCase()
    if (!answer) {
      setVanGhostDeclarationError('Entre un nom avant de valider.')
      return
    }

    if (answer !== 'oni') {
      setVanGhostDeclarationError('Ce n’est pas le bon spectre.')
      return
    }

    setVanPhase('step6')
    void patchVanObjectives(current =>
      current.map(item => {
        if (isObjectiveMatch(item.objective, VAN_OBJECTIVE_IDENTIFICATION_GEAR)) {
          return { ...item, completed: true }
        }

        if (isObjectiveMatch(item.objective, VAN_OBJECTIVE_GHOST)) {
          return { ...item, completed: true }
        }

        return item
      })
    , 6)
    setVanGhostDeclarationError('')
  }

  useEffect(() => {
    if (state?.role !== 'van') {
      return
    }

    const sentMessages = vanData?.vanSentMessages ?? []
    const latestAudioMessage = [...sentMessages].reverse().find(message => message.kind === 'audio' && message.audioUrl)

    // Réinit côté MJ : la liste de messages est redevenue vide → reset du curseur.
    if (sentMessages.length === 0) {
      lastPlayedVanMessageIdRef.current = ''
      return
    }

    if (!latestAudioMessage || latestAudioMessage.id === lastPlayedVanMessageIdRef.current) {
      return
    }

    // Lors du premier chargement on ne rejoue pas les messages deja presents en base
    // (sinon on entend l'intro / un message ancien sans avoir clique sur "lancer").
    if (lastPlayedVanMessageIdRef.current === '') {
      lastPlayedVanMessageIdRef.current = latestAudioMessage.id
      return
    }

    const audio = new Audio(latestAudioMessage.audioUrl)
    audio.volume = 0.95
    void audio.play().catch(() => {
      // Lecture auto potentiellement bloquée sans interaction utilisateur.
    })

    lastPlayedVanMessageIdRef.current = latestAudioMessage.id
  }, [state?.role, vanData?.vanSentMessages])

  useEffect(() => {
    if (state?.role !== 'van' || vanPhase === 'step1' || !vanData) {
      lastTriggeredSoundRef.current = {}
      return
    }

    vanData.soundboard.forEach(cue => {
      if (!cue.lastTriggeredAt || !cue.url.trim()) {
        return
      }

      if (lastTriggeredSoundRef.current[cue.id] === cue.lastTriggeredAt) {
        return
      }

      lastTriggeredSoundRef.current[cue.id] = cue.lastTriggeredAt
      const audio = new Audio(cue.url)
      audio.volume = cue.volume / 100
      void audio.play().catch(() => {
        // Le player van ne doit pas exposer d'information sur les musiques.
      })
    })
  }, [state?.role, vanPhase, vanData])


  if (step === 'choose') {
    return (
      <ThemeProvider theme={darkTheme}>
        <Container>
          <h1>Choisis ton device</h1>
          <ul>
            {devices.map(d => (
              <li key={d.deviceId}>
                <button
                  onClick={() => {
                    setDeviceId(d.deviceId)
                    setStep('play')
                    const url = new URL(window.location.href)
                    url.searchParams.set('device', d.deviceId)
                    window.history.replaceState(null, '', url.toString())
                  }}
                >
                  {d.deviceId} ({d.role})
                </button>
              </li>
            ))}
          </ul>
        </Container>
      </ThemeProvider>
    )
  }

  if (step === 'play' && playStatus === 'not-found') {
    return (
      <ThemeProvider theme={darkTheme}>
        <Container>
          <StatusCard>
            <h2>Device introuvable</h2>
            <p>Aucun device ne correspond à "{deviceId}".</p>
            <StatusActions>
              <button
                type="button"
                onClick={() => {
                  setStep('choose')
                  setDeviceId('')
                  setState(null)
                  setPlayStatus('idle')
                  setPlayError('')
                  const url = new URL(window.location.href)
                  url.searchParams.delete('device')
                  window.history.replaceState(null, '', url.toString())
                }}
              >
                Voir les devices disponibles
              </button>
            </StatusActions>
          </StatusCard>
        </Container>
      </ThemeProvider>
    )
  }

  if (step === 'play' && playStatus === 'error') {
    return (
      <ThemeProvider theme={darkTheme}>
        <Container>
          <StatusCard>
            <h2>Erreur</h2>
            <p>{playError || 'Une erreur inconnue est survenue.'}</p>
          </StatusCard>
        </Container>
      </ThemeProvider>
    )
  }

  if (!state) {
    return (
      <ThemeProvider theme={darkTheme}>
        <Container>
          <StatusCard>
            <h2>Chargement</h2>
            <p>Connexion au device en cours...</p>
          </StatusCard>
        </Container>
      </ThemeProvider>
    )
  }

  // UI selon le rôle
  if (state.role === 'emf') {
    return (
      <ThemeProvider theme={darkTheme}>
        <EmfDeviceView state={state} needleAngle={needleAngle} videoRef={videoRef} canvasRef={canvasRef} />
      </ThemeProvider>
    )
  }
  if (state.role === 'spiritbox') {
    return (
      <ThemeProvider theme={darkTheme}>
        <SpiritBoxDeviceView
          state={state}
          spiritStatus={spiritStatus}
          spiritLastHeardAt={spiritLastHeardAt}
          spiritFrequency={spiritFrequency}
          onTuneFrequencyDown={tuneSpiritFrequencyDown}
          onTuneFrequencyUp={tuneSpiritFrequencyUp}
        />
      </ThemeProvider>
    )
  }
  if (state.role === 'ghostcam') {
    const ghostcamVanStep = typeof vanData?.vanStep === 'number' ? vanData.vanStep : 1
    const ghostcamFinalPhoto = (vanData as any)?.vanFinalPhoto as string | undefined
    const ghostcamVictory = Boolean(ghostcamFinalPhoto) || ghostcamVanStep >= 7
    return (
      <ThemeProvider theme={darkTheme}>
        <GhostCamDeviceView
          state={state}
          photoModeUnlocked={photoModeUnlocked}
          photoModePassword={photoModePassword}
          photoModeError={photoModeError}
          photoPaused={photoPaused}
          onPhotoModePasswordChange={setPhotoModePassword}
          onUnlockPhotoMode={unlockPhotoMode}
          onTogglePhotoPause={togglePhotoPause}
          videoRef={videoRef}
          canvasRef={canvasRef}
          hidePhotoButton={ghostcamVanStep >= 6}
          showVictoryOverlay={ghostcamVictory}
          victoryPhoto={ghostcamFinalPhoto}
          fearMessage={ghostcamFearMessage}
        />
      </ThemeProvider>
    )
  }
  if (state.role === 'ghostorbs' || state.role === 'thermometer') {
    return (
      <ThemeProvider theme={darkTheme}>
        <ThermometerDeviceView state={state} videoRef={videoRef} canvasRef={canvasRef} />
      </ThemeProvider>
    )
  }
  if (state.role === 'messagerie') {
    return (
      <ThemeProvider theme={darkTheme}>
        <Container>
          <MessagerieDeviceView messages={vanData?.vanSentMessages ?? []} />
        </Container>
      </ThemeProvider>
    )
  }
  if (state.role === 'van') {
    const ghostActivity = vanData?.ghostActivityLevel ?? 0
    const objectives = vanData?.missionObjectives ?? []

    const adjustGhostActivity = (delta: number): void => {
      setVanData(prev => {
        if (!prev) return prev
        const next = Math.max(0, Math.min(100, prev.ghostActivityLevel + delta))
        lastActivityAdjustRef.current = Date.now()
        if (deviceId) {
          void fetch(`/apil7r/admin/device/${encodeURIComponent(deviceId)}/van`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ghostActivityLevel: next })
          }).catch(() => {})
        }
        return { ...prev, ghostActivityLevel: next }
      })
    }

    return (
      <ThemeProvider theme={darkTheme}>
        <VanContainer>
          <audio ref={vanMusicAudioRef} preload="auto" />
          <VanDashboard>
            <VanHeader>
              <VanTitle>PARANORMAL DETECTION SYSTEM</VanTitle>
              <VanStatus>{'MISSION EN COURS'}</VanStatus>
            </VanHeader>

            {vanPhase === 'step1' && (
              <VanStep0Intro vanIntroState={vanIntroState} onPlayIntro={() => void playVanIntro()} />
            )}
            {(vanPhase === 'step2' ||
              vanPhase === 'step3' ||
              vanPhase === 'step4' ||
              vanPhase === 'step5' ||
              vanPhase === 'step6') && (
              <VanStep2Equipment
                currentStep={getVanPhaseRank(vanPhase)}
                stepBanner={VAN_STEP_BANNERS[vanPhase]}
                liveCameraFrame={vanData?.liveCameraFrame}
                objectives={objectives}
                ghostActivity={ghostActivity}
                materialCompleted={objectives.some(
                  obj => isObjectiveMatch(obj.objective, VAN_OBJECTIVE_MATERIAL) && obj.completed
                )}
                vanGhostGuess={vanGhostGuess}
                onGhostGuessChange={setVanGhostGuess}
                onDeclareGhost={declareGhost}
                vanGhostDeclarationError={vanGhostDeclarationError}
                messages={vanData?.vanSentMessages ?? []}
                onValidateLocation={validateVanLocation}
                locationFormEnabled={vanPhase === 'step3'}
                ghostFormEnabled={vanPhase === 'step5'}
                showBanishInstructions={vanPhase === 'step6'}
              />
            )}
            {vanPhase === 'step7' && (
              <VanStep7Victory finalPhoto={(vanData as any)?.vanFinalPhoto ?? undefined} />
            )}
          </VanDashboard>
        </VanContainer>
      </ThemeProvider>
    )
  }
  return <div>Rôle inconnu</div>
}

export default App

const Container = styled.div`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.color};
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

const VanContainer = styled(Container)`
  width: 100vw;
  max-width: 100vw;
  min-height: 100vh;
  padding: 0;
  align-items: stretch;
  justify-content: flex-start;
`

const StatusCard = styled.div`
  width: min(560px, 100%);
  border-radius: 14px;
  border: 1px solid #31403f;
  background: linear-gradient(180deg, #101a1a 0%, #0b1111 100%);
  padding: 1rem 1.2rem;
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.45);

  h2 {
    margin: 0 0 0.45rem;
    color: #d9f0cb;
  }

  p {
    margin: 0;
    color: #9db89f;
  }
`

const StatusActions = styled.div`
  margin-top: 0.9rem;
`



