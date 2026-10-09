import { Body, Controller, Delete, Get, Patch, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../auth/auth.guard'
import { RecalboxService, UpdateGameMetadata } from './recalbox.service'

@Controller()
export class RecalboxController {
  constructor(private readonly recalbox: RecalboxService) {}

  @Get('health')
  health(): { status: 'ok' } {
    return { status: 'ok' }
  }

  @Get('recalbox/status')
  @UseGuards(AuthGuard)
  status(): {
    authenticated: true
    storageConfigured: boolean
    inboxConfigured: boolean
  } {
    return {
      authenticated: true,
      storageConfigured: Boolean(process.env['RECALBOX_SHARE_ROOT']),
      inboxConfigured: Boolean(process.env['RECALBOX_INBOX_ROOT'])
    }
  }

  @Get('recalbox/systems')
  @UseGuards(AuthGuard)
  systems() {
    return this.recalbox.systems()
  }

  @Get('recalbox/games')
  @UseGuards(AuthGuard)
  games(@Query('system') system: string) {
    return this.recalbox.games(system)
  }

  @Get('recalbox/game')
  @UseGuards(AuthGuard)
  metadata(@Query('system') system: string, @Query('path') path: string) {
    return this.recalbox.metadata(system, path)
  }

  @Patch('recalbox/game')
  @UseGuards(AuthGuard)
  updateMetadata(@Query('system') system: string, @Body() update: UpdateGameMetadata) {
    return this.recalbox.updateMetadata(system, update)
  }

  @Delete('recalbox/game')
  @UseGuards(AuthGuard)
  deleteGame(@Query('system') system: string, @Query('path') path: string) {
    return this.recalbox.deleteGame(system, path)
  }
}
