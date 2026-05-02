import { AppModule } from './app.module'
import { bootstrapApi, registerReverseProxy } from 'shared'
import { MigrationsProvider } from './data/database/migrations/MigrationsProvider'

async function bootstrap() {
  await bootstrapApi({
    rootModule: AppModule,
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
bootstrap().then(() => console.log('Application started'))
