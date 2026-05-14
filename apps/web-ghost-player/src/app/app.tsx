import React, { useEffect, useRef, useState } from 'react'
import styled, { ThemeProvider, keyframes } from 'styled-components'

const darkTheme = {
  background: '#07080a',
  color: '#e3f0d0',
}

type DeviceRole = 'emf' | 'spiritbox' | 'ghostcam' | 'ghostorbs' | 'van'

type Device = {
  deviceId: string
  role: DeviceRole
  emfLevel?: number
  powerOn?: boolean
  huntActive: boolean
  message?: string
  cameraColor?: 'green' | 'red'
  ghostUntil?: string
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

type SpiritAudioMessage = {
  id: string
  audioData: string
  mimeType?: string
  from: 'player' | 'mj'
  createdAt: string
}

export function App() {
  const [deviceId, setDeviceId] = useState('')
  const [devices, setDevices] = useState<Device[]>([])
  const [state, setState] = useState<Device | null>(null)
  const [step, setStep] = useState<'choose' | 'play'>('choose')
  const [playStatus, setPlayStatus] = useState<'idle' | 'loading' | 'ready' | 'not-found' | 'error'>('idle')
  const [playError, setPlayError] = useState('')
  const [emfNeedleJitter, setEmfNeedleJitter] = useState<number>(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const emfUploadInFlightRef = useRef(false)
  const ghostcamUploadInFlightRef = useRef(false)
  const [photoPaused, setPhotoPaused] = useState(false)

  const [spiritRecording, setSpiritRecording] = useState(false)
  const [spiritStatus, setSpiritStatus] = useState('READY')
  const [spiritLastHeardAt, setSpiritLastHeardAt] = useState<string>('')
  const spiritRecorderRef = useRef<MediaRecorder | null>(null)
  const spiritStreamRef = useRef<MediaStream | null>(null)
  const spiritChunksRef = useRef<BlobPart[]>([])
  const lastSpiritMjMessageIdRef = useRef<string>('')
  const vanMusicAudioRef = useRef<HTMLAudioElement | null>(null)
  const lastTriggeredSoundRef = useRef<Record<string, string>>({})

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
    backgroundMusic: VanBackgroundMusic
    soundboard: VanSoundCue[]
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

  useEffect(() => {
    fetch('/api/player/devices')
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
          const response = await fetch(`/api/player/state?deviceId=${encodeURIComponent(deviceId)}`)
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
      setEmfNeedleJitter(0)
      return
    }

    const emfLevel = Math.max(0, Math.min(5, state.emfLevel ?? 0))
    const powerOn = state.powerOn ?? true

    if (!powerOn || emfLevel === 0) {
      setEmfNeedleJitter(0)
      return
    }

    const amplitudeByLevel = [0, 0.8, 1.5, 2.5, 3.8, 5.8]
    const amplitude = amplitudeByLevel[emfLevel]

    const interval = setInterval(() => {
      const jitter = (Math.random() * 2 - 1) * amplitude * 2
      setEmfNeedleJitter(jitter)
    }, 70)

    return () => clearInterval(interval)
  }, [state?.role, state?.emfLevel, state?.powerOn])

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
    if (state?.role !== 'ghostcam' && state?.role !== 'ghostorbs' && state?.role !== 'emf') {
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
    if (state?.role !== 'ghostcam' && state?.role !== 'ghostorbs' && state?.role !== 'emf') {
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
      setPhotoPaused(false)
      if (state?.role !== 'ghostorbs') {
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
      const cameraColor = state.cameraColor ?? 'green'
      const isRed = cameraColor === 'red'

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
      const ghostUntilTs = state.ghostUntil ? Date.parse(state.ghostUntil) : NaN
      const ghostActive = Number.isFinite(ghostUntilTs) && ghostUntilTs > Date.now()

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

      if (ghostActive && state.role === 'ghostorbs') {
        const now = Date.now() / 1000
        const orbCount = 6
        for (let i = 0; i < orbCount; i++) {
          const px = width * (0.2 + ((i + 1) / (orbCount + 1)) * 0.65) + Math.sin(now * (1.2 + i * 0.2)) * 18
          const py = height * (0.35 + ((i % 3) * 0.16)) + Math.cos(now * (1.5 + i * 0.25)) * 12
          const radius = 6 + ((i * 3) % 7)

          const orbGradient = ctx.createRadialGradient(px, py, 1, px, py, radius * 2.4)
          orbGradient.addColorStop(0, isRed ? 'rgba(255, 220, 220, 0.95)' : 'rgba(220, 255, 235, 0.96)')
          orbGradient.addColorStop(0.5, isRed ? 'rgba(255, 120, 120, 0.34)' : 'rgba(170, 255, 205, 0.35)')
          orbGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

          ctx.fillStyle = orbGradient
          ctx.beginPath()
          ctx.arc(px, py, radius * 2.4, 0, Math.PI * 2)
          ctx.fill()

          ctx.strokeStyle = isRed ? 'rgba(255, 140, 140, 0.45)' : 'rgba(185, 255, 220, 0.45)'
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
        await fetch(`/api/admin/device/${deviceId}/camera-frame`, {
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
  }, [state?.role, state?.cameraColor, state?.ghostUntil, photoPaused, deviceId])

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
        await fetch(`/api/admin/device/${deviceId}/camera-frame`, {
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
    if (state?.role !== 'spiritbox') {
      return
    }

    const pollMjMessage = () => {
      fetch(`/api/player/device/${deviceId}/spiritbox/mj-message`)
        .then(r => r.json())
        .then((payload: { message?: SpiritAudioMessage }) => {
          const message = payload.message
          if (!message || message.id === lastSpiritMjMessageIdRef.current) {
            return
          }

          lastSpiritMjMessageIdRef.current = message.id
          setSpiritStatus('MESSAGE RECU')
          setSpiritLastHeardAt(new Date().toLocaleTimeString())

          playGhostAudio(message.audioData)
        })
        .catch(() => {
          // Réseau non disponible
        })
    }

    pollMjMessage()
    const interval = setInterval(pollMjMessage, 700)

    return () => clearInterval(interval)
  }, [state?.role, deviceId])

  useEffect(() => {
    if (state?.role !== 'van') {
      return
    }

    const pollVanData = () => {
      fetch(`/api/player/device/${deviceId}/van`)
        .then(r => r.json())
        .then((device: any) => {
          if (!device) return
          
          setVanData({
            ghostActivityLevel: device.ghostActivityLevel ?? 0,
            playerSanity: device.playerSanity ? JSON.parse(device.playerSanity) : {},
            soundLevels: device.soundLevels ? JSON.parse(device.soundLevels) : {},
            motionDetections: device.motionDetections ? JSON.parse(device.motionDetections) : {},
            roomList: device.roomList ? JSON.parse(device.roomList) : [],
            motionSensorRooms: device.motionSensorRooms ? JSON.parse(device.motionSensorRooms) : [],
            recentMotionAlert: device.recentMotionAlert,
            missionObjectives: device.missionObjectives ? JSON.parse(device.missionObjectives) : [],
            floorPlanImage: device.floorPlanImage,
            backgroundMusic: parseVanBackgroundMusic(device.backgroundMusic),
            soundboard: parseVanSoundboard(device.soundboard)
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
      spiritStreamRef.current?.getTracks().forEach(track => track.stop())
      spiritStreamRef.current = null
      vanMusicAudioRef.current?.pause()
    }
  }, [])

  useEffect(() => {
    if (state?.role !== 'van') {
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
  }, [state?.role, vanData?.backgroundMusic])

  useEffect(() => {
    if (state?.role !== 'van' || !vanData) {
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
  }, [state?.role, vanData])

  const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Lecture audio impossible'))
        }
      }
      reader.onerror = () => reject(new Error('Lecture audio impossible'))
      reader.readAsDataURL(blob)
    })

  const createGhostVoiceFX = (
    ctx: AudioContext,
    source: AudioNode
  ): { fx: AudioNode; masterGain: GainNode } => {
    // Low-pass filter pour assombrir la voix fantôme
    const lowPass = ctx.createBiquadFilter()
    lowPass.type = 'lowpass'
    lowPass.frequency.setValueAtTime(1800, ctx.currentTime)
    lowPass.Q.setValueAtTime(1.5, ctx.currentTime)

    // Distortion (bitcrusher) pour l'effet grésillement
    const distortion = ctx.createWaveShaper()
    const distortionCurve = new Float32Array(44100)
    for (let i = 0; i < 44100; i++) {
      const x = (i / 44100) * 2 - 1
      // Bitcrusher: réduire la précision du signal
      const bitDepth = 8
      distortionCurve[i] = Math.sign(x) * Math.round(Math.abs(x) * (1 << bitDepth)) / (1 << bitDepth)
    }
    distortion.curve = distortionCurve
    distortion.oversample = '4x'

    // Gain avec tremolo (variation d'amplitude pour effet spooky)
    const tremoloGain = ctx.createGain()
    const tremoloOsc = ctx.createOscillator()
    const tremoloDepth = ctx.createGain()

    tremoloOsc.frequency.setValueAtTime(4.5, ctx.currentTime) // Tremolo à 4.5 Hz
    tremoloDepth.gain.setValueAtTime(0.35, ctx.currentTime) // Profondeur du tremolo
    tremoloGain.gain.setValueAtTime(0.65, ctx.currentTime) // Gain de base (moins fort pour laisser de la place au tremolo)

    // Chaîne FX: source → low-pass → distortion → tremolo gain → master
    source.connect(lowPass)
    lowPass.connect(distortion)
    distortion.connect(tremoloGain)
    tremoloOsc.connect(tremoloDepth)
    tremoloDepth.connect(tremoloGain.gain)
    tremoloOsc.start()

    // Master gain pour contrôle final du volume
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.85, ctx.currentTime)
    tremoloGain.connect(masterGain)

    return { fx: masterGain, masterGain }
  }

  const playGhostAudio = (audioData: string): void => {
    const AudioContextCtor = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AudioContextCtor) {
      setSpiritStatus('WEB AUDIO UNAVAILABLE')
      return
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor()
    }

    const ctx = audioContextRef.current
    if (!ctx) {
      setSpiritStatus('AUDIO CONTEXT FAILED')
      return
    }

    if (ctx.state === 'suspended') {
      void ctx.resume()
    }

    try {
      // Décoder le data URL en ArrayBuffer
      const binaryString = atob(audioData.split(',')[1] || audioData)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      ctx.decodeAudioData(
        bytes.buffer,
        decodedBuffer => {
          const source = ctx.createBufferSource()
          source.buffer = decodedBuffer

          const { masterGain } = createGhostVoiceFX(ctx, source)
          masterGain.connect(ctx.destination)
          source.start()
        },
        () => {
          setSpiritStatus('DECODE ERROR')
        }
      )
    } catch {
      setSpiritStatus('AUDIO PLAY ERROR')
    }
  }

  const startSpiritRecording = async (): Promise<void> => {
    if (spiritRecording || state?.role !== 'spiritbox') {
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      spiritStreamRef.current = stream
      spiritChunksRef.current = []

      const recorder = MediaRecorder.isTypeSupported('audio/webm')
        ? new MediaRecorder(stream, { mimeType: 'audio/webm' })
        : new MediaRecorder(stream)
      spiritRecorderRef.current = recorder

      recorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) {
          spiritChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(spiritChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        spiritChunksRef.current = []

        if (blob.size === 0) {
          setSpiritStatus('AUCUN SON')
          return
        }

        void blobToDataUrl(blob)
          .then(audioData => {
            return fetch(`/api/player/device/${deviceId}/spiritbox/player-message`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioData, mimeType: blob.type || 'audio/webm' })
            })
          })
          .then(() => {
            setSpiritStatus('MESSAGE ENVOYE')
          })
          .catch(() => {
            setSpiritStatus('ECHEC ENVOI')
          })
          .finally(() => {
            spiritStreamRef.current?.getTracks().forEach(track => track.stop())
            spiritStreamRef.current = null
          })
      }

      recorder.start()
      setSpiritRecording(true)
      setSpiritStatus('ENREGISTREMENT...')
    } catch {
      setSpiritStatus('MICRO INDISPONIBLE')
    }
  }

  const stopSpiritRecording = (): void => {
    const recorder = spiritRecorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      return
    }

    recorder.stop()
    setSpiritRecording(false)
  }

  const toggleSpiritRecording = (): void => {
    if (spiritRecording) {
      stopSpiritRecording()
      return
    }
    void startSpiritRecording()
  }

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
    const emfLevel = Math.max(0, Math.min(5, state.emfLevel ?? 0))
    const powerOn = state.powerOn ?? true
    const baseAngle = powerOn ? -65 + (emfLevel / 5) * 130 : -80
    const needleAngle = baseAngle + (powerOn && emfLevel > 0 ? emfNeedleJitter : 0)

    return (
      <>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ display: 'none' }}
        />
        <canvas
          ref={canvasRef}
          width={480}
          height={360}
          style={{ display: 'none' }}
        />
        <ThemeProvider theme={darkTheme}>
          <DeviceScreen>
          <HudLine>
            <small>Device: {state.deviceId}</small>
            <small>{powerOn ? 'ONLINE' : 'OFFLINE'}</small>
          </HudLine>
          <EmfBody>
            <EmfTop>
              <EmfBrand>GHOST TECH</EmfBrand>
              <EmfLabel>ELECTRO MAGNETIC FIELD READER</EmfLabel>
            </EmfTop>

            <EmfDisplay $on={powerOn}>
              {powerOn ? `LVL ${emfLevel}` : 'OFF'}
            </EmfDisplay>

            <GaugeShell>
              <GaugeArc />
              <GaugeTicks>
                {[0, 1, 2, 3, 4, 5].map(level => (
                  <GaugeTick
                    key={level}
                    style={{ transform: `translateX(-50%) rotate(${-65 + (level / 5) * 130}deg)` }}
                  />
                ))}
              </GaugeTicks>
              <GaugeNeedle $on={powerOn} style={{ transform: `translateX(-50%) rotate(${needleAngle}deg)` }} />
              <GaugeCenter />
            </GaugeShell>

            <LedRail>
              {[1, 2, 3, 4, 5].map(level => (
                <Led key={level} $active={powerOn && level <= emfLevel} $level={level} />
              ))}
            </LedRail>

            <EmfFoot>
              <span>EMF SENSOR</span>
              <PowerBadge $on={powerOn}>{powerOn ? 'POWER ON' : 'POWER OFF'}</PowerBadge>
            </EmfFoot>
          </EmfBody>

          {state.message && <Message>{state.message}</Message>}
          {state.huntActive && <Hunt>HUNT!</Hunt>}
        </DeviceScreen>
        </ThemeProvider>
      </>
    )
  }
  if (state.role === 'spiritbox') {
    const powerOn = state.powerOn ?? true

    return (
      <ThemeProvider theme={darkTheme}>
        <Container>
          <HudLine>
            <small>Device: {state.deviceId}</small>
            <small>{powerOn ? 'ONLINE' : 'OFFLINE'}</small>
          </HudLine>

          <SpiritBoxShell>
            <SpiritBoxHeader>
              <strong>P-SB7T Spirit Box</strong>
              <span>{powerOn ? 'FM 100ms' : 'OFF'}</span>
            </SpiritBoxHeader>

            <SpiritBoxScreen $on={powerOn}>
              <SpiritFrequency>099.20</SpiritFrequency>
              <SpiritStatus>{spiritStatus}</SpiritStatus>
              {spiritLastHeardAt && <SpiritTimestamp>Dernier msg MJ: {spiritLastHeardAt}</SpiritTimestamp>}
            </SpiritBoxScreen>

            <SpiritActions>
              <SpiritButton
                type="button"
                onClick={toggleSpiritRecording}
                disabled={!powerOn}
              >
                {spiritRecording ? 'STOP / ENVOYER' : 'MESSAGE VOCAL'}
              </SpiritButton>
            </SpiritActions>
          </SpiritBoxShell>

          {state.message && <Message>{state.message}</Message>}
          {state.huntActive && <Hunt>HUNT!</Hunt>}
        </Container>
      </ThemeProvider>
    )
  }
  if (state.role === 'ghostcam') {
    return (
      <ThemeProvider theme={darkTheme}>
        <Container>
          <HudLine>
            <small>Device: {state.deviceId}</small>
            <small>{state.powerOn ? 'ONLINE' : 'OFFLINE'}</small>
          </HudLine>
          <GhostCamView>
            <GhostCamTitle>GHOST CAM</GhostCamTitle>
            <GhostCamActions>
              <GhostCamActionButton
                type="button"
                onClick={() => setPhotoPaused(prev => !prev)}
              >
                {photoPaused ? 'Relancer' : 'Photo'}
              </GhostCamActionButton>
            </GhostCamActions>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ display: 'none' }}
            />
            <GhostCamCanvas
              ref={canvasRef}
              width={480}
              height={360}
              style={{ display: state.powerOn ? 'block' : 'none' }}
            />
            {!state.powerOn && <GhostCamOffline>CAM OFFLINE</GhostCamOffline>}
            {photoPaused && <GhostCamPaused>PAUSE PHOTO</GhostCamPaused>}
          </GhostCamView>
          {state.message && <Message>{state.message}</Message>}
          {state.huntActive && <Hunt>HUNT!</Hunt>}
        </Container>
      </ThemeProvider>
    )
  }
  if (state.role === 'ghostorbs') {
    return (
      <ThemeProvider theme={darkTheme}>
        <Container>
          <HudLine>
            <small>Device: {state.deviceId}</small>
            <small>{state.powerOn ? 'ONLINE' : 'OFFLINE'}</small>
          </HudLine>
          <GhostCamView>
            <GhostCamTitle>GHOST ORBS</GhostCamTitle>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ display: 'none' }}
            />
            <GhostCamCanvas
              ref={canvasRef}
              width={480}
              height={360}
              style={{ display: state.powerOn ? 'block' : 'none' }}
            />
            {!state.powerOn && <GhostCamOffline>CAM OFFLINE</GhostCamOffline>}
          </GhostCamView>
          {state.message && <Message>{state.message}</Message>}
          {state.huntActive && <Hunt>HUNT!</Hunt>}
        </Container>
      </ThemeProvider>
    )
  }
  if (state.role === 'van') {
    const ghostActivity = vanData?.ghostActivityLevel ?? 0
    const sanity = vanData?.playerSanity ?? {}
    const soundLevels = vanData?.soundLevels ?? {}
    const motionDetections = vanData?.motionDetections ?? {}
    const objectives = vanData?.missionObjectives ?? []
    return (
      <ThemeProvider theme={darkTheme}>
        <Container>
          <audio ref={vanMusicAudioRef} preload="auto" />
          <VanDashboard>
            <VanHeader>
              <VanTitle>PARANORMAL DETECTION SYSTEM</VanTitle>
              <VanStatus>LIVE MONITORING</VanStatus>
            </VanHeader>

            {vanData?.floorPlanImage && (
              <VanFloorPlanSection>
                <VanSectionLabel>FLOOR PLAN</VanSectionLabel>
                <FloorPlanImage src={vanData.floorPlanImage} alt="Floor plan" />
              </VanFloorPlanSection>
            )}

            <VanGridLayout>
              <VanPanel>
                <VanPanelLabel>GHOST ACTIVITY</VanPanelLabel>
                <ActivityBar>
                  <ActivityLevel $level={ghostActivity} />
                  <ActivityValue>{ghostActivity}/10</ActivityValue>
                </ActivityBar>
              </VanPanel>

              <VanPanel>
                <VanPanelLabel>SANITY MONITORS</VanPanelLabel>
                <SanityGrid>
                  {Object.entries(sanity).map(([player, percent]) => (
                    <SanityItem key={player} $low={percent <= 35}>
                      <SanityPlayerName>{player}</SanityPlayerName>
                      <SanityBar>
                        <SanityLevel $percent={percent} />
                      </SanityBar>
                      <SanityPercent>{Math.round(percent)}%</SanityPercent>
                    </SanityItem>
                  ))}
                </SanityGrid>
              </VanPanel>

              <VanPanel>
                <VanPanelLabel>MOTION SENSORS</VanPanelLabel>
                {vanData?.recentMotionAlert && <VanAlert>{vanData.recentMotionAlert}</VanAlert>}
                <MotionGrid>
                  {Object.entries(motionDetections).map(([room, detected]) => (
                    <MotionItem key={room} $active={detected}>
                      <MotionDot $active={detected} />
                      <span>{room}</span>
                    </MotionItem>
                  ))}
                </MotionGrid>
              </VanPanel>

              <VanPanel>
                <VanPanelLabel>SOUND LEVELS</VanPanelLabel>
                <SoundGrid>
                  {Object.entries(soundLevels).map(([room, level]) => (
                    <SoundItem key={room}>
                      <SoundRoom>{room}</SoundRoom>
                      <SoundBar>
                        <SoundLevel $level={Math.min(level / 100, 1)} />
                      </SoundBar>
                    </SoundItem>
                  ))}
                </SoundGrid>
              </VanPanel>
            </VanGridLayout>

            {objectives.length > 0 && (
              <VanPanel>
                <VanPanelLabel>MISSION OBJECTIVES</VanPanelLabel>
                <ObjectivesList>
                  {objectives.map((obj, idx) => (
                    <ObjectiveItem key={idx} $completed={obj.completed}>
                      <ObjectiveCheck $completed={obj.completed}>✓</ObjectiveCheck>
                      <ObjectiveText>{obj.objective}</ObjectiveText>
                    </ObjectiveItem>
                  ))}
                </ObjectivesList>
              </VanPanel>
            )}
          </VanDashboard>
        </Container>
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

const DeviceScreen = styled(Container)`
  background: radial-gradient(circle at 50% 10%, #14171c 0%, #07080a 55%, #040507 100%);
  padding: 1.5rem;
`

const HudLine = styled.div`
  width: min(560px, 100%);
  display: flex;
  justify-content: space-between;
  color: #8ca07b;
  letter-spacing: 0.1em;
  margin-bottom: 0.9rem;
`

const EmfBody = styled.div`
  width: min(560px, 100%);
  border-radius: 16px;
  padding: 1.1rem;
  background: linear-gradient(180deg, #2f3439 0%, #14181c 100%);
  border: 1px solid #3e464e;
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
`

const EmfTop = styled.div`
  margin-bottom: 0.9rem;
`

const EmfBrand = styled.div`
  color: #d5e2bd;
  font-size: clamp(1rem, 3.8vw, 1.3rem);
  font-weight: 700;
  letter-spacing: 0.16em;
`

const EmfLabel = styled.div`
  color: #88957d;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
`

const grainShift = keyframes`
  0% { transform: translate(0, 0); }
  20% { transform: translate(-1px, 1px); }
  40% { transform: translate(1px, -1px); }
  60% { transform: translate(0, 1px); }
  80% { transform: translate(1px, 0); }
  100% { transform: translate(0, 0); }
`

const screenFlicker = keyframes`
  0%, 100% { opacity: 0.22; }
  35% { opacity: 0.3; }
  60% { opacity: 0.18; }
`

const EmfDisplay = styled.div<{ $on: boolean }>`
  position: relative;
  overflow: hidden;
  margin: 1rem 0;
  min-height: 96px;
  border-radius: 12px;
  background: ${({ $on }) => ($on ? '#0c1014' : '#090b0d')};
  border: 1px solid ${({ $on }) => ($on ? '#3f4e5c' : '#242b31')};
  color: ${({ $on }) => ($on ? '#d9efb4' : '#596069')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(2.1rem, 10vw, 3.7rem);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-shadow: ${({ $on }) => ($on ? '0 0 16px rgba(180, 226, 133, 0.4)' : 'none')};

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: ${({ $on }) => ($on ? 0.14 : 0.06)};
    background-image:
      repeating-linear-gradient(
        0deg,
        rgba(210, 235, 185, 0.18) 0px,
        rgba(210, 235, 185, 0.18) 1px,
        transparent 2px,
        transparent 4px
      ),
      repeating-linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.04) 0px,
        rgba(255, 255, 255, 0.04) 1px,
        transparent 2px,
        transparent 3px
      );
    animation: ${grainShift} 260ms steps(2) infinite;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.04) 0%,
      rgba(255, 255, 255, 0) 18%,
      rgba(255, 255, 255, 0.03) 46%,
      rgba(255, 255, 255, 0) 100%
    );
    opacity: ${({ $on }) => ($on ? 0.25 : 0.08)};
    animation: ${screenFlicker} 1.4s linear infinite;
  }
`

const GaugeShell = styled.div`
  position: relative;
  margin: 0.2rem auto 1rem;
  width: min(360px, 92%);
  height: 130px;
`

const GaugeArc = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 200px 200px 0 0;
  border: 2px solid #55606a;
  border-bottom: none;
  background:
    radial-gradient(circle at 50% 100%, transparent 44%, rgba(0, 0, 0, 0.35) 45%, transparent 46%),
    linear-gradient(180deg, rgba(33, 37, 42, 0.9) 0%, rgba(15, 18, 22, 0.95) 100%);
`

const GaugeTicks = styled.div`
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 88%;
  height: 110px;
`

const GaugeTick = styled.div`
  position: absolute;
  left: 50%;
  bottom: 6px;
  width: 2px;
  height: 22px;
  transform-origin: bottom center;
  background: #c4d2b2;
  box-shadow: 0 0 8px rgba(196, 210, 178, 0.35);
`

const GaugeNeedle = styled.div<{ $on: boolean }>`
  position: absolute;
  left: 50%;
  bottom: 10px;
  width: 4px;
  height: 94px;
  transform-origin: bottom center;
  border-radius: 10px;
  background: ${({ $on }) => ($on ? '#ff5f5f' : '#6f7680')};
  box-shadow: ${({ $on }) => ($on ? '0 0 12px rgba(255, 95, 95, 0.65)' : 'none')};
  transition: transform 120ms linear;
`

const GaugeCenter = styled.div`
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  transform: translateX(-50%);
  background: radial-gradient(circle at 35% 35%, #b7c4a8 0%, #5b6656 40%, #2e342d 100%);
  border: 1px solid #8d9b84;
`

const LedRail = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.95rem;
`

const Led = styled.div<{ $active: boolean; $level: number }>`
  height: 22px;
  border-radius: 6px;
  border: 1px solid #2f343b;
  background: ${({ $active, $level }) => {
    if (!$active) {
      return '#12151a'
    }
    if ($level <= 2) {
      return '#79e36c'
    }
    if ($level <= 4) {
      return '#f4c34f'
    }
    return '#ff5e5e'
  }};
  box-shadow: ${({ $active, $level }) => {
    if (!$active) {
      return 'inset 0 0 0 1px rgba(0, 0, 0, 0.3)'
    }
    if ($level <= 2) {
      return '0 0 12px rgba(121, 227, 108, 0.65)'
    }
    if ($level <= 4) {
      return '0 0 12px rgba(244, 195, 79, 0.65)'
    }
    return '0 0 12px rgba(255, 94, 94, 0.7)'
  }};
`

const EmfFoot = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #96a689;
  font-size: 0.85rem;
`

const PowerBadge = styled.span<{ $on: boolean }>`
  border-radius: 999px;
  border: 1px solid ${({ $on }) => ($on ? '#79e36c' : '#4f5964')};
  color: ${({ $on }) => ($on ? '#a6f39b' : '#9aa3ad')};
  padding: 0.25rem 0.62rem;
`

const SpiritBoxShell = styled.div`
  width: min(560px, 100%);
  border-radius: 16px;
  padding: 1rem;
  background: linear-gradient(180deg, #cbcfd5 0%, #8f98a3 100%);
  border: 1px solid #68717b;
  box-shadow:
    0 20px 42px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
`

const SpiritBoxHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.7rem;
  color: #101416;

  strong {
    letter-spacing: 0.04em;
  }

  span {
    font-weight: 700;
    font-size: 0.9rem;
  }
`

const SpiritBoxScreen = styled.div<{ $on: boolean }>`
  border-radius: 8px;
  border: 1px solid #b16727;
  background: ${({ $on }) => ($on ? '#f39b52' : '#5f5448')};
  color: #120d09;
  padding: 0.8rem;
  box-shadow: inset 0 0 0 1px rgba(255, 220, 180, 0.4);
  min-height: 130px;
`

const SpiritFrequency = styled.div`
  font-size: clamp(2.2rem, 9vw, 3.4rem);
  line-height: 1;
  letter-spacing: 0.03em;
  font-family: 'Courier New', monospace;
  font-weight: 700;
`

const SpiritStatus = styled.div`
  margin-top: 0.5rem;
  font-size: 1rem;
  letter-spacing: 0.08em;
  font-weight: 700;
`

const SpiritTimestamp = styled.div`
  margin-top: 0.45rem;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
`

const SpiritActions = styled.div`
  margin-top: 0.8rem;
  display: flex;
  justify-content: center;
`

const SpiritButton = styled.button`
  border: 1px solid #2f3942;
  border-radius: 8px;
  padding: 0.52rem 0.9rem;
  background: linear-gradient(180deg, #222a30 0%, #14191e 100%);
  color: #dce5ef;
  letter-spacing: 0.08em;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const GhostCamView = styled.div`
  width: min(560px, 100%);
  border-radius: 16px;
  padding: 1.1rem;
  background: linear-gradient(180deg, #2f3439 0%, #14181c 100%);
  border: 1px solid #3e464e;
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
`

const GhostCamTitle = styled.div`
  color: #d5e2bd;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  width: 100%;
  text-align: center;
`

const GhostCamActions = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`

const GhostCamActionButton = styled.button`
  border-radius: 8px;
  border: 1px solid #7aa391;
  background: linear-gradient(180deg, #173127 0%, #0e201a 100%);
  color: #d8efd8;
  letter-spacing: 0.08em;
  padding: 0.45rem 0.9rem;
  cursor: pointer;

  &:hover {
    filter: brightness(1.08);
  }
`

const GhostCamCanvas = styled.canvas`
  display: block;
  width: 100%;
  max-width: 480px;
  border-radius: 8px;
  border: 2px solid #3e464e;
  background: #0c1014;
  box-shadow: 0 0 20px rgba(0, 255, 100, 0.2);
  image-rendering: pixelated;
`

const GhostCamOffline = styled.div`
  width: 100%;
  max-width: 480px;
  aspect-ratio: 4 / 3;
  border-radius: 8px;
  border: 2px solid #3e464e;
  background: #0c1014;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #596069;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.1em;
`

const GhostCamPaused = styled.div`
  width: 100%;
  max-width: 480px;
  text-align: center;
  color: #bcd7b9;
  letter-spacing: 0.12em;
  font-weight: 700;
`

const Message = styled.div`
  font-size: 1.7rem;
  margin: 1rem;
  color: #d7eac0;
  text-align: center;
`

const Hunt = styled.div`
  color: #ff4444;
  font-size: 3rem;
  margin: 2rem;
  font-weight: bold;
`

const VanDashboard = styled.div`
  width: 100%;
  max-width: 1200px;
  background: linear-gradient(135deg, #0a0e12 0%, #0d1117 50%, #090c11 100%);
  border: 2px solid #1a4d3e;
  border-radius: 4px;
  padding: 1.5rem;
  box-shadow: 0 0 40px rgba(0, 200, 130, 0.15), inset 0 0 20px rgba(0, 0, 0, 0.8);
  color: #00d878;
  font-family: 'Courier New', monospace;
`

const VanHeader = styled.div`
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #1a4d3e;
  text-align: center;
`

const VanTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: 0.2em;
  color: #00ff99;
  text-shadow: 0 0 10px rgba(0, 255, 153, 0.5);
  font-weight: 700;
`

const VanStatus = styled.div`
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  color: #00d878;
  margin-top: 0.5rem;
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`

const VanFloorPlanSection = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid #1a4d3e;
  border-radius: 4px;
  background: rgba(0, 30, 20, 0.3);
`

const VanSectionLabel = styled.div`
  font-size: 0.8rem;
  letter-spacing: 0.15em;
  color: #00ff99;
  margin-bottom: 0.8rem;
  text-transform: uppercase;
  font-weight: 700;
`

const FloorPlanImage = styled.img`
  width: 100%;
  max-height: 300px;
  border: 1px solid #1a4d3e;
  border-radius: 2px;
  display: block;
`

const VanGridLayout = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`

const VanPanel = styled.div`
  border: 1px solid #1a4d3e;
  border-radius: 4px;
  padding: 1rem;
  background: rgba(0, 30, 20, 0.2);
  box-shadow: inset 0 0 10px rgba(0, 200, 130, 0.1);
`

const VanPanelLabel = styled.div`
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  color: #00ff99;
  margin-bottom: 0.8rem;
  text-transform: uppercase;
  font-weight: 700;
`

const ActivityBar = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const ActivityLevel = styled.div<{ $level: number }>`
  flex: 1;
  height: 30px;
  background: linear-gradient(90deg, #0a0e12 0%, #1a2a20 100%);
  border: 1px solid #1a4d3e;
  border-radius: 2px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${({ $level }) => ($level / 10) * 100}%;
    background: linear-gradient(90deg, #00ff99 0%, #00d878 50%, #ff6600 100%);
    transition: width 200ms;
    box-shadow: 0 0 10px rgba(0, 255, 153, 0.6);
  }
`

const ActivityValue = styled.span`
  font-weight: 700;
  color: #00ff99;
  min-width: 40px;
  text-align: right;
`

const SanityGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`

const SanityItem = styled.div<{ $low: boolean }>`
  display: grid;
  grid-template-columns: 80px 1fr 50px;
  align-items: center;
  gap: 0.5rem;
  padding: 0.2rem;
  border-left: 2px solid ${({ $low }) => ($low ? '#ff6b6b' : 'transparent')};
  background: ${({ $low }) => ($low ? 'rgba(255, 80, 80, 0.12)' : 'transparent')};
`

const SanityPlayerName = styled.span`
  font-size: 0.85rem;
  color: #00d878;
  overflow: hidden;
  text-overflow: ellipsis;
`

const SanityBar = styled.div`
  height: 20px;
  background: linear-gradient(90deg, #0a0e12 0%, #1a2a20 100%);
  border: 1px solid #1a4d3e;
  border-radius: 2px;
  overflow: hidden;
`

const SanityLevel = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background: linear-gradient(90deg, #00ff99 0%, #ffff00 50%, #ff6600 100%);
  transition: width 300ms;
  box-shadow: 0 0 8px rgba(0, 255, 153, 0.5);
`

const SanityPercent = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  color: #00ff99;
  text-align: right;
`

const MotionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.6rem;
`

const VanAlert = styled.div`
  margin-bottom: 0.7rem;
  padding: 0.45rem 0.55rem;
  border: 1px solid #cf6f2f;
  background: rgba(255, 120, 40, 0.18);
  color: #ffd9b3;
  font-weight: 700;
  letter-spacing: 0.04em;
`

const MotionItem = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid ${({ $active }) => ($active ? '#ff6600' : '#1a4d3e')};
  border-radius: 2px;
  background: ${({ $active }) => ($active ? 'rgba(255, 102, 0, 0.15)' : 'rgba(0, 30, 20, 0.2)')};
  font-size: 0.85rem;
  transition: all 200ms;
`

const MotionDot = styled.div<{ $active: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ $active }) => ($active ? '#ff6600' : '#1a4d3e')};
  box-shadow: ${({ $active }) => ($active ? '0 0 8px #ff6600' : 'none')};
  animation: ${({ $active }) => ($active ? 'pulse-orange' : 'none')} 500ms ease-in-out infinite;

  @keyframes pulse-orange {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

const SoundGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`

const SoundItem = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr;
  align-items: center;
  gap: 0.5rem;
`

const SoundRoom = styled.span`
  font-size: 0.8rem;
  color: #00d878;
`

const SoundBar = styled.div`
  height: 15px;
  background: linear-gradient(90deg, #0a0e12 0%, #1a2a20 100%);
  border: 1px solid #1a4d3e;
  border-radius: 2px;
  overflow: hidden;
`

const SoundLevel = styled.div<{ $level: number }>`
  height: 100%;
  width: ${({ $level }) => $level * 100}%;
  background: linear-gradient(90deg, #00ff99 0%, #ffff00 50%, #ff0066 100%);
  transition: width 100ms;
  box-shadow: 0 0 6px rgba(0, 255, 153, 0.5);
`

const ObjectivesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`

const ObjectiveItem = styled.div<{ $completed: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.5rem;
  border-left: 2px solid ${({ $completed }) => ($completed ? '#00ff99' : '#1a4d3e')};
  opacity: ${({ $completed }) => ($completed ? 0.7 : 1)};
  transition: all 200ms;
`

const ObjectiveCheck = styled.div<{ $completed: boolean }>`
  width: 20px;
  height: 20px;
  border: 1px solid ${({ $completed }) => ($completed ? '#00ff99' : '#1a4d3e')};
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ $completed }) => ($completed ? '#00ff99' : 'transparent')};
  background: ${({ $completed }) => ($completed ? 'rgba(0, 255, 153, 0.1)' : 'transparent')};
  flex-shrink: 0;
`

const ObjectiveText = styled.span`
  font-size: 0.9rem;
  color: #00d878;
`
