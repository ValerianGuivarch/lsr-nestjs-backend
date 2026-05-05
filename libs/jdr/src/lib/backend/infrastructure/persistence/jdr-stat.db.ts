import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Stat } from '../../../../../domain/src/index'
import { DBJdr } from './jdr.db'

@Entity({ name: 'jdr_stat' })
export class DBJdrStat {
  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @ManyToOne(() => DBJdr, (jdr) => jdr.stats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jdrSlug' })
  jdr: DBJdr

  @PrimaryColumn({ type: 'varchar' })
  slug: string

  @Column({ type: 'varchar', nullable: false })
  name: string

  static toStat(db: DBJdrStat): Stat {
    return new Stat({ jdrSlug: db.jdrSlug, name: db.name, slug: db.slug })
  }
}

export type DBJdrStatToCreate = Pick<DBJdrStat, 'jdrSlug' | 'slug' | 'name'>
