import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { PlayerCodexService } from './PlayerCodexService'

@Controller(['api/pf2-mj/player-codex', 'api/v1/pf2-mj/player-codex'])
export class PlayerCodexController {
  constructor(private readonly service: PlayerCodexService) {}
  @Get('character-candidates') candidates(@Query('q') q = ''): Promise<unknown> { return this.service.characterCandidates(q) }
  @Get('characters') characters(): Promise<unknown> { return this.service.listCharacters() }
  @Get('players') players(): Promise<unknown> { return this.service.listPlayers() }
  @Get('characters/:npcId') character(@Param('npcId') id: string): Promise<unknown> { return this.service.character(id) }
  @Post('characters') createCharacter(@Body() body: { npcId: string; displayName: string; wikiPageTitle: string; wikiPortraitFilename?: string | null; isPlayer?: boolean }): Promise<unknown> { return this.service.createCharacter(body) }
  @Patch('characters/:npcId') updateCharacter(@Param('npcId') id: string, @Body() body: { displayName?: unknown; wikiPortraitFilename?: unknown; isPlayer?: unknown }): Promise<unknown> { return this.service.updateCharacter(id, body) }
  @Post('characters/:npcId/factions') addFaction(@Param('npcId') id: string, @Body() body: { factionId: string }): Promise<unknown> { return this.service.addCharacterFaction(id, body.factionId) }
  @Delete('characters/:npcId/factions/:factionId') async removeFaction(@Param('npcId') id: string, @Param('factionId') faction: string): Promise<{ removed: true }> { await this.service.removeCharacterFaction(id, faction); return { removed: true } }
  @Get('factions') factions(): Promise<unknown> { return this.service.listFactions() }
  @Get('factions/:id') faction(@Param('id') id: string): Promise<unknown> { return this.service.faction(id) }
  @Post('factions') createFaction(@Body() body: { name: string; wikiPageTitle?: string }): Promise<unknown> { return this.service.createFaction(body) }
  @Patch('factions/:id') updateFaction(@Param('id') id: string, @Body() body: { name?: unknown; parentFactionId?: unknown }): Promise<unknown> { return this.service.updateFaction(id, body) }
}
