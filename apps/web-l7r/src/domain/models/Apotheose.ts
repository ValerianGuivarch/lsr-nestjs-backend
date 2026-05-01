import { DisplayCategory } from "./DisplayCategory";
import { ApotheoseRaw } from "../../data/api/ApotheoseRaw";

export class Apotheose {
  name: string;
  shortName: string;
  displayCategory: DisplayCategory;
  description?: string;
  cost: number;
  chairImprovement: number;
  espritImprovement: number;
  essenceImprovement: number;
  constructor(p: ApotheoseRaw) {
    this.name = p.name;
    this.shortName = p.shortName;
    this.displayCategory =
      DisplayCategory[p.displayCategory as keyof typeof DisplayCategory];
    this.description = p.description;
    this.cost = p.cost;
    this.chairImprovement = p.chairImprovement;
    this.espritImprovement = p.espritImprovement;
    this.essenceImprovement = p.essenceImprovement;
  }
}
