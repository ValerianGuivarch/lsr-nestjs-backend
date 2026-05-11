import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { OwnedItem } from '../../../../../domain/src/index'
import { DBJdr } from './jdr.db'
import { DBJdrItem } from './jdr-item.db'

@Entity({ name: 'jdr_group_item' })
export class DBJdrGroupItem {
  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @ManyToOne(() => DBJdr, (jdr) => jdr.groupItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jdrSlug' })
  jdr: DBJdr

  @PrimaryColumn({ type: 'varchar' })
  itemSlug: string

  @ManyToOne(() => DBJdrItem, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'jdrSlug', referencedColumnName: 'jdrSlug' }, { name: 'itemSlug', referencedColumnName: 'slug' }])
  item: DBJdrItem

  @Column({ type: 'int', nullable: false, default: 1 })
  quantity: number

  static toOwnedItem(db: DBJdrGroupItem): OwnedItem {
    return new OwnedItem({ itemSlug: db.itemSlug, quantity: db.quantity })
  }
}

export type DBJdrGroupItemToCreate = Pick<DBJdrGroupItem, 'jdrSlug' | 'itemSlug' | 'quantity'>
