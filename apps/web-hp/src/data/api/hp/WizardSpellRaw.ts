import { Difficulty } from "../../../domain/models/hp/Difficulty";
import { SpellRaw } from "./SpellRaw";

export interface WizardSpellRaw {
  difficulty: Difficulty;
  xp: number;
  spell: SpellRaw;
}
