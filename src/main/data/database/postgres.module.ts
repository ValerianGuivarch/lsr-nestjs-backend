import { DBApotheose } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/apotheoses/DBApotheose'
import { DBApotheoseProvider } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/apotheoses/DBApotheoseProvider'
import { DBBloodline } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/bloodlines/DBBloodline'
import { DBBloodlineProvider } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/bloodlines/DBBloodlineProvider'
import { DBCharacter } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/character/DBCharacter'
import { DBCharacterProvider } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/character/DBCharacterProvider'
import { DBCharacterTemplate } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/character/DBCharacterTemplate'
import { DBClasse } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/classes/DBClasse'
import { DBClasseProvider } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/classes/DBClasseProvider'
import { DBEntry } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/entries/DBEntry'
import { DBProficiency } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/proficiencies/DBProficiency'
import { DBProficiencyProvider } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/proficiencies/DBProficiencyProvider'
import { DBRoll } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/rolls/DBRoll'
import { DBRollProvider } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/rolls/DBRollProvider'
import { DBSession } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/session/DBSession'
import { DBSessionProvider } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/session/DBSessionProvider'
import { DBSkill } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/skills/DBSkill'
import { DBSkillProvider } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/database/skills/DBSkillProvider'
import { DBFlip } from '../../../../libs/hp/src/lib/backend/infrastructure/persistence/flip.db'
import { FlipImplementation } from '../../../../libs/hp/src/lib/backend/infrastructure/persistence/flip.implementation'
import { DBHouse } from '../../../../libs/hp/src/lib/backend/infrastructure/persistence/house.db'
import { DBKnowledge } from '../../../../libs/hp/src/lib/backend/infrastructure/persistence/knowledge.db'
import { KnowledgeImplementation } from '../../../../libs/hp/src/lib/backend/infrastructure/persistence/knowledge.implementation'
import { DBSpell } from '../../../../libs/hp/src/lib/backend/infrastructure/persistence/spell.db'
import { DBStat } from '../../../../libs/hp/src/lib/backend/infrastructure/persistence/stat.db'
import { StatImplementation } from '../../../../libs/hp/src/lib/backend/infrastructure/persistence/stat.implementation'
import { DBWizardKnowledge } from '../../../../libs/hp/src/lib/backend/infrastructure/persistence/wizard-knowledge.db'
import { DBWizardSpell } from '../../../../libs/hp/src/lib/backend/infrastructure/persistence/wizard-spell.db'
import { DBWizardStat } from '../../../../libs/hp/src/lib/backend/infrastructure/persistence/wizard-stat.db'
import { DBWizard } from '../../../../libs/hp/src/lib/backend/infrastructure/persistence/wizard.db'
import { WizardImplementation } from '../../../../libs/hp/src/lib/backend/infrastructure/persistence/wizard.implementation'
import { DBConstellation } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/elena/DBConstellation'
import { DBConstellationProvider } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/elena/DBConstellationProvider'
import { DBEvent } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/elena/DBEvent'
import { DBJoueuse } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/elena/DBJoueuse'
import { DBJoueuseProvider } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/elena/DBJoueuseProvider'
import { DBMessage } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/elena/DBMessage'
import { DBMessageProvider } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/elena/DBMessageProvider'
import { DBModelMessage } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/elena/DBModelMessage'
import { DBModelMessageProvider } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/elena/DBModelMessageProvider'
import { DBScenario } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/elena/DBScenario'
import { DBScenarioProvider } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/elena/DBScenarioProvider'
import { FBNotificationProvider } from '../../../../libs/l7r/src/lib/backend/infrastructure/persistence/elena/FBNotificationProvider'
import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

@Global()
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
        DBEvent,
        DBWizard,
        DBSpell,
        DBWizardSpell,
        DBStat,
        DBWizardStat,
        DBKnowledge,
        DBHouse,
        DBWizardKnowledge,
        DBFlip
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
    },
    {
      provide: 'IWizardProvider',
      useClass: WizardImplementation
    },
    {
      provide: 'IKnowledgeProvider',
      useClass: KnowledgeImplementation
    },
    {
      provide: 'IStatProvider',
      useClass: StatImplementation
    },
    {
      provide: 'IFlipProvider',
      useClass: FlipImplementation
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
    },

    {
      provide: 'IWizardProvider',
      useClass: WizardImplementation
    },
    {
      provide: 'IKnowledgeProvider',
      useClass: KnowledgeImplementation
    },
    {
      provide: 'IStatProvider',
      useClass: StatImplementation
    },
    {
      provide: 'IFlipProvider',
      useClass: FlipImplementation
    }
  ]
})
export class PostgresModule {}
