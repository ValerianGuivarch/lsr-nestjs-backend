import { AppGhostModule } from './app-ghost.module'
import { bootstrapApi } from '../../libs/shared/src/lib/backend/bootstrap-api'

async function bootstrap(): Promise<void> {
  await bootstrapApi({
    rootModule: AppGhostModule,
    appName: 'Ghost',
    swaggerTag: 'Ghost',
    swaggerPath: 'api/ghost',
    portEnvKey: 'GHOST_PORT'
  })
}

bootstrap().then(() => console.log('Ghost application started'))
