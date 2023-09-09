import { DBProficiency } from '../../data/database/proficiencies/DBProficiency'
import { DisplayCategory } from '../../domain/models/characters/DisplayCategory'
import { Injectable } from '@nestjs/common'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class InitProficiencies {
  static getProficiencies(): DBProficiency[] {
    const lumiereSagesse: DBProficiency = this.createProficiency({
      name: 'sagesse',
      shortName: 'sg',
      category: DisplayCategory.MAGIE,
      minLevel: 1
    })
    const lumiereCharisme: DBProficiency = this.createProficiency({
      name: 'charisme',
      shortName: 'ka',
      category: DisplayCategory.MAGIE,
      minLevel: 10
    })
    const ventRapidite: DBProficiency = this.createProficiency({
      name: 'rapidité',
      shortName: 'rp',
      category: DisplayCategory.MAGIE,
      minLevel: 10
    })
    const ventAdresse: DBProficiency = this.createProficiency({
      name: 'adresse',
      shortName: 'ad',
      category: DisplayCategory.MAGIE,
      minLevel: 10
    })
    const crainte: DBProficiency = this.createProficiency({
      name: 'crainte',
      shortName: 'ad',
      category: DisplayCategory.MAGIE,
      minLevel: 1,
      description: '1 réussite automatique pour inspirer la crainte'
    })
    const courage: DBProficiency = this.createProficiency({
      name: 'courage',
      shortName: 'cg',
      category: DisplayCategory.MAGIE,
      minLevel: 10,
      description: '1 réussite automatique pour diminuer la peur'
    })
    const negociation: DBProficiency = this.createProficiency({
      name: 'négociation',
      shortName: 'neg',
      category: DisplayCategory.MAGIE,
      minLevel: 1,
      description: '1 réussite automatique pour négocier'
    })
    const arnaque: DBProficiency = this.createProficiency({
      name: 'arnaque',
      shortName: 'arn',
      category: DisplayCategory.MAGIE,
      minLevel: 10,
      description: '1 réussite automatique pour arnaquer'
    })
    const force: DBProficiency = this.createProficiency({
      name: 'force',
      shortName: 'fr',
      category: DisplayCategory.MAGIE,
      minLevel: 1,
      description: '1 réussite automatique pour utiliser sa force'
    })
    const strategie: DBProficiency = this.createProficiency({
      name: 'stratégie',
      shortName: 'str',
      category: DisplayCategory.MAGIE,
      minLevel: 10,
      description: '1 réussite automatique pour établir une stratégie'
    })
    return [
      lumiereSagesse,
      lumiereCharisme,
      ventRapidite,
      ventAdresse,
      crainte,
      courage,
      negociation,
      arnaque,
      force,
      strategie
    ]
  }
  static createProficiency(p: {
    name: string
    shortName: string
    category: DisplayCategory
    description?: string
    minLevel?: number
  }): DBProficiency {
    return {
      name: p.name,
      shortName: p.shortName,
      description: p.description || '',
      displayCategory: p.category,
      minLevel: p.minLevel || 1,
      characters: [],
      classes: [],
      bloodlines: []
    }
  }
}
