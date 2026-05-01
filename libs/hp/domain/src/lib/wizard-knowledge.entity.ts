import { Knowledge } from './knowledge.entity'

export class WizardKnowledge {
  knowledge: Knowledge
  level: number
  xp: number
}

export type WizardKnowledgeToCreate = Omit<WizardKnowledge, 'knowledge' | 'xp'> & {
  knowledge: Pick<Knowledge, 'name'>
}

export type WizardKnowledgeToUpdate = Pick<WizardKnowledge, 'level'> & {
  knowledgeName: string
}
