/**
 * Types d'outils disponibles dans l'escape Ghost
 * Un seul outil par type, directement accessible
 */

export enum ToolType {
  EMF = 'emf',
  SPIRITBOX = 'spiritbox',
  GHOSTCAM = 'ghostcam',
  GHOSTORBS = 'ghostorbs',
  THERMOMETER = 'thermometer',
  MOTION_SENSOR = 'motion_sensor',
  SOUND_DETECTOR = 'sound_detector',
  VAN = 'van'
}

export const TOOL_LABELS: Record<ToolType, string> = {
  [ToolType.EMF]: 'EMF Meter',
  [ToolType.SPIRITBOX]: 'Spirit Box',
  [ToolType.GHOSTCAM]: 'Ghost Cam',
  [ToolType.GHOSTORBS]: 'Ghost Orbs',
  [ToolType.THERMOMETER]: 'Thermomètre',
  [ToolType.MOTION_SENSOR]: 'Détecteur de mouvement',
  [ToolType.SOUND_DETECTOR]: 'Détecteur sonore',
  [ToolType.VAN]: 'Van'
}

export interface Tool {
  type: ToolType
  label: string
  powerOn: boolean
  updatedAt: string
}

/**
 * État actuel d'une partie
 */
export interface GameState {
  gameId: string
  isInitialized: boolean
  isRunning: boolean
  startedAt?: string
  initialSpectralActivity: number // 0-100
  accelerationRate: number // augmente l'activité tous les X secondes
  currentSpectralActivity: number // 0-100
  currentScenarioStep: number
}

/**
 * Paramètres de configuration avant de démarrer
 */
export interface GameConfig {
  initialSpectralActivity: number // 0-100
  accelerationRate: number // en secondes
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  initialSpectralActivity: 20,
  accelerationRate: 30
}
