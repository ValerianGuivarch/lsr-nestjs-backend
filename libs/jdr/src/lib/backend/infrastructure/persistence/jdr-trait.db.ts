import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Trait, TraitType } from '../../../../../domain/src/index'
import { DBJdr } from './jdr.db'
import { DBJdrTraitModifier } from './jdr-trait-modifier.db'

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

  static toTrait(db: DBJdrTrait): Trait {
    return new Trait({
      jdrSlug: db.jdrSlug,
      name: db.name,
      slug: db.slug,
      type: db.type,
      level: db.level ?? null,
      data: db.data ?? null,
      modifiers: (db.modifiers ?? []).map(DBJdrTraitModifier.toTraitStatModifier)
    })
  }
}

export type DBJdrTraitToCreate = Pick<DBJdrTrait, 'jdrSlug' | 'slug' | 'name' | 'type' | 'level' | 'data'>
