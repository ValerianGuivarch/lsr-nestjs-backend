import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { JdrClass } from '../../../../../domain/src/index'
import { DBJdr } from './jdr.db'
import { DBJdrClassResource } from './jdr-class-resource.db'

@Entity({ name: 'jdr_class' })
export class DBJdrClass {
  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @ManyToOne(() => DBJdr, (jdr) => jdr.classes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jdrSlug' })
  jdr: DBJdr

  @PrimaryColumn({ type: 'varchar' })
  slug: string

  @Column({ type: 'varchar', nullable: false })
  name: string

  @Column({ type: 'varchar', nullable: false, default: '' })
  text: string

  @Column({ type: 'int', nullable: false, default: 1 })
  level: number

  @OneToMany(() => DBJdrClassResource, (resource) => resource.clazz, { cascade: true })
  resources: DBJdrClassResource[]

  static readonly RELATIONS = {
    resources: true
  }

  static toJdrClass(db: DBJdrClass): JdrClass {
    return new JdrClass({
      jdrSlug: db.jdrSlug,
      name: db.name,
      slug: db.slug,
      text: db.text,
      level: db.level,
      resources: (db.resources ?? []).map(DBJdrClassResource.toClassResourceProfile)
    })
  }
}
