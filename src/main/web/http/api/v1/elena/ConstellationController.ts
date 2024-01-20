import { ConstellationVM, ConstellationVMExample } from './entities/ConstellationVM'
import {
  CreateConstellationRequest,
  CreateConstellationRequestExampleGothel,
  CreateConstellationRequestExampleSumra
} from './requests/CreateConstellationRequest'
import { Constellation } from '../../../../../domain/models/elena/Constellation'
import { ConstellationService } from '../../../../../domain/services/entities/elena/ConstellationService'
import { generateRequestSchemasAndExamples, generateResponseContent } from '../../utils/swagger'
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common'
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { FastifyReply } from 'fastify'

@Controller('api/v1/constellations')
@ApiTags('Elena')
export class ConstellationController {
  constructor(private readonly constellationService: ConstellationService) {}

  @ApiCreatedResponse({
    description: 'Create a new constellation',
    content: generateResponseContent<ConstellationVM>({
      types: ConstellationVM,
      examples: {
        Example: ConstellationVMExample
      }
    })
  })
  @ApiBody({
    description: 'Create a new constellation for account',
    required: true,
    ...generateRequestSchemasAndExamples<CreateConstellationRequest>({
      types: CreateConstellationRequest,
      examples: {
        Gothel: CreateConstellationRequestExampleGothel,
        Sumra: CreateConstellationRequestExampleSumra
      }
    })
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('')
  async createNewConstellation(@Body() request: CreateConstellationRequest): Promise<ConstellationVM> {
    return ConstellationVM.fromConstellation(
      await this.constellationService.create(
        Constellation.toConstellationToCreate({
          name: request.name,
          realName: request.realName,
          pictureUrl: request.pictureUrl,
          pictureUrlRevealed: request.pictureUrlRevealed,
          isStarStream: false,
          sponsor: false
        })
      )
    )
  }

  @ApiOkResponse({
    description: 'Get a constellation by id',
    content: generateResponseContent<ConstellationVM>({
      types: ConstellationVM,
      examples: {
        Example: ConstellationVMExample
      }
    })
  })
  @HttpCode(HttpStatus.OK)
  @Get(':constellationId')
  async getConstellationById(@Param('constellationId') constellationId: string): Promise<ConstellationVM> {
    return ConstellationVM.fromConstellation(await this.constellationService.findOneById(constellationId))
  }

  @Post(':constellationId/reveal')
  async revealConstellation(constellationId: string): Promise<ConstellationVM> {
    return ConstellationVM.fromConstellation(await this.constellationService.reveal(constellationId))
  }

  @Get('')
  async getAllConstellations(@Res() response: FastifyReply): Promise<ConstellationVM[]> {
    const constellationsVM = (await this.constellationService.findAll()).map(ConstellationVM.fromConstellation)

    // Définir les en-têtes pour la pagination (adaptez selon vos besoins)
    response.header('Content-Range', `joueuses 0-${constellationsVM.length}/${constellationsVM.length}`)
    response.header('x-total-count', constellationsVM.length.toString())

    return response.send(constellationsVM)
  }
}
