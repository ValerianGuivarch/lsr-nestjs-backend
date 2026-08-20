import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { TraitType } from '../../../domain/traits/TraitType'
import { DBJdr } from '../../jdr/database/DBJdr'
import { DBJdrTraitModifier } from './DBJdrTraitModifier'

@Entity({ name: 'jdr_trait' })
export class DBJdrTrait {
  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @ManyToOne(() => DBJdr, (jdr) => jdr.traits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jdrSlug' })
  jdr: DBJdr

  @PrimaryColumn({ type: 'varchar' })
  slug: string

  @Column({ type: 'varchar', nullable: false })
  name: string

  @Column({ type: 'varchar', nullable: false })
  type: TraitType

  @Column({ type: 'int', nullable: true })
  level: number | null

  @Column({ type: 'simple-json', nullable: true })
  data: Record<string, unknown> | null

  @OneToMany(() => DBJdrTraitModifier, (modifier) => modifier.trait, { cascade: true })
  modifiers: DBJdrTraitModifier[]

  static readonly RELATIONS = {
    modifiers: true
  }
}

export type DBJdrTraitToCreate = Pick<DBJdrTrait, 'jdrSlug' | 'slug' | 'name' | 'type' | 'level' | 'data'>
