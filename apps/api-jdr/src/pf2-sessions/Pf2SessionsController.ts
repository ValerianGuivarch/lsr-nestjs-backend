import { Body, Controller, Get, HttpException, HttpStatus, NotFoundException, Param, Post, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Pf2PersistenceService, Pf2Session, Pf2SessionInput } from '../pf2-storage/Pf2PersistenceService'

@Controller(['api/pf2-mj/sessions', 'api/v1/pf2-mj/sessions'])
@ApiTags('PF2 séances')
export class Pf2SessionsController {
  constructor(private readonly persistence: Pf2PersistenceService) {}

  @Get()
  list(): Promise<Pf2Session[]> { return this.persistence.listSessions() }

  @Get(':id')
  async get(@Param('id') id: string): Promise<Pf2Session> {
    const session = await this.persistence.getSession(id)
    if (!session) throw new NotFoundException('Séance introuvable.')
    return session
  }

  @Post()
  async create(@Body() body: Pf2SessionInput): Promise<Pf2Session> {
    try { return await this.persistence.createSession(body ?? {}) }
    catch (error) { throw new HttpException(error instanceof Error ? error.message : 'Séance invalide.', HttpStatus.BAD_REQUEST) }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Pf2SessionInput): Promise<Pf2Session> {
    try {
      const session = await this.persistence.updateSession(id, body ?? {})
      if (!session) throw new NotFoundException('Séance introuvable.')
      return session
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new HttpException(error instanceof Error ? error.message : 'Séance invalide.', HttpStatus.BAD_REQUEST)
    }
  }
}
