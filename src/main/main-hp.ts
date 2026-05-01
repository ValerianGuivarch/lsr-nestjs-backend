import { AppHpModule } from './app-hp.module'
import { bootstrapApi } from '../../libs/shared/src/lib/backend/bootstrap-api'

async function bootstrap(): Promise<void> {
  await bootstrapApi({
    rootModule: AppHpModule,
    appName: 'HP',
    swaggerTag: 'HP',
    swaggerPath: 'api/hp',
    portEnvKey: 'HP_PORT'
  })
}

bootstrap().then(() => console.log('HP application started'))
