import { Character } from '../characters/Character'
import { JdrClass } from '../classes/JdrClass'
import { JdrGroup } from '../groups/JdrGroup'
import { Item } from '../items/Item'
import { OwnedItem } from '../items/OwnedItem'
import { Player } from '../players/Player'
import { Resource } from '../resources/Resource'
import { ResourceOwnerType } from '../resources/ResourceType'
import { Slug } from '../shared/Slug'
import { Stat } from '../stats/Stat'
import { Trait } from '../traits/Trait'
import { JdrText } from './JdrText'

export class Jdr {
  name: string
  slug: string
  text: JdrText
  stats: Stat[]
  traits: Trait[]
  resources: Resource[]
  items: Item[]
  groupItems: OwnedItem[]
  characters: Character[]
  players: Player[]
  classes: JdrClass[]
  groups: JdrGroup[]

  constructor(p: {
    name: string
    slug?: string
    text?: string
    stats?: Stat[]
    traits?: Trait[]
    resources?: Resource[]
    items?: Item[]
    groupItems?: OwnedItem[]
    characters?: Character[]
    players?: Player[]
    classes?: JdrClass[]
    groups?: JdrGroup[]
  }) {
    this.name = p.name
    this.slug = p.slug ?? Slug.from(p.name)
    this.text = new JdrText(p.text)
    this.stats = p.stats ?? []
    this.traits = p.traits ?? []
    this.resources = p.resources ?? []
    this.items = p.items ?? []
    this.groupItems = p.groupItems ?? []
    this.characters = p.characters ?? []
    this.players = p.players ?? []
    this.classes = p.classes ?? []
    this.groups = p.groups ?? []

    Slug.assertValid(this.slug)
    this.assertInvariants()
  }

  assertInvariants(): void {
    // Ownership: root entities must belong to this JdR
    this.stats.forEach((stat) => this.assertOwnedByCurrentJdr(stat.jdrSlug, `stat ${stat.slug}`))
    this.traits.forEach((trait) => this.assertOwnedByCurrentJdr(trait.jdrSlug, `trait ${trait.slug}`))
    this.resources.forEach((resource) => this.assertOwnedByCurrentJdr(resource.jdrSlug, `resource ${resource.slug}`))
    this.items.forEach((item) => this.assertOwnedByCurrentJdr(item.jdrSlug, `item ${item.slug}`))
    this.characters.forEach((character) =>
      this.assertOwnedByCurrentJdr(character.jdrSlug, `character ${character.slug}`)
    )
    this.players.forEach((player) => this.assertOwnedByCurrentJdr(player.jdrSlug, `player ${player.slug}`))
    this.classes.forEach((clazz) => this.assertOwnedByCurrentJdr(clazz.jdrSlug, `class ${clazz.slug}`))
    this.groups.forEach((group) => this.assertOwnedByCurrentJdr(group.jdrSlug, `group ${group.slug}`))

    // Slug uniqueness within JdR
    this.assertUnique(
      this.stats.map((s) => s.slug),
      'stat slug must be unique in JdR'
    )
    this.assertUnique(
      this.traits.map((t) => t.slug),
      'trait slug must be unique in JdR'
    )
    this.assertUnique(
      this.resources.map((r) => r.slug),
      'resource slug must be unique in JdR'
    )
    this.assertUnique(
      this.items.map((i) => i.slug),
      'item slug must be unique in JdR'
    )
    this.assertUnique(
      this.characters.map((c) => c.slug),
      'character slug must be unique in JdR'
    )
    this.assertUnique(
      this.players.map((p) => p.slug),
      'player slug must be unique in JdR'
    )
    this.assertUnique(
      this.classes.map((c) => c.slug),
      'class slug must be unique in JdR'
    )
    this.assertUnique(
      this.groups.map((g) => g.slug),
      'group slug must be unique in JdR'
    )

    const statSlugs = new Set(this.stats.map((s) => s.slug))
    const traitMap = new Map(this.traits.map((t) => [t.slug, t]))
    const itemMap = new Map(this.items.map((i) => [i.slug, i]))
    const classMap = new Map(this.classes.map((c) => [c.slug, c]))
    const groupMap = new Map(this.groups.map((g) => [g.slug, g]))
    const playerMap = new Map(this.players.map((p) => [p.slug, p]))

    // Trait modifiers must reference known stats
    this.traits.forEach((trait) => {
      trait.modifiers.forEach((modifier) => {
        if (!statSlugs.has(modifier.statSlug)) {
          throw new Error(`Trait ${trait.slug} references unknown stat ${modifier.statSlug}`)
        }
      })
    })

    // Item catalog: modifiers must reference known stats
    this.items.forEach((item) => {
      item.modifiers.forEach((modifier) => {
        if (!statSlugs.has(modifier.statSlug)) {
          throw new Error(`Item ${item.slug} references unknown stat ${modifier.statSlug}`)
        }
      })
    })

    const characterResourceSlugs = this.resources
      .filter((r) => r.ownerType === ResourceOwnerType.CHARACTER)
      .map((r) => r.slug)
    const groupResourceSlugs = this.resources.filter((r) => r.ownerType === ResourceOwnerType.GROUP).map((r) => r.slug)

    // Group item ownerships: item must exist in catalog, quantity must respect unique flag
    this.groupItems.forEach((ownedItem) => {
      const item = itemMap.get(ownedItem.itemSlug)
      if (!item) {
        throw new Error(`group owns unknown item ${ownedItem.itemSlug}`)
      }
      if (item.unique && ownedItem.quantity !== 1) {
        throw new Error(`group owns unique item ${item.slug} with quantity ${ownedItem.quantity}, must be 1`)
      }
    })

    this.characters.forEach((character) => {
      // Stats: exactly one value per JdR stat
      this.assertSameSet(
        [...statSlugs],
        character.stats.map((stat) => stat.statSlug),
        `character ${character.slug} must have exactly one value for each stat`
      )

      if (character.classSlug && !classMap.has(character.classSlug)) {
        throw new Error(`character ${character.slug} references unknown class ${character.classSlug}`)
      }
      if (character.playerSlug && !playerMap.has(character.playerSlug)) {
        throw new Error(`character ${character.slug} references unknown player ${character.playerSlug}`)
      }
      if (character.classLevel) {
        const clazz = character.classSlug ? classMap.get(character.classSlug) : undefined
        if (!clazz) throw new Error(`character ${character.slug} has a class level without a class`)
        if (!clazz.levels.includes(character.classLevel)) {
          throw new Error(`character ${character.slug} references unknown level ${character.classLevel}`)
        }
      }

      character.groupSlugs.forEach((groupSlug) => {
        if (!groupMap.has(groupSlug)) {
          throw new Error(`character ${character.slug} references unknown group ${groupSlug}`)
        }
      })

      // Traits: must exist in JdR
      character.traitSlugs.forEach((traitSlug) => {
        if (!traitMap.has(traitSlug)) {
          throw new Error(`character ${character.slug} references unknown trait ${traitSlug}`)
        }
      })

      // Items: must exist in catalog, quantity must respect unique flag
      character.items.forEach((ownedItem) => {
        const item = itemMap.get(ownedItem.itemSlug)
        if (!item) {
          throw new Error(`character ${character.slug} owns unknown item ${ownedItem.itemSlug}`)
        }
        if (item.unique && ownedItem.quantity !== 1) {
          throw new Error(
            `character ${character.slug} owns unique item ${item.slug} with quantity ${ownedItem.quantity}, must be 1`
          )
        }
      })

      const characterResourceValues = character.resources.map((r) => r.resourceSlug)
      this.assertUnique(characterResourceValues, `character ${character.slug} resource slug must be unique`)
      groupResourceSlugs.forEach((resourceSlug) => {
        if (characterResourceValues.includes(resourceSlug)) {
          throw new Error(`character ${character.slug} cannot own group resource ${resourceSlug}`)
        }
      })
      characterResourceSlugs.forEach((resourceSlug) => {
        if (!characterResourceValues.includes(resourceSlug)) {
          throw new Error(`character ${character.slug} must own JdR resource ${resourceSlug}`)
        }
      })
    })

    this.groups.forEach((group) => {
      const values = group.resources.map((r) => r.resourceSlug)
      this.assertUnique(values, `group ${group.slug} resource slug must be unique`)
      characterResourceSlugs.forEach((resourceSlug) => {
        if (values.includes(resourceSlug))
          throw new Error(`group ${group.slug} cannot own character resource ${resourceSlug}`)
      })
      groupResourceSlugs.forEach((resourceSlug) => {
        if (!values.includes(resourceSlug)) throw new Error(`group ${group.slug} must own JdR resource ${resourceSlug}`)
      })
    })
  }

