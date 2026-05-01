import { Scenario } from '../../../../../../domain/models/elena/Scenario'

export class ScenarioVM {
  id: string
  name: string
  difficulty: string
  victory: string
  defeat: string
  time: string
  reward: string
  text: string

  constructor(p: {
    id: string
    name: string
    difficulty: string
    victory: string
    defeat: string
    time: string
    reward: string
    text: string
  }) {
    this.id = p.id
    this.name = p.name
    this.difficulty = p.difficulty
    this.victory = p.victory
    this.defeat = p.defeat
    this.time = p.time
    this.reward = p.reward
    this.text = p.text
  }

  static fromScenario(scenario: Scenario): ScenarioVM {
    return new ScenarioVM({
      id: scenario.id,
      name: scenario.name,
      difficulty: scenario.difficulty,
      victory: scenario.victory,
      defeat: scenario.defeat,
      time: scenario.time,
      text: scenario.text,
      reward: scenario.reward
    })
  }
}

export const ScenarioVMExample: ScenarioVM = {
  id: '1',
  name: 'Scenario 1',
  text: 'Text 1',
  difficulty: 'difficulty 1',
  victory: 'victory 1',
  defeat: 'defeat 1',
  time: 'time 1',
  reward: 'reward 1'
}
