import { DBApotheose } from './apotheoses/DBApotheose'
import { DBApotheoseProvider } from './apotheoses/DBApotheoseProvider'
import { DBBloodline } from './bloodlines/DBBloodline'
import { DBBloodlineProvider } from './bloodlines/DBBloodlineProvider'
import { DBCharacter } from './character/DBCharacter'
import { DBCharacterProvider } from './character/DBCharacterProvider'
import { DBCharacterTemplate } from './character/DBCharacterTemplate'
import { DBClasse } from './classes/DBClasse'
import { DBClasseProvider } from './classes/DBClasseProvider'
import { DBEntry } from './entries/DBEntry'
import { DBProficiency } from './proficiencies/DBProficiency'
import { DBProficiencyProvider } from './proficiencies/DBProficiencyProvider'
import { DBRoll } from './rolls/DBRoll'
import { DBRollProvider } from './rolls/DBRollProvider'
import { DBSession } from './session/DBSession'
import { DBSessionProvider } from './session/DBSessionProvider'
import { DBSkill } from './skills/DBSkill'
import { DBSkillProvider } from './skills/DBSkillProvider'
import { DBConstellation } from '../elena/DBConstellation'
import { DBConstellationProvider } from '../elena/DBConstellationProvider'
import { DBEvent } from '../elena/DBEvent'
import { DBJoueuse } from '../elena/DBJoueuse'
import { DBJoueuseProvider } from '../elena/DBJoueuseProvider'
import { DBMessage } from '../elena/DBMessage'
import { DBMessageProvider } from '../elena/DBMessageProvider'
import { DBModelMessage } from '../elena/DBModelMessage'
import { DBModelMessageProvider } from '../elena/DBModelMessageProvider'
import { DBScenario } from '../elena/DBScenario'
import { DBScenarioProvider } from '../elena/DBScenarioProvider'
import { FBNotificationProvider } from '../elena/FBNotificationProvider'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        DBApotheose,
        DBRoll,
        DBSession,
        DBCharacter,
        DBCharacterTemplate,
        DBBloodline,
        DBEntry,
        DBClasse,
        DBSkill,
        DBProficiency,
        DBJoueuse,
        DBScenario,
        DBMessage,
        DBModelMessage,
        DBConstellation,
        DBEvent
      ],
      'postgres'
    )
  ],
  providers: [
    {
      provide: 'IRollProvider',
      useClass: DBRollProvider
    },
    {
      provide: 'IApotheoseProvider',
      useClass: DBApotheoseProvider
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
    },
    {
      provide: 'IScenarioProvider',
      useClass: DBScenarioProvider
    },
    {
      provide: 'IConstellationProvider',
      useClass: DBConstellationProvider
    },
    {
      provide: 'IJoueuseProvider',
      useClass: DBJoueuseProvider
    },
    {
      provide: 'IMessageProvider',
      useClass: DBMessageProvider
    },
    {
      provide: 'IModelMessageProvider',
      useClass: DBModelMessageProvider
    },
    {
      provide: 'IProficiencyProvider',
      useClass: DBProficiencyProvider
    },
    {
      provide: 'INotificationProvider',
      useClass: FBNotificationProvider
    }
  ],
  exports: [
    TypeOrmModule,
    {
      provide: 'ISkillProvider',
      useClass: DBSkillProvider
    },
    {
      provide: 'IApotheoseProvider',
      useClass: DBApotheoseProvider
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
    },
    {
      provide: 'IScenarioProvider',
      useClass: DBScenarioProvider
    },
    {
      provide: 'IConstellationProvider',
      useClass: DBConstellationProvider
    },
    {
      provide: 'IJoueuseProvider',
      useClass: DBJoueuseProvider
    },
    {
      provide: 'IMessageProvider',
      useClass: DBMessageProvider
    },
    {
      provide: 'IModelMessageProvider',
      useClass: DBModelMessageProvider
    },
    {
      provide: 'IProficiencyProvider',
      useClass: DBProficiencyProvider
    },
    {
      provide: 'INotificationProvider',
      useClass: FBNotificationProvider
    }
  ]
})
export class PostgresModule {}
