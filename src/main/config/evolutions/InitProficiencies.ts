import { DBProficiency } from '../../data/database/proficiencies/DBProficiency'
import { DisplayCategory } from '../../domain/models/characters/DisplayCategory'
import { Injectable } from '@nestjs/common'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class InitProficiencies {
  static getProficiencies(): DBProficiency[] {
    return []
  }
  static createProficiency(p: {
    name: string
    shortName: string
    category: DisplayCategory
    description?: string
    minLevel?: number
  }): Omit<DBProficiency, 'id'> {
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
