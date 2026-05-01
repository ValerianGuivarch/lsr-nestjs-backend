import { Message, MessageToCreate } from '../../models/elena/Message'

export interface IMessageProvider {
  create(message: MessageToCreate): Promise<Message>
  findAll(): Promise<Message[]>
  count(): Promise<number>
  findAllBySenderId(senderId: string): Promise<Message[]>
}
