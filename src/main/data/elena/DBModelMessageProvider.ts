import { DBModelMessage } from './DBModelMessage'
import { ModelMessage } from '../../domain/models/elena/ModelMessage'
import { IModelMessageProvider } from '../../domain/providers/elena/IModelMessageProvider'
import { ProviderErrors } from '../errors/ProviderErrors'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class DBModelMessageProvider implements IModelMessageProvider {
  private readonly logger = new Logger(DBModelMessage.name)
  constructor(
    @InjectRepository(DBModelMessage, 'postgres')
    private readonly modelMessageRepository: Repository<DBModelMessage>
  ) {
    this.logger.log('Initialised')
  }

  async findAllBySenderId(senderId: string): Promise<ModelMessage[]> {
    const res = await this.modelMessageRepository.find({
      where: {
        senderId: senderId
      },
      relations: DBModelMessage.RELATIONS
    })
    return res.map(DBModelMessage.toModelMessage)
  }

  async findOneById(id: string): Promise<ModelMessage> {
    const modelMessage = await this.modelMessageRepository.findOne({
      where: {
        id: id
      },
      relations: DBModelMessage.RELATIONS
    })
    if (!modelMessage) {
      throw ProviderErrors.EntityNotFound(DBModelMessage.name)
    }
    return DBModelMessage.toModelMessage(modelMessage)
  }

  async findAll(): Promise<ModelMessage[]> {
    const res = await this.modelMessageRepository.find({
      relations: DBModelMessage.RELATIONS
    })
    return res.map(DBModelMessage.toModelMessage)
  }
}
