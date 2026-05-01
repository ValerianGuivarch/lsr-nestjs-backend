import { KnowledgeRaw } from './KnowledgeRaw'
import { Difficulty } from '../difficulty.enum'

export interface SpellRaw {
  name: string;
  rank: number;
  difficulty: Difficulty;
  knowledge: KnowledgeRaw;
}
