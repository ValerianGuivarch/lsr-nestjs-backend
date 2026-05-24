import { Column, Entity, PrimaryColumn } from 'typeorm'

/**
 * État d'un outil de l'escape Ghost
 * Les 8 outils sont hardcodés: EMF, Spirit Box, Ghost Cam, Ghost Orbs, Thermomètre, Motion Sensor, Sound Detector, Van
 * Cette table enregistre juste l'état (powerOn, valeurs, etc.) de chaque outil
 */
@Entity('tool_state')
export class ToolStateEntity {
  @PrimaryColumn()
  toolType: string // EMF, SPIRITBOX, GHOSTCAM, GHOSTORBS, THERMOMETER, MOTION_SENSOR, SOUND_DETECTOR, VAN (hardcodé)

  // État d'outil générique
  @Column({ default: true })
  powerOn: boolean

  @Column({ nullable: true })
  emfLevel?: number // pour EMF, Spirit Box, Spiritmeter

  @Column({ default: false })
  huntActive: boolean // pour tous les outils lors d'une chasse

  @Column({ nullable: true })
  message?: string // message de l'outil (Spirit Box, etc.)

  @Column({ default: 'green' })
  cameraColor: 'green' | 'red' // pour Ghost Cam

  @Column({ type: 'float', default: 20 })
  temperature: number // pour Thermomètre

  @Column({ nullable: true })
  ghostUntil?: string // timestamp jusqu'où le fantôme est visible

  @Column({ nullable: true })
  orbUntil?: string // timestamp jusqu'où les orbes sont visibles

  @Column({ default: false })
  photoModeUnlocked: boolean // déverrouillage caméra photo (session de jeu)

  // Van-specific data
  @Column({ default: 0 })
  ghostActivityLevel: number // 0-10

  @Column({ type: 'text', default: '{}' })
  playerSanity: string // JSON: { "playerName": sanityPercent }

  @Column({ type: 'text', default: '{}' })
  soundLevels: string // JSON: { "roomName": level }

  @Column({ type: 'text', default: '{}' })
  motionDetections: string // JSON: { "roomName": detected }

  @Column({ type: 'text', default: '[]' })
  roomList: string // JSON array of room names

  @Column({ type: 'text', default: '[]' })
  motionSensorRooms: string // JSON array of room names with active sensors

  @Column({ nullable: true })
  recentMotionAlert?: string

  @Column({ type: 'text', default: '[]' })
  missionObjectives: string // JSON array of { objective: string, completed: boolean }

  @Column({ nullable: true })
  floorPlanImage?: string // URL or base64 image

  @Column({ type: 'text', default: '{"title":"","url":"","volume":70,"loop":true,"playing":false}' })
  backgroundMusic: string // JSON: { title, url, volume, loop, playing }

  @Column({ type: 'text', default: '[]' })
  soundboard: string // JSON array of { id, label, url, volume, lastTriggeredAt? }

  @Column({ type: 'text', default: '[]' })
  vanMessageTemplates: string // JSON array of MJ message templates

  @Column({ type: 'text', default: '[]' })
  vanSentMessages: string // JSON array of sent messages for player feed

  // Van scenario flow (controlled by MJ, 0..7)
  @Column({ default: 0 })
  vanStep: number

  @Column({ type: 'text', nullable: true })
  vanPendingPhoto?: string // base64 photo en attente de validation MJ (étape 6)

  @Column({ type: 'text', nullable: true })
  vanFinalPhoto?: string // base64 photo de la victoire (étape 7)

  @Column({ nullable: true })
  vanFearMessageAt?: string // timestamp ISO du dernier refus, sert au message 3s

  @Column({ default: new Date().toISOString() })
  updatedAt: string
}

/**
 * Alias pour compatibilité (DeviceEntity conservé pour l'historique)
 */
export type DeviceEntity = ToolStateEntity
export const DeviceEntity = ToolStateEntity
