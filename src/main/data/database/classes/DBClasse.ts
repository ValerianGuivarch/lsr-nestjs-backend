import { DBApotheose } from '../apotheoses/DBApotheose'
import { DBProficiency } from '../proficiencies/DBProficiency'
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

  @ManyToMany(() => DBSkill, (skill) => skill.classes, {
    cascade: ['remove']
  })
  @JoinTable()
  skills: DBSkill[]

  @ManyToMany(() => DBApotheose, (apotheose) => apotheose.classes, {
    cascade: ['remove']
  })
  @JoinTable()
  apotheoses: DBApotheose[]

  @ManyToMany(() => DBProficiency, (proficiency) => proficiency.classes, {
    cascade: ['remove']
  })
  @JoinTable()
  proficiencies: DBProficiency[]
}
