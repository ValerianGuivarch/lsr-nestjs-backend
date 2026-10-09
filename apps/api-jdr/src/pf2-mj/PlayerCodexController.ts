import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UnauthorizedException } from '@nestjs/common'
import { PlayerCodexService } from './PlayerCodexService'

@Controller(['api/pf2-mj/player-codex', 'api/v1/pf2-mj/player-codex'])
export class PlayerCodexController {
  constructor(private readonly service: PlayerCodexService) {}
  @Get('character-candidates') candidates(@Query('q') q = ''): Promise<unknown> { return this.service.characterCandidates(q) }
  @Get('profile-candidates') profileCandidates(@Query('q') q = ''): Promise<unknown> { return this.service.profileCandidates(q) }
  @Get('characters') characters(): Promise<unknown> { return this.service.listCharacters() }
  @Get('internal/characters') internalCharacters(@Headers('x-pf2-wiki-key') key = ''): Promise<unknown> { this.requireWikiInternalKey(key); return this.service.listAllCharacters() }
  @Get('players') players(): Promise<unknown> { return this.service.listPlayers() }
  @Get('contacts/:contactNpcId/players') contactPlayers(@Param('contactNpcId') contactNpcId: string): Promise<unknown> { return this.service.contactPlayers(contactNpcId) }
  @Post('contacts/:contactNpcId/players/:playerNpcId') async addContact(@Param('contactNpcId') contactNpcId: string, @Param('playerNpcId') playerNpcId: string): Promise<{ saved: true }> { await this.service.setPlayerContact(playerNpcId, contactNpcId, true); return { saved: true } }
  @Delete('contacts/:contactNpcId/players/:playerNpcId') async removeContact(@Param('contactNpcId') contactNpcId: string, @Param('playerNpcId') playerNpcId: string): Promise<{ removed: true }> { await this.service.setPlayerContact(playerNpcId, contactNpcId, false); return { removed: true } }
  @Get('me') me(@Query('wikiUsername') wikiUsername = '', @Headers('x-pf2-wiki-key') key = ''): Promise<unknown> { this.requireWikiInternalKey(key); return this.service.myCharacters(wikiUsername) }
  @Post('me/background') updateMyBackground(@Body() body: { wikiUsername?: unknown; npcId?: unknown; content?: unknown }, @Headers('x-pf2-wiki-key') key = ''): Promise<unknown> { this.requireWikiInternalKey(key); return this.service.updateMyBackground(typeof body.wikiUsername === 'string' ? body.wikiUsername : '', typeof body.npcId === 'string' ? body.npcId : '', body.content) }
  @Delete('mj-pnj/:npcId') async deleteMjPnj(@Param('npcId') id: string): Promise<{ deleted: true }> { await this.service.deleteMjPnj(id); return { deleted: true } }
  @Get('characters/:npcId') character(@Param('npcId') id: string): Promise<unknown> { return this.service.character(id) }
  @Post('characters') createCharacter(@Body() body: { npcId: string; displayName: string; wikiPageTitle: string; wikiPortraitFilename?: string | null; shortDescription?: string; isPlayer?: boolean; published?: boolean }): Promise<unknown> { return this.service.createCharacter(body) }
  @Patch('characters/:npcId') updateCharacter(@Param('npcId') id: string, @Body() body: { displayName?: unknown; wikiPortraitFilename?: unknown; shortDescription?: unknown; isPlayer?: unknown; published?: unknown }): Promise<unknown> { return this.service.updateCharacter(id, body) }
  @Delete('characters/:npcId') async deleteCharacter(@Param('npcId') id: string): Promise<{ deleted: true }> { await this.service.deleteCharacter(id); return { deleted: true } }
  @Post('characters/:npcId/factions') addFaction(@Param('npcId') id: string, @Body() body: { factionId?: string }, @Query('factionId') factionId = ''): Promise<unknown> { return this.service.addCharacterFaction(id, factionId || body.factionId || '') }
  @Delete('characters/:npcId/factions/:factionId') async removeFaction(@Param('npcId') id: string, @Param('factionId') faction: string): Promise<{ removed: true }> { await this.service.removeCharacterFaction(id, faction); return { removed: true } }
  @Get('factions') factions(): Promise<unknown> { return this.service.listFactions() }
  @Get('internal/factions') internalFactions(@Headers('x-pf2-wiki-key') key = ''): Promise<unknown> { this.requireWikiInternalKey(key); return this.service.listAllPlayerFactions() }
  @Get('internal/mj-factions') internalMjFactions(@Headers('x-pf2-wiki-key') key = ''): Promise<unknown> { this.requireWikiInternalKey(key); return this.service.factionCandidates(false) }
  @Post('internal/factions') createFaction(@Body() body: { name?: unknown; description?: unknown; parentFactionId?: unknown }, @Headers('x-pf2-wiki-key') key = ''): Promise<unknown> { this.requireWikiInternalKey(key); return this.service.createPlayerFaction({ ...body, published: true }) }
  @Patch('internal/factions/:id') updateFaction(@Param('id') id: string, @Body() body: { name?: unknown; description?: unknown; parentFactionId?: unknown }, @Headers('x-pf2-wiki-key') key = ''): Promise<unknown> { this.requireWikiInternalKey(key); return this.service.updatePlayerFaction(id, body) }
  @Post('internal/factions/:id/associate/:mjFactionId') associateFaction(@Param('id') id: string, @Param('mjFactionId') mjFactionId: string, @Headers('x-pf2-wiki-key') key = ''): Promise<unknown> { this.requireWikiInternalKey(key); return this.service.associateFaction(id, mjFactionId) }

  private requireWikiInternalKey(suppliedKey: string): void {
    const expectedKey = process.env['PF2_WIKI_LOGIN_INTERNAL_KEY'] ?? process.env['PF2_JOURNALS_INTERNAL_KEY'] ?? ''
    if (!expectedKey || suppliedKey !== expectedKey) throw new UnauthorizedException('Accès interne refusé.')
  }
}
