import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { VanStep0Intro } from './components/van/VanStep0Intro'
import { VanStep1Puzzle } from './components/van/VanStep1Puzzle'
import { VanStep2Equipment } from './components/van/VanStep2Equipment'
import { VanStep3Validation } from './components/van/VanStep3Validation'
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

type VanPhase = 'step0' | 'step1' | 'step2' | 'step3'

const VAN_INTRO_AUDIO_URL = 'https://l7r.fr/l7r/GhostIntro.mp3'

const VAN_OBJECTIVE_INTRO = 'Intro terminee'
const VAN_OBJECTIVE_MATERIAL = 'Récupérer le matériel de localisation'
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

function deriveVanPhase(objectives: VanObjective[], mjAccepted: boolean): VanPhase {
  const hasGhost = objectives.some(item => isObjectiveMatch(item.objective, VAN_OBJECTIVE_GHOST) && item.completed)
  if (hasGhost || mjAccepted) {
    return 'step3'
  }

  const hasMaterial = objectives.some(item => isObjectiveMatch(item.objective, VAN_OBJECTIVE_MATERIAL) && item.completed)
  if (hasMaterial) {
    return 'step2'
  }

  const hasIntro = objectives.some(item => isObjectiveMatch(item.objective, VAN_OBJECTIVE_INTRO) && item.completed)
  if (hasIntro) {
    return 'step1'
  }

  return 'step0'
}

function getVanPhaseRank(phase: VanPhase): number {
  switch (phase) {
    case 'step0':
      return 0
    case 'step1':
      return 1
    case 'step2':
      return 2
    case 'step3':
      return 3
    default:
      return 0
  }
}

