import {DisplayCategory} from "./DisplayCategory";
import {ProficiencyRaw} from "../../data/api/ProficiencyRaw";

export class Proficiency {
    name: string
    shortName: string
    description?: string
    displayCategory: DisplayCategory
    constructor(p: ProficiencyRaw) {
        this.name = p.name
        this.shortName = p.shortName
        this.description = p.description
        this.displayCategory = DisplayCategory[p.displayCategory as keyof typeof DisplayCategory]
    }

}