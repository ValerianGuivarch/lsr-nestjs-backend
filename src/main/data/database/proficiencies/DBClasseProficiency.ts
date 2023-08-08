import { DBProficiency } from './DBProficiency'
import { DBProficiencyAttrs } from './DBProficiencyAttrs'
import { DBClasse } from '../classes/DBClasse'
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'

@Entity()
export class DBClasseProficiency extends DBProficiencyAttrs {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', nullable: false })
  classeName: string

  @ManyToOne(() => DBClasse)
  @JoinColumn({ name: 'classeName' })
  classe: DBClasse

  @Column({ type: 'varchar', nullable: false })
  proficiencyName: string

  @ManyToOne(() => DBProficiency)
  @JoinColumn({ name: 'proficiencyName' })
  proficiency: DBProficiency
}
