import { WizardKnowledge, WizardKnowledgeToCreate } from './wizard-knowledge.entity'
import { WizardStat, WizardStatToCreate } from './wizard-stat.entity'

export class Wizard {
  id: string
  name: string
  category: string
  stats: WizardStat[]
  knowledges: WizardKnowledge[]
  xp: number

  constructor(wizard: {
    id: string
    name: string
    category: string
    stats: WizardStat[]
    knowledges: WizardKnowledge[]
    xp: number
  }) {
    this.id = wizard.id
    this.name = wizard.name
    this.category = wizard.category
    this.stats = wizard.stats
    this.knowledges = wizard.knowledges
    this.xp = wizard.xp
  }

  static toWizardToCreate(p: {
    name: string
    category: string
    stats: WizardStatToCreate[]
    knowledges: WizardKnowledgeToCreate[]
  }): WizardToCreate {
    return {
      name: p.name,
      category: p.category,
      stats: p.stats,
      knowledges: p.knowledges,
      xp: 0
    }
  }
}

export type WizardToCreate = Omit<Wizard, 'id' | 'stats' | 'knowledges'> & {
  stats: WizardStatToCreate[]
  knowledges: WizardKnowledgeToCreate[]
}

export type WizardToUpdate = Pick<Wizard, 'category' | 'xp'>

export type WizardName = Pick<Wizard, 'id' | 'name'>
