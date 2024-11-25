import { Knowledge } from './knowledge.entity'

export class Spell {
  name: string
  rank: number
  knowledge: Knowledge

  constructor(stat: { name: string; knowledge: Knowledge; rank: number }) {
    this.name = stat.name
    this.knowledge = stat.knowledge
    this.rank = stat.rank
  }
}
