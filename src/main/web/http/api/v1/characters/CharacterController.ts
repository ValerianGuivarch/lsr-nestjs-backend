import { CharacterVM } from './entities/CharacterVM'
import { CharacterService } from '../../../../../domain/services/CharacterService'
import { Controller, Get, Logger, Param, Res } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/characters')
@ApiTags('Character')
export class CharacterController {
  private readonly logger = new Logger(CharacterController.name)
  constructor(private characterService: CharacterService) {}

  @ApiOkResponse()
  @Get(':name')
  async findByName(@Param('name') name: string): Promise<CharacterVM> {
    this.logger.log('get character')

    const character = await this.characterService.findByName(name)

    this.logger.log('get character', character)
    return CharacterVM.of({
      character: character
    })
  }
}
