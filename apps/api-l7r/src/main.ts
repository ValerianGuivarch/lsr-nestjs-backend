import { AppL7rModule } from 'l7r'
import { bootstrapApi } from 'shared'

async function bootstrap(): Promise<void> {
  await bootstrapApi({
    rootModule: AppL7rModule,
    appName: 'L7R',
    swaggerTag: 'L7R',
    swaggerPath: 'api/l7r',
    portEnvKey: 'L7R_PORT'
  })
}

bootstrap().then(() => console.log('L7R Nx application started'))
