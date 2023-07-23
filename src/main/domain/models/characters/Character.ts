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
  pictureApotheose?: string
  background?: string
  buttonColor?: string
  textColor?: string
  uid?: number
  boosted?: boolean
  battleState: BattleState

  constructor(p: CharacterToCreate) {
    Object.assign(this, p)
  }

  static async characterToCreateFactory(p: {
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
    apotheoseImprovementList: string[]
    genre: Genre
    relance: number
  }): Promise<CharacterToCreate> {
    const defaults = {
      chair: p.chair,
      esprit: p.esprit,
      essence: p.essence,
      pv: p.pv,
      pvMax: p.pvMax,
      pf: p.pf,
      pfMax: p.pfMax,
      pp: p.pp,
      ppMax: p.ppMax,
      dettes: p.dettes,
      arcanes: p.arcanes,
      arcanesMax: p.arcanesMax,
      niveau: p.niveau,
      lux: p.lux,
      umbra: p.umbra,
      secunda: p.secunda,
      notes: p.notes,
      category: p.category,
      apotheose: p.apotheose,
      apotheoseImprovementList: p.apotheoseImprovementList,
      genre: p.genre,
      relance: p.relance,
      boosted: false,
      battleState: BattleState.NONE
    }

    return Object.assign(defaults, p)
  }
}

export type CharacterToCreate = Omit<Character, 'id'>
