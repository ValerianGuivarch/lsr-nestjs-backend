import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { CharacterStat } from '../../../../../domain/src/index'
import { DBJdrCharacter } from './jdr-character.db'

@Entity({ name: 'jdr_character_stat' })
export class DBJdrCharacterStat {
  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @PrimaryColumn({ type: 'varchar' })
  characterSlug: string

  @ManyToOne(() => DBJdrCharacter, (character) => character.stats, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'jdrSlug', referencedColumnName: 'jdrSlug' }, { name: 'characterSlug', referencedColumnName: 'slug' }])
  character: DBJdrCharacter

  @PrimaryColumn({ type: 'varchar' })
  statSlug: string

  @Column({ type: 'int', nullable: false, default: 2 })
  value: number

  static toCharacterStat(db: DBJdrCharacterStat): CharacterStat {
    return new CharacterStat({ statSlug: db.statSlug, value: db.value })
  }
}

export type DBJdrCharacterStatToCreate = Pick<DBJdrCharacterStat, 'jdrSlug' | 'characterSlug' | 'statSlug' | 'value'>
