import { SpellDto } from './entities/spell.dto'
import { SpellService } from '../../../../domain/services/spell.service'
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
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
}
