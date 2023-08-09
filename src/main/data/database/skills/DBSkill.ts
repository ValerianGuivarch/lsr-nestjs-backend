import { DBSkillAttrs } from './DBSkillAttrs'
import { DisplayCategory } from '../../../domain/models/characters/DisplayCategory'
import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class DBSkill extends DBSkillAttrs {
  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({ type: 'boolean', default: false })
  allAttribution: boolean

  @Column({
    type: 'enum',
    enum: DisplayCategory
  })
  displayCategory: string

  @Column({ type: 'integer', default: 1 })
  position: number

  @Column({ type: 'varchar', default: 'fait un Jet ', nullable: true })
  display: string

  @Column({ type: 'boolean', default: false })
  isArcanique: boolean
}
