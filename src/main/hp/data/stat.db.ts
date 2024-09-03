import { Stat } from '../domain/entities/stat.entity'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class DBStat {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @Column({ type: 'varchar', nullable: false })
  name: string

  @Column({ type: 'varchar', nullable: false })
  color: string

  static readonly RELATIONS = {}

  static toStat(stat: DBStat): Stat {
    return new Stat({
      id: stat.id,
      name: stat.name,
      color: stat.color
    })
  }
}
