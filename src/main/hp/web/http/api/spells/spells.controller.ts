import { SpellToCreateDto } from './entities/spell-create.dto'
import { SpellDto } from './entities/spell.dto'
import { SpellService } from '../../../../domain/services/spell.service'
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/hp/spells')
@ApiTags('Spells')
export class SpellController {
  constructor(private readonly spellService: SpellService) {}

  @ApiOkResponse({
    description: 'Get all spells'
  })
  @HttpCode(HttpStatus.OK)
  @Get('')
  async getAllSpells(): Promise<SpellDto[]> {
    const spells = await this.spellService.getAll()
    return spells.map(SpellDto.from)
  }

  @Post('')
  async postNewSpell(@Body() spell: SpellToCreateDto): Promise<void> {
    //console.log(JSON.stringify(spell))
    await this.spellService.createSpell({
      name: spell.name,
      rank: spell.rank,
      knowledgeName: spell.knowledgeName,
      formule: spell.formule
    })
  }
}
