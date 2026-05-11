import { AppGhostModule } from 'ghost'
import { bootstrapApi } from 'shared'

async function bootstrap(): Promise<void> {
  await bootstrapApi({
    rootModule: AppGhostModule,
    appName: 'Ghost',
    swaggerTag: 'Ghost',
    swaggerPath: 'api/ghost',
    portEnvKey: 'GHOST_PORT'
  })
}

bootstrap().then(() => console.log('Ghost Nx application started'))
