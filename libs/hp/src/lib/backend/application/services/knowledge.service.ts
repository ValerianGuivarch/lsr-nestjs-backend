import { Knowledge } from '../../domain/entities/knowledge.entity'
import { IKnowledgeProvider } from '../../domain/ports/knowledge.provider'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class KnowledgeService {
  constructor(@Inject('IKnowledgeProvider') private knowledgeProvider: IKnowledgeProvider) {}

  async getAll(): Promise<Knowledge[]> {
    return await this.knowledgeProvider.findAll()
  }
}
