import { DBMessage, DBMessageToCreate } from './DBMessage'
import { Message, MessageToCreate } from '../../domain/models/elena/Message'
import { IMessageProvider } from '../../domain/providers/elena/IMessageProvider'
import { ProviderErrors } from '../errors/ProviderErrors'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class DBMessageProvider implements IMessageProvider {
  private readonly logger = new Logger(DBMessage.name)
  constructor(
    @InjectRepository(DBMessage, 'postgres')
    private readonly messageRepository: Repository<DBMessage>
  ) {
    this.logger.log('Initialised')
  }

  async findAllBySenderId(senderId: string): Promise<Message[]> {
    const res = await this.messageRepository.find({
      where: {
        senderId: senderId
      },
      relations: DBMessage.RELATIONS
    })
    return res.map(DBMessage.toMessage)
  }

  async create(message: MessageToCreate): Promise<Message> {
    const toCreate: DBMessageToCreate = {
      text: message.text,
      senderId: message.senderId
    }
    const created = this.messageRepository.create(toCreate)
    await this.messageRepository.insert(created)
    return await this.findOneById(created.id)
  }

  async findOneById(id: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: {
        id: id
      },
      relations: DBMessage.RELATIONS
    })
    if (!message) {
      throw ProviderErrors.EntityNotFound(DBMessage.name)
    }
    return DBMessage.toMessage(message)
  }

  async findAll(): Promise<Message[]> {
    const res = await this.messageRepository.find({
      relations: DBMessage.RELATIONS
    })
    return res.map(DBMessage.toMessage)
  }

  async count(): Promise<number> {
    return await this.messageRepository.count()
  }
}
