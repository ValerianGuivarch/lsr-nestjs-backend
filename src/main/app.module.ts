import config from './config/configuration'
import { DBCharacterProvider } from './data/database/character/DBCharacterProvider'
import { PostgresModule } from './data/database/postgres.module'
import { DBRollProvider } from './data/database/rolls/DBRollProvider'
import { DBSessionProvider } from './data/database/session/DBSessionProvider'
import { CharacterService } from './domain/services/CharacterService'
import { MjService } from './domain/services/MjService'
import { RollService } from './domain/services/RollService'
import { CharacterController } from './web/http/api/v1/characters/CharacterController'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config]
    }),
    TypeOrmModule.forRoot({
      name: 'postgres',
      type: 'postgres',
      // eslint-disable-next-line no-process-env
      host: config().postgres.host,
      // eslint-disable-next-line no-process-env,no-magic-numbers
      port: config().postgres.port,
      // eslint-disable-next-line no-process-env
      username: config().postgres.username,
      // eslint-disable-next-line no-process-env
      password: config().postgres.password,
      database: config().postgres.database,
      autoLoadEntities: config().postgres.autoLoadEntities,
      synchronize: config().postgres.synchronize
    }),
    PostgresModule
  ],
  controllers: [CharacterController],
  providers: [
    CharacterService,
    RollService,
    MjService,
    JwtService,
    //    CharacterGateway,
    {
      provide: 'ICharacterProvider',
      useClass: DBCharacterProvider
    },
    {
      provide: 'IRollProvider',
      useClass: DBRollProvider
    },
    {
      provide: 'ISessionProvider',
      useClass: DBSessionProvider
    }
  ]
})
export class AppModule {}
