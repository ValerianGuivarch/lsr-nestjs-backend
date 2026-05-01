import { Constellation } from './Constellation'

export class ModelMessage {
  id: string
  text: string
  sender: Constellation

  constructor(p: { id: string; text: string; sender: Constellation }) {
    this.id = p.id
    this.text = p.text
    this.sender = p.sender
  }

  static toModelMessageToCreate(p: { text: string; senderId: string }): ModelMessageToCreate {
    return {
      text: p.text,
      senderId: p.senderId
    }
  }
}

export type ModelMessageToCreate = Omit<ModelMessage, 'id' | 'sender'> & { senderId: string }
