import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import configuration from './config/configuration'
import { JdrModule } from './jdr.module'

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
      poolSize: 8
    }),
    JdrModule
  ]
})
export class AppJdrModule {}
