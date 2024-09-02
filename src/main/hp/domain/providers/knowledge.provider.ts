import { Knowledge } from '../entities/knowledge.entity'

export interface IKnowledgeProvider {
  findAll(): Promise<Knowledge[]>
}
