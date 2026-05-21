export type DeviceRole = 'emf' | 'spiritbox' | 'ghostcam' | 'thermometer' | 'ghostorbs' | 'van' | 'messagerie'

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

export type VanObjective = { objective: string; completed: boolean }

export type VanAdminToolProps = {
  vanGhostActivity: number
  onVanGhostActivityChange: (value: number) => void
  vanObjectives: VanObjective[]
  onToggleObjective: (objective: string) => void
}

export type VanDashboardMessage = {
  id: string
  kind: 'audio' | 'text' | 'text_image'
  title: string
  text?: string
  audioUrl?: string
  imageUrl?: string
  sentAt?: string
}

export type VanMessageDraft = {
  kind: 'audio' | 'text' | 'text_image'
  title: string
  text: string
  audioUrl: string
  imageUrl: string
}

export type MessagerieAdminToolProps = {
  templates: VanDashboardMessage[]
  sentMessages: VanDashboardMessage[]
  draft: VanMessageDraft
  onDraftChange: (patch: Partial<VanMessageDraft>) => void
  onAddTemplate: () => void
  onUpdateTemplate: (id: string, patch: Partial<VanDashboardMessage>) => void
  onRemoveTemplate: (id: string) => void
  onSendTemplate: (id: string) => void
  onClearSent: () => void
}
