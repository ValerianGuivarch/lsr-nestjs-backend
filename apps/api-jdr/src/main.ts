import { JdrModule } from 'jdr'
import { bootstrapApi } from 'shared'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { FoundryRelayModule } from './foundry/FoundryRelayModule'
import { Pf2MjModule } from './pf2-mj/Pf2MjModule'
import { HealthModule } from './health/HealthModule'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // eslint-disable-next-line no-process-env
      load: [() => ({ http: { host: process.env['HOST'] ?? '0.0.0.0', port: Number(process.env['JDR_PORT'] ?? 3003) } })]
    }),
    JdrModule,
    Pf2MjModule,
    HealthModule,
    FoundryRelayModule
  ]
})
class ApiModule {}

async function bootstrap(): Promise<void> {
  await bootstrapApi({
    rootModule: ApiModule,
    appName: 'JdR',
    swaggerTag: 'JdR',
    swaggerPath: 'api/jdr',
    portEnvKey: 'JDR_PORT'
  })
}

bootstrap().then(() => console.log('JdR application started'))
