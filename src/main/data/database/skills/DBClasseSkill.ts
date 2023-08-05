import { DBSkill } from './DBSkill'
import { DBClasse } from '../classes/DBClasse'
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'

@Entity()
export class DBClasseSkill {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', nullable: false })
  classeName: string

  @ManyToOne(() => DBClasse)
  @JoinColumn({ name: 'classeName' })
  classe: DBClasse

  @Column({ type: 'varchar', nullable: false })
  skillName: string

  @ManyToOne(() => DBSkill)
  @JoinColumn({ name: 'skillName' })
  skill: DBSkill
}
