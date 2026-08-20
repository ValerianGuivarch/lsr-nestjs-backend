import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { DBJdrClass } from './jdr-class.db'

@Entity({ name: 'jdr_class_resource' })
export class DBJdrClassResource {
  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @PrimaryColumn({ type: 'varchar' })
  classSlug: string

  @ManyToOne(() => DBJdrClass, (clazz) => clazz.resources, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'jdrSlug', referencedColumnName: 'jdrSlug' }, { name: 'classSlug', referencedColumnName: 'slug' }])
  clazz: DBJdrClass

  @PrimaryColumn({ type: 'varchar' })
  resourceSlug: string

  @Column({ type: 'varchar', nullable: false })
  resourceType: string

  @Column({ type: 'int', nullable: false, default: 0 })
  defaultValue: number

  @Column({ type: 'varchar', nullable: false, default: 'fixed' })
  behavior: 'fixed' | 'scalable'
}
