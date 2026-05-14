import React, { useEffect, useMemo, useRef, useState } from 'react'
import styled, { ThemeProvider } from 'styled-components'

type DeviceRole = 'emf' | 'spiritbox' | 'ghostcam' | 'ghostorbs' | 'van'

type Device = {
  deviceId: string
  role: DeviceRole
  emfLevel?: number
  powerOn: boolean
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
  updatedAt: string
}

type VanPlayer = {
  id: string
  name: string
  sanity: number
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

type HomePanel = 'config' | 'control' | 'scenes'
type ConfigTab = 'devices' | 'audio' | 'network'

const darkTheme = {
  background: '#11161d',
  color: '#e8f0ff',
  panel: '#1a222d',
  panelBorder: '#2f3d50',
  accent: '#5ec8ff',
  accentSoft: '#204361',
  danger: '#ff6b6b'
}

async function toJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const maybeJson = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(maybeJson?.message ?? `HTTP ${response.status}`)
  }
  return response.json() as Promise<T>
}

function createDefaultVanBackgroundMusic(): VanBackgroundMusic {
  return {
    title: '',
    url: '',
    volume: 70,
    loop: true,
    playing: false
  }
}

function parseVanBackgroundMusic(raw?: string): VanBackgroundMusic {
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

function parseVanSoundboard(raw?: string): VanSoundCue[] {
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

export function App() {
  const [activePanel, setActivePanel] = useState<HomePanel>('config')
  const [activeConfigTab, setActiveConfigTab] = useState<ConfigTab>('devices')
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const [createDeviceId, setCreateDeviceId] = useState<string>('')
  const [createRole, setCreateRole] = useState<DeviceRole>('emf')

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const selectedDevice = useMemo(
    () => devices.find(device => device.deviceId === selectedDeviceId),
    [devices, selectedDeviceId]
  )

  const [editRole, setEditRole] = useState<DeviceRole>('emf')
  const [editEmfLevel, setEditEmfLevel] = useState<number>(0)
  const [editPowerOn, setEditPowerOn] = useState<boolean>(true)
  const [editHuntActive, setEditHuntActive] = useState<boolean>(false)
  const [editMessage, setEditMessage] = useState<string>('')

  const [controlDeviceId, setControlDeviceId] = useState<string>('')
  const [controlEmfLevel, setControlEmfLevel] = useState<number>(0)
  const [controlPowerOn, setControlPowerOn] = useState<boolean>(true)
  const [controlGhostcamDeviceId, setControlGhostcamDeviceId] = useState<string>('')
  const [controlGhostcamColor, setControlGhostcamColor] = useState<'green' | 'red'>('green')
  const [controlGhostDurationSec, setControlGhostDurationSec] = useState<number>(3)
  const [controlGhostorbsDeviceId, setControlGhostorbsDeviceId] = useState<string>('')
  const [controlGhostorbsColor, setControlGhostorbsColor] = useState<'green' | 'red'>('green')
  const [controlOrbDurationSec, setControlOrbDurationSec] = useState<number>(3)

  const [controlSpiritboxDeviceId, setControlSpiritboxDeviceId] = useState<string>('')
  const [spiritboxRecording, setSpiritboxRecording] = useState(false)
  const [latestPlayerSpiritMessage, setLatestPlayerSpiritMessage] = useState<SpiritAudioMessage | null>(null)
  const spiritboxRecorderRef = useRef<MediaRecorder | null>(null)
  const spiritboxStreamRef = useRef<MediaStream | null>(null)
  const spiritboxChunksRef = useRef<BlobPart[]>([])
  const lastPlayerSpiritMessageIdRef = useRef<string>('')

  const [controlVanDeviceId, setControlVanDeviceId] = useState<string>('')
  const [vanGhostActivity, setVanGhostActivity] = useState<number>(0)
  const [vanRooms, setVanRooms] = useState<string[]>([])
  const [vanNewRoom, setVanNewRoom] = useState<string>('')
  const [vanPlayers, setVanPlayers] = useState<VanPlayer[]>([])
  const [vanNewPlayer, setVanNewPlayer] = useState<string>('')
  const [vanSoundLevels, setVanSoundLevels] = useState<Record<string, number>>({})
  const [vanMotionSensors, setVanMotionSensors] = useState<string[]>([])
  const [vanMotionDetections, setVanMotionDetections] = useState<Record<string, boolean>>({})
  const [vanRecentMotionAlert, setVanRecentMotionAlert] = useState<string>('')
  const [vanObjectives, setVanObjectives] = useState<Array<{ objective: string; completed: boolean }>>([])
  const [vanFloorPlanImage, setVanFloorPlanImage] = useState<string | null>(null)
  const [vanBackgroundMusic, setVanBackgroundMusic] = useState<VanBackgroundMusic>(createDefaultVanBackgroundMusic)
  const [vanSoundboard, setVanSoundboard] = useState<VanSoundCue[]>([])
  const [vanNewSoundLabel, setVanNewSoundLabel] = useState<string>('')
  const [vanNewSoundUrl, setVanNewSoundUrl] = useState<string>('')
  const vanHydratedRef = useRef(false)

  const [cameraSources, setCameraSources] = useState<Record<string, string>>({})

  useEffect(() => {
    const cameraDevices = devices.filter(
      device => device.role === 'ghostcam' || device.role === 'ghostorbs' || device.role === 'emf'
    )
    if (cameraDevices.length === 0) {
      return
    }

    const interval = setInterval(() => {
      cameraDevices.forEach(device => {
        fetch(`/apil7r/player/device/${device.deviceId}/camera-frame`)
          .then(r => r.json())
          .then((data: { frame?: string }) => {
            if (data.frame) {
              setCameraSources(prev => ({ ...prev, [device.deviceId]: data.frame }))
            }
          })
          .catch(() => {
            // Erreur silencieuse
          })
      })
    }, 200)

    return () => clearInterval(interval)
  }, [devices])

  const refreshDevices = async (): Promise<void> => {
    setIsLoading(true)
    setError('')
    try {
      const next = await fetch('/apil7r/admin/state').then(toJson<Device[]>)
      setDevices(next)
      if (selectedDeviceId && !next.some(device => device.deviceId === selectedDeviceId)) {
        setSelectedDeviceId('')
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshDevices()
  }, [])

  useEffect(() => {
    if (!selectedDevice) {
      return
    }

    setEditRole(selectedDevice.role)
    setEditEmfLevel(selectedDevice.emfLevel ?? 0)
    setEditPowerOn(selectedDevice.powerOn ?? true)
    setEditHuntActive(selectedDevice.huntActive)
    setEditMessage(selectedDevice.message ?? '')
  }, [selectedDevice])

  useEffect(() => {
    const firstEmf = devices.find(device => device.role === 'emf')

    if (!firstEmf) {
      setControlDeviceId('')
      setControlEmfLevel(0)
      setControlPowerOn(true)
      return
    }

    if (!controlDeviceId || !devices.some(device => device.deviceId === controlDeviceId && device.role === 'emf')) {
      setControlDeviceId(firstEmf.deviceId)
      setControlEmfLevel(firstEmf.emfLevel ?? 0)
      setControlPowerOn(firstEmf.powerOn ?? true)
      return
    }

    const controlled = devices.find(device => device.deviceId === controlDeviceId)
    if (controlled) {
      setControlEmfLevel(controlled.emfLevel ?? 0)
      setControlPowerOn(controlled.powerOn ?? true)
    }
  }, [devices, controlDeviceId])

  useEffect(() => {
    const firstGhostcam = devices.find(device => device.role === 'ghostcam')

    if (!firstGhostcam) {
      setControlGhostcamDeviceId('')
      setControlGhostcamColor('green')
      return
    }

    const exists = devices.some(
      device => device.deviceId === controlGhostcamDeviceId && device.role === 'ghostcam'
    )

    if (!controlGhostcamDeviceId || !exists) {
      setControlGhostcamDeviceId(firstGhostcam.deviceId)
      setControlGhostcamColor((firstGhostcam.cameraColor ?? 'green') as 'green' | 'red')
      return
    }

    const controlled = devices.find(device => device.deviceId === controlGhostcamDeviceId)
    if (controlled) {
      setControlGhostcamColor((controlled.cameraColor ?? 'green') as 'green' | 'red')
    }
  }, [devices, controlGhostcamDeviceId])

  useEffect(() => {
    const firstSpiritbox = devices.find(device => device.role === 'spiritbox')

    if (!firstSpiritbox) {
      setControlSpiritboxDeviceId('')
      setLatestPlayerSpiritMessage(null)
      return
    }

    const exists = devices.some(
      device => device.deviceId === controlSpiritboxDeviceId && device.role === 'spiritbox'
    )

    if (!controlSpiritboxDeviceId || !exists) {
      setControlSpiritboxDeviceId(firstSpiritbox.deviceId)
    }
  }, [devices, controlSpiritboxDeviceId])

  useEffect(() => {
    const firstGhostorbs = devices.find(device => device.role === 'ghostorbs')

    if (!firstGhostorbs) {
      setControlGhostorbsDeviceId('')
      setControlGhostorbsColor('green')
      return
    }

    const exists = devices.some(
      device => device.deviceId === controlGhostorbsDeviceId && device.role === 'ghostorbs'
    )

    if (!controlGhostorbsDeviceId || !exists) {
      setControlGhostorbsDeviceId(firstGhostorbs.deviceId)
      setControlGhostorbsColor((firstGhostorbs.cameraColor ?? 'green') as 'green' | 'red')
      return
    }

    const controlled = devices.find(device => device.deviceId === controlGhostorbsDeviceId)
    if (controlled) {
      setControlGhostorbsColor((controlled.cameraColor ?? 'green') as 'green' | 'red')
    }
  }, [devices, controlGhostorbsDeviceId])

  useEffect(() => {
    const firstVan = devices.find(device => device.role === 'van')

    if (!firstVan) {
      setControlVanDeviceId('')
      return
    }

    const exists = devices.some(
      device => device.deviceId === controlVanDeviceId && device.role === 'van'
    )

    if (!controlVanDeviceId || !exists) {
      setControlVanDeviceId(firstVan.deviceId)
    }
  }, [devices, controlVanDeviceId])

  useEffect(() => {
    if (!controlVanDeviceId) {
      return
    }

    const vanDevice = devices.find(device => device.deviceId === controlVanDeviceId && device.role === 'van')
    if (!vanDevice) {
      return
    }

    const parsedRooms = vanDevice.roomList ? (JSON.parse(vanDevice.roomList) as string[]) : []
    const parsedSound = vanDevice.soundLevels ? (JSON.parse(vanDevice.soundLevels) as Record<string, number>) : {}
    const parsedMotion = vanDevice.motionDetections ? (JSON.parse(vanDevice.motionDetections) as Record<string, boolean>) : {}
    const parsedSensors = vanDevice.motionSensorRooms ? (JSON.parse(vanDevice.motionSensorRooms) as string[]) : []
    const parsedSanity = vanDevice.playerSanity ? (JSON.parse(vanDevice.playerSanity) as Record<string, number>) : {}
    const parsedObjectives = vanDevice.missionObjectives
      ? (JSON.parse(vanDevice.missionObjectives) as Array<{ objective: string; completed: boolean }>)
      : []
    const parsedBackgroundMusic = parseVanBackgroundMusic(vanDevice.backgroundMusic)
    const parsedSoundboard = parseVanSoundboard(vanDevice.soundboard)

    setVanGhostActivity(vanDevice.ghostActivityLevel ?? 0)
    setVanRooms(parsedRooms.length > 0 ? parsedRooms : Object.keys(parsedSound))
    setVanSoundLevels(parsedSound)
    setVanMotionDetections(parsedMotion)
    setVanMotionSensors(parsedSensors)
    setVanRecentMotionAlert(vanDevice.recentMotionAlert ?? '')
    setVanPlayers(
      Object.entries(parsedSanity).map(([name, sanity], index) => ({
        id: `${name}-${index}`,
        name,
        sanity
      }))
    )
    setVanObjectives(parsedObjectives)
    setVanFloorPlanImage(vanDevice.floorPlanImage ?? null)
    setVanBackgroundMusic(parsedBackgroundMusic)
    setVanSoundboard(parsedSoundboard)
    vanHydratedRef.current = true
  }, [devices, controlVanDeviceId])

  useEffect(() => {
    if (!controlVanDeviceId || !vanHydratedRef.current) {
      return
    }

    const timer = window.setTimeout(() => {
      const sanityMap = vanPlayers.reduce<Record<string, number>>((acc, player) => {
        const name = player.name.trim()
        if (name) {
          acc[name] = Math.max(0, Math.min(100, Math.round(player.sanity)))
        }
        return acc
      }, {})

      fetch(`/apil7r/admin/device/${controlVanDeviceId}/van`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ghostActivityLevel: vanGhostActivity,
          playerSanity: JSON.stringify(sanityMap),
          soundLevels: JSON.stringify(vanSoundLevels),
          motionDetections: JSON.stringify(vanMotionDetections),
          roomList: JSON.stringify(vanRooms),
          motionSensorRooms: JSON.stringify(vanMotionSensors),
          recentMotionAlert: vanRecentMotionAlert || undefined,
          missionObjectives: JSON.stringify(vanObjectives),
          floorPlanImage: vanFloorPlanImage,
          backgroundMusic: JSON.stringify(vanBackgroundMusic),
          soundboard: JSON.stringify(vanSoundboard)
        })
      }).catch(() => {
        // Erreur réseau silencieuse
      })
    }, 220)

    return () => window.clearTimeout(timer)
  }, [
    controlVanDeviceId,
    vanGhostActivity,
    vanPlayers,
    vanSoundLevels,
    vanMotionDetections,
    vanRooms,
    vanMotionSensors,
    vanRecentMotionAlert,
    vanObjectives,
    vanFloorPlanImage,
    vanBackgroundMusic,
    vanSoundboard
  ])

  useEffect(() => {
    if (!controlSpiritboxDeviceId) {
      return
    }

    const pollPlayerMessage = () => {
      fetch(`/apil7r/admin/device/${controlSpiritboxDeviceId}/spiritbox/player-message`)
        .then(r => r.json())
        .then((payload: { message?: SpiritAudioMessage }) => {
          const message = payload.message
          if (!message) {
            return
          }

          setLatestPlayerSpiritMessage(message)
          if (message.id !== lastPlayerSpiritMessageIdRef.current) {
            lastPlayerSpiritMessageIdRef.current = message.id
          }
        })
        .catch(() => {
          // Réseau non disponible
        })
    }

    pollPlayerMessage()
    const interval = setInterval(pollPlayerMessage, 700)

    return () => clearInterval(interval)
  }, [controlSpiritboxDeviceId])

  useEffect(() => {
    return () => {
      spiritboxStreamRef.current?.getTracks().forEach(track => track.stop())
      spiritboxStreamRef.current = null
    }
  }, [])

  const createDevice = async (): Promise<void> => {
    const deviceId = createDeviceId.trim()
    if (!deviceId) {
      setError('Le deviceId est obligatoire')
      return
    }

    setError('')
    try {
      await fetch('/apil7r/admin/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, role: createRole })
      }).then(toJson<Device>)
      setCreateDeviceId('')
      await refreshDevices()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const updateDevice = async (): Promise<void> => {
    if (!selectedDeviceId) {
      setError('Sélectionne un device à modifier')
      return
    }

    setError('')
    try {
      await fetch(`/apil7r/admin/device/${selectedDeviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editRole,
          emfLevel: editEmfLevel,
          powerOn: editPowerOn,
          huntActive: editHuntActive,
          message: editMessage
        })
      }).then(toJson<Device>)
      await refreshDevices()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const patchEmfControl = async (patch: { emfLevel?: number; powerOn?: boolean }): Promise<void> => {
    if (!controlDeviceId) {
      setError('Aucun device EMF disponible')
      return
    }

    setError('')
    try {
      await fetch(`/apil7r/admin/device/${controlDeviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      }).then(toJson<Device>)
      await refreshDevices()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const patchGhostcamControl = async (patch: { cameraColor?: 'green' | 'red'; ghostUntil?: string }): Promise<void> => {
    if (!controlGhostcamDeviceId) {
      setError('Aucun device GhostCam disponible')
      return
    }

    setError('')
    try {
      await fetch(`/apil7r/admin/device/${controlGhostcamDeviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      }).then(toJson<Device>)
      await refreshDevices()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const patchGhostorbsControl = async (patch: { cameraColor?: 'green' | 'red'; ghostUntil?: string }): Promise<void> => {
    if (!controlGhostorbsDeviceId) {
      setError('Aucun device Ghost Orbs disponible')
      return
    }

    setError('')
    try {
      await fetch(`/apil7r/admin/device/${controlGhostorbsDeviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      }).then(toJson<Device>)
      await refreshDevices()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const triggerGhostAction = async (): Promise<void> => {
    const seconds = Math.max(1, Math.min(30, Number(controlGhostDurationSec) || 1))
    const ghostUntil = new Date(Date.now() + seconds * 1000).toISOString()
    await patchGhostcamControl({ ghostUntil })
  }

  const triggerOrbsAction = async (): Promise<void> => {
    const seconds = Math.max(1, Math.min(30, Number(controlOrbDurationSec) || 1))
    const ghostUntil = new Date(Date.now() + seconds * 1000).toISOString()
    await patchGhostorbsControl({ ghostUntil })
  }

  const audioContextRef = useRef<AudioContext | null>(null)

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
      setError('Web Audio API non disponible')
      return
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor()
    }

    const ctx = audioContextRef.current
    if (!ctx) {
      setError('Initialisation AudioContext échouée')
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
          setError('Erreur décodage audio')
        }
      )
    } catch {
      setError('Erreur lecture audio fantôme')
    }
  }

  const startSpiritboxRecording = async (): Promise<void> => {
    if (!controlSpiritboxDeviceId || spiritboxRecording) {
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      spiritboxStreamRef.current = stream
      spiritboxChunksRef.current = []

      const recorder = MediaRecorder.isTypeSupported('audio/webm')
        ? new MediaRecorder(stream, { mimeType: 'audio/webm' })
        : new MediaRecorder(stream)
      spiritboxRecorderRef.current = recorder

      recorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) {
          spiritboxChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(spiritboxChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        spiritboxChunksRef.current = []

        if (blob.size === 0) {
          setError('Aucun son détecté pour le message MJ')
          return
        }

        void blobToDataUrl(blob)
          .then(audioData => {
            return fetch(`/apil7r/admin/device/${controlSpiritboxDeviceId}/spiritbox/mj-message`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioData, mimeType: blob.type || 'audio/webm' })
            }).then(toJson<{ ok: true; message: SpiritAudioMessage }>)
          })
          .catch(() => {
            setError('Impossible d\'envoyer le message vocal MJ')
          })
          .finally(() => {
            spiritboxStreamRef.current?.getTracks().forEach(track => track.stop())
            spiritboxStreamRef.current = null
          })
      }

      recorder.start()
      setSpiritboxRecording(true)
      setError('')
    } catch {
      setError('Micro MJ indisponible')
    }
  }

  const stopSpiritboxRecording = (): void => {
    const recorder = spiritboxRecorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      return
    }
    recorder.stop()
    setSpiritboxRecording(false)
  }

  const toggleSpiritboxRecording = (): void => {
    if (spiritboxRecording) {
      stopSpiritboxRecording()
      return
    }
    void startSpiritboxRecording()
  }

  const playLatestPlayerSpiritMessage = (): void => {
    if (!latestPlayerSpiritMessage) {
      return
    }
    playGhostAudio(latestPlayerSpiritMessage.audioData)
  }

  const addVanRoom = (): void => {
    const next = vanNewRoom.trim()
    if (!next) {
      return
    }
    if (vanRooms.includes(next)) {
      return
    }
    setVanRooms(prev => [...prev, next])
    setVanSoundLevels(prev => ({ ...prev, [next]: 0 }))
    setVanMotionDetections(prev => ({ ...prev, [next]: false }))
    setVanNewRoom('')
  }

  const updateVanRoomName = (index: number, name: string): void => {
    const normalized = name.trim()
    setVanRooms(prev => {
      const current = prev[index]
      if (!current) {
        return prev
      }
      const copy = [...prev]
      copy[index] = normalized || current

      if (normalized && normalized !== current) {
        setVanSoundLevels(sound => {
          const next = { ...sound }
          next[normalized] = next[current] ?? 0
          delete next[current]
          return next
        })
        setVanMotionDetections(motion => {
          const next = { ...motion }
          next[normalized] = next[current] ?? false
          delete next[current]
          return next
        })
        setVanMotionSensors(sensors => sensors.map(room => (room === current ? normalized : room)))
      }
      return copy
    })
  }

  const removeVanRoom = (room: string): void => {
    setVanRooms(prev => prev.filter(item => item !== room))
    setVanMotionSensors(prev => prev.filter(item => item !== room))
    setVanSoundLevels(prev => {
      const next = { ...prev }
      delete next[room]
      return next
    })
    setVanMotionDetections(prev => {
      const next = { ...prev }
      delete next[room]
      return next
    })
  }

  const addVanPlayer = (): void => {
    const name = vanNewPlayer.trim()
    if (!name) {
      return
    }
    setVanPlayers(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, name, sanity: 100 }])
    setVanNewPlayer('')
  }

  const addVanSoundCue = (): void => {
    const label = vanNewSoundLabel.trim()
    const url = vanNewSoundUrl.trim()

    if (!label || !url) {
      return
    }

    setVanSoundboard(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        label,
        url,
        volume: 80
      }
    ])
    setVanNewSoundLabel('')
    setVanNewSoundUrl('')
  }

  const updateVanSoundCue = (cueId: string, patch: Partial<VanSoundCue>): void => {
    setVanSoundboard(prev => prev.map(cue => (cue.id === cueId ? { ...cue, ...patch } : cue)))
  }

  const triggerVanSoundCue = (cueId: string): void => {
    setVanSoundboard(prev =>
      prev.map(cue => (cue.id === cueId ? { ...cue, lastTriggeredAt: new Date().toISOString() } : cue))
    )
  }

  const removeVanSoundCue = (cueId: string): void => {
    setVanSoundboard(prev => prev.filter(cue => cue.id !== cueId))
  }

  const toggleVanMotionSensor = (room: string, enabled: boolean): void => {
    if (enabled) {
      setVanMotionSensors(prev => (prev.includes(room) ? prev : [...prev, room]))
      return
    }
    setVanMotionSensors(prev => prev.filter(item => item !== room))
    setVanMotionDetections(prev => ({ ...prev, [room]: false }))
  }

  const triggerMotionEvent = (room: string): void => {
    const nextMessage = `Motion detected in ${room}`
    setVanMotionDetections(prev => ({ ...prev, [room]: true }))
    setVanRecentMotionAlert(nextMessage)
  }

  const clearMotionEvent = (room: string): void => {
    setVanMotionDetections(prev => ({ ...prev, [room]: false }))
  }

  const updateVanData = async (): Promise<void> => {
    if (!controlVanDeviceId) {
      setError('Aucun device van disponible')
      return
    }

    setError('')
    try {
      const sanityMap = vanPlayers.reduce<Record<string, number>>((acc, player) => {
        const name = player.name.trim()
        if (name) {
          acc[name] = Math.max(0, Math.min(100, Math.round(player.sanity)))
        }
        return acc
      }, {})

      await fetch(`/apil7r/admin/device/${controlVanDeviceId}/van`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ghostActivityLevel: vanGhostActivity,
          playerSanity: JSON.stringify(sanityMap),
          soundLevels: JSON.stringify(vanSoundLevels),
          motionDetections: JSON.stringify(vanMotionDetections),
          roomList: JSON.stringify(vanRooms),
          motionSensorRooms: JSON.stringify(vanMotionSensors),
          recentMotionAlert: vanRecentMotionAlert || undefined,
          missionObjectives: JSON.stringify(vanObjectives),
          floorPlanImage: vanFloorPlanImage,
          backgroundMusic: JSON.stringify(vanBackgroundMusic),
          soundboard: JSON.stringify(vanSoundboard)
        })
      }).then(toJson<Device>)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const feedDefaultSetup = async (): Promise<void> => {
    if (!window.confirm('etes vous sur ?')) {
      return
    }

    setError('')
    setIsLoading(true)

    try {
      await fetch('/apil7r/admin/reset', {
        method: 'POST'
      }).then(toJson<{ ok: true }>)

      const deviceTemplates: Array<{ deviceId: string; role: DeviceRole; powerOn: boolean }> = [
        { deviceId: 'emf', role: 'emf', powerOn: true },
        { deviceId: 'spiritbox', role: 'spiritbox', powerOn: true },
        { deviceId: 'ghostcam', role: 'ghostcam', powerOn: true },
        { deviceId: 'ghostorbs', role: 'ghostorbs', powerOn: true },
        { deviceId: 'van', role: 'van', powerOn: true }
      ]

      for (const device of deviceTemplates) {
        await fetch('/apil7r/admin/devices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(device)
        }).then(toJson<Device>)
      }

      const seededRooms = ['salon', 'cuisine', 'chambre1', 'chambre2', 'chambre2', 'salle de bain', 'toilettes']

      const seededSoundLevels: Record<string, number> = {
        salon: 18,
        cuisine: 10,
        chambre1: 7,
        chambre2: 12,
        'salle de bain': 6,
        toilettes: 5
      }

      const seededMotionDetections: Record<string, boolean> = {
        salon: false,
        cuisine: false,
        chambre1: false,
        chambre2: false,
        'salle de bain': false,
        toilettes: false
      }

      const seededPlayers: Record<string, number> = {
        Alice: 100,
        Bob: 100,
        Chloe: 100,
        Diane: 100
      }

      await fetch('/apil7r/admin/device/van/van', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ghostActivityLevel: 0,
          playerSanity: JSON.stringify(seededPlayers),
          soundLevels: JSON.stringify(seededSoundLevels),
          motionDetections: JSON.stringify(seededMotionDetections),
          roomList: JSON.stringify(seededRooms),
          motionSensorRooms: JSON.stringify(['salon', 'cuisine', 'chambre1', 'chambre2', 'salle de bain', 'toilettes']),
          recentMotionAlert: '',
          missionObjectives: JSON.stringify([
            { objective: 'Identifier le type de fantome', completed: false },
            { objective: 'Capturer une preuve paranormale', completed: false },
            { objective: 'Sortir vivant', completed: false }
          ]),
          backgroundMusic: JSON.stringify(createDefaultVanBackgroundMusic()),
          soundboard: JSON.stringify([])
        })
      }).then(toJson<Device>)

      setControlVanDeviceId('van')
      await refreshDevices()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteDevice = async (): Promise<void> => {
    if (!selectedDeviceId) {
      setError('Sélectionne un device à supprimer')
      return
    }

    setError('')
    try {
      await fetch(`/apil7r/admin/device/${selectedDeviceId}`, {
        method: 'DELETE'
      }).then(toJson<{ ok: true }>)
      setSelectedDeviceId('')
      await refreshDevices()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Container>
        <Header>
          <h1>Ghost MJ Dashboard</h1>
          <p>Panel principal: accès aux dashboards MJ</p>
        </Header>

        <HomeCards>
          <HomeCard
            $active={activePanel === 'config'}
            onClick={() => setActivePanel('config')}
            type="button"
          >
            <h3>Config</h3>
            <span>Créer / modifier / supprimer les devices</span>
          </HomeCard>
          <HomeCard
            $active={activePanel === 'control'}
            onClick={() => setActivePanel('control')}
            type="button"
          >
            <h3>Live Control</h3>
            <span>Pilotage instantané des outils</span>
          </HomeCard>
          <HomeCard
            $active={activePanel === 'scenes'}
            onClick={() => setActivePanel('scenes')}
            type="button"
          >
            <h3>Scenes</h3>
            <span>À venir</span>
          </HomeCard>
        </HomeCards>

        {activePanel === 'config' && (
          <Panel>
            <PanelHeader>
              <h2>Config</h2>
              <PanelHeaderActions>
                <button type="button" onClick={() => void refreshDevices()} disabled={isLoading}>
                  Rafraîchir
                </button>
                <PrimaryButton type="button" onClick={() => void feedDefaultSetup()} disabled={isLoading}>
                  Feed
                </PrimaryButton>
              </PanelHeaderActions>
            </PanelHeader>

            <Tabs>
              <TabButton
                type="button"
                $active={activeConfigTab === 'devices'}
                onClick={() => setActiveConfigTab('devices')}
              >
                Devices
              </TabButton>
              <TabButton
                type="button"
                $active={activeConfigTab === 'audio'}
                onClick={() => setActiveConfigTab('audio')}
              >
                Audio
              </TabButton>
              <TabButton
                type="button"
                $active={activeConfigTab === 'network'}
                onClick={() => setActiveConfigTab('network')}
              >
                Réseau
              </TabButton>
            </Tabs>

            {activeConfigTab === 'devices' && (
              <DevicesGrid>
                <SectionCard>
                  <h3>Créer un device</h3>
                  <FieldLabel htmlFor="device-id">deviceId</FieldLabel>
                  <TextInput
                    id="device-id"
                    value={createDeviceId}
                    onChange={event => setCreateDeviceId(event.target.value)}
                    placeholder="ex: salon-01"
                  />
                  <FieldLabel htmlFor="create-role">Rôle</FieldLabel>
                  <Select
                    id="create-role"
                    value={createRole}
                    onChange={event => setCreateRole(event.target.value as DeviceRole)}
                  >
                    <option value="emf">EMF</option>
                    <option value="spiritbox">Spirit Box</option>
                    <option value="ghostcam">GhostCam</option>
                    <option value="ghostorbs">Ghost Orbs</option>
                    <option value="van">Van</option>
                  </Select>
                  <PrimaryButton type="button" onClick={() => void createDevice()}>
                    Créer
                  </PrimaryButton>
                </SectionCard>

                <SectionCard>
                  <h3>Devices existants</h3>
                  {isLoading && <small>Chargement...</small>}
                  {!isLoading && devices.length === 0 && <small>Aucun device</small>}
                  <DeviceList>
                    {devices.map(device => (
                      <DeviceItem key={device.deviceId}>
                        <DeviceSelectButton
                          type="button"
                          $active={selectedDeviceId === device.deviceId}
                          onClick={() => setSelectedDeviceId(device.deviceId)}
                        >
                          <strong>{device.deviceId}</strong>
                          <span>{device.role}</span>
                        </DeviceSelectButton>
                        <DeviceActionButton
                          type="button"
                          onClick={() => window.open(`/ghost/player?device=${device.deviceId}`, '_blank')}
                          title="Voir le player du device"
                        >
                          🎮 Player
                        </DeviceActionButton>
                      </DeviceItem>
                    ))}
                  </DeviceList>
                </SectionCard>

                <SectionCard>
                  <h3>Modifier / supprimer</h3>
                  {!selectedDevice && <small>Sélectionne un device pour l'éditer</small>}
                  {selectedDevice && (
                    <EditForm>
                      <FieldLabel htmlFor="edit-role">Rôle</FieldLabel>
                      <Select
                        id="edit-role"
                        value={editRole}
                        onChange={event => setEditRole(event.target.value as DeviceRole)}
                      >
                        <option value="emf">EMF</option>
                        <option value="spiritbox">Spirit Box</option>
                        <option value="ghostcam">GhostCam</option>
                        <option value="ghostorbs">Ghost Orbs</option>
                        <option value="van">Van</option>
                      </Select>

                      <FieldLabel htmlFor="edit-emf">EMF</FieldLabel>
                      <NumberInput
                        id="edit-emf"
                        type="number"
                        min={0}
                        max={5}
                        value={editEmfLevel}
                        onChange={event => setEditEmfLevel(Number(event.target.value))}
                      />

                      <CheckRow>
                        <input
                          id="edit-power-on"
                          type="checkbox"
                          checked={editPowerOn}
                          onChange={event => setEditPowerOn(event.target.checked)}
                        />
                        <FieldLabel htmlFor="edit-power-on">EMF allumé</FieldLabel>
                      </CheckRow>

                      <CheckRow>
                        <input
                          id="edit-hunt"
                          type="checkbox"
                          checked={editHuntActive}
                          onChange={event => setEditHuntActive(event.target.checked)}
                        />
                        <FieldLabel htmlFor="edit-hunt">Hunt active</FieldLabel>
                      </CheckRow>

                      <FieldLabel htmlFor="edit-message">Message</FieldLabel>
                      <TextInput
                        id="edit-message"
                        value={editMessage}
                        onChange={event => setEditMessage(event.target.value)}
                      />

                      <Actions>
                        <PrimaryButton type="button" onClick={() => void updateDevice()}>
                          Enregistrer
                        </PrimaryButton>
                        <DangerButton type="button" onClick={() => void deleteDevice()}>
                          Supprimer
                        </DangerButton>
                      </Actions>
                    </EditForm>
                  )}
                </SectionCard>
              </DevicesGrid>
            )}

            {activeConfigTab !== 'devices' && <PlaceholderTab>Catégorie en préparation.</PlaceholderTab>}

            {error && <ErrorBox>{error}</ErrorBox>}
          </Panel>
        )}

        {activePanel !== 'config' && (
          <Panel>
            {activePanel === 'control' && (
              <>
                <h2>Live Control - Outils</h2>
                <p>Contrôle rapide depuis MJ pour les outils in-game.</p>

                <DevicesGrid>
                  <SectionCard>
                    <h3>EMF Meter</h3>
                    {devices.filter(device => device.role === 'emf').length === 0 && (
                      <small>Aucun device EMF configuré.</small>
                    )}
                    {devices.filter(device => device.role === 'emf').length > 0 && (
                      <EmfControlLayout>
                        <EditForm>
                          <FieldLabel htmlFor="control-device">Device EMF</FieldLabel>
                          <Select
                            id="control-device"
                            value={controlDeviceId}
                            onChange={event => setControlDeviceId(event.target.value)}
                          >
                            {devices
                              .filter(device => device.role === 'emf')
                              .map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                  {device.deviceId}
                                </option>
                              ))}
                          </Select>

                          <FieldLabel htmlFor="control-emf">Valeur affichée</FieldLabel>
                          <input
                            id="control-emf"
                            type="range"
                            min={0}
                            max={5}
                            step={1}
                            value={controlEmfLevel}
                            onChange={event => {
                              const value = Number(event.target.value)
                              setControlEmfLevel(value)
                              void patchEmfControl({ emfLevel: value })
                            }}
                          />
                          <small>Niveau: {controlEmfLevel}</small>

                          <CheckRow>
                            <input
                              id="control-emf-power"
                              type="checkbox"
                              checked={controlPowerOn}
                              onChange={event => {
                                const checked = event.target.checked
                                setControlPowerOn(checked)
                                void patchEmfControl({ powerOn: checked })
                              }}
                            />
                            <FieldLabel htmlFor="control-emf-power">EMF allumé</FieldLabel>
                          </CheckRow>

                          <Actions>
                            <PrimaryButton
                              type="button"
                              onClick={() => void patchEmfControl({ emfLevel: controlEmfLevel, powerOn: controlPowerOn })}
                            >
                              Appliquer maintenant
                            </PrimaryButton>
                          </Actions>
                        </EditForm>

                        <SmallPreviewContainer>
                          <GhostCamLabel>Preview: {controlDeviceId || 'aucun'}</GhostCamLabel>
                          {controlDeviceId && cameraSources[controlDeviceId] ? (
                            <SmallPreviewImage src={cameraSources[controlDeviceId]} alt={controlDeviceId} />
                          ) : (
                            <SmallPreviewPlaceholder>En attente de frame...</SmallPreviewPlaceholder>
                          )}
                        </SmallPreviewContainer>
                      </EmfControlLayout>
                    )}
                  </SectionCard>
                </DevicesGrid>
              </>
            )}

            {activePanel === 'control' && (
              <>
                <DevicesGrid>
                  <SectionCard>
                    <h3>Spirit Box</h3>
                    {devices.filter(device => device.role === 'spiritbox').length === 0 && (
                      <small>Aucun device SpiritBox configuré.</small>
                    )}
                    {devices.filter(device => device.role === 'spiritbox').length > 0 && (
                      <EmfControlLayout>
                        <EditForm>
                          <FieldLabel htmlFor="control-spiritbox-device">Device SpiritBox</FieldLabel>
                          <Select
                            id="control-spiritbox-device"
                            value={controlSpiritboxDeviceId}
                            onChange={event => setControlSpiritboxDeviceId(event.target.value)}
                          >
                            {devices
                              .filter(device => device.role === 'spiritbox')
                              .map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                  {device.deviceId}
                                </option>
                              ))}
                          </Select>

                          <Actions>
                            <PrimaryButton type="button" onClick={toggleSpiritboxRecording}>
                              {spiritboxRecording ? 'STOP / ENVOYER MJ' : 'MESSAGE VOCAL MJ'}
                            </PrimaryButton>
                            <PrimaryButton
                              type="button"
                              onClick={playLatestPlayerSpiritMessage}
                              disabled={!latestPlayerSpiritMessage}
                            >
                              Play message joueuse
                            </PrimaryButton>
                          </Actions>

                          <small>
                            {latestPlayerSpiritMessage
                              ? `Dernier message joueuse: ${new Date(latestPlayerSpiritMessage.createdAt).toLocaleTimeString()}`
                              : 'Aucun message joueuse pour le moment'}
                          </small>
                        </EditForm>

                        <SmallPreviewContainer>
                          <GhostCamLabel>Dernier message joueuse</GhostCamLabel>
                          <SmallPreviewPlaceholder>
                            {latestPlayerSpiritMessage ? 'Message vocal en mémoire' : 'En attente de message'}
                          </SmallPreviewPlaceholder>
                        </SmallPreviewContainer>
                      </EmfControlLayout>
                    )}
                  </SectionCard>
                </DevicesGrid>
              </>
            )}

            {activePanel === 'control' && (
              <>
                <DevicesGrid>
                  <SectionCard>
                    <h3>GhostCam Streaming</h3>
                    {devices.filter(device => device.role === 'ghostcam').length === 0 && (
                      <small>Aucun device GhostCam configuré.</small>
                    )}
                    {devices.filter(device => device.role === 'ghostcam').length > 0 && (
                      <EmfControlLayout>
                        <EditForm>
                          <FieldLabel htmlFor="control-ghostcam-device">Device GhostCam</FieldLabel>
                          <Select
                            id="control-ghostcam-device"
                            value={controlGhostcamDeviceId}
                            onChange={event => setControlGhostcamDeviceId(event.target.value)}
                          >
                            {devices
                              .filter(device => device.role === 'ghostcam')
                              .map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                  {device.deviceId}
                                </option>
                              ))}
                          </Select>

                          <FieldLabel htmlFor="control-ghostcam-color">Couleur affichage</FieldLabel>
                          <Select
                            id="control-ghostcam-color"
                            value={controlGhostcamColor}
                            onChange={event => {
                              const color = event.target.value as 'green' | 'red'
                              setControlGhostcamColor(color)
                              void patchGhostcamControl({ cameraColor: color })
                            }}
                          >
                            <option value="green">Vert</option>
                            <option value="red">Rouge</option>
                          </Select>

                          <FieldLabel htmlFor="control-ghost-duration">Ghost visible (secondes)</FieldLabel>
                          <NumberInput
                            id="control-ghost-duration"
                            type="number"
                            min={1}
                            max={30}
                            value={controlGhostDurationSec}
                            onChange={event => setControlGhostDurationSec(Number(event.target.value))}
                          />

                          <Actions>
                            <PrimaryButton
                              type="button"
                              onClick={() => void patchGhostcamControl({ cameraColor: controlGhostcamColor })}
                            >
                              Appliquer couleur
                            </PrimaryButton>
                            <PrimaryButton
                              type="button"
                              onClick={() => void triggerGhostAction()}
                            >
                              Ghost
                            </PrimaryButton>
                          </Actions>
                        </EditForm>

                        <SmallPreviewContainer>
                          <GhostCamLabel>Preview: {controlGhostcamDeviceId || 'aucun'}</GhostCamLabel>
                          {controlGhostcamDeviceId && cameraSources[controlGhostcamDeviceId] ? (
                            <GhostCamFrame>
                              <SmallPreviewImage src={cameraSources[controlGhostcamDeviceId]} alt={controlGhostcamDeviceId} />
                            </GhostCamFrame>
                          ) : (
                            <GhostCamFrame>
                              <SmallPreviewPlaceholder>En attente de frame...</SmallPreviewPlaceholder>
                            </GhostCamFrame>
                          )}
                        </SmallPreviewContainer>
                      </EmfControlLayout>
                    )}
                  </SectionCard>
                </DevicesGrid>
              </>
            )}

            {activePanel === 'control' && (
              <>
                <DevicesGrid>
                  <SectionCard>
                    <h3>Ghost Orbs</h3>
                    {devices.filter(device => device.role === 'ghostorbs').length === 0 && (
                      <small>Aucun device Ghost Orbs configuré.</small>
                    )}
                    {devices.filter(device => device.role === 'ghostorbs').length > 0 && (
                      <EmfControlLayout>
                        <EditForm>
                          <FieldLabel htmlFor="control-ghostorbs-device">Device Ghost Orbs</FieldLabel>
                          <Select
                            id="control-ghostorbs-device"
                            value={controlGhostorbsDeviceId}
                            onChange={event => setControlGhostorbsDeviceId(event.target.value)}
                          >
                            {devices
                              .filter(device => device.role === 'ghostorbs')
                              .map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                  {device.deviceId}
                                </option>
                              ))}
                          </Select>

                          <FieldLabel htmlFor="control-ghostorbs-color">Couleur affichage</FieldLabel>
                          <Select
                            id="control-ghostorbs-color"
                            value={controlGhostorbsColor}
                            onChange={event => {
                              const color = event.target.value as 'green' | 'red'
                              setControlGhostorbsColor(color)
                              void patchGhostorbsControl({ cameraColor: color })
                            }}
                          >
                            <option value="green">Vert</option>
                            <option value="red">Rouge</option>
                          </Select>

                          <FieldLabel htmlFor="control-orbs-duration">Orbs visibles (secondes)</FieldLabel>
                          <NumberInput
                            id="control-orbs-duration"
                            type="number"
                            min={1}
                            max={30}
                            value={controlOrbDurationSec}
                            onChange={event => setControlOrbDurationSec(Number(event.target.value))}
                          />

                          <Actions>
                            <PrimaryButton type="button" onClick={() => void patchGhostorbsControl({ cameraColor: controlGhostorbsColor })}>
                              Appliquer couleur
                            </PrimaryButton>
                            <PrimaryButton type="button" onClick={() => void triggerOrbsAction()}>
                              Orbs
                            </PrimaryButton>
                          </Actions>
                        </EditForm>

                        <SmallPreviewContainer>
                          <GhostCamLabel>Preview: {controlGhostorbsDeviceId || 'aucun'}</GhostCamLabel>
                          {controlGhostorbsDeviceId && cameraSources[controlGhostorbsDeviceId] ? (
                            <GhostCamFrame>
                              <SmallPreviewImage src={cameraSources[controlGhostorbsDeviceId]} alt={controlGhostorbsDeviceId} />
                            </GhostCamFrame>
                          ) : (
                            <GhostCamFrame>
                              <SmallPreviewPlaceholder>En attente de frame...</SmallPreviewPlaceholder>
                            </GhostCamFrame>
                          )}
                        </SmallPreviewContainer>
                      </EmfControlLayout>
                    )}
                  </SectionCard>
                </DevicesGrid>
              </>
            )}

            {activePanel === 'control' && (
              <>
                <DevicesGrid>
                  <SectionCard>
                    <h3>Van Dashboard</h3>
                    {devices.filter(device => device.role === 'van').length === 0 && (
                      <small>Aucun device Van configuré.</small>
                    )}
                    {devices.filter(device => device.role === 'van').length > 0 && (
                      <EditForm>
                        <FieldLabel htmlFor="control-van-device">Device Van</FieldLabel>
                        <Select
                          id="control-van-device"
                          value={controlVanDeviceId}
                          onChange={event => setControlVanDeviceId(event.target.value)}
                        >
                          {devices
                            .filter(device => device.role === 'van')
                            .map(device => (
                              <option key={device.deviceId} value={device.deviceId}>
                                {device.deviceId}
                              </option>
                            ))}
                        </Select>

                        <FieldLabel htmlFor="van-ghost-activity">Activité fantôme (0-10)</FieldLabel>
                        <input
                          id="van-ghost-activity"
                          type="range"
                          min={0}
                          max={10}
                          step={1}
                          value={vanGhostActivity}
                          onChange={event => setVanGhostActivity(Number(event.target.value))}
                        />
                        <small>Niveau: {vanGhostActivity}</small>

                        <FieldLabel>Room List</FieldLabel>
                        <InlineRow>
                          <TextInput
                            value={vanNewRoom}
                            onChange={event => setVanNewRoom(event.target.value)}
                            placeholder="Ajouter une pièce"
                          />
                          <PrimaryButton type="button" onClick={addVanRoom}>Ajouter</PrimaryButton>
                        </InlineRow>
                        <ListGrid>
                          {vanRooms.map((room, index) => (
                            <InlineRow key={`${room}-${index}`}>
                              <TextInput
                                value={room}
                                onChange={event => updateVanRoomName(index, event.target.value)}
                              />
                              <DangerButton type="button" onClick={() => removeVanRoom(room)}>Supprimer</DangerButton>
                            </InlineRow>
                          ))}
                        </ListGrid>

                        <FieldLabel>Sound Sensor Panel</FieldLabel>
                        <ListGrid>
                          {vanRooms.map(room => (
                            <MeterRow key={`sound-${room}`}>
                              <MeterName>{room}</MeterName>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={vanSoundLevels[room] ?? 0}
                                onChange={event => setVanSoundLevels(prev => ({ ...prev, [room]: Number(event.target.value) }))}
                              />
                              <small>{vanSoundLevels[room] ?? 0}%</small>
                            </MeterRow>
                          ))}
                        </ListGrid>

                        <FieldLabel>Motion Sensor Panel</FieldLabel>
                        {vanRecentMotionAlert && <MotionAlert>{vanRecentMotionAlert}</MotionAlert>}
                        <ListGrid>
                          {vanRooms.map(room => {
                            const sensorActive = vanMotionSensors.includes(room)
                            const motionDetected = Boolean(vanMotionDetections[room])
                            return (
                              <SensorRow key={`motion-${room}`}>
                                <CheckRow>
                                  <input
                                    type="checkbox"
                                    checked={sensorActive}
                                    onChange={event => toggleVanMotionSensor(room, event.target.checked)}
                                  />
                                  <FieldLabel>{room}</FieldLabel>
                                </CheckRow>
                                <StatusPill $active={motionDetected}>
                                  {motionDetected ? 'Détection' : 'Idle'}
                                </StatusPill>
                                <Actions>
                                  <PrimaryButton type="button" disabled={!sensorActive} onClick={() => triggerMotionEvent(room)}>
                                    Trigger
                                  </PrimaryButton>
                                  <PrimaryButton type="button" disabled={!sensorActive} onClick={() => clearMotionEvent(room)}>
                                    Reset
                                  </PrimaryButton>
                                </Actions>
                              </SensorRow>
                            )
                          })}
                        </ListGrid>

                        <FieldLabel>Sanity Monitor</FieldLabel>
                        <InlineRow>
                          <TextInput
                            value={vanNewPlayer}
                            onChange={event => setVanNewPlayer(event.target.value)}
                            placeholder="Ajouter une joueuse"
                          />
                          <PrimaryButton type="button" onClick={addVanPlayer}>Ajouter</PrimaryButton>
                        </InlineRow>
                        <ListGrid>
                          {vanPlayers.map(player => (
                            <MeterRow key={player.id}>
                              <TextInput
                                value={player.name}
                                onChange={event => {
                                  const nextName = event.target.value
                                  setVanPlayers(prev => prev.map(item => (item.id === player.id ? { ...item, name: nextName } : item)))
                                }}
                              />
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={player.sanity}
                                onChange={event => {
                                  const next = Number(event.target.value)
                                  setVanPlayers(prev => prev.map(item => (item.id === player.id ? { ...item, sanity: next } : item)))
                                }}
                              />
                              <StatusPill $active={player.sanity > 35}>{Math.round(player.sanity)}%</StatusPill>
                              <DangerButton type="button" onClick={() => setVanPlayers(prev => prev.filter(item => item.id !== player.id))}>
                                Supprimer
                              </DangerButton>
                            </MeterRow>
                          ))}
                        </ListGrid>

                        <FieldLabel>Musique van</FieldLabel>
                        <TextInput
                          value={vanBackgroundMusic.title}
                          onChange={event =>
                            setVanBackgroundMusic(prev => ({ ...prev, title: event.target.value }))
                          }
                          placeholder="Titre affiché dans le van"
                        />
                        <TextInput
                          value={vanBackgroundMusic.url}
                          onChange={event =>
                            setVanBackgroundMusic(prev => ({
                              ...prev,
                              url: event.target.value,
                              playing: event.target.value.trim() ? prev.playing : false
                            }))
                          }
                          placeholder="https://.../track.mp3"
                        />
                        <MeterRow>
                          <MeterName>Volume musique</MeterName>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={vanBackgroundMusic.volume}
                            onChange={event =>
                              setVanBackgroundMusic(prev => ({ ...prev, volume: Number(event.target.value) }))
                            }
                          />
                          <small>{vanBackgroundMusic.volume}%</small>
                        </MeterRow>
                        <CheckRow>
                          <input
                            id="van-music-loop"
                            type="checkbox"
                            checked={vanBackgroundMusic.loop}
                            onChange={event =>
                              setVanBackgroundMusic(prev => ({ ...prev, loop: event.target.checked }))
                            }
                          />
                          <FieldLabel htmlFor="van-music-loop">Boucler la musique</FieldLabel>
                        </CheckRow>
                        <Actions>
                          <PrimaryButton
                            type="button"
                            onClick={() =>
                              setVanBackgroundMusic(prev => ({
                                ...prev,
                                playing: Boolean(prev.url.trim()) && !prev.playing
                              }))
                            }
                            disabled={!vanBackgroundMusic.url.trim()}
                          >
                            {vanBackgroundMusic.playing ? 'Pause musique' : 'Lancer musique'}
                          </PrimaryButton>
                        </Actions>
                        <small>
                          {vanBackgroundMusic.url.trim()
                            ? `Piste active: ${vanBackgroundMusic.title || vanBackgroundMusic.url}`
                            : 'Aucune musique configurée pour le van'}
                        </small>

                        <FieldLabel>Soundboard</FieldLabel>
                        <InlineRow>
                          <TextInput
                            value={vanNewSoundLabel}
                            onChange={event => setVanNewSoundLabel(event.target.value)}
                            placeholder="Nom du son"
                          />
                          <TextInput
                            value={vanNewSoundUrl}
                            onChange={event => setVanNewSoundUrl(event.target.value)}
                            placeholder="https://.../effect.mp3"
                          />
                          <PrimaryButton type="button" onClick={addVanSoundCue}>Ajouter</PrimaryButton>
                        </InlineRow>
                        <ListGrid>
                          {vanSoundboard.map(cue => (
                            <SoundCueCard key={cue.id}>
                              <InlineRow>
                                <TextInput
                                  value={cue.label}
                                  onChange={event => updateVanSoundCue(cue.id, { label: event.target.value })}
                                  placeholder="Nom du son"
                                />
                                <TextInput
                                  value={cue.url}
                                  onChange={event => updateVanSoundCue(cue.id, { url: event.target.value })}
                                  placeholder="https://.../effect.mp3"
                                />
                              </InlineRow>
                              <MeterRow>
                                <MeterName>Volume</MeterName>
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={cue.volume}
                                  onChange={event => updateVanSoundCue(cue.id, { volume: Number(event.target.value) })}
                                />
                                <small>{cue.volume}%</small>
                              </MeterRow>
                              <Actions>
                                <PrimaryButton type="button" onClick={() => triggerVanSoundCue(cue.id)} disabled={!cue.url.trim()}>
                                  Jouer sur le van
                                </PrimaryButton>
                                <DangerButton type="button" onClick={() => removeVanSoundCue(cue.id)}>
                                  Supprimer
                                </DangerButton>
                              </Actions>
                            </SoundCueCard>
                          ))}
                        </ListGrid>

                        <Actions>
                          <PrimaryButton
                            type="button"
                            onClick={() => void updateVanData()}
                          >
                            Envoyer mise à jour
                          </PrimaryButton>
                        </Actions>
                      </EditForm>
                    )}
                  </SectionCard>
                </DevicesGrid>
              </>
            )}

            {activePanel === 'scenes' && (
              <>
                <h2>Scenes</h2>
                <p>Cette zone sera branchée dans l'étape suivante.</p>
              </>
            )}
          </Panel>
        )}
      </Container>
    </ThemeProvider>
  )
}

