import config from './config/configuration'
import { PostgresModule } from './data/database/postgres.module'
import { PrismicModule } from './data/prismic/prismic.module'
import { JwtTokenProvider } from './data/security/JwtTokenProvider'
import { TwilioProvider } from './data/twilio/TwilioProvider'
import { AccountService } from './domain/services/account/AccountService'
import { AuthenticationService } from './domain/services/auth/AuthenticationService'
import { HomePageService } from './domain/services/home_page/HomePageService'
import { AccountController } from './web/http/api/v1/account/AccountController'
import { AdminAccountController } from './web/http/api/v1/admin/account/AdminAccountController'
import { AdminAuthenticationController } from './web/http/api/v1/admin/auth/AdminAuthenticationController'
import { AuthenticationController } from './web/http/api/v1/auth/AuthenticationController'
import { HomePageController } from './web/http/api/v1/home_page/HomePageController'
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
    PostgresModule,
    PrismicModule
  ],
  controllers: [
    AuthenticationController,
    AccountController,
    AdminAccountController,
    AdminAuthenticationController,
    HomePageController
  ],
  providers: [
    AuthenticationService,
    AccountService,
    JwtService,
    HomePageService,
    {
      provide: 'ISmsProvider',
      useClass: TwilioProvider
    },
    {
      provide: 'ITokenProvider',
      useClass: JwtTokenProvider
    }
  ]
})
export class AppModule {}
