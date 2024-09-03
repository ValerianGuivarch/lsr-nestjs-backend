import { WizardStat, WizardStatToCreate, WizardStatToUpdate } from '../entities/wizard-stat.entity'

export interface IWizardStatProvider {
  create(wizardId: string, wizardStat: WizardStatToCreate): Promise<WizardStat>
  update(p: { wizardId: string; statId: string; wizardStat: WizardStatToUpdate }): Promise<WizardStat>
}
