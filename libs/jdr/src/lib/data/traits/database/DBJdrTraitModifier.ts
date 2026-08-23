import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { DBJdrTrait } from './DBJdrTrait'
import { DBJdrStat } from '../../stats/database/jdr-stat.db'

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
  @JoinColumn([
    { name: 'jdrSlug', referencedColumnName: 'jdrSlug' },
    { name: 'traitSlug', referencedColumnName: 'slug' }
  ])
  trait: DBJdrTrait

  @PrimaryColumn({ type: 'varchar' })
  statSlug: string

  @ManyToOne(() => DBJdrStat, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'jdrSlug', referencedColumnName: 'jdrSlug' },
    { name: 'statSlug', referencedColumnName: 'slug' }
  ])
  stat: DBJdrStat

  @Column({ type: 'int', nullable: false })
  value: number
}

export type DBJdrTraitModifierToCreate = Pick<DBJdrTraitModifier, 'jdrSlug' | 'traitSlug' | 'statSlug' | 'value'>
