import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { DBJdrCharacter } from './jdr-character.db'

@Entity({ name: 'jdr_character_stat' })
export class DBJdrCharacterStat {
  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
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
}

export type DBJdrCharacterStatToCreate = Pick<DBJdrCharacterStat, 'jdrSlug' | 'characterSlug' | 'statSlug' | 'value'>
