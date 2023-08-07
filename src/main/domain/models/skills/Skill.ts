import { SkillCategory } from './SkillCategory'
import { SkillStat } from './SkillStat'
import { SuccessCalculation } from '../roll/SuccessCalculation'

export class Skill {
  name: string
  stat: SkillStat
  category: SkillCategory // just for display ?
  pvCost: number
  pfCost: number
  ppCost: number
  dettesCost: number
  arcaneCost: number
  allowsPf: boolean
  allowsPp: boolean
  customRolls: string
  successCalculation: SuccessCalculation
  secret: boolean
  display: string
  position: number

  constructor(p: Skill) {
    this.name = p.name
    this.stat = p.stat
    this.category = p.category
    this.pvCost = p.pvCost
    this.pfCost = p.pfCost
    this.ppCost = p.ppCost
    this.dettesCost = p.dettesCost
    this.arcaneCost = p.arcaneCost
    this.allowsPp = p.allowsPp
    this.allowsPf = p.allowsPf
    this.customRolls = p.customRolls
    this.successCalculation = p.successCalculation
    this.secret = p.secret
    this.display = p.display
    this.position = p.position
  }
}
