import { AppPhasmoModule } from 'phasmo'
import { bootstrapApi } from 'shared'

async function bootstrap(): Promise<void> {
  await bootstrapApi({
    rootModule: AppPhasmoModule,
    appName: 'Phasmo',
    swaggerTag: 'Phasmo',
    swaggerPath: 'api/phasmo',
    portEnvKey: 'PHASMO_PORT'
  })
}

bootstrap().then(() => console.log('Phasmo Nx application started'))
