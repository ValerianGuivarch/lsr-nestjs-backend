import { DisplayCategory } from '../../../domain/models/characters/DisplayCategory'
import { SuccessCalculation } from '../../../domain/models/roll/SuccessCalculation'
import { SkillStat } from '../../../domain/models/skills/SkillStat'
import { DBBloodline } from '../bloodlines/DBBloodline'
import { DBCharacter } from '../character/DBCharacter'
import { DBCharacterTemplate } from '../character/DBCharacterTemplate'
import { DBClasse } from '../classes/DBClasse'
import { Column, Entity, JoinColumn, ManyToOne, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class DBSkill {
  @PrimaryGeneratedColumn()
  id: string

  @Column({
    type: 'enum',
    enum: DisplayCategory
  })
  displayCategory: string

  @Column({ type: 'boolean' })
  allowsPf: boolean

  @Column({ type: 'boolean' })
  allowsPp: boolean

  @Column({
    type: 'enum',
    enum: SkillStat,
    nullable: true
  })
  stat: string

  @Column({ type: 'integer' })
  pvCost: number

  @Column({ type: 'integer' })
  pfCost: number

  @Column({ type: 'integer' })
  ppCost: number

  @Column({ type: 'integer' })
  dettesCost: number

  @Column({ type: 'integer' })
  arcaneCost: number

  @Column({ type: 'integer', default: 0 })
  etherCost: number

  @Column({ type: 'integer' })
  arcanePrimeCost: number

  @Column({ type: 'varchar', nullable: true })
  customRolls: string | null

  @Column({
    type: 'enum',
    enum: SuccessCalculation,
    nullable: true
  })
  successCalculation: string

  @Column({ type: 'boolean' })
  secret: boolean

  @Column({ type: 'varchar', nullable: true })
  invocationTemplateName?: string | null

  @ManyToOne(() => DBCharacterTemplate)
  @JoinColumn({ name: 'invocationTemplateName' })
  invocationTemplate: DBCharacterTemplate | null

  @Column({ type: 'varchar' })
  name: string

  @Column({ type: 'varchar' })
  shortName: string

  @Column({ type: 'varchar', nullable: true })
  longName: string | null

  @Column({ type: 'boolean', default: false })
  allAttribution: boolean

  @Column({ type: 'integer', default: 1 })
  position: number

  @Column({ type: 'varchar', default: 'fait un Jet ' })
  display: string

  @Column({ type: 'boolean', default: false })
  isArcanique: boolean

  @Column({ type: 'boolean', default: false })
  isHeal: boolean

  @Column({ type: 'boolean', default: false })
  resistance: boolean

  @Column({ type: 'boolean', default: false })
  help: boolean

  @Column({ type: 'boolean', default: false })
  blessure: boolean

  @Column({ type: 'varchar', default: '' })
  description: string

  @Column({ type: 'varchar', default: '' })
  owner: string

  @Column({ type: 'varchar', default: '' })
  precision: string

  @Column({ type: 'integer', default: 0 })
  soldatCost: number

  @ManyToMany(() => DBClasse, (classe) => classe.skills)
  classes: DBClasse[]

  @ManyToMany(() => DBBloodline, (bloodline) => bloodline.skills)
  bloodlines: DBBloodline[]

  @ManyToMany(() => DBCharacter, (character) => character.skills)
  characters: DBCharacter[]

  @ManyToMany(() => DBCharacterTemplate, (characterTemplate) => characterTemplate.skills)
  characterTemplates: DBCharacterTemplate[]
}
