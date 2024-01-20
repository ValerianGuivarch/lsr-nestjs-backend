import { ScenarioCategory } from './ScenarioCategory'

export class Scenario {
  id: string
  name: string
  category: ScenarioCategory
  difficulty: string
  victory: string
  defeat: string
  time: string
  reward: string
  text: string
  victoryMsg: string
  defaiteMsg: string

  constructor(p: {
    id: string
    name: string
    category: ScenarioCategory
    difficulty: string
    victory: string
    defeat: string
    time: string
    reward: string
    text: string
    victoryMsg: string
    defaiteMsg: string
  }) {
    this.id = p.id
    this.name = p.name
    this.category = p.category
    this.difficulty = p.difficulty
    this.victory = p.victory
    this.defeat = p.defeat
    this.time = p.time
    this.reward = p.reward
    this.text = p.text
    this.victoryMsg = p.victoryMsg
    this.defaiteMsg = p.defaiteMsg
  }

  static toScenarioToCreate(p: {
    name: string
    category: ScenarioCategory
    difficulty: string
    victory: string
    defeat: string
    time: string
    reward: string
    text: string
    victoryMsg: string
    defaiteMsg: string
  }): ScenarioToCreate {
    return {
      name: p.name,
      category: p.category,
      difficulty: p.difficulty,
      victory: p.victory,
      defeat: p.defeat,
      time: p.time,
      reward: p.reward,
      text: p.text,
      victoryMsg: p.victoryMsg,
      defaiteMsg: p.defaiteMsg
    }
  }
}

export type ScenarioToCreate = Omit<Scenario, 'id'>
