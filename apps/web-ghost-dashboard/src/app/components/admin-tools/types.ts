export type DeviceRole = 'emf' | 'spiritbox' | 'ghostcam' | 'thermometer' | 'ghostorbs' | 'van' | 'messagerie'
import type { VanObjective, VanBackgroundMusic, VanSoundCue, VanMessage } from 'ghost/frontend'
export type { VanObjective, VanBackgroundMusic, VanSoundCue }
export type VanDashboardMessage = VanMessage

export type Device = {
  deviceId: string
  role: DeviceRole
}

export type EmfAdminToolProps = {
  devices: Device[]
  controlDeviceId: string
  controlEmfLevel: number
  controlPowerOn: boolean
  cameraFrame?: string
  onControlDeviceChange: (deviceId: string) => void
  onControlEmfLevelChange: (value: number) => void
  onControlPowerOnChange: (checked: boolean) => void
}

export type ToolPlaceholderProps = {
  toolLabel: string
}

export type SpiritPresetSound = {
  id: string
  label: string
  audioUrl: string
}

export type SpiritBoxAdminToolProps = {
  controlDeviceId: string
  audioEnabled: boolean
  latestPlayerMessageAt?: string
  latestPlayerAudioData?: string
  latestPlayerMimeType?: string
  presetSounds: SpiritPresetSound[]
  onEnableAudio: () => void
  onPlayLatest: () => void
  onSendPresetSound: (preset: SpiritPresetSound) => void
}

export type GhostCamAdminToolProps = {
  cameraFrame?: string
  onPhoto: () => void
  onRelock: () => void
  cameraModeLabel?: string
  ghostcamDeviceId: string
  ghostcamDeviceOptions: string[]
  ghostDurationSec: number
  onGhostcamDeviceChange: (deviceId: string) => void
  onGhostDurationChange: (value: number) => void
  onTriggerGhost: () => void
  ghostorbsDeviceId: string
  ghostorbsDeviceOptions: string[]
  orbDurationSec: number
  onGhostorbsDeviceChange: (deviceId: string) => void
  onOrbDurationChange: (value: number) => void
  onTriggerOrbs: () => void
  vanStep?: number
  vanPendingPhoto?: string
  onValidatePhoto?: () => void
  onRefusePhoto?: () => void
}

export type ThermometerAdminToolProps = {
  devices: Device[]
  controlDeviceId: string
  controlTemperature: number
  controlPowerOn: boolean
  cameraFrame?: string
  onControlDeviceChange: (deviceId: string) => void
  onControlTemperatureChange: (value: number) => void
  onControlPowerOnChange: (checked: boolean) => void
}

export type VanAdminToolProps = {
  vanGhostActivity: number
  onVanGhostActivityChange: (value: number) => void
  vanObjectives: VanObjective[]
  vanStep: number
  objectiveStep: number
  cameraModeLabel: string
  onStepChange: (step: number) => void
  onResetVan: () => void
  onOpenCameraAdmin?: () => void
}

export type VanMessageDraft = {
  title: string
  text: string
  imageUrl: string
  audioUrl: string
}

export type MessagerieAdminToolProps = {
  sentMessages: VanDashboardMessage[]
  draft: VanMessageDraft
  onDraftChange: (patch: Partial<VanMessageDraft>) => void
  onSend: () => void
  onClearSent: () => void
}
