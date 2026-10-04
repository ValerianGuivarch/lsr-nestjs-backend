import { Controller, Get, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../auth/auth.guard'

@Controller()
export class RecalboxController {
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
}
