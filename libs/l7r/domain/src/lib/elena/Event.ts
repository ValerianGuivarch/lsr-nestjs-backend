export class Event {
  id: string
  description: string

  constructor(p: { id: string; description: string }) {
    this.id = p.id
    this.description = p.description
  }
}
