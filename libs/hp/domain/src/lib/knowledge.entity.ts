export class Knowledge {
  name: string
  flipText: string

  constructor(knowledge: { name: string; flipText: string }) {
    this.name = knowledge.name
    this.flipText = knowledge.flipText
  }
}
