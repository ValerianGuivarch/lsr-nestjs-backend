import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Item } from '../../../../../domain/src/index'
import { DBJdr } from './jdr.db'

@Entity({ name: 'jdr_item' })
export class DBJdrItem {
  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
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

  @Column({ type: 'varchar', nullable: true })
  traitSlug: string | null

  static toItem(db: DBJdrItem): Item {
    return new Item({
      jdrSlug: db.jdrSlug,
      name: db.name,
      slug: db.slug,
      description: db.description,
      unique: db.unique,
      traitSlug: db.traitSlug ?? undefined
    })
  }
}

export type DBJdrItemToCreate = Pick<DBJdrItem, 'jdrSlug' | 'slug' | 'name' | 'description' | 'unique' | 'traitSlug'>
