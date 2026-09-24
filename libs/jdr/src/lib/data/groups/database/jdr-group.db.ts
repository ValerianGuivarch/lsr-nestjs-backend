import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm'
import { DBJdr } from '../../jdr/database/DBJdr'
import { DBJdrGroupResource } from '../../resources/database/jdr-group-resource.db'

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

  @OneToMany(() => DBJdrGroupResource, (resource) => resource.group, { cascade: true })
  resources: DBJdrGroupResource[]

  static readonly RELATIONS = { resources: true }
}
