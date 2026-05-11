import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Character } from '../../../../../domain/src/index'
import { DBJdr } from './jdr.db'
import { DBJdrCharacterStat } from './jdr-character-stat.db'
import { DBJdrCharacterTrait } from './jdr-character-trait.db'
import { DBJdrCharacterItem } from './jdr-character-item.db'
import { DBJdrCharacterResource } from './jdr-character-resource.db'

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

  static readonly RELATIONS = {
    stats: true,
    traits: true,
    items: true,
    resources: true
  }

  static toCharacter(db: DBJdrCharacter): Character {
    return new Character({
      jdrSlug: db.jdrSlug,
      name: db.name,
      slug: db.slug,
      classSlug: db.classSlug ?? undefined,
      groupSlug: db.groupSlug ?? undefined,
      text: db.text,
      stats: (db.stats ?? []).map(DBJdrCharacterStat.toCharacterStat),
      traitSlugs: (db.traits ?? []).map((ct) => ct.traitSlug),
      items: (db.items ?? []).map(DBJdrCharacterItem.toOwnedItem),
      resources: (db.resources ?? []).map(DBJdrCharacterResource.toCharacterResource)
    })
  }
}

export type DBJdrCharacterToCreate = Pick<DBJdrCharacter, 'jdrSlug' | 'slug' | 'name' | 'classSlug' | 'groupSlug' | 'text'>
export type DBJdrCharacterToUpdate = Partial<Pick<DBJdrCharacter, 'name' | 'classSlug' | 'groupSlug' | 'text'>> & Pick<DBJdrCharacter, 'updatedDate'>
