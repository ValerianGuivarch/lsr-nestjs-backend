import { SkillRaw } from "../../data/api/SkillRaw";
import { DisplayCategory } from "./DisplayCategory";
import { SkillStat } from "./SkillStat";

export class Skill {
  id: string;
  name: string;
  stat: SkillStat;
  shortName: string;
  longName?: string;
  description?: string;
  displayCategory: DisplayCategory;
  dailyUse?: number;
  dailyUseMax?: number;
  soldatCost: number;
  arcaneDette?: number;
  isHeal: boolean;
  blessure: boolean;
  resistance: boolean;
  constructor(p: SkillRaw) {
    this.id = p.id;
    this.name = p.name;
    this.arcaneDette = p.arcaneDette;
    this.stat = SkillStat[p.stat as keyof typeof SkillStat];
    this.shortName = p.shortName;
    this.longName = p.longName;
    this.description = p.description;
    this.displayCategory =
      DisplayCategory[p.displayCategory as keyof typeof DisplayCategory];
    this.dailyUse = p.dailyUse;
    this.dailyUseMax = p.dailyUseMax;
    this.soldatCost = p.soldatCost;
    this.isHeal = p.isHeal;
    this.resistance = p.resistance;
    this.blessure = p.blessure;
  }
}
