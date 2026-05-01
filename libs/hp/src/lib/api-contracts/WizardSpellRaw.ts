import { Difficulty } from '../difficulty.enum'
import { SpellRaw } from './SpellRaw'

export interface WizardSpellRaw {
  difficulty: Difficulty;
  xp: number;
  spell: SpellRaw;
}
