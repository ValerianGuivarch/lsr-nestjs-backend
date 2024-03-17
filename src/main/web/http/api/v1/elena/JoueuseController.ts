import { JoueuseVM, JoueuseVMExample } from './entities/JoueuseVM'
import { CreateJoueuseRequest, CreateJoueuseRequestExample } from './requests/CreateJoueuseRequest'
import { UpdateJoueuseRequest } from './requests/UpdateJoueuseRequest'
import { Joueuse } from '../../../../../domain/models/elena/Joueuse'
import { Message } from '../../../../../domain/models/elena/Message'
import { ConstellationService } from '../../../../../domain/services/entities/elena/ConstellationService'
import { JoueuseService } from '../../../../../domain/services/entities/elena/JoueuseService'
import { MessageService } from '../../../../../domain/services/entities/elena/MessageService'
import { ScenarioService } from '../../../../../domain/services/entities/elena/ScenarioService'
import { generateRequestSchemasAndExamples, generateResponseContent } from '../../utils/swagger'
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Res } from '@nestjs/common'
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { FastifyReply } from 'fastify'

@Controller('api/v1/joueuses')
@ApiTags('Elena')
export class JoueuseController {
  constructor(
    private readonly joueuseService: JoueuseService,
    private readonly messageService: MessageService,
    private readonly scenarioService: ScenarioService,
    private readonly constellationsService: ConstellationService
  ) {}

  @ApiCreatedResponse({
    description: 'Create a new joueuse',
    content: generateResponseContent<JoueuseVM>({
      types: JoueuseVM,
      examples: {
        Example: JoueuseVMExample
      }
    })
  })
  @ApiBody({
    description: 'Create a new joueuse for account',
    required: true,
    ...generateRequestSchemasAndExamples<CreateJoueuseRequest>({
      types: CreateJoueuseRequest,
      examples: {
        Example: CreateJoueuseRequestExample
      }
    })
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('')
  async createNewJoueuse(@Body() request: CreateJoueuseRequest): Promise<JoueuseVM> {
    return JoueuseVM.fromJoueuse(
      await this.joueuseService.create(
        Joueuse.toJoueuseToCreate({
          name: request.name
        })
      ),
      [],
      []
    )
  }

  @ApiOkResponse({
    description: 'Get a joueuse by name',
    content: generateResponseContent<JoueuseVM>({
      types: JoueuseVM,
      examples: {
        Example: JoueuseVMExample
      }
    })
  })
  @HttpCode(HttpStatus.OK)
  @Get(':joueuseName')
  async getJoueuseById(@Param('joueuseName') joueuseName: string): Promise<JoueuseVM> {
    return JoueuseVM.fromJoueuse(
      await this.joueuseService.findOneByName(joueuseName),
      await this.messageService.findAll(),
      await this.constellationsService.findAll()
    )
  }

  @HttpCode(HttpStatus.OK)
  @Post(':joueuseName/sponsor/:sponsorId')
  async selectSponsor(@Param('joueuseName') joueuseName: string, @Param('sponsorId') sponsorId: string): Promise<void> {
    await this.joueuseService.update({
      joueuseName: joueuseName,
      joueuse: {
        sponsorId: sponsorId,
        sponsorToChoose: false
      }
    })
    await this.messageService.create(
      Message.toMessageToCreate({
        text: 'a été choisi comme sponsor',
        senderId: sponsorId
      })
    )
  }

  @ApiOkResponse({
    description: 'Update a joueuse',
    content: generateResponseContent<JoueuseVM>({
      types: JoueuseVM,
      examples: {
        Example: JoueuseVMExample
      }
    })
  })
  @HttpCode(HttpStatus.OK)
  @Patch(':joueuseName')
  async updateJoueuseById(
    @Param('joueuseName') joueuseName: string,
    @Body() request: UpdateJoueuseRequest
  ): Promise<JoueuseVM> {
    return JoueuseVM.fromJoueuse(
      await this.joueuseService.update({
        joueuseName: joueuseName,
        joueuse: {
          sponsorId: request.sponsorId,
          coins: request.coins,
          scenarioId: request.scenarioId
        }
      }),
      [],
      []
    )
  }

  @Get('')
  async getAllJoueuses(@Res() response: FastifyReply): Promise<JoueuseVM[]> {
    const joueuses = await this.joueuseService.findAll()
    const joueuseVMs = joueuses.map((joueuse) => JoueuseVM.fromJoueuse(joueuse, [], []))

    // Définir les en-têtes pour la pagination (adaptez selon vos besoins)
    response.header('Content-Range', `joueuses 0-${joueuseVMs.length}/${joueuseVMs.length}`)
    response.header('x-total-count', joueuseVMs.length.toString())

    return response.send(joueuseVMs)
  }
}
