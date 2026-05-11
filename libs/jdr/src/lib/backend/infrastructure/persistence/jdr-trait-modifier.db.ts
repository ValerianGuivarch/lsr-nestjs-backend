import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { TraitStatModifier } from '../../../../../domain/src/index'
import { DBJdrTrait } from './jdr-trait.db'

@Entity({ name: 'jdr_trait_modifier' })
export class DBJdrTraitModifier {
  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @PrimaryColumn({ type: 'varchar' })
  traitSlug: string

  @ManyToOne(() => DBJdrTrait, (trait) => trait.modifiers, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'jdrSlug', referencedColumnName: 'jdrSlug' }, { name: 'traitSlug', referencedColumnName: 'slug' }])
  trait: DBJdrTrait

  @PrimaryColumn({ type: 'varchar' })
  statSlug: string

  @Column({ type: 'int', nullable: false })
  value: number

  static toTraitStatModifier(db: DBJdrTraitModifier): TraitStatModifier {
    return new TraitStatModifier({ statSlug: db.statSlug, value: db.value })
  }
}

export type DBJdrTraitModifierToCreate = Pick<DBJdrTraitModifier, 'jdrSlug' | 'traitSlug' | 'statSlug' | 'value'>
