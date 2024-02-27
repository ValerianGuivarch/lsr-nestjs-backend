export class Scenario {
  id: string
  name: string
  difficulty: string
  victory: string
  defeat: string
  time: string
  reward: string
  rewardCoin: number
  text: string
  victoryMsg: string
  defaiteMsg: string

  constructor(p: {
    id: string
    name: string
    difficulty: string
    victory: string
    defeat: string
    time: string
    reward: string
    rewardCoin: number
    text: string
    victoryMsg: string
    defaiteMsg: string
  }) {
    this.id = p.id
    this.name = p.name
    this.difficulty = p.difficulty
    this.victory = p.victory
    this.defeat = p.defeat
    this.time = p.time
    this.reward = p.reward
    this.rewardCoin = p.rewardCoin
    this.text = p.text
    this.victoryMsg = p.victoryMsg
    this.defaiteMsg = p.defaiteMsg
  }

  static toScenarioToCreate(p: {
    name: string
    difficulty: string
    victory: string
    defeat: string
    time: string
    reward: string
    rewardCoin: number
    text: string
    victoryMsg: string
    defaiteMsg: string
  }): ScenarioToCreate {
    return {
      name: p.name,
      difficulty: p.difficulty,
      victory: p.victory,
      defeat: p.defeat,
      time: p.time,
      reward: p.reward,
      rewardCoin: p.rewardCoin,
      text: p.text,
      victoryMsg: p.victoryMsg,
      defaiteMsg: p.defaiteMsg
    }
  }
}

export type ScenarioToCreate = Omit<Scenario, 'id'>
