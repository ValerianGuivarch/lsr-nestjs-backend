import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('device')
export class DeviceEntity {
  @PrimaryColumn()
  deviceId: string

  @Column()
  role: string

  @Column({ nullable: true })
  emfLevel?: number

  @Column({ default: true })
  powerOn: boolean

  @Column({ default: false })
  huntActive: boolean

  @Column({ nullable: true })
  message?: string

  @Column({ default: 'green' })
  cameraColor: 'green' | 'red'

  @Column({ nullable: true })
  ghostUntil?: string

  // Van dashboard data
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

  @Column()
  updatedAt: string
}
