import { DBBloodline } from './bloodlines/DBBloodline'
import { DBBloodlineProvider } from './bloodlines/DBBloodlineProvider'
import { DBCharacter } from './character/DBCharacter'
import { DBCharacterProvider } from './character/DBCharacterProvider'
import { DBClasse } from './classes/DBClasse'
import { DBClasseProvider } from './classes/DBClasseProvider'
import { DBEntity } from './DBEntity'
import { DBRoll } from './rolls/DBRoll'
import { DBRollProvider } from './rolls/DBRollProvider'
import { DBSession } from './session/DBSession'
import { DBSessionProvider } from './session/DBSessionProvider'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [TypeOrmModule.forFeature([DBEntity, DBRoll, DBSession, DBCharacter, DBBloodline, DBClasse], 'postgres')],
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
    },
    {
      provide: 'IBloodlineProvider',
      useClass: DBBloodlineProvider
    },
    {
      provide: 'IClassProvider',
      useClass: DBClasseProvider
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
    },
    {
      provide: 'IBloodlineProvider',
      useClass: DBBloodlineProvider
    },
    {
      provide: 'IClassProvider',
      useClass: DBClasseProvider
    }
  ]
})
export class PostgresModule {}
