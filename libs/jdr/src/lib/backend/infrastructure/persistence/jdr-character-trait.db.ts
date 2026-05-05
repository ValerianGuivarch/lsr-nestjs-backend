import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { DBJdrCharacter } from './jdr-character.db'

@Entity({ name: 'jdr_character_trait' })
export class DBJdrCharacterTrait {
  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @PrimaryColumn({ type: 'varchar' })
  characterSlug: string

  @ManyToOne(() => DBJdrCharacter, (character) => character.traits, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'jdrSlug', referencedColumnName: 'jdrSlug' }, { name: 'characterSlug', referencedColumnName: 'slug' }])
  character: DBJdrCharacter

  @PrimaryColumn({ type: 'varchar' })
  traitSlug: string
}

export type DBJdrCharacterTraitToCreate = Pick<DBJdrCharacterTrait, 'jdrSlug' | 'characterSlug' | 'traitSlug'>
