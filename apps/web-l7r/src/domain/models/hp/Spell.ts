import { Knowledge } from "./Knowledge";
import { Stat } from "./Stat";
import { Difficulty } from "./Difficulty";

export class Spell {
  name: string;
  rank: number;
  knowledge: Knowledge;
  difficulty: Difficulty;

  constructor(spell: {
    name: string;
    rank: number;
    knowledge: Knowledge;
    difficulty: Difficulty;
  }) {
    this.name = spell.name;
    this.rank = spell.rank;
    this.knowledge = spell.knowledge;
    this.difficulty = spell.difficulty;
  }
}
