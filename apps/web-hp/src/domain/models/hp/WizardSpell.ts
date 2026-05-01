import { Difficulty } from "./Difficulty";
import { Spell } from "./Spell";

export interface WizardSpellToUpdate {
  spellName: string;
  difficulty: Difficulty;
}

export class WizardSpell {
  spell: Spell;
  difficulty: Difficulty;
  xp: number;

  constructor(wizardSpell: {
    spell: Spell;
    difficulty: Difficulty;
    xp: number;
  }) {
    this.spell = wizardSpell.spell;
    this.difficulty = wizardSpell.difficulty;
    this.xp = wizardSpell.xp;
  }
}