export default App

const Container = styled.div`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.color};
  min-height: 100vh;
  width: 100%;
  max-width: none;
  padding: 2rem;
`

const Header = styled.header`
  margin-bottom: 1.5rem;

  h1 {
    margin: 0;
  }

  p {
    margin: 0.5rem 0 0;
    color: #b4c4da;
  }
`

const HomeCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
`

const HomeCard = styled.button<{ $active: boolean }>`
  text-align: left;
  border: 1px solid ${({ theme, $active }) => ($active ? theme.accent : theme.panelBorder)};
  background: ${({ theme, $active }) => ($active ? theme.accentSoft : theme.panel)};
  color: ${({ theme }) => theme.color};
  border-radius: 10px;
  padding: 0.9rem;
  cursor: pointer;

  h3 {
    margin: 0;
  }

  span {
    display: block;
    margin-top: 0.35rem;
    color: #b7c7dd;
    font-size: 0.9rem;
  }
`

const Panel = styled.div`
  background: ${({ theme }) => theme.panel};
  border: 1px solid ${({ theme }) => theme.panelBorder};
  width: 100%;
  padding: 1rem;
  border-radius: 12px;
`

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const PanelHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
`

const Tabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
`

const TabButton = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ theme, $active }) => ($active ? theme.accent : theme.panelBorder)};
  background: ${({ theme, $active }) => ($active ? theme.accentSoft : 'transparent')};
  color: ${({ theme }) => theme.color};
  border-radius: 8px;
  padding: 0.45rem 0.7rem;
  cursor: pointer;
`

const DevicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 0.9rem;
`

const SectionCard = styled.section`
  border: 1px solid ${({ theme }) => theme.panelBorder};
  border-radius: 10px;
  padding: 0.8rem;
  width: 100%;

  h3 {
    margin-top: 0;
  }
`

const DeviceList = styled.ul`
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`

const DeviceItem = styled.li`
  margin: 0;
  display: flex;
  gap: 0.45rem;
  align-items: center;

  button:first-child {
    flex: 1;
  }

  button:last-child {
    flex-shrink: 0;
  }
`

const DeviceSelectButton = styled.button<{ $active: boolean }>`
  width: 100%;
  text-align: left;
  border: 1px solid ${({ theme, $active }) => ($active ? theme.accent : theme.panelBorder)};
  background: ${({ theme, $active }) => ($active ? theme.accentSoft : 'transparent')};
  color: ${({ theme }) => theme.color};
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
`

const DeviceActionButton = styled.button`
  border: 1px solid ${({ theme }) => theme.panelBorder};
  background: transparent;
  color: ${({ theme }) => theme.accent};
  border-radius: 6px;
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.accentSoft};
    border-color: ${({ theme }) => theme.accent};
  }
`

const EditForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`

const FieldLabel = styled.label`
  font-size: 0.85rem;
  color: #b7c7dd;
`

