import { BattleState } from './BattleState'
import { Category } from './Category'
import { Genre } from './Genre'

export class Character {
  name: string
  classeName: string
  bloodlineName?: string
  chair: number
  esprit: number
  essence: number
  pv: number
  pvMax: number
  pf: number
  pfMax: number
  pp: number
  ppMax: number
  dettes: number
  arcanes: number
  arcanesMax: number
  niveau: number
  lux: string
  umbra: string
  secunda: string
  notes: string
  category: Category
  apotheoseName?: string
  apotheoseImprovement?: string
  apotheoseImprovementList: string[]
  genre: Genre
  relance: number
  playerName?: string
  picture?: string
  pictureInvocation?: string
  pictureApotheose?: string
  background?: string
  buttonColor?: string
  textColor?: string
  uid?: number
  boosted?: boolean
  battleState: BattleState

  constructor(p: Character) {
    Object.assign(this, p)
  }

  static characterToCreateFactory(p: {
    name: string
    classeName: string
    bloodlineName?: string
    chair: number
    esprit: number
    essence: number
    pvMax: number
    pfMax: number
    ppMax: number
    arcanesMax: number
    niveau: number
    lux: string
    umbra: string
    secunda: string
    category: Category
    genre?: Genre
    picture?: string
    pictureApotheose?: string
    background?: string
    buttonColor?: string
    textColor?: string
  }): CharacterToCreate {
    const defaults = {
      chair: p.chair,
      esprit: p.esprit,
      essence: p.essence,
      pv: p.pvMax,
      pvMax: p.pvMax,
      pf: p.pfMax,
      pfMax: p.pfMax,
      pp: p.ppMax,
      ppMax: p.ppMax,
      // eslint-disable-next-line no-magic-numbers
      dettes: Math.floor(Math.random() * 11),
      arcanes: p.arcanesMax,
      arcanesMax: p.arcanesMax,
      niveau: p.niveau,
      lux: p.lux,
      umbra: p.umbra,
      secunda: p.secunda,
      notes: '',
      category: p.category,
      apotheose: undefined,
      apotheoseImprovementList: [],
      // eslint-disable-next-line no-magic-numbers
      genre: p.genre ? p.genre : Math.random() < 0.5 ? Genre.HOMME : Genre.FEMME,
      relance: 0,
      boosted: false,
      battleState: BattleState.NONE,
      picture: p.picture,
      pictureApotheose: p.pictureApotheose,
      background: p.background,
      buttonColor: p.buttonColor,
      textColor: p.textColor,
      classeName: p.classeName,
      bloodlineName: p.bloodlineName
    }

    return Object.assign(defaults, p)
  }
}

export type CharacterToCreate = Omit<Character, 'id'>