import { bootstrapApi } from '../../libs/shared/src/lib/backend/bootstrap-api'
import { AppModule as AppYearDiaryModule } from '../../libs/yeardiary/src/lib/backend/app.module'

async function bootstrap(): Promise<void> {
  await bootstrapApi({
    rootModule: AppYearDiaryModule,
    appName: 'YearDiary',
    swaggerTag: 'YearDiary',
    swaggerPath: 'api/diaries',
    portEnvKey: 'YEARDIARY_PORT'
  })
}

bootstrap().then(() => console.log('YearDiary application started'))
