import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { OwnedItem } from '../../../../../domain/src/index'
import { DBJdrCharacter } from './jdr-character.db'

@Entity({ name: 'jdr_character_item' })
export class DBJdrCharacterItem {
  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @PrimaryColumn({ type: 'varchar' })
  characterSlug: string

  @ManyToOne(() => DBJdrCharacter, (character) => character.items, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'jdrSlug', referencedColumnName: 'jdrSlug' }, { name: 'characterSlug', referencedColumnName: 'slug' }])
  character: DBJdrCharacter

  @PrimaryColumn({ type: 'varchar' })
  itemSlug: string

  @Column({ type: 'int', nullable: false, default: 1 })
  quantity: number

  static toOwnedItem(db: DBJdrCharacterItem): OwnedItem {
    return new OwnedItem({ itemSlug: db.itemSlug, quantity: db.quantity })
  }
}

export type DBJdrCharacterItemToCreate = Pick<DBJdrCharacterItem, 'jdrSlug' | 'characterSlug' | 'itemSlug' | 'quantity'>
