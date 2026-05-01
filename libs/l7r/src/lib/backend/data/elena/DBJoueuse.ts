import { DBConstellation } from './DBConstellation'
import { DBScenario } from './DBScenario'
import { Joueuse } from '../../domain/models/elena/Joueuse'
import { PlayState } from '../../domain/models/elena/PlayState'
import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm'

@Entity('Joueuse')
export class DBJoueuse {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  name: string

  @Column({
    default: false
  })
  sponsorToChoose: boolean

  @Column({
    default: 0
  })
  coins: number

  @Column({
    nullable: true
  })
  sponsorId?: string

  @ManyToOne(() => DBConstellation)
  @JoinColumn({ name: 'sponsorId' })
  sponsor?: DBConstellation

  @Column({
    nullable: true
  })
  scenarioId?: string

  @ManyToOne(() => DBScenario)
  @JoinColumn({ name: 'scenarioId' })
  scenario: DBScenario

  @Column({
    type: 'enum',
    default: PlayState.NOT_STARTED,
    enum: PlayState,
    enumName: 'play_state'
  })
  state: PlayState

  static readonly RELATIONS = {
    sponsor: true,
    scenario: true
  }

  static toJoueuse(dbJoueuse: DBJoueuse): Joueuse {
    return new Joueuse({
      id: dbJoueuse.id,
      name: dbJoueuse.name,
      coins: dbJoueuse.coins,
      state: dbJoueuse.state,
      sponsor: dbJoueuse.sponsor,
      scenario: dbJoueuse.scenario,
      sponsorToChoose: dbJoueuse.sponsorToChoose
    })
  }
}

export type DBJoueuseToCreate = Omit<DBJoueuse, 'id' | 'sponsor' | 'scenario'>
