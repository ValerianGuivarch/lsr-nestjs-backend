import { DisplayCategory } from '../../../domain/models/characters/DisplayCategory'
import { DBBloodline } from '../bloodlines/DBBloodline'
import { DBCharacter } from '../character/DBCharacter'
import { DBClasse } from '../classes/DBClasse'
import { Column, Entity, ManyToMany, PrimaryColumn } from 'typeorm'

@Entity()
export class DBProficiency {
  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({ type: 'varchar' })
  shortName: string

  @Column({
    type: 'enum',
    enum: DisplayCategory
  })
  displayCategory: string

  @Column({ default: '' })
  description: string

  @Column({ type: 'integer', nullable: true })
  minLevel?: number | null

  @ManyToMany(() => DBCharacter, (character) => character.proficiencies)
  characters: DBCharacter[]

  @ManyToMany(() => DBBloodline, (bloodline) => bloodline.proficiencies)
  bloodlines: DBBloodline[]

  @ManyToMany(() => DBClasse, (classe) => classe.proficiencies)
  classes: DBClasse[]
}
