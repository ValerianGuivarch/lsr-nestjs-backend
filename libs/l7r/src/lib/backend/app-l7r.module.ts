import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PostgresModule } from './infrastructure/persistence/database/postgres.module'
import configuration from './config/configuration'
import { L7rModule } from './l7r.module'

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
      migrationsRun: true
    }),
    PostgresModule,
    L7rModule
  ]
})
export class AppL7rModule {}