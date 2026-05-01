import { AppHpModule } from 'hp'
import { bootstrapApi } from 'shared'

async function bootstrap(): Promise<void> {
  await bootstrapApi({
    rootModule: AppHpModule,
    appName: 'HP',
    swaggerTag: 'HP',
    swaggerPath: 'api/hp',
    portEnvKey: 'HP_PORT'
  })
}

bootstrap().then(() => console.log('HP Nx application started'))
