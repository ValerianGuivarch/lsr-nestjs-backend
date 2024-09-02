import { DBKnowledge } from './knowledge.db'
import { Knowledge } from '../domain/entities/knowledge.entity'
import { IKnowledgeProvider } from '../domain/providers/knowledge.provider'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
export class KnowledgeImplementation implements IKnowledgeProvider {
  constructor(
    @InjectRepository(DBKnowledge, 'postgres')
    private readonly knowledgeRepository: Repository<DBKnowledge>
  ) {}

  async findAll(): Promise<Knowledge[]> {
    return (
      await this.knowledgeRepository.find({
        relations: DBKnowledge.RELATIONS
      })
    ).map(DBKnowledge.toKnowledge)
  }
}
