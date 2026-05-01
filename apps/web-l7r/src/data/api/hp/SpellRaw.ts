import { KnowledgeRaw } from "../KnowledgeRaw";
import { StatRaw } from "./StatRaw";
import { Difficulty } from "../../../domain/models/hp/Difficulty";

export interface SpellRaw {
  name: string;
  rank: number;
  difficulty: Difficulty;
  knowledge: KnowledgeRaw;
}
