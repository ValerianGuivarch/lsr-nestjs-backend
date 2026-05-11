import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { CharacterResource } from '../../../../../domain/src/index'
import { DBJdrCharacter } from './jdr-character.db'

@Entity({ name: 'jdr_character_resource' })
export class DBJdrCharacterResource {
  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @PrimaryColumn({ type: 'varchar' })
  characterSlug: string

  @ManyToOne(() => DBJdrCharacter, (character) => character.resources, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'jdrSlug', referencedColumnName: 'jdrSlug' }, { name: 'characterSlug', referencedColumnName: 'slug' }])
  character: DBJdrCharacter

  @PrimaryColumn({ type: 'varchar' })
  resourceSlug: string

  @Column({ type: 'int', nullable: false, default: 0 })
  value: number

  static toCharacterResource(db: DBJdrCharacterResource): CharacterResource {
    return new CharacterResource({ resourceSlug: db.resourceSlug, value: db.value })
  }
}

export type DBJdrCharacterResourceToCreate = Pick<DBJdrCharacterResource, 'jdrSlug' | 'characterSlug' | 'resourceSlug' | 'value'>
