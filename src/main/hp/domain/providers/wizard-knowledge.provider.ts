import { WizardKnowledge, WizardKnowledgeToCreate, WizardKnowledgeToUpdate } from '../entities/wizard-knowledge.entity'

export interface IWizardKnowledgeProvider {
  create(wizardId: string, wizardKnowledge: WizardKnowledgeToCreate): Promise<WizardKnowledge>
  update(p: {
    wizardId: string
    knowledgeId: string
    wizardKnowledge: WizardKnowledgeToUpdate
  }): Promise<WizardKnowledge>
}
