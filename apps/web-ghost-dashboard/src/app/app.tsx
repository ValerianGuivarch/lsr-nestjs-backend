import { io, Socket } from 'socket.io-client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { EmfAdminTool } from './components/admin-tools/EmfAdminTool'
import { GhostCamAdminTool } from './components/admin-tools/GhostCamAdminTool'
import { GhostOrbsAdminTool } from './components/admin-tools/GhostOrbsAdminTool'
import { SpiritBoxAdminTool } from './components/admin-tools/SpiritBoxAdminTool'
import { ThermometerAdminTool } from './components/admin-tools/ThermometerAdminTool'
import { VanAdminTool } from './components/admin-tools/VanAdminTool'
// Utilitaires pour charger les sons/voix dynamiquement
type MusicFile = { label: string; url: string }

function useMusicFiles(type: 'sounds' | 'voices'): MusicFile[] {
  const [files, setFiles] = useState<MusicFile[]>([])
  useEffect(() => {
    fetch(`/api/music/${type}`)
      .then(r => r.json())
      .then((data: { files: string[] }) => {
        setFiles(
          (data.files || []).map(f => ({
            label: f.replace(/\.(mp3|wav|ogg)$/i, ''),
            url: `/music/${type}/${f}`
          }))
        )
      })
      .catch(() => setFiles([]))
  }, [type])
  return files
}

type DeviceRole = 'emf' | 'spiritbox' | 'ghostcam' | 'ghostorbs' | 'thermometer' | 'van'

type Device = {
  deviceId: string
  role: DeviceRole
  emfLevel?: number
  powerOn: boolean
  huntActive: boolean
  message?: string
  cameraColor?: 'green' | 'red'
  temperature?: number
  ghostUntil?: string
  orbUntil?: string
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

type VanDashboardMessage = {
  id: string
  kind: 'audio' | 'text' | 'text_image'
  title: string
  text?: string
  audioUrl?: string
  imageUrl?: string
  sentAt?: string
}

type VanMessageKind = VanDashboardMessage['kind']

type VanMessageDraft = {
  kind: VanMessageKind
  title: string
  text: string
  audioUrl: string
  imageUrl: string
}

type SpiritAudioMessage = {
  id: string
  audioData: string
  mimeType?: string
  from: 'player' | 'mj'
  createdAt: string
}

const SPIRITBOX_PRESET_SOUNDS = [
  { id: 'ghost-voice-1', label: 'GhostVoix1.mp3', audioUrl: 'https://l7r.fr/l7r/GhostVoix1.mp3' },
  { id: 'ghost-voice-2', label: 'GhostVoix2.mp3', audioUrl: 'https://l7r.fr/l7r/GhostVoix2.mp3' },
  { id: 'ghost-voice-3', label: 'GhostVoix3.mp3', audioUrl: 'https://l7r.fr/l7r/GhostVoix3.mp3' },
  { id: 'ghost-voice-4', label: 'GhostVoix4.mp3', audioUrl: 'https://l7r.fr/l7r/GhostVoix4.mp3' },
  { id: 'ghost-voice-5', label: 'GhostVoix5.mp3', audioUrl: 'https://l7r.fr/l7r/GhostVoix5.mp3' },
]

type GameState = {
  gameId: string
  isInitialized: boolean
  isRunning: boolean
  startedAt?: string
  initialSpectralActivity: number
  accelerationRate: number
  currentSpectralActivity: number
  currentScenarioStep: number
  scenarioObjectives?: string
  updatedAt: string
}

type EscapeStep = {
  id: number
  title: string
  description: string
  activityImpact?: string
  requiredTools: DeviceRole[]
}

type VanObjective = { objective: string; completed: boolean }

const VAN_OBJECTIVE_INTRO = 'Intro terminee'
const VAN_OBJECTIVE_MATERIAL = 'Récupérer le matériel de localisation'
const VAN_OBJECTIVE_GHOST = 'Identifier le fantôme'

function normalizeVanText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function isVanObjectiveMatch(value: string, expected: string): boolean {
  return normalizeVanText(value) === normalizeVanText(expected)
}

function parseVanObjectives(raw?: string): VanObjective[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as Array<Partial<VanObjective>>
    return parsed
      .filter(item => item && typeof item === 'object' && typeof item.objective === 'string')
      .map(item => ({ objective: item.objective as string, completed: Boolean(item.completed) }))
  } catch {
    return []
  }
}

function deriveVanFlowStepIndex(objectives: VanObjective[], mjAccepted: boolean): number {
  const hasGhost = objectives.some(item => isVanObjectiveMatch(item.objective, VAN_OBJECTIVE_GHOST) && item.completed)
  if (hasGhost || mjAccepted) {
    return 3
  }

  const hasMaterial = objectives.some(item => isVanObjectiveMatch(item.objective, VAN_OBJECTIVE_MATERIAL) && item.completed)
  if (hasMaterial) {
    return 2
  }

  const hasIntro = objectives.some(item => isVanObjectiveMatch(item.objective, VAN_OBJECTIVE_INTRO) && item.completed)
  if (hasIntro) {
    return 1
  }

  return 0
}

type HomePanel = 'config' | 'game' | 'admin'

const darkTheme = {
  background: '#11161d',
  color: '#e8f0ff',
  panel: '#1a222d',
  panelBorder: '#2f3d50',
  accent: '#5ec8ff',
  accentSoft: '#204361',
  danger: '#ff6b6b'
}

