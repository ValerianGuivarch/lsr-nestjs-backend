import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Resource, ResourceType } from '../../../../../domain/src/index'
import { DBJdr } from './jdr.db'

@Entity({ name: 'jdr_resource' })
export class DBJdrResource {
  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @ManyToOne(() => DBJdr, (jdr) => jdr.resources, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jdrSlug' })
  jdr: DBJdr

  @PrimaryColumn({ type: 'varchar' })
  slug: string

  @Column({ type: 'varchar', nullable: false })
  name: string

  @Column({ type: 'varchar', nullable: false })
  type: ResourceType

  static toResource(db: DBJdrResource): Resource {
    return new Resource({ jdrSlug: db.jdrSlug, name: db.name, slug: db.slug, type: db.type })
  }
}

export type DBJdrResourceToCreate = Pick<DBJdrResource, 'jdrSlug' | 'slug' | 'name' | 'type'>