  computeFinalStats(characterSlug: string): Map<string, number> {
    const character = this.characters.find((c) => c.slug === characterSlug)
    if (!character) {
      throw new Error(`unknown character slug: ${characterSlug}`)
    }

    const traitMap = new Map(this.traits.map((trait) => [trait.slug, trait]))
    const itemMap = new Map(this.items.map((item) => [item.slug, item]))
    const result = new Map(character.stats.map((stat) => [stat.statSlug, stat.value]))

    character.traitSlugs.forEach((traitSlug) => {
      const trait = traitMap.get(traitSlug)
      if (!trait) {
        throw new Error(`unknown trait slug: ${traitSlug}`)
      }
      trait.modifiers.forEach((modifier) => {
        const currentValue = result.get(modifier.statSlug) ?? 0
        result.set(modifier.statSlug, currentValue + modifier.value)
      })
    })

    character.items.forEach((ownedItem) => {
      const item = itemMap.get(ownedItem.itemSlug)
      if (!item) {
        throw new Error(`unknown item slug: ${ownedItem.itemSlug}`)
      }
      item.modifiers.forEach((modifier) => {
        const currentValue = result.get(modifier.statSlug) ?? 0
        result.set(modifier.statSlug, currentValue + modifier.value)
      })
    })

    return result
  }

  private assertUnique(values: string[], message: string): void {
    if (new Set(values).size !== values.length) {
      throw new Error(message)
    }
  }

  private assertSameSet(expected: string[], actual: string[], message: string): void {
    this.assertUnique(actual, `${message} (duplicates are not allowed)`)
    const expectedSet = new Set(expected)
    const actualSet = new Set(actual)

    if (expectedSet.size !== actualSet.size) {
      throw new Error(message)
    }

    expectedSet.forEach((value) => {
      if (!actualSet.has(value)) {
        throw new Error(message)
      }
    })
  }

  private assertOwnedByCurrentJdr(entityJdrSlug: string, label: string): void {
    if (entityJdrSlug !== this.slug) {
      throw new Error(`${label} belongs to another JdR (${entityJdrSlug})`)
    }
  }
}
