import { AppModule } from './app.module'
import { bootstrapApi } from 'shared'

async function bootstrap() {
  await bootstrapApi({
    rootModule: AppModule,
    appName: 'YearDiary',
    swaggerTag: 'YearDiary',
    swaggerPath: 'api/diaries',
    portEnvKey: 'YEARDIARY_PORT'
  })
}
bootstrap().then(() => console.log('Application started'))
