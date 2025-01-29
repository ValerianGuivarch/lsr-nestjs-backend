import { DBProficiency } from '../proficiencies/DBProficiency'
import { DBSkill } from '../skills/DBSkill'
import { PrimaryGeneratedColumn, Column, Entity, ManyToMany } from 'typeorm'

@Entity()
export class DBBloodline {
  @PrimaryGeneratedColumn('uuid') // Clé primaire unique requise pour Directus
  id: string

  @Column({ type: 'varchar', unique: true })
  name: string

  @Column({ type: 'varchar', default: '' })
  display: string

  @ManyToMany(() => DBSkill, (skill) => skill.bloodlines)
  skills: DBSkill[]

  @ManyToMany(() => DBProficiency, (proficiency) => proficiency.bloodlines)
  proficiencies: DBProficiency[]
}
