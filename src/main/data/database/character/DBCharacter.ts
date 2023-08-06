import { Apotheose } from '../../../domain/models/characters/Apotheose'
import { BattleState } from '../../../domain/models/characters/BattleState'
import { Category } from '../../../domain/models/characters/Category'
import { Genre } from '../../../domain/models/characters/Genre'
import { Player } from '../../../domain/models/characters/Player'
import { DBBloodline } from '../bloodlines/DBBloodline'
import { DBClasse } from '../classes/DBClasse'
import { ManyToOne, Column, Entity, JoinColumn, PrimaryColumn } from 'typeorm'

@Entity()
export class DBCharacter {
  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column()
  classeName: string

  @ManyToOne(() => DBClasse)
  @JoinColumn({ name: 'classeName' })
  classe: DBClasse

  @Column({ type: 'varchar', nullable: true })
  apotheoseName?: string

  @ManyToOne(() => DBBloodline)
  @JoinColumn({ name: 'apotheoseName' })
  apotheose: Apotheose

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
    enum: Genre
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

  @Column({ type: 'varchar', nullable: true })
  bloodlineName?: string

  @ManyToOne(() => DBBloodline)
  @JoinColumn({ name: 'bloodlineName' })
  bloodline: DBBloodline
}
