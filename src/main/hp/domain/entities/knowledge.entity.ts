export class Knowledge {
  id: string
  name: string
  flipText: string

  constructor(knowledge: { id: string; name: string; flipText: string }) {
    this.id = knowledge.id
    this.name = knowledge.name
    this.flipText = knowledge.flipText
  }
}
