import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { DBJdrItem } from './jdr-item.db'
import { DBJdrStat } from '../../stats/database/jdr-stat.db'

@Entity({ name: 'jdr_item_modifier' })
export class DBJdrItemModifier {
  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @PrimaryColumn({ type: 'varchar' })
  itemSlug: string

  @ManyToOne(() => DBJdrItem, (item) => item.modifiers, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'jdrSlug', referencedColumnName: 'jdrSlug' },
    { name: 'itemSlug', referencedColumnName: 'slug' }
  ])
  item: DBJdrItem

  @PrimaryColumn({ type: 'varchar' })
  statSlug: string

  @ManyToOne(() => DBJdrStat, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'jdrSlug', referencedColumnName: 'jdrSlug' },
    { name: 'statSlug', referencedColumnName: 'slug' }
  ])
  stat: DBJdrStat

  @Column({ type: 'int', nullable: false })
  value: number
}

export type DBJdrItemModifierToCreate = Pick<DBJdrItemModifier, 'jdrSlug' | 'itemSlug' | 'statSlug' | 'value'>
