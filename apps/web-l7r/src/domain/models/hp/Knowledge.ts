export class Knowledge {
  name: string;
  color: string;

  constructor(knowledge: { name: string; color: string }) {
    this.name = knowledge.name;
    this.color = knowledge.color;
  }
}
