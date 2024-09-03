import { Knowledge } from '../entities/knowledge.entity'
import { IKnowledgeProvider } from '../providers/knowledge.provider'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class KnowledgeService {
  constructor(@Inject('IKnowledgeProvider') private knowledgeProvider: IKnowledgeProvider) {}

  async getAll(): Promise<Knowledge[]> {
    return await this.knowledgeProvider.findAll()
  }
}
