import { DisplayCategory } from '../../../domain/models/characters/DisplayCategory'
import { DBCharacter } from '../character/DBCharacter'
import { DBClasse } from '../classes/DBClasse'
import { Column, Entity, ManyToMany, PrimaryColumn } from 'typeorm'

@Entity()
export class DBApotheose {
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

  @Column({ type: 'integer', default: 1 })
  position: number

  @Column({ type: 'integer', default: 1 })
  minLevel: number

  @Column({ type: 'integer', default: 100 })
  maxLevel: number

  @Column({ type: 'integer', default: 3 })
  cost: number

  @Column({ type: 'integer', default: 3 })
  chairImprovement: number

  @Column({ type: 'integer', default: 3 })
  espritImprovement: number

  @Column({ type: 'integer', default: 3 })
  essenceImprovement: number

  @Column({ type: 'boolean', default: false })
  arcaneImprovement: boolean

  @Column({ type: 'boolean', default: false })
  avantage: boolean

  @Column('simple-array', {
    default: [
      'perd le contrôle !',
      'garde le contrôle',
      'garde le contrôle',
      'garde le contrôle',
      'garde le contrôle',
      'garde le contrôle'
    ]
  })
  apotheoseEffect: string[]

  @ManyToMany(() => DBCharacter, (character) => character.apotheoses)
  characters: DBCharacter[]

  @ManyToMany(() => DBClasse, (classe) => classe.apotheoses)
  classes: DBClasse[]
}
