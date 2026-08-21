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

      // Frontends call /apil7r/... (mirrors the l7r.fr nginx rewrite) - proxy it to the real API routes
      // so the unified backend is also self-sufficient when nginx isn't in front of it (local prod testing).
      registerReverseProxy(app, [
        { sourcePrefix: '/apil7r/jdr', targetPrefix: '/api/v1/jdr', targetOrigin },
        { sourcePrefix: '/apil7r/v1/diaries', targetPrefix: '/api/v1/diaries', targetOrigin },
        { sourcePrefix: '/apil7r/config', targetPrefix: '/api/config', targetOrigin }
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
  const enableJdr = envEnabled('ENABLE_JDR', true)
  const enableYearDiary = envEnabled('ENABLE_YEARDIARY', true)
  
  const backendPort = (global as any).ACTUAL_SERVER_PORT ?? process.env.PORT ?? 8081
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'

  console.log('\n\n========================================')
  console.log('   Unified Application Started')
  console.log('========================================\n')

  if (enableJdr) console.log(`  ✓ JDR      → ${frontendUrl}/jdr`)
  console.log(`  ✓ PF2      → ${frontendUrl}/pf2`)
  if (enableYearDiary) console.log(`  ✓ YearDiary → ${frontendUrl}/diary`)

  console.log(`\n  Backend API : http://localhost:${backendPort}`)
  console.log('\n========================================\n')
}

bootstrap().then(() => printStartupInfo())
