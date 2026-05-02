import { AppYearDiaryModule } from 'yeardiary'
import { bootstrapApi } from 'shared'
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
    }
  })
}

bootstrap().then(() => console.log('YearDiary Nx application started'))
