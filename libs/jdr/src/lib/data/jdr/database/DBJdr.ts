import { Entity, Column, PrimaryColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { DBJdrStat } from '../../stats/database/jdr-stat.db'
import { DBJdrTrait } from '../../traits/database/DBJdrTrait'
import { DBJdrResource } from '../../resources/database/jdr-resource.db'
import { DBJdrGroupResource } from '../../resources/database/jdr-group-resource.db'
import { DBJdrItem } from '../../items/database/jdr-item.db'
import { DBJdrGroupItem } from '../../items/database/jdr-group-item.db'
import { DBJdrCharacter } from '../../characters/database/jdr-character.db'
import { DBJdrClass } from '../../classes/database/jdr-class.db'
import { DBJdrGroup } from '../../groups/database/jdr-group.db'

@Entity({ name: 'jdr' })
export class DBJdr {
  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  slug: string

  @Column({ type: 'varchar', nullable: false })
  name: string

  @Column({ type: 'varchar', nullable: false, default: '' })
  text: string

  @OneToMany(() => DBJdrStat, (stat) => stat.jdr, { cascade: true })
  stats: DBJdrStat[]

  @OneToMany(() => DBJdrTrait, (trait) => trait.jdr, { cascade: true })
  traits: DBJdrTrait[]

  @OneToMany(() => DBJdrResource, (resource) => resource.jdr, { cascade: true })
  resources: DBJdrResource[]

  @OneToMany(() => DBJdrGroupResource, (gr) => gr.jdr, { cascade: true })
  groupResources: DBJdrGroupResource[]

  @OneToMany(() => DBJdrItem, (item) => item.jdr, { cascade: true })
  items: DBJdrItem[]

  @OneToMany(() => DBJdrGroupItem, (gi) => gi.jdr, { cascade: true })
  groupItems: DBJdrGroupItem[]

  @OneToMany(() => DBJdrCharacter, (character) => character.jdr, { cascade: true })
  characters: DBJdrCharacter[]

  @OneToMany(() => DBJdrClass, (clazz) => clazz.jdr, { cascade: true })
  classes: DBJdrClass[]

  @OneToMany(() => DBJdrGroup, (group) => group.jdr, { cascade: true })
  groups: DBJdrGroup[]

  static readonly RELATIONS = {
    stats: true,
    traits: { modifiers: true },
    resources: true,
    groupResources: true,
    items: { modifiers: true },
    groupItems: true,
    characters: {
      stats: true,
      traits: true,
      items: true,
      resources: true,
      groups: true
    },
    classes: { resources: true },
    groups: true
  }
}

export type DBJdrToCreate = Pick<DBJdr, 'slug' | 'name' | 'text'>
export type DBJdrToUpdate = Partial<Pick<DBJdr, 'name' | 'text'>> & Pick<DBJdr, 'updatedDate'>
