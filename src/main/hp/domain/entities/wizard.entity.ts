import { WizardKnowledge, WizardKnowledgeToCreate, WizardKnowledgeToUpdate } from './wizard-knowledge.entity'
import { WizardSpell, WizardSpellToCreate } from './wizard-spell.entity'
import { WizardStat, WizardStatToCreate, WizardStatToUpdate } from './wizard-stat.entity'

export class Wizard {
  name: string
  category: string
  stats: WizardStat[]
  knowledges: WizardKnowledge[]
  spells: WizardSpell[]
  xp: number

  constructor(wizard: {
    name: string
    category: string
    stats: WizardStat[]
    knowledges: WizardKnowledge[]
    spells: WizardSpell[]
    xp: number
  }) {
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

export type WizardToCreate = Omit<Wizard, 'stats' | 'knowledges' | 'spells'> & {
  stats: WizardStatToCreate[]
  knowledges: WizardKnowledgeToCreate[]
  spells: WizardSpellToCreate[]
}

export type WizardToUpdate = Pick<Wizard, 'category'> & {
  statsToUpdate: WizardStatToUpdate[]
  knowledgesToUpdate: WizardKnowledgeToUpdate[]
  spellsToUpdate: WizardSpellToCreate[]
}

export type WizardName = Pick<Wizard, 'name'>
