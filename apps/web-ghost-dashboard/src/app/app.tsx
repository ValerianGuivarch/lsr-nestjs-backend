import { io, Socket } from 'socket.io-client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { EmfAdminTool } from './components/admin-tools/EmfAdminTool'
import { GhostCamAdminTool } from './components/admin-tools/GhostCamAdminTool'
import { GhostOrbsAdminTool } from './components/admin-tools/GhostOrbsAdminTool'
import { SpiritBoxAdminTool } from './components/admin-tools/SpiritBoxAdminTool'
import { ThermometerAdminTool } from './components/admin-tools/ThermometerAdminTool'
import { VanAdminTool } from './components/admin-tools/VanAdminTool'
import { MessagerieAdminTool } from './components/admin-tools/MessagerieAdminTool'
import { VanTextsEditor } from './components/admin-tools/VanTextsEditor'
import {
  VanMessage,
  VanObjective,
  VanBackgroundMusic,
  VanSoundCue,
  VanTextConfig,
  VAN_OBJECTIVE_INTRO,
  VAN_OBJECTIVE_MATERIAL,
  VAN_OBJECTIVE_LOCATE,
  VAN_OBJECTIVE_IDENTIFICATION_GEAR,
  VAN_OBJECTIVE_GHOST,
  VAN_OBJECTIVE_BANISH,
  DEFAULT_VAN_OBJECTIVES,
  isVanObjectiveMatch,
  ensureVanObjectives,
  deriveVanObjectiveStep,
  createDefaultVanBackgroundMusic,
  parseVanBackgroundMusic,
  parseVanSoundboard,
  parseVanObjectives,
  parseVanMessages,
  parseVanTextConfig,
  DEFAULT_VAN_TEXT_CONFIG,
} from 'ghost/frontend'
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

type DeviceRole = 'emf' | 'spiritbox' | 'ghostcam' | 'ghostorbs' | 'thermometer' | 'van' | 'messagerie'

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
  vanTextConfig?: string
  updatedAt: string
}

type VanPlayer = {
  id: string
  name: string
  sanity: number
}

type VanDashboardMessage = VanMessage

type VanMessageDraft = {
  title: string
  text: string
  imageUrl: string
  audioUrl: string
}

type SpiritAudioMessage = {
  id: string
  audioData: string
  mimeType?: string
  hasPrependedHeader?: boolean
  codec?: 'pcm16'
  sampleRate?: number
  channels?: number
  from: 'player' | 'mj'
  createdAt: string
}

