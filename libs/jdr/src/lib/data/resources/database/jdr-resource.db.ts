import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { ResourceOwnerType } from '../../../domain'
import { DBJdr } from '../../jdr/database/DBJdr'

@Entity({ name: 'jdr_resource' })
export class DBJdrResource {
  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
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
  ownerType: ResourceOwnerType

  @Column({ type: 'int', nullable: false, default: 0 })
  defaultValue: number
}

export type DBJdrResourceToCreate = Pick<DBJdrResource, 'jdrSlug' | 'slug' | 'name' | 'ownerType' | 'defaultValue'>
