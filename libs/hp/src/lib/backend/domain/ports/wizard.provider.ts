import { Wizard, WizardName, WizardToCreate, WizardToUpdate } from '../entities/wizard.entity'

export interface IWizardProvider {
  create(wizard: WizardToCreate): Promise<Wizard>
  findOneByName(name: string): Promise<Wizard>
  findAllNames(): Promise<WizardName[]>
  update(p: { wizardName: string; wizard: Partial<WizardToUpdate> }): Promise<Wizard>
  levelUpStat(wizardName: string, statId: string): Promise<void>
  levelUpKnowledge(wizardName: string, knowledgeId: string): Promise<void>
  levelUpSpell(wizardName: string, spellId: string): Promise<void>
}
