import { DBSkill } from './DBSkill'
import { SkillOwnedUse } from '../../../domain/models/skills/SkillOwnedUse'
import { DBCharacter } from '../character/DBCharacter'
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'

@Entity()
export class DBOwnedSkill {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', nullable: false })
  characterName: string

  @ManyToOne(() => DBCharacter)
  @JoinColumn({ name: 'characterName' })
  character: DBCharacter

  @Column({ type: 'varchar', nullable: false })
  skillName: string

  @ManyToOne(() => DBSkill)
  @JoinColumn({ name: 'skillName' })
  skill: DBSkill

  @Column({
    type: 'enum',
    enum: SkillOwnedUse,
    default: SkillOwnedUse.UNLIMITED
  })
  use: string

  @Column({ type: 'integer', default: 1 })
  limitedUse: number

  @Column({ type: 'integer', nullable: true, default: null })
  pvCost?: number

  @Column({ type: 'integer', nullable: true, default: null })
  pfCost?: number

  @Column({ type: 'integer', nullable: true, default: null })
  ppCost?: number

  @Column({ type: 'integer', nullable: true, default: -3 })
  dettesCost?: number

  @Column({ type: 'integer', nullable: true })
  arcaneCost?: number

  @Column({ type: 'boolean', nullable: true, default: null })
  allowsPf?: boolean

  @Column({ type: 'boolean', nullable: true, default: null })
  allowsPp?: boolean
}
