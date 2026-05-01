import { WizardStatRaw } from "./WizardStatRaw";
import { WizardKnowledgeRaw } from "./WizardKnowledgeRaw";
import { WizardSpellRaw } from "./WizardSpellRaw";

export interface WizardRaw {
  name: string;
  familyName: string;
  displayName: string;
  animal: string;
  category: string;
  stats: WizardStatRaw[];
  knowledges: WizardKnowledgeRaw[];
  spells: WizardSpellRaw[];
  houseName: string;
  xp: number;
  pv: number;
  pvMax: number;
  baguette: string;
  coupDePouce: string;
  crochePatte: string;
  text: string;
  traits: string[];
}
