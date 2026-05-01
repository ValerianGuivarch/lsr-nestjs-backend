import { Knowledge } from './knowledge.entity'

export class Spell {
  name: string
  rank: number
  formule: string
  knowledge: Knowledge

  constructor(stat: { name: string; knowledge: Knowledge; rank: number; formule: string }) {
    this.name = stat.name
    this.knowledge = stat.knowledge
    this.rank = stat.rank
    this.formule = stat.formule
  }
}
