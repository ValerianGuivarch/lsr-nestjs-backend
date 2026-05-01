import { PostgresModule } from './data/database/postgres.module'
import { HpModule } from './hp.module'
import { L7rModule } from './l7r.module'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import configuration from '../../libs/shared/src/lib/backend/configuration'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    TypeOrmModule.forRoot({
      name: 'postgres',
      type: 'postgres',
      host: configuration().postgres.host,
      port: configuration().postgres.port,
      username: configuration().postgres.username,
      password: configuration().postgres.password,
      database: configuration().postgres.database,
      autoLoadEntities: configuration().postgres.autoLoadEntities,
      synchronize: configuration().postgres.synchronize,
      poolSize: 8,
      migrationsRun: true // Exécute automatiquement les évolutions au démarrage de l'application
    }),
    PostgresModule,
    HpModule,
    L7rModule
  ]
})
export class AppModule {}
