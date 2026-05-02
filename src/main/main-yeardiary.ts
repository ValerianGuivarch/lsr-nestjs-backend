import { bootstrapApi } from '../../libs/shared/src/lib/backend/bootstrap-api'
import { AppModule as AppYearDiaryModule } from '../../libs/yeardiary/src/lib/backend/app.module'
import { MigrationsProvider } from '../../libs/yeardiary/src/lib/backend/data/database/migrations/MigrationsProvider'

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

bootstrap().then(() => console.log('YearDiary application started'))
