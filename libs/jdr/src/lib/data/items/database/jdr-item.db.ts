import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { DBJdr } from '../../jdr/database/DBJdr'
import { DBJdrItemModifier } from './jdr-item-modifier.db'

@Entity({ name: 'jdr_item' })
export class DBJdrItem {
  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @ManyToOne(() => DBJdr, (jdr) => jdr.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jdrSlug' })
  jdr: DBJdr

  @PrimaryColumn({ type: 'varchar' })
  slug: string

  @Column({ type: 'varchar', nullable: false })
  name: string

  @Column({ type: 'varchar', nullable: false, default: '' })
  description: string

  @Column({ type: 'boolean', nullable: false, default: true })
  unique: boolean

  @OneToMany(() => DBJdrItemModifier, (modifier) => modifier.item, { cascade: true })
  modifiers: DBJdrItemModifier[]

  static readonly RELATIONS = {
    modifiers: true
  }
}

export type DBJdrItemToCreate = Pick<DBJdrItem, 'jdrSlug' | 'slug' | 'name' | 'description' | 'unique'>