export function App() {
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
  const vanIntroAudioRef = useRef<HTMLAudioElement | null>(null)
  const vanMusicAudioRef = useRef<HTMLAudioElement | null>(null)
  const lastTriggeredSoundRef = useRef<Record<string, string>>({})
  const [vanPhase, setVanPhase] = useState<VanPhase>('step0')
  const [vanIntroState, setVanIntroState] = useState<'idle' | 'playing' | 'done'>('idle')
  const [vanGhostGuess, setVanGhostGuess] = useState('')
  const [vanGhostDeclarationError, setVanGhostDeclarationError] = useState('')
  const lastPlayedVanMessageIdRef = useRef<string>('')
  const [vanScenarioStep, setVanScenarioStep] = useState<number | null>(null)
  const introCompletionPendingRef = useRef(false)

  // Van data
  const [vanData, setVanData] = useState<{
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
      const refreshMs = roleFromList === 'emf' ? 150 : 1000

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
            video: { width: 480, height: 360, facingMode: 'user' },
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

    const captureAndSend = async () => {
      if (!canvasRef.current || !videoRef.current) return
      if (ghostcamUploadInFlightRef.current) return
      if (videoRef.current.readyState < 2) return
      if (state.role === 'ghostcam' && photoPaused) return

      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return
      const width = canvasRef.current.width
      const height = canvasRef.current.height
      const ghostUntilTs = state.ghostUntil ? Date.parse(state.ghostUntil) : NaN
      const ghostActive = Number.isFinite(ghostUntilTs) && ghostUntilTs > Date.now()
      const orbUntilTs = state.orbUntil ? Date.parse(state.orbUntil) : NaN
      const orbsActive = Number.isFinite(orbUntilTs) && orbUntilTs > Date.now()
      const isRed = ghostActive

      // Dessiner le flux video
      ctx.drawImage(videoRef.current, 0, 0, width, height)

      // Teinte verte forte façon caméra paranormal.
      ctx.fillStyle = isRed ? 'rgba(255, 40, 40, 0.34)' : 'rgba(0, 255, 125, 0.32)'
      ctx.fillRect(0, 0, width, height)

      // Scanlines serrées et marquées.
      ctx.strokeStyle = isRed ? 'rgba(255, 180, 180, 0.24)' : 'rgba(165, 255, 185, 0.24)'
      ctx.lineWidth = 1
      for (let i = 0; i < height; i += 4) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(width, i)
        ctx.stroke()
      }

      // Lignes de glitch horizontales aléatoires.
      ctx.strokeStyle = isRed ? 'rgba(255, 120, 120, 0.6)' : 'rgba(120, 255, 155, 0.6)'
      for (let i = 0; i < 5; i++) {
        const y = Math.random() * height
        const offset = (Math.random() - 0.5) * 20
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y + offset)
        ctx.stroke()
      }

      // Grain vidéo prononcé.
      const noiseDensity = Math.floor((width * height) / 180)
      ctx.fillStyle = isRed ? 'rgba(255, 190, 190, 0.15)' : 'rgba(185, 255, 210, 0.15)'
      for (let i = 0; i < noiseDensity; i++) {
        const x = Math.floor(Math.random() * width)
        const y = Math.floor(Math.random() * height)
        ctx.fillRect(x, y, 1, 1)
      }

      // Flash de gain pour un rendu plus saturé/hostile.
      ctx.globalCompositeOperation = 'overlay'
      ctx.fillStyle = isRed ? 'rgba(255, 40, 40, 0.2)' : 'rgba(40, 255, 120, 0.18)'
      ctx.fillRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'source-over'

      // Vignette sombre pour renforcer le style caméra nocturne.
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.25,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.72
      )
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.58)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, width, height)

      // Apparition de fantôme temporaire (pilotée par MJ).

      if (ghostActive && state.role === 'ghostcam') {
        const now = Date.now() / 1000
        const ghostW = width * 0.24
        const ghostH = height * 0.44
        const jitterX = Math.sin(now * 4.4) * 8
        const jitterY = Math.cos(now * 5.1) * 5
        const ghostX = width * (0.52 + Math.sin(now * 0.9) * 0.18) + jitterX
        const ghostY = height * (0.42 + Math.cos(now * 0.8) * 0.08) + jitterY

        ctx.save()
        ctx.globalAlpha = isRed ? 0.5 : 0.56

        const bodyGradient = ctx.createRadialGradient(
          ghostX,
          ghostY,
          ghostW * 0.15,
          ghostX,
          ghostY,
          ghostW * 0.65
        )
        bodyGradient.addColorStop(0, isRed ? 'rgba(255, 220, 220, 0.92)' : 'rgba(225, 255, 240, 0.95)')
        bodyGradient.addColorStop(1, isRed ? 'rgba(255, 110, 110, 0)' : 'rgba(170, 255, 205, 0)')
        ctx.fillStyle = bodyGradient

        // Tête
        ctx.beginPath()
        ctx.ellipse(ghostX, ghostY - ghostH * 0.27, ghostW * 0.32, ghostH * 0.21, 0, 0, Math.PI * 2)
        ctx.fill()

        // Corps flottant
        ctx.beginPath()
        ctx.moveTo(ghostX - ghostW * 0.37, ghostY - ghostH * 0.15)
        ctx.quadraticCurveTo(ghostX - ghostW * 0.46, ghostY + ghostH * 0.22, ghostX - ghostW * 0.18, ghostY + ghostH * 0.44)
        ctx.quadraticCurveTo(ghostX, ghostY + ghostH * 0.32 + Math.sin(now * 3.2) * 9, ghostX + ghostW * 0.18, ghostY + ghostH * 0.44)
        ctx.quadraticCurveTo(ghostX + ghostW * 0.46, ghostY + ghostH * 0.22, ghostX + ghostW * 0.37, ghostY - ghostH * 0.15)
        ctx.closePath()
        ctx.fill()

        // Yeux
        ctx.globalAlpha = 0.85
        ctx.fillStyle = isRed ? 'rgba(170, 0, 0, 0.95)' : 'rgba(10, 35, 10, 0.92)'
        ctx.beginPath()
        ctx.ellipse(ghostX - ghostW * 0.1, ghostY - ghostH * 0.29, ghostW * 0.038, ghostH * 0.026, 0, 0, Math.PI * 2)
        ctx.ellipse(ghostX + ghostW * 0.1, ghostY - ghostH * 0.29, ghostW * 0.038, ghostH * 0.026, 0, 0, Math.PI * 2)
        ctx.fill()

        // Halo spectral
        ctx.globalAlpha = 0.32
        ctx.strokeStyle = isRed ? 'rgba(255, 120, 120, 0.9)' : 'rgba(168, 255, 205, 0.9)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(ghostX, ghostY, ghostW * 0.56, ghostH * 0.62, Math.sin(now * 0.7) * 0.2, 0, Math.PI * 2)
        ctx.stroke()

        ctx.restore()
      }

      if (orbsActive && state.role === 'ghostcam') {
        const now = Date.now() / 1000
        const orbCount = 5
        for (let i = 0; i < orbCount; i++) {
          const px = width * (0.2 + ((i + 1) / (orbCount + 1)) * 0.62) + Math.sin(now * (1.1 + i * 0.18)) * 16
          const py = height * (0.25 + ((i % 3) * 0.18)) + Math.cos(now * (1.4 + i * 0.22)) * 10
          const radius = 5 + ((i * 2) % 6)

          const orbGradient = ctx.createRadialGradient(px, py, 1, px, py, radius * 2.4)
          orbGradient.addColorStop(0, 'rgba(214, 236, 255, 0.96)')
          orbGradient.addColorStop(0.5, 'rgba(120, 185, 255, 0.4)')
          orbGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

          ctx.fillStyle = orbGradient
          ctx.beginPath()
          ctx.arc(px, py, radius * 2.4, 0, Math.PI * 2)
          ctx.fill()

          ctx.strokeStyle = 'rgba(145, 205, 255, 0.6)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(px, py, radius, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // Convertir en base64 et envoyer
      const frameData = canvasRef.current.toDataURL('image/jpeg', 0.35)

      try {
        ghostcamUploadInFlightRef.current = true
        await fetch(`/apil7r/admin/device/${deviceId}/camera-frame`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frame: frameData })
        })
      } catch {
        // Erreur silencieuse
      } finally {
        ghostcamUploadInFlightRef.current = false
      }
    }

    const interval = setInterval(captureAndSend, 200) // 5 FPS

    return () => clearInterval(interval)
  }, [state?.role, state?.cameraColor, state?.ghostUntil, state?.orbUntil, photoPaused, deviceId])

  useEffect(() => {
    if (state?.role !== 'emf') {
      return
    }

    const captureWebcam = async () => {
      if (!canvasRef.current || !videoRef.current) return
      if (emfUploadInFlightRef.current) return
      if (videoRef.current.readyState < 2) return

      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return

      // Dessiner le flux vidéo sur un canvas invisible
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)

      // Envoyer au backend (en silencieux, le joueur ne voit rien)
      const frameData = canvasRef.current.toDataURL('image/jpeg', 0.35)

      try {
        emfUploadInFlightRef.current = true
        await fetch(`/apil7r/admin/device/${deviceId}/camera-frame`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frame: frameData })
        })
      } catch {
        // Erreur silencieuse
      } finally {
        emfUploadInFlightRef.current = false
      }
    }

    const interval = setInterval(captureWebcam, 200) // 5 FPS

    return () => clearInterval(interval)
  }, [state?.role, deviceId])

  useEffect(() => {
    if (state?.role !== 'van' && state?.role !== 'messagerie') {
      return
    }

    const pollVanData = () => {
      const vanFetchId = state?.role === 'messagerie' ? 'van' : deviceId
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
          
          setVanData({
            ghostActivityLevel: device.ghostActivityLevel ?? 0,
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
          })
        })
        .catch(() => {
          // Réseau non disponible
        })
    }

    pollVanData()
    const interval = setInterval(pollVanData, 500)

    return () => clearInterval(interval)
  }, [state?.role, deviceId])

  useEffect(() => {
    return () => {
      vanIntroAudioRef.current?.pause()
      vanMusicAudioRef.current?.pause()
    }
  }, [])

  useEffect(() => {
    if (state?.role !== 'van') {
      setVanPhase('step0')
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
    updater: (current: VanObjective[]) => VanObjective[]
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
      await fetch(`/apil7r/admin/device/${encodeURIComponent(deviceId)}/van`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionObjectives: JSON.stringify(next) })
      })

      setVanData(prev => (prev ? { ...prev, missionObjectives: next } : prev))
    } catch {
      // Réseau non disponible
    }
  }

  useEffect(() => {
    if (state?.role !== 'van') {
      return
    }

    const objectives = ensureVanObjectives(vanData?.missionObjectives ?? [])
    const introCompleted = Boolean(objectives[0]?.completed)

    if (vanScenarioStep === 0 && !introCompleted && !introCompletionPendingRef.current) {
      setVanPhase('step0')
      setVanIntroState('idle')
      return
    }

    const nextPhase = deriveVanPhase(objectives, Boolean(state.huntActive))

    setVanPhase(prev => {
      if (getVanPhaseRank(nextPhase) > getVanPhaseRank(prev)) {
        return nextPhase
      }
      return prev
    })
    setVanIntroState(prev => (nextPhase === 'step0' ? 'idle' : prev === 'playing' ? prev : 'done'))
  }, [state?.role, state?.huntActive, vanData?.missionObjectives, vanScenarioStep])

  useEffect(() => {
    if (state?.role !== 'van' || (vanPhase !== 'step1' && vanPhase !== 'step2' && vanPhase !== 'step3')) {
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
      setVanPhase('step1')
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
    if (vanPhase !== 'step2') {
      setVanGhostDeclarationError('Le nom du spectre se valide uniquement en étape 2.')
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

    if (answer !== 'edouard') {
      setVanGhostDeclarationError('Ce n’est pas le bon spectre.')
      return
    }

    setVanPhase('step3')
    void patchVanObjectives(current =>
      current.map(item =>
        isObjectiveMatch(item.objective, VAN_OBJECTIVE_GHOST)
          ? { ...item, completed: true }
          : item
      )
    )
    setVanGhostDeclarationError('')
  }

  useEffect(() => {
    if (state?.role !== 'van') {
      return
    }

    const sentMessages = vanData?.vanSentMessages ?? []
    const latestAudioMessage = [...sentMessages].reverse().find(message => message.kind === 'audio' && message.audioUrl)

    if (!latestAudioMessage || latestAudioMessage.id === lastPlayedVanMessageIdRef.current) {
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
    if (state?.role !== 'van' || vanPhase === 'step0' || !vanData) {
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

  useEffect(() => {
    if (state?.role !== 'van' || vanPhase !== 'step1' || !deviceId) {
      return
    }

    const interval = setInterval(async () => {
      setVanData(prev => {
        if (!prev) return prev
        const nextActivityLevel = Math.min(100, prev.ghostActivityLevel + 1)
        
        // Patch server with new activity level
        fetch(`/apil7r/player/device/${deviceId}/van`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ghostActivityLevel: nextActivityLevel })
        }).catch(() => {
          // Network error, ignore
        })
        
        return {
          ...prev,
          ghostActivityLevel: nextActivityLevel
        }
      })
    }, 15000) // 15 seconds

    return () => clearInterval(interval)
  }, [state?.role, vanPhase, deviceId])

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
    const mjAccepted = Boolean(state.huntActive)

    return (
      <ThemeProvider theme={darkTheme}>
        <VanContainer>
          <audio ref={vanMusicAudioRef} preload="auto" />
          <VanDashboard>
            <VanHeader>
              <VanTitle>PARANORMAL DETECTION SYSTEM</VanTitle>
              <VanStatus>
                {'MISSION EN COURS'}
              </VanStatus>
            </VanHeader>

            {vanPhase === 'step0' && (
              <VanStep0Intro vanIntroState={vanIntroState} onPlayIntro={() => void playVanIntro()} />
            )}
            {vanPhase === 'step1' && (
              <VanStep1Puzzle
                objectives={objectives}
                ghostActivity={ghostActivity}
                floorPlanImage={vanData?.floorPlanImage}
                feedMessages={vanData?.vanSentMessages ?? []}
              />
            )}
            {vanPhase === 'step2' && (
              <VanStep2Equipment
                floorPlanImage={vanData?.floorPlanImage}
                vanGhostGuess={vanGhostGuess}
                onGhostGuessChange={setVanGhostGuess}
                onDeclareGhost={declareGhost}
                vanGhostDeclarationError={vanGhostDeclarationError}
              />
            )}
            {vanPhase === 'step3' && (
              <VanStep3Validation floorPlanImage={vanData?.floorPlanImage} mjAccepted={mjAccepted} />
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


