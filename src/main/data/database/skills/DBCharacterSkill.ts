import { DBSkill } from './DBSkill'
import { DBSkillAttrs } from './DBSkillAttrs'
import { DBCharacter } from '../character/DBCharacter'
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'

@Entity()
export class DBCharacterSkill extends DBSkillAttrs {
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

  @Column({ type: 'integer', default: null, nullable: true })
  dailyUse?: number

  @Column({ type: 'integer', default: null, nullable: true })
  limitationMax?: number
}
