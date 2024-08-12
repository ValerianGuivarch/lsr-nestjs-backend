import { SkillStat } from '../../../domain/models/skills/SkillStat'
import { DBCharacter } from '../character/DBCharacter'
import { IsDefined, IsString } from 'class-validator'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class DBRoll {
  @PrimaryGeneratedColumn('uuid')
  @IsString()
  id: string

  @Column({ type: 'varchar' })
  rollerName: string

  @ManyToOne(() => DBCharacter, {
    cascade: ['remove']
  })
  @JoinColumn({ name: 'rollerName' })
  roller: DBCharacter

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
  illustration?: string

  @Column({ type: 'varchar', nullable: true })
  data?: string

  @Column({ type: 'varchar', nullable: true })
  empiriqueRoll?: string

  @Column({ type: 'varchar', nullable: true })
  resistRoll?: string

  @Column({ type: 'varchar', default: 'fait un jet ', nullable: false })
  display: string

  @Column({ type: 'integer', nullable: true })
  healPoint?: number

  @Column({ type: 'boolean', default: false })
  resistance: boolean

  @Column({ type: 'boolean', default: false })
  blessure: boolean

  @Column({ type: 'boolean', default: false })
  help: boolean

  @Column({ type: 'varchar', nullable: true })
  precision?: string

  @Column({ type: 'varchar', nullable: true })
  pictureUrl?: string

  @Column({ type: 'boolean', default: false })
  @IsDefined()
  dark: boolean
}
