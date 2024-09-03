import { Knowledge } from './knowledge.entity'

export class WizardKnowledge {
  knowledge: Knowledge
  level: number
}

export type WizardKnowledgeToCreate = Omit<WizardKnowledge, 'knowledge'> & {
  knowledge: Pick<Knowledge, 'id'>
}

export type WizardKnowledgeToUpdate = Pick<WizardKnowledge, 'level'>