const TextInput = styled.input`
  border: 1px solid ${({ theme }) => theme.panelBorder};
  background: #101721;
  color: ${({ theme }) => theme.color};
  border-radius: 7px;
  padding: 0.48rem;
`

const NumberInput = styled(TextInput)``

const Select = styled.select`
  border: 1px solid ${({ theme }) => theme.panelBorder};
  background: #101721;
  color: ${({ theme }) => theme.color};
  border-radius: 7px;
  padding: 0.48rem;
`

const CheckRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
`

const Actions = styled.div`
  display: flex;
  gap: 0.45rem;
  margin-top: 0.5rem;
`

const PrimaryButton = styled.button`
  border: 1px solid ${({ theme }) => theme.accent};
  background: ${({ theme }) => theme.accentSoft};
  color: ${({ theme }) => theme.color};
  border-radius: 8px;
  padding: 0.5rem 0.7rem;
  cursor: pointer;
`

const DangerButton = styled(PrimaryButton)`
  border-color: ${({ theme }) => theme.danger};
  background: rgba(255, 107, 107, 0.2);
`

const ErrorBox = styled.div`
  margin-top: 0.9rem;
  border: 1px solid ${({ theme }) => theme.danger};
  background: rgba(255, 107, 107, 0.12);
  border-radius: 8px;
  padding: 0.6rem;
  color: #ffc2c2;
