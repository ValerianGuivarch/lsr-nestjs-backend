import { Controller, Get } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

interface DashboardConfig {
  features: {
    l7r: boolean
    ghost: boolean
    pf2: boolean
    wedding: boolean
    jdr: boolean
    diary: boolean
  }
}

@Controller('api/config')
export class ConfigController {
  constructor(private configService: ConfigService) {}

  @Get('features')
  getFeatures(): DashboardConfig {
    return {
      features: {
        l7r: this.envEnabled('DISPLAY_L7R', false),
        ghost: this.envEnabled('DISPLAY_GHOST', false),
        pf2: true,
        wedding: this.envEnabled('DISPLAY_WEDDING', false),
        jdr: this.envEnabled('DISPLAY_JDR', false),
        diary: this.envEnabled('DISPLAY_DIARY', false)
      }
    }
  }

  private envEnabled(key: string, defaultValue: boolean): boolean {
    const raw = process.env[key]

    if (raw === undefined) {
      return defaultValue
    }

    const normalized = raw.trim().toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
  }
}
