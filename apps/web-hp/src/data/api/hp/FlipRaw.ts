import { Difficulty } from "../../../domain/models/hp/Difficulty";

export interface FlipRaw {
  id: string;
  wizardName: string;
  wizardDisplayName: string;
  text: string;
  result: number;
  base: number;
  modif: number;
  difficulty: Difficulty;
  baseBis?: number;
  success: boolean;
  xpOk: boolean;
}
