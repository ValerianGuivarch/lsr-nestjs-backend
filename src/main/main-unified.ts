import { AppUnifiedModule } from './app-unified.module'
import { bootstrapApi, registerReverseProxy } from '../../libs/shared/src/lib/backend/bootstrap-api'
import { ConfigService } from '@nestjs/config'

function envEnabled(key: string, defaultValue: boolean): boolean {
  const raw = process.env[key]

  if (raw === undefined) {
    return defaultValue
  }

  const normalized = raw.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

async function bootstrap(): Promise<void> {
  await bootstrapApi({
    rootModule: AppUnifiedModule,
    appName: 'Unified',
    swaggerTag: 'Unified',
    swaggerPath: 'api/unified',
    portEnvKey: 'PORT',
    beforeListen: app => {
      const configService = app.get(ConfigService)
      const port = configService.get<number>('PORT') ?? configService.get<number>('http.port') ?? 8081
      const targetOrigin = `http://127.0.0.1:${port}`

      registerReverseProxy(app, [
        { sourcePrefix: '/api/hp', targetPrefix: '/api/v1/hp', targetOrigin },
        { sourcePrefix: '/api/l7r', targetPrefix: '/api/v1', targetOrigin },
        { sourcePrefix: '/api/jdr', targetPrefix: '/api/v1/jdr', targetOrigin },
        { sourcePrefix: '/api/yeardiary', targetPrefix: '/api/v1/diaries', targetOrigin },
        { sourcePrefix: '/api/ghost', targetPrefix: '/api', targetOrigin }
      ])
    }
  })
}

function printStartupInfo(): void {
  const enableHp = envEnabled('ENABLE_HP', true)
  const enableL7r = envEnabled('ENABLE_L7R', true)
  const enableJdr = envEnabled('ENABLE_JDR', true)
  const enableGhost = envEnabled('ENABLE_GHOST', true)
  const enableYearDiary = envEnabled('ENABLE_YEARDIARY', true)

  console.log('\n\n========================================')
  console.log('   Unified Application Started')
  console.log('========================================\n')

  if (enableHp) console.log('  ✓ HP       → http://localhost:4200/hp/dashboard')
  if (enableL7r) console.log('  ✓ L7R      → http://localhost:4200/l7r/dashboard')
  if (enableJdr) console.log('  ✓ JDR      → http://localhost:4200/jdr/dashboard')
  if (enableGhost) console.log('  ✓ Ghost    → http://localhost:4200/ghost/dashboard')
  if (enableYearDiary) console.log('  ✓ YearDiary → http://localhost:4200/yeardiary/dashboard')

  console.log('\n  Shell Frontend: http://localhost:4200')
  console.log('\n========================================\n')
}

bootstrap().then(() => printStartupInfo())
