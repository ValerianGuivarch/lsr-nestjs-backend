import { Knowledge } from '../../../../../domain/entities/knowledge.entity'
import { ApiProperty } from '@nestjs/swagger'

export class KnowledgeDto {
  @ApiProperty({
    description: 'The knowledge uuid',
    type: String,
    format: 'uuid'
  })
  id: string

  @ApiProperty({
    description: 'The knowledge name',
    type: String
  })
  name: string

  constructor(knowledge: KnowledgeDto) {
    this.id = knowledge.id
    this.name = knowledge.name
  }
  static from(knowledge: Knowledge): KnowledgeDto {
    return new KnowledgeDto({
      id: knowledge.id,
      name: knowledge.name
    })
  }
}
