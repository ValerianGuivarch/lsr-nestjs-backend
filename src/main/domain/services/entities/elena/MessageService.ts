import { Message, MessageToCreate } from '../../../models/elena/Message'
import { IMessageProvider } from '../../../providers/elena/IMessageProvider'
import { IModelMessageProvider } from '../../../providers/elena/IModelMessageProvider'
import { INotificationProvider } from '../../../providers/elena/INotificationProvider'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class MessageService {
  constructor(
    @Inject('IMessageProvider') private readonly messageProvider: IMessageProvider,
    @Inject('IModelMessageProvider') private readonly modelMessageProvider: IModelMessageProvider,
    @Inject('INotificationProvider') private readonly notificationProvider: INotificationProvider
  ) {}

  async notify(p: { titre: string; text: string; pictureUrl: string }): Promise<void> {
    await this.notificationProvider.send(p)
  }

  async create(messageToCreate: MessageToCreate, notifTitle?: string): Promise<Message> {
    //console.log('Creating message:', messageToCreate)
    const message = await this.messageProvider.create(messageToCreate)
    //console.log('Message created:', message)
    await this.notificationProvider.send({
      titre: notifTitle ? notifTitle : message.sender.name,
      text: message.text,
      pictureUrl: message.sender.revealed ? message.sender.pictureUrlRevealed : message.sender.pictureUrl
    })
    return message
  }

  async findAll(): Promise<Message[]> {
    return await this.messageProvider.findAll()
  }

  async findAllBySenderId(senderId: string): Promise<Message[]> {
    return await this.messageProvider.findAllBySenderId(senderId)
  }

  async count(): Promise<number> {
    return await this.messageProvider.count()
  }

  async sendWithModel(modelMessageIds: string[]): Promise<void> {
    for (const modelMessageId of modelMessageIds) {
      const modelMessage = await this.modelMessageProvider.findOneById(modelMessageId)
      await this.create({
        senderId: modelMessage.sender.id,
        text: modelMessage.text
      })
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}
