import { DBApotheose } from '../../data/database/apotheoses/DBApotheose'
import { DisplayCategory } from '../../domain/models/characters/DisplayCategory'
import { Injectable } from '@nestjs/common'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class InitApotheoses {
  static getApotheoses(): DBApotheose[] {
    const apotheoseBasic: DBApotheose = this.createApotheose({
      name: 'apotheose',
      shortName: 'apt',
      category: DisplayCategory.MAGIE,
      maxLevel: 9,
      position: 1
    })
    const apotheoseAmelioree: DBApotheose = this.createApotheose({
      name: 'apotheose améliorée',
      shortName: 'apt-am',
      category: DisplayCategory.MAGIE,
      minLevel: 10,
      position: 5
    })
    const apotheoseFinal: DBApotheose = this.createApotheose({
      name: 'apotheose finale',
      shortName: 'apt-fin',
      category: DisplayCategory.MAGIE,
      minLevel: 20,
      position: 10,
      chairImprovement: 5,
      espritImprovement: 5,
      essenceImprovement: 5
    })
    const newApotheoses = [apotheoseBasic, apotheoseAmelioree, apotheoseFinal]
    return newApotheoses
  }

  static createApotheose(p: {
    name: string
    shortName: string
    category: DisplayCategory
    position: number
    minLevel?: number
    maxLevel?: number
    cost?: number
    chairImprovement?: number
    espritImprovement?: number
    essenceImprovement?: number
    arcaneImprovement?: boolean
    avantage?: boolean
    apotheoseEffect?: string[]
  }): DBApotheose {
    return {
      name: p.name,
      shortName: p.shortName,
      displayCategory: p.category,
      position: p.position,
      // eslint-disable-next-line no-magic-numbers
      maxLevel: p.maxLevel || 100,
      minLevel: p.minLevel || 1,
      // eslint-disable-next-line no-magic-numbers
      cost: p.cost || 3,
      // eslint-disable-next-line no-magic-numbers
      chairImprovement: p.chairImprovement || 3,
      // eslint-disable-next-line no-magic-numbers
      espritImprovement: p.espritImprovement || 3,
      // eslint-disable-next-line no-magic-numbers
      essenceImprovement: p.essenceImprovement || 3,
      arcaneImprovement: p.arcaneImprovement || false,
      avantage: p.avantage || false,
      apotheoseEffect: p.apotheoseEffect || [
        'perd le contrôle',
        'garde le contrôle',
        'garde le contrôle',
        'garde le contrôle',
        'garde le contrôle',
        'garde le contrôle'
      ]
    }
  }
}
