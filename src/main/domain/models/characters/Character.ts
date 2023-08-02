import { Apotheose } from './Apotheose'
import { BattleState } from './BattleState'
import { Bloodline } from './Bloodline'
import { Category } from './Category'
import { Classe } from './Classe'
import { Genre } from './Genre'

export class Character {
  name: string
  classe: Classe
  bloodline: Bloodline
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
  apotheose: Apotheose
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
    classe: Classe
    bloodline: Bloodline
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
    genre: Genre
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
      apotheose: Apotheose.NONE,
      apotheoseImprovementList: [],
      genre: p.genre,
      relance: 0,
      boosted: false,
      battleState: BattleState.NONE,
      picture: p.picture,
      pictureApotheose: p.pictureApotheose,
      background: p.background,
      buttonColor: p.buttonColor,
      textColor: p.textColor
    }

    return Object.assign(defaults, p)
  }
}

export type CharacterToCreate = Omit<Character, 'id'>
