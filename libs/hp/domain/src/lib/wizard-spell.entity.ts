import { Difficulty } from './difficulty.enum'
import { Spell } from './spell.entity'

export class WizardSpell {
  spell: Spell
  difficulty: Difficulty
  xp: number
}
export type WizardSpellToCreate = Omit<WizardSpell, 'spell' | 'xp'> & {
  spell: Pick<Spell, 'name'>
}
