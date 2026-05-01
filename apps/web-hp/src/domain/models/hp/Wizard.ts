import { WizardStat, WizardStatToUpdate } from "./WizardStat";
import { WizardKnowledge, WizardKnowledgeToUpdate } from "./WizardKnowledge";
import { WizardSpell, WizardSpellToUpdate } from "./WizardSpell";
import { House } from "./House";

export interface WizardToUpdate {
  category: string;
  stats: WizardStatToUpdate[];
  knowledges: WizardKnowledgeToUpdate[];
  spells: WizardSpellToUpdate[];
}

export class Wizard {
  name: string;
  displayName: string;
  animal: string;
  familyName: string;
  category: string;
  stats: WizardStat[];
  knowledges: WizardKnowledge[];
  spells: WizardSpell[];
  houseName: string;
  xp: number;
  pv: number;
  pvMax: number;
  baguette: string;
  coupDePouce: string;
  crochePatte: string;
  text: string;
  traits: string[];

  constructor(wizard: {
    name: string;
    displayName: string;
    familyName: string;
    animal: string;
    category: string;
    stats: WizardStat[];
    knowledges: WizardKnowledge[];
    spells: WizardSpell[];
    houseName: string;
    xp: number;
    pv: number;
    pvMax: number;
    baguette: string;
    coupDePouce: string;
    crochePatte: string;
    text: string;
    traits: string[];
  }) {
    this.name = wizard.name;
    this.displayName = wizard.displayName;
    this.familyName = wizard.familyName;
    this.animal = wizard.animal;
    this.category = wizard.category;
    this.stats = wizard.stats;
    this.knowledges = wizard.knowledges;
    this.spells = wizard.spells;
    this.houseName = wizard.houseName;
    this.xp = wizard.xp;
    this.pv = wizard.pv;
    this.pvMax = wizard.pvMax;
    this.baguette = wizard.baguette;
    this.coupDePouce = wizard.coupDePouce;
    this.crochePatte = wizard.crochePatte;
    this.text = wizard.text;
    this.traits = wizard.traits;
  }
}
