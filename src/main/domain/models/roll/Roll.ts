import { SkillStat } from '../skills/SkillStat'
export class Roll {
  id: string
  rollerName: string
  date: Date
  secret: boolean
  displayDices: boolean
  focus: boolean
  power: boolean
  proficiency: boolean
  bonus: number
  malus: number
  result: number[]
  success: number | null
  juge12: number | null
  juge34: number | null
  characterToHelp?: string
  resistRoll?: string
  picture?: string
  data?: string
  empiriqueRoll?: string
  apotheose?: string
  display: string
  stat: SkillStat
  constructor(p: Roll) {
    Object.assign(this, p)
  }

  static async rollToCreateFactory(p: {
    id?: string
    rollerName: string
    date: Date
    secret: boolean
    displayDices: boolean
    focus: boolean
    power: boolean
    proficiency: boolean
    bonus: number
    malus: number
    result: number[]
    success: number | null
    juge12: number | null
    juge34: number | null
    characterToHelp?: string
    resistRoll?: string
    picture?: string
    data?: string
    empiriqueRoll?: string
    apotheose?: string
    display: string
    stat: SkillStat
  }): Promise<RollToCreate> {
    const defaults = {
      rollerName: p.rollerName,
      date: p.date,
      secret: p.secret,
      displayDices: p.displayDices,
      focus: p.focus,
      power: p.power,
      proficiency: p.proficiency,
      bonus: p.bonus,
      malus: p.malus,
      result: p.result,
      success: p.success,
      juge12: p.juge12,
      juge34: p.juge34,
      characterToHelp: p.characterToHelp,
      resistRoll: p.resistRoll,
      picture: p.picture,
      data: p.data,
      empiriqueRoll: p.empiriqueRoll,
      apotheose: p.apotheose,
      display: p.display,
      stat: p.stat
    }

    return Object.assign(defaults, p)
  }
}

export type RollToCreate = Omit<Roll, 'id'>
