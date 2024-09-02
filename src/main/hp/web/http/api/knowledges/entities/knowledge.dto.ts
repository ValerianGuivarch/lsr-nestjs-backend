import { Knowledge } from '../../../../../domain/entities/knowledge.entity'
import { StatDto } from '../../stats/entities/stat.dto'
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

  @ApiProperty({
    description: 'The knowledge stat',
    type: String
  })
  stat: StatDto

  constructor(knowledge: KnowledgeDto) {
    this.id = knowledge.id
    this.name = knowledge.name
    this.stat = knowledge.stat
  }
  static from(knowledge: Knowledge): KnowledgeDto {
    return new KnowledgeDto({
      id: knowledge.id,
      name: knowledge.name,
      stat: StatDto.from(knowledge.stat)
    })
  }
}
