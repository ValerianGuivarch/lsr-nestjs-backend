import { DBCharacter } from '../character/DBCharacter'
import { PrimaryGeneratedColumn, Entity, Column, ManyToOne, JoinColumn } from 'typeorm'

@Entity()
export class DBInvocation {
  @PrimaryGeneratedColumn()
  id: string

  @Column({ type: 'int' })
  chair: number

  @Column({ type: 'int' })
  esprit: number

  @Column({ type: 'int' })
  essence: number

  @Column({ type: 'int' })
  pv: number

  @Column({ type: 'int' })
  pvMax: number

  @ManyToOne(() => DBCharacter)
  @JoinColumn({ name: 'summonerName' })
  summoner: DBCharacter

  @Column({ type: 'varchar' })
  summonerName: string

  @Column({ type: 'varchar' })
  templateName: string

  @Column({ type: 'varchar', nullable: true })
  picture?: string

  @Column({ type: 'boolean' })
  healer: boolean
}
