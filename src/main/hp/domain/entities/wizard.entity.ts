import { Category } from './category.enum'
import { WizardKnowledge, WizardKnowledgeToCreate } from './wizard-knowledge.entity'
import { WizardStat, WizardStatToCreate } from './wizard-stat.entity'

export class Wizard {
  id: string
  name: string
  category: Category
  stats: WizardStat[]
  knowledges: WizardKnowledge[]

  constructor(wizard: {
    id: string
    name: string
    category: Category
    stats: WizardStat[]
    knowledges: WizardKnowledge[]
  }) {
    this.id = wizard.id
    this.name = wizard.name
    this.category = wizard.category
    this.stats = wizard.stats
    this.knowledges = wizard.knowledges
  }

  static toWizardToCreate(p: {
    name: string
    category: Category
    stats: WizardStatToCreate[]
    knowledges: WizardKnowledgeToCreate[]
  }): WizardToCreate {
    return {
      name: p.name,
      category: p.category,
      stats: p.stats,
      knowledges: p.knowledges
    }
  }
}

export type WizardToCreate = Omit<Wizard, 'id' | 'stats' | 'knowledges'> & {
  stats: WizardStatToCreate[]
  knowledges: WizardKnowledgeToCreate[]
}

export type WizardToUpdate = Pick<Wizard, 'category'>

export type WizardName = Pick<Wizard, 'id' | 'name'>
