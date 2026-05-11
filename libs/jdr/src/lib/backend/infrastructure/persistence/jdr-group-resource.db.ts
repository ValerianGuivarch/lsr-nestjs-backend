import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { GroupResourceValue } from '../../../../../domain/src/index'
import { DBJdr } from './jdr.db'
import { DBJdrResource } from './jdr-resource.db'

@Entity({ name: 'jdr_group_resource' })
export class DBJdrGroupResource {
  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @ManyToOne(() => DBJdr, (jdr) => jdr.groupResources, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jdrSlug' })
  jdr: DBJdr

  @PrimaryColumn({ type: 'varchar' })
  resourceSlug: string

  @ManyToOne(() => DBJdrResource, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'jdrSlug', referencedColumnName: 'jdrSlug' }, { name: 'resourceSlug', referencedColumnName: 'slug' }])
  resource: DBJdrResource

  @Column({ type: 'int', nullable: false, default: 0 })
  value: number

  static toGroupResourceValue(db: DBJdrGroupResource): GroupResourceValue {
    return new GroupResourceValue({ resourceSlug: db.resourceSlug, value: db.value })
  }
}

export type DBJdrGroupResourceToCreate = Pick<DBJdrGroupResource, 'jdrSlug' | 'resourceSlug' | 'value'>
