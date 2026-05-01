import { KnowledgeDto } from '../../knowledges/entities/knowledge.dto'
import { ApiProperty } from '@nestjs/swagger'

export class SpellToCreateDto {
  @ApiProperty({
    description: 'The spell name',
    type: String
  })
  name: string

  @ApiProperty({
    description: 'The spell rank',
    type: Number
  })
  rank: number

  @ApiProperty({
    description: 'The spell knowledge',
    type: KnowledgeDto
  })
  knowledgeName: string

  @ApiProperty({
    description: 'The spell formule',
    type: String
  })
  formule: string
}
