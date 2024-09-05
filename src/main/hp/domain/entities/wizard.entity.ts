import { WizardKnowledge, WizardKnowledgeToCreate } from './wizard-knowledge.entity'
import { WizardSpell, WizardSpellToCreate } from './wizard-spell.entity'
import { WizardStat, WizardStatToCreate } from './wizard-stat.entity'

export class Wizard {
  id: string
  name: string
  category: string
  stats: WizardStat[]
  knowledges: WizardKnowledge[]
  spells: WizardSpell[]
  xp: number

  constructor(wizard: {
    id: string
    name: string
    category: string
    stats: WizardStat[]
    knowledges: WizardKnowledge[]
    spells: WizardSpell[]
    xp: number
  }) {
    this.id = wizard.id
    this.name = wizard.name
    this.category = wizard.category
    this.stats = wizard.stats
    this.knowledges = wizard.knowledges
    this.spells = wizard.spells
    this.xp = wizard.xp
  }

  static toWizardToCreate(p: {
    name: string
    category: string
    stats: WizardStatToCreate[]
    knowledges: WizardKnowledgeToCreate[]
    spells: WizardSpellToCreate[]
  }): WizardToCreate {
    return {
      name: p.name,
      category: p.category,
      stats: p.stats,
      knowledges: p.knowledges,
      spells: p.spells,
      xp: 0
    }
  }
}

export type WizardToCreate = Omit<Wizard, 'id' | 'stats' | 'knowledges' | 'spells'> & {
  stats: WizardStatToCreate[]
  knowledges: WizardKnowledgeToCreate[]
  spells: WizardSpellToCreate[]
}

export type WizardToUpdate = Pick<Wizard, 'category' | 'xp'>

export type WizardName = Pick<Wizard, 'id' | 'name'>
