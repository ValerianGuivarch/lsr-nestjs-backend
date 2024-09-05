import { WizardSpell, WizardSpellToCreate, WizardSpellToUpdate } from '../entities/wizard-spell.entity'

export interface IWizardSpellProvider {
  create(wizardId: string, wizardSpell: WizardSpellToCreate): Promise<WizardSpell>
  update(p: { wizardId: string; spellId: string; wizardSpell: WizardSpellToUpdate }): Promise<WizardSpell>
}
