import { ConstellationVM, ConstellationVMExample } from './ConstellationVM'
import { MessageVM } from './MessageVM'
import { ScenarioVM, ScenarioVMExample } from './ScenarioVM'
import { Joueuse } from '../../../../../../domain/models/elena/Joueuse'
import { PlayState } from '../../../../../../domain/models/elena/PlayState'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Message } from 'src/main/domain/models/elena/Message'

export class JoueuseVM {
  @ApiProperty({
    description: 'The joueuse id',
    type: String
  })
  id: string

  @ApiProperty({
    description: 'The joueuse name',
    type: String
  })
  name: string

  @ApiProperty({
    description: 'The joueuse coins',
    type: Number
  })
  coins: number

  @ApiPropertyOptional({
    description: 'The joueuse sponsor',
    type: ConstellationVM
  })
  sponsor?: ConstellationVM

  @ApiPropertyOptional({
    description: 'The joueuse scenario',
    type: ScenarioVM
  })
  scenario?: ScenarioVM

  messages: MessageVM[]

  state: PlayState

  constructor(joueuse: JoueuseVM) {
    this.id = joueuse.id
    this.name = joueuse.name
    this.coins = joueuse.coins
    this.sponsor = joueuse.sponsor
    this.scenario = joueuse.scenario
    this.state = joueuse.state
    this.messages = joueuse.messages
  }

  static fromJoueuse(joueuse: Joueuse, messages: Message[]): JoueuseVM {
    return new JoueuseVM({
      id: joueuse.id,
      name: joueuse.name,
      coins: joueuse.coins,
      state: joueuse.state,
      messages: messages.map((m) => MessageVM.fromMessage(m)),
      sponsor: joueuse.sponsor ? ConstellationVM.fromConstellation(joueuse.sponsor) : undefined
    })
  }
}

export const JoueuseVMExample: JoueuseVM = {
  id: '1',
  name: 'Joueuse',
  coins: 0,
  sponsor: ConstellationVMExample,
  scenario: ScenarioVMExample,
  state: PlayState.NOT_STARTED,
  messages: []
}
