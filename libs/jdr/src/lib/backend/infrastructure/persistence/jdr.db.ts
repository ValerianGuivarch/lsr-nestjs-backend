import { Entity, Column, PrimaryColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Jdr } from '../../../../../domain/src/index'
import { DBJdrStat } from './jdr-stat.db'
import { DBJdrTrait } from './jdr-trait.db'
import { DBJdrResource } from './jdr-resource.db'
import { DBJdrGroupResource } from './jdr-group-resource.db'
import { DBJdrItem } from './jdr-item.db'
import { DBJdrGroupItem } from './jdr-group-item.db'
import { DBJdrCharacter } from './jdr-character.db'
import { DBJdrClass } from './jdr-class.db'
import { DBJdrGroup } from './jdr-group.db'

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
    items: true,
    groupItems: true,
    characters: {
      stats: true,
      traits: true,
      items: true,
      resources: true
    },
    classes: { resources: true },
    groups: true
  }

  static toJdr(db: DBJdr): Jdr {
    return new Jdr({
      name: db.name,
      slug: db.slug,
      text: db.text,
      stats: db.stats.map(DBJdrStat.toStat),
      traits: db.traits.map(DBJdrTrait.toTrait),
      resources: db.resources.map(DBJdrResource.toResource),
      groupResources: db.groupResources.map(DBJdrGroupResource.toGroupResourceValue),
      items: db.items.map(DBJdrItem.toItem),
      groupItems: db.groupItems.map(DBJdrGroupItem.toOwnedItem),
      characters: (db.characters ?? []).map(DBJdrCharacter.toCharacter),
      classes: (db.classes ?? []).map(DBJdrClass.toJdrClass),
      groups: (db.groups ?? []).map(DBJdrGroup.toJdrGroup)
    })
  }
}

export type DBJdrToCreate = Pick<DBJdr, 'slug' | 'name' | 'text'>
export type DBJdrToUpdate = Partial<Pick<DBJdr, 'name' | 'text'>> & Pick<DBJdr, 'updatedDate'>
