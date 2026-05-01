import { DBApotheose } from '../../../../../src/main/data/database/apotheoses/DBApotheose'
import { DBApotheoseProvider } from '../../../../../src/main/data/database/apotheoses/DBApotheoseProvider'
import { DBBloodline } from '../../../../../src/main/data/database/bloodlines/DBBloodline'
import { DBBloodlineProvider } from '../../../../../src/main/data/database/bloodlines/DBBloodlineProvider'
import { DBCharacter } from '../../../../../src/main/data/database/character/DBCharacter'
import { DBCharacterProvider } from '../../../../../src/main/data/database/character/DBCharacterProvider'
import { DBCharacterTemplate } from '../../../../../src/main/data/database/character/DBCharacterTemplate'
import { DBClasse } from '../../../../../src/main/data/database/classes/DBClasse'
import { DBClasseProvider } from '../../../../../src/main/data/database/classes/DBClasseProvider'
import { DBEntry } from '../../../../../src/main/data/database/entries/DBEntry'
import { DBProficiency } from '../../../../../src/main/data/database/proficiencies/DBProficiency'
import { DBProficiencyProvider } from '../../../../../src/main/data/database/proficiencies/DBProficiencyProvider'
import { DBRoll } from '../../../../../src/main/data/database/rolls/DBRoll'
import { DBRollProvider } from '../../../../../src/main/data/database/rolls/DBRollProvider'
import { DBSession } from '../../../../../src/main/data/database/session/DBSession'
import { DBSessionProvider } from '../../../../../src/main/data/database/session/DBSessionProvider'
import { DBSkill } from '../../../../../src/main/data/database/skills/DBSkill'
import { DBSkillProvider } from '../../../../../src/main/data/database/skills/DBSkillProvider'
import { DBConstellation } from '../../../../../src/main/data/elena/DBConstellation'
import { DBConstellationProvider } from '../../../../../src/main/data/elena/DBConstellationProvider'
import { DBEvent } from '../../../../../src/main/data/elena/DBEvent'
import { DBJoueuse } from '../../../../../src/main/data/elena/DBJoueuse'
import { DBJoueuseProvider } from '../../../../../src/main/data/elena/DBJoueuseProvider'
import { DBMessage } from '../../../../../src/main/data/elena/DBMessage'
import { DBMessageProvider } from '../../../../../src/main/data/elena/DBMessageProvider'
import { DBModelMessage } from '../../../../../src/main/data/elena/DBModelMessage'
import { DBModelMessageProvider } from '../../../../../src/main/data/elena/DBModelMessageProvider'
import { DBScenario } from '../../../../../src/main/data/elena/DBScenario'
import { DBScenarioProvider } from '../../../../../src/main/data/elena/DBScenarioProvider'
import { FBNotificationProvider } from '../../../../../src/main/data/elena/FBNotificationProvider'
import { DBFlip } from '../../../../../src/main/hp/data/flip.db'
import { FlipImplementation } from '../../../../../src/main/hp/data/flip.implementation'
import { DBHouse } from '../../../../../src/main/hp/data/house.db'
import { DBKnowledge } from '../../../../../src/main/hp/data/knowledge.db'
import { KnowledgeImplementation } from '../../../../../src/main/hp/data/knowledge.implementation'
import { DBSpell } from '../../../../../src/main/hp/data/spell.db'
import { DBStat } from '../../../../../src/main/hp/data/stat.db'
import { StatImplementation } from '../../../../../src/main/hp/data/stat.implementation'
import { DBWizardKnowledge } from '../../../../../src/main/hp/data/wizard-knowledge.db'
import { DBWizardSpell } from '../../../../../src/main/hp/data/wizard-spell.db'
import { DBWizardStat } from '../../../../../src/main/hp/data/wizard-stat.db'
import { DBWizard } from '../../../../../src/main/hp/data/wizard.db'
import { WizardImplementation } from '../../../../../src/main/hp/data/wizard.implementation'
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