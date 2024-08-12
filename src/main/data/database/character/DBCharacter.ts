import { ApotheoseState } from '../../../domain/models/apotheoses/ApotheoseState'
import { BattleState } from '../../../domain/models/characters/BattleState'
import { Genre } from '../../../domain/models/characters/Genre'
import { DBApotheose } from '../apotheoses/DBApotheose'
import { DBBloodline } from '../bloodlines/DBBloodline'
import { DBClasse } from '../classes/DBClasse'
import { DBProficiency } from '../proficiencies/DBProficiency'
import { DBSkill } from '../skills/DBSkill'
import { IsDefined, IsObject, IsOptional } from 'class-validator'
import { ManyToOne, Column, Entity, JoinColumn, PrimaryColumn, ManyToMany, JoinTable } from 'typeorm'

@Entity()
export class DBCharacter {
  @PrimaryColumn({ type: 'varchar' })
  @IsDefined()
  name: string

  @Column()
  @IsDefined()
  classeName: string

  @ManyToOne(() => DBClasse)
  @JoinColumn({ name: 'classeName' })
  @IsDefined()
  @IsObject()
  classe: DBClasse

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  controlledBy?: string

  @Column({ type: 'boolean', default: false })
  @IsDefined()
  isInvocation: boolean

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  currentApotheoseName?: string

  @ManyToOne(() => DBApotheose)
  @JoinColumn({ name: 'currentApotheoseName' })
  @IsOptional()
  @IsObject()
  currentApotheose?: DBApotheose

  @Column({
    type: 'enum',
    enum: ApotheoseState,
    default: ApotheoseState.NONE
  })
  @IsDefined()
  apotheoseState: string

  @Column({
    type: 'integer',
    default: 2
  })
  @IsDefined()
  chair: number

  @Column({
    type: 'integer',
    default: 2
  })
  @IsDefined()
  esprit: number

  @Column({
    type: 'integer',
    default: 2
  })
  @IsDefined()
  essence: number

  @Column({
    type: 'integer',
    default: 4
  })
  @IsDefined()
  pv: number

  @Column({
    type: 'integer',
    default: 4
  })
  @IsDefined()
  pvMax: number

  @Column({
    type: 'integer',
    default: 2
  })
  @IsDefined()
  pf: number

  @Column({
    type: 'integer',
    default: 2
  })
  @IsDefined()
  pfMax: number

  @Column({
    type: 'integer',
    default: 2
  })
  @IsDefined()
  pp: number

  @Column({
    type: 'integer',
    default: 2
  })
  @IsDefined()
  ppMax: number

  @Column({
    type: 'integer',
    default: 0
  })
  @IsDefined()
  dettes: number

  @Column({
    type: 'integer',
    default: 0
  })
  @IsDefined()
  dragonDettes: number

  @Column({
    type: 'integer',
    default: 3
  })
  @IsDefined()
  arcanes: number

  @Column({
    type: 'integer',
    default: 3
  })
  @IsDefined()
  arcanesMax: number

  @Column({
    type: 'integer',
    default: 3
  })
  @IsDefined()
  ether: number

  @Column({
    type: 'integer',
    default: 3
  })
  @IsDefined()
  etherMax: number

  @Column({
    type: 'integer',
    default: 1
  })
  @IsDefined()
  arcanePrimes: number

  @Column({
    type: 'integer',
    default: 1
  })
  @IsDefined()
  arcanePrimesMax: number

  @Column({
    type: 'integer',
    default: 0
  })
  @IsDefined()
  munitions: number

  @Column({
    type: 'integer',
    default: 0
  })
  @IsDefined()
  munitionsMax: number

  @Column({
    type: 'integer',
    default: 1
  })
  @IsDefined()
  niveau: number

  @Column({
    type: 'boolean',
    default: false
  })
  @IsDefined()
  restImproved: boolean

  @Column({ type: 'varchar', default: ' ' })
  @IsDefined()
  lux: string

  @Column({ type: 'varchar', default: ' ' })
  @IsDefined()
  umbra: string

  @Column({ type: 'varchar', default: ' ' })
  @IsDefined()
  secunda: string

  @Column({ type: 'varchar', default: ' ' })
  @IsDefined()
  notes: string

  @Column({
    type: 'enum',
    enum: BattleState,
    default: BattleState.NONE
  })
  @IsDefined()
  battleState: string

  @Column({
    type: 'enum',
    enum: Genre,
    default: Genre.FEMME
  })
  @IsDefined()
  genre: string

  @Column({
    type: 'integer',
    default: 0
  })
  @IsDefined()
  relance: number

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  playerName?: string

  @Column({
    type: 'varchar',
    nullable: true,
    default:
      'https://media.discordapp.net/attachments/734153794681700394/1140999461791867023/images.png?width=450&height=450'
  })
  @IsOptional()
  picture?: string

  @Column({
    type: 'varchar',
    nullable: true,
    default:
      'https://media.discordapp.net/attachments/734153794681700394/1140999392724258997/OjPbfYPcRXDerbc3tbs29uF4rf3psnnDCCSeccMIJJ5xQFv8D3XLFiJT6dRcAAAAASUVORK5CYII.png?width=450&height=450'
  })
  @IsOptional()
  pictureApotheose?: string

  @Column({
    type: 'varchar',
    nullable: true,
    default:
      'https://media.discordapp.net/attachments/734153794681700394/1141000189071601695/HD-wallpaper-field-of-honour-fantasy-background-abstract-sword-blue-light.png?width=1248&height=936'
  })
  @IsOptional()
  background?: string

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  buttonColor?: string

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  textColor?: string

  @Column({ type: 'boolean', default: false })
  @IsDefined()
  boosted: boolean

  @Column({ type: 'varchar', nullable: false, default: 'aucun' })
  @IsOptional()
  bloodlineName?: string

  @ManyToOne(() => DBBloodline)
  @JoinColumn({ name: 'bloodlineName' })
  @IsOptional()
  @IsObject()
  bloodline: DBBloodline

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  customData?: string

  @ManyToMany(() => DBSkill, (skill) => skill.characters)
  @JoinTable()
  @IsDefined()
  @IsObject()
  skills: DBSkill[]

  @ManyToMany(() => DBApotheose, (apotheose) => apotheose.characters, {
    cascade: ['remove']
  })
  @JoinTable()
  @IsDefined()
  @IsObject()
  apotheoses: DBApotheose[]

  @ManyToMany(() => DBProficiency, (proficiency) => proficiency.characters, {
    cascade: ['remove']
  })
  @JoinTable()
  @IsDefined()
  @IsObject()
  proficiencies: DBProficiency[]

  @Column({ type: 'jsonb', nullable: true })
  @IsDefined()
  @IsObject()
  dailyUse: { [skillName: string]: number }

  @Column({ type: 'jsonb', nullable: true })
  @IsDefined()
  @IsObject()
  dailyUseMax: { [skillName: string]: number }

  @Column({ type: 'jsonb', nullable: true })
  @IsDefined()
  @IsObject()
  arcaneDette: { [arcaneName: string]: number }

  @Column({ type: 'boolean', default: true })
  @IsDefined()
  hurtMalus: boolean

  @Column({ type: 'boolean', default: false })
  @IsDefined()
  boulet: boolean

  @Column({ type: 'boolean', default: false })
  @IsDefined()
  dark: boolean
}
