import { DBSkill } from '../skills/DBSkill'
import { PrimaryColumn, Entity, Column, ManyToMany, JoinTable } from 'typeorm'

@Entity()
export class DBClasse {
  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({ type: 'varchar', default: '' })
  displayMale: string

  @Column({ type: 'varchar', default: '' })
  displayFemale: string

  @ManyToMany(() => DBSkill)
  @JoinTable({ name: 'DBClasseSkill' })
  skills: DBSkill[]
}
