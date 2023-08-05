import { DBSkill } from './DBSkill'
import { DBBloodline } from '../bloodlines/DBBloodline'
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'

@Entity()
export class DBBloodlineSkill {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', nullable: false })
  bloodlineName: string

  @ManyToOne(() => DBBloodline)
  @JoinColumn({ name: 'bloodlineName' })
  bloodline: DBBloodline

  @Column({ type: 'varchar', nullable: false })
  skillName: string

  @ManyToOne(() => DBSkill)
  @JoinColumn({ name: 'skillName' })
  skill: DBSkill
}
