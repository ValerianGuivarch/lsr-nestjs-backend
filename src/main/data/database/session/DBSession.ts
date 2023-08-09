import { ChaosLevel } from '../../../domain/models/session/ChaosLevel'
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class DBSession {
  @PrimaryGeneratedColumn()
  id: string

  @Column({
    type: 'enum',
    enum: ChaosLevel,
    default: ChaosLevel.LEVEL_0_0
  })
  chaos: ChaosLevel

  @Column({
    type: 'integer',
    default: 3
  })
  baseRest: number

  @Column({
    type: 'integer',
    default: 4
  })
  improvedRest: number
}
