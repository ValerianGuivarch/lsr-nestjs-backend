import { ApotheoseState } from '../../../domain/models/apotheoses/ApotheoseState'
import { BattleState } from '../../../domain/models/characters/BattleState'
import { Genre } from '../../../domain/models/characters/Genre'
import { DBBloodline } from '../bloodlines/DBBloodline'
import { DBClasse } from '../classes/DBClasse'
import { IsOptional } from 'class-validator'
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
  @IsOptional()
  controlledBy: string

  @Column({ type: 'boolean', default: false })
  isInvocation: boolean

  @Column({ type: 'varchar', nullable: true })
  apotheoseName?: string

  @Column({
    type: 'enum',
    enum: ApotheoseState,
    default: ApotheoseState.NONE
  })
  apotheoseState: string

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
  arcanePrimes: number

  @Column({
    type: 'integer',
    default: 1
  })
  arcanePrimesMax: number

  @Column({
    type: 'integer',
    default: 0
  })
  munitions: number

  @Column({
    type: 'integer',
    default: 0
  })
  munitionsMax: number

  @Column({
    type: 'integer',
    default: 1
  })
  niveau: number

  @Column({
    type: 'boolean',
    default: false
  })
  restImproved: boolean

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

  @Column({ type: 'varchar', nullable: true })
  playerName?: string

  @Column({
    type: 'varchar',
    nullable: true,
    default:
      'https://media.discordapp.net/attachments/734153794681700394/1140999461791867023/images.png?width=450&height=450'
  })
  picture?: string

  @Column({
    type: 'varchar',
    nullable: true,
    default:
      'https://media.discordapp.net/attachments/734153794681700394/1140999392724258997/OjPbfYPcRXDerbc3tbs29uF4rf3psnnDCCSeccMIJJ5xQFv8D3XLFiJT6dRcAAAAASUVORK5CYII.png?width=450&height=450'
  })
  pictureApotheose?: string

  @Column({
    type: 'varchar',
    nullable: true,
    default:
      'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936'
  })
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

  @Column({ type: 'varchar', nullable: true })
  customData?: string
}
