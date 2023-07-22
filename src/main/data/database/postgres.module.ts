import { DBAccount } from './account/DBAccount'
import { DBAccountProvider } from './account/DBAccountProvider'
import { DBAuthentication } from './authentication/DBAuthentication'
import { DBAuthenticationProvider } from './authentication/DBAuthenticationProvider'
import { DBEntity } from './DBEntity'
import { DBProfile } from './profile/DBProfile'
import { DBProfileProvider } from './profile/DBProfileProvider'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [TypeOrmModule.forFeature([DBAccount, DBProfile, DBEntity, DBAuthentication], 'postgres')],
  providers: [
    {
      provide: 'IAccountProvider',
      useClass: DBAccountProvider
    },
    {
      provide: 'IProfileProvider',
      useClass: DBProfileProvider
    },
    {
      provide: 'IAuthenticationProvider',
      useClass: DBAuthenticationProvider
    }
  ],
  exports: [
    TypeOrmModule,
    {
      provide: 'IAccountProvider',
      useClass: DBAccountProvider
    },
    {
      provide: 'IProfileProvider',
      useClass: DBProfileProvider
    },
    {
      provide: 'IAuthenticationProvider',
      useClass: DBAuthenticationProvider
    }
  ]
})
export class PostgresModule {}
