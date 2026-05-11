import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { JdrGroup } from '../../../../../domain/src/index'
import { DBJdr } from './jdr.db'

@Entity({ name: 'jdr_group' })
export class DBJdrGroup {
  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @ManyToOne(() => DBJdr, (jdr) => jdr.groups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jdrSlug' })
  jdr: DBJdr

  @PrimaryColumn({ type: 'varchar' })
  slug: string

  @Column({ type: 'varchar', nullable: false })
  name: string

  @Column({ type: 'varchar', nullable: false, default: '' })
  text: string

  static toJdrGroup(db: DBJdrGroup): JdrGroup {
    return new JdrGroup({
      jdrSlug: db.jdrSlug,
      name: db.name,
      slug: db.slug,
      text: db.text
    })
  }
}
