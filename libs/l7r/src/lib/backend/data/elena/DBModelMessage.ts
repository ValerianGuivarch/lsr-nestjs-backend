import { DBConstellation } from './DBConstellation'
import { DBEvent } from './DBEvent'
import { DBScenario } from './DBScenario'
import { Message } from '../../domain/models/elena/Message'
import { ModelMessage } from '../../domain/models/elena/ModelMessage'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

@Entity('ModelMessage')
export class DBModelMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  text: string

  @Column()
  senderId: string

  @ManyToOne(() => DBConstellation)
  @JoinColumn({ name: 'senderId' })
  sender: DBConstellation

  @Column({
    nullable: true,
    default: null
  })
  eventId?: string

  @ManyToOne(() => DBEvent)
  @JoinColumn({ name: 'eventId' })
  event: DBEvent

  @Column({
    nullable: true,
    default: null
  })
  scenarioId?: string

  @ManyToOne(() => DBScenario)
  @JoinColumn({ name: 'scenario' })
  scenario: DBScenario

  static readonly RELATIONS = {
    sender: true
  }

  static toModelMessage(dbModelMessage: DBModelMessage): Message {
    return new ModelMessage({
      id: dbModelMessage.id,
      text: dbModelMessage.text,
      sender: DBConstellation.toConstellation(dbModelMessage.sender)
    })
  }
}

export type DBModelMessageToCreate = Omit<DBModelMessage, 'id' | 'sender'>
