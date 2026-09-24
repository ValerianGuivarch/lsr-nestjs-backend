import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { DBJdr } from '../../jdr/database/DBJdr'

@Entity({ name: 'jdr_class' })
export class DBJdrClass {
  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @ManyToOne(() => DBJdr, (jdr) => jdr.classes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jdrSlug' })
  jdr: DBJdr

  @PrimaryColumn({ type: 'varchar' })
  slug: string

  @Column({ type: 'varchar', nullable: false })
  name: string

  @Column({ type: 'varchar', nullable: false, default: '' })
  text: string

  @Column({ type: 'simple-json', nullable: false, default: '[]' })
  levels: string[]
}
