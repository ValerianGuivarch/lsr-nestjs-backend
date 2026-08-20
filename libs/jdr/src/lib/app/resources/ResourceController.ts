import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JdrService } from '../../domain/jdr/JdrService'
import { JdrDto } from '../jdr/dto/JdrDto'
import { ResourceService } from '../../domain/resources/ResourceService'
import { AddResourceRequest, UpdateGroupResourceRequest, UpdateResourceRequest } from './dto/ResourceRequests'

// Resource mutations still respond with the full recomposed Jdr to preserve the existing frontend contract.
@Controller('api/v1/jdr')
@ApiTags('JdR')
export class ResourceController {
  constructor(
    private readonly resourceService: ResourceService,
    private readonly jdrService: JdrService
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/resources')
  async addResource(@Param('jdrSlug') jdrSlug: string, @Body() body: AddResourceRequest): Promise<JdrDto> {
    await this.resourceService.add(jdrSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Put(':jdrSlug/resources/:resourceSlug')
  async updateResource(@Param('jdrSlug') jdrSlug: string, @Param('resourceSlug') resourceSlug: string, @Body() body: UpdateResourceRequest): Promise<JdrDto> {
    await this.resourceService.update(jdrSlug, resourceSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Delete(':jdrSlug/resources/:resourceSlug')
  async removeResource(@Param('jdrSlug') jdrSlug: string, @Param('resourceSlug') resourceSlug: string): Promise<JdrDto> {
    await this.resourceService.remove(jdrSlug, resourceSlug)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Put(':jdrSlug/group-resources/:resourceSlug')
  async updateGroupResource(
    @Param('jdrSlug') jdrSlug: string,
    @Param('resourceSlug') resourceSlug: string,
    @Body() body: UpdateGroupResourceRequest
  ): Promise<JdrDto> {
    await this.resourceService.updateGroupResource(jdrSlug, resourceSlug, body.value)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }
}
