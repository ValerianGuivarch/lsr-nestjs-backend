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

      // Expose /music as static
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const express = require('express')
      const path = require('path')
      app.use('/music', express.static(path.join(process.cwd(), 'music')))

      // Store actual port for display
      global.ACTUAL_SERVER_PORT = port
    }
  })
}

function printStartupInfo(): void {
  const enableHp = envEnabled('ENABLE_HP', true)
  const enableL7r = envEnabled('ENABLE_L7R', true)
  const enableJdr = envEnabled('ENABLE_JDR', true)
  const enableGhost = envEnabled('ENABLE_GHOST', true)
  const enableYearDiary = envEnabled('ENABLE_YEARDIARY', true)
  
  const backendPort = (global as any).ACTUAL_SERVER_PORT ?? process.env.PORT ?? 8081
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'

  console.log('\n\n========================================')
  console.log('   Unified Application Started')
  console.log('========================================\n')

  if (enableHp) console.log(`  ✓ HP       → ${frontendUrl}/hp/dashboard`)
  if (enableL7r) console.log(`  ✓ L7R      → ${frontendUrl}/l7r/dashboard`)
  if (enableJdr) console.log(`  ✓ JDR      → ${frontendUrl}/jdr/dashboard`)
  if (enableGhost) console.log(`  ✓ Ghost    → ${frontendUrl}/ghost/dashboard`)
  if (enableYearDiary) console.log(`  ✓ YearDiary → ${frontendUrl}/yeardiary/dashboard`)

  console.log(`\n  Backend API : http://localhost:${backendPort}`)
  console.log('\n========================================\n')
}

bootstrap().then(() => printStartupInfo())
