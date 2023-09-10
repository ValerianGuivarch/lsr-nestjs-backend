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
      description:
        'donne +3 à chaque stat et 2 actions par tour, au coût de 3 pierres par tour et une perte de contrôle à 1/6',
      category: DisplayCategory.MAGIE,
      maxLevel: 9,
      position: 1
    })
    const apotheoseAmelioree: DBApotheose = this.createApotheose({
      name: 'apotheose améliorée',
      shortName: 'apt-am',
      description:
        'donne +3 à chaque stat, 2 actions par tour et un effet magique lié à sa lignée, au coût de 3 pierres par tour et une perte de contrôle à 1/6',
      category: DisplayCategory.MAGIE,
      minLevel: 10,
      position: 5
    })
    const apotheoseFinal: DBApotheose = this.createApotheose({
      name: 'apotheose finale',
      shortName: 'apt-fin',
      description:
        'donne +5 à chaque stat et 2 actions par tour, au coût de 3 pierres par tour et une perte de contrôle perpétuelle',
      category: DisplayCategory.MAGIE,
      minLevel: 20,
      position: 10,
      chairImprovement: 5,
      espritImprovement: 5,
      essenceImprovement: 5,
      apotheoseEffect: []
    })
    const apotheoseArcanique: DBApotheose = this.createApotheose({
      name: 'apotheose arcanique',
      shortName: 'apt-arc',
      description:
        'donne +2 à chaque stat et 2 actions par tour, au coût de 2 pierres par tour et une perte de contrôle à 1/6',
      category: DisplayCategory.MAGIE,
      minLevel: 1,
      position: 10,
      chairImprovement: 2,
      espritImprovement: 2,
      essenceImprovement: 2,
      cost: 2
    })
    const apotheoseArcaniqueFinale: DBApotheose = this.createApotheose({
      name: 'apotheose arcanique finale',
      shortName: 'apt-arc',
      description:
        'donne +3 à chaque stat et 3 actions par tour, au coût de 3 pierres par tour et une perte de contrôle perpétuelle',
      category: DisplayCategory.MAGIE,
      minLevel: 20,
      position: 11,
      chairImprovement: 3,
      espritImprovement: 3,
      essenceImprovement: 3,
      cost: 3
    })
    const apotheosePacifcatorWeapon: DBApotheose = this.createApotheose({
      name: 'apotheose pacificator weapon',
      shortName: 'apt-pac-weap',
      description:
        "donne +5 à chaque stat, 2 actions par tour et attaque avc avantage, au coût de 3 pierres par tour et avec obligation d'attaquer",
      category: DisplayCategory.MAGIE,
      minLevel: 20,
      position: 11,
      chairImprovement: 5,
      espritImprovement: 5,
      essenceImprovement: 5,
      cost: 3,
      avantage: true
    })
    const newApotheoses = [
      apotheoseBasic,
      apotheoseAmelioree,
      apotheoseFinal,
      apotheoseArcanique,
      apotheoseArcaniqueFinale,
      apotheosePacifcatorWeapon
    ]
    return newApotheoses
  }

  static createApotheose(p: {
    name: string
    shortName: string
    description?: string
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
      description: p.description,
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
