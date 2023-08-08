import { DBProficiency } from './DBProficiency'
import { DBProficiencyAttrs } from './DBProficiencyAttrs'
import { DBBloodline } from '../bloodlines/DBBloodline'
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'

@Entity()
export class DBBloodlineProficiency extends DBProficiencyAttrs {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', nullable: false })
  bloodlineName: string

  @ManyToOne(() => DBBloodline)
  @JoinColumn({ name: 'bloodlineName' })
  bloodline: DBBloodline

  @Column({ type: 'varchar', nullable: false })
  proficiencyName: string

  @ManyToOne(() => DBProficiency)
  @JoinColumn({ name: 'proficiencyName' })
  proficiency: DBProficiency
}
