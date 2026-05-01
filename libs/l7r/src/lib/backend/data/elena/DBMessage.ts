import { DBConstellation } from './DBConstellation'
import { Message } from '../../domain/models/elena/Message'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

@Entity('Message')
export class DBMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  text: string

  @Column()
  senderId: string

  @ManyToOne(() => DBConstellation)
  @JoinColumn({ name: 'senderId' })
  sender: DBConstellation

  static readonly RELATIONS = {
    sender: true
  }

  static toMessage(dbMessage: DBMessage): Message {
    return new Message({
      id: dbMessage.id,
      text: dbMessage.text,
      sender: DBConstellation.toConstellation(dbMessage.sender)
    })
  }
}

export type DBMessageToCreate = Omit<DBMessage, 'id' | 'sender'>
