import { House } from './house.entity'
import { WizardKnowledge, WizardKnowledgeToCreate, WizardKnowledgeToUpdate } from './wizard-knowledge.entity'
import { WizardSpell, WizardSpellToCreate } from './wizard-spell.entity'
import { WizardStat, WizardStatToCreate, WizardStatToUpdate } from './wizard-stat.entity'

export class Wizard {
  name: string
  familyName: string
  category: string
  stats: WizardStat[]
  knowledges: WizardKnowledge[]
  spells: WizardSpell[]
  xp: number
  pv: number
  pvMax: number
  house?: House
  baguette: string
  coupDePouce: string
  crochePatte: string
  text: string
  traits: string[]

  constructor(wizard: {
    name: string
    familyName: string
    category: string
    stats: WizardStat[]
    knowledges: WizardKnowledge[]
    spells: WizardSpell[]
    xp: number
    pv: number
    pvMax: number
    house?: House
    baguette: string
    coupDePouce: string
    crochePatte: string
    text: string
    traits: string[]
  }) {
    this.name = wizard.name
    this.familyName = wizard.familyName
    this.category = wizard.category
    this.stats = wizard.stats
    this.knowledges = wizard.knowledges
    this.spells = wizard.spells
    this.xp = wizard.xp
    this.pv = wizard.pv
    this.pvMax = wizard.pvMax
    this.house = wizard.house
    this.baguette = wizard.baguette
    this.coupDePouce = wizard.coupDePouce
    this.crochePatte = wizard.crochePatte
    this.text = wizard.text
    this.traits = wizard.traits
  }

  static toWizardToCreate(p: {
    name: string
    familyName: string
    category: string
    stats: WizardStatToCreate[]
    knowledges: WizardKnowledgeToCreate[]
    spells: WizardSpellToCreate[]
    houseName?: string
  }): WizardToCreate {
    return {
      name: p.name,
      familyName: p.familyName,
      category: p.category,
      stats: p.stats,
      knowledges: p.knowledges,
      spells: p.spells,
      xp: 0,
      pv: 0,
      pvMax: 0,
      houseName: p.houseName,
      baguette: '',
      coupDePouce: '',
      crochePatte: '',
      text: '',
      traits: []
    }
  }
}

export type WizardToCreate = Omit<Wizard, 'house' | 'stats' | 'knowledges' | 'spells'> & {
  stats: WizardStatToCreate[]
  knowledges: WizardKnowledgeToCreate[]
  spells: WizardSpellToCreate[]
  houseName?: string
}

export type WizardToUpdate = Pick<Wizard, 'category' | 'pv'> & {
  statsToUpdate?: WizardStatToUpdate[]
  knowledgesToUpdate?: WizardKnowledgeToUpdate[]
  spellsToUpdate?: WizardSpellToCreate[]
  text?: string
}

export type WizardName = Pick<Wizard, 'name'>
