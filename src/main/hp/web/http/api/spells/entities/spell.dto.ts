import { Spell } from '../../../../../domain/entities/spell.entity'
import { KnowledgeDto } from '../../knowledges/entities/knowledge.dto'
import { ApiProperty } from '@nestjs/swagger'

export class SpellDto {
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
  knowledge: KnowledgeDto

  constructor(spell: SpellDto) {
    this.name = spell.name
    this.rank = spell.rank
    this.knowledge = spell.knowledge
  }
  static from(spell: Spell): SpellDto {
    return new SpellDto({
      name: spell.name,
      rank: spell.rank,
      knowledge: KnowledgeDto.from(spell.knowledge)
    })
  }
}
