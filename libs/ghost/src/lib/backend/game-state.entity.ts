import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('game_state')
export class GameStateEntity {
  @PrimaryColumn()
  gameId: string

  @Column({ default: false })
  isInitialized: boolean

  @Column({ default: false })
  isRunning: boolean

  @Column({ nullable: true })
  startedAt?: string

  @Column({ default: 20 })
  initialSpectralActivity: number // 0-100

  @Column({ default: 30 })
  accelerationRate: number // en secondes

  @Column({ default: 20 })
  currentSpectralActivity: number // 0-100

  @Column({ default: 0 })
  currentScenarioStep: number

  @Column({ type: 'text', default: '{}' })
  scenarioObjectives: string

  @Column({ default: new Date().toISOString() })
  updatedAt: string
}
