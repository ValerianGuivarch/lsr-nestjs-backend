import { Wizard, WizardName, WizardToCreate, WizardToUpdate } from '../entities/wizard.entity'

export interface IWizardProvider {
  create(wizard: WizardToCreate): Promise<Wizard>
  findOneById(id: string): Promise<Wizard>
  findOneByName(name: string): Promise<Wizard>
  findAllNames(): Promise<WizardName[]>
  update(p: { wizardId: string; wizard: Partial<WizardToUpdate> }): Promise<Wizard>
}
