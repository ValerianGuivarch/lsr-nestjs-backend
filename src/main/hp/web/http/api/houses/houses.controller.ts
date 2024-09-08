import { HouseDto } from './entities/house.dto'
import { HouseService } from '../../../../domain/services/house.service'
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/hp/houses')
@ApiTags('Houses')
export class HouseController {
  constructor(private readonly houseService: HouseService) {}

  @ApiOkResponse({
    description: 'Get all houses'
  })
  @HttpCode(HttpStatus.OK)
  @Get('')
  async getAllHouses(): Promise<HouseDto[]> {
    const houses = await this.houseService.getAll()
    return houses.map(HouseDto.from)
  }
}
