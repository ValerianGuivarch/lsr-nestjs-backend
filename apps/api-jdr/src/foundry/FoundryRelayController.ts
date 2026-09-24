import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common'
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

  @Get('players')
  players(): Promise<unknown> {
    return this.foundry.listPlayers()
  }

  @Get('players/:uuid/xp')
  playerXp(@Param('uuid') uuid: string): Promise<unknown> {
    return this.foundry.getPlayerXp(uuid)
  }

  @Put('players/:uuid/xp')
  setPlayerXp(@Param('uuid') uuid: string, @Body() body: { xp?: unknown }): Promise<unknown> {
    return this.foundry.setPlayerXp(uuid, body?.xp)
  }

  @Post('players/:uuid/xp/add')
  addPlayerXp(@Param('uuid') uuid: string, @Body() body: { added?: unknown }): Promise<unknown> {
    return this.foundry.addPlayerXp(uuid, body?.added)
  }

  @Get('players/:uuid/xpc')
  playerXpc(@Param('uuid') uuid: string): Promise<unknown> {
    return this.foundry.getPlayerXpc(uuid)
  }

  @Put('players/:uuid/xpc')
  setPlayerXpc(@Param('uuid') uuid: string, @Body() body: { xpc?: unknown }): Promise<unknown> {
    return this.foundry.setPlayerXpc(uuid, body?.xpc)
  }

  @Post('players/:uuid/xpc/add')
  addPlayerXpc(@Param('uuid') uuid: string, @Body() body: { added?: unknown }): Promise<unknown> {
    return this.foundry.addPlayerXpc(uuid, body?.added)
  }
}
