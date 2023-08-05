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
import { DBOwnedSkill } from './skills/DBOwnedSkill'
import { DBSkill } from './skills/DBSkill'
import { DBSkillProvider } from './skills/DBSkillProvider'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [DBEntity, DBRoll, DBSession, DBCharacter, DBBloodline, DBClasse, DBSkill, DBOwnedSkill],
      'postgres'
    )
  ],
  providers: [
    {
      provide: 'IRollProvider',
      useClass: DBRollProvider
    },
    {
      provide: 'ISkillProvider',
      useClass: DBSkillProvider
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
      provide: 'IClasseProvider',
      useClass: DBClasseProvider
    }
  ],
  exports: [
    TypeOrmModule,
    {
      provide: 'ISkillProvider',
      useClass: DBSkillProvider
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
    },
    {
      provide: 'IBloodlineProvider',
      useClass: DBBloodlineProvider
    },
    {
      provide: 'IClasseProvider',
      useClass: DBClasseProvider
    }
  ]
})
export class PostgresModule {}
