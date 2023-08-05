import { DBEntity } from '../DBEntity'
import { Column, Entity } from 'typeorm'

@Entity()
export class DBRoll extends DBEntity {
  @Column({ type: 'varchar' })
  rollerName: string

  @Column({ type: 'timestamp' })
  date: Date

  @Column({ type: 'boolean' })
  secret: boolean

  @Column({ type: 'boolean' })
  displayDices: boolean

  @Column({ type: 'boolean' })
  focus: boolean

  @Column({ type: 'boolean' })
  power: boolean

  @Column({ type: 'boolean' })
  proficiency: boolean

  @Column({ type: 'integer', default: 0 })
  bonus: number

  @Column({ type: 'integer', default: 0 })
  malus: number

  @Column('simple-array')
  result: number[]

  @Column({ type: 'integer', nullable: true })
  success?: number

  @Column({ type: 'integer', nullable: true })
  juge12?: number

  @Column({ type: 'integer', nullable: true })
  juge34?: number

  @Column({ type: 'varchar', nullable: true })
  characterToHelp?: string

  @Column({ type: 'varchar', nullable: true })
  picture?: string

  @Column({ type: 'varchar', nullable: true })
  data?: string

  @Column({ type: 'varchar', nullable: true })
  empirique?: string

  @Column({ type: 'varchar', nullable: true })
  apotheose?: string

  @Column({ type: 'varchar', nullable: true })
  resistRoll?: string

  @Column({ type: 'boolean', nullable: true })
  helpUsed?: boolean

  @Column({ type: 'varchar', default: 'fait un jet ', nullable: false })
  display: string
}
