import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JdrService } from '../../domain/jdr/JdrService'
import { JdrDto } from '../jdr/dto/JdrDto'
import { ClassService } from '../../domain/classes/ClassService'
import { AddClassRequest, UpdateClassRequest } from './dto/ClassRequests'

// Class mutations still respond with the full recomposed Jdr to preserve the existing frontend contract.
@Controller('api/v1/jdr')
@ApiTags('JdR')
export class ClassController {
  constructor(
    private readonly classService: ClassService,
    private readonly jdrService: JdrService
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/classes')
  async addClass(@Param('jdrSlug') jdrSlug: string, @Body() body: AddClassRequest): Promise<JdrDto> {
    await this.classService.add(jdrSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Put(':jdrSlug/classes/:classSlug')
  async updateClass(
    @Param('jdrSlug') jdrSlug: string,
    @Param('classSlug') classSlug: string,
    @Body() body: UpdateClassRequest
  ): Promise<JdrDto> {
    await this.classService.update(jdrSlug, classSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Delete(':jdrSlug/classes/:classSlug')
  async removeClass(@Param('jdrSlug') jdrSlug: string, @Param('classSlug') classSlug: string): Promise<JdrDto> {
    await this.classService.remove(jdrSlug, classSlug)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }
}
