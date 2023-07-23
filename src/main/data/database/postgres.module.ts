import { DBAccount } from './account/DBAccount'
import { DBAccountProvider } from './account/DBAccountProvider'
import { DBAuthentication } from './authentication/DBAuthentication'
import { DBAuthenticationProvider } from './authentication/DBAuthenticationProvider'
import { DBCharacter } from './character/DBCharacter'
import { DBCharacterProvider } from './character/DBCharacterProvider'
import { DBEntity } from './DBEntity'
import { DBProfile } from './profile/DBProfile'
import { DBProfileProvider } from './profile/DBProfileProvider'
import { DBRoll } from './rolls/DBRoll'
import { DBRollProvider } from './rolls/DBRollProvider'
import { DBSession } from './session/DBSession'
import { DBSessionProvider } from './session/DBSessionProvider'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [DBAccount, DBProfile, DBEntity, DBAuthentication, DBRoll, DBSession, DBCharacter],
      'postgres'
    )
  ],
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
    },
    {
      provide: 'IRollProvider',
      useClass: DBRollProvider
    },
    {
      provide: 'ISessionProvider',
      useClass: DBSessionProvider
    },
    {
      provide: 'ICharacterProvider',
      useClass: DBCharacterProvider
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
    },
    {
      provide: 'IRollProvider',
      useClass: DBRollProvider
    },
    {
      provide: 'ISessionProvider',
      useClass: DBSessionProvider
    },
    {
      provide: 'ICharacterProvider',
      useClass: DBCharacterProvider
    }
  ]
})
export class PostgresModule {}