`

const GhostCamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`

const EmfControlLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 180px;
  gap: 0.9rem;
  align-items: start;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`

const SmallPreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const SmallPreviewImage = styled.img`
  display: block;
  width: 100%;
  max-width: 180px;
  border-radius: 8px;
  border: 2px solid ${({ theme }) => theme.panelBorder};
  background: #0c1014;
  aspect-ratio: 4 / 3;
  object-fit: cover;
`

const SmallPreviewPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 180px;
  aspect-ratio: 4 / 3;
  border-radius: 8px;
  border: 2px solid ${({ theme }) => theme.panelBorder};
  background: #0c1014;
  color: #596069;
  font-size: 0.8rem;
  text-align: center;
  padding: 0.6rem;
`

const GhostCamContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const GhostCamLabel = styled.div`
  color: #b4c4da;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.05em;
`

const GhostCamImage = styled.img`
  display: block;
  width: 100%;
  border-radius: 8px;
  border: 2px solid ${({ theme }) => theme.panelBorder};
  background: #0c1014;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  box-shadow: 0 0 16px rgba(94, 200, 255, 0.15);
`

const GhostCamFrame = styled.div`
  position: relative;
`

const GhostCamPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 8px;
  border: 2px solid ${({ theme }) => theme.panelBorder};
  background: #0c1014;
  color: #596069;
  font-size: 0.9rem;
  text-align: center;
  padding: 1rem;
