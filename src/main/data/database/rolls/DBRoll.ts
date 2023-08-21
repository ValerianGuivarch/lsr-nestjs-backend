import { SkillStat } from '../../../domain/models/skills/SkillStat'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class DBRoll {
  @PrimaryGeneratedColumn()
  id: string

  @Column({ type: 'varchar' })
  rollerName: string

  @Column({ type: 'timestamp' })
  date: Date

  @Column({
    type: 'enum',
    enum: SkillStat
  })
  stat: string

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
  picture?: string

  @Column({ type: 'varchar', nullable: true })
  data?: string

  @Column({ type: 'varchar', nullable: true })
  empiriqueRoll?: string

  @Column({ type: 'varchar', nullable: true })
  resistRoll?: string

  @Column({ type: 'varchar', default: 'fait un jet ', nullable: false })
  display: string

  @Column({ type: 'boolean', default: false, nullable: false })
  isHeal?: boolean
}
