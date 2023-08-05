import { SuccessCalculation } from '../../../domain/models/roll/SuccessCalculation'
import { SkillAttribution } from '../../../domain/models/skills/SkillAttribution'
import { SkillCategory } from '../../../domain/models/skills/SkillCategory'
import { SkillOwnedUse } from '../../../domain/models/skills/SkillOwnedUse'
import { SkillStat } from '../../../domain/models/skills/SkillStat'
import { DBBloodline } from '../bloodlines/DBBloodline'
import { DBClasse } from '../classes/DBClasse'
import { ManyToMany, JoinTable, Column, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class DBSkill {
  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({
    type: 'enum',
    enum: SkillAttribution
  })
  attribution: string

  @Column({ type: 'boolean', default: true })
  allowsPf: boolean

  @Column({ type: 'boolean', default: true })
  allowsPp: boolean

  @ManyToMany(() => DBClasse)
  @JoinTable()
  attributionClasseList: DBClasse[]

  @ManyToMany(() => DBBloodline)
  @JoinTable()
  attributionBloodlineList: DBBloodline[]

  @Column({
    type: 'enum',
    enum: SkillStat
  })
  stat: string

  @Column({
    type: 'enum',
    enum: SkillCategory
  })
  category: string

  @Column({
    type: 'enum',
    enum: SkillOwnedUse,
    default: SkillOwnedUse.UNLIMITED
  })
  use: string

  @Column({ type: 'integer', default: 1 })
  limitedUse: number

  @Column({ type: 'integer', default: 0 })
  pvCost: number

  @Column({ type: 'integer', default: 0 })
  pfCost: number

  @Column({ type: 'integer', default: 0 })
  ppCost: number

  @Column({ type: 'integer', default: 0 })
  dettesCost: number

  @Column({ type: 'integer', default: 0 })
  arcaneCost: number

  @Column({ type: 'varchar', default: '', nullable: true })
  customRolls: string

  @Column({
    type: 'enum',
    enum: SuccessCalculation,
    default: SuccessCalculation.SIMPLE
  })
  successCalculation: string

  @Column({ type: 'boolean', default: false })
  secret: boolean

  @Column({ type: 'varchar', default: 'fait un Jet ', nullable: true })
  display: string
}