`

const PlaceholderTab = styled.div`
  border: 1px dashed ${({ theme }) => theme.panelBorder};
  border-radius: 8px;
  padding: 0.9rem;
  color: #b7c7dd;
`

const InlineRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;

  @media (max-width: 760px) {
    flex-direction: column;
    align-items: stretch;
  }
`

const ListGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`

const MeterRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr auto;
  align-items: center;
  gap: 0.45rem;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`

const MeterName = styled.span`
  color: #cde5ff;
  font-size: 0.9rem;
`

const MotionAlert = styled.div`
  border: 1px solid #ff8c62;
  background: rgba(255, 140, 98, 0.16);
  color: #ffd2bf;
  border-radius: 8px;
  padding: 0.5rem;
  font-weight: 700;
`

const SensorRow = styled.div`
  border: 1px solid ${({ theme }) => theme.panelBorder};
  border-radius: 8px;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;

  @media (max-width: 760px) {
    flex-direction: column;
    align-items: stretch;
  }
`

const StatusPill = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-size: 0.78rem;
  font-weight: 700;
  border: 1px solid ${({ $active }) => ($active ? '#54d89e' : '#db6a6a')};
  background: ${({ $active }) => ($active ? 'rgba(84, 216, 158, 0.15)' : 'rgba(219, 106, 106, 0.14)')};
  color: ${({ $active }) => ($active ? '#b8ffe1' : '#ffd3d3')};
`

const SoundCueCard = styled.div`
  border: 1px solid ${({ theme }) => theme.panelBorder};
  border-radius: 8px;
  padding: 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  background: rgba(16, 23, 33, 0.75);
`

const VanJsonEditor = styled.textarea`
  border: 1px solid ${({ theme }) => theme.panelBorder};
  background: #101721;
  color: ${({ theme }) => theme.color};
  border-radius: 7px;
  padding: 0.6rem;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  height: 120px;
  resize: vertical;
  line-height: 1.4;
`
