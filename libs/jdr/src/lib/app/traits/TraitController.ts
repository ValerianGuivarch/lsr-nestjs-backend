import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JdrService } from '../../domain/jdr/JdrService'
import { JdrDto } from '../jdr/dto/JdrDto'
import { TraitService } from '../../domain/traits/TraitService'
import { AddTraitRequest, UpdateTraitRequest } from './dto/TraitRequests'

// Trait mutations still respond with the full recomposed Jdr to preserve the existing frontend contract.
@Controller('api/v1/jdr')
@ApiTags('JdR')
export class TraitController {
  constructor(
    private readonly traitService: TraitService,
    private readonly jdrService: JdrService
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post(':jdrSlug/traits')
  async addTrait(@Param('jdrSlug') jdrSlug: string, @Body() body: AddTraitRequest): Promise<JdrDto> {
    await this.traitService.add(jdrSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Put(':jdrSlug/traits/:traitSlug')
  async updateTrait(@Param('jdrSlug') jdrSlug: string, @Param('traitSlug') traitSlug: string, @Body() body: UpdateTraitRequest): Promise<JdrDto> {
    await this.traitService.update(jdrSlug, traitSlug, body)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }

  @Delete(':jdrSlug/traits/:traitSlug')
  async removeTrait(@Param('jdrSlug') jdrSlug: string, @Param('traitSlug') traitSlug: string): Promise<JdrDto> {
    await this.traitService.remove(jdrSlug, traitSlug)
    return JdrDto.from(await this.jdrService.findOneBySlug(jdrSlug))
  }
}
