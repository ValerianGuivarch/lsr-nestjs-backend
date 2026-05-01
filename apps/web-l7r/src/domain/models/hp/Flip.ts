import { Difficulty } from "./Difficulty";

export class Flip {
  id: string;
  wizardName: string;
  wizardDisplayName: string;
  text: string;
  result: number;
  baseBis?: number;
  difficulty: Difficulty;
  base: number;
  modif: number;
  success: boolean;
  xpOk: boolean;

  constructor(p: Flip) {
    this.id = p.id;
    this.wizardName = p.wizardName;
    this.wizardDisplayName = p.wizardDisplayName;
    this.text = p.text;
    this.result = p.result;
    this.base = p.base;
    this.modif = p.modif;
    this.difficulty = p.difficulty;
    this.baseBis = p.baseBis;
    this.success = p.success;
    this.xpOk = p.xpOk;
  }
}
