import { AppJdrModule } from 'jdr'
import { bootstrapApi } from 'shared'

async function bootstrap(): Promise<void> {
  await bootstrapApi({
    rootModule: AppJdrModule,
    appName: 'JdR',
    swaggerTag: 'JdR',
    swaggerPath: 'api/jdr',
    portEnvKey: 'JDR_PORT'
  })
}

bootstrap().then(() => console.log('JdR application started'))
