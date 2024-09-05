import { Knowledge } from './knowledge.entity'
import { Stat } from './stat.entity'

export class Spell {
  id: string
  name: string
  rank: number
  knowledge: Knowledge
  stat: Stat

  constructor(stat: { id: string; name: string; knowledge: Knowledge; rank: number; stat: Stat }) {
    this.id = stat.id
    this.name = stat.name
    this.knowledge = stat.knowledge
    this.rank = stat.rank
    this.stat = stat.stat
  }
}
