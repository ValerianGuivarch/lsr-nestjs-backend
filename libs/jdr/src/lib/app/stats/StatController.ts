import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JdrService } from '../../domain/jdr/JdrService'
import { JdrDto } from '../jdr/dto/JdrDto'
import { StatService } from '../../domain/stats/StatService'
import { AddStatRequest, UpdateStatRequest } from './dto/StatRequests'

// Stat mutations still respond with the full recomposed Jdr to preserve the existing frontend contract.
@Controller('api/v1/jdr')
@ApiTags('JdR')
export class StatController {
  constructor(
    private readonly statService: StatService,
    private readonly jdrService: JdrService
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/stats')
  async addStat(@Param('jdrSlug') jdrSlug: string, @Body() body: AddStatRequest): Promise<JdrDto> {
    await this.statService.add(jdrSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Put(':jdrSlug/stats/:statSlug')
  async updateStat(
    @Param('jdrSlug') jdrSlug: string,
    @Param('statSlug') statSlug: string,
    @Body() body: UpdateStatRequest
  ): Promise<JdrDto> {
    await this.statService.update(jdrSlug, statSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Delete(':jdrSlug/stats/:statSlug')
  async removeStat(@Param('jdrSlug') jdrSlug: string, @Param('statSlug') statSlug: string): Promise<JdrDto> {
    await this.statService.remove(jdrSlug, statSlug)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }
}
