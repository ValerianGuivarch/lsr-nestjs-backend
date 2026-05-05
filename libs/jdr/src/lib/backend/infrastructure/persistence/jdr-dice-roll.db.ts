import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm'
import { DiceRoll } from '../../../../../domain/src/index'

@Entity({ name: 'jdr_dice_roll' })
export class DBJdrDiceRoll {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @Column({ type: 'varchar', nullable: false })
  jdrSlug: string

  @Column({ type: 'varchar', nullable: false })
  characterSlug: string

  @Column({ type: 'varchar', nullable: false })
  characterName: string

  @Column({ type: 'varchar', nullable: false })
  statSlug: string

  @Column({ type: 'varchar', nullable: false })
  statName: string

  @Column({ type: 'int', nullable: false })
  statValue: number

  @Column({ type: 'simple-array', nullable: false })
  results: number[]

  static toDiceRoll(db: DBJdrDiceRoll): DiceRoll {
    return new DiceRoll({
      id: db.id,
      jdrSlug: db.jdrSlug,
      characterSlug: db.characterSlug,
      characterName: db.characterName,
      statSlug: db.statSlug,
      statName: db.statName,
      statValue: db.statValue,
      results: db.results.map(Number),
      createdDate: db.createdDate
    })
  }
}
