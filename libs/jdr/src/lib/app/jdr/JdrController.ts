import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JdrService } from '../../domain/jdr/JdrService'
import { JdrDto, JdrSummaryDto } from './dto/JdrDto'
import { CreateJdrRequest, UpdateJdrRequest } from './dto/JdrRequests'

@Controller('api/v1/jdr')
@ApiTags('JdR')
export class JdrController {
  constructor(private readonly jdrService: JdrService) {}

  @Get()
  async findAll(): Promise<JdrSummaryDto[]> {
    return this.jdrService.findAll()
  }

  @Get(':jdrSlug')
  async findOne(@Param('jdrSlug') jdrSlug: string): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async create(@Body() body: CreateJdrRequest): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.create(body))
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':jdrSlug')
  async delete(@Param('jdrSlug') jdrSlug: string): Promise<void> {
    return this.jdrService.delete(jdrSlug)
  }

  @Put(':jdrSlug')
  async update(@Param('jdrSlug') jdrSlug: string, @Body() body: UpdateJdrRequest): Promise<JdrDto> {
    return JdrDto.from(await this.jdrService.update(jdrSlug, body))
  }
}
