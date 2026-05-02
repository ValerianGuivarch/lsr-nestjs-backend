import { AppYearDiaryModule } from 'yeardiary'
import { bootstrapApi } from 'shared'

async function bootstrap(): Promise<void> {
  await bootstrapApi({
    rootModule: AppYearDiaryModule,
    appName: 'YearDiary',
    swaggerTag: 'YearDiary',
    swaggerPath: 'api/diaries',
    portEnvKey: 'YEARDIARY_PORT'
  })
}

bootstrap().then(() => console.log('YearDiary Nx application started'))