const SPIRITBOX_PRESET_SOUNDS = [
  { id: 'ghost-voice', label: 'Voix fantôme', audioUrl: 'https://l7r.fr/l7r/GhostVoix1.mp3' },
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

type VanCameraMode = 'manual_locked' | 'manual_unlocked' | 'auto_mj_validation'

function resolveVanCameraMode(vanStep: number, photoModeUnlocked: boolean): VanCameraMode {
  if (vanStep >= 6) {
    return 'auto_mj_validation'
  }

  return photoModeUnlocked ? 'manual_unlocked' : 'manual_locked'
}

function formatVanCameraMode(mode: VanCameraMode): string {
  switch (mode) {
    case 'auto_mj_validation':
      return 'Auto + validation MJ'
    case 'manual_unlocked':
      return 'Bouton photo joueur déverrouillé'
    case 'manual_locked':
    default:
      return 'Bouton photo joueur verrouillé'
  }
}

type HomePanel = 'config' | 'game' | 'admin' | 'texts' | 'van-admin-mobile'

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

function createEmptyVanMessageDraft(): VanMessageDraft {
  return {
    title: '',
    text: '',
    imageUrl: '',
    audioUrl: ''
  }
}

export function App() {
  const [activePanel, setActivePanel] = useState<HomePanel>('config')
  const [devices, setDevices] = useState<Device[]>([])
  const devicesRef = useRef<Device[]>([])
  useEffect(() => {
    devicesRef.current = devices
  }, [devices])
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
  const [controlEmfFound, setControlEmfFound] = useState<boolean>(false)
  const [controlGhostcamDeviceId, setControlGhostcamDeviceId] = useState<string>('')
  const [controlGhostDurationSec, setControlGhostDurationSec] = useState<number>(10)
  const [controlGhostorbsDeviceId, setControlGhostorbsDeviceId] = useState<string>('')
  const [controlOrbsCameraDeviceId, setControlOrbsCameraDeviceId] = useState<string>('')
  const [controlOrbDurationSec, setControlOrbDurationSec] = useState<number>(5)
  const [controlTemperature, setControlTemperature] = useState<number>(12)
  const [controlThermometerPowerOn, setControlThermometerPowerOn] = useState<boolean>(true)
  const [controlThermometerActive, setControlThermometerActive] = useState<boolean>(false)

  const [controlSpiritboxDeviceId, setControlSpiritboxDeviceId] = useState<string>('')
  const [spiritboxRecording, setSpiritboxRecording] = useState(false)
  const [latestPlayerSpiritMessage, setLatestPlayerSpiritMessage] = useState<SpiritAudioMessage | null>(null)
  const [spiritboxFrequency, setSpiritboxFrequency] = useState<{ frequency: number; locked: boolean } | null>(null)
  const spiritboxRecorderRef = useRef<MediaRecorder | null>(null)
  const spiritboxStreamRef = useRef<MediaStream | null>(null)
  const spiritboxChunksRef = useRef<BlobPart[]>([])
  const lastPlayerSpiritMessageIdRef = useRef<string>('')
  const spiritboxNextScheduledTimeRef = useRef(0)
  const spiritboxHeaderDurationRef = useRef(0)
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
  const [vanStep, setVanStep] = useState<number>(0)
  const [vanPendingPhoto, setVanPendingPhoto] = useState<string | undefined>(undefined)
  const [vanPendingPhotoClean, setVanPendingPhotoClean] = useState<string | undefined>(undefined)
  const [vanFinalPhoto, setVanFinalPhoto] = useState<string | undefined>(undefined)
  const [vanFloorPlanImage, setVanFloorPlanImage] = useState<string | null>(null)
  const [vanBackgroundMusic, setVanBackgroundMusic] = useState<VanBackgroundMusic>(createDefaultVanBackgroundMusic)
  const [vanSoundboard, setVanSoundboard] = useState<VanSoundCue[]>([])
  const [vanSentMessages, setVanSentMessages] = useState<VanDashboardMessage[]>([])
  const [vanDraftMessage, setVanDraftMessage] = useState<VanMessageDraft>(createEmptyVanMessageDraft)
  const [vanNewSoundLabel, setVanNewSoundLabel] = useState<string>('')
  const [vanNewSoundUrl, setVanNewSoundUrl] = useState<string>('')
  const [vanManualMode, setVanManualMode] = useState<boolean>(false)
  const [vanTexts, setVanTexts] = useState<VanTextConfig>(() => ({ ...DEFAULT_VAN_TEXT_CONFIG, banners: { ...DEFAULT_VAN_TEXT_CONFIG.banners }, hints: { ...DEFAULT_VAN_TEXT_CONFIG.hints }, intro: { ...DEFAULT_VAN_TEXT_CONFIG.intro }, identification: { ...DEFAULT_VAN_TEXT_CONFIG.identification }, banish: { ...DEFAULT_VAN_TEXT_CONFIG.banish }, victory: { ...DEFAULT_VAN_TEXT_CONFIG.victory } }))
  const [vanTextsSaving, setVanTextsSaving] = useState(false)
  const [vanTextsSaveError, setVanTextsSaveError] = useState('')
  const vanHydratedRef = useRef(false)
  // Les messages van sont écrits de façon optimiste (envoi/clear) puis persistés.
  // On ne ré-hydrate la liste depuis le backend qu'une fois (ou au changement de van)
  // pour éviter qu'un poll plus ancien écrase un message à peine envoyé.
  const vanMessagesHydratedRef = useRef(false)

  const soundFiles = useMusicFiles('sounds')
  const voiceFiles = useMusicFiles('voices')

  const [cameraSources, setCameraSources] = useState<Record<string, string>>({})
  const [cameraSourcesClean, setCameraSourcesClean] = useState<Record<string, string>>({})
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
    if (tool === 'ghostorbs') return 'Ghost Orbs'
    if (tool === 'messagerie') return 'Messagerie'
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
        setControlThermometerActive(Number(selectedThermometer.temperature ?? 12) <= 6)
      }
    } else if (role === 'van') {
      setControlVanDeviceId(deviceId)
    } else if (role === 'messagerie') {
      const firstVan = devices.find(device => device.role === 'van')
      if (firstVan) {
        setControlVanDeviceId(firstVan.deviceId)
      }
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

  const currentGhostcamDevice = useMemo(
    () =>
      devices.find(device => device.role === 'ghostcam' && device.deviceId === controlGhostcamDeviceId) ??
      devices.find(device => device.role === 'ghostcam'),
    [devices, controlGhostcamDeviceId]
  )

  const vanProgressState = useMemo(() => {
    if (!currentVanDevice) {
      const fallbackStep = Math.max(1, Math.min(7, scenarioStepIndex || 1))
      const cameraMode = resolveVanCameraMode(fallbackStep, Boolean(currentGhostcamDevice?.photoModeUnlocked))
      return {
        objectiveStep: fallbackStep,
        effectiveStep: fallbackStep,
        flowStepIndex: Math.min(fallbackStep, ESCAPE_STEPS.length - 1),
        cameraMode,
      }
    }

    const objectives = ensureVanObjectives(parseVanObjectives(currentVanDevice.missionObjectives))
    const objectiveStep = deriveVanObjectiveStep(objectives)
    const baseStep = typeof (currentVanDevice as any).vanStep === 'number' ? Math.max(1, Math.min(7, (currentVanDevice as any).vanStep)) : 1
    const pendingPhoto = Boolean(vanPendingPhoto || (currentVanDevice as any).vanPendingPhoto)
    const finalPhoto = Boolean(vanFinalPhoto || (currentVanDevice as any).vanFinalPhoto)

    // Le step affiché est 1..7 : objectif résolu => count + 1 (intro fait => 2, ...).
    const displayedFromObjectives = Math.max(1, Math.min(7, objectiveStep + 1))
    let effectiveStep = Math.max(baseStep, displayedFromObjectives)
    if (pendingPhoto) {
      effectiveStep = Math.max(effectiveStep, 6)
    }
    if (finalPhoto) {
      effectiveStep = 7
    }

    const cameraMode = resolveVanCameraMode(effectiveStep, Boolean(currentGhostcamDevice?.photoModeUnlocked))
    return {
      objectiveStep,
      effectiveStep,
      flowStepIndex: Math.min(effectiveStep, ESCAPE_STEPS.length - 1),
      cameraMode,
    }
  }, [
    currentVanDevice,
    scenarioStepIndex,
    currentGhostcamDevice?.photoModeUnlocked,
    vanPendingPhoto,
    vanFinalPhoto,
  ])

  const currentEscapeStep = ESCAPE_STEPS[vanProgressState.flowStepIndex]

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

    // Détermine quels devices ont besoin d'une camera-frame selon l'outil actif
    const relevantDeviceIds = new Set<string>()
    if (adminToolRole === null || adminToolRole === 'emf') {
      if (controlDeviceId) relevantDeviceIds.add(controlDeviceId)
    } else if (adminToolRole === 'ghostcam') {
      if (controlGhostcamDeviceId) relevantDeviceIds.add(controlGhostcamDeviceId)
    } else if (adminToolRole === 'ghostorbs' || adminToolRole === 'thermometer') {
      if (controlGhostorbsDeviceId) relevantDeviceIds.add(controlGhostorbsDeviceId)
    } else if (adminToolRole === 'van') {
      // Page Admin Van condensée : on suit toutes les caméras utiles
      if (controlDeviceId) relevantDeviceIds.add(controlDeviceId)
      if (controlGhostorbsDeviceId) relevantDeviceIds.add(controlGhostorbsDeviceId)
      if (controlGhostcamDeviceId) relevantDeviceIds.add(controlGhostcamDeviceId)
    }
    // spiritbox et autres : pas de polling caméra

    if (relevantDeviceIds.size === 0) {
      return
    }

    const deviceIds = Array.from(relevantDeviceIds)
    const interval = setInterval(() => {
      deviceIds.forEach(deviceId => {
        fetch(ghostApiUrl(`/player/device/${deviceId}/camera-frame`))
          .then(r => r.json())
          .then((data: { frame?: string; frameClean?: string }) => {
            if (data.frame) {
              setCameraSources(prev => ({ ...prev, [deviceId]: data.frame }))
            }
            if (data.frameClean) {
              setCameraSourcesClean(prev => ({ ...prev, [deviceId]: data.frameClean as string }))
            }
          })
          .catch(() => {
            // Erreur silencieuse
          })
      })
    }, 100)

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
    } else if (panelParam === 'van-admin-mobile') {
      setActivePanel('van-admin-mobile')
    }

    const isRoleValid =
      roleParam === 'emf' ||
      roleParam === 'spiritbox' ||
      roleParam === 'ghostcam' ||
      roleParam === 'thermometer' ||
      roleParam === 'ghostorbs' ||
      roleParam === 'van' ||
      roleParam === 'messagerie'

    if (isRoleValid && deviceParam) {
      setAdminToolTarget(roleParam as DeviceRole, deviceParam, false)
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
    const isVanAdminPageOpen = activePanel === 'admin' && adminToolRole === 'van'
    if (!isVanAdminPageOpen || !controlVanDeviceId) {
      return
    }

    setVanManualMode(true)

    const interval = window.setInterval(() => {
      setVanGhostActivity(prev => Math.min(100, prev + 1))
    }, 20_000)

    return () => window.clearInterval(interval)
  }, [activePanel, adminToolRole, controlVanDeviceId])

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
      setControlEmfFound(false)
      return
    }

    if (!controlDeviceId || !devices.some(device => device.deviceId === controlDeviceId && device.role === 'emf')) {
      setControlDeviceId(firstEmf.deviceId)
      setControlEmfLevel(firstEmf.emfLevel ?? 0)
      setControlPowerOn(firstEmf.powerOn ?? true)
      setControlEmfFound((firstEmf.emfLevel ?? 0) >= 4)
      return
    }

    const controlled = devices.find(device => device.deviceId === controlDeviceId)
    if (controlled) {
      setControlEmfLevel(controlled.emfLevel ?? 0)
      setControlPowerOn(controlled.powerOn ?? true)
      setControlEmfFound((controlled.emfLevel ?? 0) >= 4)
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
      setControlThermometerActive(false)
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
      setControlThermometerActive(Number(firstThermometerLike.temperature ?? 12) <= 6)
      return
    }

    const controlled = devices.find(device => device.deviceId === controlGhostorbsDeviceId)
    if (controlled) {
      setControlTemperature(Number(controlled.temperature ?? 12))
      setControlThermometerPowerOn(controlled.powerOn ?? true)
      setControlThermometerActive(Number(controlled.temperature ?? 12) <= 6)
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

  // Au changement de van sélectionné, on autorise une ré-hydratation des messages.
  useEffect(() => {
    vanMessagesHydratedRef.current = false
  }, [controlVanDeviceId])

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
    const parsedObjectivesRaw = vanDevice.missionObjectives
      ? (JSON.parse(vanDevice.missionObjectives) as Array<{ objective: string; completed: boolean }>)
      : []
    const parsedObjectives = ensureVanObjectives(parsedObjectivesRaw)
    const objectiveStep = deriveVanObjectiveStep(parsedObjectives)
    const persistedStep = typeof (vanDevice as any).vanStep === 'number' ? (vanDevice as any).vanStep : 1
    const hasPendingPhoto = Boolean((vanDevice as any).vanPendingPhoto)
    const hasFinalPhoto = Boolean((vanDevice as any).vanFinalPhoto)
    const displayedFromObjectives = Math.max(1, Math.min(7, objectiveStep + 1))
    let effectiveStep = Math.max(1, Math.min(7, Math.max(persistedStep, displayedFromObjectives)))
    if (hasPendingPhoto) {
      effectiveStep = Math.max(effectiveStep, 6)
    }
    if (hasFinalPhoto) {
      effectiveStep = 7
    }
    const parsedBackgroundMusic = parseVanBackgroundMusic(vanDevice.backgroundMusic)
    const parsedSoundboard = parseVanSoundboard(vanDevice.soundboard)
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
    setVanStep(effectiveStep)
    setVanPendingPhoto((vanDevice as any).vanPendingPhoto || undefined)
    setVanFinalPhoto((vanDevice as any).vanFinalPhoto || undefined)
    setVanFloorPlanImage(vanDevice.floorPlanImage ?? null)
    setVanBackgroundMusic(parsedBackgroundMusic)
    setVanSoundboard(parsedSoundboard)
    if (!vanMessagesHydratedRef.current) {
      setVanSentMessages(parsedVanSentMessages)
      vanMessagesHydratedRef.current = true
    }
    setVanTexts(parseVanTextConfig(vanDevice.vanTextConfig))
    vanHydratedRef.current = true
  }, [devices, controlVanDeviceId])

  useEffect(() => {
    if (
      !controlVanDeviceId ||
      !vanHydratedRef.current ||
      activePanel !== 'admin' ||
      adminToolRole !== 'van'
    ) {
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
          floorPlanImage: vanFloorPlanImage,
          backgroundMusic: JSON.stringify(vanBackgroundMusic),
          soundboard: JSON.stringify(vanSoundboard),
          vanSentMessages: JSON.stringify(vanSentMessages)
        })
      }).catch(() => {
        // Erreur réseau silencieuse
      })
    }, 220)

    return () => window.clearTimeout(timer)
  }, [
    activePanel,
    adminToolRole,
    controlVanDeviceId,
    vanGhostActivity,
    vanPlayers,
    vanSoundLevels,
    vanMotionDetections,
    vanRooms,
    vanMotionSensors,
    vanRecentMotionAlert,
    vanFloorPlanImage,
    vanBackgroundMusic,
    vanSoundboard,
    vanSentMessages
  ])

  useEffect(() => {
    if (activePanel !== 'admin' || adminToolRole !== 'van' || !controlVanDeviceId) {
      return
    }

    const syncVanState = (): void => {
      fetch(ghostApiUrl(`/player/device/${encodeURIComponent(controlVanDeviceId)}/van?ts=${Date.now()}`), { cache: 'no-store' })
        .then(toJson<Device>)
        .then(vanDevice => {
          const parsedObjectives = ensureVanObjectives(parseVanObjectives(vanDevice.missionObjectives))
          const objectiveStep = deriveVanObjectiveStep(parsedObjectives)
          const persistedStep = typeof (vanDevice as any).vanStep === 'number' ? (vanDevice as any).vanStep : 1
          const hasPendingPhoto = Boolean((vanDevice as any).vanPendingPhoto)
          const hasFinalPhoto = Boolean((vanDevice as any).vanFinalPhoto)

          const displayedFromObjectives = Math.max(1, Math.min(7, objectiveStep + 1))
          let effectiveStep = Math.max(1, Math.min(7, Math.max(persistedStep, displayedFromObjectives)))
          if (hasPendingPhoto) {
            effectiveStep = Math.max(effectiveStep, 6)
          }
          if (hasFinalPhoto) {
            effectiveStep = 7
          }

          if (!vanManualMode) {
            setVanGhostActivity(prev => {
              const next = Math.max(0, Math.min(100, Math.round(vanDevice.ghostActivityLevel ?? 0)))
              return prev === next ? prev : next
            })
          }

          setVanObjectives(prev =>
            JSON.stringify(prev) === JSON.stringify(parsedObjectives) ? prev : parsedObjectives
          )
          setVanStep(prev => (prev === effectiveStep ? prev : effectiveStep))
          setVanPendingPhoto(prev => {
            const next = (vanDevice as any).vanPendingPhoto || undefined
            return prev === next ? prev : next
          })
          setVanFinalPhoto(prev => {
            const next = (vanDevice as any).vanFinalPhoto || undefined
            return prev === next ? prev : next
          })

          // Fusionne le device van rafraichi dans la liste devices pour que
          // currentVanDevice (et donc vanProgressState.effectiveStep) reste a jour.
          setDevices(prev => {
            const idx = prev.findIndex(d => d.deviceId === vanDevice.deviceId)
            if (idx < 0) return prev
            const merged = { ...prev[idx], ...vanDevice }
            if (JSON.stringify(prev[idx]) === JSON.stringify(merged)) return prev
            const copy = prev.slice()
            copy[idx] = merged
            return copy
          })
        })
        .catch(() => {
          // Réseau indisponible: on garde l'état local.
        })

      // Sync ghostcam pour garder photoModeUnlocked (et donc le mode camera) frais.
      const ghostcamDevice = devicesRef.current.find(d => d.role === 'ghostcam')
      const ghostcamId = controlGhostcamDeviceId || ghostcamDevice?.deviceId
      if (ghostcamId) {
        fetch(ghostApiUrl(`/player/state?deviceId=${encodeURIComponent(ghostcamId)}&ts=${Date.now()}`), { cache: 'no-store' })
          .then(toJson<Device | undefined>)
          .then(cam => {
            if (!cam || !cam.deviceId) return
            setDevices(prev => {
              const idx = prev.findIndex(d => d.deviceId === cam.deviceId)
              if (idx < 0) return prev
              const merged = { ...prev[idx], ...cam }
              if (JSON.stringify(prev[idx]) === JSON.stringify(merged)) return prev
              const copy = prev.slice()
              copy[idx] = merged
              return copy
            })
          })
          .catch(() => {
            // ignore
          })
      }
    }

    syncVanState()
    const interval = window.setInterval(syncVanState, 1000)
    return () => window.clearInterval(interval)
  }, [activePanel, adminToolRole, controlVanDeviceId, controlGhostcamDeviceId, vanManualMode])

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
    spiritboxNextScheduledTimeRef.current = 0
    spiritboxHeaderDurationRef.current = 0

    socket.on('spiritbox:audio-chunk', (payload: {
      deviceId: string
      chunk: string
      mimeType: string
      hasPrependedHeader?: boolean
      codec?: 'pcm16'
      sampleRate?: number
      channels?: number
    }) => {
      const messageId = `${Date.now()}`
      const createdAt = new Date().toISOString()
      setLatestPlayerSpiritMessage({
        id: messageId,
        audioData: payload.chunk,
        mimeType: payload.mimeType,
        hasPrependedHeader: payload.hasPrependedHeader,
        codec: payload.codec,
        sampleRate: payload.sampleRate,
        channels: payload.channels,
        from: 'player',
        createdAt,
      })
    })

    return () => {
      socket.disconnect()
      spiritboxSocketRef.current = null
      spiritboxNextScheduledTimeRef.current = 0
      spiritboxHeaderDurationRef.current = 0
    }
  }, [activePanel, adminToolRole, controlSpiritboxDeviceId])

  // Sonde la fréquence courante de la SpiritBox côté joueur (pour savoir si on peut envoyer le son)
  useEffect(() => {
    const isRelevantPage =
      activePanel === 'admin' && (adminToolRole === 'spiritbox' || adminToolRole === 'van')
    if (!controlSpiritboxDeviceId || !isRelevantPage) {
      setSpiritboxFrequency(null)
      return
    }

    const poll = (): void => {
      fetch(ghostApiUrl(`/admin/device/${controlSpiritboxDeviceId}/spiritbox/frequency`))
        .then(r => r.json())
        .then((data: { state?: { frequency: number; locked: boolean } }) => {
          setSpiritboxFrequency(data.state ? { frequency: data.state.frequency, locked: data.state.locked } : null)
        })
        .catch(() => {
          // Erreur silencieuse
        })
    }

    poll()
    const interval = window.setInterval(poll, 500)
    return () => window.clearInterval(interval)
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

  const saveVanTexts = async (): Promise<void> => {
    const vanDevice = currentVanDevice
    if (!vanDevice) {
      setVanTextsSaveError('Aucun device van trouvé.')
      return
    }
    setVanTextsSaving(true)
    setVanTextsSaveError('')
    try {
      await fetch(ghostApiUrl(`/admin/device/${vanDevice.deviceId}/van`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vanTextConfig: JSON.stringify(vanTexts) }),
      }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`) })
    } catch (e) {
      setVanTextsSaveError((e as Error).message)
    } finally {
      setVanTextsSaving(false)
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

  const triggerGhostActionForSeconds = async (seconds: number): Promise<void> => {
    const duration = Math.max(1, Math.min(30, Number(seconds) || 1))
    const ghostUntil = new Date(Date.now() + duration * 1000).toISOString()
    await patchGhostcamControl({ ghostUntil })
  }

  const triggerOrbsActionForSeconds = async (seconds: number): Promise<void> => {
    const duration = Math.max(1, Math.min(30, Number(seconds) || 1))
    const orbUntil = new Date(Date.now() + duration * 1000).toISOString()
    await patchGhostorbsControl({ orbUntil })
  }

  const setQuickEmfFound = (found: boolean): void => {
    if (!controlDeviceId) {
      setError('Aucun device EMF disponible')
      return
    }

    const emfLevel = found ? 4 : 1
    setControlPowerOn(true)
    setControlEmfFound(found)
    setControlEmfLevel(emfLevel)
    void patchEmfControl({ powerOn: true, emfLevel })
  }

  const setQuickThermometerFound = (found: boolean): void => {
    if (!controlGhostorbsDeviceId) {
      setError('Aucun device Thermometre disponible')
      return
    }

    const temperature = found ? 3 : 16
    setControlThermometerPowerOn(true)
    setControlThermometerActive(found)
    setControlTemperature(temperature)
    void patchThermometerControl({ powerOn: true, temperature })
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

      if (message.codec === 'pcm16') {
        const sampleRate = Math.max(8000, Math.min(96000, message.sampleRate || 48000))
        const channelCount = Math.max(1, Math.min(2, message.channels || 1))
        const totalSamples = Math.floor(bytes.length / 2)
        const frameCount = Math.floor(totalSamples / channelCount)
        if (frameCount <= 0) {
          return
        }

        const pcmView = new DataView(bytes.buffer, bytes.byteOffset, frameCount * channelCount * 2)
        const pcmBuffer = ctx.createBuffer(channelCount, frameCount, sampleRate)

        for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
          const channelData = pcmBuffer.getChannelData(channelIndex)
          for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
            const sampleIndex = frameIndex * channelCount + channelIndex
            const sample = pcmView.getInt16(sampleIndex * 2, true)
            channelData[frameIndex] = sample / 32768
          }
        }

        const source = ctx.createBufferSource()
        source.buffer = pcmBuffer
        source.connect(ctx.destination)

        const leadTime = 0.14
        if (spiritboxNextScheduledTimeRef.current < ctx.currentTime - 0.25) {
          spiritboxNextScheduledTimeRef.current = ctx.currentTime + leadTime
        }

        const scheduleAt = Math.max(ctx.currentTime + leadTime, spiritboxNextScheduledTimeRef.current)
        source.start(scheduleAt)
        spiritboxNextScheduledTimeRef.current = scheduleAt + pcmBuffer.duration
        return
      }

      void ctx.decodeAudioData(bytes.buffer.slice(0)).then(decodedBuffer => {
        if (!message.hasPrependedHeader && spiritboxHeaderDurationRef.current === 0) {
          spiritboxHeaderDurationRef.current = decodedBuffer.duration
        }

        let playableBuffer = decodedBuffer
        if (message.hasPrependedHeader && spiritboxHeaderDurationRef.current > 0.02) {
          const trimSeconds = Math.min(
            spiritboxHeaderDurationRef.current,
            Math.max(0, decodedBuffer.duration - 0.02)
          )

          if (trimSeconds > 0) {
            const trimSampleIndex = Math.floor(trimSeconds * decodedBuffer.sampleRate)
            const trimmedSampleLength = decodedBuffer.length - trimSampleIndex

            if (trimmedSampleLength > 0) {
              const trimmedBuffer = ctx.createBuffer(
                decodedBuffer.numberOfChannels,
                trimmedSampleLength,
                decodedBuffer.sampleRate
              )

              for (let channelIndex = 0; channelIndex < decodedBuffer.numberOfChannels; channelIndex++) {
                const sourceChannel = decodedBuffer.getChannelData(channelIndex)
                const targetChannel = trimmedBuffer.getChannelData(channelIndex)
                targetChannel.set(sourceChannel.subarray(trimSampleIndex))
              }

              playableBuffer = trimmedBuffer
            }
          }
        }

        if (!playableBuffer || playableBuffer.duration <= 0.01) {
          return
        }

        const source = ctx.createBufferSource()
        source.buffer = playableBuffer
        source.connect(ctx.destination)

        // Scheduling précis : enchaîner les chunks sans gap ni overlap
        if (spiritboxNextScheduledTimeRef.current < ctx.currentTime - 0.25) {
          spiritboxNextScheduledTimeRef.current = ctx.currentTime + 0.08
        }

        const scheduleAt = Math.max(ctx.currentTime + 0.08, spiritboxNextScheduledTimeRef.current)
        source.start(scheduleAt)
        spiritboxNextScheduledTimeRef.current = scheduleAt + playableBuffer.duration
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
      setError('Impossible de capturer le micro MJ')
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

  const sendVanMessage = (): void => {
    const title = vanDraftMessage.title.trim()
    const text = vanDraftMessage.text.trim()
    const imageUrl = vanDraftMessage.imageUrl.trim()
    const audioUrl = vanDraftMessage.audioUrl.trim()

    if (!title) {
      setError('Le titre du message est obligatoire')
      return
    }

    const newMsg: VanDashboardMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      kind: audioUrl ? 'audio' : imageUrl ? 'text_image' : 'text',
      title,
      text: text || undefined,
      imageUrl: imageUrl || undefined,
      audioUrl: audioUrl || undefined,
      sentAt: new Date().toISOString()
    }

    const next = [...vanSentMessages, newMsg]
    setVanSentMessages(next)
    setVanDraftMessage(createEmptyVanMessageDraft())
    setError('')

    const vanId = controlVanDeviceId || devices.find(d => d.role === 'van')?.deviceId
    if (!vanId) {
      setError('Aucun device van configuré')
      return
    }

    fetch(ghostApiUrl(`/admin/device/${vanId}/van`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vanSentMessages: JSON.stringify(next) })
    }).catch(() => {})
  }

  const clearVanSentMessages = (): void => {
    setVanSentMessages([])

    const vanId = controlVanDeviceId || devices.find(d => d.role === 'van')?.deviceId
    if (!vanId) return

    fetch(ghostApiUrl(`/admin/device/${vanId}/van`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vanSentMessages: JSON.stringify([]) })
    }).catch(() => {})
  }

  const resetVanSentMessagesForNewGame = async (): Promise<void> => {
    const vanId = controlVanDeviceId || devices.find(device => device.role === 'van')?.deviceId
    if (!vanId) {
      return
    }

    setVanSentMessages([])
    const resetObjectives = DEFAULT_VAN_OBJECTIVES.map(item => ({ ...item }))
    setVanObjectives(resetObjectives)
    setVanStep(0)
    setVanPendingPhoto(undefined)
    setVanFinalPhoto(undefined)

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
          vanStep: 0,
          missionObjectives: JSON.stringify(resetObjectives),
          vanPendingPhoto: null,
          vanFinalPhoto: null,
          vanMessageTemplates: null,
          vanSentMessages: JSON.stringify([])
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

  const handleVanGhostActivityChange = (value: number): void => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)))
    setVanManualMode(true)
    setVanGhostActivity(clamped)
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

      const deviceTemplates: Array<{
        deviceId: string
        role: DeviceRole
        powerOn: boolean
        emfLevel?: number
        temperature?: number
      }> = [
        { deviceId: 'emf', role: 'emf', powerOn: true, emfLevel: 0 },
        { deviceId: 'spiritbox', role: 'spiritbox', powerOn: true },
        { deviceId: 'ghostcam', role: 'ghostcam', powerOn: true },
        { deviceId: 'ghostorbs', role: 'ghostorbs', powerOn: true, temperature: 20 },
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
          vanStep: 0,
          ghostActivityLevel: 0,
          playerSanity: JSON.stringify(seededPlayers),
          soundLevels: JSON.stringify(seededSoundLevels),
          motionDetections: JSON.stringify(seededMotionDetections),
          roomList: JSON.stringify(seededRooms),
          motionSensorRooms: JSON.stringify(['salon', 'cuisine', 'chambre1', 'chambre2', 'salle de bain', 'toilettes']),
          recentMotionAlert: '',
          missionObjectives: JSON.stringify(DEFAULT_VAN_OBJECTIVES),
          vanPendingPhoto: null,
          vanFinalPhoto: null,
          backgroundMusic: JSON.stringify(createDefaultVanBackgroundMusic()),
          soundboard: JSON.stringify([]),
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

    const updated = ensureVanObjectives(vanObjectives.map(obj =>
      obj.objective === objectiveText ? { ...obj, completed: !obj.completed } : obj
    ))
    const nextStep = Math.max(1, Math.min(7, deriveVanObjectiveStep(updated) + 1))
    const { vanPatch, nextPendingPhoto, nextFinalPhoto, lockGhostcamPhotoMode } = buildVanStateForManualStep(nextStep)
    vanPatch.missionObjectives = JSON.stringify(updated)

    setVanObjectives(updated)
    setVanStep(nextStep)
    setVanPendingPhoto(nextPendingPhoto)
    setVanFinalPhoto(nextFinalPhoto)

    try {
      await fetch(ghostApiUrl(`/admin/device/${encodeURIComponent(controlVanDeviceId)}/van`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vanPatch)
      }).then(toJson<Device>)

      const ghostcamId = controlGhostcamDeviceId || devices.find(device => device.role === 'ghostcam')?.deviceId
      if (ghostcamId && lockGhostcamPhotoMode) {
        await fetch(ghostApiUrl(`/admin/device/${encodeURIComponent(ghostcamId)}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoModeUnlocked: false })
        }).then(toJson<Device>)
      }
    } catch (e) {
      setError((e as Error).message)
      setVanObjectives(vanObjectives)
      setVanStep(vanStep)
      setVanPendingPhoto(vanPendingPhoto)
      setVanFinalPhoto(vanFinalPhoto)
    }
  }

  const DEFAULT_VAN_OBJECTIVES_LIST: Array<{ objective: string; completed: boolean }> =
    DEFAULT_VAN_OBJECTIVES.map(item => ({ ...item }))

  const buildObjectivesForStep = (step: number): Array<{ objective: string; completed: boolean }> => {
    const next = DEFAULT_VAN_OBJECTIVES_LIST.map(o => ({ ...o }))
    // `step` est l'etape affichee (1..7), donc on complete `step - 1` objectifs.
    const count = Math.max(0, Math.min(next.length, step - 1))
    for (let i = 0; i < count; i++) next[i].completed = true
    return next
  }

  const buildVanStateForManualStep = (step: number): {
    objectives: Array<{ objective: string; completed: boolean }>
    vanPatch: Record<string, unknown>
    nextPendingPhoto?: string
    nextFinalPhoto?: string
    lockGhostcamPhotoMode: boolean
  } => {
    const objectives = buildObjectivesForStep(step)
    const vanPatch: Record<string, unknown> = {
      vanStep: step,
      missionObjectives: JSON.stringify(objectives),
    }

    let nextPendingPhoto = vanPendingPhoto
    let nextFinalPhoto = vanFinalPhoto

    // Le mode auto+validation MJ commence a l'etape 6.
    // Toute navigation manuelle doit remettre un etat coherent.
    if (step <= 5) {
      vanPatch.vanPendingPhoto = null
      vanPatch.vanFinalPhoto = null
      vanPatch.vanFearMessageAt = null
      nextPendingPhoto = undefined
      nextFinalPhoto = undefined
    } else if (step === 6) {
      vanPatch.vanPendingPhoto = null
      vanPatch.vanFinalPhoto = null
      vanPatch.vanFearMessageAt = null
      nextPendingPhoto = undefined
      nextFinalPhoto = undefined
    } else {
      vanPatch.vanPendingPhoto = null
      nextPendingPhoto = undefined
    }

    return {
      objectives,
      vanPatch,
      nextPendingPhoto,
      nextFinalPhoto,
      lockGhostcamPhotoMode: step >= 6,
    }
  }

  const setVanStepRemote = (newStep: number): void => {
    if (!controlVanDeviceId) return
    const clamped = Math.max(1, Math.min(7, newStep))
    const {
      objectives,
      vanPatch,
      nextPendingPhoto,
      nextFinalPhoto,
      lockGhostcamPhotoMode,
    } = buildVanStateForManualStep(clamped)

    setVanStep(clamped)
    setVanObjectives(objectives)
    setVanPendingPhoto(nextPendingPhoto)
    setVanFinalPhoto(nextFinalPhoto)

    void fetch(ghostApiUrl(`/admin/device/${encodeURIComponent(controlVanDeviceId)}/van`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vanPatch)
    }).catch(() => { /* offline */ })

    const ghostcamId = controlGhostcamDeviceId || devices.find(device => device.role === 'ghostcam')?.deviceId
    if (ghostcamId && lockGhostcamPhotoMode) {
      void fetch(ghostApiUrl(`/admin/device/${encodeURIComponent(ghostcamId)}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoModeUnlocked: false })
      }).catch(() => { /* offline */ })
    }
  }

  const resetVan = (): void => {
    if (!controlVanDeviceId) return
    if (!window.confirm('Réinitialiser le scénario du van (étape 1) ?')) return
    const ghostcamId = controlGhostcamDeviceId || devices.find(device => device.role === 'ghostcam')?.deviceId
    const resetGhostActivity = 25
    const objs = buildObjectivesForStep(1)
    setVanManualMode(true)
    setVanGhostActivity(resetGhostActivity)
    setVanStep(1)
    setVanObjectives(objs)
    setVanPendingPhoto(undefined)
    setVanPendingPhotoClean(undefined)
    setVanFinalPhoto(undefined)
    setVanSentMessages([])
    void fetch(ghostApiUrl(`/admin/device/${encodeURIComponent(controlVanDeviceId)}/van`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vanStep: 1,
        ghostActivityLevel: resetGhostActivity,
        missionObjectives: JSON.stringify(objs),
        vanPendingPhoto: null,
        vanFinalPhoto: null,
        vanFearMessageAt: null,
        vanSentMessages: JSON.stringify([])
      })
    }).catch(() => { /* offline */ })

    if (ghostcamId) {
      void fetch(ghostApiUrl(`/admin/device/${encodeURIComponent(ghostcamId)}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoModeUnlocked: false })
      }).catch(() => { /* offline */ })
    }
  }

  const validateVanPhoto = (): void => {
    if (!controlVanDeviceId || !vanPendingPhoto) return
    const photo = vanPendingPhoto
    const photoClean = vanPendingPhotoClean
    const objs = buildObjectivesForStep(7)
    setVanStep(7)
    setVanObjectives(objs)
    setVanPendingPhoto(undefined)
    setVanPendingPhotoClean(undefined)
    setVanFinalPhoto(photo)

    // Enregistrer les deux versions sur le PC du MJ.
    const stamp = Date.now()
    const triggerDownload = (dataUrl: string, suffix: string): void => {
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `ghost-photo-${stamp}-${suffix}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    triggerDownload(photo, 'spectre')
    if (photoClean) {
      triggerDownload(photoClean, 'clean')
    }

    void fetch(ghostApiUrl(`/admin/device/${encodeURIComponent(controlVanDeviceId)}/van`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vanStep: 7,
        missionObjectives: JSON.stringify(objs),
        vanFinalPhoto: photo,
        vanPendingPhoto: null
      })
    }).catch(() => { /* offline */ })
  }

  const refuseVanPhoto = (): void => {
    if (!controlVanDeviceId) return
    setVanPendingPhoto(undefined)
    setVanPendingPhotoClean(undefined)
    setVanFinalPhoto(undefined)
    void fetch(ghostApiUrl(`/admin/device/${encodeURIComponent(controlVanDeviceId)}/van`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vanPendingPhoto: null,
        vanFearMessageAt: new Date().toISOString()
      })
    }).catch(() => { /* offline */ })
  }

  const takeGhostcamPhoto = (): void => {
    const frame = controlGhostcamDeviceId ? cameraSources[controlGhostcamDeviceId] : undefined
    if (!frame) return
    const frameClean = controlGhostcamDeviceId ? cameraSourcesClean[controlGhostcamDeviceId] : undefined

    // Étape 6 du van : on envoie la photo en validation au MJ.
    if (vanStep === 6 && controlVanDeviceId) {
      setVanPendingPhoto(frame)
      setVanPendingPhotoClean(frameClean)
      void fetch(ghostApiUrl(`/admin/device/${encodeURIComponent(controlVanDeviceId)}/van`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vanPendingPhoto: frame })
      }).catch(() => { /* offline */ })
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
          <GhostCardsActions>
            <GhostCardsLink href="/ghost-cards" target="_blank" rel="noreferrer">
              Ouvrir les cartes fantômes
            </GhostCardsLink>
            <GhostCardsHint>/ghost-cards</GhostCardsHint>
          </GhostCardsActions>
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
              $active={activePanel === 'texts'}
              onClick={() => setActivePanel('texts')}
              type="button"
            >
              <h3>Edition texte</h3>
              <span>Personnaliser les textes du van</span>
            </HomeCard>
            <HomeCard
              $active={activePanel === 'van-admin-mobile'}
              onClick={() => setActivePanel('van-admin-mobile')}
              type="button"
            >
              <h3>Van Admin Mobile</h3>
              <span>Commandes d'urgence mobile</span>
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
                        <small>Étape flow Van: {vanProgressState.effectiveStep}/7</small>
                        <small>Étape objectifs validés: {vanProgressState.objectiveStep}/7</small>
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

        {activePanel === 'texts' && (
          <Panel>
            <VanTextsEditor
              value={vanTexts}
              onChange={setVanTexts}
              onSave={() => void saveVanTexts()}
              isSaving={vanTextsSaving}
              saveError={vanTextsSaveError}
            />
          </Panel>
        )}

        {activePanel === 'van-admin-mobile' && (
          <Panel>
            <PanelHeader>
              <h2>Van Admin Mobile</h2>
            </PanelHeader>

            <MobileQuickMeta>
              <small>EMF: {controlDeviceId || 'indisponible'}</small>
              <small>Thermo: {controlGhostorbsDeviceId || 'indisponible'}</small>
              <small>SpiritBox: {controlSpiritboxDeviceId || 'indisponible'}</small>
              <small>GhostCam: {controlGhostcamDeviceId || 'indisponible'}</small>
            </MobileQuickMeta>

            <MobileQuickGrid>
              <MobileQuickSection>
                <h3>Indices</h3>
                <MobileTwoCols>
                  <MobileQuickAction
                    type="button"
                    $active={controlEmfFound}
                    onClick={() => setQuickEmfFound(!controlEmfFound)}
                  >
                    EMF Trouve: {controlEmfFound ? 'OUI' : 'NON'}
                  </MobileQuickAction>
                  <MobileQuickAction
                    type="button"
                    $active={controlThermometerActive}
                    onClick={() => setQuickThermometerFound(!controlThermometerActive)}
                  >
                    Thermo Trouve: {controlThermometerActive ? 'OUI' : 'NON'}
                  </MobileQuickAction>
                </MobileTwoCols>
              </MobileQuickSection>

              <MobileQuickSection>
                <h3>SpiritBox</h3>
                <MobileFiveCols>
                  {SPIRITBOX_PRESET_SOUNDS.map(preset => (
                    <MobileQuickButton
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        void sendSpiritboxPresetSound(preset)
                      }}
                    >
                      {preset.label.replace('.mp3', '')}
                    </MobileQuickButton>
                  ))}
                </MobileFiveCols>
              </MobileQuickSection>

              <MobileQuickSection>
                <h3>Apparitions</h3>
                <MobileTwoCols>
                  <MobileQuickButton
                    type="button"
                    onClick={() => {
                      void triggerGhostActionForSeconds(5)
                    }}
                  >
                    Fantome 5s
                  </MobileQuickButton>
                  <MobileQuickButton
                    type="button"
                    onClick={() => {
                      void triggerOrbsActionForSeconds(5)
                    }}
                  >
                    Orbes 5s
                  </MobileQuickButton>
                </MobileTwoCols>
              </MobileQuickSection>

              <MobileQuickSection>
                <h3>GhostCam</h3>
                <MobileQuickButton type="button" onClick={takeGhostcamPhoto}>
                  Prendre une photo
                </MobileQuickButton>
              </MobileQuickSection>
            </MobileQuickGrid>

            {error && <ErrorBox>{error}</ErrorBox>}
          </Panel>
        )}

        {activePanel === 'admin' && (
          <>
            {(adminToolRole === null || adminToolRole === 'emf') && (
              <EmfAdminTool
                devices={devices.map(device => ({ deviceId: device.deviceId, role: device.role }))}
                controlDeviceId={controlDeviceId}
                controlPowerOn={controlPowerOn}
                controlFound={controlEmfFound}
                cameraFrame={controlDeviceId ? cameraSources[controlDeviceId] : undefined}
                onControlDeviceChange={setControlDeviceId}
                onControlPowerOnChange={checked => {
                  setControlPowerOn(checked)
                  const emfLevel = checked ? (controlEmfFound ? 4 : 1) : 0
                  setControlEmfLevel(emfLevel)
                  void patchEmfControl({ powerOn: checked, emfLevel })
                }}
                onControlFoundChange={checked => {
                  setControlEmfFound(checked)
                  if (!controlPowerOn) {
                    return
                  }
                  const emfLevel = checked ? 4 : 1
                  setControlEmfLevel(emfLevel)
                  void patchEmfControl({ emfLevel })
                }}
              />
            )}

            {adminToolRole === 'spiritbox' && (
              <SpiritBoxAdminTool
                controlDeviceId={controlSpiritboxDeviceId}
                latestPlayerMessageAt={latestPlayerSpiritMessage?.createdAt}
                presetSounds={SPIRITBOX_PRESET_SOUNDS}
                frequency={spiritboxFrequency?.frequency ?? null}
                signalLocked={spiritboxFrequency?.locked ?? false}
                onSendPresetSound={preset => {
                  void sendSpiritboxPresetSound(preset)
                }}
              />
            )}

            {adminToolRole === 'ghostcam' && (
              <GhostCamAdminTool
                cameraFrame={controlGhostcamDeviceId ? cameraSources[controlGhostcamDeviceId] : undefined}
                vanStep={vanProgressState.effectiveStep}
                cameraModeLabel={formatVanCameraMode(vanProgressState.cameraMode)}
                vanPendingPhoto={vanPendingPhoto}
                onValidatePhoto={validateVanPhoto}
                onRefusePhoto={refuseVanPhoto}
                onPhoto={takeGhostcamPhoto}
                onRelock={() => {
                  if (!controlGhostcamDeviceId) return
                  void fetch(`/apil7r/admin/device/${encodeURIComponent(controlGhostcamDeviceId)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ photoModeUnlocked: false })
                  })
                }}
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
                controlPowerOn={controlThermometerPowerOn}
                controlActive={controlThermometerActive}
                cameraFrame={controlGhostorbsDeviceId ? cameraSources[controlGhostorbsDeviceId] : undefined}
                onControlDeviceChange={setControlGhostorbsDeviceId}
                onControlPowerOnChange={checked => {
                  setControlThermometerPowerOn(checked)
                  const temperature = checked ? (controlThermometerActive ? 3 : 16) : 0
                  setControlTemperature(temperature)
                  void patchThermometerControl({ powerOn: checked, temperature })
                }}
                onControlActiveChange={checked => {
                  setControlThermometerActive(checked)
                  if (!controlThermometerPowerOn) {
                    return
                  }
                  const temperature = checked ? 3 : 16
                  setControlTemperature(temperature)
                  void patchThermometerControl({ temperature })
                }}
              />
            )}

            {adminToolRole === 'van' && (
              <>
                <VanAdminTool
                  vanGhostActivity={vanGhostActivity}
                  onVanGhostActivityChange={handleVanGhostActivityChange}
                  vanObjectives={vanObjectives}
                  vanStep={vanProgressState.effectiveStep}
                  objectiveStep={Math.max(1, Math.min(7, vanProgressState.objectiveStep + 1))}
                  cameraModeLabel={formatVanCameraMode(vanProgressState.cameraMode)}
                  onStepChange={setVanStepRemote}
                  onResetVan={resetVan}
                  onOpenCameraAdmin={() => {
                    const ghostcamId =
                      controlGhostcamDeviceId || devices.find(d => d.role === 'ghostcam')?.deviceId
                    if (!ghostcamId) return
                    openAdminToolPage('ghostcam', ghostcamId)
                  }}
                />

                <VanHubGrid>
                  <VanHubCard>
                    <VanHubTitle>Caméras EMF & Thermomètre</VanHubTitle>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <VanHubPortrait>
                          <VanHubPortraitLabel>EMF — {controlDeviceId || 'aucun'}</VanHubPortraitLabel>
                          {controlDeviceId && (cameraSourcesClean[controlDeviceId] ?? cameraSources[controlDeviceId]) ? (
                            <img
                              src={cameraSourcesClean[controlDeviceId] ?? cameraSources[controlDeviceId]}
                              alt="emf-cam"
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          ) : (
                            <VanHubPortraitEmpty>En attente…</VanHubPortraitEmpty>
                          )}
                        </VanHubPortrait>
                        <VanHubToggleRow>
                          <VanHubToggle
                            type="button"
                            data-on={controlPowerOn}
                            onClick={() => {
                              const checked = !controlPowerOn
                              setControlPowerOn(checked)
                              const emfLevel = checked ? (controlEmfFound ? 4 : 1) : 0
                              setControlEmfLevel(emfLevel)
                              void patchEmfControl({ powerOn: checked, emfLevel })
                            }}
                          >
                            {controlPowerOn ? 'ON' : 'OFF'}
                          </VanHubToggle>
                          <VanHubToggle
                            type="button"
                            data-on={controlEmfFound}
                            disabled={!controlPowerOn}
                            onClick={() => {
                              const checked = !controlEmfFound
                              setControlEmfFound(checked)
                              if (!controlPowerOn) return
                              const emfLevel = checked ? 4 : 1
                              setControlEmfLevel(emfLevel)
                              void patchEmfControl({ emfLevel })
                            }}
                          >
                            {controlEmfFound ? 'Trouvé' : 'Pas trouvé'}
                          </VanHubToggle>
                        </VanHubToggleRow>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <VanHubPortrait>
                          <VanHubPortraitLabel>Thermo — {controlGhostorbsDeviceId || 'aucun'}</VanHubPortraitLabel>
                          {controlGhostorbsDeviceId && (cameraSourcesClean[controlGhostorbsDeviceId] ?? cameraSources[controlGhostorbsDeviceId]) ? (
                            <img
                              src={cameraSourcesClean[controlGhostorbsDeviceId] ?? cameraSources[controlGhostorbsDeviceId]}
                              alt="thermo-cam"
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          ) : (
                            <VanHubPortraitEmpty>En attente…</VanHubPortraitEmpty>
                          )}
                        </VanHubPortrait>
                        <VanHubToggleRow>
                          <VanHubToggle
                            type="button"
                            data-on={controlThermometerPowerOn}
                            onClick={() => {
                              const checked = !controlThermometerPowerOn
                              setControlThermometerPowerOn(checked)
                              const temperature = checked ? (controlThermometerActive ? 3 : 16) : 0
                              setControlTemperature(temperature)
                              void patchThermometerControl({ powerOn: checked, temperature })
                            }}
                          >
                            {controlThermometerPowerOn ? 'ON' : 'OFF'}
                          </VanHubToggle>
                          <VanHubToggle
                            type="button"
                            data-on={controlThermometerActive}
                            disabled={!controlThermometerPowerOn}
                            onClick={() => {
                              const checked = !controlThermometerActive
                              setControlThermometerActive(checked)
                              if (!controlThermometerPowerOn) return
                              const temperature = checked ? 3 : 16
                              setControlTemperature(temperature)
                              void patchThermometerControl({ temperature })
                            }}
                          >
                            {controlThermometerActive ? 'Trouvé' : 'Pas trouvé'}
                          </VanHubToggle>
                        </VanHubToggleRow>
                      </div>
                    </div>
                  </VanHubCard>

                  <VanHubCard>
                    <VanHubTitle>SpiritBox</VanHubTitle>
                    <SpiritBoxAdminTool
                      controlDeviceId={controlSpiritboxDeviceId}
                      latestPlayerMessageAt={latestPlayerSpiritMessage?.createdAt}
                      presetSounds={SPIRITBOX_PRESET_SOUNDS}
                      frequency={spiritboxFrequency?.frequency ?? null}
                      signalLocked={spiritboxFrequency?.locked ?? false}
                      onSendPresetSound={preset => {
                        void sendSpiritboxPresetSound(preset)
                      }}
                    />
                  </VanHubCard>

                  <VanHubCard style={{ gridColumn: '1 / -1' }}>
                    <VanHubTitle>GhostCam</VanHubTitle>
                    <GhostCamAdminTool
                      cameraFrame={controlGhostcamDeviceId ? cameraSources[controlGhostcamDeviceId] : undefined}
                      vanStep={vanProgressState.effectiveStep}
                      cameraModeLabel={formatVanCameraMode(vanProgressState.cameraMode)}
                      vanPendingPhoto={vanPendingPhoto}
                      onValidatePhoto={validateVanPhoto}
                      onRefusePhoto={refuseVanPhoto}
                      onPhoto={takeGhostcamPhoto}
                      onRelock={() => {
                        if (!controlGhostcamDeviceId) return
                        void fetch(`/apil7r/admin/device/${encodeURIComponent(controlGhostcamDeviceId)}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ photoModeUnlocked: false })
                        })
                      }}
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
                  </VanHubCard>

                  <VanHubCard style={{ gridColumn: '1 / -1' }}>
                    <VanHubTitle>Messagerie (texte)</VanHubTitle>
                    <MessagerieAdminTool
                      sentMessages={vanSentMessages}
                      draft={vanDraftMessage}
                      onDraftChange={(patch) => setVanDraftMessage((prev) => ({ ...prev, ...patch }))}
                      onSend={sendVanMessage}
                      onClearSent={clearVanSentMessages}
                    />
                  </VanHubCard>
                </VanHubGrid>
              </>
            )}

            {adminToolRole === 'messagerie' && (
              <MessagerieAdminTool
                sentMessages={vanSentMessages}
                draft={vanDraftMessage}
                onDraftChange={(patch) => setVanDraftMessage((prev) => ({ ...prev, ...patch }))}
                onSend={sendVanMessage}
                onClearSent={clearVanSentMessages}
              />
            )}
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
  width: min(100%, 1400px);
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

const VanHubGrid = styled.div`
  margin-top: 1.2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
`

const VanHubCard = styled.div`
  border: 1px solid #2f3d50;
  border-radius: 12px;
  padding: 0.9rem;
  background: #101a25;
`

const VanHubTitle = styled.h3`
  margin: 0 0 0.7rem 0;
  font-size: 1rem;
  color: #cfe0f3;
  letter-spacing: 0.02em;
`

const VanHubPortrait = styled.div`
  position: relative;
  width: 160px;
  aspect-ratio: 3 / 4;
  background: #000;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #29384a;
`

const VanHubPortraitLabel = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 0.25rem 0.4rem;
  font-size: 0.72rem;
  color: #cfe0f3;
  background: rgba(0, 0, 0, 0.55);
  z-index: 1;
`

const VanHubPortraitEmpty = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8fa6c4;
  font-size: 0.85rem;
`

const VanHubToggleRow = styled.div`
  display: flex;
  gap: 0.4rem;
  width: 160px;
`

const VanHubToggle = styled.button`
  flex: 1 1 0;
  padding: 0.4rem 0.3rem;
  border-radius: 8px;
  border: 1px solid #2f3d50;
  background: ${({ 'data-on': on }: { 'data-on'?: boolean }) => (on ? '#133021' : '#1b2330')};
  color: ${({ 'data-on': on }: { 'data-on'?: boolean }) => (on ? '#7CFFB2' : '#9fb1c9')};
  font-weight: 700;
  font-size: 0.78rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const GhostCardsActions = styled.div`
  margin-top: 0.65rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
`

const GhostCardsLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #2f8d5d;
  background: #133021;
  color: #d9ffe9;
  font-weight: 700;
  text-decoration: none;

  &:hover {
    filter: brightness(1.12);
  }
`

const GhostCardsHint = styled.small`
  color: #9ac0a9;
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
  align-items: start;
`

const SectionCard = styled.section`
  border: 1px solid ${({ theme }) => theme.panelBorder};
  border-radius: 10px;
  padding: 0.8rem;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;

  h3 {
    margin: 0;
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
  min-width: 0;

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
  gap: 0.75rem;
  min-width: 0;

  strong,
  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
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
  min-width: 0;
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
  flex-wrap: wrap;
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
  flex-wrap: wrap;

  @media (max-width: 760px) {
    flex-direction: column;
    align-items: stretch;
  }
`

const ListGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
`

const MeterRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr auto;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;

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
  min-width: 0;

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
  min-width: 0;
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
  min-width: 0;
`

const ObjectiveCheckboxItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  min-width: 0;

  input[type='checkbox'] {
    cursor: pointer;
    width: 18px;
    height: 18px;
    margin-top: 0.2rem;
    flex-shrink: 0;
  }

  label {
    cursor: pointer;
    flex: 1;
    font-size: 0.9rem;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
`

const MobileQuickMeta = styled.div`
  margin-top: 0.55rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.35rem;

  small {
    color: #b7c7dd;
  }
`

const MobileQuickGrid = styled.div`
  margin-top: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`

const MobileQuickSection = styled.section`
  border: 1px solid ${({ theme }) => theme.panelBorder};
  border-radius: 10px;
  padding: 0.7rem;
  background: rgba(16, 23, 33, 0.75);

  h3 {
    margin: 0 0 0.55rem 0;
    font-size: 0.95rem;
  }
`

const MobileTwoCols = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const MobileFiveCols = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.45rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const MobileQuickButton = styled.button`
  border: 1px solid ${({ theme }) => theme.panelBorder};
  background: #162030;
  color: ${({ theme }) => theme.color};
  border-radius: 10px;
  padding: 0.85rem 0.55rem;
  cursor: pointer;
  font-weight: 700;
`

const MobileQuickAction = styled(MobileQuickButton)<{ $active: boolean }>`
  border-color: ${({ theme, $active }) => ($active ? theme.accent : theme.panelBorder)};
  background: ${({ theme, $active }) => ($active ? theme.accentSoft : '#162030')};
`
