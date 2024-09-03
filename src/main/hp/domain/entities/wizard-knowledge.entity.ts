import { Knowledge } from './knowledge.entity'

export class WizardKnowledge {
  knowledge: Knowledge
  level: number
  xp: number
}

export type WizardKnowledgeToCreate = Omit<WizardKnowledge, 'knowledge' | 'xp'> & {
  knowledge: Pick<Knowledge, 'id'>
}

export type WizardKnowledgeToUpdate = Pick<WizardKnowledge, 'level'>