const ESCAPE_STEPS: EscapeStep[] = [
  {
    id: 1,
    title: "Attente - Audio intro",
    description: "Le jeu n\x27est pas lancé. La joueuse clique sur Lecture et on attend la fin de l\x27intro.",
    requiredTools: ["van"]
  },
  {
    id: 2,
    title: "Jeu - Chasse aux indices",
    description: "Le matériel démarre, l\x27activité spectrale s\x27accélère. Le MJ peut contrôler les outils et envoyer des messages.",
    requiredTools: ["emf", "thermometer", "ghostcam", "spiritbox", "van"]
  },
  {
    id: 3,
    title: "Final - Bannissement",
    description: "Le spectre est identifié. Affichage de la procédure de bannissement et résultat de la validation.",
    requiredTools: ["ghostcam", "van"]
  }
]

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

function createDefaultVanMessageTemplates(): VanDashboardMessage[] {
  return [
    {
      id: 'msg-1-intro-audio',
      kind: 'audio',
      title: 'Message 1 - Intro audio',
      audioUrl: 'https://l7r.fr/l7r/GhostIntro.mp3'
    },
    {
      id: 'msg-2-briefing',
      kind: 'text',
      title: 'Message 2 - Briefing',
      text: 'Rassemblez les preuves et confirmez le spectre avant la fin de la chasse.'
    },
    {
      id: 'msg-3-indice-photo',
      kind: 'text_image',
      title: 'Message 3 - Indice visuel',
      text: 'Un indice est apparu dans la zone de la chambre.',
      imageUrl: 'https://l7r.fr/l7r/indice-van.jpg'
    }
  ]
}

function parseVanMessages(raw?: string): VanDashboardMessage[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as Array<Partial<VanDashboardMessage>>
    return parsed
      .filter(item => item && typeof item === 'object')
      .map((item, index) => ({
        id: typeof item.id === 'string' && item.id ? item.id : `van-msg-${index}`,
        kind:
          item.kind === 'audio' || item.kind === 'text' || item.kind === 'text_image'
            ? item.kind
            : 'text',
        title: typeof item.title === 'string' ? item.title : `Message ${index + 1}`,
        text: typeof item.text === 'string' ? item.text : undefined,
        audioUrl: typeof item.audioUrl === 'string' ? item.audioUrl : undefined,
        imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
        sentAt: typeof item.sentAt === 'string' ? item.sentAt : undefined
      }))
  } catch {
    return []
  }
}

function createEmptyVanMessageDraft(): VanMessageDraft {
  return {
    kind: 'text',
    title: '',
    text: '',
    audioUrl: '',
    imageUrl: ''
  }
}

