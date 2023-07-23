import config from './config/configuration'
import { DBCharacterProvider } from './data/database/character/DBCharacterProvider'
import { PostgresModule } from './data/database/postgres.module'
import { DBRollProvider } from './data/database/rolls/DBRollProvider'
import { DBSessionProvider } from './data/database/session/DBSessionProvider'
import { JwtTokenProvider } from './data/security/JwtTokenProvider'
import { AccountService } from './domain/services/account/AccountService'
import { AuthenticationService } from './domain/services/auth/AuthenticationService'
import { CharacterService } from './domain/services/CharacterService'
import { MjService } from './domain/services/MjService'
import { RollService } from './domain/services/RollService'
import { AccountController } from './web/http/api/v1/account/AccountController'
import { AdminAccountController } from './web/http/api/v1/admin/account/AdminAccountController'
import { AdminAuthenticationController } from './web/http/api/v1/admin/auth/AdminAuthenticationController'
import { AuthenticationController } from './web/http/api/v1/auth/AuthenticationController'
import { CharacterController } from './web/http/api/v1/characters/CharacterController'
import { CharacterGateway } from './web/websocket/api/v1/characters/CharacterGateway'
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
  controllers: [
    AuthenticationController,
    AccountController,
    AdminAccountController,
    AdminAuthenticationController,
    CharacterController
  ],
  providers: [
    AuthenticationService,
    AccountService,
    CharacterService,
    RollService,
    MjService,
    JwtService,
    CharacterGateway,
    {
      provide: 'ITokenProvider',
      useClass: JwtTokenProvider
    },
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
