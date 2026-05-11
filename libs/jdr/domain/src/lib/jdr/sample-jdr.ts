import { Character } from '../characters/Character'
import { Item } from '../items/Item'
import { OwnedItem } from '../items/OwnedItem'
import { CharacterResource } from '../resources/CharacterResource'
import { GroupResourceValue } from '../resources/GroupResourceValue'
import { Resource } from '../resources/Resource'
import { ResourceType } from '../resources/ResourceType'
import { Slug } from '../shared/Slug'
import { CharacterStat } from '../stats/CharacterStat'
import { Stat } from '../stats/Stat'
import { TraitStatModifier } from '../stats/TraitStatModifier'
import { Trait } from '../traits/Trait'
import { TraitType } from '../traits/TraitType'
import { Jdr } from './Jdr'

export const createSampleJdr = (): Jdr => {
  const jdrName = 'Chroniques Brumeuses'
  const jdrSlug = Slug.from(jdrName)

  const force = new Stat({ jdrSlug, name: 'Force' })
  const intelligence = new Stat({ jdrSlug, name: 'Intelligence' })

  const robuste = new Trait({
    jdrSlug,
    name: 'Robuste',
    type: TraitType.NORMAL,
    modifiers: [new TraitStatModifier({ statSlug: force.slug, value: 1 })]
  })

  const lourd = new Trait({
    jdrSlug,
    name: 'Lourd',
    type: TraitType.OBJET,
    modifiers: [new TraitStatModifier({ statSlug: force.slug, value: -1 })]
  })

  const pointsDeDestin = new Resource({ jdrSlug, name: 'Points de destin', type: ResourceType.ALL })
  const orDuGroupe = new Resource({ jdrSlug, name: 'Or du groupe', type: ResourceType.GROUP })

  // Item catalog
  const armureLourde = new Item({ jdrSlug, name: 'Armure lourde', traitSlug: lourd.slug, unique: true })
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
    resources: [new CharacterResource({ resourceSlug: pointsDeDestin.slug, value: 2 })]
  })

  return new Jdr({
    name: jdrName,
    slug: jdrSlug,
    text: 'JdR de test pour valider le domain.',
    stats: [force, intelligence],
    traits: [robuste, lourd],
    resources: [pointsDeDestin, orDuGroupe],
    groupResources: [new GroupResourceValue({ resourceSlug: orDuGroupe.slug, value: 100 })],
    items: [armureLourde, potionDeSoin, charretteCommune],
    groupItems: [new OwnedItem({ itemSlug: charretteCommune.slug })],
    characters: [alice]
  })
}