import { AppModule } from './app.module'
import { bootstrapApi } from 'shared'
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
    }
  })
}
bootstrap().then(() => console.log('Application started'))
