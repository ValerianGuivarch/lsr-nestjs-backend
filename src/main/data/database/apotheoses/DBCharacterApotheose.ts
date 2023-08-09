import { DBApotheose } from './DBApotheose'
import { DBCharacter } from '../character/DBCharacter'
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'

@Entity()
export class DBCharacterApotheose {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', nullable: false })
  characterName: string

  @ManyToOne(() => DBCharacter)
  @JoinColumn({ name: 'characterName' })
  character: DBCharacter

  @Column({ type: 'varchar', nullable: false })
  apotheoseName: string

  @ManyToOne(() => DBApotheose)
  @JoinColumn({ name: 'apotheoseName' })
  apotheose: DBApotheose
}
