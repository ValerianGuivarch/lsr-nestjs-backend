import { Character } from '../characters/Character'
import { Item } from '../items/Item'
import { OwnedItem } from '../items/OwnedItem'
import { CharacterResource } from '../resources/CharacterResource'
import { GroupResource } from '../resources/GroupResource'
import { Resource } from '../resources/Resource'
import { ResourceOwnerType } from '../resources/ResourceType'
import { Slug } from '../shared/Slug'
import { CharacterStat } from '../stats/CharacterStat'
import { Stat } from '../stats/Stat'
import { StatModifier } from '../stats/StatModifier'
import { Trait } from '../traits/Trait'
import { TraitType } from '../traits/TraitType'
import { Jdr } from './Jdr'
import { JdrGroup } from '../groups/JdrGroup'

export const createSampleJdr = (): Jdr => {
  const jdrName = 'Chroniques Brumeuses'
  const jdrSlug = Slug.from(jdrName)

  const force = new Stat({ jdrSlug, name: 'Force' })
  const intelligence = new Stat({ jdrSlug, name: 'Intelligence' })

  const robusteSlug = Slug.from('Robuste')
  const robuste: Trait = {
    jdrSlug,
    name: 'Robuste',
    slug: robusteSlug,
    type: TraitType.NORMAL,
    level: null,
    data: null,
    modifiers: [new StatModifier({ statSlug: force.slug, value: 1 })]
  }

  const pointsDeDestin = new Resource({ jdrSlug, name: 'Points de destin', ownerType: ResourceOwnerType.CHARACTER })
  const orDuGroupe = new Resource({ jdrSlug, name: 'Or du groupe', ownerType: ResourceOwnerType.GROUP })
  const aventuriers = new JdrGroup({
    jdrSlug,
    name: 'Aventuriers',
    resources: [new GroupResource({ resourceSlug: orDuGroupe.slug, name: orDuGroupe.name, value: 100 })]
  })

  // Item catalog
  const armureLourde = new Item({
    jdrSlug,
    name: 'Armure lourde',
    unique: true,
    modifiers: [new StatModifier({ statSlug: force.slug, value: -1 })]
  })
  const potionDeSoin = new Item({ jdrSlug, name: 'Potion de soin', unique: false })
  const charretteCommune = new Item({ jdrSlug, name: 'Charrette commune', unique: true })

  const alice = new Character({
    jdrSlug,
    name: 'Alice',
    stats: [
      new CharacterStat({ statSlug: force.slug, value: 3 }),
      new CharacterStat({ statSlug: intelligence.slug, value: 2 })
    ],
    traitSlugs: [robuste.slug],
    items: [
      new OwnedItem({ itemSlug: armureLourde.slug }),
      new OwnedItem({ itemSlug: potionDeSoin.slug, quantity: 3 })
    ],
    resources: [new CharacterResource({ resourceSlug: pointsDeDestin.slug, name: pointsDeDestin.name, value: 2 })]
  })

  return new Jdr({
    name: jdrName,
    slug: jdrSlug,
    text: 'JdR de test pour valider le domain.',
    stats: [force, intelligence],
    traits: [robuste],
    resources: [pointsDeDestin, orDuGroupe],
    items: [armureLourde, potionDeSoin, charretteCommune],
    groupItems: [new OwnedItem({ itemSlug: charretteCommune.slug })],
    characters: [alice],
    groups: [aventuriers]
  })
}
