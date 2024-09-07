import { Stat } from '../domain/entities/stat.entity'
import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm'

@Entity()
export class DBStat {
  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({ type: 'int', default: 0 })
  order: number

  @Column({ type: 'varchar', nullable: false, default: '' })
  flipText: string

  static readonly RELATIONS = {}

  static toStat(stat: DBStat): Stat {
    return new Stat({
      name: stat.name,
      order: stat.order,
      flipText: stat.flipText
    })
  }
}
