import { RollType } from './RollType'

export class Roll {
  id: string
  rollerName: string
  rollType: RollType
  date: Date
  secret: boolean
  displayDices: boolean
  focus: boolean
  power: boolean
  proficiency: boolean
  benediction: number
  malediction: number
  result: number[]
  success: number | null
  juge12: number | null
  juge34: number | null
  characterToHelp?: string
  resistRoll?: string
  picture?: string
  data?: string
  empirique?: string
  apotheose?: string
  helpUsed: boolean | null

  constructor(p: RollToCreate) {
    Object.assign(this, p)
  }

  static async rollToCreateFactory(p: {
    id?: string
    rollerName: string
    rollType: RollType
    date: Date
    secret: boolean
    displayDices: boolean
    focus: boolean
    power: boolean
    proficiency: boolean
    benediction: number
    malediction: number
    result: number[]
    success: number | null
    juge12: number | null
    juge34: number | null
    characterToHelp?: string
    resistRoll?: string
    picture?: string
    data?: string
    empirique?: string
    apotheose?: string
    helpUsed: boolean | null
  }): Promise<RollToCreate> {
    const defaults = {
      rollerName: p.rollerName,
      rollType: p.rollType,
      date: p.date,
      secret: p.secret,
      displayDices: p.displayDices,
      focus: p.focus,
      power: p.power,
      proficiency: p.proficiency,
      benediction: p.benediction,
      malediction: p.malediction,
      result: p.result,
      success: p.success,
      juge12: p.juge12,
      juge34: p.juge34,
      characterToHelp: p.characterToHelp,
      resistRoll: p.resistRoll,
      picture: p.picture,
      data: p.data,
      empirique: p.empirique,
      apotheose: p.apotheose,
      helpUsed: p.helpUsed
    }

    return Object.assign(defaults, p)
  }
}

export type RollToCreate = Omit<Roll, 'id'>