export function App() {
  const [activePanel, setActivePanel] = useState<HomePanel>('config')
  const [devices, setDevices] = useState<Device[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [gameId] = useState<string>('hardcoded-game')
  const [initialSpectralActivity, setInitialSpectralActivity] = useState<number>(20)
  const [accelerationRate, setAccelerationRate] = useState<number>(30)
  const [isGameConfigDirty, setIsGameConfigDirty] = useState<boolean>(false)
  const [scenarioStepIndex, setScenarioStepIndex] = useState<number>(0)

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
  const [controlGhostDurationSec, setControlGhostDurationSec] = useState<number>(3)
  const [controlGhostorbsDeviceId, setControlGhostorbsDeviceId] = useState<string>('')
  const [controlOrbsCameraDeviceId, setControlOrbsCameraDeviceId] = useState<string>('')
  const [controlOrbDurationSec, setControlOrbDurationSec] = useState<number>(3)
  const [controlTemperature, setControlTemperature] = useState<number>(12)
  const [controlThermometerPowerOn, setControlThermometerPowerOn] = useState<boolean>(true)

  const [controlSpiritboxDeviceId, setControlSpiritboxDeviceId] = useState<string>('')
  const [spiritboxRecording, setSpiritboxRecording] = useState(false)
  const [latestPlayerSpiritMessage, setLatestPlayerSpiritMessage] = useState<SpiritAudioMessage | null>(null)
  const spiritboxRecorderRef = useRef<MediaRecorder | null>(null)
  const spiritboxStreamRef = useRef<MediaStream | null>(null)
  const spiritboxChunksRef = useRef<BlobPart[]>([])
  const lastPlayerSpiritMessageIdRef = useRef<string>('')
  const spiritboxNextScheduledTimeRef = useRef(0)
  const spiritboxSocketRef = useRef<Socket | null>(null)
  const spiritboxHtmlAudioRef = useRef<HTMLAudioElement | null>(null)

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
  const [vanMessageTemplates, setVanMessageTemplates] = useState<VanDashboardMessage[]>(createDefaultVanMessageTemplates)
  const [vanSentMessages, setVanSentMessages] = useState<VanDashboardMessage[]>([])
  const [vanDraftMessage, setVanDraftMessage] = useState<VanMessageDraft>(createEmptyVanMessageDraft)
  const [vanNewSoundLabel, setVanNewSoundLabel] = useState<string>('')
  const [vanNewSoundUrl, setVanNewSoundUrl] = useState<string>('')
  const [vanManualMode, setVanManualMode] = useState<boolean>(false)
  const vanHydratedRef = useRef(false)

  const soundFiles = useMusicFiles('sounds')
  const voiceFiles = useMusicFiles('voices')

  const [cameraSources, setCameraSources] = useState<Record<string, string>>({})
  const [cameraPollingEnabled, setCameraPollingEnabled] = useState<boolean>(true)
  const [enabledCameraDevices, setEnabledCameraDevices] = useState<Record<string, boolean>>({})
  const [adminToolRole, setAdminToolRole] = useState<DeviceRole | null>(null)
  const [adminToolDeviceId, setAdminToolDeviceId] = useState<string>('')

  const toggleCameraDevice = (deviceId: string): void => {
    setEnabledCameraDevices(prev => ({ ...prev, [deviceId]: !prev[deviceId] }))
  }

  const ghostApiUrl = (path: string): string => `/apil7r${path}`

  const fetchGameEndpoint = async (path: string, init?: RequestInit): Promise<Response> => {
    return fetch(ghostApiUrl(path), init)
  }

  const toolLabel = (tool: DeviceRole): string => {
    if (tool === 'emf') return 'EMF'
    if (tool === 'spiritbox') return 'Spirit Box'
    if (tool === 'ghostcam') return 'Camera'
    if (tool === 'thermometer') return 'Thermomètre'
    if (tool === 'ghostorbs') return 'Thermomètre'
    return 'Van'
  }

  const setAdminToolTarget = (role: DeviceRole, deviceId: string, updateUrl = true): void => {
    setAdminToolRole(role)
    setAdminToolDeviceId(deviceId)
    setActivePanel('admin')

    if (role === 'emf') {
      setControlDeviceId(deviceId)
    } else if (role === 'spiritbox') {
      setControlSpiritboxDeviceId(deviceId)
    } else if (role === 'ghostcam') {
      setControlGhostcamDeviceId(deviceId)
    } else if (role === 'ghostorbs' || role === 'thermometer') {
      setControlGhostorbsDeviceId(deviceId)
      const selectedThermometer = devices.find(device => device.deviceId === deviceId)
      if (selectedThermometer) {
        setControlTemperature(Number(selectedThermometer.temperature ?? 12))
        setControlThermometerPowerOn(selectedThermometer.powerOn ?? true)
      }
    } else if (role === 'van') {
      setControlVanDeviceId(deviceId)
    }

    if (updateUrl) {
      const url = new URL(window.location.href)
      url.searchParams.set('panel', 'admin')
      url.searchParams.set('adminRole', role)
      url.searchParams.set('adminDevice', deviceId)
      window.location.assign(url.toString())
    }
  }

  const openAdminToolPage = (role: DeviceRole, deviceId: string): void => {
    const url = new URL(window.location.href)
    url.searchParams.set('panel', 'admin')
    url.searchParams.set('adminRole', role)
    url.searchParams.set('adminDevice', deviceId)
    window.open(url.toString(), '_blank', 'noopener,noreferrer')
  }

  const currentVanDevice = useMemo(
    () =>
      devices.find(device => device.role === 'van' && device.deviceId === controlVanDeviceId) ??
      devices.find(device => device.role === 'van'),
    [devices, controlVanDeviceId]
  )

  const vanFlowStepIndex = useMemo(() => {
    if (!currentVanDevice) {
      return Math.min(scenarioStepIndex, ESCAPE_STEPS.length - 1)
    }

    const objectives = parseVanObjectives(currentVanDevice.missionObjectives)
    return deriveVanFlowStepIndex(objectives, Boolean(currentVanDevice.huntActive))
  }, [currentVanDevice, scenarioStepIndex])

  const currentEscapeStep = ESCAPE_STEPS[Math.min(vanFlowStepIndex, ESCAPE_STEPS.length - 1)]

  const stepToolBadges = useMemo(
    () =>
      currentEscapeStep.requiredTools.map(tool => ({
        tool,
        label: toolLabel(tool),
        available: devices.some(device => device.role === tool)
      })),
    [currentEscapeStep, devices]
  )

  useEffect(() => {
    if (activePanel !== 'admin') {
      return
    }

    // Détermine quel device a besoin d'une camera-frame selon l'outil actif
    let relevantDeviceId: string | null = null
    if (adminToolRole === null || adminToolRole === 'emf') {
      relevantDeviceId = controlDeviceId || null
    } else if (adminToolRole === 'ghostcam') {
      relevantDeviceId = controlGhostcamDeviceId || null
    } else if (adminToolRole === 'ghostorbs' || adminToolRole === 'thermometer') {
      relevantDeviceId = controlGhostorbsDeviceId || null
    }
    // spiritbox et autres : pas de polling caméra

    if (!relevantDeviceId) {
      return
    }

    const deviceId = relevantDeviceId
    const interval = setInterval(() => {
      fetch(ghostApiUrl(`/player/device/${deviceId}/camera-frame`))
        .then(r => r.json())
        .then((data: { frame?: string }) => {
          if (data.frame) {
            setCameraSources(prev => ({ ...prev, [deviceId]: data.frame }))
          }
        })
        .catch(() => {
          // Erreur silencieuse
        })
    }, 200)

    return () => clearInterval(interval)
  }, [activePanel, adminToolRole, controlDeviceId, controlGhostcamDeviceId, controlGhostorbsDeviceId])

  useEffect(() => {
    const cameraDevices = devices.filter(
      device =>
        device.role === 'ghostcam' ||
        device.role === 'ghostorbs' ||
        device.role === 'thermometer' ||
        device.role === 'emf'
    )
    setEnabledCameraDevices(prev => {
      const next = { ...prev }
      cameraDevices.forEach(device => {
        if (next[device.deviceId] === undefined) {
          next[device.deviceId] = true
        }
      })
      return next
    })
  }, [devices])

  const refreshDevices = async (): Promise<void> => {
    setIsLoading(true)
    setError('')
    try {
      const next = await fetch(ghostApiUrl('/admin/state')).then(toJson<Device[]>)
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

  const refreshGameState = async (forceSyncConfig = false): Promise<void> => {
    try {
      const next = await fetchGameEndpoint(`/game/${gameId}`).then(toJson<GameState>)
      setGameState(next)
      if (forceSyncConfig || !isGameConfigDirty) {
        setInitialSpectralActivity(next.initialSpectralActivity)
        setAccelerationRate(next.accelerationRate)
      }
      setScenarioStepIndex(Math.min(next.currentScenarioStep, ESCAPE_STEPS.length - 1))
    } catch {
      setGameState(null)
    }
  }

  useEffect(() => {
    void refreshDevices()
    void refreshGameState()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const panelParam = params.get('panel')
    const roleParam = params.get('adminRole')
    const deviceParam = params.get('adminDevice')

    if (panelParam === 'admin') {
      setActivePanel('admin')
    } else if (panelParam === 'game') {
      setActivePanel('game')
    }

    const isRoleValid =
      roleParam === 'emf' ||
      roleParam === 'spiritbox' ||
      roleParam === 'ghostcam' ||
      roleParam === 'thermometer' ||
      roleParam === 'ghostorbs' ||
      roleParam === 'van'

    if (isRoleValid && deviceParam) {
      setAdminToolTarget(roleParam, deviceParam, false)
    }
  }, [])

  useEffect(() => {
    if (activePanel !== 'game') {
      return
    }

    const interval = setInterval(() => {
      void refreshGameState()
    }, 1000)

    return () => clearInterval(interval)
  }, [activePanel, isGameConfigDirty])

  useEffect(() => {
    if (!gameState || !controlVanDeviceId || vanManualMode) {
      return
    }

    const syncedActivity = Math.max(0, Math.min(100, Math.round(gameState.currentSpectralActivity)))
    if (syncedActivity !== vanGhostActivity) {
      setVanGhostActivity(syncedActivity)
    }
  }, [gameState?.currentSpectralActivity, controlVanDeviceId, vanGhostActivity, vanManualMode])

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
      return
    }

    const exists = devices.some(
      device => device.deviceId === controlGhostcamDeviceId && device.role === 'ghostcam'
    )

    if (!controlGhostcamDeviceId || !exists) {
      setControlGhostcamDeviceId(firstGhostcam.deviceId)
      return
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
    const firstThermometerLike = devices.find(
      device => device.role === 'ghostorbs' || device.role === 'thermometer'
    )

    if (!firstThermometerLike) {
      setControlGhostorbsDeviceId('')
      setControlTemperature(12)
      setControlThermometerPowerOn(true)
      return
    }

    const exists = devices.some(
      device =>
        device.deviceId === controlGhostorbsDeviceId &&
        (device.role === 'ghostorbs' || device.role === 'thermometer')
    )

    if (!controlGhostorbsDeviceId || !exists) {
      setControlGhostorbsDeviceId(firstThermometerLike.deviceId)
      setControlTemperature(Number(firstThermometerLike.temperature ?? 12))
      setControlThermometerPowerOn(firstThermometerLike.powerOn ?? true)
      return
    }

    const controlled = devices.find(device => device.deviceId === controlGhostorbsDeviceId)
    if (controlled) {
      setControlTemperature(Number(controlled.temperature ?? 12))
      setControlThermometerPowerOn(controlled.powerOn ?? true)
    }
  }, [devices, controlGhostorbsDeviceId])

  useEffect(() => {
    const firstGhostcam = devices.find(device => device.role === 'ghostcam')

    if (!firstGhostcam) {
      setControlOrbsCameraDeviceId('')
      return
    }

    const exists = devices.some(
      device => device.deviceId === controlOrbsCameraDeviceId && device.role === 'ghostcam'
    )

    if (!controlOrbsCameraDeviceId || !exists) {
      setControlOrbsCameraDeviceId(firstGhostcam.deviceId)
    }
  }, [devices, controlOrbsCameraDeviceId])

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
    const parsedVanMessageTemplates = parseVanMessages(vanDevice.vanMessageTemplates)
    const parsedVanSentMessages = parseVanMessages(vanDevice.vanSentMessages)

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
    setVanMessageTemplates(
      parsedVanMessageTemplates.length > 0 ? parsedVanMessageTemplates : createDefaultVanMessageTemplates()
    )
    setVanSentMessages(parsedVanSentMessages)
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

      fetch(ghostApiUrl(`/admin/device/${controlVanDeviceId}/van`), {
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
          soundboard: JSON.stringify(vanSoundboard),
          vanMessageTemplates: JSON.stringify(vanMessageTemplates),
          vanSentMessages: JSON.stringify(vanSentMessages)
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
    vanSoundboard,
    vanMessageTemplates,
    vanSentMessages
  ])

  useEffect(() => {
    const isSpiritboxAdminPageOpen = activePanel === 'admin' && adminToolRole === 'spiritbox'

    if (!controlSpiritboxDeviceId || !isSpiritboxAdminPageOpen) {
      return
    }

    const ghostAudioOrigin = import.meta.env.VITE_GHOST_AUDIO_ORIGIN as string | undefined
    const ghostAudioNamespace = ghostAudioOrigin
      ? `${ghostAudioOrigin.replace(/\/$/, '')}/ghost-audio`
      : '/ghost-audio'

    // Connexion Socket.IO en tant qu'admin pour écouter les chunks du joueur en temps réel
    const socket = io(ghostAudioNamespace, {
      query: { deviceId: controlSpiritboxDeviceId, role: 'admin' },
      transports: ['websocket'],
    })
    spiritboxSocketRef.current = socket

    socket.on('spiritbox:audio-chunk', (payload: { deviceId: string; chunk: string; mimeType: string }) => {
      setLatestPlayerSpiritMessage({
        id: `${Date.now()}`,
        audioData: payload.chunk,
        mimeType: payload.mimeType,
        createdAt: new Date().toISOString(),
      })
      playSpiritboxMonitorAudio({
        id: `${Date.now()}`,
        audioData: payload.chunk,
        mimeType: payload.mimeType,
        from: 'player',
        createdAt: new Date().toISOString(),
      })
    })

    return () => {
      socket.disconnect()
      spiritboxSocketRef.current = null
    }
  }, [activePanel, adminToolRole, controlSpiritboxDeviceId])

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
      await fetch(ghostApiUrl('/admin/devices'), {
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
      await fetch(ghostApiUrl(`/admin/device/${selectedDeviceId}`), {
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
      await fetch(ghostApiUrl(`/admin/device/${controlDeviceId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      }).then(toJson<Device>)
      await refreshDevices()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const patchGhostcamControl = async (patch: { ghostUntil?: string; orbUntil?: string }): Promise<void> => {
    if (!controlGhostcamDeviceId) {
      setError('Aucun device GhostCam disponible')
      return
    }

    setError('')
    try {
      await fetch(ghostApiUrl(`/admin/device/${controlGhostcamDeviceId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      }).then(toJson<Device>)
      await refreshDevices()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const patchGhostorbsControl = async (patch: { orbUntil?: string }): Promise<void> => {
    if (!controlOrbsCameraDeviceId) {
      setError('Aucun device Camera disponible pour les orbes')
      return
    }

    setError('')
    try {
      await fetch(ghostApiUrl(`/admin/device/${controlOrbsCameraDeviceId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      }).then(toJson<Device>)
      await refreshDevices()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const patchThermometerControl = async (patch: { temperature?: number; powerOn?: boolean }): Promise<void> => {
    if (!controlGhostorbsDeviceId) {
      setError('Aucun device Thermometre disponible')
      return
    }

    setError('')
    try {
      await fetch(ghostApiUrl(`/admin/device/${controlGhostorbsDeviceId}`), {
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
    const orbUntil = new Date(Date.now() + seconds * 1000).toISOString()
    await patchGhostorbsControl({ orbUntil })
  }

  const audioContextRef = useRef<AudioContext | null>(null)
  const [dashboardAudioUnlocked, setDashboardAudioUnlocked] = useState(false)
  const dashboardAudioUnlockedRef = useRef(false)

  useEffect(() => {
    if (dashboardAudioUnlocked) {
      return
    }

    const handleGesture = (): void => {
      dashboardAudioUnlockedRef.current = true
      setDashboardAudioUnlocked(true)
    }

    window.addEventListener('pointerdown', handleGesture, { passive: true })
    window.addEventListener('touchstart', handleGesture, { passive: true })
    window.addEventListener('keydown', handleGesture)

    return () => {
      window.removeEventListener('pointerdown', handleGesture)
      window.removeEventListener('touchstart', handleGesture)
      window.removeEventListener('keydown', handleGesture)
    }
  }, [dashboardAudioUnlocked])

  const enableDashboardAudio = (): void => {
    dashboardAudioUnlockedRef.current = true
    setDashboardAudioUnlocked(true)

    const AudioContextCtor = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AudioContextCtor) {
      return
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor()
    }

    if (audioContextRef.current?.state === 'suspended') {
      void audioContextRef.current.resume()
    }
  }

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
    if (!dashboardAudioUnlocked) {
      return
    }

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

  const playSpiritboxMonitorAudio = (message: SpiritAudioMessage): void => {
    if (!dashboardAudioUnlockedRef.current || !message.audioData) {
      return
    }

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

    try {
      const base64 = message.audioData.includes(',') ? message.audioData.split(',')[1] : message.audioData
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      void ctx.decodeAudioData(bytes.buffer.slice(0)).then(decodedBuffer => {
        const source = ctx.createBufferSource()
        source.buffer = decodedBuffer
        source.connect(ctx.destination)

        // Scheduling précis : enchaîner les chunks sans gap ni overlap
        const scheduleAt = Math.max(ctx.currentTime + 0.05, spiritboxNextScheduledTimeRef.current)
        source.start(scheduleAt)
        spiritboxNextScheduledTimeRef.current = scheduleAt + decodedBuffer.duration
      }).catch(() => {
        const mimeType = message.mimeType || 'audio/webm'
        const src = message.audioData.includes(',')
          ? message.audioData
          : `data:${mimeType};base64,${message.audioData}`

        if (!spiritboxHtmlAudioRef.current) {
          spiritboxHtmlAudioRef.current = new Audio()
        }

        const fallbackAudio = spiritboxHtmlAudioRef.current
        if (!fallbackAudio) {
          return
        }

        fallbackAudio.src = src
        void fallbackAudio.play().catch(() => {
          // Si le fallback échoue aussi, on n'interrompt pas le flux
        })
      })
    } catch (_e) {
      // Erreur décodage base64
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
            return fetch(ghostApiUrl(`/admin/device/${controlSpiritboxDeviceId}/spiritbox/mj-message`), {
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
    playSpiritboxMonitorAudio(latestPlayerSpiritMessage)
  }

  const sendSpiritboxPresetSound = async (preset: { audioUrl: string; label: string }): Promise<void> => {
    if (!controlSpiritboxDeviceId) {
      setError('Aucun device SpiritBox disponible')
      return
    }

    setError('')

    try {
      const response = await fetch(preset.audioUrl)
      if (!response.ok) {
        throw new Error('fetch failed')
      }

      const blob = await response.blob()
      const audioData = await blobToDataUrl(blob)

      await fetch(ghostApiUrl(`/admin/device/${controlSpiritboxDeviceId}/spiritbox/mj-message`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData, mimeType: blob.type || 'audio/mpeg' })
      }).then(toJson<{ ok: true; message: SpiritAudioMessage }>)
    } catch {
      setError(`Impossible d'envoyer ${preset.label}`)
    }
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

  const pushVanTemplateMessage = (templateId: string): void => {
    const template = vanMessageTemplates.find(item => item.id === templateId)
    if (!template) {
      return
    }

    const sentMessage: VanDashboardMessage = {
      ...template,
      sentAt: new Date().toISOString()
    }
    setVanSentMessages(prev => [...prev, sentMessage])
  }

  const addVanTemplateMessage = (): void => {
    const title = vanDraftMessage.title.trim()
    const text = vanDraftMessage.text.trim()
    const audioUrl = vanDraftMessage.audioUrl.trim()
    const imageUrl = vanDraftMessage.imageUrl.trim()

    if (!title) {
      setError('Le titre du message MJ est obligatoire')
      return
    }

    if (vanDraftMessage.kind === 'audio' && !audioUrl) {
      setError('Un message audio doit contenir une URL audio')
      return
    }

    if (vanDraftMessage.kind === 'text' && !text) {
      setError('Un message texte doit contenir du texte')
      return
    }

    if (vanDraftMessage.kind === 'text_image' && (!text || !imageUrl)) {
      setError('Un message texte+image doit contenir du texte et une URL image')
      return
    }

    setVanMessageTemplates(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        kind: vanDraftMessage.kind,
        title,
        text: text || undefined,
        audioUrl: audioUrl || undefined,
        imageUrl: imageUrl || undefined
      }
    ])
    setVanDraftMessage(createEmptyVanMessageDraft())
    setError('')
  }

  const updateVanTemplateMessage = (messageId: string, patch: Partial<VanDashboardMessage>): void => {
    setVanMessageTemplates(prev => prev.map(item => (item.id === messageId ? { ...item, ...patch } : item)))
  }

  const removeVanTemplateMessage = (messageId: string): void => {
    setVanMessageTemplates(prev => prev.filter(item => item.id !== messageId))
  }

  const moveVanTemplateMessage = (messageId: string, direction: 'up' | 'down'): void => {
    setVanMessageTemplates(prev => {
      const index = prev.findIndex(item => item.id === messageId)
      if (index < 0) {
        return prev
      }

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev
      }

      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.splice(targetIndex, 0, item)
      return next
    })
  }

  const clearVanSentMessages = (): void => {
    setVanSentMessages([])
  }

  const resetVanSentMessagesForNewGame = async (): Promise<void> => {
    const vanId = controlVanDeviceId || devices.find(device => device.role === 'van')?.deviceId
    if (!vanId) {
      return
    }

    const templates = vanMessageTemplates.length > 0 ? vanMessageTemplates : createDefaultVanMessageTemplates()
    const firstAudioTemplate = templates.find(message => message.kind === 'audio')
    const initialSentMessages = firstAudioTemplate
      ? [{ ...firstAudioTemplate, sentAt: new Date().toISOString() }]
      : []

    setVanMessageTemplates(templates)
    setVanSentMessages(initialSentMessages)
    setVanObjectives([
      { objective: 'Intro terminee', completed: false },
      { objective: 'Récupérer le matériel de localisation', completed: false },
      { objective: "Trouver la zone d'activité du fantôme", completed: false },
      { objective: "Récupérer le matériel d'identification", completed: false },
      { objective: 'Identifier le fantôme', completed: false },
      { objective: 'Bannir le fantôme', completed: false }
    ])

    try {
      await fetch(ghostApiUrl(`/admin/device/${vanId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ huntActive: false })
      }).then(toJson<Device>)

      await fetch(ghostApiUrl(`/admin/device/${vanId}/van`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionObjectives: JSON.stringify([
            { objective: 'Intro terminee', completed: false },
            { objective: 'Récupérer le matériel de localisation', completed: false },
            { objective: "Trouver la zone d'activité du fantôme", completed: false },
            { objective: "Récupérer le matériel d'identification", completed: false },
            { objective: 'Identifier le fantôme', completed: false },
            { objective: 'Bannir le fantôme', completed: false },
          ]),
          vanMessageTemplates: JSON.stringify(templates),
          vanSentMessages: JSON.stringify(initialSentMessages)
        })
      }).then(toJson<Device>)
    } catch {
      // L'auto-save fera une nouvelle tentative.
    }
  }

  const triggerMotionEvent = (room: string): void => {
    const nextDetections = vanRooms.reduce<Record<string, boolean>>((acc, currentRoom) => {
      acc[currentRoom] = currentRoom === room
      return acc
    }, {})

    const nextMessage = `Activité détectée dans ${room}`
    setVanMotionDetections(nextDetections)
    setVanRecentMotionAlert(nextMessage)
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

      await fetch(ghostApiUrl(`/admin/device/${controlVanDeviceId}/van`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ghostActivityLevel: vanGhostActivity,
          playerSanity: JSON.stringify(sanityMap),
          soundLevels: JSON.stringify(vanSoundLevels),
          motionDetections: JSON.stringify(vanMotionDetections),
          roomList: JSON.stringify(vanRooms),
          motionSensorRooms: JSON.stringify(vanRooms),
          recentMotionAlert: vanRecentMotionAlert || undefined,
          missionObjectives: JSON.stringify(vanObjectives),
          floorPlanImage: vanFloorPlanImage,
          backgroundMusic: JSON.stringify(vanBackgroundMusic),
          soundboard: JSON.stringify(vanSoundboard),
          vanMessageTemplates: JSON.stringify(vanMessageTemplates),
          vanSentMessages: JSON.stringify(vanSentMessages)
        })
      }).then(toJson<Device>)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const setVanMjApproval = async (approved: boolean): Promise<void> => {
    if (!controlVanDeviceId) {
      setError('Aucun device Van disponible')
      return
    }

    setError('')
    try {
      await fetch(ghostApiUrl(`/admin/device/${controlVanDeviceId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ huntActive: approved })
      }).then(toJson<Device>)
      await refreshDevices()
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
      await fetch(ghostApiUrl('/admin/reset'), {
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
        await fetch(ghostApiUrl('/admin/devices'), {
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

      await fetch(ghostApiUrl('/admin/device/van/van'), {
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
            { objective: 'Intro terminee', completed: false },
            { objective: 'Récupérer le matériel de localisation', completed: false },
            { objective: "Trouver la zone d'activité du fantôme", completed: false },
            { objective: "Récupérer le matériel d'identification", completed: false },
            { objective: 'Identifier le fantôme', completed: false },
            { objective: 'Bannir le fantôme', completed: false },
          ]),
          backgroundMusic: JSON.stringify(createDefaultVanBackgroundMusic()),
          soundboard: JSON.stringify([]),
          vanMessageTemplates: JSON.stringify(createDefaultVanMessageTemplates()),
          vanSentMessages: JSON.stringify([])
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
      await fetch(ghostApiUrl(`/admin/device/${selectedDeviceId}`), {
        method: 'DELETE'
      }).then(toJson<{ ok: true }>)
      setSelectedDeviceId('')
      await refreshDevices()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const initGame = async (): Promise<void> => {
    setError('')
    try {
      const next = await fetchGameEndpoint(`/admin/game/${gameId}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialSpectralActivity,
          accelerationRate
        })
      }).then(toJson<GameState>)
      setGameState(next)
      setInitialSpectralActivity(next.initialSpectralActivity)
      setAccelerationRate(next.accelerationRate)
      setIsGameConfigDirty(false)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const startGame = async (): Promise<void> => {
    setError('')
    try {
      const next = await fetchGameEndpoint(`/admin/game/${gameId}/start`, {
        method: 'POST'
      }).then(toJson<GameState>)
      await resetVanSentMessagesForNewGame()
      setGameState(next)
      setScenarioStepIndex(Math.min(next.currentScenarioStep, ESCAPE_STEPS.length - 1))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const stopGame = async (): Promise<void> => {
    setError('')
    try {
      const next = await fetchGameEndpoint(`/admin/game/${gameId}/stop`, {
        method: 'POST'
      }).then(toJson<GameState>)
      setGameState(next)
      setScenarioStepIndex(Math.min(next.currentScenarioStep, ESCAPE_STEPS.length - 1))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const advanceGameStep = async (): Promise<void> => {
    setError('')
    try {
      const next = await fetchGameEndpoint(`/admin/game/${gameId}/advance-step`, {
        method: 'POST'
      }).then(toJson<GameState>)
      setGameState(next)
      setScenarioStepIndex(Math.min(next.currentScenarioStep, ESCAPE_STEPS.length - 1))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const toggleVanObjective = async (objectiveText: string): Promise<void> => {
    if (!controlVanDeviceId) {
      setError('Aucun device van sélectionné')
      return
    }

    const updated = vanObjectives.map(obj =>
      obj.objective === objectiveText ? { ...obj, completed: !obj.completed } : obj
    )

    setVanObjectives(updated)

    try {
      await fetch(ghostApiUrl(`/admin/device/${encodeURIComponent(controlVanDeviceId)}/van`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionObjectives: JSON.stringify(updated) })
      }).then(toJson<Device>)
    } catch (e) {
      setError((e as Error).message)
      setVanObjectives(vanObjectives)
    }
  }

  const takeGhostcamPhoto = (): void => {
    const frame = controlGhostcamDeviceId ? cameraSources[controlGhostcamDeviceId] : undefined
    if (!frame) {
      return
    }

    const link = document.createElement('a')
    link.href = frame
    link.download = `ghostcam-${controlGhostcamDeviceId || 'capture'}-${Date.now()}.png`
    link.click()
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Container>
        <Header>
          <h1>Ghost MJ Dashboard</h1>
          <p>Panel principal: accès aux dashboards MJ</p>
        </Header>

        {activePanel !== 'admin' && (
          <HomeCards>
            <HomeCard
              $active={activePanel === 'config'}
              onClick={() => setActivePanel('config')}
              type="button"
            >
              <h3>Config</h3>
              <span>Liste des devices + ouverture player</span>
            </HomeCard>
            <HomeCard
              $active={activePanel === 'game'}
              onClick={() => setActivePanel('game')}
              type="button"
            >
              <h3>Partie</h3>
              <span>État du jeu et objectifs</span>
            </HomeCard>
            <HomeCard
              $active={activePanel === 'admin'}
              onClick={() => setActivePanel('admin')}
              type="button"
            >
              <h3>Admin Outil</h3>
              <span>Page dédiée par outil</span>
            </HomeCard>
          </HomeCards>
        )}

        {activePanel === 'config' && (
          <Panel>
            <PanelHeader>
              <h2>Config</h2>
              <PanelHeaderActions>
                <button type="button" onClick={() => void refreshDevices()} disabled={isLoading}>
                  Rafraîchir
                </button>
              </PanelHeaderActions>
            </PanelHeader>

            <DevicesGrid>
              <SectionCard>
                <h3>Devices</h3>
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
                        <span>{toolLabel(device.role as DeviceRole)}</span>
                      </DeviceSelectButton>
                      <DeviceActionButton
                        type="button"
                        onClick={() => window.open(`/ghost/player?device=${device.deviceId}`, '_blank')}
                        title="Voir le player du device"
                      >
                        🎮 Player
                      </DeviceActionButton>
                      <DeviceActionButton
                        type="button"
                        onClick={() => openAdminToolPage(device.role, device.deviceId)}
                        title="Ouvrir la page admin de cet outil"
                      >
                        🛠 Admin
                      </DeviceActionButton>
                    </DeviceItem>
                  ))}
                </DeviceList>
              </SectionCard>
            </DevicesGrid>

            {error && <ErrorBox>{error}</ErrorBox>}
          </Panel>
        )}

        {activePanel === 'game' && (
          <Panel>
            <>
                <h2>Partie en cours</h2>

                <DevicesGrid>
                  <SectionCard>
                    <h3>État actuel</h3>
                    {!gameState && <small>Aucune partie trouvée (initialise d'abord).</small>}
                    {gameState && (
                      <EditForm>
                        <small>Game ID: {gameState.gameId}</small>
                        <small>Statut: {gameState.isRunning ? 'En cours' : 'Arrêtée'}</small>
                        <small>Étape scénario moteur: {gameState.currentScenarioStep + 1}</small>
                        <small>Étape flow Van: {vanFlowStepIndex + 1}</small>
                        <small>Activité spectrale: {Math.round(gameState.currentSpectralActivity)}%</small>

                        <Actions>
                          {!gameState.isRunning && (
                            <PrimaryButton type="button" onClick={() => void startGame()}>
                              Démarrer
                            </PrimaryButton>
                          )}
                          {gameState.isRunning && (
                            <DangerButton type="button" onClick={() => void stopGame()}>
                              Arrêter
                            </DangerButton>
                          )}
                          <PrimaryButton type="button" onClick={() => void advanceGameStep()}>
                            Étape suivante
                          </PrimaryButton>
                        </Actions>
                      </EditForm>
                    )}
                  </SectionCard>

                  <SectionCard>
                    <h3>Etape courante</h3>
                    <EditForm>
                      <strong>{currentEscapeStep.id}. {currentEscapeStep.title}</strong>
                      <small>{currentEscapeStep.description}</small>
                      {currentEscapeStep.activityImpact && <small>Impact: {currentEscapeStep.activityImpact}</small>}
                    </EditForm>
                  </SectionCard>

                  <SectionCard>
                    <h3>Objectifs</h3>
                    <ObjectivesList>
                      {vanObjectives.map((obj, idx) => (
                        <ObjectiveCheckboxItem key={idx}>
                          <input
                            type="checkbox"
                            checked={obj.completed}
                            onChange={() => void toggleVanObjective(obj.objective)}
                          />
                          <label>{obj.objective}</label>
                        </ObjectiveCheckboxItem>
                      ))}
                    </ObjectivesList>
                  </SectionCard>
                </DevicesGrid>

            </>
          </Panel>
        )}

        {activePanel === 'admin' && (
          <>
            {(adminToolRole === null || adminToolRole === 'emf') && (
              <EmfAdminTool
                devices={devices.map(device => ({ deviceId: device.deviceId, role: device.role }))}
                controlDeviceId={controlDeviceId}
                controlEmfLevel={controlEmfLevel}
                controlPowerOn={controlPowerOn}
                cameraFrame={controlDeviceId ? cameraSources[controlDeviceId] : undefined}
                onControlDeviceChange={setControlDeviceId}
                onControlEmfLevelChange={value => {
                  setControlEmfLevel(value)
                  void patchEmfControl({ emfLevel: value })
                }}
                onControlPowerOnChange={checked => {
                  setControlPowerOn(checked)
                  void patchEmfControl({ powerOn: checked })
                }}
              />
            )}

            {adminToolRole === 'spiritbox' && (
              <SpiritBoxAdminTool
                controlDeviceId={controlSpiritboxDeviceId}
                audioEnabled={dashboardAudioUnlocked}
                latestPlayerMessageAt={latestPlayerSpiritMessage?.createdAt}
                latestPlayerAudioData={latestPlayerSpiritMessage?.audioData}
                latestPlayerMimeType={latestPlayerSpiritMessage?.mimeType}
                presetSounds={SPIRITBOX_PRESET_SOUNDS}
                onEnableAudio={enableDashboardAudio}
                onPlayLatest={playLatestPlayerSpiritMessage}
                onSendPresetSound={preset => {
                  void sendSpiritboxPresetSound(preset)
                }}
              />
            )}

            {adminToolRole === 'ghostcam' && (
              <GhostCamAdminTool
                cameraFrame={controlGhostcamDeviceId ? cameraSources[controlGhostcamDeviceId] : undefined}
                onPhoto={takeGhostcamPhoto}
                ghostcamDeviceId={controlGhostcamDeviceId}
                ghostcamDeviceOptions={devices.filter(device => device.role === 'ghostcam').map(device => device.deviceId)}
                ghostDurationSec={controlGhostDurationSec}
                onGhostcamDeviceChange={setControlGhostcamDeviceId}
                onGhostDurationChange={setControlGhostDurationSec}
                onTriggerGhost={() => {
                  void triggerGhostAction()
                }}
                ghostorbsDeviceId={controlOrbsCameraDeviceId}
                ghostorbsDeviceOptions={devices
                  .filter(device => device.role === 'ghostcam')
                  .map(device => device.deviceId)}
                orbDurationSec={controlOrbDurationSec}
                onGhostorbsDeviceChange={setControlOrbsCameraDeviceId}
                onOrbDurationChange={setControlOrbDurationSec}
                onTriggerOrbs={() => {
                  void triggerOrbsAction()
                }}
              />
            )}

            {(adminToolRole === 'ghostorbs' || adminToolRole === 'thermometer') && (
              <ThermometerAdminTool
                devices={devices.map(device => ({ deviceId: device.deviceId, role: device.role }))}
                controlDeviceId={controlGhostorbsDeviceId}
                controlTemperature={controlTemperature}
                controlPowerOn={controlThermometerPowerOn}
                cameraFrame={controlGhostorbsDeviceId ? cameraSources[controlGhostorbsDeviceId] : undefined}
                onControlDeviceChange={setControlGhostorbsDeviceId}
                onControlTemperatureChange={value => {
                  setControlTemperature(value)
                  void patchThermometerControl({ temperature: value })
                }}
                onControlPowerOnChange={checked => {
                  setControlThermometerPowerOn(checked)
                  void patchThermometerControl({ powerOn: checked })
                }}
              />
            )}

            {adminToolRole === 'van' && <VanAdminTool toolLabel={toolLabel(adminToolRole)} />}
          </>
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
  width: 60%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: 1200px) {
    width: 100%;
  }
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

const GhostCamContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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

const ObjectivesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`

const ObjectiveCheckboxItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;

  input[type='checkbox'] {
    cursor: pointer;
    width: 18px;
    height: 18px;
  }

  label {
    cursor: pointer;
    flex: 1;
    font-size: 0.9rem;
  }
`
