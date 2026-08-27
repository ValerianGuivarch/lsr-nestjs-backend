import { Controller, Get, Param } from '@nestjs/common'
import { FoundryRelayService } from './FoundryRelayService'

@Controller('foundry')
export class FoundryRelayController {
  constructor(private readonly foundry: FoundryRelayService) {}

  @Get('clients')
  clients(): Promise<unknown> {
    return this.foundry.listClients()
  }

  @Get('actors')
  actors(): Promise<unknown> {
    return this.foundry.listActors()
  }

  @Get('actors/:uuid')
  actor(@Param('uuid') uuid: string): Promise<unknown> {
    return this.foundry.getActor(uuid)
  }
}
