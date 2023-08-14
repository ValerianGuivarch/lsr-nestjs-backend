import { BattleState } from './BattleState'
import { Category } from './Category'
import { Genre } from './Genre'
import { ApotheoseState } from '../apotheoses/ApotheoseState'

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
  apotheoseState: ApotheoseState
  apotheoseName?: string
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
  restImproved: boolean
  isInvocation: boolean
  controlledBy?: string
  chairBonus: number
  espritBonus: number
  essenceBonus: number

  constructor(p: Character) {
    this.name = p.name
    this.restImproved = p.restImproved
    this.classeName = p.classeName
    this.bloodlineName = p.bloodlineName
    this.apotheoseName = p.apotheoseName
    this.apotheoseState = p.apotheoseState
    this.apotheoseImprovement = p.apotheoseImprovement
    this.apotheoseImprovementList = p.apotheoseImprovementList
    this.chair = p.chair
    this.esprit = p.esprit
    this.essence = p.essence
    this.chairBonus = p.chairBonus
    this.espritBonus = p.espritBonus
    this.essenceBonus = p.essenceBonus
    this.pv = p.pv < 0 ? 0 : p.pv
    this.pvMax = p.pvMax
    this.pf = p.pf < 0 ? 0 : p.pf
    this.pfMax = p.pfMax
    this.pp = p.pp < 0 ? 0 : p.pp
    this.ppMax = p.ppMax
    this.dettes = p.dettes < 0 ? 0 : p.dettes
    this.arcanes = p.arcanes < 0 ? 0 : p.arcanes
    this.arcanesMax = p.arcanesMax
    this.niveau = p.niveau < 0 ? 0 : p.niveau
    this.lux = p.lux
    this.umbra = p.umbra
    this.secunda = p.secunda
    this.notes = p.notes
    this.category = p.category
    this.genre = p.genre
    this.relance = p.relance < 0 ? 0 : p.relance
    this.playerName = p.playerName
    this.picture = p.picture
    this.pictureApotheose = p.pictureApotheose
    this.background = p.background
    this.buttonColor = p.buttonColor
    this.textColor = p.textColor
    this.boosted = p.boosted
    this.battleState = p.battleState
    this.isInvocation = p.isInvocation
    this.controlledBy = p.controlledBy
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
    playerName?: string
  }): CharacterToCreate {
    const defaults = {
      chair: p.chair,
      esprit: p.esprit,
      essence: p.essence,
      chairBonus: 0,
      espritBonus: 0,
      essenceBonus: 0,
      pv: p.pvMax,
      pvMax: p.pvMax,
      pf: p.pfMax,
      pfMax: p.pfMax,
      pp: p.ppMax,
      ppMax: p.ppMax,
      playerName: p.playerName,
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
      apotheoseState: ApotheoseState.NONE,
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
      bloodlineName: p.bloodlineName,
      restImproved: false,
      isInvocation: false,
      summoner: undefined
    }
    return Object.assign(defaults, p)
  }

  static invocationToCreateFactory(p: {
    name: string
    summoner: Character
    chair: number
    esprit: number
    essence: number
    pvMax: number
    picture?: string
  }): CharacterToCreate {
    const defaults = {
      name: p.name,
      chair: p.chair,
      esprit: p.esprit,
      essence: p.essence,
      pv: p.pvMax,
      pvMax: p.pvMax,
      pf: 0,
      pfMax: 0,
      pp: 0,
      ppMax: 0,
      playerName: p.summoner.playerName,
      // eslint-disable-next-line no-magic-numbers
      dettes: 0,
      arcanes: 0,
      arcanesMax: 0,
      niveau: p.summoner.niveau,
      lux: '',
      umbra: '',
      secunda: '',
      notes: '',
      category: p.summoner.category,
      apotheose: undefined,
      apotheoseState: ApotheoseState.NONE,
      apotheoseImprovementList: [],
      // eslint-disable-next-line no-magic-numbers
      genre: p.summoner.genre,
      relance: 0,
      boosted: false,
      battleState: p.summoner.battleState,
      picture: p.picture,
      pictureApotheose: '',
      background: '',
      buttonColor: '',
      textColor: '',
      classeName: p.summoner.classeName,
      bloodlineName: p.summoner.bloodlineName,
      restImproved: false,
      isInvocation: true,
      controlledBy: p.summoner.name
    }

    return Object.assign(defaults)
  }
}

export type CharacterToCreate = Omit<Character, 'id'>
