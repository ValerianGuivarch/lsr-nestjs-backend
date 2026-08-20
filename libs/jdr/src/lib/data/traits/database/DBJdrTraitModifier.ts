import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { DBJdrTrait } from './DBJdrTrait'

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
}

export type DBJdrTraitModifierToCreate = Pick<DBJdrTraitModifier, 'jdrSlug' | 'traitSlug' | 'statSlug' | 'value'>
