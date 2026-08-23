import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { DBJdrGroup } from '../../groups/database/jdr-group.db'

@Entity({ name: 'jdr_group_resource' })
export class DBJdrGroupResource {
  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @PrimaryColumn({ type: 'varchar' })
  groupSlug: string

  @ManyToOne(() => DBJdrGroup, (group) => group.resources, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'jdrSlug', referencedColumnName: 'jdrSlug' },
    { name: 'groupSlug', referencedColumnName: 'slug' }
  ])
  group: DBJdrGroup

  @PrimaryColumn({ type: 'varchar' })
  resourceSlug: string

  @Column({ type: 'varchar', nullable: false })
  name: string

  @Column({ type: 'int', nullable: false, default: 0 })
  value: number
}

export type DBJdrGroupResourceToCreate = Pick<
  DBJdrGroupResource,
  'jdrSlug' | 'groupSlug' | 'resourceSlug' | 'name' | 'value'
>
