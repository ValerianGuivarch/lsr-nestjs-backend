import { Knowledge } from './knowledge.entity'
import { Stat } from './stat.entity'

export class Spell {
  name: string
  rank: number
  knowledge: Knowledge
  stat: Stat

  constructor(stat: { name: string; knowledge: Knowledge; rank: number; stat: Stat }) {
    this.name = stat.name
    this.knowledge = stat.knowledge
    this.rank = stat.rank
    this.stat = stat.stat
  }
}
