import { DBArcane } from './DBArcane'
import { ArcaneUse } from '../../../domain/models/arcanes/ArcaneUse'
import { DBCharacter } from '../character/DBCharacter'
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'

@Entity()
export class DBOwnedArcane {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', nullable: false })
  characterName: string

  @ManyToOne(() => DBCharacter)
  @JoinColumn({ name: 'characterName' })
  character: DBCharacter

  @Column({ type: 'varchar', nullable: false })
  arcaneName: string

  @ManyToOne(() => DBArcane)
  @JoinColumn({ name: 'arcaneName' })
  arcane: DBArcane

  @Column({
    type: 'enum',
    enum: ArcaneUse,
    default: ArcaneUse.LIMITED
  })
  use: string
}
