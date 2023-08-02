import { Apotheose } from '../../../domain/models/characters/Apotheose'
import { BattleState } from '../../../domain/models/characters/BattleState'
import { Bloodline } from '../../../domain/models/characters/Bloodline'
import { Category } from '../../../domain/models/characters/Category'
import { Classe } from '../../../domain/models/characters/Classe'
import { Genre } from '../../../domain/models/characters/Genre'
import { Player } from '../../../domain/models/characters/Player'
import { DBEntity } from '../DBEntity'
import { Entity, Column } from 'typeorm'

@Entity()
export class DBCharacter extends DBEntity {
  // unique
  @Column({ type: 'varchar', unique: true })
  name: string

  @Column({
    type: 'enum',
    enum: Classe,
    default: Classe.CHAMPION
  })
  classe: string

  @Column({
    type: 'enum',
    enum: Bloodline,
    default: Bloodline.AUCUN
  })
  bloodline: string

  @Column({
    type: 'enum',
    enum: Apotheose,
    default: Apotheose.NONE
  })
  apotheose: string

  @Column({ type: 'varchar', nullable: true })
  apotheoseImprovement?: string

  @Column('simple-array', { nullable: true })
  apotheoseImprovementList?: string[]

  @Column({
    type: 'integer',
    default: 2
  })
  chair: number

  @Column({
    type: 'integer',
    default: 2
  })
  esprit: number

  @Column({
    type: 'integer',
    default: 2
  })
  essence: number

  @Column({
    type: 'integer',
    default: 4
  })
  pv: number

  @Column({
    type: 'integer',
    default: 4
  })
  pvMax: number

  @Column({
    type: 'integer',
    default: 2
  })
  pf: number

  @Column({
    type: 'integer',
    default: 2
  })
  pfMax: number

  @Column({
    type: 'integer',
    default: 2
  })
  pp: number

  @Column({
    type: 'integer',
    default: 2
  })
  ppMax: number

  @Column({
    type: 'integer',
    default: 0
  })
  dettes: number

  @Column({
    type: 'integer',
    default: 3
  })
  arcanes: number

  @Column({
    type: 'integer',
    default: 3
  })
  arcanesMax: number

  @Column({
    type: 'integer',
    default: 1
  })
  niveau: number

  @Column({ type: 'varchar', default: ' ' })
  lux: string

  @Column({ type: 'varchar', default: ' ' })
  umbra: string

  @Column({ type: 'varchar', default: ' ' })
  secunda: string

  @Column({ type: 'varchar', default: ' ' })
  notes: string

  @Column({
    type: 'enum',
    enum: Category,
    default: Category.TEMPO
  })
  category: string

  @Column({
    type: 'enum',
    enum: BattleState,
    default: BattleState.NONE
  })
  battleState: string

  @Column({
    type: 'enum',
    enum: Genre,
    default: Genre.AUTRE
  })
  genre: string

  @Column({
    type: 'integer',
    default: 0
  })
  relance: number

  @Column({
    type: 'enum',
    enum: Player,
    default: Player.GUEST
  })
  playerName?: string

  @Column({ type: 'varchar', nullable: true })
  picture?: string

  @Column({ type: 'varchar', nullable: true })
  pictureApotheose?: string

  @Column({ type: 'varchar', nullable: true })
  background?: string

  @Column({ type: 'varchar', nullable: true })
  buttonColor?: string

  @Column({ type: 'varchar', nullable: true })
  textColor?: string

  @Column({ type: 'boolean', default: false })
  boosted: boolean
}
