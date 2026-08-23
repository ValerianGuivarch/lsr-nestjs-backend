import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JdrService } from '../../domain/jdr/JdrService'
import { JdrDto } from '../jdr/dto/JdrDto'
import { ItemService } from '../../domain/items/ItemService'
import { AddGroupItemRequest, AddItemRequest, UpdateItemRequest } from './dto/ItemRequests'

// Item mutations still respond with the full recomposed Jdr to preserve the existing frontend contract.
@Controller('api/v1/jdr')
@ApiTags('JdR')
export class ItemController {
  constructor(
    private readonly itemService: ItemService,
    private readonly jdrService: JdrService
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/items')
  async addItem(@Param('jdrSlug') jdrSlug: string, @Body() body: AddItemRequest): Promise<JdrDto> {
    await this.itemService.add(jdrSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Put(':jdrSlug/items/:itemSlug')
  async updateItem(
    @Param('jdrSlug') jdrSlug: string,
    @Param('itemSlug') itemSlug: string,
    @Body() body: UpdateItemRequest
  ): Promise<JdrDto> {
    await this.itemService.update(jdrSlug, itemSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Delete(':jdrSlug/items/:itemSlug')
  async removeItem(@Param('jdrSlug') jdrSlug: string, @Param('itemSlug') itemSlug: string): Promise<JdrDto> {
    await this.itemService.remove(jdrSlug, itemSlug)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/group-items')
  async addGroupItem(@Param('jdrSlug') jdrSlug: string, @Body() body: AddGroupItemRequest): Promise<JdrDto> {
    await this.itemService.addGroupItem(jdrSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Delete(':jdrSlug/group-items/:itemSlug')
  async removeGroupItem(@Param('jdrSlug') jdrSlug: string, @Param('itemSlug') itemSlug: string): Promise<JdrDto> {
    await this.itemService.removeGroupItem(jdrSlug, itemSlug)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }
}
