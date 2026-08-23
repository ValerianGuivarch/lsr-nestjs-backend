import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JdrService } from '../../domain/jdr/JdrService'
import { PlayerService } from '../../domain/players/PlayerService'
import { JdrDto } from '../jdr/dto/JdrDto'
import { AddPlayerRequest, UpdatePlayerRequest } from './dto/PlayerRequests'

@Controller('api/v1/jdr')
@ApiTags('JdR')
export class PlayerController {
  constructor(
    private readonly playerService: PlayerService,
    private readonly jdrService: JdrService
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/players')
  async add(@Param('jdrSlug') jdrSlug: string, @Body() body: AddPlayerRequest): Promise<JdrDto> {
    await this.playerService.add(jdrSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Put(':jdrSlug/players/:playerSlug')
  async update(
    @Param('jdrSlug') jdrSlug: string,
    @Param('playerSlug') playerSlug: string,
    @Body() body: UpdatePlayerRequest
  ): Promise<JdrDto> {
    await this.playerService.update(jdrSlug, playerSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Delete(':jdrSlug/players/:playerSlug')
  async remove(@Param('jdrSlug') jdrSlug: string, @Param('playerSlug') playerSlug: string): Promise<JdrDto> {
    await this.playerService.remove(jdrSlug, playerSlug)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }
}
