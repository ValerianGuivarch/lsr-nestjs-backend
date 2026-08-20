import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { DBJdrCharacter } from './jdr-character.db'

@Entity({ name: 'jdr_character_group' })
export class DBJdrCharacterGroup {
  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @PrimaryColumn({ type: 'varchar' })
  characterSlug: string

  @ManyToOne(() => DBJdrCharacter, (character) => character.groups, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'jdrSlug', referencedColumnName: 'jdrSlug' }, { name: 'characterSlug', referencedColumnName: 'slug' }])
  character: DBJdrCharacter

  @PrimaryColumn({ type: 'varchar' })
  groupSlug: string
}
