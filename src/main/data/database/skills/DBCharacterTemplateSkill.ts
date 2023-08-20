import { DBSkill } from './DBSkill'
import { DBSkillAttrs } from './DBSkillAttrs'
import { DBCharacterTemplate } from '../character/DBCharacterTemplate'
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'

@Entity()
export class DBCharacterTemplateSkill extends DBSkillAttrs {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', nullable: false })
  characterTemplateName: string

  @ManyToOne(() => DBCharacterTemplate)
  @JoinColumn({ name: 'characterTemplateName' })
  characterTemplate: DBCharacterTemplate

  @Column({ type: 'varchar', nullable: false })
  skillName: string

  @ManyToOne(() => DBSkill)
  @JoinColumn({ name: 'skillName' })
  skill: DBSkill

  @Column({ type: 'integer', default: null, nullable: true })
  dailyUse?: number

  @Column({ type: 'integer', default: null, nullable: true })
  limitationMax?: number
}
