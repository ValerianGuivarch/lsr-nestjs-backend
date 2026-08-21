import { Controller, Get } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

interface DashboardConfig {
  features: {
    pf2: boolean
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
        pf2: true,
        jdr: this.envEnabled('DISPLAY_JDR', true),
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
