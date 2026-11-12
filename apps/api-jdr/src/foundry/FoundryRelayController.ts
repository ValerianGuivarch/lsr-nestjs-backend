import { Body, Controller, ForbiddenException, Get, Headers, Param, Post, Put } from '@nestjs/common'
import { FoundryRelayService } from './FoundryRelayService'

@Controller('foundry')
export class FoundryRelayController {
  constructor(private readonly foundry: FoundryRelayService) {}

  /**
   * Privileged GM-only document operations, guarded independently of public
   * Foundry character APIs. Never send the Relay API key to the caller.
   */
  private requireGmKey(supplied: string): void {
    const expected = process.env['PF2_JOURNALS_INTERNAL_KEY']
    if (!expected || supplied !== expected) throw new ForbiddenException('Accès interne aux scènes Foundry refusé.')
  }

  @Get('gm/scenes/:uuid')
  gmScene(@Param('uuid') uuid: string, @Headers('x-pf2-journals-key') key = ''): Promise<unknown> {
    this.requireGmKey(key)
    return this.foundry.readGmScene(uuid)
  }

  @Get('gm/scenes/:uuid/canvas/:type')
  gmCanvas(@Param('uuid') uuid: string, @Param('type') type: string, @Headers('x-pf2-journals-key') key = ''): Promise<unknown> {
    this.requireGmKey(key)
    return this.foundry.listGmCanvas(uuid, type)
  }

  @Post('gm/scenes/:uuid/canvas/:type')
  gmCreateCanvas(@Param('uuid') uuid: string, @Param('type') type: string, @Body() data: unknown, @Headers('x-pf2-journals-key') key = ''): Promise<unknown> {
    this.requireGmKey(key)
    return this.foundry.createGmCanvas(uuid, type, data)
  }

  @Put('gm/scenes/:uuid/canvas/:type/:documentId')
  gmUpdateCanvas(@Param('uuid') uuid: string, @Param('type') type: string, @Param('documentId') documentId: string, @Body() data: unknown, @Headers('x-pf2-journals-key') key = ''): Promise<unknown> {
    this.requireGmKey(key)
    return this.foundry.updateGmCanvas(uuid, type, documentId, data)
  }

  @Post('gm/documents/:type')
  gmCreateDocument(@Param('type') type: string, @Body() data: unknown, @Headers('x-pf2-journals-key') key = ''): Promise<unknown> {
    this.requireGmKey(key)
    return this.foundry.createGmWorldDocument(type, data)
  }

  @Put('gm/documents/:uuid')
  gmUpdateDocument(@Param('uuid') uuid: string, @Body() data: unknown, @Headers('x-pf2-journals-key') key = ''): Promise<unknown> {
    this.requireGmKey(key)
    return this.foundry.updateGmWorldDocument(uuid, data)
  }

  @Get('clients')
  clients(): Promise<unknown> {
    return this.foundry.listClients()
  }

  @Get('actors')
  actors(): Promise<unknown> {
    return this.foundry.listActors()
  }

  @Get('scene-folders')
  sceneFolders(): Promise<unknown> {
    return this.foundry.listSceneFolders()
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
