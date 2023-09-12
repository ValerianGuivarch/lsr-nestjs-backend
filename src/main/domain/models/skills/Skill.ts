import { SkillStat } from './SkillStat'
import { DisplayCategory } from '../characters/DisplayCategory'
import { SuccessCalculation } from '../roll/SuccessCalculation'

export class Skill {
  id: string
  name: string
  shortName: string
  longName?: string
  stat: SkillStat
  displayCategory: DisplayCategory
  pvCost: number
  pfCost: number
  ppCost: number
  dettesCost: number
  etherCost: number
  arcaneCost: number
  arcanePrimeCost: number
  allowsPf: boolean
  allowsPp: boolean
  customRolls?: string
  successCalculation: SuccessCalculation
  secret: boolean
  display: string
  position: number
  soldatCost: number
  isArcanique: boolean
  isHeal: boolean
  resistance: boolean
  blessure: boolean
  help: boolean
  invocationTemplateName?: string
  description: string
  precision?: string

  constructor(p: Skill) {
    this.id = p.id
    this.name = p.name
    this.shortName = p.shortName
    this.soldatCost = p.soldatCost
    this.longName = p.longName
    this.stat = p.stat
    this.displayCategory = p.displayCategory
    this.pvCost = p.pvCost
    this.pfCost = p.pfCost
    this.ppCost = p.ppCost
    this.dettesCost = p.dettesCost
    this.etherCost = p.etherCost
    this.arcaneCost = p.arcaneCost
    this.arcanePrimeCost = p.arcanePrimeCost
    this.allowsPp = p.allowsPp
    this.allowsPf = p.allowsPf
    this.customRolls = p.customRolls
    this.successCalculation = p.successCalculation
    this.secret = p.secret
    this.display = p.display
    this.position = p.position
    this.isArcanique = p.isArcanique
    this.isHeal = p.isHeal
    this.resistance = p.resistance
    this.blessure = p.blessure
    this.help = p.help
    this.invocationTemplateName = p.invocationTemplateName
    this.description = p.description
    this.precision = p.precision
  }
}
