import { HouseDto } from './entities/house.dto'
import { HousePointsUpdateRequest, HousesPointsUpdateRequest } from './requests/house-points-update.request'
import { HouseService } from '../../../../application/services/house.service'
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common'
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger'

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

  @ApiOkResponse({
    description: 'Update points for a house'
  })
  @ApiBody({
    description: 'Points to update',
    required: true,
    type: HousePointsUpdateRequest
  })
  @HttpCode(HttpStatus.OK)
  @Patch(':houseName')
  async updateHousePoints(
    @Param('houseName') houseName: string,
    @Body() request: HousePointsUpdateRequest
  ): Promise<HouseDto> {
    return HouseDto.from(await this.houseService.updatePoints(houseName, request.points))
  }

  @ApiOkResponse({
    description: 'Update points for all houses'
  })
  @ApiBody({
    description: 'Points map by house name',
    required: true,
    type: HousesPointsUpdateRequest
  })
  @HttpCode(HttpStatus.OK)
  @Patch('')
  async updateAllHousesPoints(@Body() request: HousesPointsUpdateRequest): Promise<HouseDto[]> {
    const houses = await this.houseService.updateManyPoints(
      Object.entries(request.pointsByHouse ?? {}).map(([houseName, points]) => ({
        houseName,
        points
      }))
    )
    return houses.map(HouseDto.from)
  }
}
