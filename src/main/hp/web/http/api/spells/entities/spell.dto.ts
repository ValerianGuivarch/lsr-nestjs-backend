import { Spell } from '../../../../../domain/entities/spell.entity'
import { KnowledgeDto } from '../../knowledges/entities/knowledge.dto'
import { StatDto } from '../../stats/entities/stat.dto'
import { ApiProperty } from '@nestjs/swagger'

export class SpellDto {
  @ApiProperty({
    description: 'The spell uuid',
    type: String,
    format: 'uuid'
  })
  id: string

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
    description: 'The spell stat',
    type: String
  })
  stat: StatDto

  @ApiProperty({
    description: 'The spell knowledge',
    type: KnowledgeDto
  })
  knowledge: KnowledgeDto

  constructor(spell: SpellDto) {
    this.id = spell.id
    this.name = spell.name
    this.stat = spell.stat
    this.rank = spell.rank
    this.knowledge = spell.knowledge
  }
  static from(spell: Spell): SpellDto {
    return new SpellDto({
      id: spell.id,
      name: spell.name,
      rank: spell.rank,
      stat: StatDto.from(spell.stat),
      knowledge: KnowledgeDto.from(spell.knowledge)
    })
  }
}
