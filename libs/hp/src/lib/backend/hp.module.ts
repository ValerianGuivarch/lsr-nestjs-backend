import { FlipImplementation } from './infrastructure/persistence/flip.implementation'
import { HouseImplementation } from './infrastructure/persistence/house.implementation'
import { KnowledgeImplementation } from './infrastructure/persistence/knowledge.implementation'
import { SpellImplementation } from './infrastructure/persistence/spell.implementation'
import { StatImplementation } from './infrastructure/persistence/stat.implementation'
import { WizardImplementation } from './infrastructure/persistence/wizard.implementation'
import { FlipService } from './application/services/flip.service'
import { FlipWorkflowService } from './application/services/flip.workflow-service'
import { HouseService } from './application/services/house.service'
import { KnowledgeService } from './application/services/knowledge.service'
import { SpellService } from './application/services/spell.service'
import { StatService } from './application/services/stat.service'
import { WizardService } from './application/services/wizard.service'
import { FlipController } from './infrastructure/http/api/flips/flip.controller'
import { HouseController } from './infrastructure/http/api/houses/houses.controller'
import { KnowledgeController } from './infrastructure/http/api/knowledges/knowledges.controller'
import { SpellController } from './infrastructure/http/api/spells/spells.controller'
import { StatController } from './infrastructure/http/api/stats/stats.controller'
import { WizardController } from './infrastructure/http/api/wizards/wizard.controller'
import { PostgresModule } from './infrastructure/persistence/database/postgres.module'
import { Module } from '@nestjs/common'

@Module({
  imports: [PostgresModule],
  controllers: [WizardController, KnowledgeController, HouseController, SpellController, StatController, FlipController],
  providers: [
    WizardService,
    StatService,
    KnowledgeService,
    HouseService,
    FlipWorkflowService,
    SpellService,
    {
      provide: 'FlipService',
      useClass: FlipService
    },
    FlipService,
    {
      provide: 'WizardService',
      useClass: WizardService
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
      provide: 'IFlipProvider',
      useClass: FlipImplementation
    },
    {
      provide: 'IHouseProvider',
      useClass: HouseImplementation
    },
    {
      provide: 'IStatProvider',
      useClass: StatImplementation
    },
    {
      provide: 'ISpellProvider',
      useClass: SpellImplementation
    }
  ]
})
export class HpModule {}