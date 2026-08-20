import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JdrService } from '../../domain/jdr/JdrService'
import { JdrDto } from '../jdr/dto/JdrDto'
import { GroupService } from '../../domain/groups/GroupService'
import { AddGroupRequest, UpdateGroupRequest } from './dto/GroupRequests'

// Group mutations still respond with the full recomposed Jdr to preserve the existing frontend contract.
@Controller('api/v1/jdr')
@ApiTags('JdR')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly jdrService: JdrService
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/groups')
  async addGroup(@Param('jdrSlug') jdrSlug: string, @Body() body: AddGroupRequest): Promise<JdrDto> {
    await this.groupService.add(jdrSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Put(':jdrSlug/groups/:groupSlug')
  async updateGroup(@Param('jdrSlug') jdrSlug: string, @Param('groupSlug') groupSlug: string, @Body() body: UpdateGroupRequest): Promise<JdrDto> {
    await this.groupService.update(jdrSlug, groupSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Delete(':jdrSlug/groups/:groupSlug')
  async removeGroup(@Param('jdrSlug') jdrSlug: string, @Param('groupSlug') groupSlug: string): Promise<JdrDto> {
    await this.groupService.remove(jdrSlug, groupSlug)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }
}
