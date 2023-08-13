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
    const newProficiencies = [lumiereSagesse, lumiereCharisme]
    return newProficiencies
  }
  static createProficiency(p: {
    name: string
    shortName: string
    category: DisplayCategory
    minLevel?: number
  }): DBProficiency {
    return {
      name: p.name,
      shortName: p.shortName,
      displayCategory: p.category,
      minLevel: p.minLevel || 1
    }
  }
}
