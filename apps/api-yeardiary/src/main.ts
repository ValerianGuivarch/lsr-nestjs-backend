import { AppYearDiaryModule } from 'yeardiary'
import { bootstrapApi, registerReverseProxy } from 'shared'
import { MigrationsProvider } from 'yeardiary'

async function bootstrap(): Promise<void> {
  await bootstrapApi({
    rootModule: AppYearDiaryModule,
    appName: 'YearDiary',
    swaggerTag: 'YearDiary',
    swaggerPath: 'api/diaries',
    portEnvKey: 'YEARDIARY_PORT',
    beforeListen: async app => {
      await app.get(MigrationsProvider).runMigrations()
      registerReverseProxy(app, [
        {
          sourcePrefix: '/api/v1',
          excludePrefixes: ['/api/v1/diaries'],
          targetOrigin: process.env['API_MAIN_ORIGIN'] ?? 'http://127.0.0.1:8081'
        }
      ])
    }
  })
}

bootstrap().then(() => console.log('YearDiary Nx application started'))
