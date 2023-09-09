import { DBProficiency } from '../proficiencies/DBProficiency'
import { DBSkill } from '../skills/DBSkill'
import { PrimaryColumn, Column, Entity, ManyToMany, JoinTable } from 'typeorm'

@Entity()
export class DBBloodline {
  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({ type: 'varchar', default: '' })
  display: string

  @ManyToMany(() => DBSkill, (skill) => skill.bloodlines, {
    cascade: ['remove']
  })
  @JoinTable()
  skills: DBSkill[]

  @ManyToMany(() => DBProficiency, (proficiency) => proficiency.bloodlines, {
    cascade: ['remove']
  })
  @JoinTable()
  proficiencies: DBProficiency[]
}
