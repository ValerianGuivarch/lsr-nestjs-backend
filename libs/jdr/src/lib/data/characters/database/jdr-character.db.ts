import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { DBJdr } from '../../jdr/database/DBJdr'
import { DBJdrCharacterStat } from './jdr-character-stat.db'
import { DBJdrCharacterTrait } from './jdr-character-trait.db'
import { DBJdrCharacterItem } from './jdr-character-item.db'
import { DBJdrCharacterResource } from './jdr-character-resource.db'
import { DBJdrCharacterGroup } from './jdr-character-group.db'

@Entity({ name: 'jdr_character' })
export class DBJdrCharacter {
  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  jdrSlug: string

  @ManyToOne(() => DBJdr, (jdr) => jdr.characters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jdrSlug' })
  jdr: DBJdr

  @PrimaryColumn({ type: 'varchar' })
  slug: string

  @Column({ type: 'varchar', nullable: false })
  name: string

  @Column({ type: 'varchar', nullable: true })
  classSlug: string | null

  @Column({ type: 'varchar', nullable: true })
  groupSlug: string | null

  @Column({ type: 'int', nullable: false, default: 1 })
  classLevel: number

  @Column({ type: 'boolean', nullable: false, default: false })
  isPlayable: boolean

  @Column({ type: 'varchar', nullable: false, default: '' })
  text: string

  @OneToMany(() => DBJdrCharacterStat, (cs) => cs.character, { cascade: true })
  stats: DBJdrCharacterStat[]

  @OneToMany(() => DBJdrCharacterTrait, (ct) => ct.character, { cascade: true })
  traits: DBJdrCharacterTrait[]

  @OneToMany(() => DBJdrCharacterItem, (ci) => ci.character, { cascade: true })
  items: DBJdrCharacterItem[]

  @OneToMany(() => DBJdrCharacterResource, (cr) => cr.character, { cascade: true })
  resources: DBJdrCharacterResource[]

  @OneToMany(() => DBJdrCharacterGroup, (cg) => cg.character, { cascade: true })
  groups: DBJdrCharacterGroup[]

  static readonly RELATIONS = {
    stats: true,
    traits: true,
    items: true,
    resources: true,
    groups: true
  }
}

export type DBJdrCharacterToCreate = Pick<DBJdrCharacter, 'jdrSlug' | 'slug' | 'name' | 'classSlug' | 'groupSlug' | 'isPlayable' | 'text'>
export type DBJdrCharacterToUpdate = Partial<Pick<DBJdrCharacter, 'name' | 'classSlug' | 'groupSlug' | 'isPlayable' | 'text'>> & Pick<DBJdrCharacter, 'updatedDate'>
