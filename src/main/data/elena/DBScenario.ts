import { Scenario } from '../../domain/models/elena/Scenario'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('Scenario')
export class DBScenario {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column()
  difficulty: string

  @Column()
  victory: string

  @Column()
  defeat: string

  @Column()
  time: string

  @Column()
  reward: string

  @Column({
    default: 0
  })
  rewardCoin: number

  @Column({
    default: ''
  })
  text: string

  @Column({
    default: ''
  })
  victoryMsg: string

  @Column({
    default: ''
  })
  defaiteMsg: string

  static readonly RELATIONS = {}

  static toScenario(dbScenario: DBScenario): Scenario {
    return new Scenario({
      id: dbScenario.id,
      text: dbScenario.text,
      name: dbScenario.name,
      difficulty: dbScenario.difficulty,
      victory: dbScenario.victory,
      defeat: dbScenario.defeat,
      time: dbScenario.time,
      reward: dbScenario.reward,
      rewardCoin: dbScenario.rewardCoin,
      victoryMsg: dbScenario.victoryMsg,
      defaiteMsg: dbScenario.defaiteMsg
    })
  }
}

export type DBScenarioToCreate = Omit<Scenario, 'id'>
