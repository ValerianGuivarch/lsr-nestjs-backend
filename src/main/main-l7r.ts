import { AppL7rModule } from './app-l7r.module'
import { bootstrapApi } from '../../libs/shared/src/lib/backend/bootstrap-api'

async function bootstrap(): Promise<void> {
  await bootstrapApi({
    rootModule: AppL7rModule,
    appName: 'L7R',
    swaggerTag: 'L7R',
    swaggerPath: 'api/l7r',
    portEnvKey: 'L7R_PORT'
  })
}

bootstrap().then(() => console.log('L7R application started'))
