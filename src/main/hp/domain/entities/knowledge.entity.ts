import { Stat } from './stat.entity'

export class Knowledge {
  id: string
  name: string
  stat: Stat

  constructor(knowledge: { id: string; name: string; stat: Stat }) {
    this.id = knowledge.id
    this.name = knowledge.name
    this.stat = knowledge.stat
  }
}
