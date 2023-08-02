import { DBCharacter } from './character/DBCharacter'
import { DBCharacterProvider } from './character/DBCharacterProvider'
import { DBEntity } from './DBEntity'
import { DBRoll } from './rolls/DBRoll'
import { DBRollProvider } from './rolls/DBRollProvider'
import { DBSession } from './session/DBSession'
import { DBSessionProvider } from './session/DBSessionProvider'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [TypeOrmModule.forFeature([DBEntity, DBRoll, DBSession, DBCharacter], 'postgres')],
  providers: [
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
