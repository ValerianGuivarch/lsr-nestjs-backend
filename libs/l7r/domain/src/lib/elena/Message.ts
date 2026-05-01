import { Constellation } from './Constellation'

export class Message {
  id: string
  text: string
  sender: Constellation

  constructor(p: { id: string; text: string; sender: Constellation }) {
    this.id = p.id
    this.text = p.text
    this.sender = p.sender
  }

  static toMessageToCreate(p: { text: string; senderId: string }): MessageToCreate {
    return {
      text: p.text,
      senderId: p.senderId
    }
  }
}

export type MessageToCreate = Omit<Message, 'id' | 'sender'> & { senderId: string }
